interface Params<T> {
  items: T[];
  page: number;
  page_size: number;
  total_count: number;
}

export type PaginationParams = {
  page: number;
  page_size: number;
};

type PaginatedResponse<T> = {
  items: T[];
  page_size: number;
  page: number;
  total_count: number;
  has_next: boolean;
};

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
