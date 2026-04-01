import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { UserResponseDto } from 'src/app/features/api/data/models/user-response.dto';
import { UserService } from './user-service';
import { CreateUserRequestDto } from '../models/create-user-request.dto';
import { HttpErrorAdapterService } from 'src/app/features/interceptors-lab/data/services/http-error-adapter.service';

export interface ApiCrudState {
  users: UserResponseDto[];
  lastResponse: unknown;
  lastStatus: number | null;
  lastAction: string;
  loadingUsers: boolean;
  creatingUser: boolean;
  deletingUserId: number | null;
  endpoint: string;
  lastEndpoint: string;
  error: string | null;
}

export interface ApiCrudEvent {
  type: 'info' | 'success' | 'warning';
  label: string;
}

@Injectable({ providedIn: 'root' })
export class ApiCrudStateService {
  private readonly initialState: ApiCrudState = {
    users: [],
    lastResponse: { message: 'Sin respuesta todavia.' },
    lastStatus: null,
    lastAction: 'Sin acciones recientes.',
    loadingUsers: false,
    creatingUser: false,
    deletingUserId: null,
    endpoint: '/api/users',
    lastEndpoint: 'Sin consumo reciente',
    error: null,
  };

  private readonly stateSubject = new BehaviorSubject<ApiCrudState>(this.initialState);
  private readonly eventsSubject = new Subject<ApiCrudEvent>();

  constructor(
    private readonly userService: UserService,
    private readonly errorAdapter: HttpErrorAdapterService,
  ) {}

  state$(): Observable<ApiCrudState> {
    return this.stateSubject.asObservable();
  }

  snapshot(): ApiCrudState {
    return this.stateSubject.value;
  }

  events$(): Observable<ApiCrudEvent> {
    return this.eventsSubject.asObservable();
  }

  fetchUsers(contextLabel = 'Usuarios cargados'): void {
    this.patchState({
      loadingUsers: true,
      error: null,
      lastAction: 'Cargando usuarios desde el backend...',
      lastEndpoint: '/api/users',
    });
    this.eventsSubject.next({ type: 'info', label: 'API: GET /users enviado' });

    this.userService.getUsers().subscribe({
      next: (response: HttpResponse<UserResponseDto[]>) => {
        const users = response.body || [];
        this.patchState({
          loadingUsers: false,
          users,
          lastResponse: users,
          lastStatus: response.status,
          lastAction: contextLabel,
          lastEndpoint: '/api/users',
          error: null,
        });
        this.eventsSubject.next({
          type: 'success',
          label: `API: GET /users respondio ${response.status} (${users.length} usuarios)`,
        });
      },
      error: (error: HttpErrorResponse) => {
        const normalized = this.errorAdapter.adapt(error);
        this.patchState({
          loadingUsers: false,
          users: [],
          lastResponse: {
            status: normalized.status,
            code: normalized.code,
            message: normalized.message,
            errors: normalized.fieldErrors,
          },
          lastStatus: normalized.status,
          lastAction: `Error al cargar usuarios: ${normalized.message}`,
          lastEndpoint: '/api/users',
          error: normalized.message,
        });
        this.eventsSubject.next({
          type: 'warning',
          label: `API: GET /users fallo (${normalized.status})`,
        });
      },
    });
  }

  createUser(dto: CreateUserRequestDto): Observable<HttpResponse<UserResponseDto>> {
    this.patchState({
      creatingUser: true,
      error: null,
      lastAction: 'Creando usuario...',
      lastEndpoint: '/auth/register',
    });
    this.eventsSubject.next({ type: 'info', label: 'API: POST /auth/register enviado' });

    return new Observable<HttpResponse<UserResponseDto>>((observer) => {
      this.userService.createUser(dto).subscribe({
        next: (response) => {
          this.patchState({
            creatingUser: false,
            lastResponse: response.body,
            lastStatus: response.status,
            lastAction: 'Ultima accion: Usuario creado correctamente',
            lastEndpoint: '/auth/register',
            error: null,
          });
          this.eventsSubject.next({
            type: 'success',
            label: `API: POST /auth/register respondio ${response.status}`,
          });
          observer.next(response);
          observer.complete();
        },
        error: (error: HttpErrorResponse) => {
          const normalized = this.errorAdapter.adapt(error);
          this.patchState({
            creatingUser: false,
            lastResponse: {
              status: normalized.status,
              code: normalized.code,
              message: normalized.message,
              errors: normalized.fieldErrors,
            },
            lastStatus: normalized.status,
            lastAction: `Error al crear usuario: ${normalized.message}`,
            lastEndpoint: '/auth/register',
            error: normalized.message,
          });
          this.eventsSubject.next({
            type: 'warning',
            label: `API: POST /auth/register fallo (${normalized.status})`,
          });
          observer.error(error);
        },
      });
    });
  }

  deleteUser(id: number, username: string): Observable<HttpResponse<void>> {
    this.patchState({
      deletingUserId: id,
      error: null,
      lastAction: `Eliminando usuario ${username}...`,
      lastEndpoint: `/users/${id}`,
    });
    this.eventsSubject.next({ type: 'info', label: `API: DELETE /users/${id} enviado` });

    return new Observable<HttpResponse<void>>((observer) => {
      this.userService.deleteUser(id).subscribe({
        next: (response) => {
          this.patchState({
            deletingUserId: null,
            users: this.stateSubject.value.users.filter((user) => user.id !== id),
            lastResponse: { deletedUserId: id, username },
            lastStatus: response.status,
            lastAction: `Ultima accion: Usuario ${username} eliminado`,
            lastEndpoint: `/users/${id}`,
            error: null,
          });
          this.eventsSubject.next({
            type: 'success',
            label: `API: DELETE /users/${id} respondio ${response.status}`,
          });
          observer.next(response);
          observer.complete();
        },
        error: (error: HttpErrorResponse) => {
          const normalized = this.errorAdapter.adapt(error);
          this.patchState({
            deletingUserId: null,
            lastResponse: {
              status: normalized.status,
              code: normalized.code,
              message: normalized.message,
              errors: normalized.fieldErrors,
            },
            lastStatus: normalized.status,
            lastAction: `Error al eliminar usuario: ${normalized.message}`,
            lastEndpoint: `/users/${id}`,
            error: normalized.message,
          });
          this.eventsSubject.next({
            type: 'warning',
            label: `API: DELETE /users/${id} fallo (${normalized.status})`,
          });
          observer.error(error);
        },
      });
    });
  }

  private patchState(patch: Partial<ApiCrudState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...patch,
    });
  }
}
