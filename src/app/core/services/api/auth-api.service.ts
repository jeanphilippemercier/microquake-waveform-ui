import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';
import { AuthLoginInput, LoginResponseContext, AuthRefreshInput, RefreshResponseContext } from '@interfaces/auth.interface';

const apiPath = {
  token: `token`,
  refresh: `refresh`,
};

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {

  constructor(
    private _http: HttpClient,
  ) { }

  login(data: AuthLoginInput): Observable<LoginResponseContext> {
    const queryUrl = `${environment.url}api/${apiPath.token}/`;
    return this._http.post<LoginResponseContext>(queryUrl, data);
  }

  refresh(data: AuthRefreshInput): Observable<RefreshResponseContext> {
    const queryUrl = `${environment.url}api/${apiPath.token}/${apiPath.refresh}/`;
    return this._http.post<RefreshResponseContext>(queryUrl, data);
  }

}
