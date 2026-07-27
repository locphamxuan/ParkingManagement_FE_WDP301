// Kiểu state dùng chung cho các hook fetch của user.
export interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export interface ListFetchState<T> {
  items: T[];
  isLoading: boolean;
  error: Error | null;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}
