import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodTypeAny } from 'zod';

/** Validates transport input with the shared schema and returns normalized values. */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodTypeAny) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    throw new BadRequestException({
      message: 'Request validation failed',
      errors: result.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
}
