export interface PaginationResponse<T> {
  next?: string;
  previous?: string;
  cursor_next?: string;
  cursor_previous?: string;
  count: number;
  results: T[];
}
