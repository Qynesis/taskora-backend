import { Role } from './roles.enum';
import { Permission } from './permissions.enum';

/**
 * Static mapping of roles to their granted permissions.
 * MANAGE implies all other permissions — check for it as a wildcard.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [Permission.MANAGE],
  [Role.PROVIDER]: [Permission.READ, Permission.WRITE],
  [Role.SEEKER]: [Permission.READ],
};
