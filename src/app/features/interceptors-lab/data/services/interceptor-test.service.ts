import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserResponseDto } from '../../models/users/users.models';

@Injectable({ providedIn: 'root' })
export class InterceptorTestService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<UserResponseDto[]> {
    return this.http.get<UserResponseDto[]>(`${this.apiUrl}/users`);
  }

  private callDemoEndpoint(path: '/demo/401' | '/demo/403' | '/demo/500'): Observable<unknown> {
  if (!environment.enableDemoEndpoints) {
    return throwError(
      () => new Error('Los endpoints demo están deshabilitados para este entorno.'),
    );
  }

  return this.http.get(`${this.apiUrl}${path}`);
}
}