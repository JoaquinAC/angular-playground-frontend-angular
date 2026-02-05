import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InterceptorsSectionComponent } from './component/interceptors-section.component';
import { RouterModule } from '@angular/router';
import { InterceptorsSectionRoutingModule } from './interceptors-section-routing.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoaderInterceptor } from './interceptors/loader.interceptor';


@NgModule({
  declarations: [InterceptorsSectionComponent],
  imports: [
    CommonModule,
    InterceptorsSectionRoutingModule,
    RouterModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoaderInterceptor,
      multi: true
    }
  ]
})
export class InterceptorsSectionModule { }
