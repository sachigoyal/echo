import { z } from 'zod';

export const paginationParamsSchema = z.object({
  page: z.number().optional().default(0),
  page_size: z.number().optional().default(10),
});
