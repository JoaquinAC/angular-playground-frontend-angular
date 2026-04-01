import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { INTERCEPTORS_LAB_CONTEXT } from '../interceptors/interceptors-lab-context';
import {
  InterceptorsLabRequestContext,
  LabOperation,
  LabUserViewModel,
} from '../models/interceptors-lab.models';

@Injectable({ providedIn: 'root' })
export class InterceptorTestService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<LabUserViewModel[]> {
    return this.http.get<LabUserViewModel[]>(`${this.apiUrl}/users`, {
      // GET users es una operacion admin-only en este lab
      context: this.createContext('GET_USERS', 'GET /api/users', true, true),
    });
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`, {
      context: this.createContext('DELETE_USER', `DELETE /api/users/${id}`, true, false),
    });
  }

  simulate401(): Observable<unknown> {
    return this.callDemoEndpoint('/demo/401', 'SIMULATE_401');
  }

  simulate403(): Observable<unknown> {
    return this.callDemoEndpoint('/demo/403', 'SIMULATE_403');
  }

  simulate500(): Observable<unknown> {
    return this.callDemoEndpoint('/demo/500', 'SIMULATE_500');
  }

  private callDemoEndpoint(
    path: '/demo/401' | '/demo/403' | '/demo/500',
    operation: LabOperation,
  ): Observable<unknown> {
    if (!environment.enableDemoEndpoints) {
      return throwError(
        () => new Error('Los endpoints demo estan deshabilitados para este entorno.'),
      );
    }

    return this.http.get(`${this.apiUrl}${path}`, {
      context: this.createContext(operation, `GET /api${path}`, false, false),
    });
  }

  private createContext(
    operation: LabOperation,
    label: string,
    requiresAdmin: boolean,
    transformResponse: boolean,
  ): HttpContext {
    const context: InterceptorsLabRequestContext = {
      enabled: true,
      operation,
      label,
      requiresAdmin,
      transformResponse,
    };

    return new HttpContext().set(INTERCEPTORS_LAB_CONTEXT, context);
  }
}
