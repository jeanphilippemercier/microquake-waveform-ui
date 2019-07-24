import { Injectable, NgZone } from '@angular/core';
import { environment } from '@env/environment';
import { globals } from '../../../globals';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, Observer } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  IEvent, EventQuery, BoundariesQuery, MicroquakeEventTypesQuery,
  EventWaveformQuery, EventUpdateInput
} from '@interfaces/event.interface';
import { Site } from '@interfaces/site.interface';
import ApiUtil from '../utils/api-util';

@Injectable({
  providedIn: 'root'
})
export class EventApiService {

  constructor(
    private _http: HttpClient,
    private _ngZone: NgZone
  ) { }

  getEventWaveform(eventId: string, query: EventWaveformQuery) {
    const url = `${environment.apiUrl}${globals.apiEvents}/${eventId}/waveform`;
    const params = ApiUtil.getHttpParams(query);
    const responseType = `arraybuffer`;
    const observe = 'response';

    return this._http.get(url, { params, responseType, observe });
  }

  getEvents(query: EventQuery): Observable<IEvent[]> {
    const url = `${environment.apiUrl}${globals.apiCatalog}`;
    const params = ApiUtil.getHttpParams(query);

    return this._http.get<IEvent[]>(url, { params });
  }

  getBoundaries(query: BoundariesQuery): Observable<any> {
    const url = `${environment.apiUrl}${globals.apiCatalogBoundaries}`;
    const params = ApiUtil.getHttpParams(query);

    return this._http.get(url, { params });
  }

  getMicroquakeEventTypes(query: MicroquakeEventTypesQuery): Observable<any> {
    const url = `${environment.apiUrl}${globals.apiMicroquakeEventTypes}`;
    const params = ApiUtil.getHttpParams(query);
    return this._http.get(url, { params });
  }

  getSites(): Observable<Site[]> {
    const url = `${environment.apiUrl}${globals.apiSites}`;
    return this._http.get<Site[]>(url);
  }

  getEventById(eventId: string): Observable<IEvent> {
    const url = `${environment.apiUrl}${globals.apiEvents}/${eventId}`;
    return this._http.get<IEvent>(url);
  }


  updateEventById(eventId: string, body: EventUpdateInput): Observable<any> {

    const url = `${environment.apiUrl}${globals.apiEvents}/${eventId}`;
    // TODO: API problem - put works as patch is supposed to work. And patch gives cors error at the moment
    return this._http.put(url, body);
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

  getOriginsById(site, network, eventId): any {
    const API_URL = environment.apiUrl + globals.apiOrigins;
    const params = new HttpParams()
      .set('site_code', site)
      .set('network_code', network)
      .set('event_id', eventId);
    return this._http.get(API_URL, { params })
      .pipe(
        /*
        timeout(60000),
        catchError(err => {
            // console.log('caught mapping error and rethrowing', err);
            return throwError(err);
        }),*/
        catchError(err => {
          console.log('caught rethrown error, providing fallback value');
          return of([]);
        })
      );

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

  getArrivalsById(site, network, eventId, originId): any {
    const API_URL = environment.apiUrl + globals.apiArrivals;
    let params = new HttpParams()
      .set('site_code', site)
      .set('network_code', network)
      .set('event_id', eventId);
    if (originId) {
      params = params.append('origin_id', originId);
    }
    return this._http.get(API_URL, { params })
      .pipe(
        /*
        timeout(60000),
        catchError(err => {
            // console.log('caught mapping error and rethrowing', err);
            return throwError(err);
        }),*/
        catchError(err => {
          console.log('caught rethrown error, providing fallback value');
          return of([]);
        })
      );
  }

  getTraveltimesById(site, network, eventId, originId): any {
    const API_URL = environment.apiUrl + globals.apiEvents + '/' + eventId +
      '/' + globals.apiOrigins + '/' + originId +
      '/' + globals.apiTravelTimes;
    const params = new HttpParams()
      .set('site_code', site)
      .set('network_code', network);
    return this._http.get(API_URL, { params })
      .pipe(
        /*
        timeout(60000),
        catchError(err => {
            // console.log('caught mapping error and rethrowing', err);
            return throwError(err);
        }),*/
        catchError(err => {
          console.log('caught rethrown error, providing fallback value');
          return of([]);
        })
      );
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


  getServerUpdatedEvent(): Observable<any> {
    const url = `${environment.url}eventstream/`;
    const eventSource = new EventSource(url);
    const source = new EventSource(environment.url + 'eventstream/');
    source.addEventListener('message', message => {
      console.log('eventstream message');
      console.log(message);
    });

    return Observable.create((observer: Observer<any>) => {

      eventSource.onmessage = event => {
        this._ngZone.run(() => {

          observer.next(event);
        });
      };

      eventSource.onerror = error => {
        this._ngZone.run(() => {
          observer.error(error);
        });
      };

    });
  }

}
