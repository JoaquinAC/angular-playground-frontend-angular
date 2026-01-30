import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuardsRoutingModule } from './guards-section-routing.module';

import { GuardsSectionComponent } from './components/guards-section/guards-section.component';

@NgModule({
  declarations: [
    GuardsSectionComponent,
  ],
  imports: [
    CommonModule,
    GuardsRoutingModule
  ]
})
export class GuardsModule {}