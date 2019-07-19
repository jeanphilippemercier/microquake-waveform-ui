import { Component, OnInit } from '@angular/core';
import { CatalogApiService } from '@app/core/services/catalog-api.service';
import { Site, Network } from '@app/core/interfaces/site.interface';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { EventType, EventStatus } from '@app/core/interfaces/event.interface';
import * as moment from 'moment';
import { MatTableDataSource } from '@angular/material';

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

  eventTypes: EventType[];
  selectedEventTypes: EventType[];

  eventStatuses: EventStatus[];
  selectedEventStatuses: EventStatus[];

  eventStartDate: Date = moment().startOf('day').subtract(5, 'days').toDate();
  eventEndDate: Date = moment().endOf('day').toDate();

  displayedColumns: string[] = ['date', 'time', 'magnitude', 'status', 'type', 'mode', 'location', 'actions'];
  dataSource: MatTableDataSource<any>;

  events: any; // TODO: typings

  constructor(
    private _catalogApiService: CatalogApiService,
    private _router: Router
  ) { }

  async ngOnInit() {
    await this._loadSites();
    await this._loadEventTypesAndStatuses();

    // default values
    this.selectedEventTypes = this.eventTypes;
    this.selectedEventStatuses = [EventStatus.ACCEPTED];

    await this._loadEvents();
  }

  private async _loadEventTypesAndStatuses() {
    this.eventTypes = await this._catalogApiService.get_microquake_event_types(this.site).toPromise();
    this.eventStatuses = Object.values(EventStatus);
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
      this.selectedEventStatuses ? this.selectedEventStatuses.toString() : ''
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

  siteNetworkChanged(event) {
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
    const options: ViewerOptions = JSON.parse(localStorage.getItem('viewer-options'));

    if (options) {
      if (options.site) {
        this.site = this.sites.find(site => site.code === options.site);
      }
      if (options.network && this.site && this.site.networks) {
        this.network = this.site.networks.find(network => network.code === options.network);
      }
    }
  }

}
