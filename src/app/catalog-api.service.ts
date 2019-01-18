import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class CatalogApiService {

    constructor(private http: HttpClient) {}

    get_recent_events_years( n ) {
        const endTime =  new Date();
        const startTime = new Date(endTime.getTime() - n * 31536000000);
        const API_URL = environment.apiUrl + '?start_time=' + startTime.toISOString() + '&end_time=' + endTime.toISOString();
        return this.http.get(API_URL);
    }

    get_recent_events_week() {

        const endTime =  new Date();
        const startTime = new Date(endTime.getTime() - 7 * 86400000);
        const API_URL = environment.apiUrl + '?start_time=' + startTime.toISOString() + '&end_time=' + endTime.toISOString();
        return this.http.get(API_URL);
    }

}
