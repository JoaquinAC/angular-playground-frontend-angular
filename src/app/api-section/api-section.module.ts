import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApiSectionRoutingModule } from './api-section-routing.module';
import { ApiSectionComponent } from './component/api-section.component';


@NgModule({
  declarations: [ApiSectionComponent],
  imports: [
    CommonModule,
    ApiSectionRoutingModule
  ]
})
export class ApiSectionModule { }
