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
import { LogCategory, LogEvent } from '../../data/models/LogEvent.model';
import { TimelineStep } from '../../data/models/TimelineStep.model';
import { User } from '../../data/models/User.model';
type DemoId =
  | 'cold-hot'
  | 'reactive-input'
  | 'map-operators'
  | 'combine-streams'
  | 'error-resilience';
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
  whatItDoes: string;
  whyItMatters: string;
  visibleResult: string;
  flowBullets: string[];
}

interface ColdHotCard {
  mode: 'cold' | 'hot';
  title: string;
  summary: string;
  detailA: string;
  detailB: string;
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
    now: 'Elige una demo para ver el siguiente cambio importante.',
    cancelled: 'Todavía no hubo nada que frenar o reutilizar.',
    ui: 'La interfaz está lista para mostrar el siguiente resultado.',
  };

  tabs: DemoTab[] = [
    {
      id: 'cold-hot',
      title: 'Cold vs Hot',
      summary: 'Compara repetir una ejecución contra compartir el mismo resultado.',
    },
    {
      id: 'reactive-input',
      title: 'Input Reactivo',
      summary: 'Evita llamadas innecesarias y conserva solo la última búsqueda útil.',
    },
    {
      id: 'map-operators',
      title: 'Map Operators',
      summary: 'Compara cancelar, paralelizar o respetar el orden de las tareas.',
    },
    {
      id: 'combine-streams',
      title: 'Combine Streams',
      summary: 'Muestra progreso parcial y luego una respuesta final completa.',
    },
    {
      id: 'error-resilience',
      title: 'Errores + Retry',
      summary: 'Mantiene viva la UI aunque una llamada falle varias veces.',
    },
  ];

  demoExplanations: Record<DemoId, DemoExplanation> = {
    'cold-hot': {
      whatItDoes: 'Cold repite la ejecución. Hot comparte el resultado ya generado.',
      whyItMatters: 'Evita trabajo duplicado cuando varias partes de la UI necesitan lo mismo.',
      visibleResult: 'Verás qué suscriptor ejecuta de nuevo y cuál reutiliza la respuesta.',
      flowBullets: [
        'Cold: sub 1 ejecuta.',
        'Cold: sub 2 vuelve a ejecutar.',
        'Hot: el segundo suscriptor reutiliza.',
      ],
    },
    'reactive-input': {
      whatItDoes: 'Evita llamadas innecesarias al backend mientras escribes.',
      whyItMatters: 'Solo se ejecuta la última búsqueda útil.',
      visibleResult: 'La UI muestra el resultado final sin mezclar respuestas viejas.',
      flowBullets: [
        'Esperando que dejes de escribir.',
        'Cancelando búsquedas anteriores.',
        'Ejecutando la última intención.',
      ],
    },
    'map-operators': {
      whatItDoes: 'Muestra tres formas de procesar varias tareas desde la misma fuente.',
      whyItMatters: 'Te ayuda a elegir entre priorizar lo último, correr todo o respetar el orden.',
      visibleResult: 'Verás cancelación, paralelo y cola ordenada en una sola corrida.',
      flowBullets: [
        'switchMap deja viva la más reciente.',
        'mergeMap deja correr varias a la vez.',
        'concatMap respeta turno por turno.',
      ],
    },
    'combine-streams': {
      whatItDoes: 'Combina dos fuentes para mostrar avance y cierre final.',
      whyItMatters: 'La UI puede sentirse rápida sin perder consistencia al final.',
      visibleResult: 'Primero aparece progreso parcial y luego el paquete completo.',
      flowBullets: [
        'Llega una parte de la respuesta.',
        'La UI ya puede mostrar avance.',
        'Al final se consolida todo.',
      ],
    },
    'error-resilience': {
      whatItDoes: 'Reintenta una llamada y activa un fallback si sigue fallando.',
      whyItMatters: 'La interfaz no colapsa por un error puntual.',
      visibleResult: 'Verás intentos, recuperación y una salida segura para la UI.',
      flowBullets: [
        'Se intenta otra vez automáticamente.',
        'Si no alcanza, se activa fallback.',
        'La UI sigue mostrando algo útil.',
      ],
    },
  };

  coldHotCards: ColdHotCard[] = [
    {
      mode: 'cold',
      title: 'COLD',
      summary: 'Cada suscriptor ejecuta la fuente otra vez.',
      detailA: 'sub 1 → ejecuta',
      detailB: 'sub 2 → vuelve a ejecutar',
    },
    {
      mode: 'hot',
      title: 'HOT',
      summary: 'Todos los suscriptores comparten el mismo resultado.',
      detailA: 'sub 1 → ejecuta',
      detailB: 'sub 2 → reutiliza',
    },
  ];

  activeTab: DemoId = 'cold-hot';
  searchTerm = '';
  searchResult = 'Escribe un término para ver cómo solo sobrevive la última búsqueda útil.';

  timeline: TimelineStep[] = [
    {
      operator: 'source',
      label: 'entrada',
      description: 'arranca el flujo',
      detail: 'Aquí nace la acción que dispara la demo.',
      active: false,
    },
    {
      operator: 'map',
      label: 'proceso',
      description: 'decide qué sigue',
      detail: 'El flujo transforma o prioriza la siguiente acción.',
      active: false,
    },
    {
      operator: 'filter',
      label: 'validación',
      description: 'confirma si avanza',
      detail: 'Se revisa si la siguiente ejecución vale la pena.',
      active: false,
    },
    {
      operator: 'debounce',
      label: 'pausa',
      description: 'espera el momento útil',
      detail: 'Evita reaccionar demasiado rápido cuando llegan muchos eventos.',
      active: false,
    },
    {
      operator: 'subscriber',
      label: 'resultado',
      description: 'actualiza la UI',
      detail: 'El valor final ya se puede mostrar en pantalla.',
      active: false,
    },
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
  private reactiveSearchStartedAt = 0;

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

  get activeTimelineStep(): TimelineStep | undefined {
    return (
      this.timeline.find((step) => step.active) ??
      this.timeline.find((step) => this.stepStatus[step.operator] === 'running')
    );
  }

  get runtimeHighlights(): string[] {
    return [this.runtimeStatus.now, this.runtimeStatus.cancelled, this.runtimeStatus.ui];
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
      .map(([runId, events]) => ({
        runId,
        events: events.map((event, index) => ({ ...event, isCurrent: index === 0 })),
      }));
  }

  setTab(tab: DemoId): void {
    this.activeTab = tab;
    this.resetDemoView();
    this.pushLog(
      'state',
      'info',
      `Demo activa → ${tab}`,
      'Cambiaste de escenario para ver otro problema real resuelto con RxJS.',
      'Escenario listo',
    );
  }

  triggerSearch(): void {
    this.reactiveSearchStartedAt = performance.now();
    this.startRun('Esperando una pausa útil antes de lanzar la búsqueda.');
    this.searchInput$.next(this.searchTerm.trim());
  }

  runColdVsHot(): void {
    this.startRun('Comparando una fuente que repite trabajo con otra que lo comparte.');
    const start = performance.now();

    const cold$ = this.mockHttp('cold-request').pipe(
      tap(() =>
        this.runStep(
          'source',
          'Cold source emitido',
          'La fuente fría vuelve a empezar cada vez que alguien se suscribe.',
          'Cold: se volvió a disparar una ejecución.',
          'operator',
        ),
      ),
    );

    cold$.subscribe(() => {
      this.pushLog(
        'result',
        'warning',
        'Cold subscriber #1 recibió respuesta única.',
        'El primer suscriptor obtuvo un valor propio, pero nadie más puede reutilizarlo.',
        'Resultado aislado',
      );
    });
    cold$.subscribe(() => {
      this.metrics.cancellations += 1;
      this.runtimeStatus.cancelled = 'Cold: el segundo suscriptor repitió todo el trabajo.';
      this.pushLog(
        'cancellation',
        'warning',
        'Cold subscriber #2 disparó una segunda ejecución.',
        'Se repitió todo el costo porque la fuente fría no comparte lo ya resuelto.',
        'Trabajo duplicado',
      );
    });

    const hot$ = this.mockHttp('hot-request').pipe(shareReplay(1));
    hot$.subscribe(() =>
      this.pushLog(
        'result',
        'info',
        'Hot subscriber #1 comparte ejecución.',
        'La primera suscripción genera la respuesta compartida para los demás.',
        'Resultado compartido',
      ),
    );
    hot$.subscribe(() =>
      this.pushLog(
        'result',
        'info',
        'Hot subscriber #2 reutiliza cache.',
        'El segundo suscriptor recibe el mismo valor sin volver a ejecutar la fuente.',
        'Reutilización',
      ),
    );

    this.finishDemo(start, 'Ya puedes ver cuándo se repite trabajo y cuándo se reutiliza.');
  }

  runMapComparison(): void {
    this.startRun('La misma fuente va a alimentar tres estrategias distintas.');
    const start = performance.now();

    const source$ = interval(180).pipe(
      take(3),
      tap((idx) =>
        this.runStep(
          'source',
          `Source emitió tarea ${idx + 1}`,
          'Entró una nueva tarea para decidir si se cancela, se paraleliza o se encola.',
          `Llegó la tarea ${idx + 1}.`,
          'operator',
        ),
      ),
      map((idx) => `T${idx + 1}`),
    );

    source$.pipe(switchMap((id) => this.mockHttp(`switchMap:${id}`, 320))).subscribe(() => {
      this.runtimeStatus.cancelled = 'switchMap dejó viva solo la tarea más reciente.';
      this.metrics.cancellations += 1;
      this.pushLog(
        'cancellation',
        'info',
        'switchMap priorizó la última tarea.',
        'Las tareas anteriores dejaron de importar para que gane la respuesta más fresca.',
        'Solo quedó la última',
      );
    });

    source$
      .pipe(mergeMap((id) => this.mockHttp(`mergeMap:${id}`, 320)))
      .subscribe(() =>
        this.pushLog(
          'operator',
          'info',
          'mergeMap ejecutó tareas en paralelo.',
          'Varias tareas siguieron vivas al mismo tiempo.',
          'Paralelo activo',
        ),
      );

    source$
      .pipe(concatMap((id) => this.mockHttp(`concatMap:${id}`, 320)))
      .subscribe(() =>
        this.pushLog(
          'operator',
          'info',
          'concatMap mantuvo orden FIFO.',
          'Cada tarea esperó su turno para respetar la secuencia.',
          'Orden respetado',
        ),
      );

    this.finishDemo(start, 'Terminó la comparación entre cancelar, paralelizar y encolar.');
  }

  runCombineStreams(): void {
    this.startRun('Combinando dos fuentes para mostrar avance y luego un cierre final.');
    const start = performance.now();

    const profile$ = this.mockHttp('perfil', 240).pipe(map(() => 'perfil:listo'));
    const permissions$ = this.mockHttp('permisos', 420).pipe(map(() => 'permisos:listos'));

    profile$
      .pipe(
        switchMap((profile) =>
          permissions$.pipe(map((permissions) => `${profile} + ${permissions}`)),
        ),
      )
      .subscribe((value) => {
        this.runStep(
          'map',
          `update parcial: ${value}`,
          'Ya llegó una parte útil y la interfaz puede mostrar progreso.',
          'La UI ya puede mostrar avance parcial.',
          'result',
        );
        this.pushLog(
          'result',
          'info',
          `Actualización parcial: ${value}`,
          'Ya hay contexto suficiente para enseñar avance mientras llega el resto.',
          'Progreso visible',
        );
      });

    forkJoin([profile$, permissions$]).subscribe(([profile, permissions]) => {
      this.runStep(
        'subscriber',
        'forkJoin entregó respuesta final agregada',
        'Las dos fuentes completaron y ya tienes un único resultado final.',
        'La respuesta completa ya está lista.',
        'result',
      );
      this.pushLog(
        'result',
        'info',
        `forkJoin final: ${profile} + ${permissions}`,
        'Ahora sí llegó el paquete completo para renderizar la vista final.',
        'Resultado final',
      );
      this.finishDemo(start, 'Viste progreso parcial primero y consistencia completa al final.');
    });
  }

  runErrorResilience(): void {
    this.startRun('Forzando un error para ver cómo el flujo protege la UI.');
    const start = performance.now();

    let attempts = 0;
    of('request')
      .pipe(
        switchMap(() => {
          attempts++;
          this.runStep(
            'source',
            `Intento ${attempts}`,
            'Se lanzó un nuevo intento automático para recuperar la experiencia.',
            `Intento ${attempts} en curso.`,
            'operator',
          );
          return attempts < 3
            ? throwError(() => new Error('500 simulated'))
            : of('ok').pipe(delay(120));
        }),
        retry(2),
        catchError(() => {
          this.markError(
            'retry agotado, aplicando fallback',
            'Después de varios intentos, el flujo eligió una salida segura para no romper la UI.',
            'Fallback activado',
          );
          return of('fallback-data');
        }),
      )
      .subscribe((response) => {
        this.runStep(
          'subscriber',
          `Respuesta final: ${response}`,
          'El consumidor recibió una salida estable para seguir renderizando.',
          'La UI ya puede mostrar un estado estable.',
          'result',
        );
        this.finishDemo(start, 'La demo terminó sin abandonar al usuario tras el error.');
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
      now: 'Elige una demo para ver el siguiente cambio importante.',
      cancelled: 'Todavía no hubo nada que frenar o reutilizar.',
      ui: 'La interfaz está lista para mostrar el siguiente resultado.',
    };
    this.searchResult =
      this.activeTab === 'reactive-input'
        ? 'Escribe un término para ver cómo solo sobrevive la última búsqueda útil.'
        : this.searchResult;
  }

  close(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subs.unsubscribe();
  }

  private startRun(nowMessage: string): void {
    this.resetDemoView();
    this.runtimeStatus.now = nowMessage;
    this.runtimeStatus.ui =
      'La interfaz está observando el flujo para reflejar el siguiente cambio.';
  }

  private bindCoreStreams(): void {
    this.subs.add(
      this.labService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
        this.activeUser = user;
      }),
    );

    this.subs.add(
      this.labService.flowLog$.pipe(takeUntil(this.destroy$)).subscribe((event) => {
        this.runStep(
          event.operator,
          event.label,
          'Evento propagado desde el laboratorio principal.',
          'El laboratorio principal activó este paso del pipeline.',
          'state',
        );
      }),
    );
  }

  private bindReactiveSearch(): void {
    this.subs.add(
      this.searchInput$
        .pipe(
          debounceTime(350),
          distinctUntilChanged(),
          tap(() =>
            this.runStep(
              'debounce',
              'Pausa útil detectada',
              'El flujo esperó un momento útil antes de consultar.',
              'Esperando menos ruido antes de buscar.',
              'operator',
            ),
          ),
          switchMap((term) => {
            if (!term) {
              this.metrics.cancellations += 1;
              this.runtimeStatus.cancelled =
                'La búsqueda se frenó porque no había un término útil.';
              this.runtimeStatus.ui = 'La interfaz evitó una llamada innecesaria.';
              return of('Sin término de búsqueda.');
            }
            this.runStep(
              'map',
              'Se priorizó la última búsqueda',
              'Solo se mantiene viva la intención más reciente del usuario.',
              'Cancelando búsquedas anteriores.',
              'cancellation',
            );
            this.runtimeStatus.cancelled =
              'Las búsquedas anteriores dejaron de importar para priorizar la última.';
            return this.mockHttp(`search:${term}`, 360).pipe(map(() => `Resultado para: ${term}`));
          }),
        )
        .subscribe((result) => {
          this.searchResult = result;
          this.runStep(
            'subscriber',
            result,
            'La interfaz ya puede mostrar el resultado final sin ruido de búsquedas anteriores.',
            'Ejecutando la última búsqueda útil.',
            'result',
          );
          this.finishDemo(
            this.reactiveSearchStartedAt || performance.now(),
            'La búsqueda terminó mostrando solo lo que realmente importaba.',
          );
        }),
    );
  }

  private runStep(
    operator: string,
    label: string,
    explanation: string,
    nowMessage: string,
    category: LogCategory,
  ): void {
    this.stepStatus[operator] = 'running';
    this.timeline = this.timeline.map((step) => ({ ...step, active: step.operator === operator }));
    this.metrics.emissions += 1;

    this.runtimeStatus.now = nowMessage;
    this.runtimeStatus.ui =
      'La interfaz está recibiendo señales del flujo y preparándose para reflejar el cambio.';

    this.pushLog(
      category,
      'info',
      `${operator} → ${label}`,
      explanation,
      this.getLogTitle(category),
    );

    timer(240)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.stepStatus[operator] = 'done';
      });
  }

  private markError(message: string, humanMessage: string, title: string): void {
    this.stepStatus.subscriber = 'error';
    this.metrics.errors += 1;
    this.runtimeStatus.now =
      'Apareció un error controlado y el flujo está protegiendo la experiencia.';
    this.runtimeStatus.ui = 'La interfaz no se rompió: está esperando una salida segura.';
    this.pushLog('error', 'error', `error → ${message}`, humanMessage, title);
  }

  private finishDemo(start: number, uiMessage: string): void {
    this.metrics.latencyMs = Math.round(Math.max(performance.now() - start, 0));
    this.runtimeStatus.ui = uiMessage;
  }

  private mockHttp(label: string, ms = 220): Observable<string> {
    return of(label).pipe(
      tap(() =>
        this.runStep(
          'filter',
          `validación previa de ${label}`,
          'Se confirma si esta llamada tiene sentido antes de continuar.',
          'Validando si conviene seguir con la llamada.',
          'http',
        ),
      ),
      delay(ms),
      finalize(() =>
        this.pushLog(
          'http',
          'info',
          `http simulado completado: ${label}`,
          'La simulación terminó y el recurso temporal ya quedó liberado.',
          'HTTP completado',
        ),
      ),
    );
  }

  private pushLog(
    category: LogCategory,
    level: LogEvent['level'],
    technicalAction: string,
    humanExplanation: string,
    title: string,
  ): void {
    this.logs.unshift({
      time: new Date().toLocaleTimeString(),
      technicalAction,
      humanExplanation,
      runId: this.runId,
      level,
      category,
      title,
      executionLabel: `Ejecución #${this.runId}`,
    });

    if (this.logs.length > 18) {
      this.logs.pop();
    }
  }

  private getLogTitle(category: LogCategory): string {
    const titles: Record<LogCategory, string> = {
      http: 'HTTP',
      operator: 'Proceso',
      cancellation: 'Cancelación',
      result: 'Resultado',
      error: 'Error',
      state: 'Estado',
    };

    return titles[category];
  }
}