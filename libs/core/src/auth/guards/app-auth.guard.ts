import { ERROR_RESPONSE, IS_PUBLIC_KEY, ServerException } from '@app/common';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AppAuthGuard extends AuthGuard('gateway-auth') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Allow public routes
    if (isPublic) {
      return true;
    }

    // Only validate token - no authorization logic
    const isGrand = await super.canActivate(context);
    return !!isGrand;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new ServerException(ERROR_RESPONSE.UNAUTHORIZED);
    }

    return user;
  }
}
