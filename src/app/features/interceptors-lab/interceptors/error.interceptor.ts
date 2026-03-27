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
import { AuthService } from 'src/app/core/auth/auth.service';
import { INTERCEPTORS_LAB_CONTEXT } from '../data/interceptors/interceptors-lab-context';
import { HttpErrorAdapterService, NormalizedHttpError } from '../data/services/http-error-adapter.service';
import { InterceptorsLabStateService } from '../data/services/interceptors-lab-state.service';
import { NotificationService } from '../data/services/notification.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private notificationService: NotificationService,
    private errorAdapter: HttpErrorAdapterService,
    private authService: AuthService,
    private labState: InterceptorsLabStateService,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const context = request.context.get(INTERCEPTORS_LAB_CONTEXT);

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const normalizedError = this.errorAdapter.adapt(error);
        this.handleByStatus(normalizedError);

        if (context.enabled) {
          this.labState.markError(
            error,
            this.resolveFlowMessage(normalizedError),
            this.resolveResultState(normalizedError),
          );
          this.labState.syncSession(this.authService.getToken(), this.authService.getRole());
        }

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
        ? ` ${error.fieldErrors
            .map((item) => `${item.field}: ${item.message}`)
            .join(' | ')}`
        : '';

      this.notificationService.error(`${error.status} (${error.code}): ${error.message}${detail}`);
      return;
    }

    if (error.status >= 500) {
      this.notificationService.error(`500 (${error.code}): ${error.message}`);
    }
  }

  private resolveFlowMessage(error: NormalizedHttpError): string {
    if (error.status === 401) {
      return 'El sistema detecto una sesion invalida. ErrorInterceptor limpio la sesion y dejo la vista en estado no autorizado.';
    }

    if (error.status === 403) {
      return 'El sistema detecto falta de permisos. ErrorInterceptor expuso un estado de acceso denegado.';
    }

    if (error.status >= 500) {
      return 'El sistema detecto un error del servidor. El interceptor activo un modo seguro para evitar fallos en la interfaz.';
    }

    return `Error ${error.status} centralizado por ErrorInterceptor.`;
  }

  private resolveResultState(
    error: NormalizedHttpError,
  ): 'unauthorized' | 'forbidden' | 'server-error' {
    if (error.status === 401) {
      return 'unauthorized';
    }

    if (error.status === 403) {
      return 'forbidden';
    }

    return 'server-error';
  }
}
