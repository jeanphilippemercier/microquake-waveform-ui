export interface PaginationResponse<T> {
  next?: string;
  previous?: string;
  cursor_next: string | null;
  cursor_previous: string | null;
  count: number;
  results: T[];
  current_page: number;
  total_pages: number;
}
