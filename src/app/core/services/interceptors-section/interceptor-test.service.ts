import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserResponseDto } from '../../models/users/users.models';

@Injectable({ providedIn: 'root' })
export class InterceptorTestService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<UserResponseDto[]> {
    return this.http.get<UserResponseDto[]>(`${this.apiUrl}/users`);
  }

  simulate401(): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/demo/401`);
  }

  simulate403(): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/demo/403`);
  }
}