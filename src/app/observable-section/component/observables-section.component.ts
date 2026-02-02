import { Component, OnInit } from '@angular/core';
import { ObservablesFlowModalComponent } from './flow-modal/observables-flow-modal.component';
import { fadeAnimation } from 'src/app/shared/animations/fade.animation';
import { modalFadeSlide } from 'src/app/shared/animations/modal-fade-animation';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { User } from '../model/User.model';
import { ObervablesLabService } from 'src/app/core/services/observable-section/obervables-lab.service';

@Component({
  selector: 'app-observables-section',
  templateUrl: './observables-section.component.html',
  styleUrls: ['./observables-section.component.scss'],
  animations: [modalFadeSlide]
})
export class ObservablesSectionComponent implements OnInit {

  user$: Observable<User>;
  usersHistory$: Observable<User[]>;

  private counter = 2;

  constructor(
    private labService: ObervablesLabService,
    private dialog: MatDialog
  ) {
    this.user$ = this.labService.user$;
    this.usersHistory$ = this.labService.usersHistory$ as any;
  }

  ngOnInit(): void {
    console.log('ObservablesSectionComponent initialized');
  }

  updateUser(): void {
    this.labService.updateUser({
      id: this.counter,
      nombre: `Joaquín_${this.counter}`
    });
    this.counter++;
  }

  resetUser(): void {
    this.labService.resetUser();
  }

  addUser(): void {
    this.labService.addUserToHistory({
      id: this.counter,
      nombre: `user_${this.counter}`
    });
    this.counter++;
  }

  openFlowModal(): void {
    this.dialog.open(ObservablesFlowModalComponent, {
      backdropClass: 'observables-backdrop',
      panelClass: 'observables-panel',
      autoFocus: false
    });
  }
}
