import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-auth-wrapper',
  templateUrl: './auth-wrapper.component.html',
  styleUrls: ['./auth-wrapper.component.scss'],
})
export class AuthWrapperComponent implements OnInit, OnDestroy {
  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit(): void {
    this.renderer.addClass(this.document.body, 'auth-page');
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(this.document.body, 'auth-page');
  }
}