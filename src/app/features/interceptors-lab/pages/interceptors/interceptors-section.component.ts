import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';
import { AppRole } from 'src/app/core/models/auth/auth.models';
import { UserResponseDto } from 'src/app/core/models/users/users.models';
import { NotificationService } from '../../data/services/notification.service';
import { InterceptorTestService } from '../../data/services/interceptor-test.service';
import { LoaderService } from '../../data/services/loader.service';

type StepState = 'idle' | 'active' | 'done' | 'error';
type StepId = 'request' | 'auth' | 'loader' | 'backend' | 'response';
type LogType = 'http' | 'auth' | 'loader' | 'error' | 'finalize';

interface PipelineStep {
  id: StepId;
  label: string;
  detail: string;
  state: StepState;
}

interface LogEntry {
  type: LogType;
  message: string;
}

interface TimelineItem {
  key: string;
  label: string;
  active: boolean;
}


@Component({
  selector: 'app-interceptors-section',
  templateUrl: './interceptors-section.component.html',
  styleUrls: ['./interceptors-section.component.scss'],
})

export class InterceptorsSectionComponent implements OnInit, OnDestroy {

  token: string | null = null;
  users: string[] = [];
  loaderActive = false;
  authActive = false;
  errorActive = false;
  lastStatus = 'Idle';
  statusClass = 'status-badge inactive';
  currentErrorFlow = 'Sin simulación activa';

  readonly pipelineSteps: PipelineStep[] = [
    { id: 'request', label: 'Request', detail: 'Inicio HTTP request', state: 'idle' },
    { id: 'auth', label: 'AuthInterceptor', detail: 'Adjunta JWT automático', state: 'idle' },
    { id: 'loader', label: 'LoaderInterceptor', detail: 'Gestiona loading global', state: 'idle' },
    { id: 'backend', label: 'Backend', detail: 'Procesa endpoint simulado', state: 'idle' },
    { id: 'response', label: 'Response', detail: 'Entrega resultado final', state: 'idle' },
  ];

  readonly timeline: TimelineItem[] = [
    { key: 't0', label: 't0 start', active: false },
    { key: 't1', label: 't1 auth', active: false },
    { key: 't2', label: 't2 loader ON', active: false },
    { key: 't3', label: 't3 response', active: false },
    { key: 't4', label: 't4 finalize', active: false },
  ];

  readonly beforeRequest = `GET /api/users\nHeaders: {}`;
  interceptedRequest = 'GET /api/users\nHeaders: {}';

  logEntries: LogEntry[] = [];

  private readonly subscriptions = new Subscription();

  constructor(
    private interceptorTestService: InterceptorTestService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private loaderService: LoaderService,
  ) {
    this.token = this.authService.getToken();
  }

  ngOnInit(): void {
    this.refreshState();
    this.subscriptions.add(
      this.loaderService.loading$.subscribe((isLoading: boolean) => {
        this.loaderActive = isLoading;
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  sendRequest(): void {
    this.users = [];
    this.startPipeline('GET /api/users');

    this.subscriptions.add(
      this.interceptorTestService.getUsers().subscribe({
        next: (response: UserResponseDto[]) => {
          this.users = response.map((user: UserResponseDto) => user.username);
          this.markResponseSuccess(response.length);
          this.notificationService.success('Petición completada');
        },
        error: () => {
          this.markResponseError(500, 'Response error capturado en ErrorInterceptor');
        },
      }),
    );
  }

  simulate401(): void {
    this.runErrorSimulation(
      401,
      'Token inválido → logout + redirect login',
      () => this.interceptorTestService.simulate401(),
    );
  }

  simulate403(): void {
    this.runErrorSimulation(
      403,
      'Sin permisos → acceso denegado en UI',
      () => this.interceptorTestService.simulate403(),
    );
  }
  
  simulate500(): void {
    this.runErrorSimulation(
      500,
      'Error servidor → fallback UI + notificación global',
      () => this.interceptorTestService.simulate500(),
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
          this.refreshState();
          this.sendRequest();
        },
        error: (error: Error) => {
          this.notificationService.error(error.message);
        },
      }),
    );
  }

  private refreshState(): void {
    this.token = this.authService.getToken();
  }

  private startPipeline(endpoint: string): void {
    this.logEntries = [];
    this.errorActive = false;
    this.authActive = false;
    this.currentErrorFlow = 'Sin simulación activa';
    this.lastStatus = 'RUNNING';
    this.statusClass = 'status-badge running';
    this.interceptedRequest = this.beforeRequest;

    this.pipelineSteps.forEach((step: PipelineStep) => {
      step.state = 'idle';
    });

    this.timeline.forEach((item: TimelineItem) => {
      item.active = false;
    });

    this.activateStep('request', 't0');
    this.pushLog('http', `→ GET ${endpoint}`);

    window.setTimeout(() => {
      this.authActive = true;
      this.activateStep('auth', 't1');
      this.interceptedRequest = `GET /api/users\nHeaders: { Authorization: Bearer ${this.truncateToken()} }`;
      this.pushLog('auth', '→ Token attached by AuthInterceptor');
    }, 260);

    window.setTimeout(() => {
      this.activateStep('loader', 't2');
      this.pushLog('loader', `→ Loader ${this.loaderActive ? 'ON' : 'OFF'} (global state)`);
    }, 520);

    window.setTimeout(() => {
      this.activateStep('backend');
      this.pushLog('http', '→ Backend processing /api/users (delay 1000ms)');
    }, 760);
  }

  private markResponseSuccess(records: number): void {
    this.authActive = false;
    this.errorActive = false;
    this.activateStep('response', 't3');
    this.pushLog('http', `← 200 OK (${records} users)`);

    window.setTimeout(() => {
      this.timelineStep('t4');
      this.lastStatus = 'SUCCESS';
      this.statusClass = 'status-badge';
      this.pushLog('loader', '→ Loader OFF');
      this.pushLog('finalize', '→ finalize() executed');
    }, 220);
  }

  private markResponseError(statusCode: number, detail: string): void {
    this.authActive = false;
    this.errorActive = true;
    this.activateStep('response', 't3', true);
    this.pushLog('error', `← ${statusCode} ${detail}`);

    window.setTimeout(() => {
      this.timelineStep('t4');
      this.lastStatus = 'ERROR';
      this.statusClass = 'status-badge inactive';
      this.pushLog('loader', '→ Loader OFF');
      this.pushLog('finalize', '→ finalize() executed');
    }, 220);
  }

  private runErrorSimulation(
    statusCode: number,
    flow: string,
    requestFactory: () => ReturnType<InterceptorTestService['simulate401']>,
  ): void {
    this.users = [];
    this.currentErrorFlow = `Response ${statusCode} → ErrorInterceptor → ${flow}`;
    this.startPipeline(`/api/simulate/${statusCode}`);

    this.subscriptions.add(
      requestFactory().subscribe({
        error: () => {
          this.markResponseError(statusCode, flow);
        },
      }),
    );
  }

  private activateStep(stepId: StepId, timelineKey?: string, isError = false): void {
    let found = false;

    this.pipelineSteps.forEach((step: PipelineStep) => {
      if (!found && step.id === stepId) {
        step.state = isError ? 'error' : 'active';
        found = true;
        return;
      }

      if (!found && step.state !== 'error') {
        step.state = 'done';
        return;
      }

      if (step.state !== 'error') {
        step.state = 'idle';
      }
    });

    if (timelineKey) {
      this.timelineStep(timelineKey);
    }
  }

  private timelineStep(key: string): void {
    this.timeline.forEach((item: TimelineItem) => {
      if (item.key === key) {
        item.active = true;
      }
    });
  }

  private pushLog(type: LogType, message: string): void {
    this.logEntries = [...this.logEntries, { type, message }];
  }

  private truncateToken(): string {
    if (!this.token) {
      return 'N/A';
    }

    return `${this.token.slice(0, 12)}...`;
  }
}
