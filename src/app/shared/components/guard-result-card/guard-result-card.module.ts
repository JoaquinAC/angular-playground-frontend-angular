import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GuardResultCardComponent } from './guard-result-card.component';

@NgModule({
  declarations: [GuardResultCardComponent],
  imports: [CommonModule, RouterModule],
  exports: [GuardResultCardComponent],
})
export class GuardResultCardModule {}
