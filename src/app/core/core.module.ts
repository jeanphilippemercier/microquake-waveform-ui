import { NgModule, APP_INITIALIZER } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JWT_OPTIONS, JwtInterceptor, JwtModule } from '@auth0/angular-jwt';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { environment } from '@env/environment';
import { HttpErrorInterceptor } from './interceptors/http-error.interceptor';
import { AuthService } from '@services/auth.service';
import { ConfigurationService } from '@services/configuration.service';
import { HttpCacheInterceptor } from './interceptors/http-cache.interceptor';

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

export function configInit(configurationService: ConfigurationService) {
  return () => configurationService.initAssetsConfig();
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
    JwtInterceptor,
    {
      provide: APP_INITIALIZER,
      useFactory: configInit,
      deps: [ConfigurationService],
      multi: true
    },
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
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpCacheInterceptor,
      multi: true
    }
  ],
})
export class CoreModule { }

