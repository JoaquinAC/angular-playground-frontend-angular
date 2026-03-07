import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateUserRequestDto } from 'src/app/features/api/data/models/create-user-request.dto';
import { UserResponseDto } from 'src/app/features/api/data/models/user-response.dto';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly usersUrl = `${environment.apiBaseUrl}/users`;
  private readonly registerUrl = `${environment.apiBaseUrl}/auth/register`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<HttpResponse<UserResponseDto[]>> {
      return this.http.get<UserResponseDto[]>(this.usersUrl, {
        observe: 'response',
        responseType: 'json',
      });
  }

  createUser(dto: CreateUserRequestDto): Observable<HttpResponse<UserResponseDto>> {
      return this.http.post<UserResponseDto>(this.registerUrl, dto, {
        observe: 'response',
        responseType: 'json',
      });
  }

  deleteUser(id: number): Observable<HttpResponse<void>> {
    return this.http.delete<void>(`${this.usersUrl}/${id}`, {
      observe: 'response',
      responseType: 'json',
    });
  }
}
