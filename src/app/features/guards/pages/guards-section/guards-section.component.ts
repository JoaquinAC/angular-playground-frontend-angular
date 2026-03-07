import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/auth/auth.service';
import { AppRole } from 'src/app/core/models/auth/auth.models';

@Component({
  selector: 'app-guards-section',
  templateUrl: './guards-section.component.html',
  styleUrls: ['./guards-section.component.scss'],
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate(
          '220ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ])
    ])
  ]
})
export class GuardsSectionComponent implements OnInit {

  constructor(
  private router: Router,
  private route: ActivatedRoute,
  private authService: AuthService,
) {}
  
  token: string | null = null
  role: 'guest' | 'admin' | null = 'guest';

  ngOnInit(): void {
    this.syncState();
  }

    goToAdmin(): void {
    this.router.navigate(['/guards/admin-dashboard'], { relativeTo: this.route });
  }

  goToGuest(): void {
    this.router.navigate(['/guards/guest-dashboard'], { relativeTo: this.route });
  }

  private syncState(): void {
    this.token = this.authService.getToken();
    const storedRole = this.authService.getRole();

    this.role =
      storedRole === 'admin'
        ? 'admin'
        : storedRole === 'guest'
        ? 'guest'
        : null;
  }

  setGuestToken(): void {
    this.switchRole('guest');
  }

  setAdminToken(): void {
    this.switchRole('admin');
  }

  get roleLabel(): string {
    return this.role === 'admin' ? 'ADMIN' : 'INVITADO';
  }

  get hasToken(): boolean {
    return !!this.token;
  }

  private switchRole(role: AppRole): void {
    this.authService.loginAsRole(role).subscribe({
      next: () => this.syncState(),
      error: () => this.syncState(),
    });
  }

}
