import {
  ERROR_RESPONSE,
  ServerException,
  TokenPayload,
  UserGrpcService,
  UserRequestPayload,
} from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { BaseGatewayAuthStrategy } from './base-gateway-auth.strategy';
import { MicroserviceName, MS_INJECTION_TOKEN } from '../../microservice';
import { callMicroservice } from '../../microservice/call-microservice';
import { RedisService } from '../../redis';

/**
 * Gateway auth for services that do not own the User entity; the user is
 * fetched from user-service.
 *
 * user-service must not use this — it has a repository-backed strategy and
 * would otherwise call itself over the network.
 */
@Injectable()
export class GrpcGatewayAuthStrategy extends BaseGatewayAuthStrategy {
  constructor(
    redisService: RedisService,
    @Inject(MS_INJECTION_TOKEN(MicroserviceName.UserService, Transport.GRPC))
    private readonly userService: UserGrpcService,
  ) {
    super(redisService);
  }

  protected async lookupAndValidateUser(
    authUser: TokenPayload,
  ): Promise<UserRequestPayload> {
    const user = await callMicroservice(this.userService.getUser({ id: authUser.id }));
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
