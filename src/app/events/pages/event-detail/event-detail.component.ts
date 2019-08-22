import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

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
import { NgxSpinnerService } from 'ngx-spinner';

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

  changeDetectCatalog = 0;
  onServerEventSub: Subscription;

  constructor(
    private _eventApiService: EventApiService,
    private _inventoryApiService: InventoryApiService,
    public waveformService: WaveformService,
    private _activatedRoute: ActivatedRoute,
    private _matDialog: MatDialog,
    private _router: Router,
    private _ngxSpinnerService: NgxSpinnerService
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
    if (this.paramsSub) {
      this.paramsSub.unsubscribe();
    }
    if (this.onServerEventSub) {
      this.onServerEventSub.unsubscribe();
    }
  }


  @HostListener('window:keydown', ['$event'])
  doSomething($event: KeyboardEvent) {
    if (!$event) {
      return;
    }

    switch ($event.key) {
      case 'e':
      case 'E':
        this.openEventUpdateDialog();
        break;
      default:
        break;
    }
  }

  private _watchServerEventUpdates() {
    this.onServerEventSub = this._eventApiService.onServerEvent().subscribe(data => {

      switch (data.operation) {
        case WebsocketResponseOperation.UPDATE:
          this._updateEvent(data.event);
          break;
        case WebsocketResponseOperation.CREATED:
          this._addEvent(data.event);
          break;
        default:
          console.log(`unknown websocket operation`);
          break;
      }
    });
  }

  private async _loadCurrentEvent() {
    this.paramsSub = this._activatedRoute.params.subscribe(async params => {
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
            this.currentEventChart = clickedEvent;
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

  private async _loadBoundaries() {
    [this.boundaries] = await this._eventApiService.getBoundaries().toPromise();
  }

  private async _loadEvents() {

    try {
      this.loadingEventList = true;
      this._ngxSpinnerService.show('loadingEventList', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });

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
      this._ngxSpinnerService.hide('loadingEventList');
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

    if (event.event_resource_id === this.currentEvent.event_resource_id) {
      this.currentEvent = Object.assign({}, event);
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
    this._ngxSpinnerService.show('loadingCurrentEventAndList', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });

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
        this._ngxSpinnerService.show('loadingEventFilter', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
        await this._loadEvents();
        this.numberOfChangesInFilter = this.eventFilterDialogRef.componentInstance.getNumberOfChanges(this.eventListQuery);
        this.eventFilterDialogRef.close();
      } catch (err) {
        console.error(err);
      } finally {
        this.eventFilterDialogRef.componentInstance.loading = false;
        this._ngxSpinnerService.hide('loadingEventFilter');
      }
    });

    this.eventFilterDialogRef.afterClosed().pipe(first()).subscribe(val => {
      delete this.eventFilterDialogRef;
      this.eventFilterDialogOpened = false;
    });

    this.loadingCurrentEventAndList = false;
    this._ngxSpinnerService.hide('loadingCurrentEventAndList');
  }

  async openEventUpdateDialog() {
    if (this.eventUpdateDialogRef || this.eventUpdateDialogOpened) {
      return;
    }
    this.eventUpdateDialogOpened = true;
    this.loadingCurrentEventAndList = true;
    this._ngxSpinnerService.show('loadingCurrentEventAndList', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });

    this.eventUpdateDialogRef = this._matDialog.open<EventUpdateDialogComponent, EventUpdateDialog>(EventUpdateDialogComponent, {
      hasBackdrop: true,
      width: '600px',
      data: {
        event: this.currentEvent,
        evaluationStatuses: this.evaluationStatuses,
        eventTypes: this.eventTypes,
        eventEvaluationModes: this.eventEvaluationModes,
        mode: 'updateDialog'
      }
    });

    const updateDialogSaveSub = this.eventUpdateDialogRef.componentInstance.onSave.subscribe(async (data: EventUpdateInput) => {
      try {
        this.eventUpdateDialogRef.componentInstance.loading = true;
        this._ngxSpinnerService.show('loadingEventUpdate', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
        const result = await this._eventApiService.updateEventById(data.event_resource_id, data).toPromise();
        this._updateEvent(result);
        this.eventUpdateDialogRef.close();
      } catch (err) {
        console.error(err);
      } finally {
        this.eventUpdateDialogRef.componentInstance.loading = false;
        this._ngxSpinnerService.hide('loadingEventUpdate');
      }
    });

    const updateDialogAcceptSub = this.eventUpdateDialogRef.componentInstance.onAcceptClicked.subscribe(async (data: EventType) => {
      this.eventUpdateDialogRef.componentInstance.loading = true;
      this._ngxSpinnerService.show('loadingEventUpdate', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });

      if (await this.onAcceptClick(data)) {
        this.eventUpdateDialogRef.close();
      }

      this.eventUpdateDialogRef.componentInstance.loading = false;
      this._ngxSpinnerService.hide('loadingEventUpdate');
    });

    const updateDialogRejectSub = this.eventUpdateDialogRef.componentInstance.onRejectClicked.subscribe(async (data: EventType) => {
      this.eventUpdateDialogRef.componentInstance.loading = true;
      this._ngxSpinnerService.show('loadingEventUpdate', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });

      if (await this.onDeclineClick(data)) {
        this.eventUpdateDialogRef.close();
      }

      this.eventUpdateDialogRef.componentInstance.loading = false;
      this._ngxSpinnerService.hide('loadingEventUpdate');
    });

    this.eventUpdateDialogRef.afterClosed().pipe(first()).subscribe(val => {
      delete this.eventUpdateDialogRef;
      updateDialogSaveSub.unsubscribe();
      updateDialogAcceptSub.unsubscribe();
      updateDialogRejectSub.unsubscribe();
      this.eventUpdateDialogOpened = false;
    });

    this.loadingCurrentEventAndList = false;
    this._ngxSpinnerService.hide('loadingCurrentEventAndList');
  }

  onCollapseButtonClick() {
    this.waveformService.sidebarOpened.next(!this.waveformService.sidebarOpened.getValue());
  }

  async onAcceptClick($event: EventType): Promise<boolean> {
    let repsonse = true;
    try {
      this._ngxSpinnerService.show('loadingCurrentEvent', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
      const eventUpdateInput: EventUpdateInput = {
        event_type: $event.quakeml_type,
        evaluation_mode: EvaluationMode.MANUAL,
        // this.currentEvent.event_type !== $event.quakeml_type ? EvaluationMode.MANUAL : EvaluationMode.AUTOMATIC,
        status: EvaluationStatus.CONFIRMED
      };
      await this._eventApiService.updateEventById(this.currentEvent.event_resource_id, eventUpdateInput).toPromise();
    } catch (err) {
      repsonse = false;
      console.error(err);
    } finally {
      this._ngxSpinnerService.hide('loadingCurrentEvent');
    }

    return repsonse;
  }

  async onDeclineClick($event: EventType): Promise<boolean> {
    let repsonse = true;
    try {
      this._ngxSpinnerService.show('loadingCurrentEvent', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
      const eventUpdateInput: EventUpdateInput = {
        event_type: $event.quakeml_type,
        evaluation_mode: EvaluationMode.MANUAL,
        status: EvaluationStatus.REJECTED
      };
      await this._eventApiService.updateEventById(this.currentEvent.event_resource_id, eventUpdateInput).toPromise();
    } catch (err) {
      repsonse = false;
      console.error(err);
    } finally {
      this._ngxSpinnerService.hide('loadingCurrentEvent');
    }

    return repsonse;
  }
}
