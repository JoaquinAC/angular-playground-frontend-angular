import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { INTERCEPTORS_LAB_CONTEXT } from '../data/interceptors/interceptors-lab-context';
import { InterceptorsLabStateService } from '../data/services/interceptors-lab-state.service';
import { LoaderService } from '../data/services/loader.service';

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
  constructor(
    private loaderService: LoaderService,
    private labState: InterceptorsLabStateService,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const context = req.context.get(INTERCEPTORS_LAB_CONTEXT);

    this.loaderService.show();
    if (context.enabled) {
      this.labState.markLoaderOn();
    }

    return next.handle(req).pipe(
      finalize(() => {
        this.loaderService.hide();
        if (context.enabled) {
          this.labState.markLoaderOff();
          this.labState.markFinalize();
        }
      }),
    );
  }
}
