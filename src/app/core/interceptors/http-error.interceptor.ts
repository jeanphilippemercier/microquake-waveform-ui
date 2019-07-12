import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Injectable } from '@angular/core';
import { AuthService } from '@services/auth.service';


@Injectable({
  providedIn: 'root'
})
export class HttpErrorInterceptor implements HttpInterceptor {

  constructor(
    private _authService: AuthService
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request)
      .pipe(
        map((event: HttpEvent<any>) => {
          // if (event instanceof HttpResponse) { }
          return event;
        }),
        catchError((error: HttpErrorResponse) => {
          if (error && error.status) {

            if (error.status === 401) {
              this._authService.logout();
            }

          }
          return throwError(error);
        })
      );
  }
}
