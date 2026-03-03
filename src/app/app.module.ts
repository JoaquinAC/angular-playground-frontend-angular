import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InterceptorsSectionComponent } from './interceptors-section/component/interceptors-section.component';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { InterceptorsSectionModule } from './interceptors-section/interceptors-section.module';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthInterceptor } from './interceptors-section/interceptors/auth.interceptor';
import { CacheInterceptor } from './interceptors-section/interceptors/cache.interceptor';
import { LoaderInterceptor } from './interceptors-section/interceptors/loader.interceptor';
import { ErrorInterceptor } from './interceptors-section/interceptors/error.interceptor';

@NgModule({
  declarations: [AppComponent, LoaderComponent, UnauthorizedComponent],
  imports: [BrowserModule,BrowserAnimationsModule ,AppRoutingModule,RouterModule,HttpClientModule,MatSnackBarModule],
  providers: [
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
