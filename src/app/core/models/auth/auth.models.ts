export type AppRole = 'admin' | 'guest';

export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface LoginResponseDto {
  token: string;
}

export interface RegisterRequestDto {
  username: string;
  email: string;
  password: string;
}

export interface UserProfileDto {
  username: string;
  authorities: Array<{ authority: string }>;
}

export interface SessionUser {
  username: string;
  role: AppRole;
}