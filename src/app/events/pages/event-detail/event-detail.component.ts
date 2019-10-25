import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, BehaviorSubject, Subject, interval } from 'rxjs';
import { distinctUntilChanged, skip, takeUntil, filter } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';

import EventUtil from '@core/utils/event-util';
import { EventApiService } from '@services/event-api.service';
import { Site, Network } from '@interfaces/inventory.interface';
import { IEvent, EventsDailySummary, EvaluationStatusGroup, QuakemlType, EvaluationStatus } from '@interfaces/event.interface';
import { EventQuery, EventDailySummaryQuery } from '@interfaces/event-query.interface';
import { WaveformService } from '@services/waveform.service';
import { ToastrNotificationService } from '@services/toastr-notification.service';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss'],
})
export class EventDetailComponent implements OnInit, OnDestroy {

  paramsSub: Subscription;
  events: IEvent[];
  eventsDailySummary: EventsDailySummary[];
  sites: Site[];
  site: Site;
  network: Network;
  today = moment().startOf('day');

  public set currentEvent(v: IEvent) {
    this._currentEvent = v;
    this.waveformService.currentEvent.next(this._currentEvent);
  }

  public get currentEvent(): IEvent {
    return this._currentEvent;
  }

  private _currentEvent: IEvent;
  currentEventInfo: IEvent;

  initialized: BehaviorSubject<boolean> = new BehaviorSubject(false);
  pooling: BehaviorSubject<boolean> = new BehaviorSubject(false);
  currentDay: BehaviorSubject<EventsDailySummary> = new BehaviorSubject(null);
  eventUpdateDialogOpened = false;
  eventFilterDialogOpened = false;

  loadingCurrentEvent = false;
  loadingEventList = false;
  loadingCurrentEventAndList = false;

  eventListQuery: EventQuery;

  numberOfChangesInFilter = 0;

  // TODO: fix when resolved on API
  timezone = '+08:00';

  changeDetectCatalog = 0;
  interactiveProcessingSub: Subscription;

  acceptedEvaluationStatuses: EvaluationStatus[] = [
    EvaluationStatus.CONFIRMED,
    EvaluationStatus.FINAL,
    EvaluationStatus.PRELIMINARY,
    EvaluationStatus.REPORTED,
    EvaluationStatus.REVIEWED
  ];

  private _unsubscribe = new Subject<void>();

  constructor(
    private _eventApiService: EventApiService,
    public waveformService: WaveformService,
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private _ngxSpinnerService: NgxSpinnerService,
    private _toastrNotificationService: ToastrNotificationService
  ) { }

  test() {
    /*
    const e: IEvent = {
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
      network: null,
      npick: 0,
      plunge: null,
      preferred_magnitude_id: 'smi:local/e2a0a92f-ea87-4fd9-bbda-855e48d62949',
      preferred_origin_id: 'smi:local/c04c7085-a75c-4c5f-bed7-7346a3a72ba9',
      site: 1,
      status: EvaluationStatus.PRELIMINARY,
      time_epoch: 1569679000705994000,
      time_residual: null,
      time_utc: '2019-10-24T05:56:39.705994Z',
      timezone: '+08:00',
      uncertainty: null,
      uncertainty_vector_x: null,
      uncertainty_vector_y: null,
      uncertainty_vector_z: null,
      variable_size_waveform_file: 'https://permanentdbfilesstorage.blob.core.windows.net/permanentdbfilesblob/events/994be6b4b4a055659683601d0e86d44e.variable_mseed',
      waveform_context_file: 'https://permanentdbfilesstorage.blob.core.windows.net/permanentdbfilesblob/events/994be6b4b4a055659683601d0e86d44e.context_mseed',
      waveform_file: 'https://permanentdbfilesstorage.blob.core.windows.net/permanentdbfilesblob/events/994be6b4b4a055659683601d0e86d44e.mseed',
      x: 651400,
      y: 4767670,
      z: -25,
    };
    this._addEvent(e);
  */
  }

  async ngOnInit() {
    await this.waveformService.isInitialized();
    await this._getAndSubForQueryParamChange();
    await this._loadCurrentEvent();
    this._initPooling();

    this.interactiveProcessingSub = this.waveformService.interactiveProcessLoading
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


  @HostListener('window:keydown', ['$event'])
  doSomething($event: KeyboardEvent) {
    if (!$event) {
      return;
    }

    switch ($event.key) {
      case 'e':
      case 'E':
        this.waveformService.openEventUpdateDialog(this.currentEventInfo);
        break;
      default:
        break;
    }
  }

  private async _loadDailyEventSummary(showLoading = true) {
    try {
      const query: EventDailySummaryQuery = {
        ...this.waveformService.eventListQuery,
        tz_offset: this.timezone
      };
      if (showLoading) {
        this.startLoadingEventList();
      }
      const response = await this._eventApiService.getEventDailySummary(query).toPromise();

      if (this.eventsDailySummary) {
        this.checkForChangesInSummary(this.eventsDailySummary, response.results);

        const currentDay = this.currentDay.getValue();

        if (currentDay && !currentDay.upToDate) {
          const found = this.eventsDailySummary ? this.eventsDailySummary.find(val => val.dayDate.isSame(currentDay.dayDate)) : null;
          this.loadEventsForCurrentlySelectedDay(found);
        }

      } else {
        this.pooling.next(true);
        this.eventsDailySummary = response.results.map((val, idx) => {
          return {
            ...val,
            dayDate: moment.utc(val.date, 'YYYY-MM-DD').utcOffset(this.timezone, true).startOf('day')
          };
        });
      }

    } catch (err) {
      console.error(err);

    } finally {
      this.stopLoadingEventList();
    }
  }

  private checkForChangesInSummary(currentSummary: EventsDailySummary[], newSummary: EventsDailySummary[]) {
    newSummary.map((val, idx) => {
      const found = currentSummary.find(v => v.date === val.date);
      if (found) {
        const foundTmp = Object.assign({}, found);
        val.events = found.events;
        val.upToDate = found.upToDate && val.events && val.modification_timestamp_max === found.modification_timestamp_max ? true : false;
        val.dayDate = found.dayDate;
      } else {
        val.dayDate = moment.utc(val.date, 'YYYY-MM-DD').utcOffset(this.timezone, true).startOf('day');
      }
      return val;
    });

    Object.assign(currentSummary, newSummary);

    const currentDay = this.currentDay.getValue();
    if (currentDay) {
      const foundCurrentDay = currentSummary.find(v => v.date === currentDay.date);

      if (foundCurrentDay) {
        Object.assign(currentDay, foundCurrentDay);
      }
    }

    this.changeDetectCatalog = new Date().getTime();
  }

  private async _loadCurrentEvent() {
    this.paramsSub = this._activatedRoute.params
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(async params => {
        const eventId = params['eventId'];
        if (eventId) {
          try {
            this.loadingCurrentEvent = true;
            this._ngxSpinnerService.show('loadingCurrentEvent', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
            let clickedEvent: IEvent;

            // try to find event in catalog events (already loaded events)
            if (this.events) {
              const idx = this.events.findIndex(ev => ev.event_resource_id === eventId);
              if (idx > -1) {
                clickedEvent = Object.assign({}, this.events[idx]);
              }
            }

            // load event from api if not found in catalog events
            if (!clickedEvent) {
              clickedEvent = await this._eventApiService.getEventById(eventId).toPromise();
            }
            this.currentEvent = clickedEvent;

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
  private async _getAndSubForQueryParamChange() {
    return new Promise(resolve => {
      this.paramsSub = this._activatedRoute.queryParams
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(async queryParams => {
          this.waveformService.eventListQuery = EventUtil.buildEventListQuery(queryParams, this.timezone);
          this.waveformService.numberOfChangesInFilter = EventUtil.getNumberOfChanges(this.waveformService.eventListQuery);
          delete this.eventsDailySummary;
          this._loadDailyEventSummary();
          resolve();
        });
    });
  }

  private async _initPooling() {
    interval(30000).pipe(
      filter(val => this.pooling.getValue()),
      takeUntil(this._unsubscribe)
    ).subscribe(_ => {
      this._loadDailyEventSummary(false);
    });
  }

  private async _loadEvents(showLoading = true) {
    try {
      this.loadingEventList = true;
      if (showLoading) {
        this._ngxSpinnerService.show('loadingEventList', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
      }
      const response = await this._eventApiService.getEvents(this.waveformService.eventListQuery).toPromise();
      this.events = response.results;
      this.pooling.next(true);

    } catch (err) {
      this._toastrNotificationService.error(err);
      console.error(err);
    } finally {
      this.loadingEventList = false;
      this._ngxSpinnerService.hide('loadingEventList');
    }
  }

  private _addEvent($event: IEvent) {
    if (!$event) {
      return;
    }

    try {

      const found = this.eventsDailySummary.some(day => day.events && day.events.some(ev => (ev.event_resource_id === $event.event_resource_id)));

      if (found) {
        this.waveformService.showNewEventToastrNotification($event, 'error');
        console.error(`Event is alrady in the event list: ${$event.event_resource_id}`);
        return;
      }
      const eventDate = moment.utc($event.time_utc).utcOffset(this.timezone);
      const eventDayDate = moment.utc($event.time_utc).utcOffset(this.timezone).startOf('day');
      const addedEventInExistingDay = this.eventsDailySummary.some(day => {

        if (!day.dayDate.isSame(eventDayDate)) {
          return false;
        }

        // day was not yet clicked. Mark as added, it will load automatically after clicking on the day.
        if (!day.events) {
          return true;
        }

        day.modification_timestamp_max = $event.modification_timestamp;

        const addedEvent = day.events.some((ev, idx) => {
          if (eventDate.isAfter(moment.utc(ev.time_utc).utcOffset(this.timezone))) {
            day.events.splice(idx, 0, $event);
            return true;
          }
          return false;
        });

        if (!addedEvent) {
          day.events.push($event);
        }

        return true;
      });

      this.changeDetectCatalog = new Date().getTime();
      this.waveformService.showNewEventToastrNotification($event, 'success');

      if (!addedEventInExistingDay && this.eventsDailySummary) {
        if (this.waveformService.eventListQuery) {
          if (
            eventDate.isAfter(moment.utc(this.waveformService.eventListQuery.time_utc_before)) ||
            eventDate.isBefore(moment.utc(this.waveformService.eventListQuery.time_utc_after))
          ) {
            console.log(`New event is outside of the current filter. Not added!`);
            return;
          }
        }

        const ds: EventsDailySummary = {
          date: eventDayDate.format('YYYY-MM-DD'),
          dayDate: eventDayDate,
          modification_timestamp_max: null,
          events: [$event],
          count: null,
          accepted_counts: {
            _total_: null
          }
        };

        this.eventsDailySummary.splice(0, 0, ds);
      }


    } catch (err) {
      console.error(err);
    }
  }

  private async _updateEvent(event: IEvent) {
    if (!event) {
      return;
    }

    this.eventsDailySummary.some(day => {
      return day.events && day.events.some(ev => {
        if (ev.event_resource_id === event.event_resource_id) {
          if (JSON.stringify(ev) !== JSON.stringify(event)) {
            Object.keys(event).forEach((key) => (event[key] === null) && delete ev[key]);
            day.modification_timestamp_max = event.modification_timestamp;

            if (
              (
                this.waveformService.eventListQuery.status &&
                (
                  this.waveformService.eventListQuery.status.indexOf(EvaluationStatusGroup.REJECTED) > -1 &&
                  event.status !== EvaluationStatus.REJECTED
                )
                &&
                (
                  this.waveformService.eventListQuery.status.indexOf(EvaluationStatusGroup.ACCEPTED) > -1 &&
                  this.acceptedEvaluationStatuses.indexOf(event.status) === -1
                )
              )
              ||
              (
                this.waveformService.eventListQuery.event_type &&
                this.waveformService.eventListQuery.event_type.indexOf(<QuakemlType>`${event.event_type}`) === -1
              )
            ) {
              event.outsideOfCurrentFilter = true;
            } else {
              event.outsideOfCurrentFilter = false;
            }
            Object.assign(ev, event);
          }

          return true;
        }
      });
    });

    if (this.currentEvent && this.currentEvent.event_resource_id === event.event_resource_id) {
      this.currentEvent = Object.assign({}, event);
    }

    if (this.currentEventInfo && this.currentEventInfo.event_resource_id === event.event_resource_id) {
      this.currentEventInfo = Object.assign({}, event);
    }

    this.changeDetectCatalog = new Date().getTime();
  }

  async openChart(event: IEvent) {
    this._router.navigate(['/events', event.event_resource_id], {
      relativeTo: this._activatedRoute,
      queryParamsHandling: 'merge',
    });
  }

  async openEvent(event: IEvent) {
    this.currentEventInfo = Object.assign({}, event);
  }

  onCollapseButtonClick() {
    this.waveformService.sidebarOpened.next(!this.waveformService.sidebarOpened.getValue());
  }

  async dayChanged($event: moment.Moment) {
    try {
      const found = this.eventsDailySummary ? this.eventsDailySummary.find(val => val.dayDate.isSame($event)) : null;

      if (found) {
        this.currentDay.next(found);
        if (!found.upToDate) {
          await this.loadEventsForCurrentlySelectedDay(found);
        }
      } else {
        // event outside filter's catalog
      }

    } catch (err) {
      console.error(err);

    }
  }

  async loadEventsForCurrentlySelectedDay(selectedDay: EventsDailySummary) {

    if (!selectedDay) {
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
      let lastModification = response.results[0].modification_timestamp;
      let lastModificationMoment = moment.utc(lastModification);

      response.results.forEach(val => {
        if (lastModificationMoment.isBefore(moment.utc(val.modification_timestamp))) {
          lastModification = val.modification_timestamp;
          lastModificationMoment = moment.utc(lastModification);
        }
      });

      selectedDay.events = response.results;
      selectedDay.upToDate = true;
      selectedDay.modification_timestamp_max = lastModification;
      this.changeDetectCatalog = new Date().getTime();
    } catch (err) {
      console.error(err);
    }
  }

  startLoadingEventList() {
    this._ngxSpinnerService.show('loadingEventList', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
  }

  stopLoadingEventList() {
    this._ngxSpinnerService.hide('loadingEventList');
  }

}
