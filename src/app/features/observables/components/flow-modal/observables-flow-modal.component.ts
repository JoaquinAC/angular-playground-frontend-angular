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

@Component({
  selector: 'app-observables-flow-modal',
  templateUrl: './observables-flow-modal.component.html',
  styleUrls: ['./observables-flow-modal.component.scss'],
})
export class ObservablesFlowModalComponent implements OnInit, OnDestroy {

  activeUser!: User;
  logs: LogEvent[] = [];

  tabs: DemoTab[] = [
    { id: 'cold-hot', title: 'Cold vs Hot', summary: 'Muestra ejecuciones duplicadas vs stream compartido.' },
    { id: 'reactive-input', title: 'Input Reactivo', summary: 'Debounce + distinct + switchMap con cancelación visible.' },
    { id: 'map-operators', title: 'Map Operators', summary: 'Compara switchMap, mergeMap y concatMap en tiempo real.' },
    { id: 'combine-streams', title: 'Combine Streams', summary: 'Diferencias entre combineLatest y forkJoin.' },
    { id: 'error-resilience', title: 'Errores + Retry', summary: 'Demuestra retry + catchError y fallback controlado.' },
  ];

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

  setTab(tab: DemoId): void {
    this.activeTab = tab;
    this.pushLog(`Demo activa → ${tab}`);
    this.resetDemoView();
  }

  triggerSearch(): void {
    this.searchInput$.next(this.searchTerm.trim());
  }

  runColdVsHot(): void {
    this.resetDemoView();
    const start = performance.now();

    const cold$ = this.mockHttp('cold-request').pipe(
      tap(() => this.runStep('source', 'Cold source emitido')),
    );

    cold$.subscribe(() => this.pushLog('Cold subscriber #1 recibió respuesta única.'));
    cold$.subscribe(() => this.pushLog('Cold subscriber #2 disparó una segunda ejecución.'));

    const hot$ = this.mockHttp('hot-request').pipe(shareReplay(1));
    hot$.subscribe(() => this.pushLog('Hot subscriber #1 comparte ejecución.'));
    hot$.subscribe(() => this.pushLog('Hot subscriber #2 reutiliza cache (shareReplay).'));

    this.finishDemo(start);
  }

  runMapComparison(): void {
    this.resetDemoView();
    const start = performance.now();

    const source$ = interval(180).pipe(
      take(3),
      tap((idx) => this.runStep('source', `Source emitió tarea ${idx + 1}`)),
      map((idx) => `T${idx + 1}`),
    );

    source$
      .pipe(switchMap((id) => this.mockHttp(`switchMap:${id}`, 320)))
      .subscribe(() => this.pushLog('switchMap canceló peticiones previas.'));

    source$
      .pipe(mergeMap((id) => this.mockHttp(`mergeMap:${id}`, 320)))
      .subscribe(() => this.pushLog('mergeMap ejecutó concurrencia en paralelo.'));

    source$
      .pipe(concatMap((id) => this.mockHttp(`concatMap:${id}`, 320)))
      .subscribe(() => this.pushLog('concatMap respetó secuencia FIFO.'));

    this.finishDemo(start);
  }

  runCombineStreams(): void {
    this.resetDemoView();
    const start = performance.now();

    const profile$ = this.mockHttp('perfil', 240).pipe(map(() => 'perfil:listo'));
    const permissions$ = this.mockHttp('permisos', 420).pipe(map(() => 'permisos:listos'));

    profile$
      .pipe(
        switchMap((profile) => permissions$.pipe(map((permissions) => `${profile} + ${permissions}`))),
      )
      .subscribe((value) => this.pushLog(`combineLatest-like update parcial: ${value}`));

    forkJoin([profile$, permissions$]).subscribe(([profile, permissions]) => {
      this.runStep('subscriber', 'forkJoin entregó respuesta final agregada');
      this.pushLog(`forkJoin final: ${profile} + ${permissions}`);
      this.finishDemo(start);
    });
  }

  runErrorResilience(): void {
    this.resetDemoView();
    const start = performance.now();

    let attempts = 0;
    of('request')
      .pipe(
        switchMap(() => {
          attempts++;
          this.runStep('source', `Intento ${attempts}`);
          return attempts < 3 ? throwError(() => new Error('500 simulated')) : of('ok').pipe(delay(120));
        }),
        retry(2),
        catchError(() => {
          this.markError('retry agotado, aplicando fallback');
          return of('fallback-data');
        }),
      )
      .subscribe((response) => {
        this.runStep('subscriber', `Respuesta final: ${response}`);
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
  }

  close(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subs.unsubscribe();
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
        this.runStep(event.operator, event.label);
      }),
    );
  }  

  private bindReactiveSearch(): void {
    this.subs.add(
      this.searchInput$
        .pipe(
          debounceTime(350),
          distinctUntilChanged(),
          tap(() => this.runStep('debounce', 'debounceTime + distinctUntilChanged')),
          switchMap((term) => {
            if (!term) {
              this.metrics.cancellations += 1;
              return of('Sin término de búsqueda.');
            }
            this.runStep('map', 'switchMap cancela peticiones previas');
            return this.mockHttp(`search:${term}`, 360).pipe(map(() => `Resultado para: ${term}`));
          }),
        )
        .subscribe((result) => {
          this.searchResult = result;
          this.runStep('subscriber', result);
        }),
    );
  }

  private runStep(operator: string, label: string): void {
    this.stepStatus[operator] = 'running';
    this.timeline = this.timeline.map((step) => ({ ...step, active: step.operator === operator }));
    this.metrics.emissions += 1;

    this.pushLog(`${operator} → ${label}`);

    timer(140)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.stepStatus[operator] = 'done';
      });
  }

  private markError(message: string): void {
    this.stepStatus.subscriber = 'error';
    this.metrics.errors += 1;
    this.pushLog(`error → ${message}`);
  }

  private finishDemo(start: number): void {
    this.metrics.latencyMs = Math.round(performance.now() - start);
  }

  private mockHttp(label: string, ms = 220): Observable<string> {
    return of(label).pipe(
      tap(() => this.runStep('filter', `validación previa de ${label}`)),
      delay(ms),
      finalize(() => this.pushLog(`http simulado completado: ${label}`)),
    );
  }

  private pushLog(message: string): void {
    this.logs.unshift({
      time: new Date().toLocaleTimeString(),
      message,
    });

    if (this.logs.length > 14) {
      this.logs.pop();
    }
  }
}
