import {
  ACCESS_ROLES_KEY,
  ERROR_RESPONSE,
  IS_PUBLIC_KEY,
  Role,
  ServerException,
  UserRequestPayload,
} from '@app/common';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RoleBasedAccessControlGuard extends AuthGuard('gateway-auth') {
  constructor(private reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  override handleRequest(
    err: any,
    user: UserRequestPayload,
    info: any,
    context: ExecutionContext,
  ): any {
    // Skip public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return user ?? true;
    }

    // Check if authorization is needed
    const allowedRoles = this.reflector.getAllAndOverride<Role[]>(ACCESS_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Check role-based access
    if (allowedRoles?.length && !allowedRoles.includes(user.role!)) {
      throw new ServerException(ERROR_RESPONSE.RESOURCE_FORBIDDEN);
    }

    return user;
  }
}
