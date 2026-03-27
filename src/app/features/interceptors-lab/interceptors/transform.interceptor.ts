import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { UserResponseDto } from 'src/app/core/models/users/users.models';
import { INTERCEPTORS_LAB_CONTEXT } from '../data/interceptors/interceptors-lab-context';
import { LabUserViewModel } from '../data/models/interceptors-lab.models';
import { InterceptorsLabStateService } from '../data/services/interceptors-lab-state.service';

@Injectable()
export class TransformInterceptor implements HttpInterceptor {
  constructor(private labState: InterceptorsLabStateService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const context = request.context.get(INTERCEPTORS_LAB_CONTEXT);

    if (!context.enabled) {
      return next.handle(request);
    }

    this.labState.markBackendDispatch(request);

    return next.handle(request).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          this.labState.captureResponseOriginal(event.body, event.status);
        }
      }),
      map((event) => {
        if (!(event instanceof HttpResponse)) {
          return event;
        }

        if (!context.transformResponse || !Array.isArray(event.body)) {
          this.labState.captureResponseTransformed(
            event.body,
            `TransformInterceptor activo -> la respuesta no requirio una transformacion adicional`,
          );
          return event;
        }

        const transformedBody = (event.body as UserResponseDto[]).map((user) =>
          this.mapUser(user),
        );

        this.labState.captureResponseTransformed(
          transformedBody,
          `TransformInterceptor activo -> la respuesta fue convertida a un modelo de vista listo para la interfaz`,
        );

        return event.clone({
          body: transformedBody,
        });
      }),
    );
  }

  private mapUser(user: UserResponseDto): LabUserViewModel {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      roleLabel: user.role === 'ADMIN' ? 'Admin' : 'Guest',
      createdAt: user.createdAt,
      createdAtLabel: new Date(user.createdAt).toLocaleString('es-PE', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
    };
  }
}
