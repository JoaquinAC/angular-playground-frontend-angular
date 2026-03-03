export interface UserResponseDto {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'GUEST';
  createdAt: string;
}

export interface RegisterUserRequestDto {
  username: string;
  email: string;
  password: string;
}