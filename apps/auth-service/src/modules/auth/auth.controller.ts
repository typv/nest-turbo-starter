import {
  Public,
  SuccessResponseDto,
  SwaggerApiDocument,
  User,
  UserRequestPayload,
} from '@app/common';
import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RefreshToken } from 'src/decorators';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  LoginResponseDto,
  RefreshTokenResponseDto,
  ResetPasswordDto,
  SignUpDto,
  SignUpResponseDto,
  VerifyResetPasswordDto,
  VerifyResetPasswordResponseDto,
} from './dto';

@ApiTags('Auth')
@Controller('/')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @SwaggerApiDocument({
    response: { status: HttpStatus.OK, type: LoginResponseDto },
    body: { type: LoginDto, required: true },
    operation: {
      operationId: `login`,
      summary: `Api internalLogin`,
      description: `Internal login with email and password`,
    },
    extra: { isPublic: true },
  })
  async login(@Body() body: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(body);
  }

  @Post('sign-up')
  @Public()
  @SwaggerApiDocument({
    response: {
      status: HttpStatus.OK,
      type: SignUpResponseDto,
    },
    body: { type: SignUpDto, required: true },
    operation: {
      operationId: `signUp`,
      summary: `Api internalSignUp`,
      description: `Internal sign up with email and password`,
    },
    extra: { isPublic: true },
  })
  async signUp(@Body() body: SignUpDto): Promise<SignUpResponseDto> {
    return this.authService.signUp(body);
  }

  @Post('refresh-token')
  @RefreshToken()
  @ApiBearerAuth()
  @SwaggerApiDocument({
    response: {
      status: HttpStatus.OK,
      type: RefreshTokenResponseDto,
    },
    operation: {
      operationId: `refreshToken`,
      summary: `Api refreshToken`,
      description: `Put refresh token to header when access token expired`,
    },
  })
  async refreshToken(@User() userPayload: UserRequestPayload) {
    return this.authService.refreshToken(userPayload);
  }

  @Post('logout')
  @ApiBearerAuth()
  @SwaggerApiDocument({
    response: {
      status: HttpStatus.OK,
    },
    operation: {
      operationId: `logout`,
      summary: `Api logout`,
      description: `User logout`,
    },
  })
  async logout(@User() userPayload: UserRequestPayload): Promise<SuccessResponseDto> {
    return this.authService.logout(userPayload);
  }

  @Post('forgot-password')
  @Public()
  @SwaggerApiDocument({
    response: { type: SuccessResponseDto },
    body: { type: ForgotPasswordDto, required: true },
    operation: {
      operationId: `forgotPassword`,
      summary: `Api forgotPassword`,
      description: `Send reset password link to user`,
    },
  })
  async sendResetPasswordLink(
    @Body() body: ForgotPasswordDto,
  ): Promise<SuccessResponseDto> {
    return this.authService.sendResetPasswordLink(body);
  }

  @Post('forgot-password/verify')
  @Public()
  @SwaggerApiDocument({
    response: { type: VerifyResetPasswordResponseDto },
    body: { type: VerifyResetPasswordDto, required: true },
    operation: {
      operationId: `verifyResetPasswordLink`,
      summary: `Api verifyResetPasswordLink`,
      description: `Verify reset password link`,
    },
  })
  async verifyResetPasswordLink(
    @Body() body: VerifyResetPasswordDto,
  ): Promise<VerifyResetPasswordResponseDto> {
    return this.authService.verifyResetPasswordLink(body);
  }

  @Post('reset-password')
  @Public()
  @SwaggerApiDocument({
    response: { type: SuccessResponseDto },
    body: { type: ResetPasswordDto, required: true },
    operation: {
      operationId: `resetPassword`,
      summary: `Api resetPassword`,
      description: `Reset user password`,
    },
  })
  async resetPassword(@Body() body: ResetPasswordDto): Promise<SuccessResponseDto> {
    return this.authService.resetPassword(body);
  }

  @Post('change-password')
  @ApiBearerAuth()
  @SwaggerApiDocument({
    response: { type: SuccessResponseDto },
    body: { type: ChangePasswordDto, required: true },
    operation: {
      operationId: `changePassword`,
      summary: `Api changePassword`,
      description: `Manually change password`,
    },
  })
  async changePassword(
    @Body() body: ChangePasswordDto,
    @User() userPayload: UserRequestPayload,
  ): Promise<SuccessResponseDto> {
    return this.authService.changePassword(body, userPayload);
  }
}
