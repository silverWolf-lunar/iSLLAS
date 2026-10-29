import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestWithCorrelation } from '../middleware/correlation-id.middleware';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithCorrelation>();
    const correlationId = request?.correlationId;

    return next.handle().pipe(
      map(data => {
        // If data is already in standard envelope or is a raw buffer/string, pass through
        if (data && typeof data === 'object' && ('data' in data || 'error' in data)) {
          return {
            ...data,
            correlationId: data.correlationId || correlationId,
          };
        }
        return {
          data,
          correlationId,
        };
      }),
    );
  }
}
