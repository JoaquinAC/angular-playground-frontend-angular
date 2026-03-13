import { animate, style, transition, trigger } from '@angular/animations';

export const fadeSlideInAnimation = trigger('fadeSlideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(8px)' }),
    animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);