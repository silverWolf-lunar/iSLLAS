import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Role } from '@sllas/contracts';

describe('RolesGuard (RBAC)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (userRole?: Role): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: userRole ? { role: userRole } : null,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if no roles are required on route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const context = createMockContext(Role.CLIENT);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has one of the required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.SYSTEM_ADMIN, Role.REGISTRY_OFFICER]);
    const context = createMockContext(Role.REGISTRY_OFFICER);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access (403 Forbidden) if user does not have required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.SYSTEM_ADMIN, Role.APPROVER]);
    const context = createMockContext(Role.CLIENT);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny access if user context is missing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.SYSTEM_ADMIN]);
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
