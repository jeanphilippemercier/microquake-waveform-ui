import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { globals } from '../../../globals';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, pipe } from 'rxjs';
import {
  IEvent, Boundaries, Origin, WebsocketEventResponse, WebsocketResponseType, InteractiveProcessing, Ray, EventsDailySummary
} from '@interfaces/event.interface';
import {
  EventQuery, BoundariesQuery, EventWaveformQuery, EventOriginsQuery, EventArrivalsQuery, MicroquakeEventTypesQuery, EventDailySummaryQuery,
  EventRayQuery
} from '@interfaces/event-query.interface';
import ApiUtil from '../utils/api-util';
import {
  EventUpdateInput, WaveformQueryResponse, EventPaginationResponse, ArrivalUpdateInput
} from '@interfaces/event-dto.interface';
import { WebSocketService } from './websocket.service';
import { filter, retry, tap, catchError, repeat, repeatWhen, delay, map, retryWhen } from 'rxjs/operators';
import { PaginationResponse } from '@interfaces/dto.interface';

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

  getWaveformInfo(eventId: string, query: EventWaveformQuery): Observable<WaveformQueryResponse> {
    const url = `${environment.apiUrl}${globals.apiEvents}/${eventId}/waveform`;
    const params = ApiUtil.getHttpParams(query);
    return this._http.get<WaveformQueryResponse>(url, { params });
  }

  getEvents(query: EventQuery): Observable<EventPaginationResponse<IEvent>> {
    const url = `${environment.apiUrl}events`;
    let params = ApiUtil.getHttpParams(query);

    if (query.event_type && query.event_type.length > 1) {
      params = ApiUtil.parseArrayHttpParams(params, query.event_type, 'event_type');
    }

    if (query.status && query.status.length > 1) {
      params = ApiUtil.parseArrayHttpParams(params, query.status, 'status');
    }

    return this._http.get<EventPaginationResponse<IEvent>>(url, { params });
  }

  getBoundaries(query?: BoundariesQuery): Observable<Boundaries[]> {
    const url = `${environment.apiUrl}${globals.apiCatalogBoundaries}`;
    const params = ApiUtil.getHttpParams(query);

    return this._http.get<Boundaries[]>(url, { params });
  }

  getEventById(eventId: string): Observable<IEvent> {
    const url = `${environment.apiUrl}${globals.apiEvents}/${eventId}`;
    return this._http.get<IEvent>(url);
  }

  updateEventById(eventId: string, body: EventUpdateInput): Observable<any> {

    const url = `${environment.apiUrl}${globals.apiEvents}/${eventId}`;
    return this._http.patch(url, body);
  }

  getInteractiveProcessing(eventId: string): Observable<InteractiveProcessing> {
    const url = environment.apiUrl + globals.apiEvents + '/' + eventId + '/' + globals.apiPicksInteractive;
    return this._http.get<InteractiveProcessing>(url);
  }

  startInteractiveProcessing(eventId: string, body: ArrivalUpdateInput): Observable<InteractiveProcessing> {
    const url = environment.apiUrl + globals.apiEvents + '/' + eventId + '/' + globals.apiPicksInteractive;
    return this._http.put<InteractiveProcessing>(url, body);
  }

  acceptInteractiveProcessing(eventId: string): any {
    const url = environment.apiUrl + globals.apiEvents + '/' + eventId + '/' + globals.apiPicksInteractive;
    return this._http.post(url, {});
  }

  cancelInteractiveProcessing(eventId: string): any {
    const url = environment.apiUrl + globals.apiEvents + '/' + eventId + '/' + globals.apiPicksInteractive;
    return this._http.delete(url);
  }

  getEventDailySummary(query?: EventDailySummaryQuery): Observable<PaginationResponse<EventsDailySummary>> {
    const url = `${environment.apiUrl}events/daily_summary`;
    let params = ApiUtil.getHttpParams(query);

    if (query) {
      if (query.event_type && query.event_type.length > 1) {
        params = ApiUtil.parseArrayHttpParams(params, query.event_type, 'event_type');
      }

      if (query.status && query.status.length > 1) {
        params = ApiUtil.parseArrayHttpParams(params, query.status, 'status');
      }
    }

    return this._http.get<PaginationResponse<EventsDailySummary>>(url, { params });
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

  getRays(query: EventRayQuery): Observable<Ray[]> {
    const url = `${environment.apiUrl}${globals.apiRays}`;
    const params = ApiUtil.getHttpParams(query);
    return this._http.get<Ray[]>(url, { params });
  }

  getEventArrivalsById(query: EventArrivalsQuery): any {
    const url = `${environment.apiUrl}${globals.apiArrivals}`;
    const params = ApiUtil.getHttpParams(query);
    return this._http.get(url, { params });
  }

  onWebsocketNotification(): Observable<WebsocketEventResponse> {
    const url = environment.wss;

    return this._websocket.connect<WebsocketEventResponse>(url).pipe(
      retryWhen(errors => errors.pipe(
        delay(1000),
        filter(val => this._websocket.isClosing.getValue() === false)
      )),
      repeatWhen(compleated => compleated.pipe(
        delay(1000),
        filter(val => this._websocket.isClosing.getValue() === false)
      )
      )
    );
  }

  // used only to reinit websockets!
  // After losing connection to ws, we need to reconect to start receiving notifications again.
  // After successfuly closing ws connection, onWebsocketNotification() fn automatically reinits the connection.
  // timeout - minimal allowed time difference from last successfull connection
  closeWebsocketNotification(timeout = 30000, reasonToClose: { code: number, reason: string }) {
    if (
      this._websocket.subject &&
      this._websocket.isClosing.getValue() === false &&
      (new Date().getTime() - this._websocket.lastConnectionInitTimestamp.getValue() > timeout)
    ) {
      this._websocket.subject.error(reasonToClose);
    }
  }

}
