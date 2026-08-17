import { codeExpiresConfiguration, jwtConfiguration } from '@app/common';
import { GrpcGatewayAuthStrategy, GrpcJwtAuthStrategy } from '@app/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

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
  ],
  controllers: [],
  // No RefreshTokenStrategy: this service exposes no refresh route.
  providers: [GrpcJwtAuthStrategy, GrpcGatewayAuthStrategy],
})
export class AuthModule {}
