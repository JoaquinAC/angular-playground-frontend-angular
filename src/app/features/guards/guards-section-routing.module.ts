import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GuardsSectionComponent } from '../features/guards/components/guards-section/guards-section.component';
import { RoleGuard } from './role-guard.guard';
const routes: Routes = [
  {
    path: '',
    component: GuardsSectionComponent
  },
  {
    path: 'guest-dashboard',
    canActivate: [RoleGuard],
    data: { roles: ['guest'] },
    loadChildren: () =>
      import('../features/guards/components/guest-dashboard/guest-dashboard.module')
        .then(m => m.GuestDashboardModule)
  },
  {
    path: 'admin-dashboard',
    canActivate: [RoleGuard],
    data: { roles: ['admin'] },
    loadChildren: () =>
      import('../features/guards/components/admin-dashboard/admin-dashboard.module')
        .then(m => m.AdminDashboardModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GuardsRoutingModule {}
