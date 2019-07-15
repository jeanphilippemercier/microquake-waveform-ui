import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JWT_OPTIONS, JwtInterceptor, JwtModule } from '@auth0/angular-jwt';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { environment } from '@env/environment';
import { HttpErrorInterceptor } from './interceptors/http-error.interceptor';
import { AuthService } from '@services/auth.service';

export function jwtOptionsFactory() {
  return {
    tokenGetter: () => {
      return AuthService.getAccessToken();
    },
    whitelistedDomains: [
      'api.microquake.org',
      'localhost'
    ],
    blacklistedRoutes: [
      `${environment.url}api/token/`,
      `${environment.url}api/token/refresh/`
    ]
  };
}

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    JwtModule.forRoot({
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory
      }
    }),
  ],
  providers: [
    JwtInterceptor, // Providing JwtInterceptor allow to inject JwtInterceptor manually into HttpErrorInterceptor
    {
      provide: HTTP_INTERCEPTORS,
      useExisting: JwtInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    },
  ],
})
export class CoreModule { }

