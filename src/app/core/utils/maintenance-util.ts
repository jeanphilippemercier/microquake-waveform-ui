import * as moment from 'moment';

import { MaintenanceEventQuery, MaintenanceEventQueryOrdering } from '@interfaces/maintenance-query.interface';

export default class MaintenanceUtil {

  /**
    * Get object of parameters from maintenance event query object
    *
    * Used to prepare data for API request to get events or daily summary. Oposite of {@link buildMaintenanceListQuery()}
    *
    * @param maintenanceEventQuery object from which to get parameters
    * @returns object representing parameters that will be send to API
    *
    */
  static buildMaintenanceListParams(query: MaintenanceEventQuery): any {
    const params: any = {};

    if (query.status_id) {
      params.status_id = query.status_id;
    }

    if (query.category_id) {
      params.category_id = query.category_id;
    }

    if (query.time_range === null) {
      // no date filter is selected
    } else if (query.time_range && query.time_range > 0) {
      params.time_range = query.time_range;
    } else if (query.datetime__lte && query.datetime__gte) {
      params.time_utc_after = query.datetime__gte;
      params.time_utc_before = query.datetime__lte;
    }

    if (query.page_size) {
      params.page_size = query.page_size;
    }

    if (query.cursor) {
      params.cursor = query.cursor;
    }

    return params;
  }


  /**
    * Build MaintenanceEventQuery from object of parameters.
    *
    * Used to parse API request that is used to get maintenance events. Oposite of {@link buildMaintenanceListParams()}
    *
    * @param queryParams object of parameters from which to build MaintenanceEventQuery
    * @param tz timezone
    * @returns maintenanceEventQuery object
    *
    */
  static buildMaintenanceListQuery(queryParams: any, tz: string): MaintenanceEventQuery {
    const query: MaintenanceEventQuery = {};

    if (queryParams.status_id) {
      query.status_id = queryParams.status_id;
    }

    if (queryParams.category_id) {
      query.category_id = queryParams.category_id;
    }

    if (queryParams.time_utc_before && queryParams.time_utc_after) {
      query.time_range = 0;
      query.datetime__lte = queryParams.time_utc_before;
      query.datetime__gte = queryParams.time_utc_after;
    } else if (typeof queryParams.time_range !== 'undefined' && queryParams.time_range !== null) {
      query.time_range = parseInt(queryParams.time_range, 10);

      if (query.time_range > 0 && [3, 7, 31].indexOf(query.time_range) === -1) {
        query.time_range = 3;
      }

      query.datetime__gte = moment().utc().utcOffset(tz).startOf('day').subtract(query.time_range - 1, 'days').toISOString();
      query.datetime__lte = moment().utc().utcOffset(tz).endOf('day').toISOString();

    }

    query.ordering = MaintenanceEventQueryOrdering.DATE_DESC;

    if (queryParams.page_size) {
      query.page_size = queryParams.page_size;
    }

    if (queryParams.cursor) {
      query.cursor = queryParams.cursor;
    }

    return query;
  }
}
