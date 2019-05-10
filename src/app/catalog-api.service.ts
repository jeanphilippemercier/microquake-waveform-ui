import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, pipe, throwError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CatalogApiService {

    constructor(private http: HttpClient) {}

    get_events(startTime, endTime, event_type, accepted) {
        const API_URL = environment.apiUrl + environment.apiCatalog +
            '?start_time=' + startTime + '&end_time=' + endTime +
            (event_type ? '&event_type=' + event_type : '') +
            (typeof accepted === 'boolean' ? '&accepted=' + accepted : '');
        return this.http.get(API_URL)
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

    get_boundaries = (): any => {
        const API_URL = environment.apiUrl + environment.apiCatalogBoundaries;
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

    get_microquake_event_types = (site, network): any => {
        const API_URL = environment.apiUrl2 + 'site/' + site + '/network/' + network + '/' + environment.apiMicroquakeEventTypes;
        return this.http.get(API_URL);
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


    get_origins_by_id = (eventId): any => {
        const API_URL = environment.apiUrl + environment.apiEvents + '/' + eventId +
            '/' + environment.apiOrigins;
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

    get_arrivals_by_id = (eventId, originId): any => {
        const API_URL = environment.apiUrl + environment.apiEvents + '/' + eventId +
            '/' + (originId ? environment.apiOrigins + '/' + originId + '/' : '') +
            environment.apiArrivals;
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

    get_traveltimes_by_id = (eventId, originId): any => {
        const API_URL = environment.apiUrl + environment.apiEvents + '/' + eventId +
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
