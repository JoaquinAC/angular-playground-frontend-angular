import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/auth/auth.service';
import { AppRole } from 'src/app/core/models/auth/auth.models';
import { NotificationService } from 'src/app/features/interceptors-lab/data/services/notification.service';
import { fadeSlideInAnimation } from 'src/app/shared/animations/fade-slide-in.animation';

@Component({
  selector: 'app-guards-section',
  templateUrl: './guards-section.component.html',
  styleUrls: ['./guards-section.component.scss'],
  animations: [fadeSlideInAnimation],
})
export class GuardsSectionComponent implements OnInit {
  private readonly NAVIGATION_DELAY_MS = 900;

  token: string | null = null;
  role: AppRole | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.syncState();
  }

  goToAdmin(): void {
    this.validateAndNavigate('admin', '/guards/admin-dashboard', 'Admin Dashboard');
  }

  goToGuest(): void {
    this.validateAndNavigate('guest', '/guards/guest-dashboard', 'Guest Dashboard');
  }

  setGuestToken(): void {
    this.switchRole('guest');
  }

  setAdminToken(): void {
    this.switchRole('admin');
  }
  
  clearToken(): void {
    this.authService.clearSession();
    this.syncState();
    this.notificationService.success('Sesión limpiada. Ahora puedes probar la redirección a /auth/login.');
  }

  get roleLabel(): string {
    return this.role === 'admin' ? 'ADMIN' : 'INVITADO';
  }

  get hasToken(): boolean {
    return !!this.token;
  }

  get tokenPreview(): string {
    if (!this.token) return '— Sin token —';
    const prefix = this.token.slice(0, 18);
    const suffix = this.token.slice(-12);
    return `${prefix} ... ${suffix}`;
  }

  private syncState(): void {
    this.token = this.authService.getToken();
    this.role = this.authService.getRole();
  }

  private switchRole(role: AppRole): void {
    this.authService.loginAsRole(role).subscribe({
      next: () => {
        this.syncState();
        this.notificationService.success(`Token ${role.toUpperCase()} asignado correctamente.`);
      },
      error: () => {
        this.syncState();
        this.notificationService.error(`No se pudo asignar el token ${role.toUpperCase()}.`);
      },
    });
  }

  private validateAndNavigate(requiredRole: AppRole, targetUrl: string, targetLabel: string): void {
    this.syncState();

    if (!this.authService.isAuthenticated()) {
      this.notificationService.error('Acceso bloqueado: no hay token activo. Redirigiendo a /auth/login...');
      setTimeout(() => this.router.navigate(['/auth/login']), this.NAVIGATION_DELAY_MS);
      return;
    }

    const currentRole = this.authService.getRole();

    if (currentRole !== requiredRole) {
      this.notificationService.error(
        `Acceso bloqueado: se requiere rol ${requiredRole.toUpperCase()}. Redirigiendo a /unauthorized...`,
      );
      setTimeout(() => this.router.navigate(['/unauthorized']), this.NAVIGATION_DELAY_MS);
      return;
    }

    this.notificationService.success(`Acceso permitido. Ingresando a ${targetLabel}...`);
    setTimeout(() => this.router.navigate([targetUrl]), this.NAVIGATION_DELAY_MS);
  }

}
