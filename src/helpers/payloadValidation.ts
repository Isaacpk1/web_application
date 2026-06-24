import { z } from 'zod';

import { BadRequestError } from './errors';

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);

  if (result.success) {
    return result.data;
  }

  const details = result.error.issues
    .map((issue: z.ZodIssue) => {
      const field = issue.path.length > 0 ? issue.path.join('.') : 'body';
      return `${field}: ${issue.message}`;
    })
    .join('; ');

  throw new BadRequestError(`Payload invalido: ${details}`);
}
