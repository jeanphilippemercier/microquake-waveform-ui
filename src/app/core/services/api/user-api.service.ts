import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import ApiUtil from '@core/utils/api-util';
import { environment } from '@env/environment';
import { User } from '@interfaces/user.interface';
import { UserCreateInput, UserUpdateInput } from '@interfaces/user-dto.interface';

const apiPath = {
  users: `users`
};

@Injectable({
  providedIn: 'root'
})
export class UserApiService {

  constructor(
    private _http: HttpClient,
  ) { }

  getUsers(query: any = {}): Observable<User[]> {
    const url = `${environment.apiUrl}${apiPath.users}`;
    const params = ApiUtil.getHttpParams(query);
    return this._http.get<User[]>(url, { params });
  }

  getUser(id: number): Observable<User> {
    const url = `${environment.apiUrl}${apiPath.users}/${id}`;
    return this._http.get<User>(url);
  }

  createUser(body: UserCreateInput): Observable<User> {
    const url = `${environment.apiUrl}${apiPath.users}`;
    return this._http.post<User>(url, body);
  }

  updateUser(id: number, body: UserUpdateInput): Observable<User> {
    const url = `${environment.apiUrl}${apiPath.users}/${id}`;
    return this._http.patch<User>(url, body);
  }

  deleteUser(id: number): Observable<any> {
    const url = `${environment.apiUrl}${apiPath.users}/${id}`;
    return this._http.delete(url);
  }
}
