import { Component, OnInit } from '@angular/core';
import { InterceptorTestService } from 'src/app/core/services/interceptors-section/interceptor-test.service';

@Component({
  selector: 'app-interceptors-section',
  templateUrl: './interceptors-section.component.html',
  styleUrls: ['./interceptors-section.component.scss'],
})
// implements OnInit
export class InterceptorsSectionComponent implements OnInit {

 
  token: string | null = null;
  users: string[] = [];

  constructor(
    private interceptorTestService: InterceptorTestService
  ) {
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void {
    console.log('InterceptorsSectionComponent initialized');
  }
  sendRequest(): void {
    this.users = [];

    this.interceptorTestService.getUsers().subscribe({
      next: (response) => {
        this.users = response;
      },
      error: () => {
        // El ErrorInterceptor se encarga
      }
    });
  }

  simulate401(): void {
    this.interceptorTestService.simulate401().subscribe({
      error: () => {}
    });
  }

  simulate403(): void {
    this.interceptorTestService.simulate403().subscribe({
      error: () => {}
    });
  }

  setGuestToken(): void {
  localStorage.setItem('token', 'guest-demo-token');
  this.token = 'guest-demo-token';
  this.sendRequest();
}

  setAdminToken(): void {
    localStorage.setItem('token', 'admin-demo-token');
    this.token = 'admin-demo-token';
    this.sendRequest();
  }
}
