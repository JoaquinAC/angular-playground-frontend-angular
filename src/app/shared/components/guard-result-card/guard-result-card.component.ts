import { Component, Input } from '@angular/core';

export interface GuardResultAction {
  label: string;
  link: string;
}

@Component({
  selector: 'app-guard-result-card',
  templateUrl: './guard-result-card.component.html',
  styleUrls: ['./guard-result-card.component.scss'],
})
export class GuardResultCardComponent {
  @Input() icon = '•';
  @Input() title = '';
  @Input() message = '';
  @Input() detail = '';
  @Input() status: 'error' | 'success' | 'info' = 'info';
  @Input() requiredRole = '';
  @Input() currentRole = '';
  @Input() targetRoute = '';
  @Input() primaryAction: GuardResultAction = { label: 'Volver al Home', link: '/' };
  @Input() secondaryAction: GuardResultAction = { label: 'Ir a Guards', link: '/guards' };

  get roleTone(): string {
    return this.currentRole === 'ADMIN' ? 'guard-result__value--accent' : 'guard-result__value--muted';
  }
}
