import { z } from 'zod';

const infiniteQuerySchema = z.object({
  cursor: z.number().optional().default(0),
  limit: z.number().optional().default(10),
});

export const infiniteQueryPaginationParamsSchema =
  infiniteQuerySchema.transform(({ cursor, limit }) => ({
    page: cursor ?? 0,
    page_size: limit ?? 10,
  }));

export const extendedInfiniteQueryPaginationParamsSchema = <
  T extends z.ZodRawShape,
>(
  extension: T
) => {
  const extendedSchema = infiniteQuerySchema.extend(extension);
  return extendedSchema.transform(input => {
    const { cursor, limit, ...rest } = input as z.infer<
      typeof infiniteQuerySchema
    > &
      z.infer<z.ZodObject<T>>;
    return {
      page: cursor ?? 0,
      page_size: limit ?? 10,
      ...rest,
    } as const;
  });
};
