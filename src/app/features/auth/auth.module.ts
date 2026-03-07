import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { ModalRegisterComponent } from './components/modal-register/modal-register.component';
import { AuthRoutingModule } from './auth-routing.module';
import { AuthWrapperComponent } from './pages/auth-wrapper/auth-wrapper.component';
import { CustomSelectComponent } from 'src/app/shared/components/custom-select/custom-select.component';
import { LoginComponent } from './components/login/login.component';

@NgModule({
  declarations: [LoginComponent,ModalRegisterComponent, AuthWrapperComponent ,CustomSelectComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthRoutingModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,
    MatCardModule,
    MatSelectModule,
    MatDividerModule,
  ],
})
export class AuthModule {}
