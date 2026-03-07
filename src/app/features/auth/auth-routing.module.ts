import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { ModalRegisterComponent } from './components/modal-register/modal-register.component';
import { AuthWrapperComponent } from './pages/auth-wrapper/auth-wrapper.component';

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