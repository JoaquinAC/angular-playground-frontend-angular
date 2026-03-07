import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InterceptorsSectionComponent } from './pages/interceptors/interceptors-section.component';

const routes: Routes = [
  {
    path: '',
    component: InterceptorsSectionComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InterceptorsSectionRoutingModule { }
