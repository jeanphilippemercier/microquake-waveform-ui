import { Component, ViewChild, OnInit, AfterViewInit, OnDestroy } from '@angular/core';

import { EventsTreeComponent} from '@app/events/components/catalog-tree/events-tree.component';
import { MessageService } from '../../core/services/message.service';
import { Subscription } from 'rxjs/Subscription';
import { CatalogApiService } from '../../core/services/catalog-api.service';
import { environment } from '../../../environments/environment';
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
  public onChangeEvaluationStatus: Function;
  public onChangeEvaluationMode: Function;
  public onAcceptRejectEvent: Function;
  public onChangeEventType: Function;
  public onReprocessEvent: Function;
  public onViewLocations: Function;
  public toggleEventStatus: Function;
  public bEventUnsaved: Boolean;
  private saveEventTypeStatus: Function;
  private clearInteractiveResults: Function;
  private clearOrigin: Function;
  private timezone: string;
  public picksWarning: string;
  public tracesInfo: string;
  public eventHeader: string;
  public interactiveEventHeader: string;
  public eventTypes = [];
  public evalTypes = [
      {status: 'preliminary', eval_status: 'A', viewValue: 'Preliminary (Accepted)'},
      // {status: 'confirmed', eval_status: 'A', viewValue: 'Confirmed (Accepted)'},
      {status: 'reviewed', eval_status: 'A', viewValue: 'Reviewed (Accepted)'},
      {status: 'final', eval_status: 'A', viewValue: 'Final (Accepted)'},
      // {status: 'reported', eval_status: 'A', viewValue: 'Reported (Accepted)'},
      {status: 'rejected', eval_status: 'R', viewValue: 'Rejected (R)'}
  ];
  public evalModes = [
      {evaluation_mode: 'automatic', viewValue: 'Automatic'},
      {evaluation_mode: 'manual', viewValue: 'Manual'}
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
        this.origin.eval_status =  message.eval_status;
        this.origin.evaluation_mode = message.evaluation_mode;
        this.origin.status = message.status;
        this.origin.time_residual = message.time_residual ?  message.time_residual.toFixed(3) : '';
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

  constructor(private _catalogService: CatalogApiService, private messageService: MessageService) {
      this.subscription = this.messageService.getMessage().subscribe(message => {
        if (message.sender !== 'sidebar') {
          this.getNotification(message);
        }});
  }

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
    self.interactiveOrigin = {};
    self.timezone = '+00:00';

    this.menuItems = ROUTES.filter(menuItem => menuItem);

    this.onChangeEvaluationStatus = event => {
        if (self.origin.hasOwnProperty('status')) {
          self.origin.status = event.value;
        }
        if (self.origin.hasOwnProperty('evaluation_mode')) {
          self.origin.evaluation_mode = 'manual';
        }
        self.bEventUnsaved = true;
        $('#toggleSaveEventType').prop('disabled', false);
        $('#toggleSaveEventStatus').prop('disabled', false);
        $('#toggleSaveEventEvalMode').prop('disabled', false);
    };

    this.onChangeEventType = event => {
        if (self.origin.hasOwnProperty('type')) {
          self.origin.type = event.value;
        }
        if (self.origin.hasOwnProperty('evaluation_mode')) {
          self.origin.evaluation_mode = 'manual';
        }
        self.bEventUnsaved = true;
        $('#toggleSaveEventType').prop('disabled', false);
        $('#toggleSaveEventStatus').prop('disabled', false);
        $('#toggleSaveEventEvalMode').prop('disabled', false);
    };

    this.onChangeEvaluationMode = event => {
        if (self.origin.hasOwnProperty('evaluation_mode')) {
          self.origin.evaluation_mode = event.value;
        }
        self.bEventUnsaved = true;
        $('#toggleSaveEventType').prop('disabled', false);
        $('#toggleSaveEventStatus').prop('disabled', false);
        $('#toggleSaveEventEvalMode').prop('disabled', false);
    };


    $('#toggleSaveEventType').on('click', () => {
        self.saveEventTypeStatus();
    });

    $('#toggleSaveEventStatus').on('click', () => {
        self.saveEventTypeStatus();
    });

    $('#toggleSaveEventEvalMode').on('click', () => {
        self.saveEventTypeStatus();
    });

    this.toggleEventStatus = () => {
      if (self.origin.eval_status === 'A') {
        self.origin.eval_status = 'R';
        self.origin.status = 'rejected';
      } else if (self.origin.eval_status === 'R') {
        self.origin.eval_status = 'A';
        self.origin.status = 'final';
      }
    };

    this.onAcceptRejectEvent = value => {
      if (value === 'accept') {
        console.log(self.interactiveOrigin.preferred_origin_id);
        console.log(self.interactiveOrigin.data);
        // to be confirmed
        /*
        self._catalogService.update_partial_origin_by_id
            (self.interactiveOrigin.preferred_origin_id, self.interactiveOrigin.data)
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
    };

    this.clearInteractiveResults = () => {
          for (const property of Object.keys(self.interactiveOrigin)) {
              this.interactiveOrigin[property] = '';
          }
          this.interactiveEventHeader = '';
    };

    this.clearOrigin = () => {
      for (const property of Object.keys(this.origin)) {
          this.origin[property] = '';
      }
    };

    document.addEventListener('keydown', (e: any) => {
      if (e.keyCode === 82) {   // r, toggle event type automatic/manual
          self.toggleEventStatus();
      }
    });

    this.saveEventTypeStatus = () => {
        // if (window.confirm('Are you sure you want to update selected event ' + this.origin['time_local'] + '?')) {
            // change event in tree view (may not be selected one)
            self._catalogService.update_event_by_id
                (self.origin.event_resource_id, self.origin.status, self.origin.event_type, self.origin.evaluation_mode)
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

    this.onReprocessEvent = () => {
        if (self.origin.hasOwnProperty('event_resource_id')) {
          self._catalogService.get_reprocess_event_by_id
              (self.site, self.network, self.origin.event_resource_id)
              .subscribe((response) => {
                // window.alert('Reprocess event request sent!');
          },
          (error) => {
              window.alert('Error reprocessing event: ' + error.error.message);
          });
        }
    };

    /*
    this.onInteractiveProcess = () => {
        if (self.origin.hasOwnProperty('event_resource_id')) {
          const message = {
            sender: 'sidebar',
            action: 'interactive-process',
            event_resource_id: self.origin.event_resource_id
          };
          self.sendMessage(message);  // send message received from event tree to waveform component
        }
    };*/

    this.onViewLocations = () => {
      const arr = [this.origin.x, this.origin.y, this.origin.z,
        this.interactiveOrigin.x, this.interactiveOrigin.y, this.interactiveOrigin.z];
      const url = environment.url3dUi + '?locations=[' + arr.toString() + ']';
      const win = window.open(url, '_blank');
      win.focus();
    };

  }
}
