import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthWrapperComponent } from './auth-wrapper/auth-wrapper.component';
import { LoginComponent } from './components/login/login.component';
import { ModalRegisterComponent } from './components/modal-register/modal-register.component';

const routes: Routes = [
  {
    path: '',
    component: AuthWrapperComponent,
    children: [
      { path: '', component: LoginComponent },
      { path: 'register', component: ModalRegisterComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}