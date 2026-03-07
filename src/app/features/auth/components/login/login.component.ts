import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppRole } from 'src/app/core/models/auth/auth.models';
import { ModalRegisterComponent } from '../modal-register/modal-register.component';
import { LocalStorageService } from 'src/app/core/storage/local-storage.service';
import { AuthService } from 'src/app/core/auth/auth.service';

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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private localStorage: LocalStorageService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
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
        this.snackBar.open('Login exitoso', 'Cerrar', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('No se pudo iniciar sesión', 'Cerrar', { duration: 2500 });
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
        this.snackBar.open('Usuario creado con éxito', 'Cerrar', { duration: 2500 });
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
        this.snackBar.open(`Token ${role.toUpperCase()} asignado`, 'Cerrar', { duration: 2000 });
      },
      error: (error: Error) => {
        this.snackBar.open(error.message, 'Cerrar', { duration: 3000 });
      },
    });
  }
}