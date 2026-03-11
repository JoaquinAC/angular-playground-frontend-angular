import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/core/auth/auth.service';
import { NotificationService } from 'src/app/features/interceptors-lab/data/services/notification.service';

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
    private notificationService: NotificationService,
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }
  
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.notificationService.error(this.buildInvalidFormMessage());
      return;
    }

    const { username, email, password } = this.registerForm.value;

    this.authService.register({ username, email, password }).subscribe({
      next: (response) => {
        const status = this.extractStatusCode(response);
        const successMessage =
          status === 201 ? 'Registro exitoso (201)' : 'Usuario registrado con éxito';

        this.notificationService.success(successMessage);
        this.dialogRef.close({ success: true, message: successMessage });
      },
      error: (errorResponse: HttpErrorResponse) => {
        const backendMessage =
          (errorResponse.error?.message as string | undefined) ||
          (errorResponse.error?.error as string | undefined) ||
          errorResponse.message ||
          'No se pudo registrar el usuario';

       const failureMessage =
          errorResponse.status === 409
            ? `${backendMessage} (409)`
            : `${backendMessage}${errorResponse.status ? ` (${errorResponse.status})` 
            : ''}`;
        this.notificationService.error(failureMessage);
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  get usernameError(): string {
    const control = this.registerForm.get('username');
    if (!control?.touched || !control.errors) return '';
    return 'Usuario vacío';
  }

  get emailError(): string {
    const control = this.registerForm.get('email');
    if (!control?.touched || !control.errors) return '';

    if (control.hasError('required')) return 'Email vacío';
    if (control.hasError('email')) return 'Formato de email inválido';

    return 'Email inválido';
  }

  get passwordError(): string {
    const control = this.registerForm.get('password');
    if (!control?.touched || !control.errors) return '';
    return 'Contraseña vacía';
  }

  private buildInvalidFormMessage(): string {
    const missingFields: string[] = [];

    if (this.registerForm.get('username')?.invalid) missingFields.push('usuario');
    if (this.registerForm.get('email')?.invalid) missingFields.push('email');
    if (this.registerForm.get('password')?.invalid) missingFields.push('contraseña');

    if (!missingFields.length) {
      return 'Completa los campos correctamente';
    }

    return `Completa los campos: ${missingFields.join(', ')}`;
  }

  private extractStatusCode(response: unknown): number | null {
    if (response instanceof HttpResponse) {
      return response.status;
    }

    return null;
  }
}
