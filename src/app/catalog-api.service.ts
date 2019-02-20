import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CatalogApiService {

    constructor(private http: HttpClient) {}

    get_events(startTime, endTime) {
        const API_URL = environment.apiUrl + environment.apiCatalog +
            '?start_time=' + startTime + '&end_time=' + endTime;
        return this.http.get(API_URL);
    }

    get_boundaries = (): any => {
        const API_URL = environment.apiUrl + environment.apiCatalogBoundaries;
        return this.http.get(API_URL);
    }

    get_event_by_id = (eventId): any => {
        const API_URL = environment.apiUrl + environment.apiEvents + '/' + eventId;
        return this.http.get(API_URL);
    }

    get_origins_by_id = (eventId): any => {
        const API_URL = environment.apiUrl + environment.apiEvents + '/' + eventId +
            '/' + environment.apiOrigins;
        return this.http.get(API_URL);
    }

    get_arrivals_by_id = (eventId, originId): any => {
        const API_URL = environment.apiUrl + environment.apiEvents + '/' + eventId +
            '/' + (originId ? environment.apiOrigins + '/' + originId + '/' : '') +
            environment.apiArrivals;
        return this.http.get(API_URL);
    }

    get_traveltimes_by_id = (eventId, originId): any => {
        const API_URL = environment.apiUrl + environment.apiEvents + '/' + eventId +
            '/' + environment.apiOrigins + '/' + originId +
            '/' + environment.apiTravelTimes;
        return this.http.get(API_URL);
    }

}
