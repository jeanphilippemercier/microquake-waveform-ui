export interface PaginationRequest {
  page_size?: number;
  cursor?: string;
}

export interface RequestHeaderOptions {
  'x-refresh'?: boolean;
}
