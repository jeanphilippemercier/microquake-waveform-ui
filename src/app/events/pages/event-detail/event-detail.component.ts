import { Component, OnInit, ViewEncapsulation, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import * as moment from 'moment';

import { IEvent, EvaluationStatus, EventType, EventUpdateInput, EventEvaluationMode } from '@app/core/interfaces/event.interface';
import { ActivatedRoute } from '@angular/router';
import { Subscription, Observable, BehaviorSubject } from 'rxjs';

import { EventApiService } from '@services/event-api.service';
import { Site, Network } from '@interfaces/site.interface';
import { MatDialog, MatDialogRef } from '@angular/material';
import { EventUpdateDialogComponent } from '@app/events/dialogs/event-update-dialog/event-update-dialog.component';
import { EventUpdateDialog } from '@app/core/interfaces/dialogs.interface';
import { first } from 'rxjs/operators';

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
  days: Array<Array<IEvent>> = [];
  daysMap: any = {};
  today = moment().startOf('day');
  eventUpdateDialogRef: MatDialogRef<EventUpdateDialogComponent, EventUpdateDialog>;

  eventStartDate: Date = moment().startOf('day').subtract(7, 'days').toDate();
  eventEndDate: Date = moment().endOf('day').toDate();

  currentEvent: IEvent;
  currentEventChart: IEvent;

  eventTypes: EventType[];
  evaluationStatuses: EvaluationStatus[];
  eventEvaluationModes: EventEvaluationMode[];

  initialized: BehaviorSubject<boolean> = new BehaviorSubject(false);
  eventUpdateDialogOpened = false;

  loadingCurrentEvent = false;
  loadingEventList = false;
  loadingCurrentEventAndList = false;

  constructor(
    private _eventApiService: EventApiService,
    private _activatedRoute: ActivatedRoute,
    private _matDialog: MatDialog
  ) { }

  ngOnInit() {
    this._loadCurrentEvent();
    this._loadSites();
    this._loadEvents();
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

  ngOnDestroy() {
    if (this.params$) {
      this.params$.unsubscribe();
    }
  }

  private async _loadEvents() {

    try {
      this.loadingEventList = true;
      const startTime = moment(this.eventStartDate).toISOString();
      const endTime = moment(this.eventEndDate).toISOString();

      this.events = await this._eventApiService.getEvents({
        site_code: this.site ? this.site.code : '',
        network_code: this.network ? this.network.code : '',
        start_time: startTime.toString(),
        end_time: endTime.toString()
      }).toPromise();

      // TODO: API problem - no order by time_utc on api?
      this.events.sort((a, b) => (new Date(a.time_utc) > new Date(b.time_utc)) ? -1 : 1);
      this.mapEventsToDays();
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
    }
  }

  async openChart(event: IEvent) {
    this.currentEventChart = event;
  }


  async openEventUpdateDialog() {
    if (this.eventUpdateDialogRef || this.eventUpdateDialogOpened) {
      return;
    }
    this.eventUpdateDialogOpened = true;
    this.loadingCurrentEventAndList = true;

    await this._loadEventTypesAndStatuses();

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
        this.updateEventWherePossible(result);
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

  mapEventsToDays() {
    this.events.forEach(event => {
      const day = moment(event.time_utc).utcOffset(event.timezone).startOf('day').toString();
      if (typeof this.daysMap[day] === 'undefined') {
        this.days.push([]);
        this.daysMap[day] = this.days.length - 1;
      }
      this.days[this.daysMap[day]].push(event);
    });
  }

  async updateEventWherePossible(event: IEvent) {
    if (!event || !this.days) {
      return;
    }

    this.events = this.events.map(ev => (ev.event_resource_id === event.event_resource_id) ? event : ev);
    this.days = this.days.map(day => []);
    this.mapEventsToDays();

    if (event.event_resource_id === this.currentEvent.event_resource_id) {
      this.currentEvent = event;
    }
  }
}
