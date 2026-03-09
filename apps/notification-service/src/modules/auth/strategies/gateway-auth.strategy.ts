import {
  ERROR_RESPONSE,
  ServerException,
  TokenPayload,
  UserMessagePattern,
  UserRequestPayload,
} from '@app/common';
import {
  BaseGatewayAuthStrategy,
  MicroserviceName,
  MS_INJECTION_TOKEN,
  RedisService,
} from '@app/core';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, Transport } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class GatewayAuthStrategy extends BaseGatewayAuthStrategy {
  constructor(
    redisService: RedisService,
    @Inject(MS_INJECTION_TOKEN(MicroserviceName.UserService, Transport.TCP))
    private readonly userClientTCP: ClientProxy,
  ) {
    super(redisService);
  }

  protected async lookupAndValidateUser(
    authUser: TokenPayload,
  ): Promise<UserRequestPayload> {
    const user = await lastValueFrom(
      this.userClientTCP.send(UserMessagePattern.GET_USER, { id: authUser.id }),
    );
    if (!user) throw new ServerException(ERROR_RESPONSE.UNAUTHORIZED);
    if (!user.isActive) throw new ServerException(ERROR_RESPONSE.USER_DEACTIVATED);

    return {
      id: user.id,
      jti: authUser.jti,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    };
  }
}
