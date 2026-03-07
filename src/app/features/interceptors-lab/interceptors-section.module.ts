import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InterceptorsSectionComponent } from './pages/interceptors/interceptors-section.component';
import { RouterModule } from '@angular/router';
import { InterceptorsSectionRoutingModule } from './interceptors-section-routing.module';


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
