import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/core/auth/auth.service';
import { AppRole } from 'src/app/core/models/auth/auth.models';
import { UserResponseDto } from 'src/app/core/models/users/users.models';
import { NotificationService } from '../../data/services/notification.service';
import { InterceptorTestService } from '../../data/services/interceptor-test.service';



@Component({
  selector: 'app-interceptors-section',
  templateUrl: './interceptors-section.component.html',
  styleUrls: ['./interceptors-section.component.scss'],
})

export class InterceptorsSectionComponent implements OnInit {

  token: string | null = null;
  users: string[] = [];

  constructor(
    private interceptorTestService: InterceptorTestService,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {
    this.token = this.authService.getToken();
  }

  ngOnInit(): void {
    this.refreshState();
  }

  sendRequest(): void {
    this.users = [];

    this.interceptorTestService.getUsers().subscribe({
      next: (response: UserResponseDto[]) => {
        this.users = response.map(user => user.username);
        this.notificationService.success('Petición completada');
      },
      error: () => {
        // ErrorInterceptor maneja los mensajes globales
      },
    });
  }

  simulate401(): void {
    this.interceptorTestService.simulate401().subscribe({ error: () => {} });
  }

  simulate403(): void {
    this.interceptorTestService.simulate403().subscribe({ error: () => {} });
  }
  
  simulate500(): void {
    this.interceptorTestService.simulate500().subscribe({ error: () => {} });
  }

  setGuestToken(): void {
    this.switchRole('guest');
  }

  setAdminToken(): void {
    this.switchRole('admin');
  }

  private switchRole(role: AppRole): void {
    this.authService.loginAsRole(role).subscribe({
      next: () => {
        this.refreshState();
        this.sendRequest();
      },
      error: (error: Error) => {
        this.notificationService.error(error.message);
      },
    });
  }

  private refreshState(): void {
    this.token = this.authService.getToken();
  }

  
}
