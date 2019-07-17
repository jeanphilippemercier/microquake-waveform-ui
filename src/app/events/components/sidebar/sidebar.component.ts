import { Component, ViewChild, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import * as moment from 'moment';
import { Subscription } from 'rxjs/Subscription';

import { MessageService } from '@services/message.service';
import { CatalogApiService } from '@services/catalog-api.service';
import { environment } from '@env/environment';
import { EventsTreeComponent } from '../catalog-tree/events-tree.component';

declare const $: any;

interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
}

export const ROUTES: RouteInfo[] = [
  { path: '/dashboard', title: 'Dashboard', icon: 'dashboard', class: '' },
  { path: '/user-profile', title: 'User Profile', icon: 'person', class: '' },
];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(EventsTreeComponent) eventsTreeReference;

  menuItems: any[];
  subscription: Subscription;
  public options: any;
  public window_height = window.innerHeight;
  public origin: any;
  public interactiveOrigin: any;
  public eventsTree: any;
  public eventsDatabase: any;
  public site: any;
  public network: any;
  public bEventUnsaved: boolean;
  private timezone: string;
  public picksWarning: string;
  public tracesInfo: string;
  public eventHeader: string;
  public interactiveEventHeader: string;
  public eventTypes = [];
  public evalTypes = [
    { status: 'preliminary', eval_status: 'A', viewValue: 'Preliminary (Accepted)' },
    // {status: 'confirmed', eval_status: 'A', viewValue: 'Confirmed (Accepted)'},
    { status: 'reviewed', eval_status: 'A', viewValue: 'Reviewed (Accepted)' },
    { status: 'final', eval_status: 'A', viewValue: 'Final (Accepted)' },
    // {status: 'reported', eval_status: 'A', viewValue: 'Reported (Accepted)'},
    { status: 'rejected', eval_status: 'R', viewValue: 'Rejected (R)' }
  ];
  public evalModes = [
    { evaluation_mode: 'automatic', viewValue: 'Automatic' },
    { evaluation_mode: 'manual', viewValue: 'Manual' }
  ];

  ngAfterViewInit() {
    this.eventsTree = this.eventsTreeReference.treeControl;
    this.eventsDatabase = this.eventsTreeReference.database;
  }

  ngOnDestroy() {
    // unsubscribe to ensure no memory leaks
    this.subscription.unsubscribe();
  }

  getNotification(message) {
    // to do: adapt for real messages from processing pipeline, this is for test only
    console.log(message);
    if (message.sender === 'notifier' && message.hasOwnProperty('reprocess')) {
      this.interactiveOrigin.event_resource_id = message.reprocess.event_resource_id;
      // this.interactiveOrigin.origin_resource_id = message.reprocess.origin_resource_id;
      this.interactiveOrigin.preferred_origin_id = this.origin.preferred_origin_id;
      // remove next lines
      message = {};
      message.x = this.origin.x + 100;
      message.y = this.origin.y + 100;
      message.z = this.origin.z + 100;
      message.time_local = this.origin.time_local + '.100';
      // remove previous lines
      this.interactiveOrigin.x = message.x;
      this.interactiveOrigin.y = message.y;
      this.interactiveOrigin.z = message.z;
      this.interactiveOrigin.time_local = message.time_local;
      this.interactiveEventHeader = ' Interactive Event: ' + this.interactiveOrigin.time_local;
      this.interactiveOrigin.data = message; // make sure this will store the new origin data
    } else if (message.sender === 'notifier' && message.hasOwnProperty('magnitude-reprocess')) {
      this.interactiveOrigin.magnitude = -0.99;
      // how to update magnitude?
    }
  }

  async getTreeNotification(message) {
    message.sender = 'sidebar';
    this.sendMessage(message);  // send message received from event tree to waveform component

    if (message.hasOwnProperty('init')) {
      this.eventTypes = message.init;
      return;
    }
    if (!message.hasOwnProperty('event_resource_id')) {
      this.clearInteractiveResults();
      this.clearOrigin();
      return;
    }
    if (message.hasOwnProperty('timezone')) {
      this.timezone = message.timezone;
    }
    if (message.hasOwnProperty('time_utc')) {
      console.log(message);
      this.clearInteractiveResults();
      this.tracesInfo = '';
      this.picksWarning = '';
      this.origin.data = message;
      this.origin.time_utc = message.time_utc;
      this.origin.time_local = moment(message.time_utc).utc().utcOffset(this.timezone).format('YYYY-MM-DD HH:mm:ss');
      this.origin.magnitude = message.magnitude && message.magnitude !== '-999.0' ?
        parseFloat(message.magnitude).toFixed(2) + ' (' + message.magnitude_type + ')' : '-';
      this.origin.x = message.x ? message.x : '';
      this.origin.y = message.y ? message.y : '';
      this.origin.z = message.z ? message.z : '';
      this.origin.npick = message.npick ? message.npick : '';
      this.origin.event_type = message.event_type;
      this.origin.type = message.type;
      this.origin.eval_status = message.eval_status;
      this.origin.evaluation_mode = message.evaluation_mode;
      this.origin.status = message.status;
      this.origin.time_residual = message.time_residual ? message.time_residual.toFixed(3) : '';
      // this.origin.time_residual = message.time_residual ?
      // (message.npick ? (parseFloat(message.time_residual) / parseInt(message.npick, 10)).toFixed(3) : '') : '';
      this.origin.uncertainty = message.uncertainty ? message.uncertainty : '';
      this.origin.event_resource_id = message.event_resource_id;
      this.origin.preferred_origin_id = message.preferred_origin_id;
      const fsec = message.time_utc.slice(-8, -1);
      this.eventHeader = ' Event: ' + this.site + '/' + this.network + ' ' +
        this.origin.time_local +
        parseFloat(fsec).toFixed(3).slice(-4) +
        moment().utc().utcOffset(this.timezone).format('Z');
    }
  }

  constructor(
    private _catalogService: CatalogApiService,
    private _messageService: MessageService
  ) {
    this.subscription = this._messageService.getMessage().subscribe(message => {
      if (message.sender !== 'sidebar') {
        this.getNotification(message);
      }
    });
  }

  sendMessage(message): void {
    // send message to subscribers via observable subject
    this._messageService.sendMessage(message);
  }

  clearMessage(): void {
    // clear message
    this._messageService.clearMessage();
  }

  ngOnInit() {

    this.options = JSON.parse(window.localStorage.getItem('viewer-options'));
    this.options = this.options ? this.options : {};

    this.site = this.options.hasOwnProperty('site') ? this.options.site : '';
    this.network = this.options.hasOwnProperty('network') ? this.options.network : '';
    this.origin = {};
    this.interactiveOrigin = {};
    this.timezone = '+00:00';

    this.menuItems = ROUTES.filter(menuItem => menuItem);

    document.addEventListener('keydown', (e: any) => {
      if (e.keyCode === 82) {   // r, toggle event type automatic/manual
        this.toggleEventStatus();
      }
    });

  }


  onChangeEvaluationStatus(event) {
    if (this.origin.hasOwnProperty('status')) {
      this.origin.status = event.value;
    }
    if (this.origin.hasOwnProperty('evaluation_mode')) {
      this.origin.evaluation_mode = 'manual';
    }
    this.bEventUnsaved = true;
    $('#toggleSaveEventType').prop('disabled', false);
    $('#toggleSaveEventStatus').prop('disabled', false);
    $('#toggleSaveEventEvalMode').prop('disabled', false);
  }

  onChangeEventType(event) {
    if (this.origin.hasOwnProperty('type')) {
      this.origin.type = event.value;
    }
    if (this.origin.hasOwnProperty('evaluation_mode')) {
      this.origin.evaluation_mode = 'manual';
    }
    this.bEventUnsaved = true;
    $('#toggleSaveEventType').prop('disabled', false);
    $('#toggleSaveEventStatus').prop('disabled', false);
    $('#toggleSaveEventEvalMode').prop('disabled', false);
  }

  onChangeEvaluationMode(event) {
    if (this.origin.hasOwnProperty('evaluation_mode')) {
      this.origin.evaluation_mode = event.value;
    }
    this.bEventUnsaved = true;
    $('#toggleSaveEventType').prop('disabled', false);
    $('#toggleSaveEventStatus').prop('disabled', false);
    $('#toggleSaveEventEvalMode').prop('disabled', false);
  }


  toggleEventStatus() {
    if (this.origin.eval_status === 'A') {
      this.origin.eval_status = 'R';
      this.origin.status = 'rejected';
    } else if (this.origin.eval_status === 'R') {
      this.origin.eval_status = 'A';
      this.origin.status = 'final';
    }
  }


  onAcceptRejectEvent(value) {
    if (value === 'accept') {
      console.log(this.interactiveOrigin.preferred_origin_id);
      console.log(this.interactiveOrigin.data);
      // to be confirmed
      /*
      this._catalogService.update_partial_origin_by_id
          (this.interactiveOrigin.preferred_origin_id, this.interactiveOrigin.data)
          .subscribe((response) => {
              console.log(response);
      },
      (error) => {
          window.alert('Error updating event: ' + error.error.message);
      });
      */
    } else if (value === 'reject') {
      this.clearInteractiveResults();
    }
  }

  clearInteractiveResults() {
    for (const property of Object.keys(this.interactiveOrigin)) {
      this.interactiveOrigin[property] = '';
    }
    this.interactiveEventHeader = '';
  }

  clearOrigin() {
    for (const property of Object.keys(this.origin)) {
      this.origin[property] = '';
    }
  }

  saveEventTypeStatus() {
    // if (window.confirm('Are you sure you want to update selected event ' + this.origin['time_local'] + '?')) {
    // change event in tree view (may not be selected one)
    this._catalogService.update_event_by_id
      (this.origin.event_resource_id, this.origin.status, this.origin.event_type, this.origin.evaluation_mode)
      .subscribe((response) => {
        this.eventsDatabase.updateEventsTree(response, this.eventsTree);
        this.eventsTreeReference.activeEvent();
        this.bEventUnsaved = false;
        $('#toggleSaveEvent').prop('disabled', true);
      },
        (error) => {
          window.alert('Error updating event: ' + error.error.message);
        });
    // }
  }

  onReprocessEvent() {
    if (this.origin.hasOwnProperty('event_resource_id')) {
      this._catalogService.get_reprocess_event_by_id
        (this.site, this.network, this.origin.event_resource_id)
        .subscribe((response) => {
          // window.alert('Reprocess event request sent!');
        },
          (error) => {
            window.alert('Error reprocessing event: ' + error.error.message);
          });
    }
  }

  /*
  onInteractiveProcess() {
      if (this.origin.hasOwnProperty('event_resource_id')) {
        const message = {
          sender: 'sidebar',
          action: 'interactive-process',
          event_resource_id: this.origin.event_resource_id
        };
        this.sendMessage(message);  // send message received from event tree to waveform component
      }
  }
  */

  onViewLocations() {
    const arr = [this.origin.x, this.origin.y, this.origin.z,
    this.interactiveOrigin.x, this.interactiveOrigin.y, this.interactiveOrigin.z];
    const url = environment.url3dUi + '?locations=[' + arr.toString() + ']';
    const win = window.open(url, '_blank');
    win.focus();
  }
}
