import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'src/app/core/auth/auth.service';

@Component({
  selector: 'app-modal-register',
  templateUrl: './modal-register.component.html',
  styleUrls: ['./modal-register.component.scss'],
})
export class ModalRegisterComponent implements OnDestroy {
  registerForm!: FormGroup;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  toastVisible = false;

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModalRegisterComponent>,
    private authService: AuthService,
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }
  
  onSubmit(): void {
    if (this.registerForm.invalid) return;

    const { username, email, password } = this.registerForm.value;

    this.authService.register({ username, email, password }).subscribe({
      next: response => {
        const status = this.extractStatusCode(response);
        if (status === 201) {
          this.showToast('success', 'Registro exitoso (201)');
          setTimeout(() => this.dialogRef.close(true), 900);
          return;
        }

        this.showToast('success', 'Usuario registrado con éxito');
        setTimeout(() => this.dialogRef.close(true), 900);
      },
      error: (errorResponse: HttpErrorResponse) => {
        const backendMessage =
          (errorResponse.error?.message as string | undefined) ||
          (errorResponse.error?.error as string | undefined) ||
          errorResponse.message;

        if (errorResponse.status === 409) {
          this.showToast('error', `${backendMessage} (409)`);
          return;
        }

        this.showToast('error', backendMessage || 'No se pudo registrar el usuario');
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  private showToast(type: 'success' | 'error', message: string): void {
    this.toastType = type;
    this.toastMessage = message;
    this.toastVisible = true;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, type === 'success' ? 1200 : 2500);
  }

  private extractStatusCode(response: unknown): number | null {
    if (response instanceof HttpResponse) {
      return response.status;
    }

    return null;
  }
}
