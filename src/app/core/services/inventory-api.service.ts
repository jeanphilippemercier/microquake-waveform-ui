import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import ApiUtil from '@core/utils/api-util';
import { environment } from '@env/environment';
import { Sensor } from '@interfaces/event.interface';


@Injectable({
  providedIn: 'root'
})
export class InventoryApiService {

  constructor(
    private _http: HttpClient,
  ) { }

  getSensors(): Observable<Sensor[]> {
    const url = `${environment.apiUrl}inventory/sensors`;
    const params = ApiUtil.getHttpParams({});

    return this._http.get<Sensor[]>(url, { params });
  }
}
