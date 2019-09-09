export interface PaginationResponse<T> {
  next?: string;
  previous?: string;
  cursor_next?: string;
  cursor_previous?: string;
  count: number;
  results: T[];
  current_page: number;
  total_pages: number;
}
