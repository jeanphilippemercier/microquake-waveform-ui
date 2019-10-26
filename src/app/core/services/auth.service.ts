import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';

import { environment } from '@env/environment';
import { AuthLoginInput, LoginResponseContext, RefreshResponseContext, AuthRefreshInput, Token } from '@interfaces/auth.interface';
import { User } from '@interfaces/user.interface';
import { UserService } from '@services/user.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { UsersApiService } from './users-api.service';
import { UserCreateInput } from '@interfaces/user-dto.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _loggedUser: BehaviorSubject<User> = new BehaviorSubject(undefined);

  public readonly loggedUser: Observable<User> = this._loggedUser.asObservable();
  public readonly initialized: BehaviorSubject<boolean> = new BehaviorSubject(false); // TODO: implement APP_INITIALIZER
  public readonly decodedToken: BehaviorSubject<Token> = new BehaviorSubject(undefined);

  constructor(
    private _httpClient: HttpClient,
    private _userService: UserService,
    private _userApiService: UsersApiService,
    private _jwtHelperService: JwtHelperService
  ) { }

  public static getAccessToken(): string {
    return localStorage.getItem('access_token');
  }

  public static getRefreshToken(): string {
    return localStorage.getItem('refresh_token');
  }

  private _setUser(user: User): void {
    this._loggedUser.next(user);
  }

  private _clearTokens(): void {
    this._setAccessToken(null);
    this._setRefreshToken(null);
    this._setDecodedToken(null);
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

  private _decodeToken(encodedToken: string): Token {
    return this._jwtHelperService.decodeToken(encodedToken);
  }

  private _setDecodedToken(decodedToken: Token): void {
    this.decodedToken.next(decodedToken);
  }

  async init(): Promise<void> {
    if (this.initialized.getValue()) {
      return Promise.resolve();
    }

    const encodedToken = AuthService.getAccessToken();

    if (encodedToken !== null) {
      const decodedToken = this._decodeToken(encodedToken);
      this._setDecodedToken(decodedToken);

      try {
        const user = await this._userService.get(decodedToken.user_id).toPromise();
        this._setUser(user);
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


  login(data: AuthLoginInput): Observable<User> {
    const queryUrl = `${environment.url}api/token/`;

    return this._httpClient.post<LoginResponseContext>(queryUrl, data)
      .pipe(
        mergeMap((r: LoginResponseContext) => {
          this._setAccessToken(r.access);
          this._setRefreshToken(r.refresh);
          const decodedToken = this._decodeToken(r.access);
          this._setDecodedToken(decodedToken);

          return this._userService.get(decodedToken.user_id);
        }),
        mergeMap((user: User) => {
          this._setUser(user);
          return of(user);
        }),
        catchError((err) => {
          this._handleAuthenticationError(err);
          return throwError(err);
        }));
  }

  register(data: UserCreateInput): Observable<User> {
    return this._userApiService.createUser(data)
      .pipe(
        mergeMap((createdUser: User) => {
          const authLoginInput: AuthLoginInput = {
            username: createdUser.username,
            password: data.password
          };
          return this.login(authLoginInput);
        }),
        catchError((err) => {
          this._handleAuthenticationError(err);
          return throwError(err);
        }));
  }

  refresh(): Observable<User> {
    const queryUrl = `${environment.url}api/token/refresh/`;
    const data: AuthRefreshInput = {
      refresh: AuthService.getRefreshToken()
    };

    return this._httpClient.post<RefreshResponseContext>(queryUrl, data)
      .pipe(
        mergeMap((res: RefreshResponseContext) => {
          this._setAccessToken(res.access);
          const decodedToken = this._decodeToken(res.access);
          this._setDecodedToken(decodedToken);
          return this._userService.get(decodedToken.user_id);
        }),
        mergeMap((user: User) => {
          this._setUser(user);
          return of(user);
        }),
        catchError((err) => {
          this._handleAuthenticationError(err);
          return throwError(err);
        })
      );
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

  // TODO: tmp solution until app initializer
  async waitForInitialization(): Promise<boolean> {
    if (this.initialized.getValue()) {
      return Promise.resolve(true);
    }

    return new Promise<boolean>(resolve => {
      const sub = this.initialized.subscribe(data => {
        if (data === true) {
          sub.unsubscribe();
          resolve(true);
        }
      });
    });
  }

}
