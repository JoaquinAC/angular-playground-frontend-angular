import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { UnauthorizedComponent } from './features/unauthorized/pages/unauthorized/unauthorized.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthInterceptor } from '../app/features/interceptors-lab/interceptors/auth.interceptor';
import { CacheInterceptor } from '../app/features/interceptors-lab/interceptors/cache.interceptor';
import { LoaderInterceptor } from '../app/features/interceptors-lab/interceptors/loader.interceptor';
import { ErrorInterceptor } from '../app/features/interceptors-lab/interceptors/error.interceptor';
import { NotificationToastComponent } from './shared/components/notification-toast/notification-toast.component';


@NgModule({
  declarations: [AppComponent, LoaderComponent, UnauthorizedComponent,NotificationToastComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    RouterModule,
    HttpClientModule,
    MatSnackBarModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
