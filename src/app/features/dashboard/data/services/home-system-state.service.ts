import { Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { filter, skip } from 'rxjs/operators';
import { AuthService } from 'src/app/core/auth/auth.service';
import { AppRole } from 'src/app/core/models/auth/auth.models';
import { ApiCrudStateService } from 'src/app/features/api/data/service/api-crud-state.service';
import { LoaderService } from 'src/app/features/interceptors-lab/data/services/loader.service';
import { NotificationService } from 'src/app/features/interceptors-lab/data/services/notification.service';
import { ReactiveLogEvent } from 'src/app/features/observables/data/models/ReactiveLogEvent.model';
import { User } from 'src/app/features/observables/data/models/User.model';
import { ObervablesLabService } from 'src/app/features/observables/data/services/observables-lab.service';

type ModuleState = 'active' | 'idle' | 'pending';
type TimelineType = 'info' | 'success' | 'warning';
type ModuleName = 'Auth' | 'Guards' | 'Interceptors' | 'Observables' | 'API';

export interface HomeModuleCard {
  name: ModuleName;
  icon: string;
  description: string;
  state: ModuleState;
  metrics: string;
  note?: string | null;
}

export interface HomeTimelineEvent {
  type: TimelineType;
  text: string;
  time: string;
  module: ModuleName | 'System';
  icon: string;
}

export interface HomeSystemViewModel {
  currentToken: string;
  lastAction: string;
  currentRole: string;
  activeModulesCount: number;
  lastEndpoint: string;
  systemStatus: 'OK' | 'ERROR';
  modules: HomeModuleCard[];
  timeline: HomeTimelineEvent[];
}

@Injectable({ providedIn: 'root' })
export class HomeSystemStateService implements OnDestroy {
  private readonly subscriptions = new Subscription();
  private readonly stateSubject = new BehaviorSubject<HomeSystemViewModel>(this.createInitialState());
  private observableCounter = 2;
  private pendingGuardTarget: 'admin' | 'guest' | null = null;
  private pendingHttpOrigin: 'Interceptors' | 'API' | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly apiCrudState: ApiCrudStateService,
    private readonly router: Router,
    private readonly observablesLabService: ObervablesLabService,
    private readonly loaderService: LoaderService,
    private readonly notificationService: NotificationService,
  ) {
    this.syncAuthState();
    this.watchRouter();
    this.watchObservableStreams();
    this.watchLoaderState();
    this.watchApiState();
  }

  state$(): Observable<HomeSystemViewModel> {
    return this.stateSubject.asObservable();
  }

  snapshot(): HomeSystemViewModel {
    return this.stateSubject.value;
  }

  setToken(role: AppRole): void {
    this.updateModuleState('Auth', 'pending');
    this.patchState({ lastAction: `Auth: asignando token ${role.toUpperCase()}` });

    this.subscriptions.add(
      this.authService.loginAsRole(role).subscribe({
        next: () => {
          this.syncAuthState();
          this.updateModuleState('Auth', 'active');
          this.addTimelineEvent('success', `Auth: token ${role.toUpperCase()} generado`, 'Auth');
          this.notificationService.success(`Token ${role.toUpperCase()} asignado correctamente.`);
        },
        error: (error: Error) => {
          this.syncAuthState();
          this.updateModuleState('Auth', 'idle');
          this.patchState({ lastAction: `Auth: no se pudo asignar ${role.toUpperCase()}` });
          this.addTimelineEvent('warning', `Auth: error al generar token ${role.toUpperCase()}`, 'Auth');
          this.notificationService.error(error.message || `No se pudo asignar el token ${role.toUpperCase()}.`);
        },
      }),
    );
  }

  probeGuard(role: 'admin' | 'guest'): void {
    const target = role === 'admin' ? '/guards/admin-dashboard' : '/guards/guest-dashboard';
    this.pendingGuardTarget = role;
    this.updateModuleNote('Guards', null);
    this.updateModuleState('Guards', 'pending');
    this.patchState({ lastAction: `Guards: probando ruta ${target}` });
    this.addTimelineEvent('info', `Guards: navegando a ${target}`, 'Guards');
    void this.router.navigate([target]);
  }

  triggerInterceptorRequest(): void {
    if (!this.hasAdminToken()) {
      this.updateModuleState('Interceptors', 'idle');
      this.updateModuleMetric('Interceptors', 'se requiere token ADMIN');
      this.updateModuleNote('Interceptors', 'El flujo de interceptors del Home requiere un token ADMIN antes de ejecutar requests reales.');
      this.patchState({ lastAction: 'Interceptors: request bloqueado por falta de token ADMIN' });
      this.addTimelineEvent('warning', 'Interceptors: request bloqueado por falta de token ADMIN', 'Interceptors');
      return;
    }

    this.updateModuleNote('Interceptors', null);
    this.pendingHttpOrigin = 'Interceptors';
    this.updateModuleState('Interceptors', 'pending');
    this.patchState({ lastAction: 'Interceptors: disparando GET /users' });
    this.addTimelineEvent('info', 'Interceptors: request GET /users enviado', 'Interceptors');
    this.apiCrudState.fetchUsers('Ultima accion: Usuarios cargados desde Home');
  }

  emitObservableEvent(): void {
    this.updateModuleState('Observables', 'active');
    this.patchState({ lastAction: 'Observables: emitiendo evento en el stream global' });
    this.observablesLabService.updateUser({
      id: this.observableCounter,
      nombre: `HomeEvent_${this.observableCounter}`,
    });
    this.observableCounter += 1;
  }

  fetchUsers(): void {
    if (!this.hasAdminToken()) {
      this.updateModuleState('API', 'idle');
      this.updateModuleMetric('API', 'se requiere token ADMIN');
      this.updateModuleNote('API', 'La tarjeta API del Home solo consume el backend cuando la sesion actual tiene permisos ADMIN.');
      this.patchState({ lastAction: 'API: request bloqueado por falta de token ADMIN' });
      this.addTimelineEvent('warning', 'API: request bloqueado por falta de token ADMIN', 'API');
      return;
    }

    this.updateModuleNote('API', null);
    this.pendingHttpOrigin = 'API';
    this.updateModuleState('API', 'pending');
    this.patchState({ lastAction: 'API: ejecutando GET /users' });
    this.addTimelineEvent('info', 'API: request GET /users enviado', 'API');
    this.apiCrudState.fetchUsers('Ultima accion: Usuarios cargados desde Home');
  }

  executeFullFlow(confirmNavigation?: () => Promise<boolean>): void {
    this.patchState({ lastAction: 'Flujo completo iniciado desde Home' });
    this.addTimelineEvent('info', 'Home: iniciando flujo completo', 'System');

    this.subscriptions.add(
      this.authService.loginAsRole('admin').subscribe({
        next: () => {
          this.syncAuthState();
          this.updateModuleState('Auth', 'active');
          this.addTimelineEvent('success', 'Auth: token ADMIN generado', 'Auth');
          this.triggerInterceptorRequest();
          void this.handleFlowGuardStep(confirmNavigation);
          this.emitObservableEvent();
        },
        error: (error: Error) => {
          this.updateModuleState('Auth', 'idle');
          this.notificationService.error(error.message || 'No se pudo ejecutar el flujo completo.');
          this.addTimelineEvent('warning', 'Home: el flujo completo se detuvo en Auth', 'System');
        },
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private watchRouter(): void {
    this.subscriptions.add(
      this.router.events
        .pipe(filter((event: unknown): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
          if (!this.pendingGuardTarget) {
            return;
          }

          const expected = this.pendingGuardTarget === 'admin'
            ? '/guards/admin-dashboard'
            : '/guards/guest-dashboard';

          const finalUrl = event.urlAfterRedirects;

          if (finalUrl === expected) {
            this.updateModuleState('Guards', 'active');
            this.updateModuleMetric('Guards', `${expected} permitido`);
            this.patchState({ lastAction: `Guards: acceso permitido a ${expected}` });
            this.addTimelineEvent('success', `Guards: acceso permitido a ${expected}`, 'Guards');
          } else {
            this.updateModuleState('Guards', 'idle');
            this.updateModuleMetric('Guards', `redirigido a ${finalUrl}`);
            this.patchState({ lastAction: `Guards: acceso bloqueado -> ${finalUrl}` });
            this.addTimelineEvent('warning', `Guards: acceso bloqueado, redireccion a ${finalUrl}`, 'Guards');
          }

          this.pendingGuardTarget = null;
        }),
    );
  }

  private watchObservableStreams(): void {
    this.subscriptions.add(
      this.observablesLabService.user$.pipe(skip(1)).subscribe((user: User) => {
        this.updateModuleState('Observables', 'active');
        this.updateModuleMetric('Observables', `ultimo usuario: ${user.nombre}`);
        this.patchState({ lastAction: `Observables: ${user.nombre} emitido al stream` });
        this.addTimelineEvent('success', `Observables: usuario ${user.nombre} emitido`, 'Observables');
      }),
    );

    this.subscriptions.add(
      this.observablesLabService.flowLog$.subscribe((event) => {
        this.addTimelineEvent('info', `Observables RxJS: ${(event as ReactiveLogEvent).label}`, 'Observables');
      }),
    );
  }

  private watchLoaderState(): void {
    this.subscriptions.add(
      this.loaderService.loading$.subscribe((loading) => {
        if (!this.pendingHttpOrigin) {
          return;
        }

        if (loading) {
          this.addTimelineEvent('info', `Loader: activado por ${this.pendingHttpOrigin}`, this.pendingHttpOrigin);
          return;
        }

        this.addTimelineEvent('info', `Loader: desactivado para ${this.pendingHttpOrigin}`, this.pendingHttpOrigin);
        this.pendingHttpOrigin = null;
      }),
    );
  }

  private watchApiState(): void {
    this.subscriptions.add(
      this.apiCrudState.state$().subscribe((state) => {
        this.patchState({
          lastEndpoint: state.lastEndpoint,
          systemStatus: state.error ? 'ERROR' : 'OK',
        });

        if (state.loadingUsers) {
          if (this.pendingHttpOrigin === 'Interceptors') {
            this.updateModuleState('Interceptors', 'pending');
            this.updateModuleMetric('Interceptors', 'request en curso');
          }

          if (this.pendingHttpOrigin === 'API') {
            this.updateModuleState('API', 'pending');
            this.updateModuleMetric('API', 'request en curso');
          }
          return;
        }

        if (!this.pendingHttpOrigin) {
          return;
        }

        if (state.error) {
          if (this.pendingHttpOrigin === 'Interceptors') {
            this.updateModuleState('Interceptors', 'idle');
            this.updateModuleMetric('Interceptors', 'request fallido');
            this.addTimelineEvent('warning', `Interceptors: request finalizo con error (${state.error})`, 'Interceptors');
          } else {
            this.updateModuleState('API', 'idle');
            this.updateModuleMetric('API', 'request fallido');
            this.addTimelineEvent('warning', `API: GET /users fallo (${state.error})`, 'API');
          }

          this.patchState({ lastAction: state.lastAction, systemStatus: 'ERROR' });
          return;
        }

        const userCount = state.users.length;

        if (this.pendingHttpOrigin === 'Interceptors') {
          this.updateModuleState('Interceptors', 'active');
          this.updateModuleMetric('Interceptors', `response ${state.lastStatus} (${userCount} usuarios)`);
          this.addTimelineEvent('success', `Interceptors: response ${state.lastStatus} recibida`, 'Interceptors');
        } else {
          this.updateModuleState('API', 'active');
          this.updateModuleMetric('API', `${userCount} usuarios cargados`);
          this.addTimelineEvent('success', `API: GET /users respondio ${state.lastStatus}`, 'API');
        }

        this.patchState({ lastAction: state.lastAction, systemStatus: 'OK' });
      }),
    );
  }

  private syncAuthState(): void {
    const token = this.authService.getToken();
    const role = this.authService.getRole();
    const isActive = !!token;

    this.patchState({
      currentToken: token ? this.buildTokenPreview(token) : 'sin-token',
      currentRole: role ? role.toUpperCase() : 'SIN ROL',
      lastAction: this.stateSubject.value.lastAction,
    });

    this.updateModuleState('Auth', isActive ? 'active' : 'idle');
    this.updateModuleMetric(
      'Auth',
      token ? `${role?.toUpperCase() || 'DESCONOCIDO'} | token activo` : 'sin sesion autenticada',
    );
  }

  private updateModuleState(name: ModuleName, state: ModuleState): void {
    const modules = this.stateSubject.value.modules.map((module) =>
      module.name === name ? { ...module, state } : module,
    );
    this.patchState({ modules });
  }

  private updateModuleMetric(name: ModuleName, metrics: string): void {
    const modules = this.stateSubject.value.modules.map((module) =>
      module.name === name ? { ...module, metrics } : module,
    );
    this.patchState({ modules });
  }

  private updateModuleNote(name: ModuleName, note: string | null): void {
    const modules = this.stateSubject.value.modules.map((module) =>
      module.name === name ? { ...module, note } : module,
    );
    this.patchState({ modules });
  }

  private addTimelineEvent(type: TimelineType, text: string, module: ModuleName | 'System'): void {
    const time = new Date().toLocaleTimeString();
    const timeline = [
      {
        type,
        text,
        time,
        module,
        icon: this.resolveTimelineIcon(module),
      },
      ...this.stateSubject.value.timeline,
    ].slice(0, 8);
    this.patchState({ timeline });
  }

  private buildTokenPreview(token: string): string {
    if (token.length <= 18) {
      return token;
    }

    return `${token.slice(0, 12)}...${token.slice(-4)}`;
  }

  private patchState(patch: Partial<HomeSystemViewModel>): void {
    const nextState = {
      ...this.stateSubject.value,
      ...patch,
    };

    nextState.activeModulesCount = nextState.modules.filter((module) => module.state === 'active').length;
    this.stateSubject.next(nextState);
  }

  private hasAdminToken(): boolean {
    return this.authService.isAuthenticated() && this.authService.getRole() === 'admin';
  }

  private async handleFlowGuardStep(confirmNavigation?: () => Promise<boolean>): Promise<void> {
    if (!confirmNavigation) {
      this.probeGuard('admin');
      return;
    }

    const shouldNavigate = await confirmNavigation();

    if (!shouldNavigate) {
      this.updateModuleState('Guards', 'idle');
      this.updateModuleMetric('Guards', 'redireccion cancelada en Home');
      this.updateModuleNote('Guards', 'Redireccion cancelada para mantener el flujo visible');
      this.patchState({ lastAction: 'Guards: redireccion cancelada por el usuario' });
      this.addTimelineEvent('warning', 'Guards: redireccion cancelada por el usuario', 'Guards');
      return;
    }

    this.probeGuard('admin');
  }

  private resolveTimelineIcon(module: ModuleName | 'System'): string {
    if (module === 'Auth') return '🔐';
    if (module === 'Guards') return '🛡️';
    if (module === 'Interceptors') return '⚙️';
    if (module === 'Observables') return '📡';
    if (module === 'API') return '🌐';
    return '🧭';
  }

  private createInitialState(): HomeSystemViewModel {
    return {
      currentToken: 'sin-token',
      currentRole: 'SIN ROL',
      lastAction: 'Dashboard inicializado',
      activeModulesCount: 0,
      lastEndpoint: 'Sin consumo reciente',
      systemStatus: 'OK',
      modules: [
        {
          name: 'Auth',
          icon: '🔐',
          description: 'Lee y cambia el token real desde AuthService.',
          state: 'idle',
          metrics: 'sin sesion autenticada',
          note: null,
        },
        {
          name: 'Guards',
          icon: '🛡️',
          description: 'Prueba rutas protegidas con navegacion real y RoleGuard.',
          state: 'idle',
          metrics: 'sin validaciones recientes',
          note: null,
        },
        {
          name: 'Interceptors',
          icon: '⚙️',
          description: 'Dispara requests reales que pasan por interceptors globales.',
          state: 'idle',
          metrics: 'sin request reciente',
          note: null,
        },
        {
          name: 'Observables',
          icon: '📡',
          description: 'Emite eventos sobre el stream real del laboratorio RxJS.',
          state: 'idle',
          metrics: 'sin emisiones recientes',
          note: null,
        },
        {
          name: 'API',
          icon: '🌐',
          description: 'Consume UserService real con GET /users.',
          state: 'idle',
          metrics: 'sin trafico reciente',
          note: null,
        },
      ],
      timeline: [
        {
          type: 'info',
          text: 'Dashboard inicializado',
          time: new Date().toLocaleTimeString(),
          module: 'System',
          icon: '🧭',
        },
      ],
    };
  }
}
