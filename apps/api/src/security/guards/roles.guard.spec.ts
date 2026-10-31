import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../rbac/roles.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
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

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createContext({ id: '1', email: 'a@b.com', roles: [Role.SEEKER], metadata: {} });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has the required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createContext({
      id: '1',
      email: 'a@b.com',
      roles: [Role.ADMIN],
      metadata: {},
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has one of multiple required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN, Role.PROVIDER]);
    const context = createContext({
      id: '1',
      email: 'a@b.com',
      roles: [Role.PROVIDER],
      metadata: {},
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when user has wrong role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createContext({
      id: '1',
      email: 'a@b.com',
      roles: [Role.SEEKER],
      metadata: {},
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when no user on request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createContext();

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
