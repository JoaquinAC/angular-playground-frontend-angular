import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, HttpResponse<unknown>>();

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.method !== 'GET') {
      if (request.method === 'POST' || request.method === 'DELETE') {
        this.invalidateUsersCache();
      }
      return next.handle(request);
    }

    const cached = this.cache.get(request.urlWithParams);
    if (cached) return of(cached.clone());

    return next.handle(request).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.cache.set(request.urlWithParams, event.clone());
        }
      }),
    );
  }

  private invalidateCacheByUrl(requestUrl: string): void {
    Array.from(this.cache.keys())
      .filter(key => key.includes('/users') || key.includes(requestUrl))
      .forEach(key => this.cache.delete(key));
  }

  private invalidateUsersCache(): void {
    [...this.cache.keys()]
      .filter(key => key.includes('/users'))
      .forEach(key => this.cache.delete(key));
  }

}