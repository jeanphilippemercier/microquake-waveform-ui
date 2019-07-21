import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import * as moment from 'moment';

import { IEvent } from '@app/core/interfaces/event.interface';
import { ActivatedRoute } from '@angular/router';
import { Subscription, Observable, BehaviorSubject } from 'rxjs';

import { EventApiService } from '@services/event-api.service';
import { Site, Network } from '@interfaces/site.interface';
import { MatDialog, MatDialogRef } from '@angular/material';
import { EventUpdateDialogComponent } from '@app/events/dialogs/event-update-dialog/event-update-dialog.component';

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
  selectedEventStatuses;
  days: Array<Array<IEvent>> = [];
  daysMap: any = {};
  today = moment().startOf('day');
  updateDialogRef: MatDialogRef<EventUpdateDialogComponent>;

  eventStartDate: Date = moment().startOf('day').subtract(7, 'days').toDate();
  eventEndDate: Date = moment().endOf('day').toDate();

  currentEvent: IEvent;
  currentEventChart: IEvent;

  initialized: BehaviorSubject<boolean> = new BehaviorSubject(false);

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
        this.currentEvent = await this._eventApiService.getEventById(eventId).toPromise();

        if (this.initialized.getValue() === false) {

          this.currentEventChart = { ...this.currentEvent };
          this.initialized.next(true);
        } else {

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
    const startTime = moment(this.eventStartDate).toISOString();
    const endTime = moment(this.eventEndDate).toISOString();

    this.events = await this._eventApiService.getEvents({
      site_code: this.site ? this.site.code : '',
      network_code: this.network ? this.network.code : '',
      start_time: startTime.toString(),
      end_time: endTime.toString()
    }).toPromise();

    // TODO: no order_by time_utc on api?
    this.events.sort((a, b) => (new Date(a.time_utc) > new Date(b.time_utc)) ? -1 : 1);

    this.events.forEach(event => {
      const day = moment(event.time_utc).utcOffset(event.timezone).startOf('day').toString();
      if (typeof this.daysMap[day] === 'undefined') {
        this.days.push([]);
        this.daysMap[day] = this.days.length - 1;
      }
      console.log(this.daysMap[day]);
      this.days[this.daysMap[day]].push(event);


    });

    console.log(this.days);

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
    this.currentEventChart = { ...event };
  }


  async openDialog() {
    if (this.updateDialogRef) {
      return;
    }
    const updateDialogRef = this._matDialog.open(EventUpdateDialogComponent, {
      hasBackdrop: true,
      width: '400px',
      data: {
        event: this.currentEvent
      }
    });
  }
}
