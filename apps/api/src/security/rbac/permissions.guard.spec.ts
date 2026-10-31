import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { Permission } from './permissions.enum';
import { Role } from './roles.enum';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  function createContext(user?: Record<string, unknown>): ExecutionContext {
    return {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => (user ? { user } : {}),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access when no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createContext({ id: '1', email: 'a@b.com', roles: [Role.SEEKER], metadata: {} });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user role has the required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.READ]);
    const context = createContext({
      id: '1',
      email: 'a@b.com',
      roles: [Role.SEEKER],
      metadata: {},
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access for ADMIN with MANAGE permission (wildcard)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.DELETE]);
    const context = createContext({
      id: '1',
      email: 'a@b.com',
      roles: [Role.ADMIN],
      metadata: {},
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow PROVIDER with WRITE permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.WRITE]);
    const context = createContext({
      id: '1',
      email: 'a@b.com',
      roles: [Role.PROVIDER],
      metadata: {},
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when user lacks required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.DELETE]);
    const context = createContext({
      id: '1',
      email: 'a@b.com',
      roles: [Role.SEEKER],
      metadata: {},
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when SEEKER tries WRITE', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.WRITE]);
    const context = createContext({
      id: '1',
      email: 'a@b.com',
      roles: [Role.SEEKER],
      metadata: {},
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when no user on request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.READ]);
    const context = createContext();

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should require all permissions when multiple are specified', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.WRITE, Permission.DELETE]);
    const context = createContext({
      id: '1',
      email: 'a@b.com',
      roles: [Role.PROVIDER], // PROVIDER has READ + WRITE, not DELETE
      metadata: {},
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
