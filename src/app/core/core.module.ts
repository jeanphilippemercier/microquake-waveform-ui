import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JWT_OPTIONS, JwtInterceptor, JwtModule } from '@auth0/angular-jwt';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { environment } from '@env/environment';
import { AuthService } from '@services/auth.service';
import { RefreshTokenInterceptor } from './interceptors/refresh-token-interceptor';
import { HttpErrorInterceptor } from './interceptors/http-error.interceptor';

export function jwtOptionsFactory(authService: AuthService) {
  return {
    tokenGetter: () => {
      return authService.getAccessToken();
    },
    whitelistedDomains: ['api.microquake.org', 'localhost'],
    blacklistedRoutes: [`${environment.apiUrl}/api/token`]
  };
}

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    JwtModule.forRoot({
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory,
        deps: [AuthService]
      }
    }),
  ],
  providers: [
    JwtInterceptor, // Providing JwtInterceptor allow to inject JwtInterceptor manually into RefreshTokenInterceptor
    {
      provide: HTTP_INTERCEPTORS,
      useExisting: JwtInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RefreshTokenInterceptor,
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

