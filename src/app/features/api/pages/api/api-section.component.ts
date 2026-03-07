import { Component, OnInit } from '@angular/core';
import { UserResponseDto } from '../../../../core/models/users/users.models';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { UserService } from 'src/app/features/api/data/service/user-service';
import { animate, style, transition, trigger } from '@angular/animations';
import { forkJoin } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';
import { HttpErrorAdapterService, NormalizedHttpError } from 'src/app/features/interceptors-lab/data/services/http-error-adapter.service';

@Component({
  selector: 'app-api-section',
  templateUrl: './api-section.component.html',
  styleUrls: ['./api-section.component.scss'],
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class ApiSectionComponent implements OnInit {
  users: UserResponseDto[] = [];
  lastResponse: unknown = null;
  lastStatus: number | null = null;
  lastAction: string | null = null;
  role: 'admin' | 'guest' | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private errorAdapter: HttpErrorAdapterService,
  ) {}

  ngOnInit(): void {
    this.resolveRole();
  }

  private resolveRole(): void {
    this.role = this.authService.getRole() ?? 'guest';
  }

  getUsers(): void {
    this.userService.getUsers().subscribe({
      next: (res: HttpResponse<UserResponseDto[]>) => {
        this.users = res.body || [];
        this.lastResponse = res.body;
        this.lastStatus = res.status;
        this.lastAction = 'Usuarios obtenidos correctamente';
      },
      error: (err: HttpErrorResponse) => {
        this.applyErrorState('Error al obtener usuarios', err);
      },
    });
  }

  createUser(): void {
    if (this.role !== 'admin') return;

    const unique = Date.now();
    const payload = {
      username: `guest_${unique}`,
      email: `guest_${unique}@test.com`,
      password: '123456',
    };

    this.userService.createUser(payload).subscribe({
      next: (res: HttpResponse<UserResponseDto>) => {
        this.lastStatus = res.status;
        this.lastResponse = res.body;
        this.lastAction =
          res.status === 201 ? 'Usuario creado con éxito (201)' : 'Usuario creado con éxito';
        this.getUsers();
      },
      error: (err: HttpErrorResponse) => {
        this.applyErrorState('Error al crear usuario', err);
      },
    });
  }

  deleteAll(): void {
    if (this.role !== 'admin') return;

    if (!this.users.length) {
      this.lastAction = 'Todos los usuarios eliminados (204)';
      return;
    }

    forkJoin(this.users.map(user => this.userService.deleteUser(user.id))).subscribe({
      next: () => {
        this.users = [];
        this.lastStatus = 204;
        this.lastResponse = null;
        this.lastAction = 'Todos los usuarios eliminados';
      },
    error: (err: HttpErrorResponse) => {
      this.applyErrorState('Error al eliminar usuarios', err);
    },
    });
  }

    private applyErrorState(contextMessage: string, err: HttpErrorResponse): void {
      const normalized = this.errorAdapter.adapt(err);
      this.lastStatus = normalized.status;
      this.lastResponse = this.mapErrorForUi(normalized);
      this.lastAction = `${contextMessage}: ${normalized.code}`;
    }

    private mapErrorForUi(error: NormalizedHttpError): unknown {
      return {
        status: error.status,
        code: error.code,
        message: error.message,
        errors: error.fieldErrors,
      };
    }
}
