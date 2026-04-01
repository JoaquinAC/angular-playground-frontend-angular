import { animate, style, transition, trigger } from '@angular/animations';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';
import { AppRole } from 'src/app/core/models/auth/auth.models';
import { CreateUserRequestDto } from 'src/app/features/api/data/models/create-user-request.dto';
import { UserResponseDto } from 'src/app/features/api/data/models/user-response.dto';
import { ApiCrudStateService } from 'src/app/features/api/data/service/api-crud-state.service';
import {
  HttpErrorAdapterService,
  NormalizedHttpError,
} from 'src/app/features/interceptors-lab/data/services/http-error-adapter.service';
import { NotificationService } from 'src/app/features/interceptors-lab/data/services/notification.service';
import { environment } from 'src/environments/environment';

type HttpTone = 'idle' | 'success' | 'error' | 'loading';

@Component({
  selector: 'app-api-section',
  templateUrl: './api-section.component.html',
  styleUrls: ['./api-section.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class ApiSectionComponent implements OnInit, OnDestroy {
  users: UserResponseDto[] = [];
  lastResponse: unknown = { message: 'Sin respuesta todavia.' };
  lastStatus: number | null = null;
  lastAction = 'Sin acciones recientes.';
  role: 'admin' | 'guest' = 'guest';
  loadingUsers = false;
  creatingUser = false;
  deletingUserId: number | null = null;
  pendingDeleteId: number | null = null;
  createPanelOpen = false;
  httpTone: HttpTone = 'idle';
  switchingRole = false;

  readonly endpoint = '/api/users';
  readonly createUserForm: FormGroup;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly apiCrudState: ApiCrudStateService,
    private readonly authService: AuthService,
    private readonly errorAdapter: HttpErrorAdapterService,
    private readonly notificationService: NotificationService,
    private readonly formBuilder: FormBuilder,
  ) {
    this.createUserForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    this.resolveRole();
    this.preparePresetForm();
    this.subscriptions.add(
      this.apiCrudState.state$().subscribe((state) => {
        this.users = state.users;
        this.lastResponse = state.lastResponse;
        this.lastStatus = state.lastStatus;
        this.lastAction = state.lastAction;
        this.loadingUsers = state.loadingUsers;
        this.creatingUser = state.creatingUser;
        this.deletingUserId = state.deletingUserId;
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get isAdmin(): boolean {
    return this.role === 'admin';
  }

  get isBusy(): boolean {
    return this.loadingUsers || this.creatingUser || this.deletingUserId !== null || this.switchingRole;
  }

  get statusLabel(): string {
    if (this.loadingUsers || this.creatingUser || this.deletingUserId !== null) {
      return 'LOADING';
    }

    if (this.httpTone === 'success') {
      return 'SUCCESS';
    }

    if (this.httpTone === 'error') {
      return 'ERROR';
    }

    return 'IDLE';
  }

  getUsers(): void {
    this.pendingDeleteId = null;
    this.httpTone = 'loading';
    this.apiCrudState.fetchUsers('Ultima accion: Usuarios cargados');
  }

  toggleCreatePanel(): void {
    this.createPanelOpen = !this.createPanelOpen;
    if (this.createPanelOpen) {
      this.preparePresetForm();
    }
  }

  setGuestToken(): void {
    this.switchRole('guest');
  }

  setAdminToken(): void {
    this.switchRole('admin');
  }

  formatCreatePanelTitle(content: string): string {
    return this.escapeHtml(content)
      .replace(/\b(Crear usuario)\b/gi, '<span class="text-accent">$1</span>')
      .replace(/\b(preconfigurado)\b/gi, '<span class="text-primary">$1</span>');
  }

  formatCreatePanelText(content: string): string {
    return this.escapeHtml(content)
      .replace(/\b(formulario|validaciones|minimas)\b/gi, '<span class="text-secondary">$1</span>')
      .replace(/\b(listo|enviar|POST)\b/gi, '<span class="text-accent">$1</span>');
  }

  submitCreateUser(): void {
    if (!this.isAdmin || this.createUserForm.invalid || this.creatingUser) {
      this.createUserForm.markAllAsTouched();
      return;
    }

    this.httpTone = 'loading';
    this.apiCrudState.createUser(this.createUserForm.getRawValue() as CreateUserRequestDto).subscribe({
      next: () => {
        this.createPanelOpen = false;
        this.preparePresetForm();
        this.notificationService.success('Usuario creado');
        this.apiCrudState.fetchUsers('Ultima accion: Usuario creado correctamente');
      },
      error: (error: HttpErrorResponse) => {
        this.applyErrorState('Error al crear usuario', error);
        this.notificationService.error('Error al crear usuario');
      },
    });
  }

  askDelete(userId: number): void {
    if (!this.isAdmin) {
      return;
    }

    this.pendingDeleteId = this.pendingDeleteId === userId ? null : userId;
  }

  cancelDelete(): void {
    this.pendingDeleteId = null;
  }

  confirmDelete(user: UserResponseDto): void {
    if (!this.isAdmin || this.deletingUserId !== null) {
      return;
    }

    this.httpTone = 'loading';
    this.apiCrudState.deleteUser(user.id, user.username).subscribe({
      next: () => {
        this.pendingDeleteId = null;
        this.notificationService.success('Usuario eliminado');
      },
      error: (error: HttpErrorResponse) => {
        this.applyErrorState('Error al eliminar usuario', error);
        this.notificationService.error('Error al eliminar usuario');
      },
    });
  }

  formatResponse(payload: unknown): string {
    return JSON.stringify(payload, null, 2);
  }

  formatJson(content: string): string {
    const escaped = this.escapeHtml(content);
    const withUrls = escaped.replace(/(https?:\/\/[^\s"<]+|\/api\/[^\s"<]*)/g, '<span class="json-url">$1</span>');
    const withHeaders = withUrls.replace(/\b(status|code|message|errors|deletedUserId|username|email|role|createdAt)\b/gi, '<span class="json-key">$1</span>');
    const withBraces = withHeaders.replace(/([{}[\]])/g, '<span class="json-brace">$1</span>');
    const withNulls = withBraces.replace(/\b(null|undefined|true|false)\b/g, '<span class="json-null">$1</span>');
    const withStrings = withNulls.replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>');
    const withNumbers = withStrings.replace(/:\s*(-?\d+(\.\d+)?)/g, ': <span class="json-value">$1</span>');
    return `<code class="json-viewer__inner">${withNumbers}</code>`;
  }

  formatRichText(content: string): string {
    return this.escapeHtml(content)
      .replace(/\b(GET|POST|DELETE|DTOs|CRUD|ADMIN|loading|success|error|backend|usuarios|usuario)\b/gi, '<span class="text-accent">$1</span>')
      .replace(/\b(HTTP|servicios|feedback|tabla|estado|respuesta|acciones|endpoint)\b/gi, '<span class="text-primary">$1</span>');
  }

  isPendingDelete(userId: number): boolean {
    return this.pendingDeleteId === userId;
  }

  isDeleting(userId: number): boolean {
    return this.deletingUserId === userId;
  }

  preparePresetForm(): void {
    const suffix = Math.floor(Date.now() / 1000).toString().slice(-5);
    this.createUserForm.reset({
      username: `guest_${suffix}`,
      email: `guest_${suffix}@test.com`,
      password: '123456',
    });
  }

  private resolveRole(): void {
    this.role = this.authService.getRole() ?? 'guest';
  }

  private switchRole(role: AppRole): void {
    this.switchingRole = true;
    this.subscriptions.add(
      this.authService.loginAsRole(role).subscribe({
        next: () => {
          this.switchingRole = false;
          this.resolveRole();
          if (role === 'guest') {
            this.createPanelOpen = false;
            this.pendingDeleteId = null;
            this.users = []; // Clear users for guest
            this.lastResponse = { message: 'Rol GUEST no tiene acceso a la lista de usuarios.' };
            this.lastAction = 'Sesion GUEST activada - acceso limitado';
          } else {
            this.getUsers();
          }
          this.notificationService.success(
            role === 'admin' ? 'Sesion ADMIN activada' : 'Sesion INVITADO activada',
          );
        },
        error: (error: Error) => {
          this.recoverDemoAccess(role, error);
        },
      }),
    );
  }

  private recoverDemoAccess(role: AppRole, originalError: Error): void {
    const credentials = environment.demoCredentials[role];
    const loginValue = credentials.username;
    const recoveryDto: CreateUserRequestDto = {
      username: loginValue.includes('@') ? `${role}_demo` : loginValue,
      email: loginValue.includes('@') ? loginValue : `${loginValue}@test.com`,
      password: credentials.password,
    };

    this.subscriptions.add(
      this.authService.register(recoveryDto).subscribe({
        next: () => {
          this.retryRoleLogin(role);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 409 || error.status === 400) {
            this.retryRoleLogin(role);
            return;
          }

          this.switchingRole = false;
          this.notificationService.error(originalError.message || 'No se pudo cambiar el token de sesion');
        },
      }),
    );
  }

  private retryRoleLogin(role: AppRole): void {
    this.subscriptions.add(
      this.authService.loginAsRole(role).subscribe({
        next: () => {
          this.switchingRole = false;
          this.resolveRole();
          if (role === 'guest') {
            this.createPanelOpen = false;
            this.pendingDeleteId = null;
            this.users = []; // Clear users for guest
            this.lastResponse = { message: 'Rol GUEST no tiene acceso a la lista de usuarios.' };
            this.lastAction = 'Sesion GUEST activada - acceso limitado';
          } else {
            this.getUsers();
          }
          this.notificationService.success(
            role === 'admin' ? 'Sesion ADMIN activada' : 'Sesion INVITADO activada',
          );
        },
        error: (error: Error) => {
          this.switchingRole = false;
          this.notificationService.error(error.message || 'No se pudo cambiar el token de sesion');
        },
      }),
    );
  }

  private applyErrorState(contextMessage: string, error: HttpErrorResponse): void {
    const normalized = this.errorAdapter.adapt(error);
    this.lastStatus = normalized.status;
    this.lastResponse = this.mapErrorForUi(normalized);
    this.lastAction = `${contextMessage}: ${normalized.message}`;
    this.httpTone = 'error';
  }

  private mapErrorForUi(error: NormalizedHttpError): unknown {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
      errors: error.fieldErrors,
    };
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
