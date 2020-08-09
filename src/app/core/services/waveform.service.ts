import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, ReplaySubject, Subscription, forkJoin, interval, combineLatest } from 'rxjs';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { first, take, skipWhile, takeUntil } from 'rxjs/operators';
import * as moment from 'moment';

import { EventHelpDialogComponent } from '@app/shared/dialogs/event-help-dialog/event-help-dialog.component';
import { globals } from '@src/globals';
import { IEvent, EventBatchMap, EvaluationStatusGroup, EvaluationStatus, EvaluationMode, EventType, PickingMode, BatchStatus, } from '@interfaces/event.interface';
import { ToastrNotificationService } from './toastr-notification.service';
import { EventApiService } from './api/event-api.service';
import { EventInteractiveProcessingDialogComponent } from '@app/shared/dialogs/event-interactive-processing-dialog/event-interactive-processing-dialog.component';
import { EventInteractiveProcessingDialog, EventUpdateDialog, EventFilterDialogData, ConfirmationDialogData, EventWaveformFilterDialogData, JsonDialogData } from '@interfaces/dialogs.interface';
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
import { WebsocketResponseType, WebsocketResponseOperation, DataLoadStatus } from '@interfaces/core.interface';
import { WaveformInitializerDialogComponent } from '@app/shared/dialogs/waveform-initializer-dialog/waveform-initializer-dialog.component';
import { JsonDialogComponent } from '@app/shared/dialogs/json-dialog/json-dialog.component';
import { EventExportDialogComponent } from '@app/shared/dialogs/event-export-dialog/event-export-dialog.component';
import { EventWaveformShiftPicksDialogComponent } from '@app/shared/dialogs/event-waveform-shift-picks-dialog/event-waveform-shift-picks-dialog.component';
import { PaginationResponse } from '@interfaces/dto.interface';
import { SensorsQuery } from '@interfaces/inventory-query.interface';

const HEARTBEAT_NAME = `event_connector`;
@Injectable({
  providedIn: 'root'
})
export class WaveformService implements OnDestroy {

  currentEvent: BehaviorSubject<IEvent | null> = new BehaviorSubject<IEvent | null>(null);

  commonTimeScale: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  commonAmplitudeScale: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  zoomAll: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  displayEntireTraces: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
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
  removeAllPicksClicked: Subject<void> = new Subject;
  removeAllPicksClickedObs: Observable<void> = this.removeAllPicksClicked.asObservable();
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

  // EVENT Reprocessing triggered on current instance and other instances
  interactiveProcessActiveList: BehaviorSubject<EventBatchMap[]> = new BehaviorSubject<EventBatchMap[]>([]);
  // EVENT Reprocessing triggered on current instance only
  interactiveProcessCurrentList: BehaviorSubject<EventBatchMap[]> = new BehaviorSubject<EventBatchMap[]>([]);

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

  eventExportDialogOpened = false;
  eventExportDialogRef!: MatDialogRef<EventExportDialogComponent, EventFilterDialogData>;

  eventWaveformFilterDialogOpened = false;
  eventWaveformFilterDialogRef!: MatDialogRef<EventWaveformFilterDialogComponent>;

  eventWaveformShiftPicksDialogOpened = false;
  eventWaveformShiftPicksDialogRef!: MatDialogRef<EventWaveformShiftPicksDialogComponent>;
  shiftPicksValue: BehaviorSubject<number> = new BehaviorSubject(0);

  eventDuplicationDialogOpened = false;
  eventDuplicationDialogRef!: MatDialogRef<ConfirmationDialogComponent>;

  jsonDialogOpened = false;
  jsonDialogRef!: MatDialogRef<JsonDialogComponent>;

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
  lastHeardHeartbeat: BehaviorSubject<moment.Moment | null> = new BehaviorSubject<moment.Moment | null>(null);
  lastHeardWebsocket: BehaviorSubject<moment.Moment | null> = new BehaviorSubject<moment.Moment | null>(moment());

  // intervals (in milliseconds)
  heartbeatCheckInterval = 60 * 1000; // 1m
  websocketCheckInterval = 5 * 1000; // 5s
  interactiveProcessingCheckInterval = 60 * 1000; // 1m
  // timeouts (in milliseconds)
  eventConnectorPendingTimeout = 5 * 60 * 1000; // 5m
  eventConnectorInactiveTimeout = 15 * 60 * 1000; // 15m
  websocketReinitTimeout = 30 * 1000; // 30s
  interactiveProcessingWebsocketTimeout = 5 * 60 * 1000; // 5m

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

  allStationsLoadStatus: BehaviorSubject<DataLoadStatus> = new BehaviorSubject<DataLoadStatus>(DataLoadStatus.UNKNOWN);
  allSensorsOrigLoadStatus: BehaviorSubject<DataLoadStatus> = new BehaviorSubject<DataLoadStatus>(DataLoadStatus.UNKNOWN);
  sitesLoadStatus: BehaviorSubject<DataLoadStatus> = new BehaviorSubject<DataLoadStatus>(DataLoadStatus.UNKNOWN);
  networksLoadStatus: BehaviorSubject<DataLoadStatus> = new BehaviorSubject<DataLoadStatus>(DataLoadStatus.UNKNOWN);
  eventTypesLoadStatus: BehaviorSubject<DataLoadStatus> = new BehaviorSubject<DataLoadStatus>(DataLoadStatus.UNKNOWN);
  overallDataLoadStatus: BehaviorSubject<DataLoadStatus> = new BehaviorSubject<DataLoadStatus>(DataLoadStatus.UNKNOWN);

  _appDataDialog!: MatDialogRef<WaveformInitializerDialogComponent>;

  private _unsubscribe = new Subject<void>();

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
    this._watchAllDataLoad();
    this._initPrimary();
    this._initSecondary();
  }

  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
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
      this._loadAllSitesAndNetworks(),
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
    try {
      this.eventTypesLoadStatus.next(DataLoadStatus.LOADING);
      // TODO: add real site code from site picker
      this.eventTypes = await this._inventoryApiService.getMicroquakeEventTypes().toPromise();
      this.eventTypesLoadStatus.next(DataLoadStatus.LOADED);
    } catch (err) {
      this.eventTypesLoadStatus.next(DataLoadStatus.ERROR);
      this._toastrNotificationService.error(err);
      console.error(err);
      this.openApplicationDataDialog();
    }
  }

  public reloadEventTypes() {
    this._loadEventTypes();
  }

  private async _getLastHeartbeatAndWatch() {
    try {
      const response = await this._inventoryApiService.getHeartbeat(HEARTBEAT_NAME).toPromise();
      this.heartbeat.next(response);
      this._checkHeartbeat();
    } catch (err) {
      console.error(err);
    }

    interval(this.heartbeatCheckInterval)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._checkHeartbeat();
      });

    interval(this.websocketCheckInterval)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._checkWebsocketConnection();
      });

    interval(this.interactiveProcessingCheckInterval)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._checkInteractiveProcessing();
      });

  }

  private async _loadAllSitesAndNetworks() {
    try {
      this.sitesLoadStatus.next(DataLoadStatus.LOADING);
      this.networksLoadStatus.next(DataLoadStatus.LOADING);
      const response = await this._inventoryApiService.getSites().toPromise();
      this.sites = response;
      this.networks = [];
      this.sites.map(site => {
        this.networks = [...this.networks, ...site.networks];
      });

      this.currentSite = this.sites[0];
      this.currentNetwork = this.sites[0] && this.sites[0].networks && this.sites[0].networks[0];
      this.sitesLoadStatus.next(DataLoadStatus.LOADED);
      this.networksLoadStatus.next(DataLoadStatus.LOADED);
    } catch (err) {
      this.sitesLoadStatus.next(DataLoadStatus.ERROR);
      this.networksLoadStatus.next(DataLoadStatus.ERROR);
      this._toastrNotificationService.error(err);
      console.error(err);
      this.openApplicationDataDialog();
    }
  }

  public reloadAllSitesAndNetworks() {
    this._loadAllSitesAndNetworks();
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

  /**
   * Watches websocket notifications
   *
   * @remarks
   *
   * Handles websocket notifications from server
   */
  private _watchWebsocketNotifications() {
    this._apiService.onWebsocketNotification()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {

        try {
          this.lastHeardWebsocket.next(moment());

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

                const batchId = data.extra && data.extra.batch && data.extra.batch.id;
                const event = data.event;
                const operation = data.operation;
                const error = data.extra.error;
                let batchStatus: BatchStatus;

                if (operation === WebsocketResponseOperation.INTERACTIVE_BATCH_READY) {
                  batchStatus = BatchStatus.READY;
                } else if (WebsocketResponseOperation.INTERACTIVE_BATCH_FAILED) {
                  batchStatus = BatchStatus.ERROR;
                } else {
                  return;
                }

                if (!batchId) {
                  return;
                }

                this._handleInteractiveProcessing(batchId, event, batchStatus, error);
                break;

              case WebsocketResponseOperation.AUTOMATIC_PIPELINE_COMPLETE:
                break;

              default:
                console.log(`unknown websocket operation: ${data.operation}`);
                break;
            }
          } else if (data.type === WebsocketResponseType.HEARTBEAT) {
            if (data.heartbeat && data.heartbeat.source === HEARTBEAT_NAME) {
              this.heartbeat.next(data.heartbeat);
              this._checkHeartbeat();
            }
          } else if (data.type === WebsocketResponseType.SIGNAL_QUALITY) {
            // not handled in app
          } else {
            console.log(`unknown websocket type: ${data.type}`);
          }
        } catch (err) {
          console.error(err);
        }
      },
        (err) => console.error(err)
      );
  }

  /**
   * Check for stuck interactive processing requests
   *
   * @remarks
   *
   * Any IP running more than specified time (this.interactiveProcessingWebsocketTimeout) is considered as potentially stuck. App probably
   * missed WS notificaiton (INTERACTIVE_BATCH_READY or INTERACTIVE_BATCH_FAILED).
   *
   * On potentialy stuck IPs is done direct API request to check if they are still processing or not. If they are not, IP will be processed as on WS message.
   *
   */
  private _checkInteractiveProcessing() {
    const activeList = this.interactiveProcessActiveList.getValue();

    if (!activeList || activeList.length === 0) {
      return;
    }

    const now = moment();

    activeList.forEach((batch, idx) => {

      const diffBatch = now.diff(moment.utc(batch.addedAt), 'milliseconds');

      if (diffBatch > this.interactiveProcessingWebsocketTimeout) {
        setTimeout(async () => {
          try {
            const res = await this._eventApiService.getInteractiveProcessing(batch.event.event_resource_id).toPromise();
            console.log(res);

            const batchId = batch.batchId;
            const event = batch.event;
            const batchStatus = res.status;
            const error = '';

            if (batchStatus === BatchStatus.READY || batchStatus === BatchStatus.ERROR) {
              this._handleInteractiveProcessing(batchId, event, batchStatus, error);
            }
          } catch (err) {
            console.error(err);
          }
        }, idx * 2000);
      }
    });

  }

  /**
   * Check for stuck WebSocket (WS) connection
   *
   * @remarks
   *
   * WS connection is considered as potentionally stuck if app didn't receive any WS message in a specified time (this.websocketReinitTimeout).
   *
   * Timer resets after each message.
   *
   * Potentionally stuck WS connection is then closed and reopened.
   *
   */
  private _checkWebsocketConnection() {
    const lastHeardWebsocket = this.lastHeardWebsocket.getValue();

    if (!lastHeardWebsocket) {
      return;
    }
    const now = moment();
    const diffWebsocket = now.diff(moment.utc(lastHeardWebsocket), 'milliseconds');

    if (diffWebsocket > this.websocketReinitTimeout) {
      this._apiService.closeWebsocketNotification(this.websocketReinitTimeout, { code: 4000, reason: `Didn't receive any websocket message in last ${this.websocketReinitTimeout} seconds. Closing connection.` });
    }
  }

  /**
   * Check for heartbeat status
   *
   * @remarks
   *
   * Changes current heartbeat status according to the time when it got the last heartbeat WS notification.
   *
   */
  private _checkHeartbeat() {
    const heartbeat = this.heartbeat.getValue();

    if (!heartbeat) {
      return;
    }

    const lastHeardHeartbeat = moment(heartbeat.last_heard);
    const now = moment();
    const diffHeartbeat = now.diff(moment.utc(lastHeardHeartbeat), 'milliseconds');

    if (diffHeartbeat > this.eventConnectorInactiveTimeout) {
      this.heartbeatStatus.next(HeartbeatStatus.INACTIVE);
    } else if (diffHeartbeat > this.eventConnectorPendingTimeout) {
      this.heartbeatStatus.next(HeartbeatStatus.PENDING);
    } else {
      this.heartbeatStatus.next(HeartbeatStatus.ACTIVE);
    }

    if (this.lastHeardHeartbeat.getValue() !== lastHeardHeartbeat) {
      this.lastHeardHeartbeat.next(lastHeardHeartbeat);
    }
  }

  /**
   * Handles interactive processing (IP)
   *
   * @remarks
   *
   * Helper function to process IP.
   *
   * Executed after:
   *  - WS notification
   *  - specified timeout (this.interactiveProcessingWebsocketTimeout). App probably missed WS notificaiton
   *
   * @param batchId - ID of IP
   * @param event - event object on which was IP done
   * @param batchStatus - status of IP (ready/fail)
   * @param error - optional error object/message
   */
  private _handleInteractiveProcessing(batchId: number, event: IEvent, batchStatus: BatchStatus, error: any) {
    let activeList = this.interactiveProcessActiveList.getValue();
    let currentList = this.interactiveProcessCurrentList.getValue();
    let previousEventVer: IEvent | null = null;

    activeList = activeList.filter(val => val.batchId !== batchId);
    this.interactiveProcessActiveList.next(activeList);

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

      if (batchStatus === BatchStatus.READY) {
        this._toastrNotificationService.success('Interactive processing is ready');
        this.openInteractiveProcessDialog(previousEventVer, event);
      } else if (batchStatus === BatchStatus.ERROR) {
        this.openInteractiveProcessDialog(previousEventVer, undefined);
        this._toastrNotificationService.error(error, 'Interactive processing failed');
      }
    }
  }

  async openEventChart(eventId: String) {
    await this._router.navigate(['/events', eventId], {
      relativeTo: this._activatedRoute,
      queryParamsHandling: 'merge',
    });
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


  /**
   * Opens a dialog for shifting of picks. To the submitted value (this.shiftPicksValue) is subscribed waveform-2 component.
   */
  async openShiftPicksDialog(): Promise<void> {
    if (this.eventWaveformShiftPicksDialogOpened || this.eventWaveformShiftPicksDialogRef) {
      return;
    }

    this.eventWaveformShiftPicksDialogOpened = true;
    this.eventWaveformShiftPicksDialogRef = this._matDialog.open(EventWaveformShiftPicksDialogComponent);


    const $submitClick = this.eventWaveformShiftPicksDialogRef.componentInstance.submitClick
      .subscribe(async (data: number) => {
        this.shiftPicksValue.next(data);
        this.eventWaveformShiftPicksDialogRef.close();
      });

    this.eventWaveformShiftPicksDialogRef.afterClosed().pipe(first()).subscribe(val => {
      $submitClick.unsubscribe();
      delete this.eventWaveformShiftPicksDialogRef;
      this.eventWaveformShiftPicksDialogOpened = false;
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

  async openJsonDialog(data: JsonDialogData) {
    if (this.jsonDialogOpened || this.jsonDialogRef) {
      return;
    }

    this.jsonDialogOpened = true;
    this.jsonDialogRef = this._matDialog.open<JsonDialogComponent, JsonDialogData>(JsonDialogComponent, {
      hasBackdrop: true,
      width: '800px',
      data: data
    });

    this.jsonDialogRef.afterClosed().pipe(first()).subscribe(val => {
      delete this.jsonDialogRef;
      this.jsonDialogOpened = false;
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



  async openEventDuplicationDialog(ev: IEvent) {
    console.log('here');
    if (!ev) {
      console.error('No event to duplicate');
      return null;
    }

    if (this.eventDuplicationDialogRef || this.eventDuplicationDialogOpened) {
      return;
    }

    this.eventDuplicationDialogOpened = true;

    this.eventDuplicationDialogRef = this._matDialog.open<ConfirmationDialogComponent, ConfirmationDialogData>(ConfirmationDialogComponent, {
      hasBackdrop: true,
      width: '600px',
      data: {
        header: `Do you want to duplicate event ${ev.event_resource_id}?`,
        text: `Duplicate event will open after successful duplication.`
      }
    });

    this.eventDuplicationDialogRef.afterClosed().pipe(first()).subscribe(async val => {
      try {
        if (val) {
          this.loadingCurrentEventAndList = true;
          this._ngxSpinnerService.show('loadingCurrentEventAndList', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
          const response = await this._eventApiService.duplicateEvent(ev.event_resource_id).toPromise();
          this.openEventChart(response.event_resource_id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        this.eventDuplicationDialogOpened = false;
        delete this.eventDuplicationDialogRef;

        this.loadingCurrentEventAndList = false;
        this._ngxSpinnerService.hide('loadingCurrentEventAndList');
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

  async openEventExportDialog() {

    if (this.eventExportDialogRef || this.eventExportDialogOpened) {
      return;
    }

    const unsubscribeDialog = new Subject<void>();

    this.eventExportDialogOpened = true;
    this.eventExportDialogRef = this._matDialog.open<EventExportDialogComponent, EventFilterDialogData>(EventExportDialogComponent, {
      hasBackdrop: true,
      width: '750px',
      height: 'auto',
      data: {
        timezone: this.timezone,
        eventQuery: JSON.parse(JSON.stringify(this.eventListQuery)),
        evaluationStatuses: this.evaluationStatusGroups,
        eventTypes: this.eventTypes,
        eventEvaluationModes: this.eventEvaluationModes
      }
    });

    this.eventExportDialogRef.componentInstance.onExport
      .pipe(first())
      .subscribe(async (data: EventQuery) => {

        try {
          this.eventExportDialogRef.componentInstance.loading = true;
          this._ngxSpinnerService.show('loadingEventExport', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });

          const binaryData = await this._eventApiService.downloadResource(this._eventApiService.geneateUrlToExportEventsToCsv(data)).toPromise();
          const virtualDownloadEl = document.createElement('a');
          virtualDownloadEl.href = window.URL.createObjectURL(binaryData);
          virtualDownloadEl.download = 'events.csv';
          document.body.appendChild(virtualDownloadEl);
          virtualDownloadEl.click();
          virtualDownloadEl.remove();

          this.eventExportDialogRef.close();
        } catch (err) {
          console.error(err);
        } finally {
          this.eventExportDialogRef.componentInstance.loading = false;
          this._ngxSpinnerService.hide('loadingEventExport');
        }
      });

    this.eventExportDialogRef.afterClosed().pipe(first()).subscribe(val => {
      delete this.eventExportDialogRef;
      this.eventExportDialogOpened = false;

      unsubscribeDialog.next();
      unsubscribeDialog.complete();
    });

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

      this.allSensorsOrigLoadStatus.next(DataLoadStatus.LOADING);
      // TODO: remove getSensors query once waveformInfo contains information about all active sensors
      const response = await this._inventoryApiService.getSensors({
        page_size: 1000
      }).toPromise();

      this.allSensorsOrig = response.results;
      this.allSensorsOrig.forEach((sensor, idx) => this.allSensorsMap[sensor.code] = idx);
      this.allSensorsOrigLoadStatus.next(DataLoadStatus.LOADED);

    } catch (err) {
      this.allSensorsOrigLoadStatus.next(DataLoadStatus.ERROR);
      this._toastrNotificationService.error(err);
      console.error(err);
      this.openApplicationDataDialog();
    }
  }

  public reloadAllSensors() {
    this._loadAllSensors();
  }

  private async _loadAllStations() {
    try {
      this.allStationsLoadStatus.next(DataLoadStatus.LOADING);
      // TODO: remove getStations query once waveformInfo contains information about all active sensors
      const response = await this._inventoryApiService.getStations({
        page_size: 1000
      }).toPromise();

      this.allStations = response.results;
      this.allStations.forEach((station, idx) => this.allStationsMap[station.id] = idx);
      this.allStationsLoadStatus.next(DataLoadStatus.LOADED);
    } catch (err) {
      this.allStationsLoadStatus.next(DataLoadStatus.ERROR);
      this._toastrNotificationService.error(err);
      console.error(err);
      this.openApplicationDataDialog();
    }
  }

  public reloadAllStations() {
    this._loadAllStations();
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

  public openApplicationDataDialog() {
    if (this._appDataDialog) {
      return;
    }

    this._appDataDialog = this._matDialog.open<WaveformInitializerDialogComponent, { waveformService: WaveformService }>(WaveformInitializerDialogComponent, {
      width: '600px',
      autoFocus: false,
      disableClose: true,
      data: {
        waveformService: this,
      }
    });

    this._appDataDialog.afterClosed().pipe(first()).subscribe(_ => {
      delete this._appDataDialog;
    });
  }

  private _watchAllDataLoad() {
    combineLatest([
      this.sitesLoadStatus,
      this.networksLoadStatus,
      this.eventTypesLoadStatus,
      this.allSensorsOrigLoadStatus,
      this.allStationsLoadStatus
    ]).subscribe(val => {

      if (val.indexOf(DataLoadStatus.ERROR) > -1) {
        this.overallDataLoadStatus.next(DataLoadStatus.ERROR);
      } else if (val.every(v => v === DataLoadStatus.LOADED)) {
        this.overallDataLoadStatus.next(DataLoadStatus.LOADED);
      } else {
        this.overallDataLoadStatus.next(DataLoadStatus.LOADING);
      }
    });
  }
}
