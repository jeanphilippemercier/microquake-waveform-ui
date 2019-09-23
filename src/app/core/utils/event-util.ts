import { EventQuery } from '@interfaces/event-query.interface';
import { EvaluationStatusGroup } from '@interfaces/event.interface';
import * as moment from 'moment';


export default class EventUtil {
  static getNumberOfChanges(editedQuery: EventQuery): number {
    let count = 0;
    count += editedQuery.status ? editedQuery.status.length : 0;
    count += editedQuery.event_type ? editedQuery.event_type.length : 0;
    count += editedQuery.time_range !== 3 ? 1 : 0;

    return count;
  }


  static buildEventListParams(eventListQuery: EventQuery) {
    const params: any = {};

    if (eventListQuery.site) {
      params.site = eventListQuery.site;
    }

    if (eventListQuery.network) {
      params.network = eventListQuery.network;
    }

    if (eventListQuery.status && eventListQuery.status.length > 0) {
      params.status = eventListQuery.status.toString();
    }

    if (eventListQuery.event_type && eventListQuery.event_type.length > 0) {
      params.event_type = eventListQuery.event_type.toString();
    }

    if (eventListQuery.time_range > 0) {
      params.time_range = eventListQuery.time_range;
    } else if (eventListQuery.time_utc_before && eventListQuery.time_utc_after) {
      params.time_utc_before = eventListQuery.time_utc_before;
      params.time_utc_after = eventListQuery.time_utc_after;
    }

    if (eventListQuery.page_size) {
      params.page_size = eventListQuery.page_size;
    }

    if (eventListQuery.cursor) {
      params.cursor = eventListQuery.cursor;
    }

    return params;
  }

  static buildEventListQuery(queryParams: any, timezone: string) {
    const eventListQuery: EventQuery = {};

    if (queryParams.site) {
      eventListQuery.site = queryParams.site;
    }

    if (queryParams.network) {
      eventListQuery.network = queryParams.network;
    }

    if (queryParams.time_utc_before && queryParams.time_utc_after) {
      eventListQuery.time_range = 0;
      eventListQuery.time_utc_before = queryParams.time_utc_before;
      eventListQuery.time_utc_after = queryParams.time_utc_after;
    } else {
      if (queryParams.time_range) {
        eventListQuery.time_range = parseInt(queryParams.time_range, 10);
      }
      if (!eventListQuery.time_range || [3, 7, 31].indexOf(eventListQuery.time_range) === -1) {
        eventListQuery.time_range = 3;
      }

      // tslint:disable-next-line:max-line-length
      eventListQuery.time_utc_after = moment().utc().utcOffset(timezone).startOf('day').subtract(eventListQuery.time_range - 1, 'days').toISOString();
      eventListQuery.time_utc_before = moment().utc().utcOffset(timezone).endOf('day').toISOString();
    }

    if (queryParams.status) {
      eventListQuery.status = queryParams.status.split(',');
    } else {
      eventListQuery.status = [EvaluationStatusGroup.ACCEPTED];
    }


    if (queryParams.event_type) {
      eventListQuery.event_type = queryParams.event_type.split(',');
    } else {
      eventListQuery.event_type = undefined;
    }

    // TODO: remove after pagination
    if (!queryParams.page_size) {
      eventListQuery.page_size = 1000;
    } else {
      eventListQuery.page_size = queryParams.page_size;
    }

    if (queryParams.cursor) {
      eventListQuery.cursor = queryParams.cursor;
    }

    return eventListQuery;
  }
}
