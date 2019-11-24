import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, repeatWhen, delay, retryWhen } from 'rxjs/operators';

import { environment } from '@env/environment';
import ApiUtil from '../../utils/api-util';
import { PaginationResponse } from '@interfaces/dto.interface';
import { IEvent, Boundaries, Origin, WebsocketEventResponse, InteractiveProcessing, Ray, EventsDailySummary, Arrival } from '@interfaces/event.interface';
import { EventQuery, BoundariesQuery, EventWaveformQuery, EventOriginsQuery, EventArrivalsQuery, EventDailySummaryQuery, EventRayQuery } from '@interfaces/event-query.interface';
import { EventUpdateInput, WaveformQueryResponse, EventPaginationResponse, ArrivalUpdateInput } from '@interfaces/event-dto.interface';
import { WebSocketService } from '../websocket.service';

const apiPath = {
  events: `events`,
  dialySummary: `daily_summary`,
  batch: `batch`,
  waveform: `waveform`,
  origins: `origins`,
  arrivals: `arrivals`,
  rays: `rays`,
  boundaries: `catalog_boundaries`,
};

@Injectable({
  providedIn: 'root'
})
export class EventApiService {

  constructor(
    private _http: HttpClient,
    private _websocket: WebSocketService
  ) { }



  /**
   * EVENTS
   */

  getEvents(query: EventQuery): Observable<EventPaginationResponse<IEvent>> {
    const url = `${environment.apiUrl}${apiPath.events}`;
    let params = ApiUtil.getHttpParams(query);

    if (query.event_type && query.event_type.length > 1) {
      params = ApiUtil.parseArrayHttpParams(params, query.event_type, 'event_type');
    }

    if (query.status && query.status.length > 1) {
      params = ApiUtil.parseArrayHttpParams(params, query.status, 'status');
    }

    return this._http.get<EventPaginationResponse<IEvent>>(url, { params });
  }

  getEvent(eventId: string): Observable<IEvent> {
    const url = `${environment.apiUrl}${apiPath.events}/${eventId}`;
    return this._http.get<IEvent>(url);
  }

  updateEvent(eventId: string, body: EventUpdateInput): Observable<IEvent> {
    const url = `${environment.apiUrl}${apiPath.events}/${eventId}`;
    return this._http.patch<IEvent>(url, body);
  }



  /**
   * EVENT DAILY SUMMARY
   */

  getEventDailySummary(query?: EventDailySummaryQuery): Observable<PaginationResponse<EventsDailySummary>> {
    const url = `${environment.apiUrl}${apiPath.dialySummary}`;
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



  /**
   * INTERACTIVE PROCESSING
   */

  getInteractiveProcessing(eventId: string): Observable<InteractiveProcessing> {
    const url = `${environment.apiUrl}${apiPath.events}/${eventId}/${apiPath.batch}`;
    return this._http.get<InteractiveProcessing>(url);
  }

  startInteractiveProcessing(eventId: string, body: ArrivalUpdateInput): Observable<InteractiveProcessing> {
    const url = `${environment.apiUrl}${apiPath.events}/${eventId}/${apiPath.batch}`;
    return this._http.put<InteractiveProcessing>(url, body);
  }

  acceptInteractiveProcessing(eventId: string): any {
    const url = `${environment.apiUrl}${apiPath.events}/${eventId}/${apiPath.batch}`;
    return this._http.post(url, {});
  }

  cancelInteractiveProcessing(eventId: string): any {
    const url = `${environment.apiUrl}${apiPath.events}/${eventId}/${apiPath.batch}`;
    return this._http.delete(url);
  }



  /**
   * WAVEFORM DATA
   */

  getWaveformInfo(eventId: string, query: EventWaveformQuery): Observable<WaveformQueryResponse> {
    const url = `${environment.apiUrl}${apiPath.events}/${eventId}/${apiPath.waveform}`;
    const params = ApiUtil.getHttpParams(query);
    return this._http.get<WaveformQueryResponse>(url, { params });
  }

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
    const url = `${contextUrl} `;
    const params = ApiUtil.getHttpParams({});
    const responseType = `arraybuffer`;

    return this._http.get(url, { params, responseType });
  }



  /**
   * ORIGINS
   */

  getOrigin(originId: string): Observable<Origin> {
    const url = `${environment.apiUrl}${apiPath.origins}/${originId}`;
    const params = ApiUtil.getHttpParams({});
    return this._http.get<Origin>(url, { params });
  }

  getOrigins(query: EventOriginsQuery): Observable<Origin[]> {
    const url = `${environment.apiUrl}${apiPath.origins}`;
    const params = ApiUtil.getHttpParams(query);
    return this._http.get<Origin[]>(url, { params });
  }



  /**
   * RAYS
   */

  getRays(query: EventRayQuery): Observable<Ray[]> {
    const url = `${environment.apiUrl}${apiPath.rays}`;
    const params = ApiUtil.getHttpParams(query);
    return this._http.get<Ray[]>(url, { params });
  }



  /**
   * ARRIVALS
   */

  getArrivals(query: EventArrivalsQuery): Observable<Arrival[]> {
    const url = `${environment.apiUrl}${apiPath.arrivals}`;
    const params = ApiUtil.getHttpParams(query);
    return this._http.get<Arrival[]>(url, { params });
  }



  /**
   * WEBSOCKETS
   */

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

  /**
   * Close websocket connection
   *
   * @remarks
   *
   * used only to reinit websockets!
   * After losing connection to ws, we need to reconect to start receiving notifications again.
   * After successfuly closing ws connection, onWebsocketNotification() fn automatically reinits the connection.
   *
   * @param timeout - minimal allowed time difference from last successfull connection
   * @param reasonToClose - object that should be send to server as reason why are we closing connection
   */
  closeWebsocketNotification(timeout = 30000, reasonToClose: { code: number, reason: string }) {
    if (
      this._websocket.subject &&
      this._websocket.isClosing.getValue() === false &&
      (new Date().getTime() - this._websocket.lastConnectionInitTimestamp.getValue() > timeout)
    ) {
      this._websocket.subject.error(reasonToClose);
    }
  }



  /**
   * CATALOG BOUNDARIES
   */

  /**
   * @deprecated API (now we use /events endpoint instead of deprecated /catalog endpoint)
   * Get min and max boundaries for /catalog endpoint
   *
   * @param query - optional query to filter results
   * @returns array of boundaries
   *
   */
  getBoundaries(query?: BoundariesQuery): Observable<Boundaries[]> {
    const url = `${environment.apiUrl}${apiPath.boundaries}`;
    const params = ApiUtil.getHttpParams(query);

    return this._http.get<Boundaries[]>(url, { params });
  }

}
