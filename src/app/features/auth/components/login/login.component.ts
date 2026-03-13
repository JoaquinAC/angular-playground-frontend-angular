import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AppRole } from 'src/app/core/models/auth/auth.models';
import { ModalRegisterComponent } from '../modal-register/modal-register.component';
import { LocalStorageService } from 'src/app/core/storage/local-storage.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from 'src/app/features/interceptors-lab/data/services/notification.service';
import { fadeSlideInAnimation } from 'src/app/shared/animations/fade-slide-in.animation';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [fadeSlideInAnimation],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  currentToken: string | null = '';
  currentRole: string | null = '';
  statusMessage = '';

  private readonly redirectDelayMs = 1000;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private localStorage: LocalStorageService,
    private dialog: MatDialog,
    private router: Router,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadTokenData();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  private loadTokenData(): void {
    this.currentToken = this.localStorage.get<string>('token');
    this.currentRole = this.localStorage.get<string>('role');

    this.statusMessage = this.currentRole
      ? `Token ${this.currentRole.toUpperCase()} asignado en LocalStorage`
      : 'Sin token asignado';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.notificationService.error(this.buildInvalidFormMessage());
      return;
    }

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.loadTokenData();
        this.notificationService.success('Login exitoso');
        setTimeout(() => this.router.navigate(['/']), this.redirectDelayMs);
      },
      error: (errorResponse: HttpErrorResponse) => {
        const errorMessage =
          (errorResponse.error?.message as string | undefined) ||
          errorResponse.message ||
          'No se pudo iniciar sesión';

        this.notificationService.error(errorMessage);
      },
    });
  }

  openRegisterModal(): void {
    if (this.dialog.openDialogs.length > 0) return;

    this.dialog.open(ModalRegisterComponent, {
      width: '400px',
      panelClass: 'custom-dialog-panel',
      backdropClass: 'custom-dialog-backdrop',
      disableClose: true,
      autoFocus: false,
    });
    
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
        this.loadTokenData();
        this.notificationService.success(`Token ${role.toUpperCase()} asignado`);
      },
      error: (error: Error) => {
        this.notificationService.error(error.message);
      },
    });
  }
  
  get usernameError(): string {
    const control = this.loginForm.get('username');
    if (!control?.touched || !control.errors) return '';
    return 'Usuario vacío';
  }

  get passwordError(): string {
    const control = this.loginForm.get('password');
    if (!control?.touched || !control.errors) return '';
    return 'Contraseña vacía';
  }


  get maskedToken(): string {
    if (!this.currentToken) return '';
    const visibleChars = Math.max(Math.floor(this.currentToken.length * 0.25), 12);
    return `...${this.currentToken.slice(-visibleChars)}`;
  }

  get roleBadgeClass(): string {
    if (!this.currentRole) return 'role-chip role-chip--neutral';

    return this.currentRole.toLowerCase() === 'admin'
      ? 'role-chip role-chip--admin'
      : 'role-chip role-chip--guest';
  }

  private buildInvalidFormMessage(): string {
    const missingFields: string[] = [];

    if (this.loginForm.get('username')?.invalid) missingFields.push('usuario');
    if (this.loginForm.get('password')?.invalid) missingFields.push('contraseña');

    if (!missingFields.length) {
      return 'Completa los campos';
    }

    return `Completa los campos: ${missingFields.join(', ')}`;
  }
}