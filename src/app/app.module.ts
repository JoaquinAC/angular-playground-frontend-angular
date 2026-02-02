import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InterceptorsSectionComponent } from './interceptors-section/component/interceptors-section.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule,BrowserAnimationsModule ,AppRoutingModule,RouterModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
