import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GuestDashboardRoutingModule } from './guest-dashboard-routing.module';
import { GuestDashboardComponent } from './guest-dashboard.component';
import { GuardResultCardModule } from 'src/app/shared/components/guard-result-card/guard-result-card.module';


@NgModule({
  declarations: [GuestDashboardComponent],
  imports: [
    CommonModule,
    GuestDashboardRoutingModule,
    GuardResultCardModule,
  ]
})
export class GuestDashboardModule { }
