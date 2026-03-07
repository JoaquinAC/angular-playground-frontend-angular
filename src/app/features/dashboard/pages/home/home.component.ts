import { Component } from '@angular/core';
import { fadeAnimation } from 'src/app/shared/animations/fade.animation';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [fadeAnimation]
})
export class HomeComponent {

  constructor() { }

}
