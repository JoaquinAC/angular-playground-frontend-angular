import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GuardsSectionComponent } from './pages/guards-section/guards-section.component';
import { RoleGuard } from './guards/role-guard.guard';
const routes: Routes = [
  {
    path: '',
    component: GuardsSectionComponent
  },
  {
    path: 'guest-dashboard',
    canActivate: [RoleGuard],
    canLoad: [RoleGuard],
    data: { roles: ['guest'] },
    loadChildren: () =>
      import('./pages/guest-dashboard/guest-dashboard.module')
        .then(m => m.GuestDashboardModule)
  },
  {
    path: 'admin-dashboard',
    canActivate: [RoleGuard],
    canLoad: [RoleGuard],
    data: { roles: ['admin'] },
    loadChildren: () =>
      import('./pages/admin-dashboard/admin-dashboard.module')
        .then(m => m.AdminDashboardModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GuardsRoutingModule {}
