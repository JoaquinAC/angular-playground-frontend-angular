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
import { NotificationService } from '../data/services/notification.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { HttpErrorAdapterService , NormalizedHttpError } from '../data/services/http-error-adapter.service';



@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private notificationService: NotificationService,
    private errorAdapter: HttpErrorAdapterService,
    private authService: AuthService,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const normalizedError = this.errorAdapter.adapt(error);
        this.handleByStatus(normalizedError);

        return throwError(() => ({ ...error, normalized: normalizedError }));
      }),
    );
  }
  private handleByStatus(error: NormalizedHttpError): void {
    if (error.status === 401) {
      this.authService.clearSession();
      this.notificationService.error(`401 (${error.code}): ${error.message}`);
      return;
    }

    if (error.status === 403) {
      this.notificationService.error(`403 (${error.code}): ${error.message}`);
      return;
    }

    if (error.status === 400 || error.status === 409) {
      const detail = error.fieldErrors.length
        ? ` ${error.fieldErrors.map((item: { field: any; message: any; }) => `${item.field}: ${item.message}`).join(' | ')}`
        : '';

      this.notificationService.error(`${error.status} (${error.code}): ${error.message}${detail}`);
      return;
    }

    if (error.status >= 500) {
      this.notificationService.error(`500 (${error.code}): ${error.message}`);
    }
  }
}