import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject, Subject, Observable } from 'rxjs';
import { scan, startWith } from 'rxjs/operators';
import { ReactiveLogEvent } from 'src/app/features/observables/data/models/ReactiveLogEvent.model';
import { User } from 'src/app/features/observables/data/models/User.model';

@Injectable({
  providedIn: 'root'
})
export class ObervablesLabService {
  constructor() {
    // Inicializar con un valor de arranque para el demo.
    this.emitValue('INITIAL');
  }

  /* =======================
     Central signer: BehaviorSubject + ReplaySubject
     ======================= */

  private readonly sharedValueSubject = new BehaviorSubject<string>('Inicio');
  sharedValue$: Observable<string> = this.sharedValueSubject.asObservable();

  private readonly sharedReplaySubject = new ReplaySubject<string>(5);
  sharedReplayStream$: Observable<string> = this.sharedReplaySubject.asObservable();
  sharedReplayBuffer$: Observable<string[]> = this.sharedReplaySubject.pipe(
    scan((acc: string[], curr: string) => [...acc, curr].slice(-5), []),
    startWith([]),
  );

  emitValue(value: string): void {
    const normalized = value.trim();
    if (!normalized) return;

    this.sharedValueSubject.next(normalized);
    this.sharedReplaySubject.next(normalized);
    this.emitFlow('source', `emit(${normalized})`);
  }

  /* =======================
   Existing BehaviorSubject + ReplaySubject demo for backward compatibility
   ======================= */

  private readonly initialUser: User = {
    id: 1,
    nombre: 'Invitado'
  };

  private userSubject = new BehaviorSubject<User>(this.initialUser);
  user$ = this.userSubject.asObservable();

  private usersHistorySubject = new ReplaySubject<User>(5);
  usersHistory$ = this.usersHistorySubject.asObservable().pipe(
    scan((acc: User[], curr: User) => {
      const newAcc = [...acc, curr];
      return newAcc.slice(-5);
    }, []),
  );

  /* =======================
   Flow Log (visual RxJS)
   ======================= */

  private flowLogSubject = new Subject<ReactiveLogEvent>();
  flowLog$ = this.flowLogSubject.asObservable();

  private emitFlow(operator: ReactiveLogEvent['operator'], label: string) {
    this.flowLogSubject.next({
      operator,
      label,
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  updateUser(user: User) {
    this.emitFlow('source', 'emit(user)');
    this.emitFlow('map', 'map → normalize');
    this.emitFlow('filter', 'filter → valid');
    this.emitFlow('debounce', 'debounce 300ms');

    this.userSubject.next(user);

    this.emitFlow('subscriber', 'subscriber → next');

    this.usersHistorySubject.next({
      ...user,
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  resetUser() {
    const initial: User = { id: 1, nombre: 'Invitado' };
    this.userSubject.next(initial);
    this.usersHistorySubject.next({
      ...initial,
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  addUserToHistory(user: User): void {
    this.usersHistorySubject.next({
      ...user,
      timestamp: new Date().toLocaleTimeString(),
    });
  }
}

