import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, BehaviorSubject } from 'rxjs';
import { first, distinctUntilChanged, skip } from 'rxjs/operators';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';

import EventUtil from '@core/utils/event-util';
import { EventApiService } from '@services/event-api.service';
import { Site, Network } from '@interfaces/inventory.interface';
import { EventUpdateDialog, EventFilterDialogData, EventInteractiveProcessingDialog } from '@interfaces/dialogs.interface';
import {
  IEvent, EvaluationStatus, EventType, EvaluationMode, WebsocketResponseOperation, EvaluationStatusGroup
} from '@interfaces/event.interface';
import { EventQuery } from '@interfaces/event-query.interface';
import { EventUpdateInput } from '@interfaces/event-dto.interface';
import { EventUpdateDialogComponent } from '@app/events/dialogs/event-update-dialog/event-update-dialog.component';
import { EventFilterDialogComponent } from '@app/events/dialogs/event-filter-dialog/event-filter-dialog.component';
import { WaveformService } from '@services/waveform.service';
import { InventoryApiService } from '@services/inventory-api.service';
// tslint:disable-next-line:max-line-length
import { EventInteractiveProcessingDialogComponent } from '@app/events/dialogs/event-interactive-processing-dialog/event-interactive-processing-dialog.component';


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
  eventInteractiveProcessDialogRef: MatDialogRef<EventInteractiveProcessingDialogComponent, EventInteractiveProcessingDialog>;

  eventStartDate: Date;
  eventEndDate: Date;

  currentEvent: IEvent;
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
  onServerEventSub: Subscription;
  interactiveProcessingSub: Subscription;

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
    await this._loadSites();
    await this._loadEventTypesAndStatuses();
    await Promise.all([
      this._loadCurrentEvent(),
      this._loadEvents(),
      this._watchServerEventUpdates()
    ]);

    // TODO:finish when API's fixed
    this.interactiveProcessingSub = this.waveformService.interactiveProcessLoading
      .pipe(
        distinctUntilChanged(),
        skip(1)
      )
      .subscribe(val => {
        if (val) {
          console.log(`interactive processing started`);
          this._ngxSpinnerService.show('loadingInteractiveProcessing', { fullScreen: true, bdColor: 'rgba(51,51,51,0.5)' });
        } else {
          console.log(`interactive processing finished`);
          this._ngxSpinnerService.hide('loadingInteractiveProcessing');
        }
      });
  }

  ngOnDestroy() {
    if (this.paramsSub) {
      this.paramsSub.unsubscribe();
    }
    if (this.onServerEventSub) {
      this.onServerEventSub.unsubscribe();
    }
    if (this.interactiveProcessingSub) {
      this.interactiveProcessingSub.unsubscribe();
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
        case WebsocketResponseOperation.INTERACTIVE_BATCH_READY:
          // TODO:finish when API's fixed
          console.log(`INTERACTIVE_BATCH_READY`);
          console.log(data);
          this.waveformService.interactiveProcessLoading.next(false);
          this.openInteractiveProcessDialog(this.currentEvent, data.event);
          break;
        case WebsocketResponseOperation.INTERACTIVE_BATCH_FAILED:
          // TODO:finish when API's fixed
          console.log(`INTERACTIVE_BATCH_FAILED`);
          console.log(data);
          // TODO:OMG OMG what now what now?! maybe this! what else? AAAAAAaaaa...... . .   .   .    puff!
          this.waveformService.interactiveProcessLoading.next(false);
          break;
        default:
          console.log(data);
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

  private _buildEventListQuery(queryParams: any) {
    const eventListQuery: EventQuery = {};

    if (queryParams.time_utc_before && queryParams.time_utc_after) {
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
      eventListQuery.time_utc_after = moment().utc().utcOffset(this.timezone).startOf('day').subtract(eventListQuery.time_range - 1, 'days').toISOString();
      eventListQuery.time_utc_before = moment().utc().utcOffset(this.timezone).endOf('day').toISOString();
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
    eventListQuery.page_size = 1000;


    return eventListQuery;
  }

  private _buildEventListParams(eventListQuery: EventQuery) {
    const params: any = {};

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

    return params;
  }

  private async _loadEvents() {

    try {
      this.loadingEventList = true;
      this._ngxSpinnerService.show('loadingEventList', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });

      const queryParams = this._activatedRoute.snapshot.queryParams;


      if (!this.eventListQuery) {
        this.eventListQuery = this._buildEventListQuery(queryParams);
        this.numberOfChangesInFilter = EventUtil.getNumberOfChanges(this.eventListQuery);
      }

      const response = await this._eventApiService.getEvents(this.eventListQuery).toPromise();
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
        timezone: this.timezone,
        sites: this.sites,
        eventQuery: this.eventListQuery,
        evaluationStatuses: this.EvaluationStatusGroups,
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

        this._router.navigate(
          [],
          {
            relativeTo: this._activatedRoute,
            queryParams: this._buildEventListParams(this.eventListQuery),
          });

        this.numberOfChangesInFilter = EventUtil.getNumberOfChanges(this.eventListQuery);
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
        event: this.currentEventInfo,
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
      await this._eventApiService.updateEventById(this.currentEventInfo.event_resource_id, eventUpdateInput).toPromise();
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
      await this._eventApiService.updateEventById(this.currentEventInfo.event_resource_id, eventUpdateInput).toPromise();
    } catch (err) {
      repsonse = false;
      console.error(err);
    } finally {
      this._ngxSpinnerService.hide('loadingCurrentEvent');
    }

    return repsonse;
  }


  openInteractiveProcessDialog(oldEvent: IEvent, newEvent: IEvent) {
    if (!oldEvent || !newEvent) {
      return;
    }

    // tslint:disable-next-line:max-line-length
    this.eventInteractiveProcessDialogRef = this._matDialog.open<EventInteractiveProcessingDialogComponent, EventInteractiveProcessingDialog>(EventInteractiveProcessingDialogComponent, {
      hasBackdrop: true,
      width: '600px',
      data: {
        newEvent,
        oldEvent,
      }
    });

    // TODO: finish when API's fixed
    this.eventInteractiveProcessDialogRef.componentInstance.onAcceptClicked.subscribe(async () => {
      try {
        const response = await this._eventApiService.acceptEventPicksById(newEvent.event_resource_id).toPromise();
        console.log(response);
      } catch (err) {
        console.error(err);
      }
    });
  }

}
