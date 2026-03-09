import {
  ERROR_RESPONSE,
  ServerException,
  TokenPayload,
  UserRequestPayload,
} from '@app/common';
import { BaseGatewayAuthStrategy, RedisService } from '@app/core';
import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/data-access/user';

@Injectable()
export class GatewayAuthStrategy extends BaseGatewayAuthStrategy {
  constructor(
    redisService: RedisService,
    private readonly userRepo: UserRepository,
  ) {
    super(redisService);
  }

  protected async lookupAndValidateUser(
    authUser: TokenPayload,
  ): Promise<UserRequestPayload> {
    const user = await this.userRepo.findOne({ id: authUser.id });
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
