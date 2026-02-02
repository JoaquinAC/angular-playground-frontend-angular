import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ObservablesSectionComponent } from './component/observables-section.component';

const routes: Routes = [
  {
    path: '',
    component: ObservablesSectionComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ObservableSectionRoutingModule { }
