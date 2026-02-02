import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ObservableSectionRoutingModule } from './observable-section-routing.module';
import { ObservablesSectionComponent } from './component/observables-section.component';
import { ObservablesFlowModalComponent } from './component/flow-modal/observables-flow-modal.component';
import { MatDialogModule } from '@angular/material/dialog';


@NgModule({
  declarations: [
    ObservablesSectionComponent,
    ObservablesFlowModalComponent
  ],
  imports: [
    CommonModule,
    ObservableSectionRoutingModule,
    MatDialogModule
  ]
})
export class ObservableSectionModule { }
