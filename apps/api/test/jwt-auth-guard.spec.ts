import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { WORKER_ONLY_KEY } from '../src/common/decorators/worker-only.decorator';
import { IS_PUBLIC_KEY } from '../src/common/decorators/public.decorator';
import { Role } from '@sllas/contracts';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  const originalSecret = process.env.JWT_SECRET;
  const testSecret = 'test-secret-for-jwt-auth-guard';

  beforeEach(() => {
    process.env.JWT_SECRET = testSecret;
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  const createMockContext = (headers: Record<string, string> = {}): ExecutionContext => ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext);

  it('allows anonymous access to public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => key === IS_PUBLIC_KEY);

    expect(guard.canActivate(createMockContext())).toBe(true);
  });

  it('defers worker-only routes to the worker authentication guard', () => {
    const getMetadata = jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => key === WORKER_ONLY_KEY);

    expect(guard.canActivate(createMockContext())).toBe(true);
    expect(getMetadata).toHaveBeenCalledWith(WORKER_ONLY_KEY, expect.any(Array));
  });

  it('populates the current user from a valid bearer token on a public route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => key === IS_PUBLIC_KEY);
    const request = {
      headers: {
        authorization: `Bearer ${jwt.sign({ sub: 'staff-id', role: Role.REGISTRY_OFFICER }, testSecret)}`,
      },
    };
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
    expect(request).toHaveProperty('user.id', 'staff-id');
    expect(request).toHaveProperty('user.role', Role.REGISTRY_OFFICER);
  });

  it('rejects invalid bearer tokens on public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => key === IS_PUBLIC_KEY);

    expect(() => guard.canActivate(createMockContext({
      authorization: 'Bearer invalid-token',
    }))).toThrow(UnauthorizedException);
  });

  it('still requires a token on protected routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(() => guard.canActivate(createMockContext())).toThrow(UnauthorizedException);
  });
});
