import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminDashboardRoutingModule } from './admin-dashboard-routing.module';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { GuardResultCardModule } from 'src/app/shared/components/guard-result-card/guard-result-card.module';

@NgModule({
  declarations: [AdminDashboardComponent],
  imports: [
    CommonModule,
    AdminDashboardRoutingModule,
    GuardResultCardModule,
  ]
})
export class AdminDashboardModule { }
