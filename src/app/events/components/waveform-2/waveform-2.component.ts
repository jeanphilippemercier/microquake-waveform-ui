import { Component, OnInit, Input, ViewChild, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { takeUntil, distinctUntilChanged, skip, skipWhile, take } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
// @ts-ignore
import * as CanvasJS from '../../../../assets/js/canvasjs.min.js';
// @ts-ignore
import * as filter from 'seisplotjs-filter';
import * as moment from 'moment';

import WaveformUtil from '@core/utils/waveform-util';
import { globals } from '@src/globals';
import {
  IEvent, Origin, Arrival, EvaluationMode, PickKey, PredictedPickKey, WaveformSensor, ArrivalPartial, BatchStatus, EventBatchMap, InteractiveProcessing, Channel
} from '@interfaces/event.interface';
import { Sensor, MotionType, GroundMotionType } from '@interfaces/inventory.interface';
import { EventOriginsQuery, EventArrivalsQuery, EventWaveformQuery } from '@interfaces/event-query.interface';
import { WaveformQueryResponse } from '@interfaces/event-dto.interface.ts';
import { WaveformService } from '@services/waveform.service';
import { EventApiService } from '@services/event-api.service';
import { ToastrNotificationService } from '@services/toastr-notification.service.ts';

enum ContextMenuChartAction {
  DELETE_P = 'delete p',
  DELETE_S = 'delete s',
  NEW_P = 'new p',
  NEW_S = 'new s',
  SHOW_CROSSHAIR = 'show crosshair',
}

@Component({
  selector: 'app-waveform-2',
  templateUrl: './waveform-2.component.html',
  styleUrls: ['./waveform-2.component.scss']
})

export class Waveform2Component implements OnInit, OnDestroy {

  set event(event: IEvent) {
    const newEventId = event ? event.event_resource_id : null;
    const oldEventId = this._event ? this._event.event_resource_id : null;
    if (newEventId !== oldEventId || (
      this._event && event && (
        this._event.x !== event.x ||
        this._event.y !== event.y ||
        this._event.z !== event.z
      )
    )) {
      this._event = event;
      this._handleEvent(this._event);
    }
  }
  get event(): IEvent {
    return this._event;
  }
  private _event!: IEvent;

  @Input() timezone = '+00:00';
  @ViewChild('contextMenuChart', { static: false }) private _menu!: ElementRef;
  @ViewChild('waveformContainer', { static: false }) private _waveformContainer!: ElementRef;

  private _passband = filter.BAND_PASS;
  private _bHoldEventTrigger!: boolean;
  private _xViewPortMinStack!: any[];
  private _xViewportMaxStack!: any[];
  private _unsubscribe = new Subject<void>();
  contextMenuChartVisible = false;
  isContextPickingMenuVisible = true;

  /*
  * SENSORS
  */

  // sensors loaded from api - don't mutate this!
  // allSensorsOrig: Sensor[] = [];
  // duplicated allSensorsOrig for current chart
  allSensors: Sensor[] = [];
  // currently loaded sensors with waveform data
  loadedSensors: Sensor[] = [];
  // currently loaded sensors with all waveform data decimated at a reduced sample rate
  loadedSensorsAll: Sensor[] = [];
  // currently active sensors (shown on screen)
  activeSensors: Sensor[] = [];
  // hashMap for all sensors {sensor_code: <position in allSensors array>}
  // allSensorsMap: { [key: string]: number } = {};
  // context sensor
  contextSensor!: Sensor[];

  /*
  * STATIONS
  */
  // allStations: Station[];
  // allStationsMap: { [key: number]: number } = {};

  /*
  * ARRIVALS
  */
  arrivals: Arrival[] = [];
  batchArrivals: Arrival[] = [];
  allArrivals: Arrival[] = [];
  allArrivalsChanged: ArrivalPartial[] = [];

  waveformSensors!: WaveformSensor[];
  waveformSensorsAll!: WaveformSensor[];
  lastPicksState: any = null;
  timeOrigin!: moment.Moment;
  contextTimeOrigin!: moment.Moment;
  timeEnd!: moment.Moment;
  waveformOrigin!: Origin;
  options: any;
  picksBias = 0;

  selected = -1;
  selectedContextMenu = -1;
  lastSelectedXPosition = -1;
  lastDownTarget: any;  // last mouse down selection
  // lastMouseOver: any;  // last mouse over channel index
  eventTimeOriginHeader!: string;

  chartHeight!: number;
  pageOffsetX = 0;
  pageOffsetY = 30;
  currentEventId!: string;

  ContextMenuChartAction = ContextMenuChartAction;
  waveformShow = true;
  waveformInfo!: WaveformQueryResponse;
  waveformInfoAll!: WaveformQueryResponse;

  constructor(
    public waveformService: WaveformService,
    private _eventApiService: EventApiService,
    private _toastrNotificationService: ToastrNotificationService,
    private _renderer: Renderer2,
    private _ngxSpinnerService: NgxSpinnerService
  ) { }

  async ngOnInit() {

    this.waveformService.currentEvent
      .pipe(
        distinctUntilChanged(),
        skip(1),
        takeUntil(this._unsubscribe)
      )
      .subscribe((val: IEvent | null) => {
        if (val === null) {
          return;
        }
        this.event = val;
      });

    this.waveformService.loading
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((val: boolean) => {
        if (val) {
          this._ngxSpinnerService.show('loadingWaveform', { fullScreen: false, bdColor: 'rgba(51,51,51,0.25)' });
        } else {
          this._ngxSpinnerService.hide('loadingWaveform');
        }
      });
    this.waveformService.loading.next(true);

    this.chartHeight = Math.floor((window.innerHeight - this.pageOffsetY - 30) / globals.chartsPerPage);
    this._addKeyDownEventListeners();
    this._subscribeToolbar();

    this.waveformService.waveformComponentInitialized.next(true);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private async _getInteractiveProcessingStatus() {
    try {
      this.waveformService.batchPicksDisabled.next(true);
      this.waveformService.batchPicks.next(false);
      const response = await this._eventApiService.getInteractiveProcessing(this.event.event_resource_id).toPromise();
      this.batchArrivals = response && response.data ? [...response.data] : [];

      if (this.batchArrivals.length > 0) {
        this.waveformService.batchPicksDisabled.next(false);
        this.waveformService.openBatchDialog();
      }

      if ([BatchStatus.PENDING, BatchStatus.PROCESSING].indexOf(response.status) > -1) {
        const currentList = this.waveformService.interactiveProcessActiveList.getValue();
        const newData: EventBatchMap = {
          batchId: response.id,
          event: this.event
        };

        this.waveformService.interactiveProcessActiveList.next([...currentList, newData]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  private _subscribeToolbar(): void {

    this.waveformService.undoLastZoomOrPanClickedObs
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => this._undoTimeZoomPan());

    this.waveformService.resetAllChartsViewClickedObs
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => this._resetAllChartsViewXY());

    this.waveformService.commonTimeScale
      .pipe(
        distinctUntilChanged(),
        skip(1),
        takeUntil(this._unsubscribe)
      )
      .subscribe((val: boolean) => {
        this._resetAllChartsViewX();
      });

    this.waveformService.commonAmplitudeScale
      .pipe(
        distinctUntilChanged(),
        skip(1),
        takeUntil(this._unsubscribe)
      )
      .subscribe((val: boolean) => {
        this._resetAllChartsViewY();
      });

    this.waveformService.displayComposite
      .pipe(
        distinctUntilChanged(),
        skip(1),
        takeUntil(this._unsubscribe)
      )
      .subscribe((val: boolean) => {
        this._changePage(false);
      });

    this.waveformService.displayRotated
      .pipe(
        distinctUntilChanged(),
        skip(1),
        takeUntil(this._unsubscribe)
      )
      .subscribe((val: boolean) => {
        this._applyFilter();
      });

    this.waveformService.displayDistanceTime
      .pipe(
        distinctUntilChanged(),
        skip(1),
        takeUntil(this._unsubscribe)
      )
      .subscribe((val: boolean) => {
        this._loadEventPage(this._event);
      });

    this.waveformService.predictedPicks
      .pipe(
        distinctUntilChanged(),
        skip(1),
        takeUntil(this._unsubscribe)
      )
      .subscribe((val: boolean) => {
        this._changePage(false);
      });

    this.waveformService.predictedPicksBias
      .pipe(
        distinctUntilChanged(),
        skip(1),
        takeUntil(this._unsubscribe)
      )
      .subscribe((val: boolean) => {
        this._predictedPicksBias();
        this._changePage(false);
      });

    this.waveformService.applyFilterClickedObs
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this._applyFilter();
      });

    this.waveformService.pickingMode
      .pipe(
        distinctUntilChanged(),
        skip(1),
        takeUntil(this._unsubscribe)
      )
      .subscribe(() => {
        this._setPickingCursor();
      });

    this.waveformService.undoLastPickingClickedObs
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => this._undoLastPicking());

    this.waveformService.batchPicks
      .pipe(
        distinctUntilChanged(),
        skip(1),
        takeUntil(this._unsubscribe)
      )
      .subscribe(() => {
        if (this.waveformService.batchPicksDisabled.getValue()) {
          return;
        }
        this._toggleBatchPicks();
        if (this.activeSensors && this.activeSensors.length > 0) {
          this._changePage(true);
        }
      });

    this.waveformService.interactiveProcessClickedObs
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => this._onInteractiveProcess());

    this.waveformService.pageChangedObs
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(async (index: number) => {
        this.waveformService.loading.next(true);
        if (!this._isEventPageAlreadyLoaded(index)) {
          await this._loadWaveformPage(index);
          this.waveformService.currentPage.next(index);
          this._changePage(false);
        } else {
          this.waveformService.currentPage.next(index);
          this._changePage(false);
        }
        this.waveformService.loading.next(false);
      });

    this.waveformService.sidebarOpened
      .pipe(
        distinctUntilChanged(),
        skip(1),
        takeUntil(this._unsubscribe)
      )
      .subscribe(async (val) => {
        this.waveformService.loading.next(true);
        this.waveformShow = false;
        await new Promise(resolve => setTimeout(() => resolve(), 500));
        this.waveformShow = true;
        this._changePage(false);
        this.waveformService.loading.next(false);
      });
  }

  private _isEventPageAlreadyLoaded(index: number) {
    const pageSize = this.waveformService.pageSize.getValue();

    const start = ((index - 1) * (pageSize - 1));
    const end = start + (pageSize - 2);

    if (this.loadedSensors && this.loadedSensors[start] && this.loadedSensors[end]) {
      if (
        this.loadedSensors[start].channels && this.loadedSensors[start].channels.length &&
        this.loadedSensors[end].channels && this.loadedSensors[end].channels.length
      ) {
        return true;
      }
    }
    return false;
  }

  private async _handleEvent(event: IEvent) {

    this.waveformService.interactiveProcessingEnabled.next(false);
    this._getInteractiveProcessingStatus();

    await this.waveformService.isInitialized();

    this.allSensors = JSON.parse(JSON.stringify(this.waveformService.allSensorsOrig));
    this.currentEventId = event.event_resource_id;
    this._destroyCharts();
    this._loadEventFirstPage(event);
  }

  private async _loadEventFirstPage(event: IEvent) {
    if (!event) {
      console.error(`No event`);
      return;
    }

    if (!event.waveform_file && !event.variable_size_waveform_file) {
      console.error(`No waveform_file or variable_size_waveform_file in event`);
      return;
    }

    const preferred_origin_id = event.preferred_origin_id;
    this.waveformService.displayDistanceTime.next(false);
    this.waveformService.loading.next(true);
    this.waveformService.loadedAll.next(false);
    this.waveformService.currentPage.next(1);

    try {

      // get waveform query
      const waveformQuery: EventWaveformQuery = {
      };

      this.waveformInfo = await this._eventApiService.getWaveformInfo(event.event_resource_id, waveformQuery).toPromise();

      if (!this.waveformInfo) {
        console.error(`no waveformInfo`);
        return;
      }

      this.waveformService.maxPages.next(this.waveformInfo.num_of_pages);

      const waveformUrl = this.waveformInfo.pages[this.waveformService.currentPage.getValue() - 1];
      const contextUrl = this.waveformInfo.context;
      const eventFile = await this._eventApiService.getWaveformFile(waveformUrl).toPromise();
      this.waveformSensors = this.waveformInfo.sensors;

      if (!eventFile) {
        console.error(`no eventFile`);
        return;
      }

      if (this.currentEventId !== event.event_resource_id) {
        console.log(`changed event during loading`);
        return;
      }

      const eventData = WaveformUtil.parseMiniseed(eventFile, false);

      if (eventData && eventData.sensors) {

        WaveformUtil.setSensorsEnabled(eventData.sensors, this.allSensors);

        WaveformUtil.rotateSensors(eventData.sensors, this.allSensors, this.waveformSensors);

        // filter and recompute composite traces
        this.loadedSensors = WaveformUtil.addCompositeTrace(
          this._filterData(eventData.sensors, false, this.waveformService.displayRotated.getValue()));

        this.waveformService.loadedSensors.next(this.loadedSensors);
        this.loadedSensorsAll = [];
        this.waveformService.loadedSensorsAll.next(this.loadedSensorsAll);
        this.waveformService.loadedPages.next(1);
        this.timeOrigin = eventData.timeOrigin;

        if (!moment.isMoment(this.timeOrigin) || !this.timeOrigin.isValid()) {
          console.error(`invalid timeOrigin`);
          const msg_str = `Invalid traces origin time`;
          this._toastrNotificationService.warning(msg_str);
          return;
        }

        this.timeEnd = moment(this.timeOrigin).add(globals.fixedDuration, 'seconds');

        if (this.loadedSensors.length > 0) {

          // get origins
          const originsQuery: EventOriginsQuery = {
            site_code: this.waveformService.site.getValue(),
            network_code: this.waveformService.network.getValue(),
            event_id: event.event_resource_id
          };

          const origins = await this._eventApiService.getOrigins(originsQuery).toPromise();
          let origin = WaveformUtil.findValue(origins, 'origin_resource_id', preferred_origin_id);

          if (!origin) {
            this._toastrNotificationService.warning(`Event preferred origin from catalog not found`, 'Warning');
            console.error('No event preferred origin found');
            origin = WaveformUtil.findValue(origins, 'preferred_origin', true);
            return;
          }

          this.waveformOrigin = origin;

          const arrivalsQuery: EventArrivalsQuery = {
            site_code: this.waveformService.site.getValue(),
            network_code: this.waveformService.network.getValue(),
            event_id: event.event_resource_id,
            origin_id: origin.origin_resource_id
          };

          // get arrivals, picks for preferred origin
          this.arrivals = await this._eventApiService.getArrivals(arrivalsQuery).toPromise();

          if (this.currentEventId !== event.event_resource_id) {
            console.log(`changed event during loading`);
            return;
          }

          if (this.waveformService.batchPicks.getValue()) {
            this.allArrivals = [...this.batchArrivals];
          } else {
            this.allArrivals = [...this.arrivals];
          }

          this.allArrivalsChanged = JSON.parse(JSON.stringify(this.allArrivals));

          // load predicted
          this.allSensors = WaveformUtil.addPredictedPicksDataToSensors(
            this.allSensors,
            this.waveformSensors,
            this.timeOrigin,
            this.timeEnd,
            this.waveformOrigin.time_utc
          );

          // add arrival picks
          this.allSensors = WaveformUtil.addArrivalsPickDataToSensors(
            this.allSensors,
            this.allArrivals,
            this.timeOrigin
          );

          this.loadedSensors = WaveformUtil.mapSensorInfoToLoadedSensors(this.loadedSensors, this.allSensors, this.waveformService.allSensorsMap);

          this.picksBias = 0;

          try {
            const contextFile = await this._eventApiService.getWaveformFile(contextUrl).toPromise();

            if (this.currentEventId !== event.event_resource_id) {
              console.log(`changed event during loading`);
              return;
            }

            if (contextFile) {
              const contextData = WaveformUtil.parseMiniseed(contextFile, true);

              if (!moment.isMoment(contextData.timeOrigin) || !contextData.timeOrigin.isValid()) {
                console.log(`invalid contextTimeOrigin`);
                const msg_str = `Invalid context trace origin time`;
                this._toastrNotificationService.warning(msg_str);
              }

              if (contextData && contextData.sensors) {
                WaveformUtil.setSensorsEnabled(contextData.sensors, this.allSensors);
                WaveformUtil.rotateSensors(contextData.sensors, this.allSensors, this.waveformSensors);
                this.contextSensor = WaveformUtil.addCompositeTrace(
                  this._filterData(contextData.sensors, true, this.waveformService.displayRotated.getValue()));
                this.contextSensor = WaveformUtil.mapSensorInfoToLoadedSensors(this.contextSensor, this.allSensors, this.waveformService.allSensorsMap);
                this.contextTimeOrigin = contextData.timeOrigin;
              }
            }
          } catch (err) {
            this._toastrNotificationService.error(err, 'Could not load context file');
            console.error(err);
          }

          this._changePage(true);

          this.eventTimeOriginHeader = `
              Site: ${this.waveformService.site.getValue()}
              Network: ${this.waveformService.network.getValue()}
              ${moment(eventData.timeOrigin).utc().utcOffset(this.timezone).format('YYYY-MM-DD HH:mm:ss.S')}
              `;
        }
      }
    } catch (err) {
      console.error(err);
      this._toastrNotificationService.error(err, 'Could not load waveform data');
    } finally {
      if (this.currentEventId === event.event_resource_id) {
        this.waveformService.loading.next(false);
      }
    }
  }

  private async _loadWaveformPage(idx: number) {

    if (!this.waveformInfo || !this.waveformInfo.pages[idx - 1]) {
      console.error(`no waveformInfo or waveform file for current page ${idx}`);
      return;
    }

    const eventFile = await this._eventApiService.getWaveformFile(this.waveformInfo.pages[idx - 1]).toPromise();
    const eventData = WaveformUtil.parseMiniseed(eventFile, false);

    if (eventData && eventData.sensors && eventData.sensors.length > 0) {

      if (!moment.isMoment(eventData.timeOrigin) || !eventData.timeOrigin.isValid()) {
        console.log(`invalid timeOrigin`);
        const msg_str = `Invalid traces origin time on page`;
        this._toastrNotificationService.warning(msg_str);
      }

      if (!this.timeOrigin.isSame(eventData.timeOrigin, 'second')) {
        console.log('Warning: Different origin time on page: ', idx);
      }

      WaveformUtil.setSensorsEnabled(eventData.sensors, this.allSensors);

      WaveformUtil.rotateSensors(eventData.sensors, this.allSensors, this.waveformSensors);

      // filter and recompute composite traces
      let sensors = WaveformUtil.addCompositeTrace(
        this._filterData(eventData.sensors, false, this.waveformService.displayRotated.getValue()));
      sensors = WaveformUtil.mapSensorInfoToLoadedSensors(sensors, this.allSensors, this.waveformService.allSensorsMap);

      for (let j = 0; j < sensors.length; j++) {
        this.loadedSensors[(this.waveformService.pageSize.getValue() - 1) * (idx - 1) + j] = sensors[j];
      }
    }

    this.waveformService.loadedPages.next(this.waveformService.loadedPages.getValue() + 1);
  }

  private _renderPage() {

    if (this.waveformService.displayDistanceTime.getValue()) {
      this.activeSensors = this.loadedSensorsAll;
      this._renderDistanceTimeChart();
      return;
    }

    const pageNumber = this.waveformService.currentPage.getValue();
    const pageSize = this.waveformService.pageSize.getValue() - 1;
    const numPages = this.waveformService.maxPages.getValue();
    if (pageNumber > 0 && pageNumber <= numPages) {

      const start = (pageNumber - 1) * pageSize;
      const end = Math.min(pageNumber * pageSize, this.loadedSensors.length);
      this.activeSensors = this.loadedSensors.slice(start, end);
      this.activeSensors = this.activeSensors.filter(activeSensor => activeSensor.channels && activeSensor.channels.length > 0);
      // context trace is last
      this.activeSensors.push(this.contextSensor[0]);

      this._predicatePicks();
      this._renderCharts();
      this._renderContextChart();
      this._setChartKeys();
      for (const sensor of this.activeSensors) {
        if (sensor.chart !== undefined) {
          sensor.chart.options.viewportMinStack = this._xViewPortMinStack;
          sensor.chart.options.viewportMaxStack = this._xViewportMaxStack;
        }
      }
    }
  }

  private _changePage(reset: boolean) {

    if (!reset) {
      this._updateArrivalWithPickData();
    }

    // reset last selected channel
    this.lastDownTarget = null;
    // reset picks last known state
    this.lastPicksState = null;
    if (reset) { // first page , new event
      this._resetZoomStack();
    } else {             // remember zoom history
      if (
        this.activeSensors &&
        this.activeSensors[0] &&
        this.activeSensors[0].chart &&
        this.activeSensors[0].chart.options
      ) {
        if (this.activeSensors[0].chart.options.viewportMinStack) {
          this._xViewPortMinStack = this.activeSensors[0].chart.options.viewportMinStack;
        }
        if (this.activeSensors[0].chart.options.viewportMaxStack) {
          this._xViewportMaxStack = this.activeSensors[0].chart.options.viewportMaxStack;
        }
      }
    }
    this._destroyCharts();
    this._renderPage();
    this._setPickingCursor();
  }

  private async _loadEventPage(event: IEvent) {
    if (!event) {
      console.error(`No event`);
      return;
    }

    if (!event.waveform_file) {
      console.error(`No waveform_file in event`);
      return;
    }

    this.waveformService.loading.next(true);

    try {

      if (this.waveformService.displayDistanceTime.getValue() && this.loadedSensorsAll.length === 0) {
        // get waveform query (decimated data set)
        const waveformQuery: EventWaveformQuery = {
          traces_per_page: 500,
          sampling_rate: globals.sampleRateForDistanceMode
        };

        this.waveformInfoAll = await this._eventApiService.getWaveformInfo(this.currentEventId, waveformQuery).toPromise();

        if (!this.waveformInfoAll) {
          console.error(`no waveformInfoAll`);
          return;
        }

        const waveformUrl = this.waveformInfoAll.pages[0];
        const eventFile = await this._eventApiService.getWaveformFile(waveformUrl).toPromise();
        this.waveformSensorsAll = this.waveformInfoAll.sensors;

        if (!eventFile) {
          console.error(`no eventFile`);
          return;
        }

        if (this.currentEventId !== event.event_resource_id) {
          console.log(`changed event during loading`);
          return;
        }

        const eventData = WaveformUtil.parseMiniseed(eventFile, false);

        if (eventData && eventData.sensors) {

          WaveformUtil.setSensorsEnabled(eventData.sensors, this.allSensors);

          WaveformUtil.rotateSensors(eventData.sensors, this.allSensors, this.waveformSensorsAll);

          // filter and recompute composite traces
          this.loadedSensorsAll = WaveformUtil.addCompositeTrace(
            this._filterData(eventData.sensors, false, this.waveformService.displayRotated.getValue()));

          this.waveformService.loadedSensorsAll.next(this.loadedSensorsAll);

          if (this.loadedSensorsAll.length > 0) {

            this.loadedSensorsAll = WaveformUtil.mapSensorInfoToLoadedSensors(this.loadedSensorsAll, this.allSensors, this.waveformService.allSensorsMap);
          }
        }

      }

      this._destroyCharts();
      this._renderPage();
      this._setPickingCursor();

    } catch (err) {
      console.error(err);
      this._toastrNotificationService.error(err, 'Could not load waveform data');
    } finally {
      if (this.currentEventId === event.event_resource_id) {
        this.waveformService.loading.next(false);
      }
    }
  }


  private async _toggleBatchPicks() {
    if (this.waveformService.batchPicks.getValue()) {
      this.allArrivals = [...this.batchArrivals];
      this.waveformService.batchPicks.next(true);
    } else {
      this.allArrivals = [...this.arrivals];
      this.waveformService.batchPicks.next(false);
    }

    this.allArrivalsChanged = JSON.parse(JSON.stringify(this.allArrivals));
    this.allSensors = WaveformUtil.removeArrivalsPickDataFromSensors(this.allSensors);

    this.allSensors = WaveformUtil.addArrivalsPickDataToSensors(
      this.allSensors,
      this.allArrivals,
      this.timeOrigin
    );
    this.loadedSensors = WaveformUtil.mapSensorInfoToLoadedSensors(this.loadedSensors, this.allSensors, this.waveformService.allSensorsMap);
  }

  private async _onInteractiveProcess() {
    try {
      this.waveformService.interactiveProcessLoading.next(true);
      this._updateArrivalWithPickData();
      this.waveformService.interactiveProcessingEnabled.next(false);
      console.log('batch starting:', this.currentEventId, this.allArrivalsChanged);
      const response = await this._eventApiService.startInteractiveProcessing(this.currentEventId, { data: this.allArrivalsChanged }).toPromise();
      const newData: EventBatchMap = {
        batchId: response.id,
        event: this.event
      };

      const interactiveProcessActiveList = this.waveformService.interactiveProcessActiveList.getValue();
      this.waveformService.interactiveProcessActiveList.next([...interactiveProcessActiveList, newData]);

      const interactiveProcessCurrentList = this.waveformService.interactiveProcessCurrentList.getValue();
      this.waveformService.interactiveProcessCurrentList.next([...interactiveProcessCurrentList, newData]);

      console.log('batch started:', response);
    } catch (err) {
      console.error(err);
      this._toastrNotificationService.error(`${err.error.message}`, 'Error on Interactive Processing');
      this.waveformService.interactiveProcessLoading.next(false);
    }
  }

  private _destroyCharts() {

    if (this.activeSensors) {
      for (const activeSensor of this.activeSensors) {
        if (activeSensor.chart !== undefined) {
          activeSensor.chart.destroy();
          const elem = document.getElementById(activeSensor.container);
          if (elem && elem.parentElement) {
            elem.parentElement.removeChild(elem);
          }
        }
      }
    }
  }

  private _renderDistanceTimeChart() {

    // Chart Options, Render
    if (!moment.isMoment(this.timeOrigin) || !this.timeOrigin.isValid()) {
      console.error('invalid timeOrigin');
      const msg_str = `Invalid traces origin time`;
      this._toastrNotificationService.warning(msg_str);
      return;
    }

    this.activeSensors[0].container = 'container0';
    const pageHeight = this.chartHeight * globals.chartsPerPage;

    if (document.querySelectorAll('#' + this.activeSensors[0].container).length === 0) {
      const div = document.createElement('div');
      div.id = this.activeSensors[0].container;
      div.style.height = pageHeight + 'px';
      div.style.maxWidth = '2000px';
      div.style.margin = '0px auto';
      this._renderer.appendChild(this._waveformContainer.nativeElement, div);
    }

    const data = [];
    const maxTraceHeight = this._getMaxDistanceAxisY() / 100; // scaling factor
    for (let i = 0; i < this.activeSensors.length - 1; i++) {
      const yMax = this._getYmax(i);
      const distance = this.activeSensors[i].p_ray_length ?
        this.activeSensors[i].p_ray_length : this.activeSensors[i].s_ray_length ?
        this.activeSensors[i].s_ray_length : null;
      const hasCompositeChannel = (this.activeSensors[i].channels.findIndex((el: Channel) =>
        el.channel_id === globals.compositeChannelCode) === -1 ? false : true);
      for (const channel of this.activeSensors[i].channels) {
        if ((!this.waveformService.displayComposite.getValue() && channel.channel_id !== globals.compositeChannelCode) ||
          (this.waveformService.displayComposite.getValue() && channel.channel_id === globals.compositeChannelCode) ||
          (this.waveformService.displayComposite.getValue() && !hasCompositeChannel)) {
          const dataArray = [];
          if (channel.enabled && this.activeSensors[i].enabled && distance) {
            for (const [index, el] of channel.data.entries()) {
              dataArray.push({
                x: el.x,
                y: el.y * maxTraceHeight / yMax +  distance,
              });
            }
            data.push(
              {
                index: i,
                name: this._getSensorComponentDistanceTitle(this.activeSensors[i], channel.channel_id),
                type: 'line',
                markerType: 'none',
                // @ts-ignore
                color: globals.linecolor[channel.channel_id.toUpperCase()],
                lineThickness: globals.lineThickness,
                // highlightEnabled: true,
                dataPoints: dataArray,
                /*
                mouseover: function(e) {
                  this.lastMouseOver = e.dataSeries.index;
                }*/
              });
          }
        }
      }
      if (distance) {
        const picksP = [];
        const picksS = [];
        for (const pick of this.activeSensors[i].picks) {
          if (pick.label === PickKey.P) {
            picksP.push({
              x: pick.value,
              y: distance + maxTraceHeight / 2,
            });
            picksP.push({
              x: pick.value,
              y: distance - maxTraceHeight / 2,
            });
            data.push(
              {
                type: 'line',
                markerType: 'none',
                // @ts-ignore
                color: pick.color,
                lineThickness: pick.thickness,
                dataPoints: picksP,
              });
          } else if (pick.label === PickKey.S) {
            picksS.push({
              x: pick.value,
              y: distance + maxTraceHeight / 2,
            });
            picksS.push({
              x: pick.value,
              y: distance - maxTraceHeight / 2,
            });
            data.push(
              {
                type: 'line',
                markerType: 'none',
                // @ts-ignore
                color: pick.color,
                lineThickness: pick.thickness,
                dataPoints: picksS,
              });
          }
        }
      }
    }
    const options = {
      zoomEnabled: true,
      zoomType: 'xy',
      animationEnabled: false,
      toolTip: {
        shared: false,
        contentFormatter: function (e: any) {
          const content = e && e.entries && e.entries.length > 0 ? '<strong>' + e.entries[0].dataSeries.name + '</strong>' : '';
          return content;
        }
      },
      subtitles: [{
        text: moment(this.timeOrigin).utc().utcOffset(this.timezone).format('YYYY-MM-DD HH:mm:ss'),
        dockInsidePlotArea: true,
        fontSize: 14,
        fontFamily: 'tahoma',
        fontColor: 'black',
        horizontalAlign: 'left',
        verticalAlign: 'bottom'
      }],
      axisX: {
        minimum: this.timeOrigin.millisecond() * 1000,
        maximum: this._getXmax(0),
        lineThickness: globals.axis.lineThickness,
        lineColor: globals.axis.lineColor,
        gridThickness: 0,
        includeZero: true,
        labelFontSize: 16,
        labelAutoFit: false,
        labelWrap: false,
        labelFormatter: (e: any) => {
          return e.value / WaveformUtil.convXUnits + ' s';
        },
        crosshair: {
          enabled: true,
          snapToDataPoint: true,
          labelFormatter: (e: any) => {
            return e.value / WaveformUtil.convXUnits;
          },
        }
      },
      axisY: {
        minimum: 0,
        maximum: this._getMaxDistanceAxisY() + maxTraceHeight,
        title: 'Distance (m)',
        titleFontSize: 18,
        labelFontSize: 16,
        gridThickness: 0,
        lineThickness: globals.axis.lineThickness,
        lineColor: globals.axis.lineColor,
        includeZero: true,
        crosshair: {
          enabled: true,
          snapToDataPoint: true
        }
      },
      data: data
    };

    this.activeSensors[0].chart = new CanvasJS.Chart(this.activeSensors[0].container, options);
    // @ts-ignore
    this.activeSensors[0].chart.render();
  }

  private _getMaxDistanceAxisY() {
    const maxDistance = Math.max(...this.activeSensors.map(o => o.p_ray_length ? o.p_ray_length : 0), 0);
    return maxDistance;
  }

  private _renderCharts() {

    // Chart Options, Render
    if (!moment.isMoment(this.timeOrigin) || !this.timeOrigin.isValid()) {
      console.error('invalid timeOrigin');
      const msg_str = `Invalid traces origin time`;
      this._toastrNotificationService.warning(msg_str);
      return;
    }

    for (let i = 0; i < this.activeSensors.length - 1; i++) {

      this.activeSensors[i].container = 'container' + i.toString();

      if (document.querySelectorAll('#' + this.activeSensors[i].container).length === 0) {
        const div = document.createElement('div');
        div.id = this.activeSensors[i].container;
        div.style.height = this.chartHeight + 'px';
        div.style.maxWidth = '2000px';
        div.style.margin = '0px auto';
        this._renderer.appendChild(this._waveformContainer.nativeElement, div);
      }

      const data = [];
      const hasCompositeChannel = (this.activeSensors[i].channels.findIndex((el: Channel) =>
        el.channel_id === globals.compositeChannelCode) === -1 ? false : true);
      /*
      const hasDisabledChannels = (!this.activeSensors[i].enabled) ||
        (this.activeSensors[i].channels.findIndex((el: Channel) => el.enabled === false) === -1 ? false : true);
        */
      for (const channel of this.activeSensors[i].channels) {
        if ((!this.waveformService.displayComposite.getValue() && channel.channel_id !== globals.compositeChannelCode) ||
          (this.waveformService.displayComposite.getValue() && channel.channel_id === globals.compositeChannelCode) ||
          (this.waveformService.displayComposite.getValue() && !hasCompositeChannel)) {
          const dataArray = [];
          if (!channel.enabled || !this.activeSensors[i].enabled) {
            for (const el of channel.data) {
              dataArray.push({
                x: el.x,
                y: 0
              });
            }
          }
          data.push(
            {
              index: i,
              name: channel.enabled && this.activeSensors[i].enabled ?
                channel.channel_id : channel.channel_id + ' (disabled)',
              type: 'line',
              markerType: 'none',
              // @ts-ignore
              color: globals.linecolor[channel.channel_id.toUpperCase()],
              lineThickness: globals.lineThickness,
              showInLegend: true,
              // highlightEnabled: true,
              dataPoints: channel.enabled && this.activeSensors[i].enabled ? channel.data : dataArray,
              /*
              mouseover: function(e) {
                this.lastMouseOver = e.dataSeries.index;
              }*/
            });
        }
      }

      let options = {};

      if (this.activeSensors[i].channels.length === 0) {
        const msg_str = `Invalid trace` + (this.activeSensors[i].sensor_code ? ' for sensor: ' + this.activeSensors[i].sensor_code : '');
        this._toastrNotificationService.warning(msg_str);
      } else {
        const yMax = this._getYmax(i);
        // check range decide UOM and y scaling factor
        const motionType = this._getSensorMotionType(this.activeSensors[i]);
        let scaleY = WaveformUtil.convYUnits;
        let uom = motionType === GroundMotionType.VELOCITY ? WaveformUtil.defaultUnits + '/s' :
          motionType === GroundMotionType.ACCELERATION ? WaveformUtil.defaultUnits + '/s' + '\u00B2' : '??';
        if (yMax * scaleY < 0.002) {
          scaleY = scaleY * 1000;
          uom = uom.replace(WaveformUtil.defaultUnits, 'um');
        }
        if (yMax * scaleY > 99.) {
          scaleY = scaleY / 1000;
          uom = uom.replace(WaveformUtil.defaultUnits, 'm');
        }

        options = {
          zoomEnabled: true,
          zoomType: 'x',
          animationEnabled: false,
          rangeChanged: (e: any) => {
            this._bHoldEventTrigger = true;
            if (!e.chart.options.viewportMinStack) {
              e.chart.options.viewportMinStack = [];
              e.chart.options.viewportMaxStack = [];
            }
            if (e.trigger === 'zoom') {
              if (this.waveformService.zoomAll.getValue()) {
                this._xZoomAllCharts(e.axisX[0].viewportMinimum, e.axisX[0].viewportMaximum);
              } else {
                e.chart.options.viewportMinStack.push(e.axisX[0].viewportMinimum);
                e.chart.options.viewportMaxStack.push(e.axisX[0].viewportMaximum);
              }
            }
            if (e.trigger === 'reset') {
              this._resetChartViewX(e.chart);
            }
            this._waveformContainer.nativeElement.focus();

          },
          title: {
            text: this._getSensorDistanceTitle(this.activeSensors[i]),
            dockInsidePlotArea: true,
            fontSize: 12,
            fontFamily: 'tahoma',
            fontColor: 'black',
            horizontalAlign: 'left'
          },
          subtitles: [{
            text: i === 0 ? moment(this.timeOrigin).utc().utcOffset(this.timezone).format('YYYY-MM-DD HH:mm:ss') : '',
            dockInsidePlotArea: true,
            fontSize: 10,
            fontFamily: 'tahoma',
            fontColor: 'black',
            horizontalAlign: 'left'
          }],
          legend: {
            dockInsidePlotArea: true,
            horizontalAlign: 'left'
          },
          toolTip: {
            enabled: false
          },
          axisX: {
            minimum: this.timeOrigin.millisecond() * 1000,
            maximum: this._getXmax(i),
            lineThickness: globals.axis.lineThickness,
            lineColor: globals.axis.lineColor,
            viewportMinimum: this.waveformService.zoomAll.getValue() && this._xViewPortMinStack.length > 0 ?
              this._xViewPortMinStack[this._xViewPortMinStack.length - 1] : this._getXvpMin(),
            viewportMaximum: this.waveformService.zoomAll.getValue() && this._xViewportMaxStack.length > 0 ?
              this._xViewportMaxStack[this._xViewportMaxStack.length - 1] : this._getXvpMax(),
            includeZero: true,
            labelAutoFit: false,
            labelWrap: false,
            labelFormatter: (e: any) => {
              return e.value / WaveformUtil.convXUnits + ' s';
            },
            crosshair: {
              enabled: false,
              snapToDataPoint: true,
              labelFormatter: (e: any) => {
                return e.value / WaveformUtil.convXUnits;
              },
            },
            stripLines: this.activeSensors[i].picks
          },
          axisY: {
            minimum: -yMax,
            maximum: yMax,
            title: uom,
            gridThickness: 0,
            lineThickness: globals.axis.lineThickness,
            lineColor: globals.axis.lineColor,
            interval: yMax / 2,
            includeZero: true,
            labelFormatter: (e: any) => {
              const val = e.value * scaleY;
              if (Math.abs(Number(val.toPrecision(1))) < 10) {
                return val === 0 ? 0 : Number(val.toPrecision(1)).toFixed(3);
              }
              return Number(val.toPrecision(2)).toFixed(2);
            },
            crosshair: {
              enabled: false,
              snapToDataPoint: true,
              labelFormatter: (e: any) => {
                const val = e.value * scaleY;
                return val === 0 ? 0 : CanvasJS.formatNumber(val, '##0.000');
              },
            }
          },
          data: data
        };
      }
      this.activeSensors[i].chart = new CanvasJS.Chart(this.activeSensors[i].container, options);
      // @ts-ignore
      this.activeSensors[i].chart.render();
    }
  }

  private _getSensorDistanceTitle(sensor: Sensor) {
    let sensorTitleText = this._getSensorTitle(sensor);
    const sensorDistance = this._getSensorDistance(sensor);
    sensorTitleText += sensorDistance ? ' -- ' + sensorDistance : ``;
    return sensorTitleText;
  }

  private _getSensorComponentDistanceTitle(sensor: Sensor, component: String) {
    let sensorTitleText = this._getSensorTitle(sensor);
    const sensorDistance = this._getSensorDistance(sensor);
    sensorTitleText += component ? ': ' + component : ``;
    sensorTitleText += sensorDistance ? ' -- ' + sensorDistance : ``;
    return sensorTitleText;
  }

  private _getSensorDistance(sensor: Sensor) {
    let sensorDistanceText = '';
    const distance = sensor.p_ray_length ? sensor.p_ray_length : sensor.s_ray_length ? sensor.s_ray_length : null;
    sensorDistanceText += sensor && distance ? distance.toFixed(0) + 'm' : ``;
    return sensorDistanceText;
  }

  private _getSensorTitle(sensor: Sensor) {
    let sensorTitleText = ``;
    try {
      const station = sensor && sensor.station && sensor.station.id ? this.waveformService.allStations[this.waveformService.allStationsMap[sensor.station.id]] : null;
      sensorTitleText += station ? station.code : `??`;
    } catch (err) {
      sensorTitleText += `??`;
    }

    sensorTitleText += `.`;
    sensorTitleText += sensor && sensor.location_code ? sensor.location_code : `??`;
    sensorTitleText += ` `;
    sensorTitleText += sensor && sensor.code ? `(${sensor.code})` : (sensor.sensor_code ? `(${sensor.sensor_code})` : `(??)`);

    return sensorTitleText;
  }

  private _getSensorMotionType(sensor: Sensor) {
    let sensorMotionType = ``;

    sensorMotionType = sensor && sensor.components && sensor.components[0] &&
      sensor.components[0].sensor_type && sensor.components[0].sensor_type.motion_type ?
      sensor.components[0].sensor_type.motion_type : `??`;
    sensorMotionType = sensorMotionType === MotionType.MM_PER_S_VELOCITY ? GroundMotionType.VELOCITY :
      sensorMotionType === MotionType.MM_PER_S_2_ACCELERATION ? GroundMotionType.ACCELERATION : sensorMotionType;

    return sensorMotionType;
  }

  private _getSensorUnits(sensor: Sensor) {
    let sensorUnitsText = ``;

    sensorUnitsText = sensor && sensor.components && sensor.components[0] &&
      sensor.components[0].sensor_type && sensor.components[0].sensor_type.motion_type ?
      sensor.components[0].sensor_type.motion_type : `??`;
    sensorUnitsText = sensorUnitsText.indexOf(' ') > 0 ? sensorUnitsText.substr(0, sensorUnitsText.indexOf(' ')) : sensorUnitsText;
    sensorUnitsText = sensorUnitsText.replace('^2', '\u00B2');

    return sensorUnitsText;
  }

  private _addKeyDownEventListeners() {

    document.addEventListener('keydown', (e: any) => {

      const target = e.target || e.srcElement;
      if (!/INPUT|TEXTAREA|SELECT/.test(target.nodeName)) {

        if (e.keyCode === 80) {  // p
          this.waveformService.predictedPicks.next(!this.waveformService.predictedPicks.getValue());
        }

        if (e.keyCode === 90) {  // z
          this.waveformService.commonTimeScale.next(!this.waveformService.commonTimeScale.getValue());
        }

        if (e.keyCode === 88) {   // x
          this.waveformService.commonAmplitudeScale.next(!this.waveformService.commonAmplitudeScale.getValue());
        }

        if (e.keyCode === 68) {   // d
          if (this.waveformService.pickingMode.getValue() === 'P') {
            this.waveformService.pickingMode.next(null);
          } else {
            this.waveformService.pickingMode.next(PickKey.P);
          }
        }

        if (e.keyCode === 70) {   // f
          if (this.waveformService.pickingMode.getValue() === 'S') {
            this.waveformService.pickingMode.next(null);
          } else {
            this.waveformService.pickingMode.next(PickKey.S);
          }
        }

        if (e.keyCode === 83) {   // s, undo picking
          this._undoLastPicking();
        }

        if (e.keyCode === 72) {   // h, help
          this.waveformService.openHelpDialog();
        }

        if (e.keyCode === 39) {  // right arrow moves pick to right
          const pickingMode = this.waveformService.pickingMode.getValue();
          if (pickingMode !== null && this.lastDownTarget !== null && this.lastDownTarget > -1) {
            const step = globals.pickTimeStep * 1000; // in microseconds
            if (e.shiftKey) { // shift key - fast mode - by 10 * step
              this._movePick(this.lastDownTarget, pickingMode, step * 10, true, true);
            } else { // by step
              this._movePick(this.lastDownTarget, pickingMode, step, true, true);
            }
          }
        }

        if (e.keyCode === 37) {  // left arrow moves pick to left
          const pickingMode = this.waveformService.pickingMode.getValue();
          if (pickingMode !== null && this.lastDownTarget !== null && this.lastDownTarget > -1) {
            const step = globals.pickTimeStep * 1000; // in microseconds
            if (e.shiftKey) { // shift key - fast mode - by 10 * step
              this._movePick(this.lastDownTarget, pickingMode, -step * 10, true, true);
            } else { // by step
              this._movePick(this.lastDownTarget, pickingMode, -step, true, true);
            }
          }
        }

        if (e.keyCode === 49 || e.keyCode === 97) {
          if (
            this.waveformService.currentPage.getValue() - 1 <= 0 ||
            this.waveformService.loading.getValue()
          ) {
            return;
          }

          this.waveformService.pageChanged.next(this.waveformService.currentPage.getValue() - 1);
        }

        if (e.keyCode === 50 || e.keyCode === 98) {
          if (
            this.waveformService.currentPage.getValue() + 1 > this.waveformService.maxPages.getValue() ||
            this.waveformService.loading.getValue()
          ) {
            return;
          }

          this.waveformService.pageChanged.next(this.waveformService.currentPage.getValue() + 1);
        }
      }
    }, false);
  }

  private _renderContextChart() {

    // Chart Options, Render
    if (this.contextSensor.length === 0 || this.contextSensor[0].channels.length === 0) {
      this._toastrNotificationService.warning(`Invalid context trace`);
      return;
    }

    if (!moment.isMoment(this.contextTimeOrigin) || !this.contextTimeOrigin.isValid()) {
      console.error('invalid contextTimeOrigin');
      const msg_str = `Invalid context trace origin time`;
      this._toastrNotificationService.warning(msg_str);
      return;
    }

    if (!moment.isMoment(this.timeOrigin) || !this.timeOrigin.isValid()) {
      console.error('invalid timeOrigin');
      const msg_str = `Invalid traces origin time`;
      this._toastrNotificationService.warning(msg_str);
      return;
    }

    const i = this.activeSensors.length - 1;

    this.activeSensors[i].container = 'container' + i.toString();

    if (document.querySelectorAll('#' + this.activeSensors[i].container).length === 0) {
      const div = document.createElement('div');
      div.id = this.activeSensors[i].container;
      div.style.height = this.chartHeight + 'px';
      div.style.maxWidth = '2000px';
      div.style.margin = '0px auto';
      this._renderer.appendChild(this._waveformContainer.nativeElement, div);
    }

    const data = [];
    for (const channel of this.activeSensors[i].channels) {
      if ((!this.waveformService.displayComposite.getValue()
        && channel.channel_id !== globals.compositeChannelCode + '...CONTEXT')
        || (this.waveformService.displayComposite.getValue() && channel.channel_id === globals.compositeChannelCode + '...CONTEXT')
        || this.activeSensors[i].channels.length === 1) {
        data.push(
          {
            name: channel.channel_id,
            type: 'line',
            markerType: 'none',
            color: this.waveformService.displayComposite.getValue() ? globals.context.linecolor :
              // @ts-ignore
              globals.linecolor[channel.channel_id.toUpperCase().replace('...CONTEXT', '')],
            lineThickness: globals.lineThickness,
            showInLegend: true,
            // highlightEnabled: true,
            dataPoints: channel.data
          });
      }
    }

    const yMax = this._getYmax(i);
    // check range decide UOM and y scaling factor
    const motionType = this._getSensorMotionType(this.activeSensors[i]);
    let scaleY = WaveformUtil.convYUnits;
    let uom = motionType === GroundMotionType.VELOCITY ? WaveformUtil.defaultUnits + '/s' :
      motionType === GroundMotionType.ACCELERATION ? WaveformUtil.defaultUnits + '/s' + '\u00B2' : '??';
    if (yMax * scaleY < 0.002) {
      scaleY = scaleY * 1000;
      uom = uom.replace(WaveformUtil.defaultUnits, 'um');
    }
    if (yMax * scaleY > 99.) {
      scaleY = scaleY / 1000;
      uom = uom.replace(WaveformUtil.defaultUnits, 'm');
    }


    const timeOriginValue = WaveformUtil.calculateTimeOffset(this.timeOrigin, this.contextTimeOrigin);
    const startTime = this.contextSensor[0].channels[0].start;
    const startTimeLabel = moment.isMoment(startTime) && startTime.isValid() ?
      startTime.utc().utcOffset(this.timezone).format('YYYY-MM-DD HH:mm:ss') : '';
    const optionsContext = {
      zoomEnabled: true,
      animationEnabled: false,
      title: {
        text: this._getSensorDistanceTitle(this.activeSensors[i]),
        dockInsidePlotArea: true,
        fontSize: 12,
        fontFamily: 'tahoma',
        fontColor: 'black',
        horizontalAlign: 'left'
      },
      subtitles: [{
        text: startTimeLabel,
        dockInsidePlotArea: true,
        fontSize: 10,
        fontFamily: 'tahoma',
        fontColor: 'black',
        horizontalAlign: 'left'
      }],
      legend: {
        dockInsidePlotArea: true,
        horizontalAlign: 'left'
      },
      toolTip: {
        enabled: false
      },
      axisX: {
        minimum: this.contextTimeOrigin.millisecond() * 1000,
        maximum: Math.max(
          this.contextSensor[0].channels[0].microsec + this.contextSensor[0].channels[0].duration,
          WaveformUtil.calculateTimeOffset(this.timeEnd, this.contextTimeOrigin)),
        lineThickness: globals.axis.lineThickness,
        lineColor: globals.axis.lineColor,
        viewportMinimum: this._xViewPortMinStack.length > 0 ?
          this._xViewPortMinStack[this._xViewPortMinStack.length - 1] : null,
        viewportMaximum: this.waveformService.zoomAll.getValue() && this._xViewportMaxStack.length > 0 ?
          this._xViewportMaxStack[this._xViewportMaxStack.length - 1] : null,
        includeZero: true,
        labelAutoFit: false,
        labelWrap: false,
        labelFormatter: (e: any) => {
          return e.value / WaveformUtil.convXUnits + ' s';
        },
        crosshair: {
          enabled: false,
          snapToDataPoint: true,
          labelFormatter: (e: any) => {
            return e.value / WaveformUtil.convXUnits;
          },
        },
        stripLines: [{
          startValue: timeOriginValue,
          endValue: timeOriginValue + globals.fixedDuration * WaveformUtil.convXUnits,
          color: globals.context.highlightColor
        }]
      },
      axisY: {
        minimum: -yMax,
        maximum: yMax,
        title: uom,
        lineThickness: globals.axis.lineThickness,
        lineColor: globals.axis.lineColor,
        gridThickness: 0,
        interval: yMax / 2,
        includeZero: true,
        labelFormatter: (e: any) => {
          const val = e.value * scaleY;
          if (Math.abs(Number(val.toPrecision(1))) < 10) {
            return val === 0 ? 0 : Number(val.toPrecision(1)).toFixed(3);
          }
          return Number(val.toPrecision(2)).toFixed(2);
        },
        crosshair: {
          enabled: false,
          snapToDataPoint: true,
          labelFormatter: (e: any) => {
            const val = e.value * scaleY;
            return val === 0 ? 0 : CanvasJS.formatNumber(val, '##0.000');
          },
        }
      },
      data: data
    };
    this.activeSensors[i].chart = new CanvasJS.Chart(this.activeSensors[i].container, optionsContext);
    // @ts-ignore
    this.activeSensors[i].chart.render();
  }

  private _setChartKeys() {

    for (let j = 0; j < this.activeSensors.length; j++) {
      const chartEl = this.activeSensors[j].chart;

      if (chartEl === undefined) {
        continue;
      }

      const chartElDom: Element = chartEl.get('container');
      const chartElCanvasesDom = chartElDom.querySelectorAll('.canvasjs-chart-canvas');
      const canvas = chartElCanvasesDom[chartElCanvasesDom.length - 1];

      if (j < this.activeSensors.length - 1) {    // exclude context trace

        // Create or move picks
        canvas.addEventListener('click', ((e: MouseEvent) => {

          if (this.selected === -1) { // ignore if we have a drag event
            const ind = j;
            const chart = this.activeSensors[ind].chart;
            if (chart) {
              const relX = e.offsetX; // - 0; // parentOffset.left;
              if (this.waveformService.pickingMode.getValue() === PickKey.P) {
                // create or move P pick on Left mouse click in P picking mode
                if (!this._bHoldEventTrigger) {
                  this._addPick(ind, PickKey.P, chart.axisX[0].convertPixelToValue(relX));
                }
              } else if (this.waveformService.pickingMode.getValue() === PickKey.S) {
                // create or move S pick on Left mouse click in S picking mode
                if (!this._bHoldEventTrigger) {
                  this._addPick(ind, PickKey.S, chart.axisX[0].convertPixelToValue(relX));
                }
              } else {
                if (e.ctrlKey) {  // create or move P on Ctrl + left mouse button click
                  this._addPick(ind, PickKey.P, chart.axisX[0].convertPixelToValue(relX));
                } else if (e.shiftKey) {   // create or move S pick on Shift + left mouse button click
                  this._addPick(ind, PickKey.S, chart.axisX[0].convertPixelToValue(relX));
                }
              }
            }
          }
        }) as (e: Event) => void);

        // Drag picks
        canvas.addEventListener('mousedown', ((e: MouseEvent) => {
          const idx = j;
          this.lastDownTarget = idx;

          if (this.contextMenuChartVisible) {
            this.selectedContextMenu = -1;
            this._toggleContextMenuChart('hide');
            return;
          }

          const chart = this.activeSensors[idx].chart;
          const relX = e.offsetX;
          const relY = e.offsetY;

          if (chart) {
            if (e.button === 0) {  // drag active on left mouse button only
              // check if we are on a pick
              // Get the selected stripLine & change the cursor
              const pickLines = <canvasjs.ChartStrip[]>chart.axisX[0].stripLines;
              for (let i = 0; i < pickLines.length; i++) {
                const label = pickLines[i].label;
                if (label && label !== label.toLowerCase()) { // exclude predicted picks (lowercase labels)
                  const chartStripBounds = <canvasjs.ChartStripBounds>pickLines[i].get('bounds');

                  if (chartStripBounds &&
                    relX > chartStripBounds.x1 - globals.snapDistance &&
                    relX < chartStripBounds.x2 + globals.snapDistance &&
                    relY > chartStripBounds.y1 &&
                    relY < chartStripBounds.y2) {  // move pick
                    this._savePicksState(idx, this.activeSensors[idx].sensor_code, this.activeSensors[idx].picks);

                    this.selected = i;
                    break;
                  }
                }
              }
            } else if (e.button === 2) {  // remove P or S on Right mouse Click
              if (this.waveformService.pickingMode.getValue() === PickKey.P) {
                this._deletePicks(idx, PickKey.P, null); // remove P picks on Right mouse click in P picking mode
              } else if (this.waveformService.pickingMode.getValue() === PickKey.S) {
                this._deletePicks(idx, PickKey.S, null); // remove S picks on Right mouse click in S picking mode
              } else {
                if (e.ctrlKey) {
                  this._deletePicks(idx, PickKey.P, null); // remove P on Ctrl + Right mouse button click
                } else if (e.shiftKey) {
                  this._deletePicks(idx, PickKey.S, null); // remove S on Shift + Right mouse button click
                }
              }
              this.lastSelectedXPosition = chart.axisX[0].convertPixelToValue(relX);
            }
          }
        }) as (e: Event) => void);

        // move selected stripLine
        canvas.addEventListener('mousemove', ((e: MouseEvent) => {

          if (this.selected !== -1) {
            this._bHoldEventTrigger = true;
            const idx = j;
            const chart = this.activeSensors[idx].chart; // this.activeSensors[idx].chart;
            if (chart) {

              const relX = e.offsetX;
              const data = chart.options.data[0].dataPoints;
              const position = Math.round(chart.axisX[0].convertPixelToValue(relX));
              // @ts-ignore
              const pickType = chart.options.axisX.stripLines[this.selected].label;
              const otherPickType = pickType === PickKey.P ? PickKey.S : pickType === PickKey.S ? PickKey.P : '';
              const otherPick = WaveformUtil.findValue(this.activeSensors[idx].picks, 'label', otherPickType);

              if (otherPick) {
                if (pickType === PickKey.P) {
                  if (position > otherPick.value) {
                    return;
                  }
                } else if (pickType === PickKey.S) {
                  if (position < otherPick.value) {
                    return;
                  }
                }
              }
              // @ts-ignore
              if (position >= data[0].x && position <= data[data.length - 1].x) {
                // @ts-ignore
                chart.options.axisX.stripLines[this.selected].value = position;
                // @ts-ignore
                this.activeSensors[idx].picks = chart.options.axisX.stripLines;
                chart.options.zoomEnabled = false;
                chart.render();
              }
            }
          }
        }) as (e: Event) => void);

        canvas.addEventListener('mouseup', ((e: MouseEvent) => {
          setTimeout(() => {
            this._bHoldEventTrigger = false;
          }, 500);

          // clear selection and change the cursor
          if (this.selected !== -1) {
            this.selected = -1;
            const idx = j;
            const chart = this.activeSensors[idx].chart;
            // chart.options.axisX.stripLines = this.activeSensors[i].picks;
            if (chart) {
              chart.options.zoomEnabled = true;   // turn zoom back on
              chart.render();
              this._waveformContainer.nativeElement.focus();
            }
          }
        }) as (e: Event) => void);

        canvas.addEventListener('contextmenu', ((e: MouseEvent) => {
          if (this.waveformService.pickingMode.getValue() !== 'P' &&
            this.waveformService.pickingMode.getValue() !== 'S') {
            e.preventDefault();
            this._menu.nativeElement.style.left = `${e.offsetX}px`;
            this._menu.nativeElement.style.top = `${e.y - 40}px`;
            this._toggleContextMenuChart('show', false);
            this.selectedContextMenu = j;
            return false;
          } else {
            e.preventDefault();
            return false;
          }
        }) as (e: Event) => boolean);

      }  // not on context trace

      if (j === this.activeSensors.length - 1) {       // on context trace

        canvas.addEventListener('mousedown', ((e: MouseEvent) => {

          if (this.contextMenuChartVisible) {
            this.selectedContextMenu = -1;
            this._toggleContextMenuChart('hide');
            return;
          }
        }) as (e: Event) => void);

        canvas.addEventListener('contextmenu', ((e: MouseEvent) => {
          if (this.waveformService.pickingMode.getValue() !== 'P' &&
            this.waveformService.pickingMode.getValue() !== 'S') {
            e.preventDefault();
            this._menu.nativeElement.style.left = `${e.offsetX}px`;
            this._menu.nativeElement.style.top = `${e.y - 40}px`;
            this._toggleContextMenuChart('show', true);
            this.selectedContextMenu = j;
            return false;
          } else {
            e.preventDefault();
            return false;
          }
        }) as (e: Event) => boolean);

      }


      // Wheel events: zoomp/pan, move picks in picking mode
      canvas.addEventListener('wheel', ((e: WheelEvent) => {
        const idx = j;
        // in pick mode wheel up moves pick left, wheel down moves pick right
        const pickMode = this.waveformService.pickingMode.getValue();
        if (pickMode !== null && !e.ctrlKey && !e.shiftKey && !e.altKey) {
          if (idx < this.activeSensors.length - 1) {
            const step = globals.pickTimeStep * 1000; // in microseconds
            if (e.deltaY < 0) { // scrolling up
              this._movePick(idx, pickMode, -step, true, false);
            } else if (e.deltaY > 0) { // scrolling down
              this._movePick(idx, pickMode, step, true, false);
            }
          }
        }
        // Y Zoom if Ctrl + Wheel, X axis (time) Zoom if Shift + Wheel; X axis (time) pan if Alt + Wheel
        if (e.ctrlKey || e.shiftKey || e.altKey) {

          e.preventDefault();

          const chart = this.activeSensors[idx].chart;
          if (chart) {

            const relOffsetX = e.clientX - this.pageOffsetX;
            const relOffsetY = e.clientY - this.pageOffsetY - idx * this.chartHeight;

            if (relOffsetX < chart.plotArea.x1 ||
              relOffsetX > chart.plotArea.x2 ||
              relOffsetY < chart.plotArea.y1 ||
              relOffsetY > chart.plotArea.y2) {
              return;
            }

            const axis = (e.shiftKey || e.altKey) ? chart.axisX[0] : e.ctrlKey ? chart.axisY[0] : null;

            const viewportMinimum = axis && +axis.get('viewportMinimum');
            const viewportMaximum = axis && +axis.get('viewportMaximum');
            const viewportMin = viewportMinimum ? viewportMinimum : 0;
            const viewportMax = viewportMaximum ? viewportMaximum : 0;
            const interval = (viewportMax - viewportMin) / globals.zoomSteps;  // control zoom step
            // interval = (axis.get('maximum') - axis.get('minimum'))/zoomSteps;  // alternate control zoom step

            let newViewportMin = 0;
            let newViewportMax = 0;

            if (e.ctrlKey) { // amplitude zoom
              if (e.deltaY < 0) { // wheel down
                newViewportMin = viewportMin + interval;
                newViewportMax = viewportMax - interval;
              } else if (e.deltaY > 0) { // wheel up
                newViewportMin = viewportMin - interval;
                newViewportMax = viewportMax + interval;
              }
            } else if (e.shiftKey) {  // time zoom
              const frac = 2 * ((chart.plotArea.x1 + chart.plotArea.x2) / 2 - relOffsetX)
                / (chart.plotArea.x2 - chart.plotArea.x1);

              if (e.deltaY < 0) { // wheel down
                newViewportMin = viewportMin + interval * (1 - frac);
                newViewportMax = viewportMax - interval * (1 + frac);
              } else if (e.deltaY > 0) { // wheel up
                newViewportMin = viewportMin - interval * (1 - frac);
                newViewportMax = viewportMax + interval * (1 + frac);
              }
            } else if (e.altKey) {  // time pan
              if (e.deltaY < 0) {
                newViewportMin = viewportMin - interval;
                newViewportMax = viewportMax - interval;
              } else if (e.deltaY > 0) {
                newViewportMin = viewportMin + interval;
                newViewportMax = viewportMax + interval;
              }
            }

            if ((newViewportMax - newViewportMin) > (2 * interval)) {
              if (this.waveformService.zoomAll.getValue()
                && idx < this.activeSensors.length - 1) {  // exclude context trace
                if (e.shiftKey || e.altKey) {
                  this._xZoomAllCharts(newViewportMin, newViewportMax);
                } else {
                  const factor = newViewportMax / viewportMax;
                  this._yZoomAllCharts(factor);
                }
              } else {  // zoom selected trace only
                const minimum = axis && axis.get('minimum') ? axis.get('minimum') : 0;
                const maximum = axis && axis.get('maximum') ? axis.get('maximum') : 0;

                if (newViewportMin >= minimum && newViewportMax <= maximum) {
                  if (axis) {
                    axis.set('viewportMinimum', newViewportMin, false);
                    axis.set('viewportMaximum', newViewportMax, false);
                    if (e.ctrlKey) { // Y axis
                      axis.set('interval', newViewportMax / 2, false);
                    }
                  }

                  chart.render();
                }
              }
              this._waveformContainer.nativeElement.focus();
            }
          }
        }
      }) as (e: Event) => void);
    }
  }

  private _predicatePicks() {
    if (this.activeSensors) {
      for (const sensor of this.activeSensors) {
        if (sensor.picks) {
          for (const pick of sensor.picks) {
            if (pick.label === pick.label.toLowerCase()) {
              pick.opacity = this.waveformService.predictedPicks.getValue() ? 0.5 : 0;
            }
          }
        }
      }
    }
  }

  private _predictedPicksBias() {
    this.picksBias = WaveformUtil.calculatePicksBias(this.allSensors);
    this._changePredictedPicksByBias(this.waveformService.predictedPicksBias.getValue());
  }

  private _resetZoomStack() {
    this._xViewPortMinStack = [];
    this._xViewportMaxStack = [];
  }

  private _updateZoomStackCharts(vpMin: number, vpMax: number) {

    if (this._xViewPortMinStack.length === 0 || this._xViewPortMinStack[this._xViewPortMinStack.length - 1] !== vpMin) {
      this._xViewPortMinStack.push(vpMin);
      this._xViewportMaxStack.push(vpMax);
      for (let i = 0; i < this.activeSensors.length; i++) {
        const chart = this.activeSensors[i].chart;
        if (chart) {
          if (!chart.options.viewportMinStack) {
            chart.options.viewportMinStack = [];
            chart.options.viewportMaxStack = [];
          }
          if (chart.options.viewportMinStack.length === 0 ||
            chart.options.viewportMinStack[chart.options.viewportMinStack.length - 1] !== vpMin) {
            chart.options.viewportMinStack.push(vpMin);

            if (chart.options.viewportMaxStack && chart.options.viewportMaxStack.length > 0) {
              chart.options.viewportMaxStack.push(vpMax);
            }
          }
        }
      }
    }
  }

  private _resetAllChartsViewX() {

    for (const [index, el] of this.activeSensors.entries()) {
      if (index < this.activeSensors.length - 1) {
        this._resetChartViewX(el.chart);
      } else {
        this._resetChartViewXContext(el.chart);
      }
    }
  }

  private _resetAllChartsViewY() {

    for (const [index, el] of this.activeSensors.entries()) {
      if (index < this.activeSensors.length - 1) {
        this._resetChartViewY(el.chart, index);
      } else {
        this._resetChartViewYContext(el.chart);
      }
    }
  }

  private _resetAllChartsViewXY() {

    if (this.waveformService.displayDistanceTime.getValue()) {
      return;
    }

    for (const [index, el] of this.activeSensors.entries()) {
      if (index < this.activeSensors.length - 1) {
        this._resetChartViewXY(el.chart);
      } else {
        this._resetChartViewXYContext(el.chart);
      }
    }
  }

  private _resetChartViewX(chart: canvasjs.Chart | undefined) {
    if (!chart || !chart.options) {
      console.error(`No chart or chart options`);
      return;
    }
    if (!chart.container) {
      console.error(`No container for chart`);
      return;
    }

    const channel = parseInt(chart.container.id.replace('container', ''), 10);

    if (chart.options.axisX) {
      chart.options.axisX.viewportMinimum = this._getXvpMin();
      chart.options.axisX.viewportMaximum = this._getXvpMax();
      chart.options.axisX.minimum = this.timeOrigin ? this.timeOrigin.millisecond() * 1000 : 0;
      chart.options.axisX.maximum = this._getXmax(channel);
    }
    chart.options.viewportMinStack = [];
    chart.options.viewportMaxStack = [];
    chart.render();
  }

  private _resetChartViewXContext(chart: canvasjs.Chart | undefined) {
    if (!chart || !chart.options) {
      console.error(`No chart or chart options`);
      return;
    }

    if (chart.options.axisX) {
      chart.options.axisX.viewportMinimum = undefined;
      chart.options.axisX.viewportMaximum = undefined;
      chart.options.axisX.minimum = this.contextTimeOrigin.millisecond() * 1000;
      chart.options.axisX.maximum = this._getXmaxContext();
      chart.options.viewportMinStack = [];
      chart.options.viewportMaxStack = [];
    }
    chart.render();
  }

  private _resetChartViewY(chart: canvasjs.Chart | undefined, idx: number) {
    if (!chart || !chart.options) {
      console.error(`No chart or chart options`);
      return;
    }

    if (chart.options.axisY) {
      chart.options.axisY.viewportMinimum = undefined;
      chart.options.axisY.viewportMaximum = undefined;
      chart.options.axisY.maximum = this._getYmax(idx);
      chart.options.axisY.minimum = -chart.options.axisY.maximum;
      chart.options.axisY.interval = chart.options.axisY.maximum / 2;
    }
    chart.render();
  }

  private _resetChartViewYContext(chart: canvasjs.Chart | undefined) {
    if (!chart || !chart.options) {
      console.error(`No chart or chart options`);
      return;
    }

    if (chart.options.axisY) {
      chart.options.axisY.viewportMinimum = undefined;
      chart.options.axisY.viewportMaximum = undefined;
      chart.options.axisY.maximum = this._getYmaxContext();
      chart.options.axisY.minimum = -chart.options.axisY.maximum;
      chart.options.axisY.interval = chart.options.axisY.maximum / 2;
    }

    chart.render();
  }

  private _resetChartViewXY(chart: canvasjs.Chart | undefined) {
    if (!chart || !chart.options) {
      console.error(`No chart or chart options`);
      return;
    }

    if (!chart.container) {
      console.error(`No container for chart`);
      return;
    }

    const channel = parseInt(chart.container.id.replace('container', ''), 10);

    if (chart.options.axisX) {
      chart.options.axisX.viewportMinimum = this._getXvpMin();
      chart.options.axisX.viewportMaximum = this._getXvpMax();
      chart.options.axisX.minimum = this.timeOrigin ? this.timeOrigin.millisecond() * 1000 : 0;
      chart.options.axisX.maximum = this._getXmax(channel);
    }
    if (chart.options.axisY) {
      chart.options.axisY.viewportMinimum = undefined;
      chart.options.axisY.viewportMaximum = undefined;
      chart.options.axisY.maximum = this._getYmax(channel);
      chart.options.axisY.minimum = -chart.options.axisY.maximum;
      chart.options.axisY.interval = chart.options.axisY.maximum / 2;
    }

    chart.options.viewportMinStack = [];
    chart.options.viewportMaxStack = [];
    chart.render();
  }

  private _resetChartViewXYContext(chart: canvasjs.Chart | undefined) {
    if (!chart || !chart.options) {
      console.error(`No chart or chart options`);
      return;
    }

    if (chart.options.axisX) {
      chart.options.axisX.viewportMinimum = undefined;
      chart.options.axisX.viewportMaximum = undefined;
      chart.options.axisX.minimum = this.contextTimeOrigin.millisecond() * 1000;
      chart.options.axisX.maximum = this._getXmaxContext();
    }
    if (chart.options.axisY) {
      chart.options.axisY.viewportMinimum = undefined;
      chart.options.axisY.viewportMaximum = undefined;
      chart.options.axisY.maximum = this._getYmaxContext();
      chart.options.axisY.minimum = -chart.options.axisY.maximum;
      chart.options.axisY.interval = chart.options.axisY.maximum / 2;
    }

    chart.options.viewportMinStack = [];
    chart.options.viewportMaxStack = [];
    chart.render();
  }

  private _getXmax(pos: number) {
    const endMicrosec = this.activeSensors[pos].channels[0].microsec + this.activeSensors[pos].channels[0].duration;

    if (this.waveformService.commonTimeScale.getValue()) {
      return Math.max(endMicrosec, this.timeOrigin.millisecond() * 1000 + globals.fixedDuration * WaveformUtil.convXUnits);
    }

    return endMicrosec;

  }

  private _getXmaxContext() {

    const val = this.contextSensor[0].channels.length > 0 ?
      this.contextSensor[0].channels[0].microsec + this.contextSensor[0].channels[0].duration : null;
    return val;
  }

  private _getXvpMax() {
    if (this.waveformService.commonTimeScale.getValue()) {
      return this.timeOrigin.millisecond() * 1000 + globals.fixedDuration * WaveformUtil.convXUnits;
    }

    return undefined;
  }

  private _getXvpMin() {
    return this.waveformService.commonTimeScale.getValue() ? 0 : undefined;
  }

  private _getValueMaxAll(motionType: any) {

    let val = 0;
    for (let i = 0; i < this.activeSensors.length - 1; i++) {
      const sensor = this.activeSensors[i];
      if (this._getSensorMotionType(sensor) === motionType) {
        for (let j = 0; j < sensor.channels.length; j++) {
          val = Math.max(WaveformUtil.maxValue(sensor.channels[j].data), val);
        }
      }
    }
    return val;
  }

  private _getYmax(sensorIdx: number) {

    const sensor = this.activeSensors[sensorIdx];
    return this._getYmaxForSensor(sensor);
  }

  private _getYmaxContext() {

    const sensor = this.contextSensor[0];
    return this._getYmaxForSensor(sensor);
  }

  private _getYmaxForSensor(sensor: Sensor) {

    let val = 0;
    if (this.waveformService.commonAmplitudeScale.getValue()) {
      val = this._getValueMaxAll(this._getSensorMotionType(sensor));
    } else {
      for (let j = 0; j < sensor.channels.length; j++) {
        val = Math.max(WaveformUtil.maxValue(sensor.channels[j].data), val);
      }
      val = val === 0 ? this._getValueMaxAll(this._getSensorMotionType(sensor)) : val;
    }
    return val;
  }

  private _getAxisMinAll(isXaxis: boolean | undefined) {

    let min: number | undefined;
    for (const activeSensor of this.activeSensors) {
      const chart = activeSensor.chart;
      if (chart) {
        const axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
        if (typeof axis !== undefined && axis.get('minimum') !== undefined) {
          if (min === undefined) {
            min = +axis.get('minimum');
          } else {
            Math.min(+axis.get('minimum'), min);
          }
        }
      }
    }
    return min;
  }

  private _getAxisMaxAll(isXaxis: boolean | undefined) {

    let max: number | undefined;
    for (const activeSensor of this.activeSensors) {
      const chart = activeSensor.chart;
      if (chart) {
        const axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
        if (axis !== undefined && axis.get('maximum') !== undefined) {
          if (max === undefined) {
            max = +axis.get('maximum');
          } else {
            Math.max(+axis.get('maximum'), max);
          }
        }
      }
    }
    return max;
  }

  private _xZoomAllCharts(vpMin: number, vpMax: number) {

    const isXaxis = true;
    this._updateZoomStackCharts(vpMin, vpMax);
    const axisMinAll = this._getAxisMinAll(isXaxis);
    const axisMaxAll = this._getAxisMaxAll(isXaxis);
    if (axisMinAll && axisMaxAll) {
      if (vpMin >= axisMinAll && vpMax <= axisMaxAll) {
        for (let i = 0; i < this.activeSensors.length - 1; i++) {
          const chart = this.activeSensors[i].chart;
          if (chart) {
            const axis = chart.axisX[0];
            if (axis !== undefined) {
              axis.set('viewportMinimum', vpMin, false);
              axis.set('viewportMaximum', vpMax, false);
              chart.render();
            }
          }
        }
      }
    }
  }

  private _yZoomAllCharts(factor: number) {

    for (let i = 0; i < this.activeSensors.length - 1; i++) {
      const chart = this.activeSensors[i].chart;
      if (chart) {
        const axis = chart.axisY[0];
        if (axis !== undefined) {
          const vpMax = axis.viewportMaximum !== null ? (axis && axis.viewportMaximum) && axis.viewportMaximum * factor : null;
          if (vpMax) {
            axis.set('viewportMinimum', -vpMax, false);
            axis.set('viewportMaximum', vpMax, false);
            axis.set('interval', vpMax / 2, false);
            chart.render();
          }
        }
      }
    }
  }


  private _savePicksState(ind: number, sensor: string, picks: any) {

    this.lastPicksState = {};
    this.lastPicksState.index = ind;
    this.lastPicksState.sensor_code = sensor;
    this.lastPicksState.picks = JSON.parse(JSON.stringify(picks));
  }

  private _undoLastPicking() {

    if (this.lastPicksState) {
      const ind = this.lastPicksState.index;
      const sensor = this.activeSensors[ind];
      if (this.lastPicksState.sensor_code === sensor.sensor_code) {
        const chart = sensor.chart;
        if (chart) {
          const picks = this.lastPicksState.picks;
          this._savePicksState(ind, sensor.sensor_code, sensor.picks);
          sensor.picks = picks;
          if (chart.options.axisX) {
            chart.options.axisX.stripLines = sensor.picks;
          }
          chart.render();
        }
      }
    }
  }

  private _addPick(ind: number, pickType: PickKey, value: number | null) {

    const sensor = this.activeSensors[ind];
    const chart = sensor.chart;
    if (chart) {
      const data = chart.options.data[0].dataPoints;
      const position = value ? Math.round(value) : Math.round(this.lastSelectedXPosition);
      // @ts-ignore
      if (position < data[0].x || position > data[data.length - 1].x) {
        this._toastrNotificationService.warning(`Pick cannot be created outside of the current trace view`);
        return;
      }
      sensor.picks = (typeof sensor.picks !== 'undefined' && sensor.picks instanceof Array) ? sensor.picks : [];
      const otherPickType = pickType === 'P' ? 'S' : pickType === 'S' ? 'P' : '';
      const otherPick = WaveformUtil.findValue(sensor.picks, 'label', otherPickType);
      if (otherPick) {
        if (pickType === 'P') {
          if (position > otherPick.value) {
            this._toastrNotificationService.warning(`P Pick cannot be moved past S Pick`);
            return;
          }
        } else if (pickType === 'S') {
          if (position < otherPick.value) {
            this._toastrNotificationService.warning(`S Pick cannot be moved before P Pick`);
            return;
          }
        }
      }
      this._savePicksState(ind, sensor.sensor_code, sensor.picks);
      // remove any existing pick of this type
      sensor.picks = sensor.picks.filter((el: any) => el.label !== pickType);
      sensor.picks.push({
        value: position,
        thickness: globals.picksLineThickness,
        color: pickType === PickKey.P ? 'blue' : pickType === PickKey.S ? 'red' : 'black',
        label: pickType,
        labelAlign: 'far'
      });
      if (chart.options.axisX) {
        chart.options.axisX.stripLines = sensor.picks;
      }
      chart.render();
      this._waveformContainer.nativeElement.focus();
    }
  }

  private _deletePicks(ind: number, pickType: PickKey, value: number | null) {

    const sensor = this.activeSensors[ind];
    this._savePicksState(ind, sensor.sensor_code, sensor.picks);
    const chart = sensor.chart;
    if (chart) {
      if (value) {
        sensor.picks = sensor.picks
          .filter((el: any) => el.label !== pickType || el.label === pickType && el.value !== value);
      } else {  // no value specified delete all picks of this type
        sensor.picks = sensor.picks.filter((el: any) => el.label !== pickType);
      }
      if (chart.options.axisX) {
        chart.options.axisX.stripLines = sensor.picks;
      }
      chart.render();
    }
    this._waveformContainer.nativeElement.focus();
  }

  private _movePick(ind: number, pickType: PickKey, value: number, fromCurrentPosition: boolean, issueWarning: boolean) {

    const sensor = this.activeSensors[ind];
    const chart = sensor.chart;
    if (chart) {
      sensor.picks = (typeof sensor.picks !== 'undefined' && sensor.picks instanceof Array) ? sensor.picks : [];
      // find existing pick of this type
      const pick = WaveformUtil.findValue(sensor.picks, 'label', pickType);
      if (!pick) {
        if (issueWarning) {
          this._toastrNotificationService.warning(`No ${pickType} pick to move`);
        }
        return;
      }
      const data = chart.options.data[0].dataPoints;
      if (data) {
        const position = fromCurrentPosition ? Math.round(pick.value + value) : Math.round(value);
        if (
          // @ts-ignore
          (position < data[0].x) || (position > data[data.length - 1].x)
        ) {
          this._toastrNotificationService.warning(`Pick cannot be moved outside of the current trace view`);
          return;
        }
        const otherPickType = pickType === PickKey.P ? PickKey.S : pickType === PickKey.S ? PickKey.P : '';
        const otherPick = WaveformUtil.findValue(sensor.picks, 'label', otherPickType);
        if (otherPick) {
          if (pickType === PickKey.P) {
            if (position > otherPick.value) {
              this._toastrNotificationService.warning(`P Pick cannot be moved past S Pick`);
              return;
            }
          } else if (pickType === PickKey.S) {
            if (position < otherPick.value) {
              this._toastrNotificationService.warning(`S Pick cannot be moved before P Pick`);
              return;
            }
          }
        }
        this._savePicksState(ind, sensor.sensor_code, sensor.picks);
        // move pick
        pick.value = position;
        sensor.picks = sensor.picks.filter((el: any) => el.label !== pickType);
        sensor.picks.push(pick);
        if (chart.options.axisX) {
          chart.options.axisX.stripLines = sensor.picks;
        }
        chart.render();
        this._waveformContainer.nativeElement.focus();
      }
    }
  }

  private _toggleCrosshair(ind: number, value: boolean | null) {
    const chart = this.activeSensors[ind].chart;
    if (!chart || !chart.options) {
      console.error(`No chart or chart options`);
      return;
    }

    if (!chart.options.axisX || !chart.options.axisY) {
      console.error(`No chart options for axis`);
      return;
    }

    value = value !== null ? value : !chart.options.axisX.crosshair.enabled;
    chart.options.axisX.crosshair.enabled = value;
    // keep Y asix crosshair line off
    chart.options.axisY.crosshair.enabled = false;
    if (value) {
      if (ind < this.activeSensors.length - 1) {
        chart.options.axisX.crosshair.color =
          this.waveformService.pickingMode.getValue() === PickKey.P ? 'blue' :
            this.waveformService.pickingMode.getValue() === PickKey.S ? 'red' : 'black';
        chart.options.axisX.crosshair.lineDashType = this.waveformService.pickingMode.getValue() === null ?
          'dash' : 'solid';
      } else {
        chart.options.axisX.crosshair.color = 'black';
        chart.options.axisX.crosshair.lineDashType = 'dash';
      }
      chart.options.axisX.crosshair.thickness = 1;
    }
    chart.render();
    this._waveformContainer.nativeElement.focus();
  }

  private _setPickingCursor() {
    if (this.waveformService.displayDistanceTime.getValue()) {
      return;
    }

    const value = this.waveformService.pickingMode.getValue() === null ? false : true;
    for (let j = 0; j < this.activeSensors.length; j++) {
      this._toggleCrosshair(j, value);
    }
  }

  private _undoTimeZoomPan() {

    if (this.waveformService.zoomAll.getValue()) {
      if (this._xViewPortMinStack && this._xViewPortMinStack.length > 0) {
        this._xViewPortMinStack.pop();
        this._xViewportMaxStack.pop();
      }
      for (let j = 0; j < this.activeSensors.length - 1; j++) {
        const chart = this.activeSensors[j].chart;
        if (chart) {
          chart.options.viewportMinStack = this._xViewPortMinStack;
          chart.options.viewportMaxStack = this._xViewportMaxStack;
          if (!chart.options.axisX) {
            chart.options.axisX = {};
          }
          if (this._xViewPortMinStack && this._xViewPortMinStack.length > 0) {
            chart.options.axisX.viewportMinimum = this._xViewPortMinStack[this._xViewPortMinStack.length - 1];
            chart.options.axisX.viewportMaximum = this._xViewportMaxStack[this._xViewportMaxStack.length - 1];
            chart.render();
          } else {
            this._resetChartViewX(chart);
          }
        }
      }
    } else {
      if (this.lastDownTarget !== null && this.lastDownTarget > -1) {
        const chart = this.activeSensors[this.lastDownTarget].chart;
        if (chart) {
          const viewportMinStack = chart.options.viewportMinStack;
          const viewportMaxStack = chart.options.viewportMaxStack;
          if (!chart.options.axisX) {
            chart.options.axisX = {};
          }
          if (
            (viewportMinStack && viewportMinStack.length > 0) ||
            (viewportMaxStack && viewportMaxStack.length > 0)
          ) {
            if (viewportMinStack && viewportMinStack.length > 0) {
              viewportMinStack.pop();
              chart.options.axisX.viewportMinimum = viewportMinStack[viewportMinStack.length - 1];
            }
            if (viewportMaxStack && viewportMaxStack.length > 0) {
              viewportMaxStack.pop();
              chart.options.axisX.viewportMaximum = viewportMaxStack[viewportMaxStack.length - 1];
            }
            chart.render();
          } else {
            this._resetChartViewX(chart);
          }
        }
      }
    }
    this._waveformContainer.nativeElement.focus();
  }

  private _updateArrivalWithPickData() {
    if (this.activeSensors) {
      for (let i = 0; i < this.activeSensors.length - 1; i++) {
        const sensor = this.activeSensors[i];
        this._updateSensorPicks(sensor, PickKey.P);
        this._updateSensorPicks(sensor, PickKey.S);
      }
    }
  }

  private _updateSensorPicks(sensor: Sensor, picktype: PickKey) {
    const pick = sensor.picks ? WaveformUtil.findValue(sensor.picks, 'label', picktype) : undefined;
    const arrpick = WaveformUtil.findNestedValue(this.allArrivalsChanged, 'pick', 'sensor', sensor.id, 'phase', picktype);

    if (pick) {
      const pick_time = WaveformUtil.addTimeOffsetMicro(this.timeOrigin, pick.value);
      if (arrpick) {  // existing pick
        if (arrpick.pick.time_utc !== pick_time) {
          console.log(sensor.sensor_code, sensor.id, picktype);
          console.log('replace pick');
          console.log(arrpick.pick.time_utc);
          console.log(pick_time);
          arrpick.pick.evaluation_mode = 'manual';
          arrpick.pick.time_utc = pick_time;
          arrpick.azimuth = undefined;
          arrpick.distance = undefined;
          arrpick.earth_model = undefined;
          arrpick.time_correction = undefined;
          arrpick.time_residual = undefined;
          arrpick.takeoff_angle = undefined;
          arrpick.pick.evaluation_status = undefined;
          arrpick.pick.filter_id = undefined;
          arrpick.pick.method_id = undefined;
          arrpick.pick.onset = undefined;
          arrpick.pick.polarity = undefined;
          arrpick.pick.time_errors = undefined;
          delete arrpick.origin;
          delete arrpick.arrival_resource_id;
          delete arrpick.event;
          delete arrpick.pick.event;
          delete arrpick.pick.pick_resource_id;
        }
      } else {  // add pick
        const newpick: ArrivalPartial = {
          azimuth: undefined,
          distance: undefined,
          earth_model: undefined,
          phase: picktype,
          pick: {
            evaluation_mode: EvaluationMode.MANUAL,
            phase_hint: picktype,
            sensor: sensor.id,
            time_utc: pick_time,
            evaluation_status: undefined,
            time_errors: undefined,
            method_id: undefined,
            filter_id: undefined,
            onset: undefined,
            polarity: undefined
          },
          time_correction: undefined,
          time_residual: undefined,
          takeoff_angle: undefined,
        };
        console.log(sensor.sensor_code, sensor.id, picktype);
        console.log('add pick');
        console.log(newpick);
        this.allArrivalsChanged.push(newpick);
      }
    } else {
      if (arrpick) {  // delete pick
        console.log(sensor.sensor_code, sensor.id, picktype);
        console.log('delete pick');
        console.log(arrpick);
        this.allArrivalsChanged = this.allArrivalsChanged.filter(item => item !== arrpick);
      }
    }

  }

  private _changePredictedPicksByBias(removeBias: boolean) {
    if (this.picksBias !== 0) {
      for (const sensor of this.loadedSensors) {
        if (sensor && sensor.hasOwnProperty('picks')) {
          for (const pick of sensor.picks) {
            if (pick.label === pick.label.toLowerCase()) {
              pick.value = removeBias ? pick.value + this.picksBias : pick.value - this.picksBias;
            }
          }
        }
      }

      if (this.contextSensor[0].hasOwnProperty('picks')) {
        for (const pick of this.contextSensor[0].picks) {
          if (pick.label === pick.label.toLowerCase()) {
            pick.value = removeBias ? pick.value + this.picksBias : pick.value - this.picksBias;
          }
        }
      }
    }
  }

  private _createButterworthFilter(sample_rate: number): any {
    let butterworth = null;
    if (this.waveformService.lowFreqCorner.getValue() >= 0 && this.waveformService.highFreqCorner.getValue() <= sample_rate / 2) {
      butterworth = filter.createButterworth(
        this.waveformService.numPoles.getValue(),
        this._passband,
        this.waveformService.lowFreqCorner.getValue(),
        this.waveformService.highFreqCorner.getValue(),
        1 / sample_rate
      );
    }
    return butterworth;
  }

  private _applyFilter() {
    if (this.loadedSensors.length > 0) {
      this.waveformService.saveOption('numPoles', this.waveformService.numPoles.getValue());
      this.waveformService.saveOption('lowFreqCorner', this.waveformService.lowFreqCorner.getValue());
      this.waveformService.saveOption('highFreqCorner', this.waveformService.highFreqCorner.getValue());
      this.loadedSensors = WaveformUtil.addCompositeTrace(
        this._filterData(this.loadedSensors, false, this.waveformService.displayRotated.getValue())); // filter, recompute composite
      this.waveformService.loadedSensors.next(this.loadedSensors);
      this.contextSensor = WaveformUtil.addCompositeTrace(
        this._filterData(this.contextSensor, true, this.waveformService.displayRotated.getValue()));
      this._changePage(false);
    }
  }

  private _filterData(sensors: Sensor[], isContext: boolean, bRotated: boolean): Sensor[] {
    for (const sensor of sensors) {

      if (!sensor) {
        continue;
      }

      if (sensor.enabled) {
        // remove existing composite trace if 3 components are available, to be added back after filtering components
        if (sensor.channels.length > 3) {
          const pos = sensor.channels.findIndex((v: any) =>
            (!isContext && v.channel_id === globals.compositeChannelCode) ||
            (isContext && v.channel_id.replace('...CONTEXT', '') === globals.compositeChannelCode));
          if (pos >= 0) {
            sensor.channels.splice(pos, 1);
          }
        }
        for (const channel of sensor.channels) {
          if (channel.hasOwnProperty('raw')) {
            if (channel.valid && channel.enabled) {
              const sg = (bRotated && channel.rotated.hasOwnProperty('_channelCode')) ?
                channel.rotated.clone() : channel.raw.clone();
              let seis = null;
              const butterworth = this._createButterworthFilter(channel.sample_rate);
              if (butterworth) {
                seis = filter.taper.taper(sg);
                butterworth.filterInPlace(seis.y());
              } else {
                seis = sg;
              }
              channel.channel_id = isContext ? seis.channelCode() + '...CONTEXT' : seis.channelCode();
              channel.code_id = isContext ? seis.codes() + '...CONTEXT' : seis.codes();
              for (let k = 0; k < seis.numPoints(); k++) {
                channel.data[k].y = seis.y()[k];
              }
            } else {
              console.log('Do not filter disabled or invalid channel');
              console.log(channel);
            }
          } else {
            console.error('Error applying filter cannot find raw data');
            console.error(sensor);
            break;
          }
        }
      } else {
        console.log('Do not filter disabled sensor');
        console.log(sensor);
      }
    }
    return sensors;
  }

  private _toggleContextMenuChart(force?: 'show' | 'hide', hidePicksOptions?: true | false) {
    if (hidePicksOptions) {
      this.isContextPickingMenuVisible = false;
    } else {
      this.isContextPickingMenuVisible = true;
    }
    if (force) {
      if (force === 'show') {
        this.contextMenuChartVisible = true;
      } else {
        this.contextMenuChartVisible = false;
      }
      return;
    }
    this.contextMenuChartVisible = !this.contextMenuChartVisible;
  }

  contextMenuClick(action: ContextMenuChartAction) {
    if (this.selectedContextMenu !== -1) {
      switch (action) {
        case ContextMenuChartAction.DELETE_P: this._deletePicks(this.selectedContextMenu, PickKey.P, null); break;
        case ContextMenuChartAction.DELETE_S: this._deletePicks(this.selectedContextMenu, PickKey.S, null); break;
        case ContextMenuChartAction.NEW_P: this._addPick(this.selectedContextMenu, PickKey.P, null); break;
        case ContextMenuChartAction.NEW_S: this._addPick(this.selectedContextMenu, PickKey.S, null); break;
        case ContextMenuChartAction.SHOW_CROSSHAIR: this._toggleCrosshair(this.selectedContextMenu, null); break;
        default: break;
      }
    }
    this.selectedContextMenu = -1;
    this._toggleContextMenuChart('hide');
  }
}
