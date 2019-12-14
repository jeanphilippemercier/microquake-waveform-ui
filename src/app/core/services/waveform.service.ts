import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, ReplaySubject, Subscription, forkJoin, interval } from 'rxjs';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { first, take, skipWhile } from 'rxjs/operators';
import * as moment from 'moment';

import { EventHelpDialogComponent } from '@app/shared/dialogs/event-help-dialog/event-help-dialog.component';
import { globals } from '@src/globals';
import { IEvent, EventBatchMap, EvaluationStatusGroup, EvaluationStatus, EvaluationMode, EventType, PickingMode, } from '@interfaces/event.interface';
import { ToastrNotificationService } from './toastr-notification.service';
import { EventApiService } from './api/event-api.service';
import { EventInteractiveProcessingDialogComponent } from '@app/shared/dialogs/event-interactive-processing-dialog/event-interactive-processing-dialog.component';
import { EventInteractiveProcessingDialog, EventUpdateDialog, EventFilterDialogData, ConfirmationDialogData, EventWaveformFilterDialogData } from '@interfaces/dialogs.interface';
import { EventUpdateDialogComponent } from '@app/shared/dialogs/event-update-dialog/event-update-dialog.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { EventUpdateInput } from '@interfaces/event-dto.interface';
import { EventQuery } from '@interfaces/event-query.interface';
import { EventFilterDialogComponent } from '@app/shared/dialogs/event-filter-dialog/event-filter-dialog.component';
import EventUtil from '@core/utils/event-util';
import { Router, ActivatedRoute } from '@angular/router';
import { InventoryApiService } from './api/inventory-api.service';
import { Site, Network, Station, Sensor, Heartbeat, HeartbeatStatus } from '@interfaces/inventory.interface';
import { EventQuakemlToMicroquakeTypePipe } from '@app/shared/pipes/event-quakeml-to-microquake-type.pipe';
import { ConfirmationDialogComponent } from '@app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { EventWaveformFilterDialogComponent } from '@app/shared/dialogs/event-waveform-filter-dialog/event-waveform-filter-dialog.component';
import { ApiService } from './api/api.service';
import { WebsocketResponseType, WebsocketResponseOperation } from '@interfaces/core.interface';

const HEARTBEAT_NAME = `event_connector`;
@Injectable({
  providedIn: 'root'
})
export class WaveformService implements OnDestroy {

  currentEvent: BehaviorSubject<IEvent | null> = new BehaviorSubject<IEvent | null>(null);

  commonTimeScale: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  commonAmplitudeScale: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  zoomAll: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  displayComposite: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  displayRotated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  displayDistanceTime: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  predictedPicks: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  predictedPicksBias: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  batchPicks: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  batchPicksDisabled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  pickingMode: BehaviorSubject<PickingMode | null> = new BehaviorSubject<PickingMode | null>(null);
  loadedAll: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  undoLastZoomOrPanClicked: Subject<void> = new Subject;
  undoLastZoomOrPanClickedObs: Observable<void> = this.undoLastZoomOrPanClicked.asObservable();
  resetAllChartsViewClicked: Subject<void> = new Subject;
  resetAllChartsViewClickedObs: Observable<void> = this.resetAllChartsViewClicked.asObservable();
  undoLastPickingClicked: Subject<void> = new Subject;
  undoLastPickingClickedObs: Observable<void> = this.undoLastPickingClicked.asObservable();
  interactiveProcessClicked: Subject<void> = new Subject;
  interactiveProcessClickedObs: Observable<void> = this.interactiveProcessClicked.asObservable();

  // FILTER
  lowFreqCorner: BehaviorSubject<number> = new BehaviorSubject(globals.lowFreqCorner);
  highFreqCorner: BehaviorSubject<number> = new BehaviorSubject(globals.highFreqCorner);
  numPoles: BehaviorSubject<number> = new BehaviorSubject(globals.numPoles);
  applyFilterClicked: Subject<void> = new Subject;
  applyFilterClickedObs: Observable<void> = this.applyFilterClicked.asObservable();

  // PAGINATION
  pageChanged: Subject<number> = new Subject;
  pageChangedObs: Observable<number> = this.pageChanged.asObservable();

  helpDialogRef!: MatDialogRef<EventHelpDialogComponent>;
  helpDialogOpened = false;

  batchPicksDialogRef!: MatDialogRef<ConfirmationDialogComponent>;
  batchPicksDialogOpened = false;

  site: BehaviorSubject<string> = new BehaviorSubject('');
  network: BehaviorSubject<string> = new BehaviorSubject('');

  loadedSensors: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  loadedSensorsAll: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  options: any = {};
  sidebarOpened: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  pageSize: BehaviorSubject<number> = new BehaviorSubject(globals.chartsPerPage);
  currentPage: BehaviorSubject<number> = new BehaviorSubject(1);
  maxPages: BehaviorSubject<number> = new BehaviorSubject(globals.max_num_pages);
  loadedPages: BehaviorSubject<number> = new BehaviorSubject(0);

  loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  interactiveProcessLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  waveformComponentInitialized: ReplaySubject<boolean> = new ReplaySubject(1);
  waveformComponentInitializedObs: Observable<boolean> = this.waveformComponentInitialized.asObservable();

  interactiveProcessingEnabled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  interactiveProcessActiveList: BehaviorSubject<EventBatchMap[]> = new BehaviorSubject<EventBatchMap[]>([]);
  interactiveProcessCurrentList: BehaviorSubject<EventBatchMap[]> = new BehaviorSubject<EventBatchMap[]>([]);

  onServerEventSub!: Subscription;

  wsEventUpdated: Subject<IEvent> = new Subject;
  wsEventUpdatedObs: Observable<IEvent> = this.wsEventUpdated.asObservable();

  wsEventCreated: Subject<IEvent> = new Subject;
  wsEventCreatedObs: Observable<IEvent> = this.wsEventCreated.asObservable();

  eventUpdateDialogOpened = false;
  loadingCurrentEventAndList = false;
  eventUpdateDialogRef!: MatDialogRef<EventUpdateDialogComponent, EventUpdateDialog>;
  eventInteractiveProcessDialogRef!: MatDialogRef<EventInteractiveProcessingDialogComponent, EventInteractiveProcessingDialog>;

  eventFilterDialogOpened = false;
  eventFilterDialogRef!: MatDialogRef<EventFilterDialogComponent, EventFilterDialogData>;

  eventWaveformFilterDialogOpened = false;
  eventWaveformFilterDialogRef!: MatDialogRef<EventWaveformFilterDialogComponent>;

  eventTypes: EventType[] = [];
  evaluationStatuses = Object.values(EvaluationStatus);
  evaluationStatusGroups = Object.values(EvaluationStatusGroup);
  eventEvaluationModes = Object.values(EvaluationMode);

  numberOfChangesInFilter = 0;
  eventListQuery!: EventQuery;

  allSensorsOrig: Sensor[] = [];
  allStations: Station[] = [];

  allSensorsMap: { [key: string]: number } = {};
  allStationsMap: { [key: number]: number } = {};

  initializedPrimary: ReplaySubject<boolean> = new ReplaySubject(1);
  initializedPrimaryObs: Observable<boolean> = this.initializedPrimary.asObservable();

  initializedSecondary: ReplaySubject<boolean> = new ReplaySubject(1);
  initializedSecondaryObs: Observable<boolean> = this.initializedSecondary.asObservable();

  heartbeat: BehaviorSubject<Heartbeat | null> = new BehaviorSubject<Heartbeat | null>(null);
  heartbeatStatus: BehaviorSubject<HeartbeatStatus> = new BehaviorSubject<HeartbeatStatus>(HeartbeatStatus.INACTIVE);
  lastHeard: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  heartbeatIntervalSub!: Subscription;
  // in miliseconds
  heartbeatCheckTimeout = 5000;
  // in seconds
  pendingTimeout = 5 * 60;
  inactiveTimeout = 15 * 60;
  websocketReinitTimeout = 30;

  public set currentSite(v: Site) {
    this._currentSite = v;
    if (this._currentSite && this._currentSite.timezone) {
      this.timezone = this._currentSite.timezone;
    }
  }
  public get currentSite(): Site {
    return this._currentSite;
  }
  private _currentSite!: Site;

  currentNetwork!: Network;
  // TODO: fix when resolved on API
  timezone = '+08:00';

  sites: Site[] = [];
  networks: Network[] = [];


  constructor(
    private _matDialog: MatDialog,
    private _toastrNotificationService: ToastrNotificationService,
    private _apiService: ApiService,
    private _eventApiService: EventApiService,
    private _inventoryApiService: InventoryApiService,
    private _ngxSpinnerService: NgxSpinnerService,
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    private _eventQuakemlToMicroquakeTypePipe: EventQuakemlToMicroquakeTypePipe,
  ) {
    this._initPrimary();
    this._initSecondary();
  }

  ngOnDestroy() {
    if (this.onServerEventSub) {
      this.onServerEventSub.unsubscribe();
      delete this.onServerEventSub;
    }

    if (this.heartbeatIntervalSub) {
      this.heartbeatIntervalSub.unsubscribe();
      delete this.heartbeatIntervalSub;
    }
  }

  public isInitialized(): Promise<void> {
    return new Promise(resolve => {
      forkJoin([
        this.isInitializedPrimary(),
        this.isInitializedSecondary()
      ]).subscribe(val => resolve());
    });
  }

  public isInitializedPrimary(): Promise<void> {
    return new Promise(resolve => {
      this.initializedPrimary.pipe(
        skipWhile(val => val !== true),
        take(1)
      ).subscribe(val => resolve());
    });
  }

  public isInitializedSecondary(): Promise<void> {
    return new Promise(resolve => {
      this.initializedSecondary.pipe(
        skipWhile(val => val !== true),
        take(1)
      ).subscribe(val => resolve());
    });
  }

  private async _initPrimary() {
    await Promise.all([
      this._loadPersistantData(),
      this._watchWebsocketNotifications(),
      this._loadEventTypes(),
      this._getAllSitesAndNetworks(),
      this._getLastHeartbeatAndWatch()
    ]);

    this.initializedPrimary.next(true);
  }

  private async _initSecondary() {
    await Promise.all([
      this._loadAllSensors(),
      this._loadAllStations()
    ]);

    this.initializedSecondary.next(true);
  }

  private async _loadEventTypes() {
    // TODO: add real site code from site picker
    this.eventTypes = await this._inventoryApiService.getMicroquakeEventTypes().toPromise();
  }

  private async _getLastHeartbeatAndWatch() {
    try {
      const response = await this._inventoryApiService.getHeartbeat(HEARTBEAT_NAME).toPromise();
      this.heartbeat.next(response);
      this.checkHeartbeat();
    } catch (err) {
      console.error(err);
    }

    this.heartbeatIntervalSub = interval(this.heartbeatCheckTimeout).subscribe(_ => {
      this.checkHeartbeat();
    });
  }

  private async _getAllSitesAndNetworks() {
    try {
      const response = await this._inventoryApiService.getSites().toPromise();
      this.sites = response;
      this.networks = [];
      this.sites.map(site => {
        this.networks = [...this.networks, ...site.networks];
      });

      this.currentSite = this.sites[0];
      this.currentNetwork = this.sites[0] && this.sites[0].networks && this.sites[0].networks[0];
    } catch (err) {
      console.error(err);
    }
  }

  private _loadPersistantData() {
    const data = window.localStorage.getItem('viewer-options');
    this.options = data ? JSON.parse(data) : {};
    this.numPoles.next(this.options.numPoles ? this.options.numPoles : globals.numPoles);
    this.lowFreqCorner.next(this.options.lowFreqCorner ? this.options.lowFreqCorner : globals.lowFreqCorner);
    this.highFreqCorner.next(this.options.highFreqCorner ? this.options.highFreqCorner : globals.highFreqCorner);
    this.site.next(this.options.site ? this.options.site : '');
    this.network.next(this.options.network ? this.options.network : '');
  }

  saveOption(option: string, value: any) {
    this.options[option] = value;
    window.localStorage.setItem('viewer-options', JSON.stringify(this.options));
  }

  private _watchWebsocketNotifications() {
    this.onServerEventSub = this._apiService.onWebsocketNotification().subscribe(data => {

      try {
        if (data.type === WebsocketResponseType.EVENT) {
          switch (data.operation) {
            case WebsocketResponseOperation.UPDATED:
              this.wsEventUpdated.next(data.event);
              break;
            case WebsocketResponseOperation.CREATED:
              this.wsEventCreated.next(data.event);
              break;
            case WebsocketResponseOperation.INTERACTIVE_BATCH_READY:
            case WebsocketResponseOperation.INTERACTIVE_BATCH_FAILED:
              let activeList = this.interactiveProcessActiveList.getValue();
              let currentList = this.interactiveProcessCurrentList.getValue();
              let previousEventVer: IEvent | null = null;
              const batchId = data.extra && data.extra.batch && data.extra.batch.id;

              // EVENT Reprocessing triggered on other instances
              activeList = activeList.filter(val => val.batchId !== batchId);
              this.interactiveProcessActiveList.next(activeList);

              // EVENT Reprocessing triggered on current instance
              currentList = currentList.filter(val => {
                if (val.batchId !== batchId) {
                  return true;
                }
                previousEventVer = val.event;
                return false;
              });
              this.interactiveProcessCurrentList.next(currentList);

              if (previousEventVer) {
                this.interactiveProcessLoading.next(false);

                if (data.operation === WebsocketResponseOperation.INTERACTIVE_BATCH_READY) {
                  this._toastrNotificationService.success('Interactive processing is ready');
                  this.openInteractiveProcessDialog(previousEventVer, data.event);
                } else if (data.operation === WebsocketResponseOperation.INTERACTIVE_BATCH_FAILED) {
                  this.openInteractiveProcessDialog(previousEventVer, undefined);
                  this._toastrNotificationService.error(data.extra.error, 'Interactive processing failed');
                }
              }
              break;
            default:
              console.log(`unknown websocket operation`);
              break;
          }
        } else if (data.type === WebsocketResponseType.HEARTBEAT) {
          if (data.heartbeat && data.heartbeat.source === HEARTBEAT_NAME) {
            this.heartbeat.next(data.heartbeat);
            this.checkHeartbeat();
          }
        }
      } catch (err) {
        console.error(err);
      }
    },
      (err) => console.error(err)
    );
  }

  checkHeartbeat() {
    const val = this.heartbeat.getValue();

    if (val) {
      const lastHeard = val.last_heard;
      const now = moment();
      const diff = now.diff(moment.utc(lastHeard), 'seconds');

      if (diff > this.websocketReinitTimeout) {
        this._apiService.closeWebsocketNotification(this.websocketReinitTimeout * 1000, { code: 4000, reason: `Didn't receive any heartbeat in last ${this.websocketReinitTimeout} seconds. Closing connection.` });
      }

      if (diff > this.inactiveTimeout) {
        this.heartbeatStatus.next(HeartbeatStatus.INACTIVE);
      } else if (diff > this.pendingTimeout) {
        this.heartbeatStatus.next(HeartbeatStatus.PENDING);
      } else {
        if (this.lastHeard.getValue() !== lastHeard) {
          this.heartbeatStatus.next(HeartbeatStatus.ACTIVE);
        }
      }

      if (this.lastHeard.getValue() !== lastHeard) {
        this.lastHeard.next(lastHeard);
      }
    }
  }

  async openWaveformFilterDialog() {
    if (this.eventWaveformFilterDialogOpened || this.eventWaveformFilterDialogRef) {
      return;
    }

    this.eventWaveformFilterDialogOpened = true;
    this.eventWaveformFilterDialogRef = this._matDialog.open<EventWaveformFilterDialogComponent, EventWaveformFilterDialogData>(EventWaveformFilterDialogComponent, {
      width: '400px',
      data: {
        lowFreqCorner: this.lowFreqCorner.getValue(),
        highFreqCorner: this.highFreqCorner.getValue(),
        numPoles: this.numPoles.getValue(),
        maxFreq: globals.highFreqCorner
      }
    });

    this.eventWaveformFilterDialogRef.componentInstance.applyFilter.pipe(first()).subscribe(val => {
      this.lowFreqCorner.next(val.lowFreqCorner);
      this.highFreqCorner.next(val.highFreqCorner);
      this.numPoles.next(val.numPoles);
      this.applyFilterClicked.next();
      this.eventWaveformFilterDialogRef.close();
    });

    this.eventWaveformFilterDialogRef.afterClosed().pipe(first()).subscribe(val => {
      delete this.eventWaveformFilterDialogRef;
      this.eventWaveformFilterDialogOpened = false;
    });
  }

  async openHelpDialog() {
    if (this.helpDialogOpened || this.helpDialogRef) {
      return;
    }

    this.helpDialogOpened = true;
    this.helpDialogRef = this._matDialog.open(EventHelpDialogComponent);
    this.helpDialogRef.afterClosed().pipe(first()).subscribe(val => {
      delete this.helpDialogRef;
      this.helpDialogOpened = false;
    });
  }


  openInteractiveProcessDialog(oldEvent: IEvent, newEvent?: IEvent) {
    if (!oldEvent) {
      return;
    }

    this.eventInteractiveProcessDialogRef = this._matDialog.open<EventInteractiveProcessingDialogComponent, EventInteractiveProcessingDialog>(EventInteractiveProcessingDialogComponent, {
      disableClose: true,
      hasBackdrop: true,
      width: '600px',
      data: {
        oldEvent,
        newEvent
      }
    });

    this.eventInteractiveProcessDialogRef.componentInstance.onAcceptClicked.pipe(first()).subscribe(async () => {
      try {
        this._ngxSpinnerService.show('loadingAcceptIntercativeProcessing', { fullScreen: false, bdColor: 'rgba(51,51,51,0.75)' });
        const eventId = newEvent ? newEvent.event_resource_id : '';
        const response = await this._eventApiService.acceptInteractiveProcessing(eventId).toPromise();
        this.wsEventUpdated.next(response);
      } catch (err) {
        console.error(err);
      } finally {
        this._ngxSpinnerService.hide('loadingAcceptIntercativeProcessing');
      }
    });
  }


  async openBatchDialog() {

    this.batchPicksDialogRef = this._matDialog.open<ConfirmationDialogComponent, ConfirmationDialogData>(ConfirmationDialogComponent, {
      hasBackdrop: true,
      width: '600px',
      data: {
        header: 'Do you want to load arrivals from the latest reprocessing?',
        text: `Previous reprocessing of this event has failed or was not accepted. If you want to, you can load arrivals from the latest reprocessing.`
      }
    });

    this.batchPicksDialogRef.afterClosed().pipe(first()).subscribe(val => {
      if (val) {
        this.batchPicks.next(true);
      }
    });

  }

  async cancelLastInteractiveProcess() {
    try {
      this.interactiveProcessLoading.next(false);

      // IP triggered by current user instance
      const ipCurrentList = this.interactiveProcessCurrentList.getValue();
      const removedBatch = ipCurrentList.pop();
      this.interactiveProcessCurrentList.next(ipCurrentList);
      const eventId = removedBatch ? removedBatch.event.event_resource_id : '';

      const response = await this._eventApiService.cancelInteractiveProcessing(eventId).toPromise();

      // IP triggered by other than current user instance
      // there may be case, where user clicks on some other event that is being reprocessed (triggered by some other instance)
      // and last element of ipActiveList is not same as last element of ipCurrentList.
      // We need to find exact position to be sure we remove right batch.
      const ipActiveList = this.interactiveProcessActiveList.getValue();
      const batchId = removedBatch ? removedBatch.batchId : '';
      const idx = ipActiveList.findIndex(val => val.batchId === batchId);
      if (idx > -1) {
        ipActiveList.splice(idx, 1);
        this.interactiveProcessActiveList.next(ipActiveList);
      }
    } catch (err) {
      console.error(err);
    }
  }

  runInteractiveProcessInBg() {
    this.interactiveProcessLoading.next(false);
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
        eventQuery: this.eventListQuery,
        evaluationStatuses: this.evaluationStatusGroups,
        eventTypes: this.eventTypes,
        eventEvaluationModes: this.eventEvaluationModes
      }
    });

    this.eventFilterDialogRef.componentInstance.onFilter
      .pipe(take(1))
      .subscribe(async (data: EventQuery) => {
        try {
          this.eventListQuery = data;
          this.eventFilterDialogRef.componentInstance.loading = true;
          this._ngxSpinnerService.show('loadingEventFilter', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
          this._router.navigate(
            [],
            {
              relativeTo: this._activatedRoute,
              queryParams: EventUtil.buildEventListParams(this.eventListQuery),
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


  async openEventUpdateDialog(event: IEvent) {
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
        event: event,
        evaluationStatuses: this.evaluationStatuses,
        eventTypes: this.eventTypes,
        eventEvaluationModes: this.eventEvaluationModes,
        mode: 'updateDialog'
      }
    });

    const updateDialogSaveSub = this.eventUpdateDialogRef.componentInstance.onSave.pipe(first()).subscribe(async (data: EventUpdateInput) => {
      try {
        this.eventUpdateDialogRef.componentInstance.loading = true;
        this._ngxSpinnerService.show('loadingEventUpdate', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
        const eventId = data && data.event_resource_id ? data.event_resource_id : '';

        const result = await this._eventApiService.updateEvent(eventId, data).toPromise();
        this.wsEventUpdated.next(result);
        this.eventUpdateDialogRef.close();
      } catch (err) {
        console.error(err);
      } finally {
        this.eventUpdateDialogRef.componentInstance.loading = false;
        this._ngxSpinnerService.hide('loadingEventUpdate');
      }
    });

    const updateDialogAcceptSub = this.eventUpdateDialogRef.componentInstance.onAcceptClicked.pipe(first()).subscribe(async (data: EventType) => {
      this.eventUpdateDialogRef.componentInstance.loading = true;
      this._ngxSpinnerService.show('loadingEventUpdate', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });

      if (await this.onAcceptClick(event.event_resource_id, data)) {
        this.eventUpdateDialogRef.close();
      }

      this.eventUpdateDialogRef.componentInstance.loading = false;
      this._ngxSpinnerService.hide('loadingEventUpdate');
    });

    const updateDialogRejectSub = this.eventUpdateDialogRef.componentInstance.onRejectClicked.pipe(first()).subscribe(async (data: EventType) => {
      this.eventUpdateDialogRef.componentInstance.loading = true;
      this._ngxSpinnerService.show('loadingEventUpdate', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });

      if (await this.onDeclineClick(event.event_resource_id, data)) {
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


  async onAcceptClick(eventId: string, $event: EventType): Promise<boolean> {
    let repsonse = true;
    try {
      this._ngxSpinnerService.show('loadingCurrentEvent', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
      const eventUpdateInput: EventUpdateInput = {
        event_type: $event.quakeml_type,
        evaluation_mode: EvaluationMode.MANUAL,
        // this.currentEvent.event_type !== $event.quakeml_type ? EvaluationMode.MANUAL : EvaluationMode.AUTOMATIC,
        status: EvaluationStatus.CONFIRMED
      };
      const result = await this._eventApiService.updateEvent(eventId, eventUpdateInput).toPromise();
      this.wsEventUpdated.next(result);
    } catch (err) {
      repsonse = false;
      console.error(err);
    } finally {
      this._ngxSpinnerService.hide('loadingCurrentEvent');
    }

    return repsonse;
  }

  async onDeclineClick(eventId: string, $event: EventType): Promise<boolean> {
    let repsonse = true;
    try {
      this._ngxSpinnerService.show('loadingCurrentEvent', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
      const eventUpdateInput: EventUpdateInput = {
        event_type: $event.quakeml_type,
        evaluation_mode: EvaluationMode.MANUAL,
        status: EvaluationStatus.REJECTED
      };
      const result = await this._eventApiService.updateEvent(eventId, eventUpdateInput).toPromise();
      this.wsEventUpdated.next(result);
    } catch (err) {
      repsonse = false;
      console.error(err);
    } finally {
      this._ngxSpinnerService.hide('loadingCurrentEvent');
    }

    return repsonse;
  }

  private async _loadAllSensors() {
    try {
      // TODO: remove getSensors query once waveformInfo contains information about all active sensors
      const response = await this._inventoryApiService.getSensors({
        page_size: 1000
      }).toPromise();

      this.allSensorsOrig = response.results;
      this.allSensorsOrig.forEach((sensor, idx) => this.allSensorsMap[sensor.code] = idx);

    } catch (err) {
      this._toastrNotificationService.error(err);
      console.error(err);
    }
  }

  private async _loadAllStations() {
    try {
      // TODO: remove getStations query once waveformInfo contains information about all active sensors
      const response = await this._inventoryApiService.getStations({
        page_size: 1000
      }).toPromise();

      this.allStations = response.results;
      this.allStations.forEach((station, idx) => this.allStationsMap[station.id] = idx);
    } catch (err) {
      console.error(err);
    }
  }

  async showNewEventToastrNotification($event: IEvent, type: 'success' | 'error' = 'success') {
    const time = moment($event.time_utc).utc().utcOffset(this.timezone);
    const eventType = `<strong>${this._eventQuakemlToMicroquakeTypePipe.transform($event.event_type, this.eventTypes)}</strong>`;
    const date = `<strong>${time.format('HH:mm:ss')}${time.format('.SSS MMM DD YYYY')}</strong>`;
    const magnitude = `${$event.magnitude ? '<strong>' + $event.magnitude.toFixed(1) + '</strong>' + ' <small>Mw</small>' : '-'}`;

    if (type === 'success') {
      this._toastrNotificationService.success(`
    ${date}<br>
    ${eventType}<br>
    ${magnitude}
    `, `New event`, { enableHtml: true, timeOut: 10000 });
    } else {
      const errMsg = `Already in the event list.`;
      this._toastrNotificationService.error(`
    ${errMsg}<br>
    ${date}<br>
    ${eventType}<br>
    ${magnitude}
    `, `Error: New event`, { enableHtml: true, timeOut: 10000 });
    }
  }
}
