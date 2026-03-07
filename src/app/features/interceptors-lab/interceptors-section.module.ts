import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InterceptorsSectionRoutingModule } from './interceptors-section-routing.module';
import { InterceptorsSectionComponent } from './pages/interceptors/interceptors-section.component';


@NgModule({
  declarations: [InterceptorsSectionComponent],
  imports: [
    CommonModule,
    InterceptorsSectionRoutingModule,
    RouterModule
  ],
  providers: []
})
export class InterceptorsSectionModule { }
