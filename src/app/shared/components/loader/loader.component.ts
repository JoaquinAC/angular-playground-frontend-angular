import { Component } from '@angular/core';
import { LoaderService } from 'src/app/core/services/interceptors-section/loader.service';


@Component({
  selector: 'app-loader',
  template: `
    <div class="global-loader" *ngIf="loading$ | async">
      <div class="spinner"></div>
    </div>
  `,
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent {
  loading$ = this.loaderService.loading$;

  constructor(private loaderService: LoaderService) {}
}