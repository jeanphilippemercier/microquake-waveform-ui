import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, ReplaySubject, BehaviorSubject } from 'rxjs';

import { environment } from '@env/environment';
import { AuthLoginInput, LoginResponseContext } from '@interfaces/auth.interface';
import { User } from '@interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // TODO: remove after getting user from api
  private _dummyUser: User = {
    username: `Jon Doe`
  };
  private _loginCheckUrl = `${environment.url}api/token/`;
  private _refreshTokenUrl = `${environment.url}api/token/refresh/`;
  private _loggedUser: BehaviorSubject<User> = new BehaviorSubject(undefined);

  public readonly loggedUser: Observable<User> = this._loggedUser.asObservable();
  public readonly initialized: BehaviorSubject<boolean> = new BehaviorSubject(false); // TODO: implement APP_INITIALIZER

  constructor(
    private _httpClient: HttpClient,
  ) { }

  private _setUser(user: User): void {
    this._loggedUser.next(user);
  }

  private _clearTokens(): void {
    this._setAccessToken(null);
    this._setRefreshToken(null);
  }

  private _handleAuthenticationError(err: any): void {
    // TODO: Only for authentication error codes
    this._clearTokens();
  }

  private _setAccessToken(accessToken: string): void {
    if (!accessToken) {
      localStorage.removeItem('access_token');
    } else {
      localStorage.setItem('access_token', accessToken);
    }
  }

  private _setRefreshToken(refreshToken: string): void {
    if (!refreshToken) {
      localStorage.removeItem('refresh_token');
    } else {
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  init(): Promise<void> {

    if (this.initialized.getValue()) {
      return Promise.resolve();
    }

    const tokenId = this.getAccessToken();

    if (tokenId !== null) {
      try {
        // TODO: get real user from api
        // const user = await this._userService.get();
        this._setUser(this._dummyUser);

      } catch (err) {
        this.logout();
      }
    } else {
      if (this._loggedUser.getValue() !== null) {
        this._setUser(null);
      }
    }
    this.initialized.next(true);
  }


  login(authLoginInput: AuthLoginInput): Observable<LoginResponseContext> {
    const body = authLoginInput;
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const postObservable = this._httpClient.post<LoginResponseContext>(this._loginCheckUrl, body, { headers });

    const subject = new ReplaySubject<LoginResponseContext>(1);
    subject.subscribe((r: LoginResponseContext) => {
      this._setAccessToken(r.access);
      this._setRefreshToken(r.refresh);
      this._setUser(this._dummyUser);
    }, (err) => {
      this._handleAuthenticationError(err);
    });

    postObservable.subscribe(subject);
    return subject;
  }

  refresh(): Observable<LoginResponseContext> {
    const body = new HttpParams().set('refresh_token', this.getRefreshToken());
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const refreshObservable = this._httpClient.post<LoginResponseContext>(this._refreshTokenUrl, body.toString(), { headers });

    const refreshSubject = new ReplaySubject<LoginResponseContext>(1);
    refreshSubject.subscribe((r: LoginResponseContext) => {
      this._setAccessToken(r.access);
      this._setRefreshToken(r.refresh);
      this._setUser(this._dummyUser);
    }, (err) => {
      this._handleAuthenticationError(err);
    });

    refreshObservable.subscribe(refreshSubject);
    return refreshSubject;
  }

  getAccessToken(): string {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string {
    return localStorage.getItem('refresh_token');
  }

  logout(): void {
    this._clearTokens();

    if (this._loggedUser.getValue() !== null) {
      this._setUser(null);
    }
  }

  isAuthenticated(): boolean {
    return this._loggedUser.getValue() !== null;
  }
}
