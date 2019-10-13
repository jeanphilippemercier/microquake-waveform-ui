export interface PaginationRequest {
  page_size?: number;
  cursor?: string;
}

export interface RequestOptions {
  useCache?: boolean;
  refreshCache?: boolean;
  cacheTimeout?: number;
}
