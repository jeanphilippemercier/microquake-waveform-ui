import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventsTreeComponent} from '../../catalog-tree/events-tree.component';
import { MessageService } from '../../message.service';
import { CatalogApiService } from '../../catalog-api.service';
import * as moment from 'moment';

declare const $: any;
declare interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
}
export const ROUTES: RouteInfo[] = [
  { path: '/dashboard', title: 'Dashboard',  icon: 'dashboard', class: '' },
  { path: '/user-profile', title: 'User Profile',  icon: 'person', class: '' },
];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, AfterViewInit {
  @ViewChild(EventsTreeComponent) eventsTreeReference;

  menuItems: any[];
  public options: any;
  public window_height = window.innerHeight;
  public origin: any;
  public eventsTree: any;
  public eventsDatabase: any;
  public site: any;
  public network: any;
  public onChangeEvaluationStatus: Function;
  public onChangeEventType: Function;
  public bEventUnsaved: Boolean;
  private saveEventTypeStatus: Function;
  private timezone: string;
  public picksWarning: string;
  public tracesInfo: string;
  public eventHeader: string;
  public eventTypes = [];
  public evalTypes = [
      {status: 'preliminary', eval_status: 'A', viewValue: 'Preliminary (Accepted)'},
      {status: 'confirmed', eval_status: 'A', viewValue: 'Confirmed (Accepted)'},
      {status: 'reviewed', eval_status: 'A', viewValue: 'Reviewed (Accepted)'},
      {status: 'final', eval_status: 'A', viewValue: 'Final (Accepted)'},
      {status: 'reported', eval_status: 'A', viewValue: 'Reported (Accepted)'},
      {status: 'rejected', eval_status: 'R', viewValue: 'Rejected (R)'}
  ];

    ngAfterViewInit() {
        this.eventsTree = this.eventsTreeReference.treeControl;
        this.eventsDatabase = this.eventsTreeReference.database;
    }


  async getNotification(message) {
      this.sendMessage(message);

      if (message.hasOwnProperty('init')) {
          this.eventTypes = message.init;
          return;
      }
      if (!message.hasOwnProperty('event_resource_id')) {
          for (const property of Object.keys(this.origin)) {
              this.origin[property] = '';
          }
          return;
      }
      if (message.hasOwnProperty('timezone')) {
          this.timezone = message.timezone;
      }
      if (message.hasOwnProperty('time_utc')) {
          this.tracesInfo = '';
          this.picksWarning = '';
          this.origin.time_utc = message.time_utc;
          this.origin.time_local = moment(message.time_utc).utc().utcOffset(this.timezone).format('YYYY-MM-DD HH:mm:ss');
          this.origin.magnitude = message.magnitude ?
              parseFloat(message.magnitude).toFixed(2) + ' (' + message.magnitude_type + ')' : '';
          this.origin.x = message.x ? message.x : '';
          this.origin.y = message.y ? message.y : '';
          this.origin.z = message.z ? message.z : '';
          this.origin.npick = message.npick ? message.npick : '';
          this.origin.event_type = message.event_type;
          this.origin.type = message.type;
          this.origin.eval_status =  message.eval_status;
          this.origin.mode = message.evaluation_mode ?
              message.evaluation_mode[0].toUpperCase() + message.evaluation_mode.substr(1).toLowerCase() : '';
          this.origin.status = message.status;
          this.origin.time_residual = message.time_residual ? message.time_residual : '';
          this.origin.uncertainty = message.uncertainty ? message.uncertainty : '';
          this.origin.event_resource_id = message.event_resource_id;
          this.origin.preferred_origin_id = message.preferred_origin_id;
          const fsec = message.time_utc.slice(-8, -1);
          this.eventHeader = ' Event: ' + this.site + '/' + this.network + ' ' +
              this.origin['time_local'] +
              parseFloat(fsec).toFixed(3).slice(-4) +
              moment().utc().utcOffset(this.timezone).format('Z');
      }
    }


  constructor(private _catalogService: CatalogApiService, private messageService: MessageService) { }

  sendMessage(message): void {
      // send message to subscribers via observable subject
      this.messageService.sendMessage(message);
  }

  clearMessage(): void {
      // clear message
      this.messageService.clearMessage();
  }

  ngOnInit() {

    const self = this;
    self.options = JSON.parse(window.localStorage.getItem('viewer-options'));
    self.options = self.options ? self.options : {};

    self.site = self.options.hasOwnProperty('site') ? self.options.site : '';
    self.network = self.options.hasOwnProperty('network') ? self.options.network : '';
    self.origin = {};
    self.timezone = '+00:00';

    this.menuItems = ROUTES.filter(menuItem => menuItem);

    this.onChangeEvaluationStatus = event => {
        if (self.origin.hasOwnProperty('status')) {
          self.origin.status = event.value;
        }
        self.bEventUnsaved = true;
        $('#toggleSaveEventType').prop('disabled', false);
        $('#toggleSaveEventStatus').prop('disabled', false);
    };

    this.onChangeEventType = event => {
        if (self.origin.hasOwnProperty('type')) {
          self.origin.type = event.value;
        }
        self.bEventUnsaved = true;
        $('#toggleSaveEventType').prop('disabled', false);
        $('#toggleSaveEventStatus').prop('disabled', false);
    };

    $('#toggleSaveEventType').on('click', () => {
        self.saveEventTypeStatus();
    });

    $('#toggleSaveEventStatus').on('click', () => {
        self.saveEventTypeStatus();
    });

    this.saveEventTypeStatus = () => {
        // if (window.confirm('Are you sure you want to update selected event ' + this.origin['time_local'] + '?')) {
            // change event in tree view (may not be selected one)
            self._catalogService.update_event_by_id
                (self.origin.event_resource_id, self.origin.status, self.origin.event_type)
                .subscribe((response) => {
                self.eventsDatabase.updateEventsTree(response, self.eventsTree);
                self.eventsTreeReference.activeEvent();
                self.bEventUnsaved = false;
                $('#toggleSaveEvent').prop('disabled', true);
            },
            (error) => {
                window.alert('Error updating event: ' + error.error.message);
            });
        // }
    };
  }
}
