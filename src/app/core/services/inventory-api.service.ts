import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import ApiUtil from '@core/utils/api-util';
import { globals } from '@src/globals';
import { environment } from '@env/environment';
import { Site, Station, Borehole, Cable, ISensorType } from '@interfaces/inventory.interface';
import { Sensor, IComponent, SensorType } from '@interfaces/inventory.interface';
import { PaginationResponse } from '@interfaces/dto.interface';
import { PaginationRequest } from '@interfaces/query.interface';
import { SiteUpdateInput, SiteCreateInput, SensorCreateInput, SensorUpdateInput } from '@interfaces/inventory-dto.interface';
import { share } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class InventoryApiService {

  constructor(
    private _http: HttpClient,
  ) { }


  /**
   * SITES
  */
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


  /**
   * SENSORS
  */
  getSensors(query: PaginationRequest = {}): Observable<PaginationResponse<Sensor>> {
    const url = `${environment.apiUrl}inventory/sensors`;
    const params = ApiUtil.getHttpParams(query);

    return this._http.get<PaginationResponse<Sensor>>(url, { params });
  }

  getSensor(sensorId: number): Observable<Sensor> {
    const url = `${environment.apiUrl}inventory/sensors/${sensorId}`;
    return this._http.get<Sensor>(url);
  }

  createSensor(body: SensorCreateInput): Observable<Sensor> {
    const url = `${environment.apiUrl}inventory/sensors`;
    return this._http.post<Sensor>(url, body);
  }

  updateSensor(sensorId: number, body: SensorUpdateInput): Observable<Sensor> {
    const url = `${environment.apiUrl}inventory/sensors/${sensorId}`;
    return this._http.patch<Sensor>(url, body);
  }

  deleteSensor(sensorId: number): Observable<Sensor> {
    const url = `${environment.apiUrl}inventory/sensors/${sensorId}`;
    return this._http.delete<Sensor>(url);
  }


  /**
   * SENSOR TYPES
  */
  getSensorTypes(query: any = {}): Observable<ISensorType[]> {
    const url = `${environment.apiUrl}inventory/sensor_types`;
    const params = ApiUtil.getHttpParams(query);

    return this._http.get<ISensorType[]>(url, { params });
  }


  /**
   * COMPONENTS
  */
  getComponents(query: PaginationRequest = {}): Observable<PaginationResponse<IComponent>> {
    const url = `${environment.apiUrl}inventory/components`;
    const params = ApiUtil.getHttpParams(query);

    return this._http.get<PaginationResponse<IComponent>>(url, { params });
  }

  getComponent(id: number): Observable<IComponent> {
    const url = `${environment.apiUrl}inventory/components/${id}`;
    return this._http.get<IComponent>(url);
  }

  createComponent(body: any): Observable<IComponent> {
    const url = `${environment.apiUrl}inventory/components`;
    return this._http.post<IComponent>(url, body);
  }

  deleteComponent(id: number): Observable<IComponent> {
    const url = `${environment.apiUrl}inventory/components/${id}`;
    return this._http.delete<IComponent>(url);
  }


  /**
   * STATIONS
  */
  getStations(query: PaginationRequest = {}): Observable<PaginationResponse<Station>> {
    const url = `${environment.apiUrl}inventory/stations`;
    const params = ApiUtil.getHttpParams(query);

    return this._http.get<PaginationResponse<Station>>(url, { params });
  }

  getStation(stationId: number): Observable<Station> {
    const url = `${environment.apiUrl}inventory/stations/${stationId}`;
    return this._http.get<Station>(url);
  }

  createStation(body: any): Observable<Station> {
    const url = `${environment.apiUrl}inventory/stations`;
    return this._http.post<Station>(url, body);
  }

  deleteStation(stationId: number): Observable<Station> {
    const url = `${environment.apiUrl}inventory/stations/${stationId}`;
    return this._http.delete<Station>(url);
  }


  /**
   * BOREHOLES
  */
  getBoreholes(query: PaginationRequest = {}): Observable<PaginationResponse<Borehole>> {
    const url = `${environment.apiUrl}inventory/boreholes`;
    const params = ApiUtil.getHttpParams(query);

    return this._http.get<PaginationResponse<Borehole>>(url, { params });
  }

  getBorehole(boreholeId: number): Observable<Borehole> {
    const url = `${environment.apiUrl}inventory/boreholes/${boreholeId}`;
    return this._http.get<Borehole>(url);
  }

  createBorehole(body: any): Observable<Borehole> {
    const url = `${environment.apiUrl}inventory/boreholes`;
    return this._http.post<Borehole>(url, body);
  }

  deleteBorehole(boreholeId: number): Observable<Borehole> {
    const url = `${environment.apiUrl}inventory/boreholes/${boreholeId}`;
    return this._http.delete<Borehole>(url);
  }


  /**
   * Cables
  */
  getCables(): Observable<Cable[]> {
    const url = `${environment.apiUrl}cables`;
    return this._http.get<Cable[]>(url);
  }

  getcable(id: number): Observable<Cable> {
    const url = `${environment.apiUrl}cables/${id}`;
    return this._http.get<Cable>(url);
  }

  createCable(body: any): Observable<Cable> {
    const url = `${environment.apiUrl}cables`;
    return this._http.post<Cable>(url, body);
  }

  deleteCable(id: number): Observable<Cable> {
    const url = `${environment.apiUrl}cables/${id}`;
    return this._http.delete<Cable>(url);
  }
}
