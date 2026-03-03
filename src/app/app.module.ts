import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InterceptorsSectionComponent } from './interceptors-section/component/interceptors-section.component';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { InterceptorsSectionModule } from './interceptors-section/interceptors-section.module';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [AppComponent, LoaderComponent],
  imports: [BrowserModule,BrowserAnimationsModule ,AppRoutingModule,RouterModule, InterceptorsSectionModule,HttpClientModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
