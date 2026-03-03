import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'src/app/core/auth.service';

@Component({
  selector: 'app-modal-register',
  templateUrl: './modal-register.component.html',
  styleUrls: ['./modal-register.component.scss'],
})
export class ModalRegisterComponent {
  registerForm!: FormGroup;
  roles = [
    { label: 'Admin', value: 'ADMIN' },
    { label: 'User', value: 'GUEST' },
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModalRegisterComponent>,
    private authService: AuthService,
    private snackbar:MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['GUEST', Validators.required],
    });
  }
  
  onSubmit(): void {
    if (this.registerForm.invalid) return;

    const { username, email, password } = this.registerForm.value;

    this.authService.register({ username, email, password }).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.snackbar.open('No se pudo registrar el usuario', 'Cerrar', { duration: 2500 });
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
