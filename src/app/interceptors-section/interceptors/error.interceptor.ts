import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from 'src/app/core/services/interceptors-section/notification.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private notificationService: NotificationService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.notificationService.error('Sesión inválida o expirada (401)');
        } else if (error.status === 403) {
          this.notificationService.error('No tienes permisos para esta acción (403)');
        } else if (error.status >= 500) {
          this.notificationService.error('Error interno del servidor');
        }
        return throwError(() => error);
      }),
    );
  }
}