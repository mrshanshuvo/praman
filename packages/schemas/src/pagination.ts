import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  q: z.string().optional(),
  sortBy: z.enum(['newest', 'oldest', 'highest_match', 'lowest_match']).default('newest'),
  all: z
    .preprocess((val) => val === 'true' || val === true || val === '1' || val === 1, z.boolean())
    .optional(),
});

export type PaginationQueryDto = z.infer<typeof PaginationQuerySchema>;

export const PaginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
