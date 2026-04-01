import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationToastModel } from 'src/app/shared/components/notification-toast/notification-toast.component';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly dedupWindowMs = 1500;
  private readonly recentToasts = new Map<string, number>();
  private readonly toastsSubject = new BehaviorSubject<NotificationToastModel[]>([]);

  toast$(): Observable<NotificationToastModel[]> {
    return this.toastsSubject.asObservable();
  }

  private normalizeDedupKey(type: NotificationToastModel['type'], message: string): string {
    const normalizedMessage = (message ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();

    const reduced = normalizedMessage.replace(/\d{3}\s*\(.*?\):/g, '').replace(/[:\-]/g, '').trim();
    return `${type}|${reduced.slice(0, 140)}`;
  }

  private shouldShow(type: NotificationToastModel['type'], message: string): boolean {
    const key = this.normalizeDedupKey(type, message);
    const now = Date.now();
    const last = this.recentToasts.get(key);

    for (const [cacheKey, timestamp] of this.recentToasts) {
      if (now - timestamp > 5000) {
        this.recentToasts.delete(cacheKey);
      }
    }

    if (last && now - last < this.dedupWindowMs) {
      console.debug('[NotificationService] Duplicated toast ignored:', type, message);
      return false;
    }

    this.recentToasts.set(key, now);
    return true;
  }

  private pushToast(toast: NotificationToastModel): void {
    const current = this.toastsSubject.value;
    this.toastsSubject.next([...current, toast]);
  }

  removeToast(id: string): void {
    const current = this.toastsSubject.value;
    this.toastsSubject.next(current.filter((toast) => toast.id !== id));
  }

  private createToastConfig(type: NotificationToastModel['type'], message: string, keywords?: string[], duration?: number): NotificationToastModel {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      type,
      message,
      keywords,
      duration,
    };
  }

  private show(type: NotificationToastModel['type'], message: string, keywords?: string[], duration?: number): void {
    if (!this.shouldShow(type, message)) {
      return;
    }

    const toast = this.createToastConfig(type, message, keywords, duration);
    this.pushToast(toast);
    console.debug('[NotificationService] Showing toast', { toast });
  }

  success(message: string, keywords?: string[], duration?: number): void {
    this.show('success', message, keywords, duration);
  }

  error(message: string, keywords?: string[], duration?: number): void {
    this.show('error', message, keywords, duration);
  }

  info(message: string, keywords?: string[], duration?: number): void {
    this.show('info', message, keywords, duration);
  }

  warning(message: string, keywords?: string[], duration?: number): void {
    this.show('warning', message, keywords, duration);
  }
}
