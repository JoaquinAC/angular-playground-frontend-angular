import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanLoad,
  Route,
  Router,
  UrlSegment,
  UrlTree,
} from '@angular/router';
import { AuthService } from 'src/app/core/auth/auth.service';
import { AppRole } from 'src/app/core/models/auth/auth.models';
import { GuardAccessStateService } from '../data/services/guard-access-state.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate, CanLoad {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly guardAccessState: GuardAccessStateService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const allowedRoles = route.data['roles'] as AppRole[];
    const pathSegments = route.pathFromRoot.reduce<string[]>((accumulator, segment) => {
      return [...accumulator, ...segment.url.map((urlSegment) => urlSegment.path)];
    }, []);
    const targetRoute = `/${pathSegments.filter(Boolean).join('/')}`;

    return this.validateAccess(allowedRoles, targetRoute || '/guards');
  }

  canLoad(route: Route, _segments: UrlSegment[]): boolean | UrlTree {
    const allowedRoles = (route.data?.roles || []) as AppRole[];
    const targetRoute = route.path ? `/guards/${route.path}` : '/guards';
    return this.validateAccess(allowedRoles, targetRoute);
  }

  private validateAccess(allowedRoles: AppRole[], targetRoute: string): boolean | UrlTree {
    if (!this.authService.isAuthenticated()) {
      this.guardAccessState.setLoginRequired(targetRoute);
      return this.router.createUrlTree(['/auth/login']);
    }

    if (!allowedRoles || allowedRoles.length === 0) {
      return false;
    }

    const userRole = this.authService.getRole();

    if (userRole && allowedRoles.includes(userRole)) {
      this.guardAccessState.setAllowed(userRole, targetRoute);
      return true;
    }

    this.guardAccessState.setDenied(allowedRoles[0] || 'admin', userRole ?? null, targetRoute);
    return this.router.createUrlTree(['/unauthorized']);
  }
}
