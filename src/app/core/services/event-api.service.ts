import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { globals } from '../../../globals';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { IEvent, Boundaries, Origin, Traveltime, WebsocketEventResponse, WebsocketResponseType } from '@interfaces/event.interface';
import {
  EventQuery, BoundariesQuery, EventWaveformQuery, EventOriginsQuery, EventArrivalsQuery, MicroquakeEventTypesQuery
} from '@interfaces/event-query.interface';
import ApiUtil from '../utils/api-util';
import { EventUpdateInput, WaveformQueryResponse } from '@interfaces/event-dto.interface';
import { WebSocketService } from './websocket.service';
import { map, filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EventApiService {

  constructor(
    private _http: HttpClient,
    private _websocket: WebSocketService
  ) { }

  /**
    * Get mseed file for waveform chart from url.
    *
    * @remarks
    *
    * Use {@link EventApiService.getWaveformInfo()} to obtain urls for mseed files.
    *
    * @param contextUrl - url for waveform file
    * @returns mseed file in ArrayBuffer
    *
    */
  getWaveformFile(contextUrl: string): Observable<ArrayBuffer> {
    const url = `${contextUrl}`;
    const params = ApiUtil.getHttpParams({});
    const responseType = `arraybuffer`;

    return this._http.get(url, { params, responseType });
  }

  getWaveformInfo(eventId: string, query: EventWaveformQuery = {}): Observable<WaveformQueryResponse> {
    const url = `${environment.apiUrl}${globals.apiEvents}/${eventId}/waveform`;
    const params = ApiUtil.getHttpParams(query);
    return this._http.get<WaveformQueryResponse>(url, { params });
  }

  getEvents(query: EventQuery): Observable<IEvent[]> {
    const url = `${environment.apiUrl}${globals.apiCatalog}`;
    const params = ApiUtil.getHttpParams(query);

    return this._http.get<IEvent[]>(url, { params });
  }

  getBoundaries(query?: BoundariesQuery): Observable<Boundaries[]> {
    const url = `${environment.apiUrl}${globals.apiCatalogBoundaries}`;
    const params = ApiUtil.getHttpParams(query);

    return this._http.get<Boundaries[]>(url, { params });
  }

  getMicroquakeEventTypes(query: MicroquakeEventTypesQuery): Observable<any> {
    const url = `${environment.apiUrl}${globals.apiMicroquakeEventTypes}`;
    const params = ApiUtil.getHttpParams(query);
    return this._http.get(url, { params });
  }

  getEventById(eventId: string): Observable<IEvent> {
    const url = `${environment.apiUrl}${globals.apiEvents}/${eventId}`;
    return this._http.get<IEvent>(url);
  }

  updateEventById(eventId: string, body: EventUpdateInput): Observable<any> {

    const url = `${environment.apiUrl}${globals.apiEvents}/${eventId}`;
    return this._http.patch(url, body);
  }

  updateEventPicksById(eventId, dataObj): any {
    const _httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    const API_URL = environment.apiUrl + globals.apiEvents + '/' + eventId + '/' + globals.apiPicksInteractive;
    const data = JSON.stringify({
      'event_resource_id': eventId,
      'data': dataObj
    });
    return this._http.post(API_URL, data, _httpOptions);
  }


  getOriginById(originId: string): Observable<Origin> {
    const url = `${environment.apiUrl}${globals.apiOrigins}/${originId}`;
    const params = ApiUtil.getHttpParams({});
    return this._http.get<Origin>(url, { params });
  }

  getOrigins(query: EventOriginsQuery): Observable<Origin[]> {
    const url = `${environment.apiUrl}${globals.apiOrigins}`;
    const params = ApiUtil.getHttpParams(query);
    return this._http.get<Origin[]>(url, { params });
  }

  updatePartialOriginById(originId, dataObj): any {
    const _httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    const API_URL = environment.apiUrl + globals.apiOrigins;
    const data = JSON.stringify({
      'origin_resource_id': originId,
      'data': dataObj
    });
    return this._http.patch(API_URL, data, _httpOptions);
  }

  getEventArrivalsById(query: EventArrivalsQuery): any {
    const url = `${environment.apiUrl}${globals.apiArrivals}`;
    const params = ApiUtil.getHttpParams(query);
    return this._http.get(url, { params });
  }

  getEventOriginTraveltimes(eventId: string, originId: string): Observable<Traveltime[]> {
    const url = `${environment.apiUrl}${globals.apiEvents}/${eventId}/${globals.apiOrigins}/${originId}/${globals.apiTravelTimes}`;
    return this._http.get<Traveltime[]>(url);
  }

  getReprocessEventById(site, network, eventId): any {
    const API_URL = environment.apiUrl + globals.apiEvents + '/' + eventId +
      '/' + globals.apiReprocess;
    const params = new HttpParams()
      .set('site_code', site)
      .set('network_code', network)
      .set('event_resource_id', eventId);
    return this._http.get(API_URL, { params });
  }

  onServerEvent(): Observable<WebsocketEventResponse> {
    const url = environment.wss;

    return <Subject<WebsocketEventResponse>>this._websocket.connect(url).pipe(
      map((response: MessageEvent) => JSON.parse(response.data)),
      filter((val: WebsocketEventResponse) => val.type === WebsocketResponseType.EVENT)
    );
  }

}
