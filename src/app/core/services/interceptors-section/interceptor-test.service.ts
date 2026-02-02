import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InterceptorTestService {

  constructor() { }

  getUsers(): Observable<string[]> {
    return of(['user_1', 'user_2']).pipe(delay(1000));
  }

  simulate401(): Observable<never> {
    return throwError({ status: 401 }).pipe(delay(500));
  }

  simulate403(): Observable<never> {
    return throwError({ status: 403 }).pipe(delay(500));
  }
}
