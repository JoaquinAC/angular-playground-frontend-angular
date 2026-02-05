import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
import { scan } from 'rxjs/operators';
import { ReactiveLogEvent } from 'src/app/observable-section/model/ReactiveLogEvent.model';
import { User } from 'src/app/observable-section/model/User.model';

@Injectable({
  providedIn: 'root'
})
export class ObervablesLabService {

  constructor() { }
  
  /* =======================
     BehaviorSubject
     ======================= */

  private readonly initialUser: User = {
    id: 1,
    nombre: 'Invitado'
  };

  private userSubject = new BehaviorSubject<User>(this.initialUser);
  user$ = this.userSubject.asObservable();

  /* =======================
   Flow Log (visual RxJS)
   ======================= */

  private flowLogSubject = new Subject<ReactiveLogEvent>();
  flowLog$ = this.flowLogSubject.asObservable();

  private emitFlow(operator: ReactiveLogEvent['operator'], label: string) {
  this.flowLogSubject.next({
    operator,
    label,
    timestamp: new Date().toLocaleTimeString()
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
    timestamp: new Date().toLocaleTimeString()
  });
}

  resetUser() {
    const initial: User = { id: 1, nombre: 'Joaquín_1' };
      this.userSubject.next(initial);  // BehaviorSubject
      this.usersHistorySubject.next({
        ...initial,
        timestamp: new Date().toLocaleTimeString()
    }); // ReplaySubject
  }

  /* =======================
     ReplaySubject
     ======================= */

  private usersHistorySubject = new ReplaySubject<User>(5);
  usersHistory$ = this.usersHistorySubject.asObservable().pipe(
  scan((acc: User[], curr: User) => {
    const newAcc = [...acc, curr];
    return newAcc.slice(-5); // siempre últimos 5
  }, [])
);

  addUserToHistory(user: User): void {
    this.usersHistorySubject.next({
      ...user,
      timestamp: new Date().toLocaleTimeString()
    });
  }

  
}
