import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, ReplaySubject, Subscription } from 'rxjs';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { first, take } from 'rxjs/operators';

import { EventHelpDialogComponent } from '@app/shared/dialogs/event-help-dialog/event-help-dialog.component';
import { globals } from '@src/globals';
import { IEvent, EventBatchMap, WebsocketResponseOperation, EvaluationStatusGroup, EvaluationStatus, EvaluationMode, EventType } from '@interfaces/event.interface';
import { ToastrNotificationService } from './toastr-notification.service';
import { EventApiService } from './event-api.service';
import { EventInteractiveProcessingDialogComponent } from '@app/shared/dialogs/event-interactive-processing-dialog/event-interactive-processing-dialog.component';
import { EventInteractiveProcessingDialog, EventUpdateDialog, EventFilterDialogData } from '@interfaces/dialogs.interface';
import { EventUpdateDialogComponent } from '@app/shared/dialogs/event-update-dialog/event-update-dialog.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { EventUpdateInput } from '@interfaces/event-dto.interface';
import { EventQuery } from '@interfaces/event-query.interface';
import { EventFilterDialogComponent } from '@app/shared/dialogs/event-filter-dialog/event-filter-dialog.component';
import EventUtil from '@core/utils/event-util';
import { Router, ActivatedRoute } from '@angular/router';
import { InventoryApiService } from './inventory-api.service';
import { Site, Network, Station, Sensor } from '@interfaces/inventory.interface';

@Injectable({
  providedIn: 'root'
})
export class WaveformService implements OnDestroy {

  currentEvent: BehaviorSubject<IEvent> = new BehaviorSubject(null);

  commonTimeScale: BehaviorSubject<boolean> = new BehaviorSubject(true);
  commonAmplitudeScale: BehaviorSubject<boolean> = new BehaviorSubject(false);
  zoomAll: BehaviorSubject<boolean> = new BehaviorSubject(false);
  displayComposite: BehaviorSubject<boolean> = new BehaviorSubject(true);
  displayRotated: BehaviorSubject<boolean> = new BehaviorSubject(false);
  predictedPicks: BehaviorSubject<boolean> = new BehaviorSubject(true);
  predictedPicksBias: BehaviorSubject<boolean> = new BehaviorSubject(true);
  pickingMode: BehaviorSubject<any> = new BehaviorSubject('none'); // TODO: add interface
  loadedAll: BehaviorSubject<boolean> = new BehaviorSubject(false);

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

  helpDialogRef: MatDialogRef<EventHelpDialogComponent>;
  helpDialogOpened = false;

  site: BehaviorSubject<string> = new BehaviorSubject('');
  network: BehaviorSubject<string> = new BehaviorSubject('');

  loadedSensors: BehaviorSubject<any[]> = new BehaviorSubject([]);

  options: any = {};
  sidebarOpened: BehaviorSubject<boolean> = new BehaviorSubject(true);

  pageSize: BehaviorSubject<number> = new BehaviorSubject(globals.chartsPerPage);
  currentPage: BehaviorSubject<number> = new BehaviorSubject(1);
  maxPages: BehaviorSubject<number> = new BehaviorSubject(globals.max_num_pages);
  loadedPages: BehaviorSubject<number> = new BehaviorSubject(0);

  loading: BehaviorSubject<boolean> = new BehaviorSubject(false);
  interactiveProcessLoading: BehaviorSubject<boolean> = new BehaviorSubject(false);

  waveformComponentInitialized: ReplaySubject<boolean> = new ReplaySubject(1);
  waveformComponentInitializedObs: Observable<boolean> = this.waveformComponentInitialized.asObservable();

  interactiveProcessingEnabled: BehaviorSubject<boolean> = new BehaviorSubject(false);
  interactiveProcessActiveList: BehaviorSubject<EventBatchMap[]> = new BehaviorSubject([]);
  interactiveProcessCurrentList: BehaviorSubject<EventBatchMap[]> = new BehaviorSubject([]);

  onServerEventSub: Subscription;

  wsEventUpdated: Subject<IEvent> = new Subject;
  wsEventUpdatedObs: Observable<IEvent> = this.wsEventUpdated.asObservable();

  wsEventCreated: Subject<IEvent> = new Subject;
  wsEventCreatedObs: Observable<IEvent> = this.wsEventCreated.asObservable();


  eventUpdateDialogOpened = false;
  loadingCurrentEventAndList = false;
  eventUpdateDialogRef: MatDialogRef<EventUpdateDialogComponent, EventUpdateDialog>;
  eventInteractiveProcessDialogRef: MatDialogRef<EventInteractiveProcessingDialogComponent, EventInteractiveProcessingDialog>;

  eventFilterDialogOpened = false;
  eventFilterDialogRef: MatDialogRef<EventFilterDialogComponent, EventFilterDialogData>;

  eventTypes: EventType[] = [];
  evaluationStatuses = Object.values(EvaluationStatus);
  evaluationStatusGroups = Object.values(EvaluationStatusGroup);
  eventEvaluationModes = Object.values(EvaluationMode);

  numberOfChangesInFilter = 0;
  eventListQuery: EventQuery;

  allSensorsOrig: Sensor[];
  allStations: Station[];

  allSensorsMap: { [key: string]: number } = {};
  allStationsMap: { [key: number]: number } = {};


  initialized: ReplaySubject<boolean> = new ReplaySubject(1);
  initializedObs: Observable<boolean> = this.initialized.asObservable();

  public set currentSite(v: Site) {
    this._currentSite = v;
    if (this._currentSite && this._currentSite.timezone) {
      this.timezone = this._currentSite.timezone;
    }
  }
  public get currentSite(): Site {
    return this._currentSite;
  }
  private _currentSite: Site;

  currentNetwork: Network;
  // TODO: fix when resolved on API
  timezone = '+08:00';

  sites: Site[] = [];
  networks: Network[] = [];

  constructor(
    private _matDialog: MatDialog,
    private _toastrNotificationService: ToastrNotificationService,
    private _eventApiService: EventApiService,
    private _inventoryApiService: InventoryApiService,
    private _ngxSpinnerService: NgxSpinnerService,
    private _router: Router,
    private _activatedRoute: ActivatedRoute
  ) {
    this._init();
  }

  ngOnDestroy() {
    if (this.onServerEventSub) {
      this.onServerEventSub.unsubscribe();
    }
  }

  private async _init() {
    await Promise.all([
      this._loadPersistantData(),
      this._watchServerEventUpdates(),
      this._loadEventTypes(),
      this._getAllSitesAndNetworks(),
      this._loadAllSensors(),
      this._loadAllStations()
    ]);

    this.initialized.next(true);
  }

  private async _loadEventTypes() {
    // TODO: add real site code from site picker
    this.eventTypes = await this._eventApiService.getMicroquakeEventTypes().toPromise();
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
      this.currentNetwork = this.sites[0] && this.sites[0].networks ? this.sites[0].networks[0] : undefined;
    } catch (err) {
      console.error(err);
    }
  }

  private _loadPersistantData() {
    this.options = JSON.parse(window.localStorage.getItem('viewer-options')) || {};
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


  private _watchServerEventUpdates() {
    this.onServerEventSub = this._eventApiService.onServerEvent().subscribe(data => {
      try {

        switch (data.operation) {
          case WebsocketResponseOperation.UPDATE:
            this.wsEventUpdated.next(data.event);
            break;
          case WebsocketResponseOperation.CREATED:
            this.wsEventCreated.next(data.event);
            break;
          case WebsocketResponseOperation.INTERACTIVE_BATCH_READY:
          case WebsocketResponseOperation.INTERACTIVE_BATCH_FAILED:
            let activeList = this.interactiveProcessActiveList.getValue();
            let currentList = this.interactiveProcessCurrentList.getValue();
            let previousEventVer: IEvent = null;

            // EVENT Reprocessing triggered on other instances
            activeList = activeList.filter(val => val.batchId !== data.extra.batch.id);
            this.interactiveProcessActiveList.next(activeList);

            // EVENT Reprocessing triggered on current instance
            currentList = currentList.filter(val => {
              if (val.batchId !== data.extra.batch.id) {
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
                this.openInteractiveProcessDialog(previousEventVer, null);
                this._toastrNotificationService.error(data.extra.error, 'Interactive processing failed');
              }
            }
            break;
          default:
            console.log(`unknown websocket operation`);
            break;
        }
      } catch (err) {
        console.error(err);
      }
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
      hasBackdrop: true,
      width: '600px',
      data: {
        oldEvent,
        newEvent
      }
    });

    this.eventInteractiveProcessDialogRef.componentInstance.onAcceptClicked.subscribe(async () => {
      try {
        const response = await this._eventApiService.acceptInteractiveProcessing(newEvent.event_resource_id).toPromise();
        console.log(response);
      } catch (err) {
        console.error(err);
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

      const response = await this._eventApiService.cancelInteractiveProcessing(removedBatch.event.event_resource_id).toPromise();
      console.log(response);

      // IP triggered by other than current user instance
      // there may be case, where user clicks on some other event that is being reprocessed (triggered by some other instance)
      // and last element of ipActiveList is not same as last element of ipCurrentList.
      // We need to find exact position to be sure we remove right batch.
      const ipActiveList = this.interactiveProcessActiveList.getValue();
      const idx = ipActiveList.findIndex(val => val.batchId === removedBatch.batchId);
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

    const updateDialogSaveSub = this.eventUpdateDialogRef.componentInstance.onSave.subscribe(async (data: EventUpdateInput) => {
      try {
        this.eventUpdateDialogRef.componentInstance.loading = true;
        this._ngxSpinnerService.show('loadingEventUpdate', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
        const result = await this._eventApiService.updateEventById(data.event_resource_id, data).toPromise();
        this.wsEventUpdated.next(result);
        this.eventUpdateDialogRef.close();
      } catch (err) {
        console.error(err);
      } finally {
        this.eventUpdateDialogRef.componentInstance.loading = false;
        this._ngxSpinnerService.hide('loadingEventUpdate');
      }
    });

    const updateDialogAcceptSub = this.eventUpdateDialogRef.componentInstance.onAcceptClicked.subscribe(async (data: EventType) => {
      this.eventUpdateDialogRef.componentInstance.loading = true;
      this._ngxSpinnerService.show('loadingEventUpdate', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });

      if (await this.onAcceptClick(event.event_resource_id, data)) {
        this.eventUpdateDialogRef.close();
      }

      this.eventUpdateDialogRef.componentInstance.loading = false;
      this._ngxSpinnerService.hide('loadingEventUpdate');
    });

    const updateDialogRejectSub = this.eventUpdateDialogRef.componentInstance.onRejectClicked.subscribe(async (data: EventType) => {
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
      await this._eventApiService.updateEventById(eventId, eventUpdateInput).toPromise();
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
      await this._eventApiService.updateEventById(eventId, eventUpdateInput).toPromise();
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
}
