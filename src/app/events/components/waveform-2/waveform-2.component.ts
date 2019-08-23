import { Component, OnInit, Input, ViewChild, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { takeUntil, distinctUntilChanged, skip, skipWhile, take } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import * as CanvasJS from '../../../../assets/js/canvasjs.min.js';
import * as filter from 'seisplotjs-filter';
import * as moment from 'moment';

import WaveformUtil from '@core/utils/waveform-util';
import { globals } from '@src/globals';
import { IEvent, Origin, Arrival, Traveltime, EvaluationMode, PickKey } from '@interfaces/event.interface';
import { Sensor, Station } from '@interfaces/inventory.interface';
import { EventOriginsQuery, EventArrivalsQuery } from '@interfaces/event-query.interface';
import { WaveformQueryResponse, ArrivalUpdateInput } from '@interfaces/event-dto.interface.ts';
import { WaveformService } from '@services/waveform.service';
import { EventApiService } from '@services/event-api.service';
import { InventoryApiService } from '@services/inventory-api.service.ts';
import { ToastrNotificationService } from '@services/toastr-notification.service.ts';

enum ContextMenuChartAction {
  DELETE_P = 'delete p',
  DELETE_S = 'delete s',
  NEW_P = 'new p',
  NEW_S = 'new s',
  SHOW_TOOLTIP = 'show tooltip',
}

@Component({
  selector: 'app-waveform-2',
  templateUrl: './waveform-2.component.html',
  styleUrls: ['./waveform-2.component.scss']
})

export class Waveform2Component implements OnInit, OnDestroy {


  @Input()
  set event(event: IEvent) {
    if (event !== this._event) {
      this._event = event;
      this._handleEvent(this._event);
    }
  }
  get event(): IEvent {
    return this._event;
  }
  private _event: IEvent;

  @Input() timezone = '+00:00';
  @ViewChild('contextMenuChart', { static: false }) private _menu: ElementRef;
  @ViewChild('waveformContainer', { static: false }) private _waveformContainer: ElementRef;

  private _passband = filter.BAND_PASS;
  private _bHoldEventTrigger: boolean;
  private _xViewPortMinStack: any[];
  private _xViewportMaxStack: any[];
  private _unsubscribe = new Subject<void>();
  contextMenuChartVisible = false;

  /*
  * SENSORS
  */

  // sensors loaded from api - don't mutate this!
  allSensorsOrig: Sensor[] = [];
  // duplicated allSensorsOrig for current chart
  allSensors: Sensor[] = [];
  // currently loaded sensors with waveform data
  loadedSensors: Sensor[] = [];
  // currently active sensors (shown on screen)
  activeSensors: Sensor[] = [];
  // hashMap for all sensors {sensor_code: <position in allSensors array>}
  allSensorsMap: { [key: string]: number } = {};
  // context sensor
  contextSensor: Sensor[];

  /*
  * STATIONS
  */
  allStations: Station[];
  allStationsMap: { [key: number]: number } = {};

  allArrivals: Arrival[];
  allArrivalsChanged: ArrivalUpdateInput[];
  originTravelTimes: Traveltime[];
  lastPicksState: any = null;
  timeOrigin: moment.Moment;
  contextTimeOrigin: moment.Moment;
  timeEnd: moment.Moment;
  waveformOrigin: Origin;
  options: any;
  picksBias = 0;

  selected = -1;
  selectedContextMenu = -1;
  lastSelectedXPosition = -1;
  lastDownTarget: any;  // last mouse down selection
  eventTimeOriginHeader: string;

  chartHeight: number;
  pageOffsetX = 0;
  pageOffsetY = 30;
  currentEventId: string;

  ContextMenuChartAction = ContextMenuChartAction;
  waveformShow = true;
  waveformInfo: WaveformQueryResponse;


  constructor(
    public waveformService: WaveformService,
    private _eventApiService: EventApiService,
    private _inventoryApiService: InventoryApiService,
    private _toastrNotificationService: ToastrNotificationService,
    private _renderer: Renderer2,
    private _ngxSpinnerService: NgxSpinnerService
  ) { }

  async ngOnInit() {
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

    await Promise.all([
      await this._loadAllSensors(),
      await this._loadAllStations(),
    ]);

    this.chartHeight = Math.floor((window.innerHeight - this.pageOffsetY - 30) / globals.chartsPerPage);
    this._addKeyDownEventListeners();
    this._subscribeToolbar();

    this.waveformService.waveformComponentInitialized.next(true);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
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

  private _subscribeToolbar(): void {

    this.waveformService.undoLastZoomOrPanClickedObs
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => this._undoLastZoomOrPan());

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
        this._predicatePicksBias();
        this._changePage(false);
      });

    this.waveformService.applyFilterClickedObs
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this._applyFilter();
      });

    this.waveformService.undoLastPickingClickedObs
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => this._undoLastPicking());

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

    await new Promise(resolve => {
      this.waveformService.waveformComponentInitialized.pipe(
        take(1),
        skipWhile(val => val !== true)
      ).subscribe(val => resolve());
    });

    this.allSensors = JSON.parse(JSON.stringify(this.allSensorsOrig));
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
    this.waveformService.loading.next(true);
    this.waveformService.loadedAll.next(false);
    this.waveformService.currentPage.next(1);

    try {

      this.waveformInfo = await this._eventApiService.getWaveformInfo(event.event_resource_id).toPromise();

      if (!this.waveformInfo) {
        console.error(`no waveformInfo`);
        return;
      }

      this.waveformService.maxPages.next(this.waveformInfo.num_of_pages);

      const waveformUrl = this.waveformInfo.pages[this.waveformService.currentPage.getValue() - 1];
      const eventFile = await this._eventApiService.getWaveformFile(waveformUrl).toPromise();

      if (!eventFile) {
        console.error(`no eventFile`);
        return;
      }

      const eventData = WaveformUtil.parseMiniseed(eventFile, false);

      if (eventData && eventData.sensors) {

        // filter and recompute composite traces
        this.loadedSensors = WaveformUtil.addCompositeTrace(this._filterData(eventData.sensors));

        this.waveformService.loadedSensors.next(this.loadedSensors);
        this.waveformService.loadedPages.next(1);
        this.timeOrigin = eventData.timeOrigin;

        if (!this.timeOrigin) {
          console.error(`no timeOrigin`);
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

          // get travel times for preferred origin
          const traveltimes = await this._eventApiService.getEventOriginTraveltimes(
            event.event_resource_id,
            origin.origin_resource_id
          ).toPromise();

          this.originTravelTimes = traveltimes;

          const arrivalsQuery: EventArrivalsQuery = {
            site_code: this.waveformService.site.getValue(),
            network_code: this.waveformService.network.getValue(),
            event_id: event.event_resource_id,
            origin_id: origin.origin_resource_id
          };

          // get arrivals, picks for preferred origin
          const arrivals = await this._eventApiService.getEventArrivalsById(arrivalsQuery).toPromise();

          this.allArrivals = arrivals;
          this.allArrivalsChanged = JSON.parse(JSON.stringify(this.allArrivals));

          // load predicted
          this.allSensors = WaveformUtil.addPredictedPicksDataToSensors(
            this.allSensors,
            this.originTravelTimes,
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

          this.loadedSensors = WaveformUtil.mapSensorInfoToLoadedSensors(this.loadedSensors, this.allSensors, this.allSensorsMap);

          this.picksBias = 0;
          const contextFile = await this._eventApiService.getWaveformFile(this.waveformInfo.context).toPromise();

          if (contextFile) {
            const contextData = WaveformUtil.parseMiniseed(contextFile, true);

            if (contextData && contextData.sensors) {
              this.contextSensor = this._filterData(contextData.sensors);
              this.contextSensor = WaveformUtil.mapSensorInfoToLoadedSensors(this.contextSensor, this.allSensors, this.allSensorsMap);
              this.contextTimeOrigin = contextData.timeOrigin;
            }
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
    } finally {
      this.waveformService.loading.next(false);
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
      if (!this.timeOrigin.isSame(eventData.timeOrigin)) {
        console.log('Warning: Different origin time on page: ', idx);
      }
      // filter and recompute composite traces
      let sensors = WaveformUtil.addCompositeTrace(this._filterData(eventData.sensors));
      sensors = WaveformUtil.mapSensorInfoToLoadedSensors(sensors, this.allSensors, this.allSensorsMap);

      for (let j = 0; j < sensors.length; j++) {
        this.loadedSensors[(this.waveformService.pageSize.getValue() - 1) * (idx - 1) + j] = sensors[j];
      }
    }

    this.waveformService.loadedPages.next(this.waveformService.loadedPages.getValue() + 1);
  }

  private _renderPage() {

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
        sensor.chart.options.viewportMinStack = this._xViewPortMinStack;
        sensor.chart.options.viewportMaxStack = this._xViewportMaxStack;
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
      this._xViewPortMinStack = [];
      this._xViewportMaxStack = [];
    } else {             // remember zoom history
      this._xViewPortMinStack = this.activeSensors[0].chart.options.viewportMinStack;
      this._xViewportMaxStack = this.activeSensors[0].chart.options.viewportMaxStack;
    }
    this._destroyCharts();
    this._renderPage();
  }

  private _onInteractiveProcess() {

    this._updateArrivalWithPickData();
    try {
      const response = this._eventApiService.updateEventPicksById(this.currentEventId, this.allArrivalsChanged).toPromise();
      this.waveformService.interactiveProcessLoading.next(true);
      console.log(response);
    } catch (err) {
      console.error(err);
      this._toastrNotificationService.error(`${err.error.message}`, 'Error on Interactive Processing');
    }
  }

  private _destroyCharts() {

    if (this.activeSensors) {
      for (let i = 0; i < this.activeSensors.length; i++) {
        this.activeSensors[i].chart.destroy();
        const elem = document.getElementById(this.activeSensors[i].container);
        if (elem) {
          elem.parentElement.removeChild(elem);
        }
      }
    }
  }

  private _renderCharts() {
    // Chart Options, Render
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
      for (const channel of this.activeSensors[i].channels) {
        if ((!this.waveformService.displayComposite.getValue() && channel.channel_id !== globals.compositeChannelCode)
          || (this.waveformService.displayComposite.getValue() && channel.channel_id === globals.compositeChannelCode)
          || (this.waveformService.displayComposite.getValue() && this.activeSensors[i].channels.length === 1)) {
          data.push(
            {
              name: channel.code_id,
              type: 'line',
              color: globals.linecolor[channel.channel_id.toUpperCase()],
              lineThickness: globals.lineThickness,
              showInLegend: true,
              // highlightEnabled: true,
              dataPoints: channel.data
            });
        }
      }

      const yMax = this._getYmax(i);
      const options = {
        zoomEnabled: true,
        zoomType: 'x',
        animationEnabled: false,
        rangeChanged: (e) => {
          this._bHoldEventTrigger = true;
          if (!e.chart.options.viewportMinStack) {
            e.chart.options.viewportMinStack = [];
            e.chart.options.viewportMaxStack = [];
          }
          if (e.trigger === 'zoom') {
            if (this.waveformService.zoomAll.getValue()) {
              this._zoomAllCharts(e.axisX[0].viewportMinimum, e.axisX[0].viewportMaximum, true);
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
          text: this._getSensorTitle(this.activeSensors[i]),
          dockInsidePlotArea: true,
          fontSize: 12,
          fontFamily: 'tahoma',
          fontColor: 'blue',
          horizontalAlign: 'left'
        },
        legend: {
          dockInsidePlotArea: true,
          horizontalAlign: 'left'
        },
        toolTip: {
          enabled: false,
          contentFormatter: (e) => {
            const content = ' ' +
              '<strong>' + Math.ceil(e.entries[0].dataPoint.y * WaveformUtil.convYUnits * 1000000) / 1000000 +
              ' ' + this._getSensorUnits(this.activeSensors[i]) + '</strong>' +
              '<br/>' +
              '<strong>' + Math.ceil(e.entries[0].dataPoint.x / 1000000 * 1000000) / 1000000 + ' s</strong>';
            return content;
          }
        },
        axisX: {
          minimum: this.timeOrigin ? this.timeOrigin.millisecond() * 1000 : 0,
          maximum: this._getXmax(i),
          viewportMinimum: this.waveformService.zoomAll.getValue() && this._xViewPortMinStack.length > 0 ?
            this._xViewPortMinStack[this._xViewPortMinStack.length - 1] : this._getXvpMin(),
          viewportMaximum: this.waveformService.zoomAll.getValue() && this._xViewportMaxStack.length > 0 ?
            this._xViewportMaxStack[this._xViewportMaxStack.length - 1] : this._getXvpMax(),
          includeZero: true,
          labelAutoFit: false,
          labelWrap: false,
          labelFormatter: (e) => {
            if (e.value === 0) {
              const d = moment(this.timeOrigin).utc().utcOffset(this.timezone);
              return d.format('HH:mm:ss.S');
            } else {
              return e.value / 1000000 + ' s';
            }
          },
          stripLines: this.activeSensors[i].picks
        },
        axisY: {
          minimum: -yMax,
          maximum: yMax,
          interval: this.waveformService.commonAmplitudeScale.getValue() ? null : yMax / 2,
          includeZero: true,
          labelFormatter: (e) => {
            if (e.value === 0) {
              return '0 ' + this._getSensorUnits(this.activeSensors[i]);
            } else {
              return Math.ceil(e.value * WaveformUtil.convYUnits * 1000) / 1000;
            }
          }
        },
        data: data
      };

      this.activeSensors[i].chart = new CanvasJS.Chart(this.activeSensors[i].container, options);
      this.activeSensors[i].chart.render();
    }
  }

  private _getSensorTitle(sensor: Sensor) {
    let sensorTitleText = ``;
    try {
      const station = this.allStations[this.allStationsMap[sensor.station.id]];
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

  private _getSensorUnits(sensor: Sensor) {
    let sensorUnitsText = ``;

    sensorUnitsText = sensor && sensor.components && sensor.components[0] &&
      sensor.components[0].sensor_type && sensor.components[0].sensor_type.motion_type ?
      sensor.components[0].sensor_type.motion_type : `??`;
    sensorUnitsText = sensorUnitsText.indexOf(' ') > 0 ? sensorUnitsText.substr(0, sensorUnitsText.indexOf(' ')) : sensorUnitsText;

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
            this.waveformService.pickingMode.next('none');
          } else {
            this.waveformService.pickingMode.next('P');
          }
        }

        if (e.keyCode === 70) {   // f
          if (this.waveformService.pickingMode.getValue() === 'S') {
            this.waveformService.pickingMode.next('none');
          } else {
            this.waveformService.pickingMode.next('S');
          }
        }

        if (e.keyCode === 83) {   // s, undo picking
          this._undoLastPicking();
        }

        if (e.keyCode === 72) {   // h, help
          this.waveformService.openHelpDialog();
        }

        if (e.keyCode === 39) {  // right arrow moves pick to right
          if (this.waveformService.pickingMode.getValue() !== 'none' && this.lastDownTarget !== null && this.lastDownTarget > -1) {
            const step = globals.pickTimeStep * 1000; // in microseconds
            if (e.shiftKey) { // shift key - fast mode - by 10 * step
              this._movePick(this.lastDownTarget, this.waveformService.pickingMode.getValue(), step * 10, true, true);
            } else { // by step
              this._movePick(this.lastDownTarget, this.waveformService.pickingMode.getValue(), step, true, true);
            }
          }
        }

        if (e.keyCode === 37) {  // left arrow moves pick to left
          if (this.waveformService.pickingMode.getValue() !== 'none' && this.lastDownTarget !== null && this.lastDownTarget > -1) {
            const step = globals.pickTimeStep * 1000; // in microseconds
            if (e.shiftKey) { // shift key - fast mode - by 10 * step
              this._movePick(this.lastDownTarget, this.waveformService.pickingMode.getValue(), -step * 10, true, true);
            } else { // by step
              this._movePick(this.lastDownTarget, this.waveformService.pickingMode.getValue(), -step, true, true);
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
      data.push(
        {
          name: channel.code_id,
          type: 'line',
          color: globals.context.linecolor,
          lineThickness: globals.lineThickness,
          showInLegend: true,
          // highlightEnabled: true,
          dataPoints: channel.data
        });
    }

    const yMax = this._getYmax(i);

    const timeOriginValue = WaveformUtil.calculateTimeOffset(this.timeOrigin, this.contextTimeOrigin);
    const optionsContext = {
      zoomEnabled: true,
      animationEnabled: false,
      title: {
        text: this._getSensorTitle(this.activeSensors[i]),
        dockInsidePlotArea: true,
        fontSize: 12,
        fontFamily: 'tahoma',
        fontColor: 'blue',
        horizontalAlign: 'left'
      },
      legend: {
        dockInsidePlotArea: true,
        horizontalAlign: 'left'
      },
      toolTip: {
        enabled: true,
        contentFormatter: (e) => {
          const content = ' ' +
            '<strong>' + Math.ceil(e.entries[0].dataPoint.y * WaveformUtil.convYUnits * 1000000) / 1000000 +
            ' ' + this._getSensorUnits(this.activeSensors[i]) + '</strong>' +
            '<br/>' +
            '<strong>' + Math.ceil(e.entries[0].dataPoint.x / 1000000 * 1000000) / 1000000 + ' s</strong>';
          return content;
        }
      },
      axisX: {
        minimum: this.contextTimeOrigin.millisecond() * 1000,
        maximum: Math.max(
          this.contextSensor[0].channels[0].microsec + this.contextSensor[0].channels[0].duration,
          WaveformUtil.calculateTimeOffset(this.timeEnd, this.contextTimeOrigin)),
        viewportMinimum: this._xViewPortMinStack.length > 0 ?
          this._xViewPortMinStack[this._xViewPortMinStack.length - 1] : null,
        viewportMaximum: this.waveformService.zoomAll.getValue() && this._xViewportMaxStack.length > 0 ?
          this._xViewportMaxStack[this._xViewportMaxStack.length - 1] : null,
        includeZero: true,
        labelAutoFit: false,
        labelWrap: false,
        labelFormatter: (e) => {
          return e.value / 1000000 + ' s';
        },
        stripLines: [{
          startValue: timeOriginValue,
          endValue: timeOriginValue + globals.fixedDuration * 1000000,
          color: globals.context.highlightColor
        }]
      },
      axisY: {
        minimum: -yMax,
        maximum: yMax,
        interval: this.waveformService.commonAmplitudeScale.getValue() ? null : yMax / 2,
        includeZero: true,
        labelFormatter: (e) => {
          if (e.value === 0) {
            return '0 ' + this._getSensorUnits(this.activeSensors[i]);
          } else {
            return Math.ceil(e.value * WaveformUtil.convYUnits * 1000) / 1000;
          }
        }
      },
      data: data
    };
    optionsContext.data[0].dataPoints[0]['indexLabel'] =
      moment(this.contextSensor[0].channels[0].start).utc().utcOffset(this.timezone).format('HH:mm:ss.S');
    this.activeSensors[i].chart = new CanvasJS.Chart(this.activeSensors[i].container, optionsContext);

    this.activeSensors[i].chart.render();
  }

  private _setChartKeys() {

    for (let j = 0; j < this.activeSensors.length; j++) {
      const chartEl = this.activeSensors[j].chart;

      const chartElDom: Element = chartEl.get('container');
      const chartElCanvasesDom = chartElDom.querySelectorAll('.canvasjs-chart-canvas');
      const canvas = chartElCanvasesDom[chartElCanvasesDom.length - 1];

      if (j < this.activeSensors.length - 1) {    // exclude context trace

        // Create or move picks
        canvas.addEventListener('click', (e: MouseEvent) => {

          if (this.selected === -1) { // ignore if we have a drag event
            const ind = j;
            const chart = this.activeSensors[ind].chart;

            const relX = e.offsetX; // - 0; // parentOffset.left;
            if (this.waveformService.pickingMode.getValue() === 'P') {
              // create or move P pick on Left mouse click in P picking mode
              if (!this._bHoldEventTrigger) {
                this._addPick(ind, 'P', chart.axisX[0].convertPixelToValue(relX));
              }
            } else if (this.waveformService.pickingMode.getValue() === 'S') {
              // create or move S pick on Left mouse click in S picking mode
              if (!this._bHoldEventTrigger) {
                this._addPick(ind, 'S', chart.axisX[0].convertPixelToValue(relX));
              }
            } else {
              if (e.ctrlKey) {  // create or move P on Ctrl + left mouse button click
                this._addPick(ind, 'P', chart.axisX[0].convertPixelToValue(relX));
              } else if (e.shiftKey) {   // create or move S pick on Shift + left mouse button click
                this._addPick(ind, 'S', chart.axisX[0].convertPixelToValue(relX));
              }
            }
          }
        });

        // Drag picks
        canvas.addEventListener('mousedown', (e: MouseEvent) => {
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

          if (e.button === 0) {  // drag active on left mouse button only
            // check if we are on a pick
            // Get the selected stripLine & change the cursor
            const pickLines = <canvasjs.ChartStrip[]>chart.axisX[0].stripLines;
            for (let i = 0; i < pickLines.length; i++) {
              const label = pickLines[i].label;
              if (label !== label.toLowerCase()) { // exclude predicted picks (lowercase labels)
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
          } else if (e.button === 1) {  // remove P or S on Middle mouse Click
            if (this.waveformService.pickingMode.getValue() === 'P') {
              this._deletePicks(idx, 'P', null); // remove P picks on Middle mouse click in P picking mode
            } else if (this.waveformService.pickingMode.getValue() === 'S') {
              this._deletePicks(idx, 'S', null); // remove S picks on Middle mouse click in S picking mode
            } else {
              if (e.ctrlKey) {
                this._deletePicks(idx, 'P', null); // remove P on Ctrl + Middle mouse button click
              } else if (e.shiftKey) {
                this._deletePicks(idx, 'S', null); // remove S on Shift + Middle mouse button click
              }
            }
          } else if (e.button === 2) {  // save position on right mouse button, context menu
            this.lastSelectedXPosition = chart.axisX[0].convertPixelToValue(relX);
          }
        });

        // move selected stripLine
        canvas.addEventListener('mousemove', (e: MouseEvent) => {

          if (this.selected !== -1) {
            this._bHoldEventTrigger = true;
            const idx = j;
            const chart = this.activeSensors[idx].chart; // this.activeSensors[idx].chart;

            const relX = e.offsetX;
            const data = chart.options.data[0].dataPoints;
            const position = Math.round(chart.axisX[0].convertPixelToValue(relX));
            const pickType = chart.options.axisX.stripLines[this.selected].label;
            const otherPickType = pickType === 'P' ? 'S' : pickType === 'S' ? 'P' : '';
            const otherPick = WaveformUtil.findValue(this.activeSensors[idx].picks, 'label', otherPickType);

            if (otherPick) {
              if (pickType === 'P') {
                if (position > otherPick.value) {
                  return;
                }
              } else if (pickType === 'S') {
                if (position < otherPick.value) {
                  return;
                }
              }
            }
            if (position >= data[0].x && position <= data[data.length - 1].x) {

              chart.options.axisX.stripLines[this.selected].value = position;
              this.activeSensors[idx].picks = chart.options.axisX.stripLines;
              chart.options.zoomEnabled = false;
              chart.render();
            }
          }
        });

        canvas.addEventListener('mouseup', (e: MouseEvent) => {
          setTimeout(() => {
            this._bHoldEventTrigger = false;
          }, 500);

          // clear selection and change the cursor
          if (this.selected !== -1) {
            this.selected = -1;
            const idx = j;
            const chart = this.activeSensors[idx].chart;
            // chart.options.axisX.stripLines = this.activeSensors[i].picks;

            chart.options.zoomEnabled = true;   // turn zoom back on
            chart.render();
            this._waveformContainer.nativeElement.focus();
          }
        });

        canvas.addEventListener('contextmenu', (e: MouseEvent) => {
          e.preventDefault();
          this._menu.nativeElement.style.left = `${e.offsetX}px`;
          this._menu.nativeElement.style.top = `${e.y}px`;
          this._toggleContextMenuChart('show');
          this.selectedContextMenu = j;
          return false;
        });

      }  // not on context trace


      // Wheel events: zoomp/pan, move picks in picking mode
      canvas.addEventListener('wheel', (e: WheelEvent) => {
        const idx = j;
        // in pick mode wheel up moves pick left, wheel down moves pick right
        if (this.waveformService.pickingMode.getValue() !== 'none' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
          if (idx < this.activeSensors.length - 1) {
            const step = globals.pickTimeStep * 1000; // in microseconds
            if (e.deltaY < 0) { // scrolling up
              this._movePick(idx, this.waveformService.pickingMode.getValue(), -step, true, false);
            } else if (e.deltaY > 0) { // scrolling down
              this._movePick(idx, this.waveformService.pickingMode.getValue(), step, true, false);
            }
          }
        }
        // Y Zoom if Ctrl + Wheel, X axis (time) Zoom if Shift + Wheel; X axis (time) pan if Alt + Wheel
        if (e.ctrlKey || e.shiftKey || e.altKey) {

          e.preventDefault();

          const chart = this.activeSensors[idx].chart;

          const relOffsetX = e.clientX - this.pageOffsetX;
          const relOffsetY = e.clientY - this.pageOffsetY - idx * this.chartHeight;

          if (relOffsetX < chart.plotArea.x1 ||
            relOffsetX > chart.plotArea.x2 ||
            relOffsetY < chart.plotArea.y1 ||
            relOffsetY > chart.plotArea.y2) {
            return;
          }

          const axis = (e.shiftKey || e.altKey) ? chart.axisX[0] : e.ctrlKey ? chart.axisY[0] : null;

          const viewportMin = +axis.get('viewportMinimum'),
            viewportMax = +axis.get('viewportMaximum'),
            interval = (viewportMax - viewportMin) / globals.zoomSteps;  // control zoom step
          // interval = (axis.get('maximum') - axis.get('minimum'))/zoomSteps;  // alternate control zoom step

          let newViewportMin, newViewportMax;

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
              this._zoomAllCharts(newViewportMin, newViewportMax, e.shiftKey || e.altKey);
            } else {  // zoom selected trace only
              if (newViewportMin >= axis.get('minimum') && newViewportMax <= axis.get('maximum')) {
                axis.set('viewportMinimum', newViewportMin, false);
                axis.set('viewportMaximum', newViewportMax, false);
                chart.render();
              }
            }
            this._waveformContainer.nativeElement.focus();
          }
        }
      });
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

  private _predicatePicksBias() {
    this.picksBias = WaveformUtil.calculatePicksBias(this.allSensors);
    this._changePredictedPicksByBias(this.waveformService.predictedPicksBias.getValue());
  }

  private _updateZoomStackCharts(vpMin, vpMax) {

    if (this._xViewPortMinStack.length === 0 || this._xViewPortMinStack[this._xViewPortMinStack.length - 1] !== vpMin) {
      this._xViewPortMinStack.push(vpMin);
      this._xViewportMaxStack.push(vpMax);
      for (let i = 0; i < this.activeSensors.length; i++) {
        const chart = this.activeSensors[i].chart;
        if (!chart.options.viewportMinStack) {
          chart.options.viewportMinStack = [];
          chart.options.viewportMaxStack = [];
        }
        if (chart.options.viewportMinStack.length === 0 ||
          chart.options.viewportMinStack[chart.options.viewportMinStack.length - 1] !== vpMin) {
          chart.options.viewportMinStack.push(vpMin);
          chart.options.viewportMaxStack.push(vpMax);
        }
      }
    }
  }

  private _resetAllChartsViewX() {

    for (let i = 0; i < this.activeSensors.length - 1; i++) {
      this._resetChartViewX(this.activeSensors[i].chart);
    }
    this._resetChartViewXContext(this.activeSensors[this.activeSensors.length - 1].chart);
  }

  private _resetAllChartsViewY() {

    for (let i = 0; i < this.activeSensors.length - 1; i++) {
      this._resetChartViewY(this.activeSensors[i].chart, i);
    }
    this._resetChartViewYContext(this.activeSensors[this.activeSensors.length - 1].chart);
  }

  private _resetAllChartsViewXY() {

    for (let i = 0; i < this.activeSensors.length - 1; i++) {
      this._resetChartViewXY(this.activeSensors[i].chart);
    }
    this._resetChartViewXYContext(this.activeSensors[this.activeSensors.length - 1].chart);
  }

  private _resetChartViewX(chart) {

    const channel = parseInt(chart.container.id.replace('container', ''), 10);
    chart.options.axisX.viewportMinimum = this._getXvpMin();
    chart.options.axisX.viewportMaximum = this._getXvpMax();
    chart.options.axisX.minimum = this.timeOrigin ? this.timeOrigin.millisecond() * 1000 : 0;
    chart.options.axisX.maximum = this._getXmax(channel);
    chart.options.viewportMinStack = [];
    chart.options.viewportMaxStack = [];
    chart.render();
  }

  private _resetChartViewXContext(chart) {

    chart.options.axisX.viewportMinimum = null;
    chart.options.axisX.viewportMaximum = null;
    chart.options.axisX.minimum = this.contextTimeOrigin.millisecond() * 1000;
    chart.options.axisX.maximum = this._getXmaxContext();
    chart.options.viewportMinStack = [];
    chart.options.viewportMaxStack = [];
    chart.render();
  }

  private _resetChartViewY(chart, idx: number) {

    chart.options.axisY.viewportMinimum = null;
    chart.options.axisY.viewportMaximum = null;
    chart.options.axisY.maximum = this._getYmax(idx);
    chart.options.axisY.minimum = -chart.options.axisY.maximum;
    chart.options.axisY.interval = chart.options.axisY.maximum / 2;
    chart.render();
  }

  private _resetChartViewYContext(chart) {

    chart.options.axisY.viewportMinimum = null;
    chart.options.axisY.viewportMaximum = null;
    chart.options.axisY.maximum = this._getYmaxContext();
    chart.options.axisY.minimum = -chart.options.axisY.maximum;
    chart.options.axisY.interval = chart.options.axisY.maximum / 2;
    chart.render();
  }

  private _resetChartViewXY(chart) {

    const channel = parseInt(chart.container.id.replace('container', ''), 10);
    chart.options.axisX.viewportMinimum = this._getXvpMin();
    chart.options.axisX.viewportMaximum = this._getXvpMax();
    chart.options.axisX.minimum = this.timeOrigin ? this.timeOrigin.millisecond() * 1000 : 0;
    chart.options.axisX.maximum = this._getXmax(channel);
    chart.options.viewportMinStack = [];
    chart.options.viewportMaxStack = [];
    chart.options.axisY.viewportMinimum = null;
    chart.options.axisY.viewportMaximum = null;
    chart.options.axisY.maximum = this._getYmax(channel);
    chart.options.axisY.minimum = -chart.options.axisY.maximum;
    chart.render();
  }

  private _resetChartViewXYContext(chart) {

    chart.options.axisX.viewportMinimum = null;
    chart.options.axisX.viewportMaximum = null;
    chart.options.axisX.minimum = this.contextTimeOrigin.millisecond() * 1000;
    chart.options.axisX.maximum = this._getXmaxContext();
    chart.options.viewportMinStack = [];
    chart.options.viewportMaxStack = [];
    chart.options.axisY.viewportMinimum = null;
    chart.options.axisY.viewportMaximum = null;
    chart.options.axisY.maximum = this._getYmaxContext();
    chart.options.axisY.minimum = -chart.options.axisY.maximum;
    chart.render();
  }

  private _getXmax(pos) {
    const endMicrosec = this.activeSensors[pos].channels[0].microsec + this.activeSensors[pos].channels[0].duration;

    if (this.waveformService.commonTimeScale.getValue()) {
      return Math.max(endMicrosec, this.timeOrigin.millisecond() * 1000 + globals.fixedDuration * 1000000);
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
      return this.timeOrigin.millisecond() * 1000 + globals.fixedDuration * 1000000;
    }

    return null;
  }

  private _getXvpMin() {
    return this.waveformService.commonTimeScale.getValue() ? 0 : null;
  }

  private _getValueMaxAll() {

    let val = WaveformUtil.maxValue(this.activeSensors[0].channels[0].data);
    for (let i = 0; i < this.activeSensors.length - 1; i++) {
      for (let j = 0; j < this.activeSensors[i].channels.length; j++) {
        val = Math.max(WaveformUtil.maxValue(this.activeSensors[i].channels[j].data), val);
      }
    }
    return val;
  }

  private _getYmax(sensorIdx: number) {
    let val = 0;
    for (let j = 0; j < this.activeSensors[sensorIdx].channels.length; j++) {
      val = Math.max(WaveformUtil.maxValue(this.activeSensors[sensorIdx].channels[j].data), val);
    }

    if (this.waveformService.commonAmplitudeScale.getValue() || val === 0) {
      return this._getValueMaxAll();
    }

    return val;
  }

  private _getYmaxContext() {

    const val = this.contextSensor[0].channels.length > 0 ?
      WaveformUtil.maxValue(this.contextSensor[0].channels[0].data) : 0;
    return (val === 0) ? this._getValueMaxAll() : val;
  }

  private _getAxisMinAll(isXaxis: boolean) {

    let min;
    for (let i = 0; i < this.activeSensors.length; i++) {
      const chart = this.activeSensors[i].chart;
      const axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
      min = i === 0 ? axis.get('minimum') : Math.min(+axis.get('minimum'), min);
    }
    return min;
  }

  private _getAxisMaxAll(isXaxis: boolean) {

    let max;
    for (let i = 0; i < this.activeSensors.length - 1; i++) {
      const chart = this.activeSensors[i].chart;
      const axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
      max = i === 0 ? axis.get('maximum') : Math.max(+axis.get('maximum'), max);
    }
    return max;
  }

  private _zoomAllCharts(vpMin, vpMax, isXaxis) {

    if (isXaxis) {
      this._updateZoomStackCharts(vpMin, vpMax);
    }
    if (vpMin >= this._getAxisMinAll(isXaxis) && vpMax <= this._getAxisMaxAll(isXaxis)) {
      for (let i = 0; i < this.activeSensors.length - 1; i++) {
        const chart = this.activeSensors[i].chart;
        const axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
        axis.set('viewportMinimum', vpMin, false);
        axis.set('viewportMaximum', vpMax, false);
        chart.render();
      }
    }
  }

  private _savePicksState(ind, sensor, picks) {

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
        const picks = this.lastPicksState.picks;
        this._savePicksState(ind, sensor.sensor_code, sensor.picks);
        sensor.picks = picks;
        chart.options.axisX.stripLines = sensor.picks;
        chart.render();
      }
    }
  }

  private _addPick(ind, pickType, value) {

    const sensor = this.activeSensors[ind];
    const chart = sensor.chart;
    const data = chart.options.data[0].dataPoints;
    const position = value ? Math.round(value) : Math.round(this.lastSelectedXPosition);
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
    sensor.picks = sensor.picks.filter(el => el.label !== pickType);
    sensor.picks.push({
      value: position,
      thickness: globals.picksLineThickness,
      color: pickType === 'P' ? 'blue' : pickType === 'S' ? 'red' : 'black',
      label: pickType,
      labelAlign: 'far'
    });
    chart.options.axisX.stripLines = sensor.picks;
    chart.render();
    this._waveformContainer.nativeElement.focus();
  }

  private _deletePicks(ind, pickType, value) {

    const sensor = this.activeSensors[ind];
    this._savePicksState(ind, sensor.sensor_code, sensor.picks);
    const chart = sensor.chart;
    if (value) {
      sensor.picks = sensor.picks
        .filter(el => el.label !== pickType || el.label === pickType && el.value !== value);
    } else {  // no value specified delete all picks of this type
      sensor.picks = sensor.picks.filter(el => el.label !== pickType);
    }
    chart.options.axisX.stripLines = sensor.picks;
    chart.render();
    this._waveformContainer.nativeElement.focus();
  }

  private _movePick(ind, pickType, value, fromCurrentPosition, issueWarning) {

    const sensor = this.activeSensors[ind];
    const chart = sensor.chart;
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
    const position = fromCurrentPosition ? Math.round(pick.value + value) : Math.round(value);
    if (position < data[0].x || position > data[data.length - 1].x) {
      this._toastrNotificationService.warning(`Pick cannot be moved outside of the current trace view`);
      return;
    }
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
    // move pick
    pick.value = position;
    sensor.picks = sensor.picks.filter(el => el.label !== pickType);
    sensor.picks.push(pick);
    chart.options.axisX.stripLines = sensor.picks;
    chart.render();
    this._waveformContainer.nativeElement.focus();
  }

  private _toggleTooltip(ind, value) {

    value = value ? value : !this.activeSensors[ind].chart.options.toolTip.enabled;
    this.activeSensors[ind].chart.options.toolTip.enabled = value;
    this.activeSensors[ind].chart.render();
    this._waveformContainer.nativeElement.focus();
  }

  private _undoLastZoomOrPan() {

    if (this.waveformService.zoomAll.getValue()) {
      if (this._xViewPortMinStack && this._xViewPortMinStack.length > 0) {
        this._xViewPortMinStack.pop();
        this._xViewportMaxStack.pop();
      }
      for (let j = 0; j < this.activeSensors.length - 1; j++) {
        const chart = this.activeSensors[j].chart;
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
    } else {
      if (this.lastDownTarget !== null && this.lastDownTarget > -1) {
        const chart = this.activeSensors[this.lastDownTarget].chart;
        const viewportMinStack = chart.options.viewportMinStack;
        const viewportMaxStack = chart.options.viewportMaxStack;
        if (!chart.options.axisX) {
          chart.options.axisX = {};
        }
        if (viewportMinStack && viewportMinStack.length > 0) {
          viewportMinStack.pop();
          viewportMaxStack.pop();
          chart.options.axisX.viewportMinimum = viewportMinStack[viewportMinStack.length - 1];
          chart.options.axisX.viewportMaximum = viewportMaxStack[viewportMaxStack.length - 1];
          chart.render();
        } else {
          this._resetChartViewX(chart);
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
    const arrpick = WaveformUtil.findNestedValue(this.allArrivalsChanged, 'pick', 'sensor', sensor.sensor_code, 'phase', picktype);

    if (pick) {
      const pick_time = WaveformUtil.addTimeOffsetMicro(this.timeOrigin, pick.value);
      if (arrpick) {  // existing pick
        if (arrpick.pick.time_utc !== pick_time) {
          console.log(sensor.sensor_code, picktype);
          console.log('replace pick');
          console.log(arrpick.pick.time_utc);
          console.log(pick_time);
          arrpick.pick.evaluation_mode = 'manual';
          arrpick.pick.time_utc = pick_time;
          arrpick.azimuth = null;
          arrpick.distance = null;
          arrpick.earth_model = null;
          arrpick.time_correction = null;
          arrpick.time_residual = null;
          arrpick.takeoff_angle = null;
          arrpick.pick.evaluation_status = null;
          arrpick.pick.filter_id = null;
          arrpick.pick.method_id = null;
          arrpick.pick.onset = null;
          arrpick.pick.polarity = null;
          arrpick.pick.time_errors = null;
          delete arrpick.origin;
          delete arrpick.arrival_resource_id;
          delete arrpick.event;
          delete arrpick.pick.event;
          delete arrpick.pick.pick_resource_id;
        }
      } else {  // add pick
        const newpick: ArrivalUpdateInput = {
          azimuth: null,
          distance: null,
          earth_model: null,
          phase: picktype,
          pick: {
            evaluation_mode: EvaluationMode.MANUAL,
            phase_hint: picktype,
            sensor: sensor.sensor_code,
            time_utc: pick_time,
            evaluation_status: null,
            time_errors: null,
            method_id: null,
            filter_id: null,
            onset: null,
            polarity: null
          },
          time_correction: null,
          time_residual: null,
          takeoff_angle: null,
        };
        console.log(sensor.sensor_code, picktype);
        console.log('add pick');
        console.log(newpick);
        this.allArrivalsChanged.push(newpick);
      }
    } else {
      if (arrpick) {  // delete pick
        console.log(sensor.sensor_code, picktype);
        console.log('delete pick');
        console.log(arrpick);
        this.allArrivalsChanged = this.allArrivalsChanged.filter(item => item !== arrpick);
      }
    }

  }

  private _changePredictedPicksByBias(removeBias: boolean) {
    if (this.picksBias !== 0) {
      for (const sensor of this.loadedSensors) {
        if (sensor.hasOwnProperty('picks')) {
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

  private _createButterworthFilter(sample_rate): any {
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
      this.loadedSensors = WaveformUtil.addCompositeTrace(this._filterData(this.loadedSensors)); // filter and recompute composite traces
      this.waveformService.loadedSensors.next(this.loadedSensors);
      this.contextSensor = this._filterData(this.contextSensor);
      this._changePage(false);
    }
  }

  private _filterData(sensors: Sensor[]): Sensor[] {
    for (const sensor of sensors) {
      // remove composite traces if existing
      const pos = sensor.channels.findIndex(v => v.channel_id === globals.compositeChannelCode);
      if (pos >= 0) {
        sensor.channels.splice(pos, 1);
      }
      for (const channel of sensor.channels) {
        if (channel.hasOwnProperty('raw')) {
          if (channel.valid) {
            const sg = channel.raw.clone();
            let seis = null;
            const butterworth = this._createButterworthFilter(channel.sample_rate);
            if (butterworth) {
              seis = filter.taper.taper(sg);
              butterworth.filterInPlace(seis.y());
            } else {
              seis = sg;
            }
            for (let k = 0; k < seis.numPoints(); k++) {
              channel.data[k].y = seis.y()[k];
            }
          }
        } else {
          console.log('Error applying filter cannot find raw data');
          break;
        }
      }
    }
    return sensors;
  }

  private _toggleContextMenuChart(force?: 'show' | 'hide') {
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
        case ContextMenuChartAction.DELETE_P: this._deletePicks(this.selectedContextMenu, 'P', null); break;
        case ContextMenuChartAction.DELETE_S: this._deletePicks(this.selectedContextMenu, 'S', null); break;
        case ContextMenuChartAction.NEW_P: this._addPick(this.selectedContextMenu, 'P', null); break;
        case ContextMenuChartAction.NEW_S: this._addPick(this.selectedContextMenu, 'S', null); break;
        case ContextMenuChartAction.SHOW_TOOLTIP: this._toggleTooltip(this.selectedContextMenu, null); break;
        default: break;
      }
    }
    this.selectedContextMenu = -1;
    this._toggleContextMenuChart('hide');
  }
}
