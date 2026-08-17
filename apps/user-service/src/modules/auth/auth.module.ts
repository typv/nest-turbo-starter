import { codeExpiresConfiguration, jwtConfiguration } from '@app/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthStrategy } from 'src/modules/auth/strategies';
import { GatewayAuthStrategy } from './strategies/gateway-auth.strategy';
import { User } from '../../data-access/user';

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
    MikroOrmModule.forFeature([User]),
    PassportModule,
  ],
  providers: [JwtAuthStrategy, GatewayAuthStrategy],
})
export class AuthModule {}
