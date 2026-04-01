import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiSectionRoutingModule } from './api-section-routing.module';
import { ApiSectionComponent } from './pages/api/api-section.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [ApiSectionComponent],
  imports: [
    CommonModule,
    ApiSectionRoutingModule,
    ReactiveFormsModule,
  ]
})
export class ApiSectionModule { }
