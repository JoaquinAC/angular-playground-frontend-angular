import { Component, OnInit } from '@angular/core';
import { UserResponseDto } from '../models/user-response.dto';
import { HttpResponse } from '@angular/common/http';
import { UserService } from 'src/app/core/services/api-section/user-service.ts.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { AuthService } from 'src/app/core/auth.service';
import { forkJoin } from 'rxjs';

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
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.resolveRole();
  }

  private resolveRole(): void {
    this.role = this.authService.getRole() ?? 'guest';
  }

  getUsers(): void {
    this.userService.getUsers()
      .subscribe({
        next: (res: HttpResponse<UserResponseDto[]>) => {
          this.users = res.body || [];
          this.lastResponse = res.body;
          this.lastStatus = res.status;
          this.lastAction = 'Usuarios obtenidos correctamente';
        },
        error: (err: { status: number | null; error: unknown; }) => {
          this.lastStatus = err.status;
          this.lastResponse = err.error;
          this.lastAction = 'Error al obtener usuarios';
        }
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
        this.lastAction = 'Usuario creado con éxito';
        this.getUsers();
    },
    error: (err: { status: number | null; error: unknown }) => {
        this.lastStatus = err.status;
        this.lastResponse = err.error;
        this.lastAction = 'Error al crear usuario';
    },
  });
}

  deleteAll(): void {
  if (this.role !== 'admin') return;

  if (!this.users.length) {
    this.lastAction = 'No hay usuarios para eliminar';
    return;
  }

  forkJoin(this.users.map(user => this.userService.deleteUser(user.id))).subscribe({
    next: () => {
      this.users = [];
      this.lastStatus = 204;
      this.lastResponse = null;
      this.lastAction = 'Todos los usuarios eliminados';
    },
    error: (err: { status: number | null; error: unknown }) => {
      this.lastStatus = err.status;
      this.lastResponse = err.error;
      this.lastAction = 'Error al eliminar usuarios';
    },
  });
}
}
