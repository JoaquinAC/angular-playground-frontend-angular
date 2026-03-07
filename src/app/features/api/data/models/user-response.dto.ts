export interface UserResponseDto {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'GUEST';
  createdAt: string; // ISO date-time
}