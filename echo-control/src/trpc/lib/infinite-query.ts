import { z } from 'zod';

export const infiniteQueryPaginationParamsSchema = z
  .object({
    cursor: z.number().optional(),
    limit: z.number().optional(),
  })
  .transform(({ cursor, limit }) => ({
    page: cursor ?? 0,
    page_size: limit ?? 10,
  }));
