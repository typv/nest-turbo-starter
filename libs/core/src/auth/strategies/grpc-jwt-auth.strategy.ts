import {
  ERROR_RESPONSE,
  jwtConfiguration,
  JwtTokenType,
  ServerException,
  UserGrpcService,
  UserRequestPayload,
} from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { MicroserviceName, MS_INJECTION_TOKEN } from '../../microservice';
import { callMicroservice } from '../../microservice/call-microservice';
import { RedisService } from '../../redis';

/**
 * Bearer-token auth for services that do not own the User entity; the user is
 * fetched from user-service.
 *
 * user-service must not use this — it has a repository-backed strategy and
 * would otherwise call itself over the network.
 */
@Injectable()
export class GrpcJwtAuthStrategy extends PassportStrategy(Strategy, 'jwt-auth') {
  constructor(
    private readonly redisService: RedisService,
    @Inject(jwtConfiguration.KEY)
    private readonly jwtConfig: ConfigType<typeof jwtConfiguration>,
    @Inject(MS_INJECTION_TOKEN(MicroserviceName.UserService, Transport.GRPC))
    private readonly userService: UserGrpcService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
  }

  async validate(payload: any): Promise<UserRequestPayload> {
    const { id, email, jti, type, role } = payload;
    if (type !== JwtTokenType.AccessToken)
      throw new ServerException(ERROR_RESPONSE.UNAUTHORIZED);

    const userTokenKey = this.redisService.getUserTokenKey(id, jti);
    const isTokenValid = await this.redisService.getValue<string>(userTokenKey);
    if (!isTokenValid) throw new ServerException(ERROR_RESPONSE.UNAUTHORIZED);

    const user = await callMicroservice(this.userService.getUser({ id }));
    if (!user) throw new ServerException(ERROR_RESPONSE.UNAUTHORIZED);
    if (!user.isActive) throw new ServerException(ERROR_RESPONSE.USER_DEACTIVATED);

    return {
      id,
      email,
      jti,
      role,
      emailVerified: true,
    };
  }
}
