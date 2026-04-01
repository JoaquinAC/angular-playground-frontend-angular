import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subscription } from 'rxjs';
import { ObervablesLabService } from 'src/app/features/observables/data/services/observables-lab.service';
import { User } from '../data/models/User.model';
import { fadeSlideInAnimation } from 'src/app/shared/animations/fade-slide-in.animation';
import { ObservablesFlowModalComponent } from './flow-modal/observables-flow-modal.component';

interface DynamicSubscriber {
  id: number;
  type: 'behavior' | 'replay';
  active: boolean;
  values: string[];
}

@Component({
  selector: 'app-observables-section',
  templateUrl: './observables-section.component.html',
  styleUrls: ['./observables-section.component.scss'],
  animations: [fadeSlideInAnimation],
})
export class ObservablesSectionComponent implements OnInit, OnDestroy {
  user$: Observable<User>;
  usersHistory$: Observable<User[]>;

  // Valor central y buffer para la nueva demostración
  sharedValue$: Observable<string>;
  sharedReplay$: Observable<string[]>;

  newValue = '';

  latestUserLabel = 'Sin emisiones recientes';
  latestUserNarrative = 'Todavía no hubo cambios compartidos en el estado global.';
  latestUserPulse = false;
  lastChangeAt = 'Aún no hay cambios';

  replayBufferLabel = '0/5';
  replayLatestAction = 'Esperando nuevas emisiones en el buffer.';
  replayNarrative =
    'Cuando entren usuarios, aquí verás el historial retenido y el cambio más reciente.';
  replayPulse = false;
  replayChecks = {
    keepsLatest: false,
    lateSubscription: false,
    liveUpdates: false,
    controlledReset: false,
  };

  private counter = 2;
  private subs = new Subscription();
  private previousHistoryLength = 0;

  subscribers: DynamicSubscriber[] = [];
  private subscriberSubs = new Map<number, Subscription>();
  private nextSubscriberId = 1;

  constructor(
    private labService: ObervablesLabService,
    private dialog: MatDialog,
  ) {
    this.user$ = this.labService.user$;
    this.usersHistory$ = this.labService.usersHistory$;

    this.sharedValue$ = this.labService.sharedValue$;
    this.sharedReplay$ = this.labService.sharedReplayBuffer$;
  }

  ngOnInit(): void {
    this.bindVisualIndicators();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.subscriberSubs.forEach((sub) => sub.unsubscribe());
    this.subscriberSubs.clear();
  }

  emitValue(): void {
    const value = this.newValue.trim();
    if (!value) {
      return;
    }

    this.labService.emitValue(value);
    this.newValue = '';

    // Cada suscriptor activo recibe el nuevo valor automáticamente desde el subject.
  }

  createSubscriber(type: 'behavior' | 'replay'): void {
    const subscriber: DynamicSubscriber = {
      id: this.nextSubscriberId++,
      type,
      active: false,
      values: [],
    };

    this.subscribers.push(subscriber);
    this.subscribeSubscriber(subscriber);
  }

  toggleSubscriber(subscriber: DynamicSubscriber): void {
    if (subscriber.active) {
      this.unsubscribeSubscriber(subscriber);
    } else {
      this.subscribeSubscriber(subscriber);
    }
  }

  removeSubscriber(subscriber: DynamicSubscriber): void {
    this.unsubscribeSubscriber(subscriber);
    this.subscribers = this.subscribers.filter((item) => item.id !== subscriber.id);
  }

  private subscribeSubscriber(subscriber: DynamicSubscriber): void {
    if (subscriber.active) {
      return;
    }

    const source$ =
      subscriber.type === 'behavior'
        ? this.labService.sharedValue$
        : this.labService.sharedReplayStream$;

    const sub = source$.subscribe((payload) => {
      if (!subscriber.active) {
        return;
      }

      if (typeof payload === 'string') {
        subscriber.values.push(payload);
      }
    });

    this.subscriberSubs.set(subscriber.id, sub);
    subscriber.active = true;
  }

  private unsubscribeSubscriber(subscriber: DynamicSubscriber): void {
    const sub = this.subscriberSubs.get(subscriber.id);
    if (sub) {
      sub.unsubscribe();
      this.subscriberSubs.delete(subscriber.id);
    }
    subscriber.active = false;
  }

  updateUser(): void {
    this.labService.updateUser({
      id: this.counter,
      nombre: `Joaquín_${this.counter}`,
    });
    this.counter++;
  }

  resetUser(): void {
    this.labService.resetUser();
    this.replayChecks.controlledReset = true;
    this.latestUserNarrative =
      'Volvimos al valor base sin recargar la pantalla: el estado compartido se reinició de forma controlada.';
  }

  addUser(): void {
    this.labService.addUserToHistory({
      id: this.counter,
      nombre: `user_${this.counter}`,
    });
    this.counter++;
  }

  openFlowModal(): void {
   // Evita abrir múltiples instancias
    if (this.dialog.openDialogs.length) {
      this.dialog.openDialogs[0].close();
    }

    this.dialog.open(ObservablesFlowModalComponent, {
      autoFocus: false,
      restoreFocus: false,
      disableClose: false,
      backdropClass: 'custom-dialog-backdrop',
      panelClass: ['custom-dialog-panel', 'observables-dialog-panel'],
      maxWidth: '1200px',
      width: '95vw',
    });
  }

  private bindVisualIndicators(): void {
    this.subs.add(
      this.user$.subscribe((user) => {
        this.latestUserLabel = `${user.nombre} (id:${user.id})`;
        this.lastChangeAt = `Actualizado a las ${new Date().toLocaleTimeString()}`;
        this.latestUserNarrative = `Este es el valor compartido que recibiría cualquier nuevo suscriptor si entrara ahora mismo.`;
        this.latestUserPulse = true;
        this.replayChecks.liveUpdates = true;
        timerReset(() => (this.latestUserPulse = false));
      }),
    );

    this.subs.add(
      this.usersHistory$.subscribe((history) => {
        this.replayBufferLabel = `${history.length}/5`;
        this.replayChecks.keepsLatest = history.length > 0;

        if (history.length > this.previousHistoryLength) {
          const latestUser = history[history.length - 1]?.nombre;
          this.replayLatestAction = `Entró ${latestUser} al buffer.`;
          this.replayNarrative = `El historial retenido acaba de sumar un nuevo valor y permanece disponible para suscripciones tardías.`;

          if (history.length === 5 && this.previousHistoryLength === 5) {
            this.replayLatestAction = `Entró ${latestUser} y salió el más antiguo por límite de buffer.`;
            this.replayNarrative =
              'El buffer conservó solo los 5 valores más recientes: el historial viejo salió para dejar espacio al nuevo.';
            this.replayChecks.lateSubscription = true;
          }
        }

        this.previousHistoryLength = history.length;
        this.replayPulse = true;
        timerReset(() => (this.replayPulse = false));
      }),
    );
  }
}

function timerReset(callback: () => void): void {
  setTimeout(() => callback(), 650);
}
