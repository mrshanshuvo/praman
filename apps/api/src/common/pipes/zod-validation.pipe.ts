import {
  type ArgumentMetadata,
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * A reusable NestJS pipe that validates incoming data against a Zod schema.
 *
 * Usage in a controller:
 * ```ts
 * @Body(new ZodValidationPipe(CreateCandidateSchema))
 * body: CreateCandidateDto
 * ```
 *
 * On failure, throws a `BadRequestException` (400) whose `message` array
 * contains human-readable Zod error messages, consistent with the shape
 * produced by `GlobalExceptionFilter`.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const { fieldErrors } = result.error.flatten();

      const formatted = Object.entries(fieldErrors).flatMap(([field, errors]) =>
        (errors ?? []).map((msg: string) => `${field}: ${msg}`),
      );

      throw new BadRequestException(
        formatted.length > 0 ? formatted : result.error.issues.map((i) => i.message),
      );
    }

    return result.data;
  }
}
