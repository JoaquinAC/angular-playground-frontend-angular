import { Component, OnInit } from '@angular/core';
import { UserResponseDto } from '../models/user-response.dto';
import { HttpResponse } from '@angular/common/http';
import { UserService } from 'src/app/core/services/api-section/user-service.ts.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-api-section',
  templateUrl: './api-section.component.html',
  styleUrls: ['./api-section.component.scss'],
  animations: [trigger('fadeSlideIn', [
        transition(':enter', [
          style({ opacity: 0, transform: 'translateY(8px)' }),
          animate(
            '220ms ease-out',
            style({ opacity: 1, transform: 'translateY(0)' })
          )
        ])
      ])]
})
export class ApiSectionComponent implements OnInit {

  
  users: UserResponseDto[] = [];

  lastResponse: any = null;
  lastStatus: number | null = null;
  lastAction: string | null = null;

  role: 'admin' | 'guest' | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.resolveRole();
  }

  /* ===========================
     ROLE RESOLUTION
  ============================ */

  private resolveRole(): void {
    const storedRole = localStorage.getItem('role');

    if (storedRole === 'admin' || storedRole === 'guest') {
      this.role = storedRole;
    } else {
      this.role = 'guest';
    }
  }

  /* ===========================
     CRUD ACTIONS
  ============================ */

  getUsers(): void {
    this.userService.getUsers()
      .subscribe({
        next: (res: HttpResponse<UserResponseDto[]>) => {
          this.users = res.body || [];
          this.lastResponse = res.body;
          this.lastStatus = res.status;
          this.lastAction = 'Usuarios obtenidos correctamente';
        },
        error: (err: { status: number | null; error: any; }) => {
          this.lastStatus = err.status;
          this.lastResponse = err.error;
          this.lastAction = 'Error al obtener usuarios';
        }
      });
  }

  createUser(): void {
    if (this.role !== 'admin') return;

    const payload = { name: 'Nuevo Usuario' };

    this.userService.createUser(payload)
      .subscribe({
        next: (res: HttpResponse<UserResponseDto>) => {
          this.lastStatus = res.status;
          this.lastResponse = res.body;
          this.lastAction = 'Usuario creado con éxito';
          this.getUsers();
        },
        error: (err: { status: number | null; error: any; }) => {
          this.lastStatus = err.status;
          this.lastResponse = err.error;
          this.lastAction = 'Error al crear usuario';
        }
      });
  }

  deleteAll(): void {
    if (this.role !== 'admin') return;

    this.userService.deleteAll()
      .subscribe({
        next: (res: HttpResponse<void>) => {
          this.users = [];
          this.lastStatus = res.status;
          this.lastResponse = null;
          this.lastAction = 'Todos los usuarios eliminados';
        },
        error: (err: { status: number | null; error: any; }) => {
          this.lastStatus = err.status;
          this.lastResponse = err.error;
          this.lastAction = 'Error al eliminar usuarios';
        }
      });
  }
}
