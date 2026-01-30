import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./dashboard/dashboard.module').then(m => m.DashboardModule),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: 'guards',
    loadChildren: () =>
      import('./guards-section/guards-section.module').then(m => m.GuardsModule),
  },
  { path: '**', redirectTo: '' },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
