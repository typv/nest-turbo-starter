import {
  AccountAction,
  APP_DEFAULTS,
  appCommonConfiguration,
  codeExpiresConfiguration,
  ERROR_RESPONSE,
  getTtlValue,
  hashData,
  jwtConfiguration,
  JwtTokenType,
  NotificationMessagePattern,
  Role,
  ServerException,
  UserMessagePattern,
  verifyHashed,
} from '@app/common';
import { TokenPayload, UserRequestPayload } from '@app/common';
import { BaseService, MicroserviceName, MS_INJECTION_TOKEN } from '@app/core';
import { GoogleAuthService } from '@app/core';
import { RedisService } from '@app/core';
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ClientProxy, Transport } from '@nestjs/microservices';
import { appConfiguration } from 'src/config';
import { v4 as uuidv4 } from 'uuid';
import {
  ChangePasswordBodyDto,
  ChangePasswordResponseDto,
  LoginBodyDto,
  LoginResponseDto,
  ResetPasswordBodyDto,
  ResetPasswordResponseDto,
  SendResetPasswordLinkBodyDto,
  SendResetPasswordResponseDto,
  SignUpBodyDto,
  VerifyResetPasswordLinkBodyDto,
  VerifyResetPasswordLinkResponseDto,
} from './dto';

@Injectable()
export class AuthService extends BaseService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly googleAuthService: GoogleAuthService,
    @Inject(appConfiguration.KEY)
    private readonly appConfig: ConfigType<typeof appConfiguration>,
    @Inject(appCommonConfiguration.KEY)
    private readonly appCommonConfig: ConfigType<typeof appCommonConfiguration>,
    @Inject(jwtConfiguration.KEY)
    private readonly jwtConfig: ConfigType<typeof jwtConfiguration>,
    @Inject(codeExpiresConfiguration.KEY)
    private readonly codeExpiresConfig: ConfigType<typeof codeExpiresConfiguration>,
    // @Inject(MS_INJECTION_TOKEN(MicroserviceName.UserService, Transport.KAFKA))
    // private readonly userClientKafka: ClientKafka,
    @Inject(MS_INJECTION_TOKEN(MicroserviceName.UserService, Transport.TCP))
    private readonly userClientTCP: ClientProxy,
    @Inject(MS_INJECTION_TOKEN(MicroserviceName.NotificationService, Transport.TCP))
    private readonly notificationClientTCP: ClientProxy,
  ) {
    super();
  }

  async onModuleInit() {
    // const replyTopics = [..._.values(UserMessagePattern)];
    // for (const topic of replyTopics) {
    //   this.userClientKafka.subscribeToResponseOf(topic);
    // }
    // await this.userClientKafka.connect();
  }

  async onModuleDestroy() {
    // await this.userClientKafka.close();
  }

  async login(body: LoginBodyDto): Promise<LoginResponseDto> {
    const { email, password } = body;
    const user = await this.msResponse(
      this.userClientTCP.send(UserMessagePattern.GET_USER, { email }),
    );
    if (!user?.password) throw new ServerException(ERROR_RESPONSE.INVALID_CREDENTIALS);
    if (!user.isActive) throw new ServerException(ERROR_RESPONSE.USER_DEACTIVATED);

    const isPasswordValid = await verifyHashed(password, user.password);
    if (!isPasswordValid) {
      throw new ServerException(ERROR_RESPONSE.INVALID_CREDENTIALS);
    }

    return this.manageUserToken(user);
  }

  async signUp(body: SignUpBodyDto) {
    const userData = {
      ...body,
      isActive: true,
      emailVerified: false,
      role: Role.Merchant,
    };
    const newUser = await this.msResponse(
      this.userClientTCP.send(UserMessagePattern.CREATE_USER, userData),
    );

    return this.manageUserToken(newUser);
  }

  async logout(userPayload: UserRequestPayload) {
    const { id, jti } = userPayload;

    const userTokenKey = this.redisService.getUserTokenKey(id, jti);
    await this.redisService.deleteKey(userTokenKey);

    return { success: true };
  }

  async refreshToken(userPayload: UserRequestPayload) {
    const accessToken = await this.generateToken(
      userPayload,
      JwtTokenType.AccessToken,
      this.jwtConfig.accessTokenExpiresIn,
    );

    return { accessToken };
  }

  async sendResetPasswordLink(
    body: SendResetPasswordLinkBodyDto,
  ): Promise<SendResetPasswordResponseDto> {
    const { email } = body;
    const user = await this.msResponse(
      this.userClientTCP.send(UserMessagePattern.GET_USER, { email }),
    );
    if (!user) throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);

    const attempts = await this.redisService.increaseResetAttempts(
      email,
      APP_DEFAULTS.RESET_PASSWORD_WINDOW_SECONDS,
    );

    if (attempts > APP_DEFAULTS.RESET_PASSWORD_MAX_ATTEMPTS) {
      const ttl = await this.redisService.getResetAttemptsTtl(email);
      throw new ServerException(ERROR_RESPONSE.MAXIMUM_EMAIL_RESEND);
    }

    const token = uuidv4();
    const tokenTtl = getTtlValue(this.codeExpiresConfig.resetPassword);
    const resetPasswordUrl =
      this.appCommonConfig.frontendUrl +
      '/redirect?email=' +
      encodeURIComponent(user.email) +
      '&token=' +
      token +
      '&action=' +
      AccountAction.ResetPassword;

    const success = await this.msResponse(
      this.notificationClientTCP.send(NotificationMessagePattern.FORGOT_PASSWORD, {
        email,
        name: user.fullName,
        resetPasswordUrl,
      }),
    );

    // Save token to redis
    await this.redisService.setValue<string>(
      this.redisService.getResetPasswordKey(user.id),
      token,
      tokenTtl,
    );
    return { success: true };
  }

  async verifyResetPasswordLink(
    body: VerifyResetPasswordLinkBodyDto,
  ): Promise<VerifyResetPasswordLinkResponseDto> {
    const { email, token } = body;
    const user = await this.msResponse(
      this.userClientTCP.send(UserMessagePattern.GET_USER, { email }),
    );
    if (!user) {
      throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);
    }

    const isValid = await this.isValidLink(user, token);
    return { isValid };
  }

  async resetPassword(body: ResetPasswordBodyDto): Promise<ResetPasswordResponseDto> {
    const { newPassword, email, token } = body;

    const user = await this.msResponse(
      this.userClientTCP.send(UserMessagePattern.GET_USER, { email }),
    );
    if (!user) {
      throw new ServerException(ERROR_RESPONSE.USER_NOT_FOUND);
    }

    const isValidLink = await this.isValidLink(user, token);
    if (!isValidLink) {
      throw new ServerException(ERROR_RESPONSE.LINK_EXPIRED);
    }

    const isSamePassword =
      user.password && (await verifyHashed(newPassword, user.password));
    if (isSamePassword) {
      throw new ServerException(ERROR_RESPONSE.PASSWORD_NOT_CHANGED);
    }

    const hashedPassword = await hashData(newPassword);
    const userData = {
      id: user.id,
      password: hashedPassword,
      passwordChangedAt: new Date(),
    };
    await this.msResponse(
      this.userClientTCP.send(UserMessagePattern.UPDATE_USER, userData),
    );

    // Update redis
    await this.redisService.deleteKey(this.redisService.getResetPasswordKey(user.id));

    await this.redisService.deleteByPattern(
      this.redisService.getUserTokenPattern(user.id),
    );

    return { success: true };
  }

  private async manageUserToken(user: any) {
    const jti = uuidv4();
    const tokenPayload = {
      id: user.id,
      jti,
      email: user.email,
      role: user.role,
      iss: this.jwtConfig.issuer,
      key: this.jwtConfig.issuer,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.generateToken(
        tokenPayload,
        JwtTokenType.AccessToken,
        this.jwtConfig.accessTokenExpiresIn,
      ),
      this.generateToken(
        tokenPayload,
        JwtTokenType.RefreshToken,
        this.jwtConfig.refreshTokenExpiresIn,
      ),
    ]);
    await this.redisService.setValue<string>(
      this.redisService.getUserTokenKey(user.id, jti),
      'deviceId',
      getTtlValue(this.jwtConfig.refreshTokenExpiresIn),
    );

    return { accessToken, refreshToken };
  }

  private async isValidLink(user: any, token: string): Promise<boolean> {
    const cacheKey = this.redisService.getResetPasswordKey(user.id);
    const cachedToken = await this.redisService.getValue<string>(cacheKey);
    return cachedToken === token;
  }

  private async generateToken(
    payload: Partial<TokenPayload>,
    type: JwtTokenType,
    expiresIn: number | string,
  ) {
    const tokenPayload: TokenPayload = {
      id: payload.id,
      email: payload.email,
      jti: payload.jti,
      iss: this.jwtConfig.issuer,
      key: this.jwtConfig.issuer,
      type,
      role: payload.role,
    };

    const options: Partial<JwtSignOptions> = {
      expiresIn: expiresIn,
    } as unknown as JwtSignOptions;

    return this.jwtService.signAsync(tokenPayload, options);
  }

  async changePassword(
    body: ChangePasswordBodyDto,
    userPayload: UserRequestPayload,
  ): Promise<ChangePasswordResponseDto> {
    const { currentPassword, newPassword } = body;
    const user = await this.msResponse(
      this.userClientTCP.send(UserMessagePattern.GET_USER, {
        email: userPayload.email,
      }),
    );
    if (!user) {
      throw new ServerException(ERROR_RESPONSE.INVALID_EMAIL);
    }

    const isRightPassword =
      user.password && (await verifyHashed(currentPassword, user.password));
    if (!isRightPassword) {
      throw new ServerException(ERROR_RESPONSE.INVALID_PASSWORD);
    }

    const isSamePassword =
      user.password && (await verifyHashed(newPassword, user.password));
    if (isSamePassword) {
      throw new ServerException(ERROR_RESPONSE.PASSWORD_NOT_CHANGED);
    }

    const hashedPassword = await hashData(newPassword);

    const userData = {
      id: user.id,
      password: hashedPassword,
      passwordChangedAt: new Date(),
    };
    await this.msResponse(
      this.userClientTCP.send(UserMessagePattern.UPDATE_USER, userData),
    );

    // Update redis
    await this.redisService.deleteKey(this.redisService.getResetPasswordKey(user.id));

    await this.redisService.deleteByPattern(
      this.redisService.getUserTokenPattern(user.id),
    );

    return { success: true };
  }
}
