import { EventQuery } from '@interfaces/event-query.interface';
import { EvaluationStatusGroup, IEvent, EvaluationStatus, QuakemlType, EventsDailySummary, EventsDailySummaryForCatalog } from '@interfaces/event.interface';
import * as moment from 'moment';


export default class EventUtil {

  /**
   * Made-up event for testing purposes
   *
   */
  static testEvent: IEvent = {
    azimuth: null,
    corner_frequency: 407.958984375,
    evaluation_mode: 'automatic',
    event_file: 'https://permanentdbfilesstorage.blob.core.windows.net/permanentdbfilesblob/events/994be6b4b4a055659683601d0e86d44e.xml',
    event_resource_id: 'smi:local/2019/09/28/13/56_40_699406127.e',
    event_type: QuakemlType.COLLAPSE,
    insertion_timestamp: '2019-09-28T14:12:12.922549Z',
    is_processing: false,
    magnitude: -1.30648463863957,
    magnitude_type: 'Mw',
    modification_timestamp: '2019-10-24T00:22:21.386091Z',
    network: 0,
    npick: 0,
    plunge: null,
    preferred_magnitude_id: 'smi:local/e2a0a92f-ea87-4fd9-bbda-855e48d62949',
    preferred_origin_id: 'smi:local/c04c7085-a75c-4c5f-bed7-7346a3a72ba9',
    site: 1,
    status: EvaluationStatus.PRELIMINARY,
    time_epoch: 1569679000705994000,
    time_residual: 1,
    time_utc: '2019-09-07T15:33:33.705994Z',
    timezone: '+08:00',
    uncertainty: 1,
    uncertainty_vector_x: 1,
    uncertainty_vector_y: 1,
    uncertainty_vector_z: 1,
    variable_size_waveform_file: 'https://permanentdbfilesstorage.blob.core.windows.net/permanentdbfilesblob/events/994be6b4b4a055659683601d0e86d44e.variable_mseed',
    waveform_context_file: 'https://permanentdbfilesstorage.blob.core.windows.net/permanentdbfilesblob/events/994be6b4b4a055659683601d0e86d44e.context_mseed',
    waveform_file: 'https://permanentdbfilesstorage.blob.core.windows.net/permanentdbfilesblob/events/994be6b4b4a055659683601d0e86d44e.mseed',
    x: 651400,
    y: 4767670,
    z: -25,
  };

  /**
    * Variable that maps to all EvaluationStatuses that represents accepted evaluation
    *
    */
  static acceptedEvaluationStatuses: EvaluationStatus[] = [
    EvaluationStatus.CONFIRMED,
    EvaluationStatus.FINAL,
    EvaluationStatus.PRELIMINARY,
    EvaluationStatus.REPORTED,
    EvaluationStatus.REVIEWED
  ];


  /**
    * Get number of user's changes in event query object
    *
    * @remarks
    * This number is used in badge above catalog's filter button, showing user how many filters are active.
    *
    * @param query where to check filtered values
    * @returns number of changes
    *
    */
  static getNumberOfChanges(query: EventQuery): number {
    let count = 0;
    count += query.status ? query.status.length : 0;
    count += query.event_type ? query.event_type.length : 0;
    count += query.time_range !== 3 ? 1 : 0;

    return count;
  }


  /**
    * Get object of parameters from event query object
    *
    * @remarks
    *
    * Used to prepare data for API request to get events or daily summary. Oposite of {@link buildEventListQuery()}
    *
    * @param eventListQuery eventQuery object from which to get parameters
    * @returns object representing parameters that will be send to API
    *
    */
  static buildEventListParams(eventListQuery: EventQuery): any {
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

    if (eventListQuery.time_range && eventListQuery.time_range > 0) {
      params.time_range = eventListQuery.time_range;
    } else if (eventListQuery.time_utc_before && eventListQuery.time_utc_after) {
      params.time_utc_after = eventListQuery.time_utc_after;
      params.time_utc_before = eventListQuery.time_utc_before;
    }

    if (eventListQuery.page_size) {
      params.page_size = eventListQuery.page_size;
    }

    if (eventListQuery.cursor) {
      params.cursor = eventListQuery.cursor;
    }

    return params;
  }


  /**
    * Build EventQuery from object of parameters.
    *
    * @remarks
    *
    * Used to parse API request that is used to get events or daily summary back to event query object. Oposite of {@link buildEventListParams()}
    *
    * @param queryParams object of parameters from which to build EventQuery
    * @param tz timezone
    * @returns EventQuery object
    *
    */
  static buildEventListQuery(queryParams: any, tz: string): EventQuery {
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

      eventListQuery.time_utc_after = moment().utc().utcOffset(tz).startOf('day').subtract(eventListQuery.time_range - 1, 'days').toISOString();
      eventListQuery.time_utc_before = moment().utc().utcOffset(tz).endOf('day').toISOString();
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




  /**
   *
   * To prepare data for event catalog component
   *
   */


  /**
   * Check if event doesn't fit into eventListQuery
   *
   * @remarks
   *
   * Shows small warning sign in catalog if the event is outside of currently slected filter.
   *
   * @param eventListQuery - query to check
   * @param ev - event to compare with query
   * @returns true if event wouldn't be queried by provided EventQuery.
   *
   */
  static isEventOustideOfFilter(eventListQuery: EventQuery, ev: IEvent): boolean {
    const eventDate = moment.utc(ev.time_utc);

    if (
      (
        eventDate.isAfter(moment.utc(eventListQuery.time_utc_before)) ||
        eventDate.isBefore(moment.utc(eventListQuery.time_utc_after))
      )
      ||
      (
        eventListQuery.status &&
        (
          eventListQuery.status.indexOf(EvaluationStatusGroup.ACCEPTED) === -1 ||
          eventListQuery.status.indexOf(EvaluationStatusGroup.REJECTED) === -1
        ) &&
        (
          (
            eventListQuery.status.indexOf(EvaluationStatusGroup.REJECTED) > -1 &&
            ev.status !== EvaluationStatus.REJECTED
          )
          ||
          (
            eventListQuery.status.indexOf(EvaluationStatusGroup.ACCEPTED) > -1 &&
            this.acceptedEvaluationStatuses.indexOf(ev.status) === -1
          )
        )
      )
      ||
      (
        eventListQuery.event_type &&
        eventListQuery.event_type.indexOf(<QuakemlType>`${ev.event_type}`) === -1
      )
    ) {
      return true;
    } else {
      return false;
    }
  }


  /**
   * Creates blank catalog day object for event catalog component.
   *
   * @param day - moment object of the day for which we want to create daily summary object
   * @param ev - optional event to include in the object
   * @returns EventsDailySummaryForCatalog object that represents one day in event catalog component.
   *
   */
  static createEventDailySummaryDay(day: moment.Moment, ev?: IEvent): EventsDailySummaryForCatalog {
    const ds: EventsDailySummaryForCatalog = {
      dayDate: moment(day).startOf('day'),
      date: moment(day).format('YYYY-MM-DD'),
      partial: false,
      count: 0,
      modification_timestamp_max: null,
      upToDate: false,
      accepted_counts: {
        _total_: 0
      }
    };

    if (ev) {
      ds.events = [ev];
    }

    return ds;
  }


  /**
   * Generates array of EventsDailySummaryForCatalog object in a range of dates
   *
   * @param start start date
   * @param end end date
   * @returns array of EventsDailySummaryForCatalog objects
   *
   */
  static generateDaysForCatalog(start: moment.Moment, end: moment.Moment): EventsDailySummaryForCatalog[] {
    const arr: EventsDailySummaryForCatalog[] = [];
    for (const m = moment(start); m.isSameOrAfter(end); m.add(-1, 'days')) {
      const a = EventUtil.createEventDailySummaryDay(m);
      arr.push(a);
    }

    return arr;
  }


  /**
   * Maps EventsDailySummary to EventsDailySummaryForCatalog
   *
   * @remarks
   * EventsDailySummaryForCatalog extends EventsDailySummary (which comes from API) with more information needed for catalog component.
   *
   * @param ds EventsDailySummary object that will be copied to dsfc
   * @param dsfc EventsDailySummaryForCatalog to which map ds data
   *
   */
  static mapDailySummaryToCatalogDays(ds: EventsDailySummary[], dsfc: EventsDailySummaryForCatalog[]): EventsDailySummaryForCatalog[] {
    const map: { [key: string]: EventsDailySummary } = {};

    ds.map(el => {
      map[el.date] = el;
    });

    for (let i = 0; i < dsfc.length; i++) {
      if (map[dsfc[i].date]) {
        dsfc[i] = {
          ...dsfc[i],
          ...map[dsfc[i].date]
        };
      }
    }

    return dsfc;
  }

  /**
   * Add event to catalog data
   *
   * @remarks
   * Used to add to catalog data a new event which is outside of the currently selected filter (wasn't initially loaded by GET events request). Happens when user opens
   * an event in waveform chart and this event happens in a different day than is currently selected filter for catalog, therefore we need to additionaly add this event
   * to the catalog data.
   *
   * @param ev event to add to catalog
   * @param tz timezone
   * @param dsfc EventsDailySummaryForCatalog object represening current catalog data
   * @returns array of EventsDailySummaryForCatalog objects
   *
   */
  static mapEventToCatalog(ev: IEvent, tz: string, dsfc: EventsDailySummaryForCatalog[]): EventsDailySummaryForCatalog[] {
    if (ev) {
      const eventDay = moment(moment.utc(ev.time_utc).utcOffset(tz).startOf('day'));

      if (eventDay && dsfc) {
        const isEventDayInDailySummary = EventUtil.isEventDayInDailySummary(dsfc, eventDay);

        if (isEventDayInDailySummary === 0) {

          const found = dsfc.find(v => v.dayDate && v.dayDate.isSame(eventDay));
          if (found) {
            const foundDate = ev && ev.time_utc ? moment.utc(ev.time_utc).utcOffset(tz) : null;
            if (found.events && found.events.length > 0) {
              found.events.some((nextEvent, idx) => {
                if (ev.event_resource_id === nextEvent.event_resource_id) {
                  return true;
                }

                if (nextEvent) {
                  const nextDate = nextEvent.time_utc ? moment.utc(nextEvent.time_utc).utcOffset(tz) : null;

                  if (!found.events) {
                    return;
                  }

                  if (foundDate && nextDate && foundDate.isAfter(nextDate)) {
                    ev.outsideOfCurrentFilter = true;
                    found.events.splice(idx, 0, ev);
                    return true;
                  } else if (idx === found.events.length - 1) {
                    ev.outsideOfCurrentFilter = true;
                    found.events.push(ev);
                    return true;
                  }
                }
              });
            } else {
              if (!found.events) {
                found.events = [];
              }

              ev.outsideOfCurrentFilter = true;
              found.events.push(ev);
            }
          }
        } else {
          const dayOutsideFilter = EventUtil.createEventDailySummaryDay(eventDay, ev);
          dayOutsideFilter.partial = true;

          if (isEventDayInDailySummary === -1) {
            dsfc.unshift(dayOutsideFilter);
          } else if (isEventDayInDailySummary === 1) {
            dsfc.push(dayOutsideFilter);
          }
        }
      }
    }

    return dsfc;
  }
  /**
   * Check if event happens in time range within EventsDailySummary, before or after.
   *
   * @remarks
   * Used to check if the event is outside of current filter or not
   *
   * @param ds EventsDailySummary data
   * @param eventDay date
   * @returns -1 if event happens before ds data. 0 if event happens within ds data. 1 if event happens after ds data
   *
   */
  static isEventDayInDailySummary(ds: EventsDailySummary[], eventDay: moment.Moment) {
    if (!ds || !eventDay) {
      return null;
    }

    if (ds.length === 0) {
      return -1;
    }

    if (eventDay.isSameOrBefore(ds[0].dayDate, 'day')) {
      if (eventDay.isSameOrAfter(ds[ds.length - 1].dayDate, 'day')) {
        return 0;
      }
    } else if (eventDay.isSameOrAfter(ds[ds.length - 1].dayDate, 'day')) {
      return -1;
    }
    return 1;

  }

  /**
   * Remove day from catalog data if it's not currently selected.
   *
   * @remarks
   * Day won't be removed from catalog data even if it's outside of the current filter until we select event from some other day.
   *
   * @param currentlyOpenEventDate date of the start of the day of current event
   * @param ds EventsDailySummary data
   * @param dsfc EventsDailySummaryForCatalog data
   *
   */
  static clearUnselectedDaysOutsideFilter(currentlyOpenEventDate: moment.Moment, ds: EventsDailySummary[], dsfc: EventsDailySummaryForCatalog[]) {

    const idxToRemove: number[] = [];
    if (ds && dsfc && currentlyOpenEventDate) {

      dsfc.forEach((el, i) => {
        if (!el.partial) {
          return;
        }
        if (el.dayDate) {
          if (currentlyOpenEventDate.isSame(el.dayDate)) {
            return;
          }
          const found = ds.find(v => v.date === el.date);
          if (!found) {
            idxToRemove.push(i);
          }
        }
      });
    }

    for (let idx = idxToRemove.length - 1; idx >= 0; idx--) {
      dsfc.splice(idxToRemove[idx], 1);
    }

    return dsfc;
  }
}
