export interface AuthLoginInput {
  username: string;
  password: string;
}

export interface AuthRefreshInput {
  refresh: string;
}

export interface RefreshResponseContext {
  access: string;
}

export interface LoginResponseContext {
  access: string;
  refresh: string;
}
