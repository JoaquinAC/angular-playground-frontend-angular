import { Component } from '@angular/core';
import { AuthService } from 'src/app/core/auth/auth.service';
import {
  GuardAccessResult,
  GuardAccessStateService,
} from 'src/app/features/guards/data/services/guard-access-state.service';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.scss'],
})
export class UnauthorizedComponent {
  readonly vm: GuardAccessResult;

  constructor(
    private readonly guardAccessState: GuardAccessStateService,
    private readonly authService: AuthService,
  ) {
    this.vm = this.guardAccessState.snapshot() ?? {
      variant: 'unauthorized',
      title: 'Acceso denegado',
      message: 'No tienes permisos para acceder a esta ruta.',
      detail: 'Esta vista es parte del flujo de validacion de guards en Angular.',
      requiredRole: 'ADMIN',
      currentRole: (this.authService.getRole() ?? 'guest').toUpperCase(),
      targetRoute: '/unauthorized',
      status: 'error',
    };
  }
}
