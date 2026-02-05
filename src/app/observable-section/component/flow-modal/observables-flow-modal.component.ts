import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ObervablesLabService } from 'src/app/core/services/observable-section/obervables-lab.service';
import { User } from '../../model/User.model';
import { LogEvent } from '../../model/LogEvent.model';
import { Subscription } from 'rxjs';
import { TimelineStep } from '../../model/TimelineStep.model';

@Component({
  selector: 'app-observables-flow-modal',
  templateUrl: './observables-flow-modal.component.html',
  styleUrls: ['./observables-flow-modal.component.scss']
})
export class ObservablesFlowModalComponent implements OnInit, OnDestroy {

  activeUser!: User;
  history: User[] = [];
  logs: LogEvent[] = [];
  timeline: TimelineStep[] = [
  { operator: 'source', label: 'emit', active: false },
  { operator: 'map', label: 'map', active: false },
  { operator: 'filter', label: 'filter', active: false },
  { operator: 'debounce', label: 'debounce', active: false },
  { operator: 'subscriber', label: 'subscribe', active: false }
];

  private subs = new Subscription();

  constructor(
    private labService: ObervablesLabService,
    private dialogRef: MatDialogRef<ObservablesFlowModalComponent>
  ) {}

  ngOnInit(): void {

    this.labService.flowLog$.subscribe(event => {
    this.timeline = this.timeline.map(step => ({
      ...step,
      active: step.operator === event.operator
    }));
  });

    // BehaviorSubject → estado actual
    this.subs.add(
      this.labService.user$.subscribe(user => {
        this.activeUser = user;
        this.pushLog(`BehaviorSubject → emit(${user.nombre})`);
      })
    );

    // ReplaySubject → historial
    this.subs.add(
      this.labService.usersHistory$.subscribe(history => {
        this.history = history;
        this.pushLog(`ReplaySubject → buffer size (${history.length})`);
      })
    );

  }

  close(): void {
    this.dialogRef.close();
  }

  private pushLog(message: string): void {
    this.logs.unshift({
      time: new Date().toLocaleTimeString(),
      message
    });

    if (this.logs.length > 8) {
      this.logs.pop();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
