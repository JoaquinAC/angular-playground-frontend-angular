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
        this.invalidateAuthCache();
        this.invalidateUsersCache();
      }
      return next.handle(request);
    }

    if (this.isAuthRequest(request)) {
      return next.handle(request);
    }

      const cacheKey = this.buildCacheKey(request);
      const cached = this.cache.get(cacheKey);

    if (cached) return of(cached.clone());

    return next.handle(request).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          this.cache.set(cacheKey, event.clone());
        }
      }),
    );
  }

  private buildCacheKey(request: HttpRequest<unknown>): string {
    const authHeader = request.headers.get('Authorization') || 'anonymous';
    return `${request.urlWithParams}::${authHeader}`;
  }

  private isAuthRequest(request: HttpRequest<unknown>): boolean {
    return request.url.includes('/auth/');
  }

  private invalidateAuthCache(): void {
    [...this.cache.keys()]
      .filter((key) => key.includes('/auth/'))
      .forEach((key) => this.cache.delete(key));
  }

  private invalidateUsersCache(): void {
    [...this.cache.keys()]
      .filter((key) => key.includes('/users'))
      .forEach((key) => this.cache.delete(key));
  }
}