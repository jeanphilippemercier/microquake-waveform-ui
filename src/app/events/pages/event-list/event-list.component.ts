import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';
import { takeUntil, take } from 'rxjs/operators';

import { EventUpdateDialog } from '@interfaces/dialogs.interface';
import { Site, Network } from '@interfaces/inventory.interface';
import { EventType, EvaluationStatus, IEvent, EvaluationMode, EvaluationStatusGroup } from '@interfaces/event.interface';
import { EventApiService } from '@services/event-api.service';
import { EventUpdateDialogComponent } from '@app/shared/dialogs/event-update-dialog/event-update-dialog.component';
import { EventQuery } from '@interfaces/event-query.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import EventUtil from '@core/utils/event-util';
import { WaveformService } from '@services/waveform.service';
import { Subject } from 'rxjs';
import { ToastrNotificationService } from '@services/toastr-notification.service';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss']
})
export class EventListComponent implements OnInit, OnDestroy {

  sites: Site[];
  site: Site;
  network: Network;
  networks: Network[];

  selectedEventTypes: EventType[];
  selectedEvaluationStatusGroups: EvaluationStatusGroup[];
  EvaluationStatus = EvaluationStatus;
  eventEvaluationModes: EvaluationMode[];

  eventStartDate: Date = moment().startOf('day').subtract(15, 'days').toDate();
  eventEndDate: Date = moment().endOf('day').toDate();

  displayedColumns: string[] = ['time', 'type', 'magnitude', 'picks', 'time_residual', 'corner_frequency', 'uncertainty', 'actions'];
  dataSource: MatTableDataSource<any>;

  events: IEvent[];

  eventListQuery: EventQuery = {};

  eventUpdateDialogRef: MatDialogRef<EventUpdateDialogComponent, EventUpdateDialog>;
  eventUpdateDialogOpened = false;
  timezone = '+08:00';

  todayEnd = moment().utc().utcOffset(this.timezone).endOf('day');
  timeRange = 3;

  eventsCount = 0;
  cursorPrevious: string;
  cursorNext: string;

  private _unsubscribe = new Subject<void>();

  constructor(
    private _eventApiService: EventApiService,
    private _inventoryApiService: InventoryApiService,
    private _ngxSpinnerService: NgxSpinnerService,
    private _activatedRoute: ActivatedRoute,
    public waveformService: WaveformService,
    private _toastrNotificationService: ToastrNotificationService,
    private _router: Router
  ) { }

  async ngOnInit() {


    // default values
    this.selectedEventTypes = [];
    this.selectedEvaluationStatusGroups = [EvaluationStatusGroup.ACCEPTED];

    this._activatedRoute.queryParams.subscribe(val => {
      const queryParams = { ...val };
      queryParams.page_size = 15;
      queryParams.site = this.waveformService.currentSite && this.waveformService.currentSite.id ? this.waveformService.currentSite.id : undefined;
      // TODO: finish when API is ready
      // queryParams.network = this.waveformService.currentNetwork.id;
      if (Object.values(val).length === 0) {
        this.eventListQuery = EventUtil.buildEventListQuery(queryParams, this.timezone);
        this.defaultNavigate();
        return;
      }
      this.eventListQuery = EventUtil.buildEventListQuery(queryParams, this.timezone);
      this._loadEvents();
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

  private async _loadEvents() {
    try {
      this._ngxSpinnerService.show('loading', { fullScreen: true, bdColor: 'rgba(51,51,51,0.25)' });
      const response = await this._eventApiService.getEvents(this.eventListQuery).toPromise();
      this.eventsCount = response.count;
      this.cursorPrevious = response.cursor_previous;
      this.cursorNext = response.cursor_next;
      this.events = response.results;
    } catch (err) {
      this._toastrNotificationService.error(err);
      console.error(err);
    } finally {
      this._ngxSpinnerService.hide('loading');
    }

  }

  async defaultNavigate() {
    this._router.navigate(
      [],
      {
        relativeTo: this._activatedRoute,
        queryParams: EventUtil.buildEventListParams(this.eventListQuery),
      });
  }

  async filter() {
    this._router.navigate(
      [],
      {
        relativeTo: this._activatedRoute,
        queryParams: EventUtil.buildEventListParams(this.eventListQuery),
      });
  }

  private async _addEvent(event: IEvent) {
    try {
      if (this.events.findIndex(ev => ev.event_resource_id === event.event_resource_id) > -1) {
        const errMsg = `${event.event_resource_id} is already in the event list.`;
        this._toastrNotificationService.error(errMsg, `Error: New event`);
        console.error(errMsg);
        return;
      }

      if (this.cursorPrevious !== null) {
        return;
      }

      const eventDate = moment(event.time_utc);
      const idx = this.events.findIndex(ev => eventDate.isAfter(ev.time_utc));
      if (idx > -1) {
        this.events.splice(idx, 0, event);
      } else {
        this.events.push(event);
      }
      this._toastrNotificationService.success(`${event.event_resource_id}`, `New event`);
    } catch (err) {
      console.error(err);
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
  }

  onEventTypesChange($event: EventType[]) {
    this.selectedEventTypes = $event;
    this.eventListQuery.event_type = this.selectedEventTypes && this.selectedEventTypes.length > 0 ? this.selectedEventTypes.map((eventType: EventType) => eventType.quakeml_type) : undefined;
  }

  pageChange($event) {
    if ($event.pageIndex === 0) {
      delete this.eventListQuery.cursor;
    } else {
      let cursor = this.cursorNext;
      if ($event.previousPageIndex > $event.pageIndex) {
        cursor = this.cursorPrevious;
      }
      this.eventListQuery.cursor = cursor;
    }

    this._router.navigate(
      [],
      {
        relativeTo: this._activatedRoute,
        queryParams: EventUtil.buildEventListParams(this.eventListQuery),
      });
  }

  onCustomDateEndChange($event: Date) {
    this.eventListQuery.time_utc_before = moment($event).utc().utcOffset(this.timezone).endOf('day').toISOString(true);

  }
  onCustomDateStartChange($event: Date) {
    this.eventListQuery.time_utc_after = moment($event).utc().utcOffset(this.timezone).startOf('day').toISOString(true);
  }

  async openChart(event: IEvent) {
    const qp = await this._activatedRoute.queryParams.pipe(take(1)).toPromise();
    const queryParams = { ...qp };
    delete queryParams.cursor;
    delete queryParams.page_size;

    this._router.navigate(['/events', event.event_resource_id], {
      queryParams
    });
  }
}
