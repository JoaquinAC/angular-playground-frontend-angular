import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface FieldError {
  field: string;
  message: string;
}

export interface NormalizedHttpError {
  status: number;
  code: string;
  message: string;
  fieldErrors: FieldError[];
  raw: unknown;
}

@Injectable({ providedIn: 'root' })
export class HttpErrorAdapterService {
  adapt(error: HttpErrorResponse): NormalizedHttpError {
    const status = error.status || 0;
    const payload = error.error;

    return {
      status,
      code: this.extractCode(payload, status),
      message: this.extractMessage(error),
      fieldErrors: this.extractFieldErrors(payload),
      raw: payload,
    };
  }

  private extractCode(payload: unknown, status: number): string {
    if (payload && typeof payload === 'object' && 'code' in payload) {
      const code = (payload as { code?: unknown }).code;
      if (typeof code === 'string' && code.trim().length > 0) return code;
    }

    switch (status) {
      case 400:
        return 'VALIDATION_ERROR';
      case 401:
        return 'AUTH_INVALID_CREDENTIALS';
      case 403:
        return 'AUTH_FORBIDDEN';
      case 404:
        return 'RESOURCE_NOT_FOUND';
      case 409:
        return 'CONFLICT_ERROR';
      default:
        return status >= 500 ? 'INTERNAL_ERROR' : 'UNKNOWN_ERROR';
    }
  }

  private extractMessage(error: HttpErrorResponse): string {
    const payload = error.error as
      | { message?: unknown; error?: unknown }
      | Record<string, unknown>
      | null;

    if (payload && typeof payload === 'object') {
      const message = payload.message;
      if (typeof message === 'string' && message.trim().length > 0) return message;

      const generic = payload.error;
      if (typeof generic === 'string' && generic.trim().length > 0) return generic;
    }

    if (typeof error.message === 'string' && error.message.trim().length > 0) {
      return error.message;
    }

    return 'Error inesperado';
  }

  private extractFieldErrors(payload: unknown): FieldError[] {
    if (!payload || typeof payload !== 'object') return [];

    if (Array.isArray((payload as { errors?: unknown }).errors)) {
      return ((payload as { errors: unknown[] }).errors || [])
        .filter(
          item =>
            item &&
            typeof item === 'object' &&
            typeof (item as { field?: unknown }).field === 'string' &&
            typeof (item as { message?: unknown }).message === 'string',
        )
        .map(item => ({
          field: (item as { field: string }).field,
          message: (item as { message: string }).message,
        }));
    }

    const ignoredKeys = new Set(['timestamp', 'status', 'error', 'message', 'path']);
    const entries = Object.entries(payload as Record<string, unknown>).filter(([key, value]) => {
      return !ignoredKeys.has(key) && typeof value === 'string' && value.trim().length > 0;
    });

    return entries.map(([field, message]) => ({ field, message: message as string }));
  }
}