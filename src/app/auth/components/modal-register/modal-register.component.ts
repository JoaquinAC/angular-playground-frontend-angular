import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/core/auth.service';

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
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['guest', Validators.required],
    });
  }
  
  onSubmit(): void {
  if (this.registerForm.invalid) {
    return;
  }
   alert("Login exitoso");
}

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
