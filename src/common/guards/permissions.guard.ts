import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission } from '../enums/permission.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[] | string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || (Array.isArray(requiredPermissions) && requiredPermissions.length === 0)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as any;
    if (!user) throw new UnauthorizedException('User not found on request');

    // admins (isAdmin true) bypass permission checks
    if (user.isAdmin) return true;

    // Use permissions provided on the request (populated by JwtStrategy). If absent,
    // treat as empty — admins already bypass checks above.
    const userPermissions: string[] = Array.isArray(user.permissions) ? user.permissions : [];

    const required = requiredPermissions as string[];
    const hasAll = required.every((p) => userPermissions.includes(p));
    if (!hasAll) {
      throw new ForbiddenException('You do not have permission. Please contact admin.');
    }

    return true;
  }
}
