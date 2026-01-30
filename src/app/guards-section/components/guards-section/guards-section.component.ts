import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

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

  constructor(private router: Router , private route: ActivatedRoute) { }
  
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
    this.token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');

    this.role =
      storedRole === 'admin'
        ? 'admin'
        : storedRole === 'guest'
        ? 'guest'
        : null;
  }

  setGuestToken(): void {
    localStorage.setItem('token', 'guest-token-' + Math.random().toString(36).slice(2, 7));
    localStorage.setItem('role', 'guest');
    this.syncState();
  }

  setAdminToken(): void {
    localStorage.setItem('token', 'admin-token-' + Math.random().toString(36).slice(2, 7));
    localStorage.setItem('role', 'admin');
    this.syncState();
  }

  get roleLabel(): string {
    return this.role === 'admin' ? 'ADMIN' : 'INVITADO';
  }

  get hasToken(): boolean {
    return !!this.token;
  }

}
