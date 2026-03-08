import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppRole } from 'src/app/core/models/auth/auth.models';
import { ModalRegisterComponent } from '../modal-register/modal-register.component';
import { LocalStorageService } from 'src/app/core/storage/local-storage.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  currentToken: string | null = '';
  currentRole: string | null = '';
  statusMessage = '';
  showNotif = false;
  notifMessage = '';

  private readonly redirectDelayMs = 1000;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private localStorage: LocalStorageService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
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
    if (this.loginForm.invalid) return;

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.loadTokenData();
        this.showSuccessNotification('✅ Login exitoso');
        setTimeout(() => this.router.navigate(['/']), this.redirectDelayMs);
      },
      error: () => {
        this.showErrorNotification('❌ No se pudo iniciar sesión');
      },
    });
  }

  openRegisterModal(): void {
    if (this.dialog.openDialogs.length > 0) return;

    const dialogRef = this.dialog.open(ModalRegisterComponent, {
      width: '400px',
      panelClass: 'custom-dialog-panel',
      backdropClass: 'custom-dialog-backdrop',
      disableClose: true,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.showSuccessNotification('✅ Usuario creado con éxito');
      }
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
        this.showSuccessNotification(`✅ Token ${role.toUpperCase()} asignado`);
      },
      error: (error: Error) => {
        this.showErrorNotification(`❌ ${error.message}`);
      },
    });
  }
  
    get maskedToken(): string {
      if (!this.currentToken) return '';

      const visibleChars = Math.max(Math.floor(this.currentToken.length * 0.25), 10);
      return `${this.currentToken.slice(0, visibleChars)}...`;
    }

    get roleBadgeClass(): string {
      if (!this.currentRole) return 'role-chip role-chip--neutral';

      return this.currentRole.toLowerCase() === 'admin'
        ? 'role-chip role-chip--admin'
        : 'role-chip role-chip--guest';
    }

    private showSuccessNotification(message: string): void {
      this.snackBar.open(message, undefined, {
        duration: this.redirectDelayMs,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['auth-toast', 'auth-toast--success'],
      });
    }

    private showErrorNotification(message: string): void {
      this.snackBar.open(message, 'Cerrar', {
        duration: 2500,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['auth-toast', 'auth-toast--error'],
      });
  }
}