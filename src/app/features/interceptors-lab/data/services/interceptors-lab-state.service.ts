import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppRole } from 'src/app/core/models/auth/auth.models';
import {
  InterceptorsLabRequestContext,
  InterceptorsLabViewState,
  LogEntry,
  LogType,
  PipelineStep,
  ResultState,
  StepId,
} from '../models/interceptors-lab.models';

@Injectable({ providedIn: 'root' })
export class InterceptorsLabStateService {
  private readonly initialSteps: PipelineStep[] = [
    { id: 'request', label: 'Solicitud', detail: 'Inicio del flujo HTTP', state: 'idle' },
    { id: 'auth', label: 'AuthInterceptor', detail: 'Mutacion del token y validacion de rol', state: 'idle' },
    { id: 'loader', label: 'LoaderInterceptor', detail: 'Estado global de carga en la interfaz', state: 'idle' },
    { id: 'backend', label: 'Backend', detail: 'Llamada remota o bloqueo local del flujo', state: 'idle' },
    { id: 'response', label: 'Respuesta', detail: 'Transformacion y entrega final de datos', state: 'idle' },
  ];

  private readonly initialState: InterceptorsLabViewState = {
    tokenPreview: 'Sin token',
    role: 'Sin rol',
    authActive: false,
    loaderActive: false,
    errorActive: false,
    lastStatus: 'IDLE',
    statusTone: 'idle',
    requestOriginal: 'Sin request',
    requestIntercepted: 'Sin request',
    responseOriginal: 'Sin response',
    responseTransformed: 'Sin response',
    currentFlow: 'Ejecuta una accion para inspeccionar el pipeline HTTP real.',
    resultState: 'idle',
    resultMessage: 'Sin actividad reciente.',
    activeOperationLabel: 'Esperando accion',
    pipelineSteps: this.cloneSteps(),
    logEntries: [],
  };

  private readonly stateSubject = new BehaviorSubject<InterceptorsLabViewState>(this.initialState);
  private requestStartAt = 0;

  state$(): Observable<InterceptorsLabViewState> {
    return this.stateSubject.asObservable();
  }

  snapshot(): InterceptorsLabViewState {
    return this.stateSubject.value;
  }

  syncSession(token: string | null, role: AppRole | null): void {
    this.patchState({
      tokenPreview: this.buildTokenPreview(token),
      role: role ? role.toUpperCase() : 'Sin rol',
    });
  }

  startRequest(request: HttpRequest<unknown>, context: InterceptorsLabRequestContext): void {
    this.requestStartAt = performance.now();
    this.stateSubject.next({
      ...this.stateSubject.value,
      authActive: false,
      loaderActive: false,
      errorActive: false,
      lastStatus: 'RUNNING',
      statusTone: 'running',
      requestOriginal: this.formatRequest(request),
      requestIntercepted: this.formatRequest(request),
      responseOriginal: 'Esperando respuesta...',
      responseTransformed: context.transformResponse
        ? 'Esperando transformacion...'
        : 'Esperando respuesta...',
      currentFlow: `${request.method} ${context.label} -> Auth -> Loader -> Backend -> Response`,
      resultState: 'idle',
      resultMessage: 'Pipeline en ejecucion...',
      activeOperationLabel: context.label,
      pipelineSteps: this.cloneSteps().map((step) =>
        step.id === 'request' ? { ...step, state: 'active' } : step,
      ),
      logEntries: [],
    });
    this.pushLog('http', `Peticion iniciada -> ${request.method} ${context.label}`);
  }

  markAuthAttached(request: HttpRequest<unknown>, role: AppRole | null, hasToken: boolean): void {
    this.patchState({
      authActive: true,
      requestIntercepted: this.formatRequest(request),
      currentFlow: hasToken
        ? `AuthInterceptor activo -> token ${role?.toUpperCase() || 'UNKNOWN'} adjuntado`
        : 'AuthInterceptor activo -> request sin token',
    });
    this.setStepState('auth', 'active');
    this.pushLog(
      'auth',
      hasToken
        ? `AuthInterceptor -> Token ${role?.toUpperCase() || 'UNKNOWN'} adjuntado`
        : 'AuthInterceptor -> Request sin token disponible',
    );
  }

  markRequestBlocked(reason: string): void {
    this.patchState({
      authActive: false,
      errorActive: true,
      lastStatus: 'BLOCKED',
      statusTone: 'blocked',
      resultState: 'blocked',
      resultMessage: reason,
      currentFlow: 'Request -> AuthInterceptor -> BLOQUEADO (sin llamada al backend)',
      responseOriginal: 'La peticion fue bloqueada antes de llegar al backend.',
      responseTransformed: reason,
    });
    this.setStepState('auth', 'blocked');
    this.pushLog('auth', `AuthInterceptor -> Request bloqueado (${reason})`);
  }

  markLoaderOn(): void {
    this.patchState({
      loaderActive: true,
      currentFlow: 'LoaderInterceptor activo -> estado global de carga encendido',
    });
    this.setStepState('loader', 'active');
    this.pushLog('loader', 'Loader -> Activado');
  }

  markBackendDispatch(request: HttpRequest<unknown>): void {
    this.patchState({
      currentFlow: `Backend procesando ${request.method} ${request.url}`,
    });
    this.setStepState('backend', 'active');
    this.pushLog('http', `Backend -> Procesando ${request.method} ${request.url}`);
  }

  captureResponseOriginal(body: unknown, status: number): void {
    this.patchState({
      responseOriginal: this.prettyPrint(body),
      currentFlow: `Response ${status} recibida -> inspeccionando payload original`,
    });
    this.pushLog('http', `Respuesta ${status} recibida`);
  }

  captureResponseTransformed(body: unknown, message: string): void {
    this.patchState({
      responseTransformed: this.prettyPrint(body),
      currentFlow: message,
    });
    this.setStepState('response', 'done');
    this.patchState({
      authActive: false,
      errorActive: false,
      lastStatus: 'SUCCESS',
      statusTone: 'success',
      resultState: 'success',
      resultMessage: 'Pipeline completado correctamente.',
    });
    this.pushLog('transform', message);
  }

  markDeleteSuccess(username: string): void {
    this.patchState({
      resultState: 'success',
      resultMessage: `${username} fue eliminado y la lista quedo sincronizada.`,
      currentFlow: `DELETE completado -> la lista fue actualizada`,
    });
    this.pushLog('http', `DELETE completado -> ${username} eliminado`);
  }

  markError(error: HttpErrorResponse, flowMessage: string, resultState: ResultState): void {
    this.patchState({
      authActive: false,
      errorActive: true,
      lastStatus: 'ERROR',
      statusTone: 'error',
      resultState,
      resultMessage: flowMessage,
      currentFlow: flowMessage,
      responseOriginal: this.prettyPrint(error.error || { message: error.message, status: error.status }),
      responseTransformed: flowMessage,
    });
    this.setStepState('response', 'error');
    this.pushLog('error', `Error ${error.status || 0} detectado`);
  }

  markLoaderOff(): void {
    if (this.stateSubject.value.lastStatus === 'BLOCKED') {
      return;
    }

    this.patchState({
      loaderActive: false,
    });
    this.pushLog('loader', 'Loader -> Desactivado');
  }

  markFinalize(): void {
    if (this.stateSubject.value.lastStatus === 'BLOCKED') {
      return;
    }

    this.pushLog('finalize', 'Finalizacion del flujo ejecutada');
  }

  resetResultMessage(message: string): void {
    this.patchState({
      resultMessage: message,
    });
  }

  private setStepState(targetId: StepId, targetState: PipelineStep['state']): void {
    let found = false;
    const steps: PipelineStep[] = this.stateSubject.value.pipelineSteps.map((step): PipelineStep => {
      if (step.id === targetId) {
        found = true;
        return { ...step, state: targetState };
      }

      if (!found) {
        if (step.state === 'active') {
          return { ...step, state: 'done' };
        }

        if (step.state === 'idle') {
          return { ...step, state: 'done' };
        }
      }

      if (found && step.state !== 'error' && step.state !== 'blocked') {
        return { ...step, state: 'idle' };
      }

      return step;
    });

    this.patchState({ pipelineSteps: steps });
  }

  private pushLog(type: LogType, message: string): void {
    const elapsedMs = this.requestStartAt ? Math.max(0, Math.round(performance.now() - this.requestStartAt)) : 0;
    const logEntry: LogEntry = { type, message, elapsedMs };
    this.patchState({
      logEntries: [...this.stateSubject.value.logEntries, logEntry],
    });
  }

  private patchState(patch: Partial<InterceptorsLabViewState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...patch,
    });
  }

  private cloneSteps(): PipelineStep[] {
    return this.initialSteps.map((step) => ({ ...step }));
  }

  private formatRequest(request: HttpRequest<unknown>): string {
    const headerNames = request.headers.keys();
    const headerBlock = headerNames.length
      ? headerNames
          .map((name) => {
            const value = request.headers.get(name) || '';
            return `${name}: ${name.toLowerCase() === 'authorization' ? this.buildTokenPreview(value.replace('Bearer ', '')) : value}`;
          })
          .join(', ')
      : 'none';

    return `${request.method} ${request.urlWithParams}\nHeaders: { ${headerBlock} }`;
  }

  private buildTokenPreview(token: string | null): string {
    if (!token) {
      return 'Sin token';
    }

    if (token.length <= 18) {
      return token;
    }

    return `${token.slice(0, 12)}...${token.slice(-4)}`;
  }

  private prettyPrint(payload: unknown): string {
    if (payload === null || payload === undefined) {
      return 'null';
    }

    if (typeof payload === 'string') {
      return payload;
    }

    return JSON.stringify(payload, null, 2);
  }
}
