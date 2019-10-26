import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import ApiUtil from '@core/utils/api-util';
import { globals } from '@src/globals';
import { environment } from '@env/environment';
import { User } from '@interfaces/user.interface';
import { UserCreateInput, UserUpdateInput } from '@interfaces/user-dto.interface';


@Injectable({
  providedIn: 'root'
})
export class UsersApiService {

  constructor(
    private _http: HttpClient,
  ) { }


  /**
   * USERS
  */
  getUsers(query: any = {}): Observable<User[]> {
    const url = `${environment.apiUrl}users`;
    const params = ApiUtil.getHttpParams(query);

    return this._http.get<User[]>(url, { params });
  }

  getUser(id: number): Observable<User> {
    const url = `${environment.apiUrl}users/${id}`;
    return this._http.get<User>(url);
  }

  createUser(body: UserCreateInput): Observable<User> {
    const url = `${environment.apiUrl}users`;
    return this._http.post<User>(url, body);
  }

  updateUser(id: number, body: UserUpdateInput): Observable<User> {
    const url = `${environment.apiUrl}users/${id}`;
    return this._http.patch<User>(url, body);
  }

  deleteUser(id: number): Observable<any> {
    const url = `${environment.apiUrl}users/${id}`;
    return this._http.delete(url);
  }
}
