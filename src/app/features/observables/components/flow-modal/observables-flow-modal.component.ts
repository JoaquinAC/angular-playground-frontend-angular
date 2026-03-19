import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable, Subject, Subscription, forkJoin, interval, of, throwError, timer } from 'rxjs';
import {
  catchError,
  concatMap,
  debounceTime,
  delay,
  distinctUntilChanged,
  finalize,
  map,
  mergeMap,
  retry,
  shareReplay,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { ObervablesLabService } from 'src/app/features/observables/data/services/observables-lab.service';
import { User } from '../../data/models/User.model';
import { LogEvent } from '../../data/models/LogEvent.model';
import { TimelineStep } from '../../data/models/TimelineStep.model';

type DemoId = 'cold-hot' | 'reactive-input' | 'map-operators' | 'combine-streams' | 'error-resilience';
type StepStatus = 'idle' | 'running' | 'done' | 'error';

interface DemoTab {
  id: DemoId;
  title: string;
  summary: string;
}

interface StepMetric {
  emissions: number;
  errors: number;
  cancellations: number;
  latencyMs: number;
}

interface DemoExplanation {
  whatIsHappening: string;
  operator: string;
  effect: string;
}

@Component({
  selector: 'app-observables-flow-modal',
  templateUrl: './observables-flow-modal.component.html',
  styleUrls: ['./observables-flow-modal.component.scss'],
})
export class ObservablesFlowModalComponent implements OnInit, OnDestroy {

  activeUser!: User;
  logs: LogEvent[] = [];
  runId = 1;
  runtimeStatus = {
    running: 'Esperando acción.',
    cancelled: 'Nada cancelado todavía.',
    sustained: 'La suscripción principal permanece activa.',
  };

  tabs: DemoTab[] = [
    { id: 'cold-hot', title: 'Cold vs Hot', summary: 'Muestra ejecuciones duplicadas vs stream compartido.' },
    { id: 'reactive-input', title: 'Input Reactivo', summary: 'Debounce + distinct + switchMap con cancelación visible.' },
    { id: 'map-operators', title: 'Map Operators', summary: 'Compara switchMap, mergeMap y concatMap en tiempo real.' },
    { id: 'combine-streams', title: 'Combine Streams', summary: 'Diferencias entre combineLatest y forkJoin.' },
    { id: 'error-resilience', title: 'Errores + Retry', summary: 'Demuestra retry + catchError y fallback controlado.' },
  ];

  demoExplanations: Record<DemoId, DemoExplanation> = {
    'cold-hot': {
      whatIsHappening: 'Lanzas la misma fuente dos veces para ver cuándo se repite el trabajo y cuándo se comparte.',
      operator: 'shareReplay(1)',
      effect: 'Evita duplicar llamadas y entrega cache al segundo suscriptor.',
    },
    'reactive-input': {
      whatIsHappening: 'Cada búsqueda espera una pausa corta antes de consultar para no saturar el backend.',
      operator: 'debounceTime + distinctUntilChanged + switchMap',
      effect: 'Cancela búsquedas viejas y deja viva solo la intención más reciente.',
    },
    'map-operators': {
      whatIsHappening: 'Una fuente emite tareas y comparas cómo cada operador coordina su ejecución.',
      operator: 'switchMap vs mergeMap vs concatMap',
      effect: 'Visualizas cancelación, paralelo y cola secuencial en una misma demo.',
    },
    'combine-streams': {
      whatIsHappening: 'Dos flujos se coordinan para mostrar actualización parcial y resultado final consolidado.',
      operator: 'switchMap + forkJoin',
      effect: 'Primero ves progreso, luego una respuesta final unificada.',
    },
    'error-resilience': {
      whatIsHappening: 'Simulas errores controlados para observar reintentos y plan de contingencia.',
      operator: 'retry + catchError',
      effect: 'Se intenta recuperar sin romper la UI y se aplica fallback si falla todo.',
    },
  };

  activeTab: DemoId = 'cold-hot';
  searchTerm = '';
  searchResult = 'Escribe y ejecuta una búsqueda reactiva.';

  timeline: TimelineStep[] = [
    { operator: 'source', label: 'source', active: false },
    { operator: 'map', label: 'map', active: false },
    { operator: 'filter', label: 'filter', active: false },
    { operator: 'debounce', label: 'debounce', active: false },
    { operator: 'subscriber', label: 'subscribe', active: false },
  ];
  
  stepStatus: Record<string, StepStatus> = {
    source: 'idle',
    map: 'idle',
    filter: 'idle',
    debounce: 'idle',
    subscriber: 'idle',
  };

  metrics: StepMetric = {
    emissions: 0,
    errors: 0,
    cancellations: 0,
    latencyMs: 0,
  };

  private searchInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  private subs = new Subscription();

  constructor(
    private labService: ObervablesLabService,
    private dialogRef: MatDialogRef<ObservablesFlowModalComponent>,
  ) {}

  ngOnInit(): void {
    this.bindCoreStreams();
    this.bindReactiveSearch();
  }

  get activeTabSummary(): string {
    return this.tabs.find((tab) => tab.id === this.activeTab)?.summary ?? '';
  }

   get activeExplanation(): DemoExplanation {
    return this.demoExplanations[this.activeTab];
  }

  get groupedLogs(): { runId: number; events: LogEvent[] }[] {
    const groups = new Map<number, LogEvent[]>();
    for (const log of this.logs) {
      if (!groups.has(log.runId)) {
        groups.set(log.runId, []);
      }
      groups.get(log.runId)?.push(log);
    }

    return [...groups.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([runId, events]) => ({ runId, events }));
  }

  setTab(tab: DemoId): void {
    this.activeTab = tab;
    this.resetDemoView();
    this.pushLog('info', `Demo activa → ${tab}`, 'Cambiaste de escenario para observar otro comportamiento.');
  }

  triggerSearch(): void {
    this.searchInput$.next(this.searchTerm.trim());
  }

  runColdVsHot(): void {
    this.startRun();
    const start = performance.now();

    const cold$ = this.mockHttp('cold-request').pipe(
      tap(() => this.runStep('source', 'Cold source emitido', 'La fuente se ejecuta de nuevo por cada suscriptor.')),
    );

     cold$.subscribe(() => this.pushLog('warning', 'Cold subscriber #1 recibió respuesta única.', 'Este resultado no se comparte con otros suscriptores.'));
    cold$.subscribe(() => {
      this.metrics.cancellations += 1;
      this.runtimeStatus.cancelled = 'No hay cancelación, pero sí trabajo duplicado en la fuente fría.';
      this.pushLog('warning', 'Cold subscriber #2 disparó una segunda ejecución.', 'Se repitió el costo porque cada suscripción inicia desde cero.');
    });

    const hot$ = this.mockHttp('hot-request').pipe(shareReplay(1));
    hot$.subscribe(() => this.pushLog('info', 'Hot subscriber #1 comparte ejecución.', 'Se crea una sola ejecución para múltiples consumidores.'));
    hot$.subscribe(() => this.pushLog('info', 'Hot subscriber #2 reutiliza cache.', 'El segundo suscriptor recibe el valor sin reejecutar la fuente.'));

    this.finishDemo(start);
  }

  runMapComparison(): void {
    this.startRun();
    const start = performance.now();

    const source$ = interval(180).pipe(
      take(3),
      tap((idx) => this.runStep('source', `Source emitió tarea ${idx + 1}`, 'Ingresó una nueva tarea al pipeline.')),
      map((idx) => `T${idx + 1}`),
    );

    source$
      .pipe(switchMap((id) => this.mockHttp(`switchMap:${id}`, 320)))
      .subscribe(() => {
        this.runtimeStatus.cancelled = 'switchMap canceló tareas anteriores para priorizar la última.';
        this.metrics.cancellations += 1;
        this.pushLog('info', 'switchMap priorizó la última tarea.', 'Canceló procesos previos para mantener respuesta actual.');
      });

    source$
      .pipe(mergeMap((id) => this.mockHttp(`mergeMap:${id}`, 320)))
      .subscribe(() => this.pushLog('info', 'mergeMap ejecutó tareas en paralelo.', 'Permite concurrencia y mayor throughput.'));

    source$
      .pipe(concatMap((id) => this.mockHttp(`concatMap:${id}`, 320)))
      .subscribe(() => this.pushLog('info', 'concatMap mantuvo orden FIFO.', 'Procesó una tarea a la vez respetando secuencia.'));

    this.finishDemo(start);
  }

  runCombineStreams(): void {
    this.startRun();
    const start = performance.now();

    const profile$ = this.mockHttp('perfil', 240).pipe(map(() => 'perfil:listo'));
    const permissions$ = this.mockHttp('permisos', 420).pipe(map(() => 'permisos:listos'));

    profile$
      .pipe(
        switchMap((profile) => permissions$.pipe(map((permissions) => `${profile} + ${permissions}`))),
      )
      .subscribe((value) => {
        this.runStep('map', `update parcial: ${value}`, 'El flujo avanza aunque no todo haya terminado.');
        this.pushLog('info', `Actualización parcial: ${value}`, 'Puedes renderizar progreso mientras llegan datos pendientes.');
      });

    forkJoin([profile$, permissions$]).subscribe(([profile, permissions]) => {
      this.runStep('subscriber', 'forkJoin entregó respuesta final agregada', 'Ya completaron ambos streams.');
      this.pushLog('info', `forkJoin final: ${profile} + ${permissions}`, 'Ahora sí tienes el paquete completo para UI final.');
      this.finishDemo(start);
    });
  }

  runErrorResilience(): void {
    this.startRun();
    const start = performance.now();

    let attempts = 0;
    of('request')
      .pipe(
        switchMap(() => {
          attempts++;
          this.runStep('source', `Intento ${attempts}`, 'Se ejecuta una nueva tentativa automática.');
          return attempts < 3 ? throwError(() => new Error('500 simulated')) : of('ok').pipe(delay(120));
        }),
        retry(2),
        catchError(() => {
          this.markError('retry agotado, aplicando fallback', 'Se protegió la experiencia con un valor alterno.');
          return of('fallback-data');
        }),
      )
      .subscribe((response) => {
        this.runStep('subscriber', `Respuesta final: ${response}`, 'El consumidor recibió una salida estable.');
        this.finishDemo(start);
      });
  }

  resetDemoView(): void {
    this.stepStatus = {
      source: 'idle',
      map: 'idle',
      filter: 'idle',
      debounce: 'idle',
      subscriber: 'idle',
    };
    this.timeline = this.timeline.map((step) => ({ ...step, active: false }));
    this.metrics = { emissions: 0, errors: 0, cancellations: 0, latencyMs: 0 };
    this.logs = [];
    this.runId += 1;
    this.runtimeStatus = {
      running: 'Esperando acción.',
      cancelled: 'Nada cancelado todavía.',
      sustained: 'La suscripción principal permanece activa.',
    };
  }

  close(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subs.unsubscribe();
  }

  private startRun(): void {
    this.resetDemoView();
    this.runtimeStatus.running = `Ejecutando demo: ${this.activeTab}.`;
  }

  private bindCoreStreams(): void {
    this.subs.add(
      this.labService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
        this.activeUser = user;
      }),
    );

    // Historial (ReplaySubject)
    this.subs.add(
      this.labService.flowLog$.pipe(takeUntil(this.destroy$)).subscribe((event) => {
        this.runStep(event.operator, event.label, 'Evento propagado desde el laboratorio principal.');
      }),
    );
  }  

  private bindReactiveSearch(): void {
    this.subs.add(
      this.searchInput$
        .pipe(
          debounceTime(350),
          distinctUntilChanged(),
          tap(() => this.runStep('debounce', 'debounceTime + distinctUntilChanged', 'Esperamos pausa y evitamos consultas repetidas.')),
          switchMap((term) => {
            if (!term) {
              this.metrics.cancellations += 1;
              this.runtimeStatus.cancelled = 'Se canceló la búsqueda por falta de término.';
              return of('Sin término de búsqueda.');
            }
            this.runStep('map', 'switchMap cancela peticiones previas', 'Se mantiene solo la búsqueda más reciente.');
            this.runtimeStatus.cancelled = 'SwitchMap está cancelando requests viejas.';
            return this.mockHttp(`search:${term}`, 360).pipe(map(() => `Resultado para: ${term}`));
          }),
        )
        .subscribe((result) => {
          this.searchResult = result;
          this.runStep('subscriber', result, 'La interfaz ya puede renderizar el resultado final.');
        }),
    );
  }

  private runStep(operator: string, label: string, explanation: string): void {
    this.stepStatus[operator] = 'running';
    this.timeline = this.timeline.map((step) => ({ ...step, active: step.operator === operator }));
    this.metrics.emissions += 1;

    this.runtimeStatus.running = `${operator} ejecutándose ahora.`;
    this.runtimeStatus.sustained = 'El resto de nodos mantiene su último estado hasta el siguiente evento.';

    this.pushLog('info', `${operator} → ${label}`, explanation);

    timer(240)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.stepStatus[operator] = 'done';
      });
  }

  private markError(message: string, humanMessage: string): void {
    this.stepStatus.subscriber = 'error';
    this.metrics.errors += 1;
    this.runtimeStatus.running = 'El flujo encontró un error controlado.';
    this.pushLog('error', `error → ${message}`, humanMessage);
  }

  private finishDemo(start: number): void {
    this.metrics.latencyMs = Math.round(performance.now() - start);
  }

  private mockHttp(label: string, ms = 220): Observable<string> {
    return of(label).pipe(
      tap(() => this.runStep('filter', `validación previa de ${label}`, 'Se evalúan condiciones antes de resolver la llamada.')),
      delay(ms),
      finalize(() => this.pushLog('info', `http simulado completado: ${label}`, 'La simulación finalizó y liberó el recurso temporal.')),
    );
  }

  private pushLog(level: LogEvent['level'], technicalAction: string, humanExplanation: string): void {
    this.logs.unshift({
      time: new Date().toLocaleTimeString(),
      technicalAction,
      humanExplanation,
      runId: this.runId,
      level,
    });

    if (this.logs.length > 24) {
      this.logs.pop();
    }
  }
}
