import { Component } from '@angular/core';
import { AuthService } from 'src/app/core/auth/auth.service';
import {
  GuardAccessResult,
  GuardAccessStateService,
} from '../../data/services/guard-access-state.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent {
  readonly vm: GuardAccessResult;

  constructor(
    private readonly guardAccessState: GuardAccessStateService,
    private readonly authService: AuthService,
  ) {
    this.vm = this.guardAccessState.snapshot() ?? {
      variant: 'admin',
      title: 'Acceso permitido (Admin)',
      message: 'Has accedido correctamente a una ruta protegida.',
      detail: 'Esta vista es parte del flujo de validacion de guards en Angular.',
      requiredRole: 'ADMIN',
      currentRole: (this.authService.getRole() ?? 'guest').toUpperCase(),
      targetRoute: '/guards/admin-dashboard',
      status: 'success',
    };
  }
}
