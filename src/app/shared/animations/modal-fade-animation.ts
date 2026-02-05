import { trigger, transition, style, animate } from '@angular/animations';

export const modalFadeSlide = trigger('modalFadeSlide', [
  transition(':enter', [
    style({
      opacity: 0,
      transform: 'translateY(18px) scale(0.96)'
    }),
    animate(
      '300ms cubic-bezier(0.25, 0.8, 0.25, 1)',
      style({
        opacity: 1,
        transform: 'translateY(0) scale(1)'
      })
    )
  ]),
  transition(':leave', [
    animate(
      '200ms ease-in',
      style({
        opacity: 0,
        transform: 'translateY(10px) scale(0.97)'
      })
    )
  ])
]);