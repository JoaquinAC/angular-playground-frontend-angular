import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'src/app/core/auth.service';
import { LocalStorageService } from 'src/app/core/local-storage.service';
import { ModalRegisterComponent } from '../modal-register/modal-register.component';

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
    this.currentToken = this.localStorage.get('token');
    this.currentRole = this.localStorage.get('role');
    this.statusMessage = this.currentRole
      ? `Token ${this.currentRole.toUpperCase()} asignado en LocalStorage`
      : 'Sin token asignado';
  }

onSubmit(): void {
  if (this.loginForm.invalid) {
    return;
  }
   alert("Login exitoso");
}
  openRegisterModal(): void {
    if (this.dialog.openDialogs.length > 0) return;

    const dialogRef = this.dialog.open(ModalRegisterComponent, {
      width: '400px',
      panelClass: 'custom-dialog-panel',
      backdropClass: 'custom-dialog-backdrop',
      disableClose: true, // Bloquea cierre accidental
      autoFocus: false, // Evita conflictos de focus
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Usuario creado con éxito', 'Cerrar', { duration: 2500 });
      }
    });
  }

  setGuestToken(): void {
    const role = this.localStorage.get('role');
    if (role === 'guest') {
      this.snackBar.open('Ya eres Invitado', 'Cerrar', { duration: 2000 });
      return;
    }
    this.authService.setToken('guest');
    this.loadTokenData();
    this.snackBar.open('Token Invitado asignado', 'Cerrar', { duration: 2000 });
  }

  setAdminToken(): void {
    const role = this.localStorage.get('role');
    if (role === 'admin') {
      this.snackBar.open('Ya eres Admin', 'Cerrar', { duration: 2000 });
      return;
    }
    this.authService.setToken('admin');
    this.loadTokenData();
    this.snackBar.open('Token Admin asignado', 'Cerrar', { duration: 2000 });
  }
}