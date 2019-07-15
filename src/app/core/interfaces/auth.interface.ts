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

export interface Token {
  token_type: string;
  exp: Date;
  jti: string;
  user_id: number;
}
