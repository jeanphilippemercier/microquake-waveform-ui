import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, BehaviorSubject, Subject } from 'rxjs';
import { distinctUntilChanged, skip, takeUntil } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';

import EventUtil from '@core/utils/event-util';
import { EventApiService } from '@services/event-api.service';
import { Site, Network } from '@interfaces/inventory.interface';
import {
  IEvent, EvaluationStatus, EventType, EvaluationMode, EvaluationStatusGroup
} from '@interfaces/event.interface';
import { EventQuery } from '@interfaces/event-query.interface';
import { WaveformService } from '@services/waveform.service';
import { InventoryApiService } from '@services/inventory-api.service';


@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss'],
})
export class EventDetailComponent implements OnInit, OnDestroy {

  paramsSub: Subscription;
  events: IEvent[];
  sites: Site[];
  site: Site;
  network: Network;
  today = moment().startOf('day');

  eventStartDate: Date;
  eventEndDate: Date;


  public set currentEvent(v: IEvent) {
    this._currentEvent = v;
    this.waveformService.currentEvent.next(this._currentEvent);
  }

  public get currentEvent(): IEvent {
    return this._currentEvent;
  }

  private _currentEvent: IEvent;
  currentEventChart: IEvent;
  currentEventInfo: IEvent;

  eventTypes: EventType[];
  evaluationStatuses: EvaluationStatus[];
  EvaluationStatusGroups: EvaluationStatusGroup[];
  eventEvaluationModes: EvaluationMode[];

  initialized: BehaviorSubject<boolean> = new BehaviorSubject(false);
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

  private _unsubscribe = new Subject<void>();

  constructor(
    private _eventApiService: EventApiService,
    private _inventoryApiService: InventoryApiService,
    public waveformService: WaveformService,
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private _ngxSpinnerService: NgxSpinnerService,
  ) { }

  async ngOnInit() {
    await this._loadSites();
    await this._loadEventTypesAndStatuses();
    await Promise.all([
      this._loadCurrentEvent(),
      this._loadCurrentEventCatalog(),
    ]);

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
              this.currentEventInfo = clickedEvent;
              this.initialized.next(true);
            }
          } catch (err) {
            console.error(err);
          } finally {
            this.loadingCurrentEvent = false;
            this._ngxSpinnerService.hide('loadingCurrentEvent');
          }
        }
      });
  }

  private async _loadCurrentEventCatalog() {

    this.paramsSub = this._activatedRoute.queryParams
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(async queryParams => {
        this.waveformService.eventListQuery = EventUtil.buildEventListQuery(queryParams, this.timezone);
        this.waveformService.numberOfChangesInFilter = EventUtil.getNumberOfChanges(this.waveformService.eventListQuery);
        this._loadEvents();
      });
  }

  private async _loadEvents() {
    try {
      this.loadingEventList = true;
      this._ngxSpinnerService.show('loadingEventList', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });

      // if (!this.eventListQuery) {
      //   const queryParams = this._activatedRoute.snapshot.queryParams;
      //   this.eventListQuery = EventUtil.buildEventListQuery(queryParams, this.timezone);
      //   this.numberOfChangesInFilter = EventUtil.getNumberOfChanges(this.eventListQuery);
      // }

      const response = await this._eventApiService.getEvents(this.waveformService.eventListQuery).toPromise();
      this.events = response.results;

    } catch (err) {
      console.error(err);
    } finally {
      this.loadingEventList = false;
      this._ngxSpinnerService.hide('loadingEventList');
    }
  }

  private async _loadEventTypesAndStatuses() {
    this.eventTypes = await this._eventApiService.getMicroquakeEventTypes({ site_code: this.site.code }).toPromise();
    this.evaluationStatuses = Object.values(EvaluationStatus);
    this.EvaluationStatusGroups = Object.values(EvaluationStatusGroup);
    this.eventEvaluationModes = Object.values(EvaluationMode);
  }

  private async _loadSites() {
    this.sites = await this._inventoryApiService.getSites().toPromise();
    const options = JSON.parse(localStorage.getItem('viewer-options'));

    if (options && options.site && options.network) {
      if (options.site) {
        this.site = this.sites.find(site => site.code === options.site);
      }
      if (options.network && this.site && this.site.networks) {
        this.network = this.site.networks.find(network => network.code === options.network);
      }
    } else if (this.sites) {
      this.site = this.sites[0];

      if (this.site) {
        this.network = this.site.networks[0];
      }
    }
  }

  private _addEvent(event: IEvent) {
    try {
      const eventDate = moment(event.time_utc);
      const idx = this.events.findIndex(ev => eventDate.isAfter(ev.time_utc));
      if (idx > -1) {
        this.events.splice(idx, 0, event);
      } else {
        this.events.push(event);
      }
      this.changeDetectCatalog = new Date().getTime();
    } catch (err) {
      console.error(err);
    }
  }

  private async _updateEvent(event: IEvent) {
    if (!event) {
      return;
    }

    // check events in catalog
    if (this.events && this.events.length > 0) {

      // check if event with same ID already in catalog
      this.events.some((ev, idx) => {
        if (ev.event_resource_id === event.event_resource_id) {
          if (JSON.stringify(ev) !== JSON.stringify(event)) {
            this.events[idx] = Object.assign(this.events[idx], event);
            this.changeDetectCatalog = new Date().getTime();
          }
          return true;
        }
      });
    }

    if (this.currentEvent && event.event_resource_id === this.currentEvent.event_resource_id) {
      this.currentEvent = Object.assign({}, event);
    }
  }

  async openChart(event: IEvent) {
    this._router.navigate(['/events', event.event_resource_id], {
      relativeTo: this._activatedRoute,
      queryParamsHandling: 'merge',
    });
  }

  async openEvent(event: IEvent) {
    this.currentEventInfo = event;
  }

  onCollapseButtonClick() {
    this.waveformService.sidebarOpened.next(!this.waveformService.sidebarOpened.getValue());
  }

}
