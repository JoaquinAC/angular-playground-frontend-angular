import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';
import { AppRole } from 'src/app/core/models/auth/auth.models';
import {
  InterceptorsLabViewState,
  LabUserViewModel,
} from '../../data/models/interceptors-lab.models';
import { InterceptorTestService } from '../../data/services/interceptor-test.service';
import { InterceptorsLabStateService } from '../../data/services/interceptors-lab-state.service';
import { NotificationService } from '../../data/services/notification.service';

@Component({
  selector: 'app-interceptors-section',
  templateUrl: './interceptors-section.component.html',
  styleUrls: ['./interceptors-section.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class InterceptorsSectionComponent implements OnInit, OnDestroy {
  vm: InterceptorsLabViewState;
  users: LabUserViewModel[] = [];
  deletingUserId: number | null = null;

  private readonly subscriptions = new Subscription();

  constructor(
    private interceptorTestService: InterceptorTestService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private labState: InterceptorsLabStateService,
  ) {
    this.vm = this.labState.snapshot();
  }

  ngOnInit(): void {
    this.refreshSessionState();
    this.subscriptions.add(
      this.labState.state$().subscribe((state) => {
        this.vm = state;
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get isAdmin(): boolean {
    return this.authService.getRole() === 'admin';
  }

  get authStepState(): string {
    return this.resolveStepState('auth');
  }

  get loaderStepState(): string {
    return this.resolveStepState('loader');
  }

  get errorStepState(): string {
    if (this.vm.resultState === 'blocked') {
      return 'blocked';
    }

    if (
      this.vm.errorActive ||
      this.vm.resultState === 'server-error' ||
      this.vm.resultState === 'forbidden' ||
      this.vm.resultState === 'unauthorized'
    ) {
      return 'error';
    }

    if (this.vm.lastStatus === 'SUCCESS') {
      return 'done';
    }

    return 'idle';
  }

  get showTransformInfo(): boolean {
    return this.vm.currentFlow.includes('TransformInterceptor');
  }

  get transformHeadline(): string {
    return 'TransformInterceptor activo';
  }

  get transformDescription(): string {
    return 'La respuesta fue convertida a un modelo de vista con campos listos para renderizar en la interfaz.';
  }

  loadUsers(): void {
    this.subscriptions.add(
      this.interceptorTestService.getUsers().subscribe({
        next: (response) => {
          this.users = response;
          this.labState.resetResultMessage(
            response.length
              ? `${response.length} usuarios cargados desde response transformada.`
              : 'Respuesta valida, sin usuarios disponibles.',
          );
        },
        error: (error: { status?: number }) => {
          if (error.status === 401) {
            this.users = [];
            this.refreshSessionState();
          }
        },
      }),
    );
  }

  deleteUser(user: LabUserViewModel): void {
    if (!this.isAdmin) {
      return;
    }

    this.deletingUserId = user.id;
    this.subscriptions.add(
      this.interceptorTestService.deleteUser(user.id).subscribe({
        next: () => {
          window.setTimeout(() => {
            this.users = this.users.filter((item) => item.id !== user.id);
            this.deletingUserId = null;
            this.labState.markDeleteSuccess(user.username);
            this.notificationService.success(`${user.username} eliminado`);
          }, 280);
        },
        error: (error: { status?: number }) => {
          this.deletingUserId = null;
          if (error.status === 401) {
            this.users = [];
            this.refreshSessionState();
          }
        },
      }),
    );
  }

  simulate401(): void {
    this.subscriptions.add(
      this.interceptorTestService.simulate401().subscribe({
        error: () => {
          this.users = [];
          this.refreshSessionState();
        },
      }),
    );
  }

  simulate403(): void {
    this.subscriptions.add(
      this.interceptorTestService.simulate403().subscribe({
        error: () => undefined,
      }),
    );
  }

  simulate500(): void {
    this.subscriptions.add(
      this.interceptorTestService.simulate500().subscribe({
        error: () => undefined,
      }),
    );
  }

  setGuestToken(): void {
    this.switchRole('guest');
  }

  setAdminToken(): void {
    this.switchRole('admin');
  }

  private switchRole(role: AppRole): void {
    this.subscriptions.add(
      this.authService.loginAsRole(role).subscribe({
        next: () => {
          this.refreshSessionState();
          this.loadUsers();
        },
        error: (error: Error) => {
          this.notificationService.error(error.message);
        },
      }),
    );
  }

  private refreshSessionState(): void {
    this.labState.syncSession(this.authService.getToken(), this.authService.getRole());
  }

  formatBlock(content: string, kind: 'request' | 'response' | 'error'): string {
    const escaped = this.escapeHtml(content);
    const withUrls = escaped.replace(/(https?:\/\/[^\s"<]+|\/api\/[^\s"<]*)/g, '<span class="json-url">$1</span>');
    const withHeaders = withUrls.replace(
      /\b(Authorization|Headers|Content-Type|Accept)\b/g,
      '<span class="json-header">$1</span>',
    );
    const withBraces = withHeaders.replace(/([{}[\]])/g, '<span class="json-brace">$1</span>');
    const withNulls = withBraces.replace(/\b(null|undefined|true|false)\b/g, '<span class="json-null">$1</span>');
    const withValues = withNulls.replace(
      /\b(BLOCKED|ADMIN|GUEST|SUCCESS|ERROR|RUNNING|IDLE)\b/g,
      '<span class="json-value">$1</span>',
    );
    const withLabels = withValues.replace(
      /\b(Response|Request|Status|Body)\b/g,
      '<span class="json-key">$1</span>',
    );
    const withKeys = withLabels.replace(
      /"([^"]+)"(?=\s*:)/g,
      '<span class="json-key">"$1"</span>',
    );
    const withStrings = withKeys.replace(
      /:\s*"([^"]*)"/g,
      ': <span class="json-string">"$1"</span>',
    );
    const withNumbers = withStrings.replace(
      /:\s*(-?\d+(\.\d+)?)/g,
      ': <span class="json-number">$1</span>',
    );
    const withVerbs = withNumbers.replace(
      /\b(GET|POST|PUT|PATCH|DELETE)\b/g,
      '<span class="json-url">$1</span>',
    );

    return `<code class="code-block__inner code-block__inner--${kind}">${withVerbs}</code>`;
  }

  formatRichText(content: string): string {
    return this.escapeHtml(content)
      .replace(/\b(AuthInterceptor|LoaderInterceptor|ErrorInterceptor|TransformInterceptor)\b/g, '<span class="text-accent">$1</span>')
      .replace(/\b(HTTP|request|response|errores|error|rol|token|backend|pipeline|Response|Request|DELETE)\b/gi, '<span class="text-primary">$1</span>')
      .replace(/\b(RxJS|ADMIN|401|403|500|activo|bloquea|transformado|transformada|modelo de vista)\b/gi, '<span class="text-accent">$1</span>');
  }

  formatFlowBanner(content: string): string {
    return this.escapeHtml(content)
      .replace(/(TransformInterceptor activo)/g, '<span class="flow-title">$1</span>')
      .replace(/(la respuesta fue convertida a un modelo de vista listo para la interfaz)/gi, '<span class="flow-desc">$1</span>')
      .replace(/(AuthInterceptor|LoaderInterceptor|ErrorInterceptor)/g, '<span class="flow-title">$1</span>');
  }

  statusPillClass(state: string): string {
    return `status-pill status-${state}`;
  }

  displayStateLabel(state: string): string {
    if (state === 'active') {
      return '● ACTIVO';
    }

    if (state === 'done') {
      return '✔ COMPLETADO';
    }

    if (state === 'error') {
      return '✖ ERROR';
    }

    if (state === 'blocked') {
      return '■ BLOQUEADO';
    }

    return 'IDLE';
  }

  formatLogEntry(elapsedMs: number, type: string, message: string): string {
    return `
      <span class="log-time">[${elapsedMs}ms]</span>
      <span class="log-${type}">${type.toUpperCase()}</span>
      <span class="log-text">${this.escapeHtml(message)}</span>
    `;
  }

  isDeleting(userId: number): boolean {
    return this.deletingUserId === userId;
  }

  private resolveStepState(stepId: string): string {
    return this.vm.pipelineSteps.find((step) => step.id === stepId)?.state || 'idle';
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
