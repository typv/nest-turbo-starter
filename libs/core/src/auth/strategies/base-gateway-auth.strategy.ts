import {
  ERROR_RESPONSE,
  ServerException,
  TokenPayload,
  UserRequestPayload,
} from '@app/common';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { RedisService } from '../../redis';

@Injectable()
export abstract class BaseGatewayAuthStrategy extends PassportStrategy(
  Strategy,
  'gateway-auth',
) {
  constructor(protected readonly redisService: RedisService) {
    super();
  }

  async validate(req: Request): Promise<UserRequestPayload> {
    const { headers } = req;
    const authUserHeader = headers['x-auth-user'];
    if (!authUserHeader) throw new ServerException(ERROR_RESPONSE.UNAUTHORIZED);

    const authUser: TokenPayload = JSON.parse(authUserHeader);
    if (!authUser?.id) throw new ServerException(ERROR_RESPONSE.UNAUTHORIZED);

    // Check valid token in Redis
    const userTokenKey = this.redisService.getUserTokenKey(authUser.id, authUser.jti);
    const isTokenValid = await this.redisService.getValue<string>(userTokenKey);
    if (!isTokenValid) throw new ServerException(ERROR_RESPONSE.UNAUTHORIZED);

    return this.lookupAndValidateUser(authUser);
  }

  protected abstract lookupAndValidateUser(
    authUser: TokenPayload,
  ): Promise<UserRequestPayload>;
}
