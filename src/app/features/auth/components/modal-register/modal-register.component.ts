import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'src/app/core/auth/auth.service';

@Component({
  selector: 'app-modal-register',
  templateUrl: './modal-register.component.html',
  styleUrls: ['./modal-register.component.scss'],
})
export class ModalRegisterComponent {
  registerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModalRegisterComponent>,
    private authService: AuthService,
    private snackbar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }
  
  onSubmit(): void {
    if (this.registerForm.invalid) return;

    const { username, email, password } = this.registerForm.value;

    this.authService.register({ username, email, password }).subscribe({
      next: () => {
        this.snackbar.open('✅ Usuario registrado con éxito', undefined, {
          duration: 1200,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['auth-toast', 'auth-toast--success'],
        });

        setTimeout(() => this.dialogRef.close(true), 800);
      },
      error: () => {
        this.snackbar.open('❌ No se pudo registrar el usuario', 'Cerrar', {
          duration: 2500,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['auth-toast', 'auth-toast--error'],
        });
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
