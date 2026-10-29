import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { WorkerAuthGuard } from '../src/common/guards/worker-auth.guard';

describe('WorkerAuthGuard', () => {
  const originalToken = process.env.WORKER_API_TOKEN;
  const workerToken = 'test-worker-api-token';
  const guard = new WorkerAuthGuard();

  afterAll(() => {
    if (originalToken === undefined) {
      delete process.env.WORKER_API_TOKEN;
    } else {
      process.env.WORKER_API_TOKEN = originalToken;
    }
  });

  const createMockContext = (authorization?: string): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ headers: authorization ? { authorization } : {} }),
    }),
  } as unknown as ExecutionContext);

  it('allows requests with the configured bearer token', () => {
    process.env.WORKER_API_TOKEN = workerToken;

    expect(guard.canActivate(createMockContext(`Bearer ${workerToken}`))).toBe(true);
  });

  it('rejects missing credentials', () => {
    process.env.WORKER_API_TOKEN = workerToken;

    expect(() => guard.canActivate(createMockContext())).toThrow(UnauthorizedException);
  });

  it('rejects invalid credentials', () => {
    process.env.WORKER_API_TOKEN = workerToken;

    expect(() => guard.canActivate(createMockContext('Bearer incorrect-token'))).toThrow(UnauthorizedException);
  });

  it('fails closed when no worker token is configured', () => {
    delete process.env.WORKER_API_TOKEN;

    expect(() => guard.canActivate(createMockContext(`Bearer ${workerToken}`))).toThrow(UnauthorizedException);
  });
});