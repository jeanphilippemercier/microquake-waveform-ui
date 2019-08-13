import { Component, OnInit } from '@angular/core';
import { MatTableDataSource, MatDialogRef, MatDialog } from '@angular/material';
import * as moment from 'moment';
import { first } from 'rxjs/operators';

import { EventUpdateDialog } from '@interfaces/dialogs.interface';
import { Site, Network } from '@interfaces/inventory.interface';
import { EventType, EvaluationStatus, IEvent, EvaluationMode } from '@interfaces/event.interface';
import { EventApiService } from '@services/event-api.service';
import { CatalogApiService } from '@services/catalog-api.service';
import { EventUpdateDialogComponent } from '@app/events/dialogs/event-update-dialog/event-update-dialog.component';
import { EventUpdateInput } from '@interfaces/event-dto.interface';

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
  selectedEvaluationStatuses: EvaluationStatus[];
  eventEvaluationModes: EvaluationMode[];

  eventStartDate: Date = moment().startOf('day').subtract(5, 'days').toDate();
  eventEndDate: Date = moment().endOf('day').toDate();

  displayedColumns: string[] = ['date', 'time', 'magnitude', 'status', 'type', 'mode', 'actions'];
  dataSource: MatTableDataSource<any>;

  events: any; // TODO: typings

  eventUpdateDialogRef: MatDialogRef<EventUpdateDialogComponent, EventUpdateDialog>;
  eventUpdateDialogOpened = false;

  constructor(
    private _catalogApiService: CatalogApiService,
    private _matDialog: MatDialog,
    private _eventApiService: EventApiService
  ) { }

  async ngOnInit() {
    await this._loadSites();
    await this._loadEventTypesAndStatuses();

    // default values
    this.selectedEventTypes = this.eventTypes;
    this.selectedEvaluationStatuses = [EvaluationStatus.REVIEWED];

    await this._loadEvents();
  }

  private async _loadEventTypesAndStatuses() {
    this.eventTypes = await this._catalogApiService.get_microquake_event_types(this.site).toPromise();
    this.evaluationStatuses = Object.values(EvaluationStatus);
    this.eventEvaluationModes = Object.values(EvaluationMode);
  }

  private async _loadEvents() {
    const startTime = moment(this.eventStartDate).toISOString();
    const endTime = moment(this.eventEndDate).toISOString();

    this.events = await this._catalogApiService.get_events(
      this.site ? this.site.code : '',
      this.network ? this.network.code : '',
      startTime,
      endTime,
      null,
      // this.selectedEventTypes ? this.selectedEventTypes.map((eventType: EventType) => eventType.id).toString() : '',
      this.selectedEvaluationStatuses ? this.selectedEvaluationStatuses.toString() : ''
    ).toPromise();

    // TODO: no order_by time_utc on api?
    this.events.sort((a, b) => (new Date(a.time_utc) > new Date(b.time_utc)) ? -1 : 1);

    this.dataSource = new MatTableDataSource(this.events);

  }

  filter() {
    this._loadEvents();
  }

  clearSelectionClicked(event) {
    this.site = null;
    this.network = null;
    this._saveOptions();
  }

  siteChanged($event: Site) {
    console.log($event);

    if ($event && $event.networks && $event.networks.length > 0) {
      this.networks = $event.networks;
    } else {
      this.networks = null;
    }
    this._saveOptions();
  }
  networkChanged($event) {
    console.log($event);
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
    this.sites = await this._catalogApiService.get_sites().toPromise();
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
  }

}
