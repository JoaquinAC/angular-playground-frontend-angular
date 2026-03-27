import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';
import { INTERCEPTORS_LAB_CONTEXT } from '../data/interceptors/interceptors-lab-context';
import { InterceptorsLabStateService } from '../data/services/interceptors-lab-state.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private labState: InterceptorsLabStateService,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const context = request.context.get(INTERCEPTORS_LAB_CONTEXT);
    const token = this.authService.getToken();
    const role = this.authService.getRole();

    if (context.enabled) {
      this.labState.syncSession(token, role);
      this.labState.startRequest(request, context);
    }

    if (!token) {
      if (context.enabled) {
        this.labState.markAuthAttached(request, role, false);
      }

      if (context.enabled && context.requiresAdmin) {
        this.labState.markRequestBlocked('Admin required. Request blocked by AuthInterceptor.');
        return throwError(() => this.createForbiddenError());
      }

      return next.handle(request);
    }

    const authReq = request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });

    if (context.enabled) {
      this.labState.markAuthAttached(authReq, role, true);
    }

    if (context.enabled && context.requiresAdmin && role !== 'admin') {
      this.labState.markRequestBlocked('Admin required. Request blocked before backend call.');
      return throwError(() => this.createForbiddenError());
    }

    return next.handle(authReq);
  }

  private createForbiddenError(): HttpErrorResponse {
    return new HttpErrorResponse({
      status: 403,
      statusText: 'Forbidden',
      error: {
        code: 'AUTH_FORBIDDEN',
        message: 'Admin role required',
        blockedByInterceptor: true,
      },
    });
  }
}
