import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface NotificationToastData {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  keywords?: string[];
  duration?: number;
}

export interface NotificationToastModel extends NotificationToastData {
  id: string;
}

const TOAST_META: Record<NotificationToastData['type'], { icon: string; title: string; defaultDuration: number }> = {
  success: { icon: '✔', title: 'Operación exitosa', defaultDuration: 2300 },
  error: { icon: '⚠', title: 'Error crítico', defaultDuration: 4200 },
  info: { icon: 'ℹ', title: 'Información', defaultDuration: 3000 },
  warning: { icon: '⚠', title: 'Advertencia', defaultDuration: 3500 },
};

@Component({
  selector: 'app-notification-toast',
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.scss'],
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  @Input() data!: NotificationToastModel;
  @Output() closeEvent = new EventEmitter<string>();

  constructor(private sanitizer: DomSanitizer) {}

  private remainingTime = 0;
  private timerId: any;
  private startTimestamp = 0;

  ngOnInit(): void {
    this.startAutoDismiss();
  }

  ngOnDestroy(): void {
    this.clearAutoDismiss();
  }

  get title(): string {
    return TOAST_META[this.data.type].title;
  }

  get icon(): string {
    return TOAST_META[this.data.type].icon;
  }


  showDetail = false;

  get toastClass(): string {
    return `toast-card toast-card--${this.data.type}`;
  }

  get messageMain(): string {
    return this.parseMessage().main;
  }

  get detailText(): string | null {
    return this.parseMessage().detail;
  }

  get hasDetail(): boolean {
    return Boolean(this.detailText);
  }

  get mainHtml(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.highlightKeywords(this.messageMain));
  }

  get detailHtml(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.highlightKeywords(this.detailText ?? ''));
  }

  close(): void {
    this.clearAutoDismiss();
    this.closeEvent.emit(this.data.id);
  }

  pauseAutoDismiss(): void {
    this.clearAutoDismiss();
    this.remainingTime = Math.max(0, (this.startTimestamp + this.currentDuration()) - Date.now());
  }

  resumeAutoDismiss(): void {
    this.startAutoDismiss(this.remainingTime || this.currentDuration());
  }

  private currentDuration(): number {
    return this.data.duration ?? TOAST_META[this.data.type].defaultDuration;
  }

  private startAutoDismiss(duration?: number): void {
    this.clearAutoDismiss();
    const timeout = duration ?? this.currentDuration();
    this.remainingTime = timeout;
    this.startTimestamp = Date.now();

    this.timerId = window.setTimeout(() => this.close(), timeout);
  }

  private clearAutoDismiss(): void {
    if (this.timerId) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private parseMessage(): { main: string; detail: string | null } {
    const normalized = (this.data.message ?? '').trim();
    if (!normalized) {
      return { main: '', detail: null };
    }

    const lines = normalized.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length > 1) {
      return { main: lines[0], detail: lines.slice(1).join('\n') };
    }

    if (normalized.length > 140) {
      const splitPos = Math.max(normalized.indexOf(':', 64), normalized.indexOf(' - ', 64), normalized.indexOf('. ', 64));
      if (splitPos > 0 && splitPos < normalized.length - 20) {
        const main = normalized.slice(0, splitPos + 1).trim();
        const detail = normalized.slice(splitPos + 1).trim();
        return { main, detail };
      }

      const main = `${normalized.slice(0, 120).trim()}…`;
      const detail = normalized;
      return { main, detail };
    }

    return { main: normalized, detail: null };
  }

  private highlightKeywords(text: string): string {
    const escaped = this.escapeHtml(text);
    const keywords = this.data.keywords?.length ? this.data.keywords : this.deriveAutoKeywords(text);
    if (!keywords.length) {
      return escaped;
    }

    const escapedKeywords = Array.from(new Set(keywords))
      .filter(Boolean)
      .map((kw) => this.escapeRegex(kw));

    if (!escapedKeywords.length) {
      return escaped;
    }

    const pattern = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
    return escaped.replace(pattern, '<span class="toast-keyword">$1</span>');
  }

  private deriveAutoKeywords(text: string): string[] {
    if (!text) {
      return [];
    }

    const fixed = text.replace(/\s+/g, ' ').trim();
    const upperWords = Array.from(new Set(fixed.match(/\b[A-ZÁÉÍÓÚÑ]{2,}\b/g) ?? []));

    const priority = (fixed.match(/\b(error|exitoso|exitos|denegado|bloqueado|admin|denied|warning|success|fail|exception|critical)\b/gi) ?? [])
      .map((w) => w.trim());

    return [...priority, ...upperWords].slice(0, 6);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
