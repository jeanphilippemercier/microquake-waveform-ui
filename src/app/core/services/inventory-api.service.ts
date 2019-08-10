import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import ApiUtil from '@core/utils/api-util';
import { environment } from '@env/environment';
import { Sensor } from '@interfaces/inventory.interface';
import { PaginationResponse } from '@interfaces/dto.interface';
import { PaginationRequest } from '@interfaces/query.interface';


@Injectable({
  providedIn: 'root'
})
export class InventoryApiService {

  constructor(
    private _http: HttpClient,
  ) { }

  getSensors(query: PaginationRequest = {}): Observable<PaginationResponse<Sensor>> {
    const url = `${environment.apiUrl}inventory/sensors`;
    const params = ApiUtil.getHttpParams(query);

    return this._http.get<PaginationResponse<Sensor>>(url, { params });
  }

  getStations(): Observable<any> {
    const url = `${environment.apiUrl}inventory/stations`;
    const params = ApiUtil.getHttpParams({});

    return this._http.get<any>(url, { params });
  }
}
