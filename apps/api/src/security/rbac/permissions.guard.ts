import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthenticatedUser } from '@app/shared-types';
import { Permission } from './permissions.enum';
import { Role } from './roles.enum';
import { ROLE_PERMISSIONS } from './role-permissions.map';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

/**
 * Checks that the authenticated user has the required permissions
 * based on their roles and the ROLE_PERMISSIONS map.
 *
 * Must always run AFTER JwtAuthGuard — the user must be attached
 * to the request before permissions can be checked.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any)['user'] as AuthenticatedUser | undefined;

    if (!user) {
      throw new ForbiddenException('No authenticated user found');
    }

    const userPermissions = this.resolvePermissions(user.roles as Role[]);

    // MANAGE is a wildcard permission — grants everything
    if (userPermissions.includes(Permission.MANAGE)) {
      return true;
    }

    const hasAll = requiredPermissions.every((perm) => userPermissions.includes(perm));
    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  private resolvePermissions(roles: Role[]): Permission[] {
    const permissions = new Set<Permission>();
    for (const role of roles) {
      const rolePerms = ROLE_PERMISSIONS[role];
      if (rolePerms) {
        rolePerms.forEach((p) => permissions.add(p));
      }
    }
    return Array.from(permissions);
  }
}
