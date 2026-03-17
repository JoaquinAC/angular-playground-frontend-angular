import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ObservableSectionRoutingModule } from './observable-section-routing.module';
import { ObservablesSectionComponent } from './components/observables-section.component';
import { ObservablesFlowModalComponent } from './components/flow-modal/observables-flow-modal.component';
import { MatDialogModule } from '@angular/material/dialog';



@NgModule({
  declarations: [
    ObservablesSectionComponent,
    ObservablesFlowModalComponent
  ],
  imports: [
    CommonModule,
    ObservableSectionRoutingModule,
    MatDialogModule,
    FormsModule
  ]
})
export class ObservableSectionModule { }
