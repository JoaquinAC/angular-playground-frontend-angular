import { Injectable } from '@angular/core';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private usersKey = 'usersMock';
  private readonly ROLE_KEY = 'user_role';

  constructor(private localStorage: LocalStorageService) {
    this.ensureMockUsers();
  }

  private ensureMockUsers(): void {
    const users = this.localStorage.get(this.usersKey);
    if (!users) {
      this.localStorage.set(this.usersKey, []);
    }
  }

  login(username: string, password: string): { success: boolean; message: string } {
    // Caso especial de error forzado
    if (username === 'admin' && password === 'admin') {
      return { success: false, message: 'Error: credenciales inválidas (modo simulado)' };
    }

    const users = this.localStorage.get(this.usersKey) || [];
    const found = users.find((u: any) => u.username === username && u.password === password);

    const role = found ? found.role : 'guest';
    this.setToken(role);

    return { success: true, message: 'Login exitoso' };
  }

  register(user: any): void {
    const users = this.localStorage.get(this.usersKey) || [];
    users.push(user);
    this.localStorage.set(this.usersKey, users);
  }

  setToken(role: string): void {
    const token = `${role}-token-${Math.random().toString(36).substring(2, 8)}`;
    this.localStorage.set('token', token);
    this.localStorage.set('role', role);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY);
  }
}
