import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import ApiUtil from '@core/utils/api-util';
import { globals } from '@src/globals';
import { environment } from '@env/environment';
import { Site, Station, Borehole, ISensorType, CableType } from '@interfaces/inventory.interface';
import { Sensor, IComponent } from '@interfaces/inventory.interface';
import { PaginationResponse } from '@interfaces/dto.interface';
import { PaginationRequest, RequestOptions } from '@interfaces/query.interface';
import {
  SiteUpdateInput, SiteCreateInput, SensorCreateInput, SensorUpdateInput,
  ComponentUpdateInput, StationUpdateInput, ISensorTypeCreateInput, ISensorTypeUpdateInput, CableTypeCreateInput, CableTypeUpdateInput, MaintenanceEventCreateInput, MaintenanceEventUpdateInput
} from '@interfaces/inventory-dto.interface';
import { MaintenanceEvent, MaintenanceStatus, MaintenanceCategory } from '@interfaces/maintenance.interface';
import { MaintenanceEventQuery } from '@interfaces/maintenance-query.interface';
import { SensorsQuery, StationsQuery } from '@interfaces/inventory-query.interface';
import { MicroquakeEventTypesQuery } from '@interfaces/event-query.interface';
import { EventType } from '@interfaces/event.interface';


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
  getSensors(query: SensorsQuery = {}): Observable<PaginationResponse<Sensor>> {
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
  getSensorTypes(): Observable<ISensorType[]> {
    const url = `${environment.apiUrl}inventory/sensor_types`;
    return this._http.get<ISensorType[]>(url);
  }

  getSensorType(id: number): Observable<ISensorType> {
    const url = `${environment.apiUrl}inventory/sensor_types/${id}`;
    return this._http.get<ISensorType>(url);
  }

  createSensorType(body: ISensorTypeCreateInput): Observable<ISensorType> {
    const url = `${environment.apiUrl}inventory/sensor_types`;
    return this._http.post<ISensorType>(url, body);
  }

  updateSensorType(id: number, body: ISensorTypeUpdateInput): Observable<ISensorType> {
    const url = `${environment.apiUrl}inventory/sensor_types/${id}`;
    return this._http.patch<ISensorType>(url, body);
  }

  deleteSensorType(id: number): Observable<void> {
    const url = `${environment.apiUrl}inventory/sensor_types/${id}`;
    return this._http.delete<void>(url);
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

  updateComponent(componentId: number, body: ComponentUpdateInput): Observable<IComponent> {
    const url = `${environment.apiUrl}inventory/components/${componentId}`;
    return this._http.patch<IComponent>(url, body);
  }

  deleteComponent(id: number): Observable<IComponent> {
    const url = `${environment.apiUrl}inventory/components/${id}`;
    return this._http.delete<IComponent>(url);
  }


  /**
   * STATIONS
  */
  getStations(query: StationsQuery = {}): Observable<PaginationResponse<Station>> {
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

  updateStation(stationId: number, body: StationUpdateInput): Observable<Station> {
    const url = `${environment.apiUrl}inventory/stations/${stationId}`;
    return this._http.patch<Station>(url, body);
  }

  deleteStation(stationId: number): Observable<Station> {
    const url = `${environment.apiUrl}inventory/stations/${stationId}`;
    return this._http.delete<Station>(url);
  }


  /**
   * MAINTENANCE EVENTS
  */
  getMaintenanceEvents(query: MaintenanceEventQuery = {}, options?: RequestOptions): Observable<PaginationResponse<MaintenanceEvent>> {
    const url = `${environment.apiUrl}inventory/stations/maintenance-events`;
    const params = ApiUtil.getHttpParams(query);
    const headers = ApiUtil.getHttpHeaders(options);
    return this._http.get<PaginationResponse<MaintenanceEvent>>(url, { params, headers });
  }

  getMaintenanceEvent(id: number): Observable<MaintenanceEvent> {
    const url = `${environment.apiUrl}inventory/stations/maintenance-events/${id}`;
    return this._http.get<MaintenanceEvent>(url);
  }

  createMaintenanceEvent(body: MaintenanceEventCreateInput): Observable<MaintenanceEvent> {
    const url = `${environment.apiUrl}inventory/stations/maintenance-events`;
    return this._http.post<MaintenanceEvent>(url, body);
  }

  updateMaintenanceEvent(id: number, body: MaintenanceEventUpdateInput): Observable<MaintenanceEvent> {
    const url = `${environment.apiUrl}inventory/stations/maintenance-events/${id}`;
    return this._http.patch<MaintenanceEvent>(url, body);
  }

  deleteMaintenanceEvent(id: number): Observable<void> {
    const url = `${environment.apiUrl}inventory/stations/maintenance-events/${id}`;
    return this._http.delete<void>(url);
  }


  /**
   * MAINTENANCE ATTACHMENTS
  */
  addAttachmentToMaintenanceEvent(id: number, formData: FormData): Observable<any> {
    const url = `${environment.apiUrl}inventory/stations/maintenance-events/${id}/add_attachment`;
    return this._http.post<any>(url, formData);
  }


  /**
   * MAINTENANCE STATUS
  */
  getMaintenanceStatuses(): Observable<MaintenanceStatus[]> {
    const url = `${environment.apiUrl}inventory/stations/maintenance-events/statuses`;
    return this._http.get<MaintenanceStatus[]>(url, {});
  }

  getMaintenanceStatus(id: number): Observable<MaintenanceStatus> {
    const url = `${environment.apiUrl}inventory/stations/maintenance-events/statuses/${id}`;
    return this._http.get<MaintenanceStatus>(url);
  }

  createMaintenanceStatus(body: any): Observable<MaintenanceStatus> {
    const url = `${environment.apiUrl}inventory/stations/maintenance-events/statuses`;
    return this._http.post<MaintenanceStatus>(url, body);
  }

  updateMaintenanceStatus(id: number, body: any): Observable<MaintenanceStatus> {
    const url = `${environment.apiUrl}inventory/stations/maintenance-events/statuses/${id}`;
    return this._http.patch<MaintenanceStatus>(url, body);
  }

  deleteMaintenanceStatus(id: number): Observable<void> {
    const url = `${environment.apiUrl}inventory/stations/maintenance-events/statuses/${id}`;
    return this._http.delete<void>(url);
  }


  /**
   * MAINTENANCE CATEGORY
  */
  getMaintenanceCategories(): Observable<MaintenanceCategory[]> {
    const url = `${environment.apiUrl}inventory/stations/maintenance-events/categories`;
    return this._http.get<MaintenanceCategory[]>(url, {});
  }

  getMaintenanceCategory(id: number): Observable<MaintenanceCategory> {
    const url = `${environment.apiUrl}inventory/stations/maintenance-events/categories/${id}`;
    return this._http.get<MaintenanceCategory>(url);
  }

  createMaintenanceCategory(body: any): Observable<MaintenanceCategory> {
    const url = `${environment.apiUrl}inventory/stations/maintenance-events/categories`;
    return this._http.post<MaintenanceCategory>(url, body);
  }

  updateMaintenanceCategory(id: number, body: any): Observable<MaintenanceCategory> {
    const url = `${environment.apiUrl}inventory/stations/maintenance-events/categories/${id}`;
    return this._http.patch<MaintenanceCategory>(url, body);
  }

  deleteMaintenanceCategory(id: number): Observable<void> {
    const url = `${environment.apiUrl}inventory/stations/maintenance-events/categories/${id}`;
    return this._http.delete<void>(url);
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

  updateBorehole(id: number, body: any): Observable<Borehole> {
    const url = `${environment.apiUrl}inventory/boreholes/${id}`;
    return this._http.patch<Borehole>(url, body);
  }

  deleteBorehole(boreholeId: number): Observable<Borehole> {
    const url = `${environment.apiUrl}inventory/boreholes/${boreholeId}`;
    return this._http.delete<Borehole>(url);
  }


  /**
   * Cables ~ CableTypes
  */
  getCableTypes(): Observable<CableType[]> {
    const url = `${environment.apiUrl}cables`;
    return this._http.get<CableType[]>(url);
  }

  getCableType(id: number): Observable<CableType> {
    const url = `${environment.apiUrl}cables/${id}`;
    return this._http.get<CableType>(url);
  }

  createCableType(body: CableTypeCreateInput): Observable<CableType> {
    const url = `${environment.apiUrl}cables`;
    return this._http.post<CableType>(url, body);
  }

  updateCableType(id: number, body: CableTypeUpdateInput): Observable<CableType> {
    const url = `${environment.apiUrl}cables/${id}`;
    return this._http.patch<CableType>(url, body);
  }

  deleteCableType(id: number): Observable<CableType> {
    const url = `${environment.apiUrl}cables/${id}`;
    return this._http.delete<CableType>(url);
  }

  /**
   * Micoquake event types
   */
  getMicroquakeEventTypes(query?: MicroquakeEventTypesQuery): Observable<EventType[]> {
    const url = `${environment.apiUrl}${globals.apiMicroquakeEventTypes}`;
    const params = ApiUtil.getHttpParams(query);
    return this._http.get<EventType[]>(url, { params });
  }

  getMicroquakeEventType(id: number): Observable<EventType> {
    const url = `${environment.apiUrl}${globals.apiMicroquakeEventTypes}/${id}`;
    return this._http.get<EventType>(url);
  }

  createMicroquakeEventType(body: any): Observable<EventType> {
    const url = `${environment.apiUrl}${globals.apiMicroquakeEventTypes}`;
    return this._http.post<EventType>(url, body);
  }

  updateMicroquakeEventType(id: number, body: any): Observable<EventType> {
    const url = `${environment.apiUrl}${globals.apiMicroquakeEventTypes}/${id}`;
    return this._http.patch<EventType>(url, body);
  }

  deleteMicroquakeEventType(id: number): Observable<any> {
    const url = `${environment.apiUrl}${globals.apiMicroquakeEventTypes}/${id}`;
    return this._http.delete(url);
  }
}
