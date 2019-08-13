import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import ApiUtil from '@core/utils/api-util';
import { globals } from '@src/globals';
import { environment } from '@env/environment';
import { Site } from '@interfaces/inventory.interface';
import { Sensor, Component, SensorType } from '@interfaces/inventory.interface';
import { PaginationResponse } from '@interfaces/dto.interface';
import { PaginationRequest } from '@interfaces/query.interface';
import { SiteUpdateInput, SiteCreateInput } from '@interfaces/inventory-dto.interface';


@Injectable({
  providedIn: 'root'
})
export class InventoryApiService {

  constructor(
    private _http: HttpClient,
  ) { }


  getSites(): Observable<Site[]> {
    const url = `${environment.apiUrl}${globals.apiSites}`;
    return this._http.get<Site[]>(url);
  }

  getSite(siteId: number): Observable<Site> {
    const url = `${environment.apiUrl}${globals.apiSites}/${siteId}`;
    return this._http.get<Site>(url);
  }

  updateSite(siteId: number, body: SiteUpdateInput): Observable<Site> {
    const url = `${environment.apiUrl}${globals.apiSites}/${siteId}`;
    return this._http.patch<Site>(url, body);
  }

  createSite(body: SiteCreateInput): Observable<Site> {
    const url = `${environment.apiUrl}${globals.apiSites}`;
    return this._http.post<Site>(url, body);
  }

  getSensors(query: PaginationRequest = {}): Observable<PaginationResponse<Sensor>> {
    const url = `${environment.apiUrl}inventory/sensors`;
    const params = ApiUtil.getHttpParams(query);

    return this._http.get<PaginationResponse<Sensor>>(url, { params });
  }

  getSensorTypes(query: any = {}): Observable<SensorType> {
    const url = `${environment.apiUrl}inventory/sensors`;
    const params = ApiUtil.getHttpParams(query);

    return this._http.get<SensorType>(url, { params });
  }

  getComponents(query: PaginationRequest = {}): Observable<PaginationResponse<Component>> {
    const url = `${environment.apiUrl}inventory/comonents`;
    const params = ApiUtil.getHttpParams(query);

    return this._http.get<PaginationResponse<Component>>(url, { params });
  }

  getStations(): Observable<any> {
    const url = `${environment.apiUrl}inventory/stations`;
    const params = ApiUtil.getHttpParams({});

    return this._http.get<any>(url, { params });
  }
}
