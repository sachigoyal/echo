export type PaginationParams = {
  page?: number;
  page_size?: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  page_size: number;
  page: number;
  total_count: number;
  has_next: boolean;
};
