import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { UserResponseDto } from 'src/app/core/models/users/users.models';
import { environment } from 'src/environments/environment';


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

  simulate401(): Observable<unknown> {
    return this.callDemoEndpoint('/demo/401');
  }

  simulate403(): Observable<unknown> {
    return this.callDemoEndpoint('/demo/403');
  }

  simulate500(): Observable<unknown> {
    return this.callDemoEndpoint('/demo/500');
  }
}