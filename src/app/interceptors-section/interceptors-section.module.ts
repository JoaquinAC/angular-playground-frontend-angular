import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InterceptorsSectionComponent } from './component/interceptors-section.component';
import { RouterModule } from '@angular/router';
import { InterceptorsSectionRoutingModule } from './interceptors-section-routing.module';


@NgModule({
  declarations: [InterceptorsSectionComponent],
  imports: [
    CommonModule,
    InterceptorsSectionRoutingModule,
    RouterModule
  ]
})
export class InterceptorsSectionModule { }
