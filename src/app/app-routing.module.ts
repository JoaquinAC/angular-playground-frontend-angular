import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UnauthorizedComponent } from './features/unauthorized/pages/unauthorized/unauthorized.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () =>
      import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: 'guards',
    loadChildren: () =>
      import('./features/guards/guards-section.module').then(m => m.GuardsModule),
  },
  {
    path: 'interceptors',
    loadChildren: () =>
      import('./features/interceptors-lab/interceptors-section.module').then(m => m.InterceptorsSectionModule),
  },
  {
    path: 'observables',
    loadChildren: () =>
      import('./features/observables/observable-section.module').then(m => m.ObservableSectionModule),
  },
  {
    path: 'api-section',
    loadChildren: () =>
      import('./features/api/api-section.module').then(m => m.ApiSectionModule),
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent,
  },
  { path: '**', redirectTo: '' },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
