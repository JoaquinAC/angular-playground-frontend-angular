import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GuestDashboardRoutingModule } from './guest-dashboard-routing.module';
import { GuestDashboardComponent } from './guest-dashboard.component';


@NgModule({
  declarations: [GuestDashboardComponent],
  imports: [
    CommonModule,
    GuestDashboardRoutingModule
  ]
})
export class GuestDashboardModule { }
