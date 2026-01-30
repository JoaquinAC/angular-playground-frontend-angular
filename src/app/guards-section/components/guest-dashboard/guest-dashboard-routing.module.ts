import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GuestDashboardComponent } from './guest-dashboard.component';

 const routes: Routes = [
  {
    path: '',
    component: GuestDashboardComponent
  }
  ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GuestDashboardRoutingModule {
 
 }
