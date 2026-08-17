import { codeExpiresConfiguration, jwtConfiguration } from '@app/common';
import {
  GoogleAuthModule,
  GrpcGatewayAuthStrategy,
  GrpcJwtAuthStrategy,
} from '@app/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RefreshTokenStrategy } from 'src/modules/auth/strategies';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [jwtConfiguration, codeExpiresConfiguration],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfiguration)],
      useFactory: async (jwtConfig: ConfigType<typeof jwtConfiguration>) => ({
        global: true,
        secret: jwtConfig.secret,
        signOptions: {
          algorithm: jwtConfig.algorithm,
        },
      }),
      inject: [jwtConfiguration.KEY],
    }),
    GoogleAuthModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GrpcJwtAuthStrategy,
    RefreshTokenStrategy,
    GrpcGatewayAuthStrategy,
  ],
})
export class AuthModule {}
