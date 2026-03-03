import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
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
  {
    path: 'interceptors',
    loadChildren: () =>
      import('./interceptors-section/interceptors-section.module').then(m => m.InterceptorsSectionModule),
  },
  {
    path: 'observables',
    loadChildren: () =>
      import('./observable-section/observable-section.module').then(m => m.ObservableSectionModule),
  },
  {
    path: 'api-section',
    loadChildren: () =>
      import('./api-section/api-section.module').then(m => m.ApiSectionModule),
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
