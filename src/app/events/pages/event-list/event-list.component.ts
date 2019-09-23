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

interface ViewerOptions {
  site?: string;
  network?: string;
}

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

  eventTypes: EventType[];
  selectedEventTypes: EventType[];

  evaluationStatuses: EvaluationStatus[];

  evaluationStatusGroups: EvaluationStatusGroup[];
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

  todayEnd = moment().utc().utcOffset(this.timezone).endOf('day').toDate();
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
    private _router: Router
  ) { }

  async ngOnInit() {

    this._ngxSpinnerService.show('loading', { fullScreen: true, bdColor: 'rgba(51,51,51,0.25)' });

    await Promise.all([
      await this._loadSites(),
      await this._loadEventTypesAndStatuses()
    ]);

    // default values
    this.selectedEventTypes = []; // this.eventTypes;
    this.selectedEvaluationStatusGroups = [EvaluationStatusGroup.ACCEPTED];

    this._ngxSpinnerService.hide('loading');

    this._activatedRoute.queryParams.subscribe(val => {
      console.log(`val`);
      console.log(val);
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


  private async _loadEventTypesAndStatuses() {
    this.eventTypes = await this._eventApiService.getMicroquakeEventTypes({ site_code: this.site.code }).toPromise();
    this.evaluationStatuses = Object.values(EvaluationStatus);
    this.evaluationStatusGroups = Object.values(EvaluationStatusGroup);
    this.eventEvaluationModes = Object.values(EvaluationMode);
  }

  private async _loadEvents() {
    // const startTime = moment(this.eventStartDate).toISOString();
    // const endTime = moment(this.eventEndDate).toISOString();
    // const eventListQuery: EventQuery = {
    //   page_size: 30,
    //   time_utc_after: startTime,
    //   time_utc_before: endTime,
    //   event_type: this.selectedEventTypes ? this.selectedEventTypes.map((eventType: EventType) => eventType.quakeml_type) : undefined,
    //   status: this.selectedEvaluationStatusGroups ? this.selectedEvaluationStatusGroups : undefined,
    // };

    // if (!this.eventListQuery) {
    //   const queryParams = this._activatedRoute.snapshot.queryParams;
    //   this.eventListQuery = EventUtil.buildEventListQuery(queryParams, this.timezone);
    //   this.numberOfChangesInFilter = EventUtil.getNumberOfChanges(this.eventListQuery);
    // }

    try {
      this._ngxSpinnerService.show('loading', { fullScreen: true, bdColor: 'rgba(51,51,51,0.25)' });
      const response = await this._eventApiService.getEvents(this.eventListQuery).toPromise();
      this.eventsCount = response.count;
      this.cursorPrevious = response.cursor_previous;
      this.cursorNext = response.cursor_next;
      this.events = response.results;
      this._ngxSpinnerService.hide('loading');
    } catch (err) {
      console.error(err);
    }

    this.dataSource = new MatTableDataSource(this.events);

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

  clearSelectionClicked(event) {
    this.site = null;
    this.network = null;
    this._saveOptions();
  }

  siteChanged($event: Site) {
    if ($event && $event.networks && $event.networks.length > 0) {
      this.networks = $event.networks;
    } else {
      this.networks = null;
    }
    this._saveOptions();
  }
  networkChanged($event) {
    this._saveOptions();
  }

  private _saveOptions() {
    const options: ViewerOptions = {};

    if (this.site) {
      options.site = this.site.code;
    }
    if (this.network) {
      options.network = this.network.code;
    }
    localStorage.setItem('viewer-options', JSON.stringify({ ...options }));
  }

  private async _loadSites() {
    this.sites = await this._inventoryApiService.getSites().toPromise();
    this.networks = null;

    const options: ViewerOptions = JSON.parse(localStorage.getItem('viewer-options'));

    if (options) {
      if (options.site) {
        this.site = this.sites.find(site => site.code === options.site);
        this.networks = this.site.networks;
      }
      if (options.network && this.site && this.site.networks) {
        this.network = this.site.networks.find(network => network.code === options.network);
      }
    }

    if (!this.site && this.sites && this.sites[0]) {
      this.site = this.sites[0];
      this.networks = this.site.networks;
    }

    if (!this.network && this.site && this.site.networks) {
      this.network = this.site.networks[0];
    }
  }

  private async _addEvent(event: IEvent) {

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
