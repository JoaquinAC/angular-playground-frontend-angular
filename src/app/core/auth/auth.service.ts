import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from '../storage/local-storage.service';
import { normalizeRole } from '../models/auth/role.utils';

import {
  AppRole,
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  SessionUser,
  UserProfileDto,
} from '../models/auth/auth.models';

type DemoCredentials = Record<AppRole, { username: string; password: string }>;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly SESSION_USER_KEY = 'session_user';
  private readonly ROLE_KEY = 'role';
  private readonly apiUrl = `${environment.apiBaseUrl}/auth`;
  
  constructor(
    private http: HttpClient,
    private localStorage: LocalStorageService,
  ) {}

  login(dto: LoginRequestDto): Observable<SessionUser> {
    return this.http.post<LoginResponseDto>(`${this.apiUrl}/login`, dto).pipe(
      switchMap(({ token }) => {
        this.setToken(token);
        return this.getMe().pipe(
          map((profile) => this.mapProfileToSessionUser(profile)),
          tap((sessionUser) => this.persistSessionUser(sessionUser)),
        );
      }),
    );
  }

  register(dto: RegisterRequestDto): Observable<HttpResponse<unknown>> {
    return this.http.post(`${this.apiUrl}/register`, dto, { observe: 'response' });
  }
  getMe(): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.apiUrl}/me`);
  }

  loginAsRole(role: AppRole): Observable<SessionUser> {
    const credentials = (environment.demoCredentials as DemoCredentials)[role];

    if (!credentials.username || !credentials.password) {
      return throwError(
        () =>
          new Error(`Credenciales demo para ${role.toUpperCase()} no configuradas en environment`),
      );
    }

    return this.login({
      username: credentials.username,
      password: credentials.password,
    });
  }

  setToken(token: string): void {
    this.localStorage.set(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return this.localStorage.get<string>(this.TOKEN_KEY);
  }

  clearSession(): void {
    this.localStorage.remove(this.TOKEN_KEY);
    this.localStorage.remove(this.SESSION_USER_KEY);
    this.localStorage.remove(this.ROLE_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getRole(): AppRole | null {
    return this.localStorage.get<AppRole>(this.ROLE_KEY);
  }

  getSessionUser(): SessionUser | null {
    return this.localStorage.get<SessionUser>(this.SESSION_USER_KEY);
  }

  private persistSessionUser(user: SessionUser): void {
    this.localStorage.set(this.SESSION_USER_KEY, user);
    this.localStorage.set(this.ROLE_KEY, user.role);
  }

  private mapProfileToSessionUser(profile: UserProfileDto): SessionUser {
    const role = normalizeRole(profile.authorities?.[0]?.authority);
    return { username: profile.username, role };
  }

  hydrateSession(): Observable<SessionUser | null> {
    const token = this.getToken();

    if (!token) {
      this.clearSession();
      return of(null);
    }

    return this.getMe().pipe(
      map((profile) => this.mapProfileToSessionUser(profile)),
      tap((sessionUser) => this.persistSessionUser(sessionUser)),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }
}