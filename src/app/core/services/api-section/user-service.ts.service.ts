import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateUserRequestDto } from 'src/app/api-section/models/create-user-request.dto';
import { UserResponseDto } from 'src/app/api-section/models/user-response.dto';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = '/api/users';

  constructor(private http: HttpClient) {}

  /* ===========================
     GET USERS
  ============================ */

 getUsers(): Observable<HttpResponse<UserResponseDto[]>> {
    return this.http.get<UserResponseDto[]>(
      this.API_URL,
      {
        observe: 'response',
        responseType: 'json'
      }
    );
  }

  /* ===========================
     CREATE USER (ADMIN)
  ============================ */

   createUser(
    dto: CreateUserRequestDto
  ): Observable<HttpResponse<UserResponseDto>> {
    return this.http.post<UserResponseDto>(
      this.API_URL,
      dto,
      {
        observe: 'response',
        responseType: 'json'
      }
    );
  }

  /* ===========================
     DELETE ALL USERS (ADMIN)
  ============================ */

  deleteAll(): Observable<HttpResponse<void>> {
    return this.http.delete<void>(
      this.API_URL,
      {
        observe: 'response',
        responseType: 'json'
      }
    );
  }
}
