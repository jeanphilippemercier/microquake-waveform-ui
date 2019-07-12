export interface AuthLoginInput {
  username: string;
  password: string;
}

export interface LoginResponseContext {
  // access token string
  access: string;
  // access token string
  refresh: string;
}
