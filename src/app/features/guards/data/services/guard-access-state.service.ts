import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppRole } from 'src/app/core/models/auth/auth.models';

export type GuardResultVariant = 'unauthorized' | 'admin' | 'guest' | 'login-required';

export interface GuardAccessResult {
  variant: GuardResultVariant;
  title: string;
  message: string;
  detail: string;
  requiredRole: string;
  currentRole: string;
  targetRoute: string;
  status: 'error' | 'success' | 'info';
}

@Injectable({ providedIn: 'root' })
export class GuardAccessStateService {
  private readonly stateSubject = new BehaviorSubject<GuardAccessResult | null>(null);

  state$(): Observable<GuardAccessResult | null> {
    return this.stateSubject.asObservable();
  }

  snapshot(): GuardAccessResult | null {
    return this.stateSubject.value;
  }

  setDenied(requiredRole: string, currentRole: AppRole | null, targetRoute: string): void {
    this.stateSubject.next({
      variant: 'unauthorized',
      title: 'Acceso denegado',
      message: 'No tienes permisos para acceder a esta ruta.',
      detail: 'Esta vista es parte del flujo de validacion de guards en Angular.',
      requiredRole: requiredRole.toUpperCase(),
      currentRole: currentRole ? currentRole.toUpperCase() : 'SIN ROL',
      targetRoute,
      status: 'error',
    });
  }

  setAllowed(role: AppRole, targetRoute: string): void {
    const normalizedRole = role.toUpperCase();
    const isAdmin = role === 'admin';

    this.stateSubject.next({
      variant: isAdmin ? 'admin' : 'guest',
      title: isAdmin ? 'Acceso permitido (Admin)' : 'Acceso como invitado',
      message: isAdmin
        ? 'Has accedido correctamente a una ruta protegida.'
        : 'Estas en una ruta accesible para usuarios con rol GUEST.',
      detail: isAdmin
        ? 'Esta vista es parte del flujo de validacion de guards en Angular.'
        : 'Esta vista demuestra un acceso limitado dentro del flujo de guards.',
      requiredRole: normalizedRole,
      currentRole: normalizedRole,
      targetRoute,
      status: isAdmin ? 'success' : 'info',
    });
  }

  setLoginRequired(targetRoute: string): void {
    this.stateSubject.next({
      variant: 'login-required',
      title: 'Sesion requerida',
      message: 'Necesitas un token activo para continuar con esta ruta protegida.',
      detail: 'Esta vista es parte del flujo de validacion de guards en Angular.',
      requiredRole: 'TOKEN ACTIVO',
      currentRole: 'SIN ROL',
      targetRoute,
      status: 'error',
    });
  }
}
