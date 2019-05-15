import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, pipe, throwError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CatalogApiService {

    constructor(private http: HttpClient) {}

    get_events(site, network, startTime, endTime, event_types, status) {
        const API_URL = environment.apiUrl + environment.apiCatalog;
        let params = new HttpParams()
          .set('start_time', startTime)
          .set('end_time', endTime)
          .set('site_code', site)
          .set('network_code', network);
        if (event_types) {
            params = params.append('type', event_types);
        }
        if (status) {
            params = params.append('status', status);
        }
        return this.http.get(API_URL, {params})
            .pipe(
                /*
                timeout(60000), // 60 seconds
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

    get_boundaries = (site, network): any => {
        const API_URL = environment.apiUrl + environment.apiCatalogBoundaries;
        const params = new HttpParams()
          .set('site_code', site)
          .set('network_code', network);
        return this.http.get(API_URL, {params})
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

    get_microquake_event_types = (site): any => {
        const API_URL = environment.apiUrl + environment.apiMicroquakeEventTypes;
        const params = new HttpParams()
          .set('site_code', site);
        return this.http.get(API_URL, {params});
    }

    get_sites = (): any => {
        const API_URL = environment.apiUrl + environment.apiSites;
        return this.http.get(API_URL);
    }

    get_event_by_id = (eventId): any => {
        const API_URL = environment.apiUrl + environment.apiEvents + '/' + eventId;
        return this.http.get(API_URL);
    }

    update_event_by_id = (eventId, status, event_type): any => {
        const httpOptions = {
          headers: new HttpHeaders({
            'Content-Type':  'application/json'
          })
        };
        const API_URL = environment.apiUrl + environment.apiEvents + '/' + eventId;
        const data = JSON.stringify({
            'event_resource_id': eventId,
            'status': status,
            'event_type': event_type
        });
        return this.http.put(API_URL, data, httpOptions);
    }


    get_origins_by_id = (site, network, eventId): any => {
        const API_URL = environment.apiUrl + environment.apiOrigins;
        const params = new HttpParams()
        .set('site_code', site)
        .set('network_code', network)
        .set('event_resource_id', eventId)
        return this.http.get(API_URL, {params})
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

    get_arrivals_by_id = (site, network, eventId, originId): any => {
        const API_URL = environment.apiUrl + environment.apiArrivals;
        let params = new HttpParams()
          .set('site_code', site)
          .set('network_code', network)
          .set('event_resource_id', eventId);
        if (originId) {
          params = params.append('origin_resource_id', originId);
        }
        return this.http.get(API_URL, {params})
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

    get_traveltimes_by_id = (site, network, eventId, originId): any => {
        const API_URL = environment.apiUrl + 'site/' + site + '/network/' + network + '/' +
            environment.apiEvents + '/' + eventId +
            '/' + environment.apiOrigins + '/' + originId +
            '/' + environment.apiTravelTimes;
        return this.http.get(API_URL)
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

}
