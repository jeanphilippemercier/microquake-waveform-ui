import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';
import { first } from 'rxjs/operators';

import { EventUpdateDialog } from '@interfaces/dialogs.interface';
import { Site, Network } from '@interfaces/inventory.interface';
import { EventType, EvaluationStatus, IEvent, EvaluationMode, EvaluationStatusGroup } from '@interfaces/event.interface';
import { EventApiService } from '@services/event-api.service';
import { EventUpdateDialogComponent } from '@app/events/dialogs/event-update-dialog/event-update-dialog.component';
import { EventUpdateInput } from '@interfaces/event-dto.interface';
import { EventQuery } from '@interfaces/event-query.interface';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxSpinnerService } from 'ngx-spinner';

interface ViewerOptions {
  site?: string;
  network?: string;
}

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss']
})
export class EventListComponent implements OnInit {

  sites: Site[];
  site: Site;
  network: Network;
  networks: Network[];

  eventTypes: EventType[];
  selectedEventTypes: EventType[];

  evaluationStatuses: EvaluationStatus[];

  evaluationStatusGroups: EvaluationStatusGroup[];
  selectedEvaluationStatusGroups: EvaluationStatusGroup[];


  eventEvaluationModes: EvaluationMode[];

  eventStartDate: Date = moment().startOf('day').subtract(15, 'days').toDate();
  eventEndDate: Date = moment().endOf('day').toDate();

  displayedColumns: string[] = ['date', 'time', 'magnitude', 'status', 'type', 'mode', 'actions'];
  dataSource: MatTableDataSource<any>;

  events: IEvent[];

  eventUpdateDialogRef: MatDialogRef<EventUpdateDialogComponent, EventUpdateDialog>;
  eventUpdateDialogOpened = false;

  constructor(
    private _matDialog: MatDialog,
    private _eventApiService: EventApiService,
    private _inventoryApiService: InventoryApiService,
    private _ngxSpinnerService: NgxSpinnerService
  ) { }

  async ngOnInit() {

    this._ngxSpinnerService.show('loading', { fullScreen: true, bdColor: 'rgba(51,51,51,0.25)' });

    await Promise.all([
      await this._loadSites(),
      await this._loadEventTypesAndStatuses()
    ]);

    // default values
    this.selectedEventTypes = this.eventTypes;
    this.selectedEvaluationStatusGroups = [EvaluationStatusGroup.ACCEPTED];

    await this._loadEvents();
    this._ngxSpinnerService.hide('loading');
  }

  private async _loadEventTypesAndStatuses() {
    this.eventTypes = await this._eventApiService.getMicroquakeEventTypes({ site_code: this.site.code }).toPromise();
    this.evaluationStatuses = Object.values(EvaluationStatus);
    this.evaluationStatusGroups = Object.values(EvaluationStatusGroup);
    this.eventEvaluationModes = Object.values(EvaluationMode);
  }

  private async _loadEvents() {
    const startTime = moment(this.eventStartDate).toISOString();
    const endTime = moment(this.eventEndDate).toISOString();
    const eventListQuery: EventQuery = {
      time_utc_after: startTime,
      time_utc_before: endTime,
      event_type: this.selectedEventTypes ? this.selectedEventTypes.map((eventType: EventType) => eventType.quakeml_type) : undefined,
      status: this.selectedEvaluationStatusGroups ? this.selectedEvaluationStatusGroups : undefined,
    };

    const response = await this._eventApiService.getEvents(eventListQuery).toPromise();
    this.events = response.results;

    // TODO: no order_by time_utc on api?
    this.events.sort((a, b) => (new Date(a.time_utc) > new Date(b.time_utc)) ? -1 : 1);

    this.dataSource = new MatTableDataSource(this.events);

  }

  async filter() {
    this._ngxSpinnerService.show('loading', { fullScreen: true, bdColor: 'rgba(51,51,51,0.25)' });
    await this._loadEvents();
    this._ngxSpinnerService.hide('loading');
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

  async openEventUpdateDialog($event: IEvent) {
    if (this.eventUpdateDialogRef || this.eventUpdateDialogOpened) {
      return;
    }
    this.eventUpdateDialogOpened = true;

    this.eventUpdateDialogRef = this._matDialog.open<EventUpdateDialogComponent, EventUpdateDialog>(EventUpdateDialogComponent, {
      hasBackdrop: true,
      width: '600px',
      data: {
        event: $event,
        evaluationStatuses: this.evaluationStatuses,
        eventTypes: this.eventTypes,
        eventEvaluationModes: this.eventEvaluationModes,
        mode: 'updateDialog'
      }
    });

    const updateDialogSaveSub = this.eventUpdateDialogRef.componentInstance.onSave.subscribe(async (data: EventUpdateInput) => {
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


    const updateDialogAcceptSub = this.eventUpdateDialogRef.componentInstance.onAcceptClicked.subscribe(async (data: EventType) => {
      this.eventUpdateDialogRef.componentInstance.loading = true;
      this._ngxSpinnerService.show('loadingEventUpdate', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });

      if (await this.onAcceptClick($event.event_resource_id, data)) {
        this.eventUpdateDialogRef.close();
      }

      this.eventUpdateDialogRef.componentInstance.loading = false;
      this._ngxSpinnerService.hide('loadingEventUpdate');
    });

    const updateDialogRejectSub = this.eventUpdateDialogRef.componentInstance.onRejectClicked.subscribe(async (data: EventType) => {
      this.eventUpdateDialogRef.componentInstance.loading = true;
      this._ngxSpinnerService.show('loadingEventUpdate', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });

      if (await this.onDeclineClick($event.event_resource_id, data)) {
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
  }


  async onAcceptClick(eventId: string, $event: EventType): Promise<boolean> {
    let repsonse = true;
    try {
      const eventUpdateInput: EventUpdateInput = {
        event_type: $event.quakeml_type,
        evaluation_mode: EvaluationMode.MANUAL,
        // this.currentEvent.event_type !== $event.quakeml_type ? EvaluationMode.MANUAL : EvaluationMode.AUTOMATIC,
        status: EvaluationStatus.CONFIRMED
      };
      const result = await this._eventApiService.updateEventById(eventId, eventUpdateInput).toPromise();
      this._updateEvent(result);
    } catch (err) {
      repsonse = false;
      console.error(err);
    }

    return repsonse;
  }

  async onDeclineClick(eventId: string, $event: EventType): Promise<boolean> {
    let repsonse = true;
    try {
      const eventUpdateInput: EventUpdateInput = {
        event_type: $event.quakeml_type,
        evaluation_mode: EvaluationMode.MANUAL,
        status: EvaluationStatus.REJECTED
      };
      const result = await this._eventApiService.updateEventById(eventId, eventUpdateInput).toPromise();
      this._updateEvent(result);
    } catch (err) {
      repsonse = false;
      console.error(err);
    }

    return repsonse;
  }

}
