import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate,CanLoad,Route,Router, UrlSegment, UrlTree } from '@angular/router';
import { AuthService } from 'src/app/core/auth/auth.service';
import { AppRole } from 'src/app/core/models/auth/auth.models';



@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate,CanLoad {

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const allowedRoles = route.data['roles'] as AppRole[];
        return this.validateAccess(allowedRoles);
  }

  canLoad(route: Route, _segments: UrlSegment[]): boolean | UrlTree {
    const allowedRoles = (route.data?.roles || []) as AppRole[];
    return this.validateAccess(allowedRoles);
  }

  private validateAccess(allowedRoles: AppRole[]): boolean | UrlTree {
    // 1️⃣ Autenticación
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/auth/login']);
    }

    if (!allowedRoles || allowedRoles.length === 0) {
      return false;
    }

    const userRole = this.authService.getRole();

    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    // 3️⃣ Acceso denegado
    return this.router.createUrlTree(['/unauthorized']);
  }
}