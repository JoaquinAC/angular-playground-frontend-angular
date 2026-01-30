import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Route, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../core/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot
  ): boolean | UrlTree {

    // 1️⃣ Autenticación
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/auth/login']);
    }

    // 2️⃣ Autorización
    const allowedRoles = route.data['roles'] as string[];

    if (!allowedRoles || allowedRoles.length === 0) {
      return false; // configuración incorrecta
    }

    const userRole = this.authService.getRole();

    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    // 3️⃣ Acceso denegado
    return this.router.createUrlTree(['/unauthorized']);
  }
}