import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '@env/environment';
import { User } from '@interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private _httpClient: HttpClient,
  ) { }

  get(userId: number) {
    const queryUrl = `${environment.apiUrl}users/${userId}`;
    const result = this._httpClient.get<User>(queryUrl);

    return result;
  }

}
