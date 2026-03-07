import { Component, OnInit } from '@angular/core';
import { ObservablesFlowModalComponent } from './flow-modal/observables-flow-modal.component';
import { fadeAnimation } from 'src/app/shared/animations/fade.animation';
import { modalFadeSlide } from 'src/app/shared/animations/modal-fade-animation';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { User } from '../../features/observables/data/models/User.model';
import { ObervablesLabService } from 'src/app/features/observables/data/services/observables-lab.service';

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
    const openDialogs = this.dialog.openDialogs;
    if (openDialogs.length) {
      openDialogs[0].close();
    }

    this.dialog.open(ObservablesFlowModalComponent, {
      autoFocus: false,
      restoreFocus: false,
      disableClose: false,
      backdropClass: 'custom-dialog-backdrop',
      panelClass: 'custom-dialog-panel'
  });
    }
}
