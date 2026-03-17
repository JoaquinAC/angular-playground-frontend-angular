import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ObervablesLabService } from 'src/app/features/observables/data/services/observables-lab.service';
import { User } from '../data/models/User.model';
import { fadeSlideInAnimation } from 'src/app/shared/animations/fade-slide-in.animation';
import { ObservablesFlowModalComponent } from './flow-modal/observables-flow-modal.component';

@Component({
  selector: 'app-observables-section',
  templateUrl: './observables-section.component.html',
  styleUrls: ['./observables-section.component.scss'],
  animations: [fadeSlideInAnimation],
})
export class ObservablesSectionComponent implements OnInit {

  user$: Observable<User>;
  usersHistory$: Observable<User[]>;

  private counter = 2;

  constructor(
    private labService: ObervablesLabService,
    private dialog: MatDialog,
  ) {
    this.user$ = this.labService.user$;
    this.usersHistory$ = this.labService.usersHistory$;
  }

  ngOnInit(): void {
    console.log('ObservablesSectionComponent initialized');
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
      panelClass: 'custom-dialog-panel',
      maxWidth: '900px',
      width: '92vw',
    });
  }
}
