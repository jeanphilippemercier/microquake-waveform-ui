import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { MatDialog, MatDialogRef } from '@angular/material';

import { EventApiService } from '@services/event-api.service';
import { Site, Network } from '@interfaces/inventory.interface';
import { EventUpdateDialog, EventFilterDialogData } from '@interfaces/dialogs.interface';
import { IEvent, EvaluationStatus, EventType, EvaluationMode, Boundaries, WebsocketResponseOperation } from '@interfaces/event.interface';
import { EventQuery } from '@interfaces/event-query.interface';
import { EventUpdateInput } from '@interfaces/event-dto.interface';
import { EventUpdateDialogComponent } from '@app/events/dialogs/event-update-dialog/event-update-dialog.component';
import { EventFilterDialogComponent } from '@app/events/dialogs/event-filter-dialog/event-filter-dialog.component';
import { WaveformService } from '@services/waveform.service';
import { InventoryApiService } from '@services/inventory-api.service';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EventDetailComponent implements OnInit, OnDestroy {

  params$: Subscription;
  events: IEvent[];
  sites: Site[];
  site: Site;
  network: Network;
  today = moment().startOf('day');
  eventUpdateDialogRef: MatDialogRef<EventUpdateDialogComponent, EventUpdateDialog>;
  eventFilterDialogRef: MatDialogRef<EventFilterDialogComponent, EventFilterDialogData>;

  eventStartDate: Date;
  eventEndDate: Date;

  currentEvent: IEvent;
  currentEventChart: IEvent;

  eventTypes: EventType[];
  evaluationStatuses: EvaluationStatus[];
  eventEvaluationModes: EvaluationMode[];

  initialized: BehaviorSubject<boolean> = new BehaviorSubject(false);
  eventUpdateDialogOpened = false;
  eventFilterDialogOpened = false;

  loadingCurrentEvent = false;
  loadingEventList = false;
  loadingCurrentEventAndList = false;

  eventListQuery: EventQuery;

  numberOfChangesInFilter = 0;

  boundaries: Boundaries;

  constructor(
    private _eventApiService: EventApiService,
    private _inventoryApiService: InventoryApiService,
    public waveformService: WaveformService,
    private _activatedRoute: ActivatedRoute,
    private _matDialog: MatDialog,
    private _router: Router
  ) { }

  async ngOnInit() {
    await this._loadBoundaries();
    await this._loadSites();
    await this._loadEventTypesAndStatuses();
    this._loadCurrentEvent();
    this._loadEvents();
    this._watchServerEventUpdates();
  }

  ngOnDestroy() {
    if (this.params$) {
      this.params$.unsubscribe();
    }
  }

  private _watchServerEventUpdates() {
    this._eventApiService.onServerEvent().subscribe(data => {
      if (data.operation === WebsocketResponseOperation.UPDATE) {
        this._updateEvent(data.event);
      }

    });
  }

  private async _loadCurrentEvent() {
    this.params$ = this._activatedRoute.params.subscribe(async params => {
      const eventId = params['eventId'];
      if (eventId) {
        try {
          this.loadingCurrentEvent = true;
          let clickedEvent: IEvent;

          // try to find event in catalog events (already loaded events)
          if (this.events) {
            clickedEvent = this.events.find(ev => ev.event_resource_id === eventId);
          }

          // load event from api if not found in catalog events
          if (!clickedEvent) {
            clickedEvent = await this._eventApiService.getEventById(eventId).toPromise();
          }
          this.currentEvent = clickedEvent;

          if (this.initialized.getValue() === false) {
            this.currentEventChart = clickedEvent;
            this.initialized.next(true);
          }
        } catch (err) {
          console.error(err);
        } finally {
          this.loadingCurrentEvent = false;
        }
      }
    });
  }

  private async _loadBoundaries() {
    [this.boundaries] = await this._eventApiService.getBoundaries().toPromise();
  }

  private async _loadEvents() {

    try {
      this.loadingEventList = true;

      if (!this.eventListQuery) {
        this.eventListQuery = {
          start_time: moment().utc().utcOffset(this.boundaries.timezone).startOf('day').subtract(2, 'days').toISOString(),
          end_time: moment().utc().utcOffset(this.boundaries.timezone).endOf('day').toISOString(),
          site_code: this.site.code ? this.site.code : '',
          network_code: this.network.code ? this.network.code : '',
          time_range: 3
        };
      }

      this.events = await this._eventApiService.getEvents(this.eventListQuery).toPromise();

    } catch (err) {
      console.error(err);
    } finally {
      this.loadingEventList = false;
    }
  }

  private async _loadEventTypesAndStatuses() {
    this.eventTypes = await this._eventApiService.getMicroquakeEventTypes({ site_code: this.site.code }).toPromise();
    this.evaluationStatuses = Object.values(EvaluationStatus);
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

  private async _updateEvent(event: IEvent) {
    if (!event) {
      return;
    }

    // check if event with same ID already in catalog
    const idx = this.events.findIndex((ev) => {
      return ev.event_resource_id === event.event_resource_id;
    });


    // event is already in catalog
    if (idx >= 0) {

      // don't update if already same
      if (JSON.stringify(this.events[idx]) !== JSON.stringify(event)) {
        this.events[idx] = Object.assign(this.events[idx], event);
      }

      if (this.currentEvent === this.events[idx]) {
        // no need for currentEvent update if currentEvent is same ref as in catalog array
        return;
      } else if (this.currentEvent.event_resource_id === this.events[idx].event_resource_id) {
        // if event with same ID is in catalog array, but currentEvent was previously loaded as standalone.
        // Assign catalog el ref to currentEvent
        this.currentEvent = this.events[idx];
        return;
      }
    }

    // currentEvent ID not in catalog array.
    // currentEvent is standalone without any other ref in catalog array
    if (event.event_resource_id === this.currentEvent.event_resource_id) {
      this.currentEvent = event;
    }
  }

  async openChart(event: IEvent) {
    this.currentEventChart = event;
  }

  async openEvent(event: IEvent) {
    this._router.navigate(['/events', event.event_resource_id]);
  }

  async openEventFilterDialog() {

    if (this.eventFilterDialogRef || this.eventFilterDialogOpened) {
      return;
    }
    this.eventFilterDialogOpened = true;
    this.loadingCurrentEventAndList = true;

    this.eventFilterDialogRef = this._matDialog.open<EventFilterDialogComponent, EventFilterDialogData>(EventFilterDialogComponent, {
      hasBackdrop: true,
      width: '750px',
      data: {
        timezone: this.boundaries.timezone,
        sites: this.sites,
        eventQuery: this.eventListQuery,
        evaluationStatuses: this.evaluationStatuses,
        eventTypes: this.eventTypes,
        eventEvaluationModes: this.eventEvaluationModes
      }
    });

    this.eventFilterDialogRef.componentInstance.onFilter.subscribe(async (data: EventQuery) => {
      try {
        this.eventListQuery = data;
        this.eventFilterDialogRef.componentInstance.loading = true;
        await this._loadEvents();
        this.numberOfChangesInFilter = this.eventFilterDialogRef.componentInstance.getNumberOfChanges(this.eventListQuery);
        this.eventFilterDialogRef.close();
      } catch (err) {
        console.error(err);
      } finally {
        this.eventFilterDialogRef.componentInstance.loading = false;
      }
    });

    this.eventFilterDialogRef.afterClosed().pipe(first()).subscribe(val => {
      delete this.eventFilterDialogRef;
      this.eventFilterDialogOpened = false;
    });

    this.loadingCurrentEventAndList = false;
  }

  async openEventUpdateDialog() {
    if (this.eventUpdateDialogRef || this.eventUpdateDialogOpened) {
      return;
    }
    this.eventUpdateDialogOpened = true;
    this.loadingCurrentEventAndList = true;

    this.eventUpdateDialogRef = this._matDialog.open<EventUpdateDialogComponent, EventUpdateDialog>(EventUpdateDialogComponent, {
      hasBackdrop: true,
      width: '600px',
      data: {
        event: this.currentEvent,
        evaluationStatuses: this.evaluationStatuses,
        eventTypes: this.eventTypes,
        eventEvaluationModes: this.eventEvaluationModes
      }
    });

    this.eventUpdateDialogRef.componentInstance.onSave.subscribe(async (data: EventUpdateInput) => {
      try {
        this.eventUpdateDialogRef.componentInstance.loading = true;
        const result = await this._eventApiService.updateEventById(data.event_resource_id, data).toPromise();
        this._updateEvent(result);
        this.eventUpdateDialogRef.close();
      } catch (err) {
        console.error(err);
      } finally {
        this.eventUpdateDialogRef.componentInstance.loading = false;
      }
    });

    this.eventUpdateDialogRef.afterClosed().pipe(first()).subscribe(val => {
      delete this.eventUpdateDialogRef;
      this.eventUpdateDialogOpened = false;
    });

    this.loadingCurrentEventAndList = false;
  }

  onCollapseButtonClick() {
    this.waveformService.sidebarOpened.next(!this.waveformService.sidebarOpened.getValue());
  }
}
