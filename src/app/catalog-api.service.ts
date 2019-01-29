import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class CatalogApiService {

    constructor(private http: HttpClient) {}

    get_recent_events_years( n ) {
        const endTime =  new Date();
        const startTime = new Date(endTime.getTime() - n * 31536000000);
        const API_URL = environment.apiUrlCatalog + '?start_time=' + startTime.toISOString() + '&end_time=' + endTime.toISOString();
        return this.http.get(API_URL);
    }

    get_recent_events_week() {
        const endTime =  new Date();
        const startTime = new Date(endTime.getTime() - 7 * 86400000);
        const API_URL = environment.apiUrlCatalog + '?start_time=' + startTime.toISOString() + '&end_time=' + endTime.toISOString();
        return this.http.get(API_URL);
    }

    get_day_events(date) {
        const day = moment(date);
        day.hour(0);
        day.minute(0);
        day.second(0);
        day.millisecond(0);
        const startTime = day.toISOString();
        const endTime = day.add(1, 'days').toISOString();
        const API_URL = environment.apiUrlCatalog + '?start_time=' + startTime + '&end_time=' + endTime;
        return this.http.get(API_URL);
    }

    get_boundaries = (): any => {
        const API_URL = environment.apiUrlCatalogBoundaries;
        return this.http.get(API_URL);
    }


}
