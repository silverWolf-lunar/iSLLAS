import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { RequestWithCorrelation } from '../middleware/correlation-id.middleware';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithCorrelation>();
    const correlationId = request.correlationId || 'N/A';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: Record<string, unknown> | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, any>;
        message = obj.message || obj.error || message;
        code = obj.code || obj.error || HttpStatus[status] || code;
        details = obj.details || (Array.isArray(obj.message) ? { validationErrors: obj.message } : undefined);
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception [${correlationId}]: ${exception.message}`, exception.stack);
      message = exception.message;
    }

    response.status(status).json({
      error: {
        code,
        message,
        details,
        correlationId,
      },
    });
  }
}
