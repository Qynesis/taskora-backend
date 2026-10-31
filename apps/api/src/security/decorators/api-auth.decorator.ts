import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';

/**
 * Composite decorator that applies JWT authentication, role-based authorization,
 * and permission-based authorization. Also adds Swagger Bearer auth documentation.
 *
 * Guard execution order: JwtAuthGuard → RolesGuard → PermissionsGuard.
 * JwtAuthGuard MUST run first to attach the user to the request.
 *
 * Usage:
 *   @ApiAuth()
 *   @Roles(Role.ADMIN)
 *   @RequirePermissions(Permission.WRITE)
 *   @Post()
 *   create() { ... }
 */
export function ApiAuth() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard),
    ApiBearerAuth(),
  );
}
