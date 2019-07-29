import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { MatDialog, MatDialogRef } from '@angular/material';

import { EventApiService } from '@services/event-api.service';
import { Site, Network } from '@interfaces/site.interface';
import { EventUpdateDialog, EventFilterDialogData } from '@interfaces/dialogs.interface';
import {
  IEvent, EvaluationStatus, EventType, EventUpdateInput, EventEvaluationMode, EventQuery, Boundaries
} from '@interfaces/event.interface';
import { EventUpdateDialogComponent } from '@app/events/dialogs/event-update-dialog/event-update-dialog.component';
import { EventFilterDialogComponent } from '@app/events/dialogs/event-filter-dialog/event-filter-dialog.component';

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
  eventEvaluationModes: EventEvaluationMode[];

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
    // TODO: eventstream
    // this._eventApiService.getServerUpdatedEvent().subscribe(data => console.log(data));
  }

  ngOnDestroy() {
    if (this.params$) {
      this.params$.unsubscribe();
    }
  }

  private async _loadCurrentEvent() {
    this.params$ = this._activatedRoute.params.subscribe(async params => {
      const eventId = params['eventId'];
      if (eventId) {
        try {
          this.loadingCurrentEvent = true;
          const clickedEvent = await this._eventApiService.getEventById(eventId).toPromise();
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
    this.eventEvaluationModes = Object.values(EventEvaluationMode);
  }

  private async _loadSites() {
    this.sites = await this._eventApiService.getSites().toPromise();
    const options = JSON.parse(localStorage.getItem('viewer-options'));

    if (options) {
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

    this.events.some((ev, idx) => {
      if (ev.event_resource_id === event.event_resource_id) {
        this.events[idx] = Object.assign(ev, event);
        return true;
      }
    });

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
}
