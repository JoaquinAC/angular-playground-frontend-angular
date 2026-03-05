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
        const backendMessage = this.extractMessage(error);
        if (error.status === 401) {
          this.notificationService.error(`401: ${backendMessage}`);
        } else if (error.status === 403) {
          this.notificationService.error(`403: ${backendMessage}`);
        } else if (error.status === 409) {
          this.notificationService.error(`409: ${backendMessage}`);
        } else if (error.status >= 500) {
          this.notificationService.error(`500: ${backendMessage}`);
        }
        return throwError(() => error);
      }),
    );
  }

  private extractMessage(error: HttpErrorResponse): string {
    const payload = error.error as
      | { message?: string; error?: string; status?: number; timestamp?: string }
      | null;

    if (payload?.message) return payload.message;
    if (typeof error.message === 'string' && error.message.length) return error.message;
    return 'Error inesperado';
  }
}