import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class WorkerAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const authorization = context.switchToHttp().getRequest().headers.authorization;
    const token = typeof authorization === 'string' && authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : '';
    const expectedToken = process.env.WORKER_API_TOKEN;

    if (!expectedToken || !token) {
      throw new UnauthorizedException('Worker credentials are not configured');
    }

    const provided = Buffer.from(token);
    const expected = Buffer.from(expectedToken);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      throw new UnauthorizedException('Invalid worker credentials');
    }

    return true;
  }
}