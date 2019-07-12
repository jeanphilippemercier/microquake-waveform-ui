import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';

import { Injectable } from '@angular/core';
import { AuthService } from '@services/auth.service';
import { JwtInterceptor } from '@auth0/angular-jwt';


@Injectable({
  providedIn: 'root'
})
export class HttpErrorInterceptor implements HttpInterceptor {

  private _refreshTokenInProgress = false;

  constructor(
    private _authService: AuthService,
    private _jwtInterceptor: JwtInterceptor
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error && error.status) {

            if (error.status === 401) {

              // try to obtain new access token through refresh token
              if (this._jwtInterceptor.isWhitelistedDomain(request) && !this._jwtInterceptor.isBlacklistedRoute(request)) {

                // TODO: when obtaining new access token through refresh token, wait for all other requests until new access token received.
                // Now it sends multiple token refresh requests at the same time
                return this._authService.refresh().pipe(
                  mergeMap(() => this._jwtInterceptor.intercept(request, next)),
                  catchError((error2: HttpErrorResponse) => {
                    this._authService.logout();
                    return throwError(error2);
                  }));
              }
            }
          }
          return throwError(error);
        })
      );
  }
}
