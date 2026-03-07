import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ObervablesLabService } from 'src/app/features/observables/data/services/observables-lab.service';
import { Subscription } from 'rxjs';
import { User } from '../../data/models/User.model';
import { LogEvent } from '../../data/models/LogEvent.model';
import { TimelineStep } from '../../data/models/TimelineStep.model';

@Component({
  selector: 'app-observables-flow-modal',
  templateUrl: './observables-flow-modal.component.html',
  styleUrls: ['./observables-flow-modal.component.scss'],
})
export class ObservablesFlowModalComponent implements OnInit, OnDestroy {

  activeUser!: User;
  logs: LogEvent[] = [];

  timeline: TimelineStep[] = [
    { operator: 'source', label: 'emit', active: false },
    { operator: 'map', label: 'map', active: false },
    { operator: 'filter', label: 'filter', active: false },
    { operator: 'debounce', label: 'debounce', active: false },
    { operator: 'subscriber', label: 'subscribe', active: false},
  ];

  private subs = new Subscription();

  constructor(
    private labService: ObervablesLabService,
    private dialogRef: MatDialogRef<ObservablesFlowModalComponent>,
  ) {}

  ngOnInit(): void {

    // Estado actual (BehaviorSubject)
    this.subs.add(
      this.labService.user$.subscribe(user => {
        this.activeUser = user;
        this.activateStep('source');
        this.pushLog(`BehaviorSubject emit → ${user.nombre}`);
      }),
    );

    // Historial (ReplaySubject)
    this.subs.add(
      this.labService.usersHistory$.subscribe(history => {
        this.pushLog(`ReplaySubject buffer → ${history.length}`);
      })
    );

    // Simulación visual del pipeline RxJS
    this.subs.add(
      this.labService.flowLog$.subscribe(event => {
        this.activateStep(event.operator);
        this.pushLog(`${event.operator} → ${event.label}`);
      }),
    );
  }

  private activateStep(operator: string): void {
    this.timeline = this.timeline.map(step => ({
      ...step,
      active: step.operator === operator,
    }));
  }

  private pushLog(message: string): void {
    this.logs.unshift({
      time: new Date().toLocaleTimeString(),
      message,
    });

    if (this.logs.length > 10) {
      this.logs.pop();
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
