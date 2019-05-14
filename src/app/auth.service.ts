import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable, ReplaySubject } from 'rxjs';

export interface LoginResponse {
  /**
   * access token string
   */
  access: string;
  /**
   * access token string
   */
  refresh: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor (private httpClient: HttpClient) {
  }

  loginCheckUrl = `${environment.url}api/token/`;
  refreshTokenUrl = `${environment.url}api/token/refresh/`;

  login (username: string, password: string): Observable<LoginResponse> {
    const body = {username: username, password: password};

    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const postObservable = this.httpClient.post<LoginResponse>(this.loginCheckUrl, body, { headers });

    const subject = new ReplaySubject<LoginResponse>(1);
    subject.subscribe((r: LoginResponse) => {
      this.setAccessToken(r.access);
      this.setRefreshToken(r.refresh);
    }, (err) => {
      this.handleAuthenticationError(err);
    });

    postObservable.subscribe(subject);
    return subject;
  }

  refresh (): Observable<LoginResponse> {
    const body = new HttpParams().set('refresh_token', this.getRefreshToken());

    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const refreshObservable = this.httpClient.post<LoginResponse>(this.refreshTokenUrl, body.toString(), { headers });

    const refreshSubject = new ReplaySubject<LoginResponse>(1);
    refreshSubject.subscribe((r: LoginResponse) => {
      this.setAccessToken(r.access);
      this.setRefreshToken(r.refresh)
    }, (err) => {
      this.handleAuthenticationError(err);
    });

    refreshObservable.subscribe(refreshSubject);
    return refreshSubject;
  }

  logout () {
    this.setAccessToken(null);
    this.setRefreshToken(null);
  }

  isAuthenticated (): boolean {
    return !!this.getAccessToken();
  }

  private handleAuthenticationError (err: any) {
    // TODO: Only for authentication error codes
    this.setAccessToken(null);
    this.setRefreshToken(null);
  }

  private setAccessToken (accessToken: string) {
    if (!accessToken) {
      localStorage.removeItem('access_token');
    } else {
      localStorage.setItem('access_token', accessToken);
    }
  }

  private setRefreshToken (refreshToken: string) {
    if (!refreshToken) {
      localStorage.removeItem('refresh_token');
    } else {
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  getAccessToken () {
    return localStorage.getItem('access_token');
  }

  getRefreshToken () {
    return localStorage.getItem('refresh_token');
  }
}
