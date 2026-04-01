import { Component } from '@angular/core';
import { AuthService } from 'src/app/core/auth/auth.service';
import {
  GuardAccessResult,
  GuardAccessStateService,
} from '../../data/services/guard-access-state.service';

@Component({
  selector: 'app-guest-dashboard',
  templateUrl: './guest-dashboard.component.html',
  styleUrls: ['./guest-dashboard.component.scss'],
})
export class GuestDashboardComponent {
  readonly vm: GuardAccessResult;

  constructor(
    private readonly guardAccessState: GuardAccessStateService,
    private readonly authService: AuthService,
  ) {
    this.vm = this.guardAccessState.snapshot() ?? {
      variant: 'guest',
      title: 'Acceso como invitado',
      message: 'Estas en una ruta accesible para usuarios con rol GUEST.',
      detail: 'Esta vista demuestra un acceso limitado dentro del flujo de guards.',
      requiredRole: 'GUEST',
      currentRole: (this.authService.getRole() ?? 'guest').toUpperCase(),
      targetRoute: '/guards/guest-dashboard',
      status: 'info',
    };
  }
}
