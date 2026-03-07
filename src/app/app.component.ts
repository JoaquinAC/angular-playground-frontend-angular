import { Component } from '@angular/core';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'playground-Angular';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.hydrateSession().subscribe();
  }
}
