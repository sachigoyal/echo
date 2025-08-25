import z from 'zod';

import { PaginatedResponse } from '@/types/paginated-response';

interface Params<T> {
  items: T[];
  page: number;
  page_size: number;
  total_count: number;
}

export const paginationSchema = z.object({
  page: z.number().optional().default(0),
  page_size: z.number().optional().default(10),
});

export const toPaginatedReponse = <T>({
  items,
  page,
  page_size,
  total_count,
}: Params<T>): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total_count / page_size);
  return {
    items,
    page,
    page_size,
    total_count,
    has_next: page < totalPages - 1,
  };
};
