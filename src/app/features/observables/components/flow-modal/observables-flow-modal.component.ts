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
  problem: string;
  happening: string;
  operator: string;
  result: string;
  whyItMatters: string;
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
    now: 'Todavía no se está ejecutando ninguna demo.',
    cancelled: 'No hubo cancelaciones todavía.',
    ui: 'La interfaz está lista para mostrar el siguiente cambio.',
  };

  tabs: DemoTab[] = [
    {
      id: 'cold-hot',
      title: 'Cold vs Hot',
      summary: 'Muestra cuándo un flujo duplica trabajo y cuándo puede compartirse.',
    },
    {
      id: 'reactive-input',
      title: 'Input Reactivo',
      summary: 'Evita pedir al backend por cada tecla y conserva solo la intención final.',
    },
    {
      id: 'map-operators',
      title: 'Map Operators',
      summary: 'Compara cancelación, paralelo y secuencia sin perder de vista el resultado.',
    },
    {
      id: 'combine-streams',
      title: 'Combine Streams',
      summary: 'Combina progreso parcial con una respuesta final consolidada.',
    },
    {
      id: 'error-resilience',
      title: 'Errores + Retry',
      summary: 'Reintenta, contiene el fallo y protege la experiencia de usuario.',
    },
  ];

  demoExplanations: Record<DemoId, DemoExplanation> = {
    'cold-hot': {
      problem: 'Evitar trabajo duplicado cuando varios consumidores necesitan la misma respuesta.',
      happening:
        'Lanzas la misma fuente dos veces para ver cuándo se repite la llamada y cuándo el resultado puede compartirse.',
      operator: 'shareReplay(1)',
      result:
        'La versión hot reutiliza la respuesta; la versión cold vuelve a ejecutar todo desde cero.',
      whyItMatters:
        'Esto reduce costo, tiempo y ruido visual cuando varias partes de la UI dependen de los mismos datos.',
    },
    'reactive-input': {
      problem: 'Evitar llamadas al backend en cada tecla y quedarte solo con la búsqueda final.',
      happening:
        'El flujo espera una pequeña pausa, descarta texto repetido y luego consulta solo el término más reciente.',
      operator: 'debounceTime + distinctUntilChanged + switchMap',
      result:
        'Solo ves el resultado final útil; las búsquedas viejas se cancelan antes de ensuciar la interfaz.',
      whyItMatters:
        'La UI se siente ágil, el backend trabaja menos y el usuario no compite contra respuestas atrasadas.',
    },
    'map-operators': {
      problem: 'Elegir si priorizas lo último, el paralelo o el orden de llegada.',
      happening:
        'Una misma fuente emite tareas y comparas cómo cada operador decide qué hacer con ellas.',
      operator: 'switchMap vs mergeMap vs concatMap',
      result:
        'Ves tres estrategias distintas: cancelar, procesar en paralelo o formar una cola ordenada.',
      whyItMatters: 'Cada caso sirve para una necesidad real distinta en interfaces reactivas.',
    },
    'combine-streams': {
      problem: 'Coordinar varias fuentes sin perder la posibilidad de mostrar progreso útil.',
      happening:
        'Un flujo te deja avanzar con información parcial y otro espera a tener el paquete completo.',
      operator: 'switchMap + forkJoin',
      result: 'Primero puedes mostrar avance; después renderizas una respuesta final consistente.',
      whyItMatters:
        'Esto mejora la percepción de velocidad sin sacrificar coherencia en la UI final.',
    },
    'error-resilience': {
      problem: 'Evitar que un fallo puntual rompa toda la experiencia.',
      happening:
        'Simulas errores, intentas recuperarte automáticamente y aplicas un fallback si ya no conviene insistir.',
      operator: 'retry + catchError',
      result: 'La interfaz sigue viva, con una salida controlada incluso cuando la llamada falla.',
      whyItMatters:
        'Una UI robusta no colapsa al primer error: informa, intenta recuperarse y sigue acompañando al usuario.',
    },
  };

  activeTab: DemoId = 'cold-hot';
  searchTerm = '';
  searchResult =
    'Escribe un término y observa cómo el flujo espera, filtra y conserva solo la última intención.';

  timeline: TimelineStep[] = [
    {
      operator: 'source',
      label: 'source',
      description: 'origen del evento',
      detail: 'Aquí nace la acción inicial que dispara el flujo.',
      active: false,
    },
    {
      operator: 'map',
      label: 'map',
      description: 'transforma datos',
      detail: 'Reordena o adapta la información para el siguiente paso.',
      active: false,
    },
    {
      operator: 'filter',
      label: 'filter',
      description: 'valida condiciones',
      detail: 'Decide si el dato merece seguir avanzando.',
      active: false,
    },
    {
      operator: 'debounce',
      label: 'debounce',
      description: 'espera una pausa',
      detail: 'Evita reaccionar de más cuando los eventos llegan demasiado rápido.',
      active: false,
    },
    {
      operator: 'subscriber',
      label: 'subscribe',
      description: 'actualiza la UI',
      detail: 'El resultado final ya puede verse en pantalla.',
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
    this.startRun(
      'La búsqueda reactiva acaba de arrancar y está esperando una pausa útil antes de consultar.',
    );
    this.searchInput$.next(this.searchTerm.trim());
  }

  runColdVsHot(): void {
    this.startRun(
      'Vamos a comparar una fuente que repite trabajo con otra que comparte la respuesta.',
    );
    const start = performance.now();

    const cold$ = this.mockHttp('cold-request').pipe(
      tap(() =>
        this.runStep(
          'source',
          'Cold source emitido',
          'La fuente se ejecuta una vez por cada suscriptor.',
          'source activó una nueva llamada',
          'operator',
        ),
      ),
    );

    cold$.subscribe(() => {
      this.pushLog(
        'result',
        'warning',
        'Cold subscriber #1 recibió respuesta única.',
        'El primer consumidor obtuvo su dato, pero ese resultado no se comparte.',
        'Respuesta aislada',
      );
    });
    cold$.subscribe(() => {
      this.metrics.cancellations += 1;
      this.runtimeStatus.cancelled =
        'No hubo cancelación real, pero sí trabajo duplicado por volver a suscribirse a una fuente fría.';
      this.pushLog(
        'cancellation',
        'warning',
        'Cold subscriber #2 disparó una segunda ejecución.',
        'Se repitió todo el costo de la llamada porque la fuente volvió a empezar desde cero.',
        'Trabajo duplicado',
      );
    });

    const hot$ = this.mockHttp('hot-request').pipe(shareReplay(1));
    hot$.subscribe(() =>
      this.pushLog(
        'result',
        'info',
        'Hot subscriber #1 comparte ejecución.',
        'La primera suscripción crea la respuesta compartida para los demás consumidores.',
        'Respuesta compartida',
      ),
    );
    hot$.subscribe(() =>
      this.pushLog(
        'result',
        'info',
        'Hot subscriber #2 reutiliza cache.',
        'El segundo consumidor recibe el valor sin reejecutar la fuente.',
        'Cache reutilizada',
      ),
    );

    this.finishDemo(
      start,
      'Comparación finalizada: ya puedes ver la diferencia entre repetir trabajo y compartir resultado.',
    );
  }

  runMapComparison(): void {
    this.startRun(
      'La misma fuente alimenta tres estrategias distintas para que compares su comportamiento.',
    );
    const start = performance.now();

    const source$ = interval(180).pipe(
      take(3),
      tap((idx) =>
        this.runStep(
          'source',
          `Source emitió tarea ${idx + 1}`,
          'Ingresó una nueva tarea al pipeline.',
          `Llegó la tarea ${idx + 1}`,
          'operator',
        ),
      ),
      map((idx) => `T${idx + 1}`),
    );

    source$.pipe(switchMap((id) => this.mockHttp(`switchMap:${id}`, 320))).subscribe(() => {
      this.runtimeStatus.cancelled = 'switchMap está dejando viva solo la tarea más reciente.';
      this.metrics.cancellations += 1;
      this.pushLog(
        'cancellation',
        'info',
        'switchMap priorizó la última tarea.',
        'Las tareas anteriores se cancelaron para que la respuesta final llegue fresca.',
        'Se quedó la última',
      );
    });

    source$
      .pipe(mergeMap((id) => this.mockHttp(`mergeMap:${id}`, 320)))
      .subscribe(() =>
        this.pushLog(
          'operator',
          'info',
          'mergeMap ejecutó tareas en paralelo.',
          'Todas las tareas siguieron avanzando al mismo tiempo.',
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
          'Cola ordenada',
        ),
      );

    this.finishDemo(
      start,
      'La comparación terminó: ahora puedes decidir qué operador se adapta mejor a tu caso.',
    );
  }

  runCombineStreams(): void {
    this.startRun(
      'Vamos a combinar dos fuentes para mostrar progreso y luego una respuesta completa.',
    );
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
          'El flujo avanza aunque todavía falta una parte de la información.',
          'Ya puedes mostrar progreso en pantalla',
          'result',
        );
        this.pushLog(
          'result',
          'info',
          `Actualización parcial: ${value}`,
          'La interfaz ya tiene suficiente contexto para mostrar avance mientras espera lo demás.',
          'Progreso visible',
        );
      });

    forkJoin([profile$, permissions$]).subscribe(([profile, permissions]) => {
      this.runStep(
        'subscriber',
        'forkJoin entregó respuesta final agregada',
        'Ambos streams completaron y ya tienes el paquete final.',
        'Resultado final consolidado',
        'result',
      );
      this.pushLog(
        'result',
        'info',
        `forkJoin final: ${profile} + ${permissions}`,
        'Ahora sí llegó la respuesta completa para renderizar la vista final.',
        'Paquete completo',
      );
      this.finishDemo(
        start,
        'Combinación finalizada: viste cómo convivir con progreso parcial y cierre completo.',
      );
    });
  }

  runErrorResilience(): void {
    this.startRun(
      'Vamos a forzar un error para ver cómo el flujo intenta recuperarse sin romper la experiencia.',
    );
    const start = performance.now();

    let attempts = 0;
    of('request')
      .pipe(
        switchMap(() => {
          attempts++;
          this.runStep(
            'source',
            `Intento ${attempts}`,
            'Se ejecuta una nueva tentativa automática.',
            `Intento ${attempts} en curso`,
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
            'Después de intentar recuperarse, el flujo eligió una salida segura para no romper la UI.',
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
          'La UI ya puede mostrar una respuesta estable',
          'result',
        );
        this.finishDemo(
          start,
          'Manejo de error completado: el flujo terminó sin abandonar al usuario.',
        );
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
      now: 'Todavía no se está ejecutando ninguna demo.',
      cancelled: 'No hubo cancelaciones todavía.',
      ui: 'La interfaz está lista para mostrar el siguiente cambio.',
    };
    this.searchResult =
      this.activeTab === 'reactive-input'
        ? 'Escribe un término y observa cómo el flujo espera, filtra y conserva solo la última intención.'
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
      'La interfaz está observando el flujo para mostrar el siguiente cambio importante.';
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
        this.runStep(
          event.operator,
          event.label,
          'Evento propagado desde el laboratorio principal.',
          'El laboratorio principal activó este paso del pipeline',
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
              'debounceTime + distinctUntilChanged',
              'El flujo esperó una pausa y descartó texto repetido.',
              'La búsqueda se calmó antes de consultar',
              'operator',
            ),
          ),
          switchMap((term) => {
            if (!term) {
              this.metrics.cancellations += 1;
              this.runtimeStatus.cancelled =
                'La búsqueda se detuvo porque no había un término útil para consultar.';
              this.runtimeStatus.ui = 'La interfaz siguió estable: evitó una llamada innecesaria.';
              return of('Sin término de búsqueda.');
            }
            this.runStep(
              'map',
              'switchMap cancela peticiones previas',
              'Solo se mantiene la búsqueda más reciente.',
              'Nos quedamos con la intención final del usuario',
              'cancellation',
            );
            this.runtimeStatus.cancelled =
              'switchMap está frenando búsquedas anteriores para que solo sobreviva la última.';
            return this.mockHttp(`search:${term}`, 360).pipe(map(() => `Resultado para: ${term}`));
          }),
        )
        .subscribe((result) => {
          this.searchResult = result;
          this.runStep(
            'subscriber',
            result,
            'La interfaz ya puede mostrar el resultado final sin ruido de búsquedas anteriores.',
            'La interfaz acaba de actualizarse con el resultado correcto',
            'result',
          );
          this.finishDemo(
            this.reactiveSearchStartedAt || performance.now(),
            'La búsqueda reactiva terminó mostrando solo lo que realmente importaba.',
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
      'La interfaz está recibiendo señales del flujo y preparándose para reflejar el siguiente cambio.';

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
    this.runtimeStatus.ui =
      'La interfaz no se rompió: está esperando un fallback o una recuperación segura.';
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
          'Se evalúan condiciones antes de continuar con la llamada.',
          'Se está validando si la llamada tiene sentido',
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
          'Request completada',
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

    if (this.logs.length > 24) {
      this.logs.pop();
    }
  }
  private getLogTitle(category: LogCategory): string {
    const titles: Record<LogCategory, string> = {
      http: 'HTTP',
      operator: 'Operador',
      cancellation: 'Cancelación',
      result: 'Resultado',
      error: 'Error',
      state: 'Estado',
    };

    return titles[category];
  }
}
