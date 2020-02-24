import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, BehaviorSubject, Subject, interval } from 'rxjs';
import { distinctUntilChanged, skip, takeUntil, filter } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';

import EventUtil from '@core/utils/event-util';
import { EventApiService } from '@services/api/event-api.service';
import { IEvent, EventsDailySummary, EventsDailySummaryForCatalog } from '@interfaces/event.interface';
import { EventQuery, EventDailySummaryQuery } from '@interfaces/event-query.interface';
import { WaveformService } from '@services/waveform.service';
import { ToastrNotificationService } from '@services/toastr-notification.service';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss'],
})
export class EventDetailComponent implements OnInit, OnDestroy {

  private _currentEvent!: IEvent;
  public set currentEvent(v: IEvent) {
    this._currentEvent = v;
    this.waveformService.currentEvent.next(this._currentEvent);
    EventUtil.mapEventToCatalog(v, this.timezone, this.eventsDailySummaryForCatalog);
  }
  public get currentEvent(): IEvent {
    return this._currentEvent;
  }

  currentEventInfo!: IEvent;
  paramsSub!: Subscription;
  eventsDailySummary!: EventsDailySummary[];
  eventsDailySummaryForCatalog!: EventsDailySummaryForCatalog[];
  initialized: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  pooling: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  currentDay: BehaviorSubject<EventsDailySummary | null> = new BehaviorSubject<EventsDailySummary | null>(null);
  eventUpdateDialogOpened = false;
  eventFilterDialogOpened = false;
  loadingCurrentEvent = false;
  loadingEventList = false;
  changeDetectCatalog = 0;

  // TODO: fix when resolved on API
  timezone = '+08:00';


  private _unsubscribe = new Subject<void>();

  constructor(
    public waveformService: WaveformService,
    private _eventApiService: EventApiService,
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private _ngxSpinnerService: NgxSpinnerService,
    private _toastrNotificationService: ToastrNotificationService
  ) { }

  async ngOnInit() {
    await this.waveformService.isInitialized();
    await this._watchForQueryParamChange();
    await this._watchForCurrentEventChange();
    this._initPooling();

    this.waveformService.interactiveProcessLoading
      .pipe(
        takeUntil(this._unsubscribe),
        distinctUntilChanged(),
        skip(1)
      )
      .subscribe(val => {
        if (val) {
          this._ngxSpinnerService.show('loadingInteractiveProcessing', { fullScreen: true, bdColor: 'rgba(51,51,51,0.75)' });
        } else {
          this._ngxSpinnerService.hide('loadingInteractiveProcessing');
        }
      });

    this.waveformService.wsEventCreatedObs
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(val => {
        this._addEvent(val);
      });

    this.waveformService.wsEventUpdatedObs
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(val => {
        this._updateEvent(val);
      });
  }


  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }


  /**
   * Watcher for keyboard events
   *
   * @remarks
   * e / E - opens event update dialog
   *
   * @param ev - automatically provided by angular
   *
   */
  @HostListener('window:keydown', ['$event'])
  watchKeyboardEvent(ev: KeyboardEvent) {
    if (!ev) {
      return;
    }

    switch (ev.key) {
      case 'e':
      case 'E':
        this.waveformService.openEventUpdateDialog(this.currentEventInfo);
        break;
      default:
        break;
    }
  }


  /**
   * Loads daily summary from API a prepares data for catalog component.
   *
   * @param showLoading optional setting to show loading spinner animation while fetching new data.
   *
   */
  private async _loadDailyEventSummary(showLoading = true) {
    try {
      const query: EventDailySummaryQuery = {
        ...this.waveformService.eventListQuery,
        tz_offset: this.timezone
      };
      delete query.time_range;

      if (showLoading) {
        this.startLoadingEventList();
      }
      const response = await this._eventApiService.getEventDailySummary(query).toPromise();
      this.eventsDailySummary = response.results;

      if (this.eventsDailySummaryForCatalog) {

        this.checkForChangesInSummary(this.eventsDailySummaryForCatalog, response.results);
        const currentDay = this.currentDay.getValue();

        if (currentDay && !currentDay.upToDate) {
          const found = this.eventsDailySummaryForCatalog ? this.eventsDailySummaryForCatalog.find((val: EventsDailySummary) => val.dayDate && val.dayDate.isSame(currentDay.dayDate)) : null;
          this.loadEventsForCurrentlySelectedDay(found ? found : null);
        }
        EventUtil.mapEventToCatalog(this.currentEvent, this.timezone, this.eventsDailySummaryForCatalog);

      } else {
        this.pooling.next(true);
        this.eventsDailySummary = response.results;
        this.eventsDailySummaryForCatalog = EventUtil.generateDaysForCatalog(moment.utc(query.time_utc_before).utcOffset(this.timezone, true), moment.utc(query.time_utc_after).utcOffset(this.timezone, true));
        this.eventsDailySummaryForCatalog = EventUtil.mapDailySummaryToCatalogDays(response.results, this.eventsDailySummaryForCatalog);
        EventUtil.mapEventToCatalog(this.currentEvent, this.timezone, this.eventsDailySummaryForCatalog);
      }

    } catch (err) {
      console.error(err);
    } finally {
      this.stopLoadingEventList();
    }
  }


  /**
   * Checks if currentSummaryForCatalog data (all days) is up to date or needs a reload.
   *
   * @remarks
   * If a day is not up to date it's marked as outdated (by upToDate = false). Day doesn't reload its events until it's selected (opened) by user.
   *
   * @param currentSummaryForCatalog currently used EventsDailySummaryForCatalog[] with data for catalog
   * @param newSummary  EventsDailySummary[] fetched from API
   *
   */
  private checkForChangesInSummary(currentSummaryForCatalog: EventsDailySummaryForCatalog[], newSummary: EventsDailySummary[]) {
    if (!currentSummaryForCatalog || !newSummary) {
      return;
    }

    if (currentSummaryForCatalog.length !== newSummary.length) {
      // regenerate
      const newCatalog = EventUtil.generateDaysForCatalog(moment.utc(this.waveformService.eventListQuery.time_utc_before).utcOffset(this.timezone, true), moment.utc(this.waveformService.eventListQuery.time_utc_after).utcOffset(this.timezone, true));
      newSummary = EventUtil.mapDailySummaryToCatalogDays(newSummary, newCatalog);
    }

    newSummary.forEach((val, idx) => {
      const found = currentSummaryForCatalog.find(v => v.date === val.date);

      if (found) {
        if (found.partial) {
          found.upToDate = true;
        } else {
          found.upToDate = found.events && val.modification_timestamp_max && val.modification_timestamp_max === found.modification_timestamp_max ? true : false;
          found.accepted_counts = val.accepted_counts;
          found.count = val.count;
          found.modification_timestamp_max = val.modification_timestamp_max;
        }
      }
      return val;
    });

    const currentDay = this.currentDay.getValue();

    if (currentDay) {
      const foundCurrentDay = currentSummaryForCatalog.find(v => v.date === currentDay.date);

      if (foundCurrentDay) {
        this.currentDay.next(foundCurrentDay);
      }
    }

    this.changeDetectCatalog = new Date().getTime();
  }

  /**
   * Initializes a watcher for changes in url params (eventId)
   *
   * @remarks
   * If eventId changes to an event that isn't yet loaded, we fetch the event from api.
   *
   */
  private async _watchForCurrentEventChange() {
    this.paramsSub = this._activatedRoute.params
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(async params => {
        const eventId = params['eventId'];
        if (eventId) {
          try {
            this.loadingCurrentEvent = true;
            this._ngxSpinnerService.show('loadingCurrentEvent', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
            let clickedEvent: IEvent | null = null;


            // try to find event in catalog events (already loaded events)
            if (this.eventsDailySummaryForCatalog) {
              let found;
              this.eventsDailySummaryForCatalog.some(day => day.events && day.events.some(ev2 => {
                if (ev2.event_resource_id === eventId) {
                  found = ev2;
                  return true;
                }
              }));

              if (found) {
                clickedEvent = Object.assign({}, found);
              }
            }

            // load event from api if not found in catalog events
            if (!clickedEvent) {
              clickedEvent = await this._eventApiService.getEvent(eventId).toPromise();
            }
            this.currentEvent = clickedEvent;

            const currentlyOpenEventDate = moment.utc(this.currentEvent.time_utc).utcOffset(this.timezone).startOf('day');
            this.eventsDailySummaryForCatalog = EventUtil.clearUnselectedDaysOutsideFilter(currentlyOpenEventDate, this.eventsDailySummary, this.eventsDailySummaryForCatalog);

            if (this.initialized.getValue() === false) {
              this.currentEventInfo = Object.assign({}, clickedEvent);
              this.initialized.next(true);
            }
          } catch (err) {
            this._toastrNotificationService.error(err);
            console.error(err);
          } finally {
            this.loadingCurrentEvent = false;
            this._ngxSpinnerService.hide('loadingCurrentEvent');
          }
        }
      });
  }


  /**
   * Initializes a watcher for url changes in query parameters
   *
   * @remarks
   * Query params on this page are used to store event's catalog filter values.
   *
   * @returns a promise after first check is processed (to correctly init page we need to wait until this code is processed in sync).
   *
   */
  private async _watchForQueryParamChange() {
    return new Promise(resolve => {
      this.paramsSub = this._activatedRoute.queryParams
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(async val => {
          const queryParams = { ...val };
          queryParams.site = this.waveformService.currentSite && this.waveformService.currentSite.id ? this.waveformService.currentSite.id : undefined;
          queryParams.network = this.waveformService.currentNetwork && this.waveformService.currentNetwork.id ? this.waveformService.currentNetwork.id : undefined;
          this.waveformService.eventListQuery = EventUtil.buildEventListQuery(queryParams, this.timezone);
          this.waveformService.numberOfChangesInFilter = EventUtil.getNumberOfChanges(this.waveformService.eventListQuery);
          delete this.eventsDailySummaryForCatalog;
          delete this.eventsDailySummary;
          this._loadDailyEventSummary();
          resolve();
        });
    });
  }


  /**
   * Initializes pooling mechanism that checks in 30 second interaval for changes in event's daily summaries.
   *
   * @remarks
   * This is a pooling mechanism to receive current daily_summary information, mainly used for event counts in catalog.
   *
   * It is also a fallback mechanism if WebSockets don't work. For each day in catalog It compares last modification timestamp with previous value.
   * If the value differs, it marks the day as outdated (upToDate = false).
   * Events for the day are refetched from API when user selects the day and the day is marked as upToDate === false.
   * This shouldn't normaly happen if WebSockets work, as each day should already be upToDate.
   *
   */
  private async _initPooling() {
    interval(30000).pipe(
      filter(val => this.pooling.getValue()),
      takeUntil(this._unsubscribe)
    ).subscribe(_ => {
      this._loadDailyEventSummary(false);
    });
  }


  /**
   * Add event to catalog.
   *
   * @remarks
   * If new event doesn't fit into filter selected by the user, it won't be added to event catalog.
   *
   * If the event that we want to add is already loaded in the catalog, toastr error will show.
   *
   * @param ev event to add
   *
   */
  private _addEvent(ev: IEvent) {
    if (!ev) {
      return;
    }

    try {
      const found = this.eventsDailySummaryForCatalog.some(day => day.events && day.events.some(ev2 => (ev2.event_resource_id === ev.event_resource_id)));

      if (found) {
        this.waveformService.showNewEventToastrNotification(ev, 'error');
        console.error(`Event is alrady in the event list: ${ev.event_resource_id}`);
        return;
      }

      if (EventUtil.isEventOustideOfFilter(this.waveformService.eventListQuery, ev)) {
        console.log(`New event is outside of the current filter. Not added!`);
        return;
      }

      const eventDate = moment.utc(ev.time_utc).utcOffset(this.timezone);
      const eventDayDate = moment.utc(ev.time_utc).utcOffset(this.timezone).startOf('day');
      const addedEventInExistingDay = this.eventsDailySummaryForCatalog.some(day => {

        if (day.dayDate && !day.dayDate.isSame(eventDayDate)) {
          return false;
        }

        // day was not yet clicked (no events were loaded yet). Mark as added, it will load automatically after clicking on the day.
        if (!day.events) {
          return true;
        }

        day.modification_timestamp_max = ev.modification_timestamp;

        const addedEvent = day.events.some((ev2, idx) => {
          if (eventDate.isAfter(moment.utc(ev2.time_utc).utcOffset(this.timezone))) {
            if (day.events) {
              day.events.splice(idx, 0, ev);
            }
            return true;
          }
          return false;
        });

        if (!addedEvent) {
          day.events.push(ev);
        }

        return true;
      });

      this.changeDetectCatalog = new Date().getTime();
      this.waveformService.showNewEventToastrNotification(ev, 'success');

      if (!addedEventInExistingDay && this.eventsDailySummaryForCatalog) {
        if (this.waveformService.eventListQuery) {
          if (
            eventDate.isAfter(moment.utc(this.waveformService.eventListQuery.time_utc_before)) ||
            eventDate.isBefore(moment.utc(this.waveformService.eventListQuery.time_utc_after))
          ) {
            console.log(`New event is outside of the current filter. Not added!`);
            return;
          }
        }
      }

    } catch (err) {
      console.error(err);
    }
  }


  /**
   * Update event that is in catalog.
   *
   * @remarks
   * Tries to find event in catalog data. If event is successfully found it updates the data.
   *
   * @param event event to update
   *
   */
  private async _updateEvent(event: IEvent) {
    if (!event) {
      return;
    }

    this.eventsDailySummaryForCatalog.some(day => {
      return day.events && day.events.some(ev => {
        if (ev.event_resource_id === event.event_resource_id) {
          if (JSON.stringify(ev) !== JSON.stringify(event)) {
            // @ts-ignore
            Object.keys(event).forEach((key) => (event[key] === null) && delete ev[key]);
            day.modification_timestamp_max = event.modification_timestamp;

            if (EventUtil.isEventOustideOfFilter(this.waveformService.eventListQuery, event)) {
              event.outsideOfCurrentFilter = true;
            } else {
              event.outsideOfCurrentFilter = false;
            }
            Object.assign(ev, event);
            this.changeDetectCatalog = new Date().getTime();
          }

          return true;
        }
      });
    });

    this._checkToUpdateCurrentEvent(event);
    this._checkToUpdateCurrentEventInfo(event);
    this.changeDetectCatalog = new Date().getTime();
  }


  /**
   * Update currentEvent object if data has changed
   *
   * @param ev new event object
   *
   */
  private _checkToUpdateCurrentEvent(ev: IEvent) {
    if (
      ev &&
      this.currentEvent.event_resource_id === ev.event_resource_id &&
      JSON.stringify(this.currentEvent) !== JSON.stringify(ev)
    ) {
      this.currentEvent = Object.assign({}, ev);
    }
  }


  /**
   * Update currentEventInfo object if data has changed
   *
   * @param ev new event object
   *
   */
  private _checkToUpdateCurrentEventInfo(ev: IEvent) {
    if (
      ev &&
      this.currentEventInfo.event_resource_id === ev.event_resource_id &&
      JSON.stringify(this.currentEventInfo) !== JSON.stringify(ev)
    ) {
      this.currentEventInfo = Object.assign({}, ev);
    }
  }


  /**
   * Check if has changed day with either currentEvent or currentEventInfo and if yes check if they need to update
   *
   * @param updatedDay day that was updated
   * @param events list of new events that will be compared to currentEvent or currentEventInfo
   *
   */
  private _updateCurrentEventsIfNeeded(updatedDay: moment.Moment, events: IEvent[]) {

    const currentEventDate = moment.utc(this.currentEvent.time_utc).utcOffset(this.timezone).startOf('day');
    const currentEventInfoDate = moment.utc(this.currentEventInfo.time_utc).utcOffset(this.timezone).startOf('day');
    const checkCurrentEvent = this.currentEvent && updatedDay.isSame(currentEventDate);
    const checkCurrentEventInfo = this.currentEventInfo && updatedDay.isSame(currentEventInfoDate);


    if (checkCurrentEvent || checkCurrentEventInfo) {

      events.forEach(ev => {
        if (checkCurrentEvent) {
          this._checkToUpdateCurrentEvent(ev);
        }

        if (checkCurrentEventInfo) {
          this._checkToUpdateCurrentEventInfo(ev);
        }
      });

    }
  }


  /**
   * Load events for currently selected day in event catalog
   *
   * @param selectedDay currently selected/open day
   *
   */
  async loadEventsForCurrentlySelectedDay(selectedDay: EventsDailySummaryForCatalog | null) {
    if (!selectedDay || selectedDay.partial) {
      return;
    }

    try {
      const date = moment(selectedDay.dayDate);
      const query: EventQuery = {
        ...this.waveformService.eventListQuery
      };

      query.time_utc_after = date.startOf('day').toISOString();
      query.time_utc_before = date.endOf('day').toISOString();

      const response = await this._eventApiService.getEvents(query).toPromise();

      this._updateCurrentEventsIfNeeded(moment(selectedDay.dayDate), response.results);

      let lastModification = response.results && response.results[0] && response.results[0].modification_timestamp ? response.results[0].modification_timestamp : null;

      if (lastModification) {
        let lastModificationMoment = moment.utc(lastModification);
        response.results.forEach(val => {
          if (lastModificationMoment.isBefore(moment.utc(val.modification_timestamp))) {
            lastModification = val.modification_timestamp;
            lastModificationMoment = moment.utc(lastModification);
          }
        });
      }
      selectedDay.events = response.results;
      selectedDay.upToDate = true;
      selectedDay.modification_timestamp_max = lastModification;
      this.changeDetectCatalog = new Date().getTime();
    } catch (err) {
      console.error(err);
    }

    // if currently selected event is in currently selected day and the event doesn't fit into selected filter (wasn't loaded by API), we need to add it to the event list manually.
    this.eventsDailySummaryForCatalog = EventUtil.mapEventToCatalog(this.currentEvent, this.timezone, this.eventsDailySummaryForCatalog);
  }


  /**
   * Handles click on chart icon button in catalog component
   *
   * @remarks
   *
   * Used for changing current waveform chart event. Angular routing is used to detect changed event {@link _watchForCurrentEventChange()}
   *
   * @param event clicked event
   *
   */
  async openChart(event: IEvent) {
    this._router.navigate(['/events', event.event_resource_id], {
      relativeTo: this._activatedRoute,
      queryParamsHandling: 'merge',
    });
  }


  /**
   * Handles click on event in catalog component
   *
   * @param ev clicked event
   *
   */
  async openEvent(ev: IEvent) {
    this.currentEventInfo = Object.assign({}, ev);
  }


  /**
   * Handles click on day in catalog component
   *
   * @param day clicked day
   *
   */
  async dayChanged(day: EventsDailySummaryForCatalog) {
    try {
      if (!day) {
        return;
      }

      this.currentDay.next(day);
      if (!day.upToDate && !day.partial) {
        await this.loadEventsForCurrentlySelectedDay(day);
      }
    } catch (err) {
      this._toastrNotificationService.error(err);
      console.error(err);
    }
  }


  /**
   * Handles opening/closing of waveform sidebar
   *
   */
  onCollapseButtonClick() {
    this.waveformService.sidebarOpened.next(!this.waveformService.sidebarOpened.getValue());
  }


  /**
   * LOADING ANIMATIONS
   */

  startLoadingEventList() {
    this._ngxSpinnerService.show('loadingEventList', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
  }
  stopLoadingEventList() {
    this._ngxSpinnerService.hide('loadingEventList');
  }


  /**
   * Just manual testing
   *
   */
  test() {
    this._addEvent(EventUtil.testEvent);
  }
}
