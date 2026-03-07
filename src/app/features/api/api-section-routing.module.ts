import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApiSectionComponent } from './pages/api/api-section.component';


const routes: Routes = [
  {
      path: '',
      component: ApiSectionComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ApiSectionRoutingModule { }
