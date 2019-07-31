/*jshint esversion: 6 */
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import * as $ from 'jquery';
import * as CanvasJS from '../../../../assets/js/canvasjs.min.js';
import { globals } from '../../../../globals';
import { CatalogApiService } from '@core/services/catalog-api.service';
import { Subscription } from 'rxjs/Subscription';
import { Validators, FormControl } from '@angular/forms';
import * as miniseed from 'seisplotjs-miniseed';
import * as filter from 'seisplotjs-filter';
import * as moment from 'moment';
import { EventApiService } from '@app/core/services/event-api.service.js';
import { EventWaveformQuery, IEvent } from '@app/core/interfaces/event.interface.js';
import ApiUtil from '@app/core/utils/api-util.js';
import { MatBottomSheetRef, MatBottomSheet, MatDialogRef, MatDialog } from '@angular/material';
import { first } from 'rxjs/operators';
import { EventHelpDialogComponent } from '@app/shared/dialogs/event-help-dialog/event-help-dialog.component';

@Component({
  selector: 'app-waveform-2',
  templateUrl: './waveform-2.component.html',
  styleUrls: ['./waveform-2.component.scss']
})

export class Waveform2Component implements OnInit, OnDestroy {

  private _event: IEvent;

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

  private passband: any;
  private convYUnits: number;
  private bHoldEventTrigger: boolean;
  private menu: any;
  private bMenuVisible: boolean;
  private xViewPortMinStack: any[];
  private xViewportMaxStack: any[];
  private timezone: string;

  eventMessage: any;
  subscription: Subscription;
  site: any;
  network: any;
  allSensors: any[];
  contextSensor: any[];
  allPicks: any[];
  allPicksChanged: any[];
  originTravelTimes: any[];
  activeSensors: any[];
  lastPicksState: any;
  timeOrigin: any;
  contextTimeOrigin: any;
  timeEnd: any;
  origin: any;
  waveformOrigin: any;
  options: any;

  bCommonTime: boolean;
  bCommonAmplitude: boolean;
  bZoomAll: boolean;
  bDisplayComposite: boolean;
  bSortTraces: boolean;
  bShowPredictedPicks: boolean;
  bRemoveBias: boolean;
  numPoles: any;
  lowFreqCorner: any;
  highFreqCorner: any;

  pickingMode: any;

  bFilterChanged: boolean;

  picksBias: number;

  selected: number;
  selectedContextMenu: number;
  lastSelectedXPosition: number;
  lastDownTarget: any;  // last mouse down selection
  eventTimeOriginHeader: string;

  page_size = globals.chartsPerPage;
  page_number: number;
  num_pages: number;
  loaded_pages: number;
  progressValue: number;

  chartHeight: number;
  pageOffsetX: number;
  pageOffsetY: number;

  loading = false;
  treeLoading = false;
  bDataLoading = false;
  monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  currentEventId: string;

  picksWarning: string;
  tracesInfo: string;

  maxFreq = globals.highFreqCorner;
  rateControl = new FormControl('rateControl', [Validators.max(this.maxFreq)]);
  minRateControl = new FormControl('minRateControl', [Validators.min(0)]);

  helpDialogRef: MatDialogRef<EventHelpDialogComponent>;
  helpDialogOpened = false;

  constructor(
    private _eventApiService: EventApiService,
    private _catalogService: CatalogApiService,
    private _matDialog: MatDialog
  ) { }

  ngOnDestroy() { }

  async ngOnInit() {

    const self = this;

    self.options = JSON.parse(window.localStorage.getItem('viewer-options'));
    self.options = self.options ? self.options : {};

    self.bCommonTime = true;
    self.bCommonAmplitude = false;
    self.bZoomAll = false;
    self.bDisplayComposite = true;
    self.bSortTraces = false;
    self.bShowPredictedPicks = true;
    self.bRemoveBias = false;
    self.picksBias = 0;
    self.num_pages = 0;
    self.loaded_pages = 0;
    self.progressValue = 0;

    self.numPoles = self.options.hasOwnProperty('numPoles') ? self.options.numPoles : globals.numPoles;
    self.lowFreqCorner = self.options.hasOwnProperty('lowFreqCorner') ? self.options.lowFreqCorner : globals.lowFreqCorner;
    self.highFreqCorner = self.options.hasOwnProperty('highFreqCorner') ? self.options.highFreqCorner : globals.highFreqCorner;
    self.site = self.options.hasOwnProperty('site') ? self.options.site : '';
    self.network = self.options.hasOwnProperty('network') ? self.options.network : '';

    self.passband = filter.BAND_PASS;

    self.convYUnits = 1000; // factor to convert input units from m to mmm

    self.selected = -1;
    self.selectedContextMenu = -1;
    self.lastSelectedXPosition = -1;

    self.menu = document.querySelector('.menu');
    self.bMenuVisible = false;

    self.pageOffsetX = $('#waveform-panel').offsetParent()[0].offsetLeft;
    self.pageOffsetY = $('#waveform-panel').position().top + 30;
    self.chartHeight = Math.floor((window.innerHeight - self.pageOffsetY - 20) / globals.chartsPerPage);
    self.page_number = 0;

    self.waveformOrigin = {};

    self.timezone = '+00:00';
    self.bFilterChanged = true;

    self.pickingMode = 'none';
    self.lastPicksState = null;


    $('#commonAmplitude').on('click', () => {
      self.bCommonAmplitude = !self.bCommonAmplitude;
      $(this).toggleClass('active');
      self.resetAllChartsViewY();
    });

    $('#commonTime').on('click', () => {
      self.bCommonTime = !self.bCommonTime;
      $(this).toggleClass('active');
      self.resetAllChartsViewX();
    });

    $('#zoomAll').on('click', () => {
      self.bZoomAll = !self.bZoomAll;
      $(this).toggleClass('active');
    });

    $('#display3C').on('click', () => {
      self.bDisplayComposite = !self.bDisplayComposite;
      $(this).toggleClass('active');
      self.changePage(false);
    });

    $('#sortTraces').on('click', () => {
      if (!self.bSortTraces) { // turn on once only
        self.bSortTraces = !self.bSortTraces;
        $(this).toggleClass('active');
        self.sortTraces();
        self.changePage(false);
      }
    });

    $('#togglePredictedPicks').on('click', () => {
      self.bShowPredictedPicks = !self.bShowPredictedPicks;
      self.togglePredictedPicksVisibility(self.bShowPredictedPicks);
      $(this).toggleClass('active');
    });

    $('#togglePredictedPicksBias').on('click', () => {
      if (self.picksBias === 0) {  // if pagination is enabled calculate bias first time button is clicked
        self.calcPicksBias();
      }
      self.bRemoveBias = !self.bRemoveBias;
      self.changePredictedPicksByBias(self.bRemoveBias, true);
      $(this).toggleClass('active');
    });

    // If the context menu element is clicked
    $('.menu li').on('click', function () {
      if (self.selectedContextMenu !== -1) {
        // This is the triggered action name
        const action = $(this).attr('data-action');
        switch (action) {

          // A case for each action. Your actions here
          case 'deleteP': self.deletePicks(self.selectedContextMenu, 'P', null); break;
          case 'deleteS': self.deletePicks(self.selectedContextMenu, 'S', null); break;
          case 'newP': self.addPick(self.selectedContextMenu, 'P', null); break;
          case 'newS': self.addPick(self.selectedContextMenu, 'S', null); break;
          case 'showTooltip': self.toggleTooltip(self.selectedContextMenu, null); break;
          default: break;
        }
      }

      // Hide it AFTER the action was triggered
      self.selectedContextMenu = -1;
      self.toggleMenu('hide');
    });

    self.addEventListeners();
  }

  private _handleEvent(event) {
    this.currentEventId = event.event_resource_id;
    if (globals.enablePagingLoad) {
      if (this.bDataLoading) {
        this.loading = true;
      }
      this.loadEventFirstPage(event);
    } else {
      this.loadEvent(event);
    }
  }


  reload(params) {
    if (params.hasOwnProperty('reload')) {
      let url = location.href;
      if (url.endsWith('reload')) {
        url = url.slice(0, -6);
        window.location.replace(url);
      }
    }
  }

  async getNotification(message) {
    console.log(`getNotification`);
    console.log(message);

    // console.log(message);
    if (!message.hasOwnProperty('event_resource_id')) {
      if (message.action === 'treeLoaded') {
        this.loading = false;
        return;
      }
      this.currentEventId = null;
      this.destroyCharts();
      if (message.action === 'treeLoading') {
        this.loading = true;
      }
      return;
    }
    if (message.hasOwnProperty('timezone')) {
      this.timezone = message.timezone;
    }
    /*
    if (message.action === 'interactive-process' && message.event_resource_id === this.currentEventId) {
        this.onInteractiveProcess();
    }
    */
    if (message.action === 'load' && message.event_resource_id !== this.currentEventId) {
      this.currentEventId = message.event_resource_id;
      if (globals.enablePagingLoad) {
        if (this.bDataLoading) {
          this.loading = true;
        }
        this.loadEventFirstPage(message);
      } else {
        this.loadEvent(message);
      }
    }
  }

  delay(timer) {
    return new Promise(resolve => {
      timer = timer || 2000;
      setTimeout(function () {
        resolve();
      }, timer);
    });
  }


  saveOption(option) {
    const self = this;

    self.options[option] = self[option];
    window.localStorage.setItem('viewer-options', JSON.stringify(self.options));
  }

  loadEvent(event) {
    const self = this;
    console.log(`loadEvent`);

    if (event.hasOwnProperty('waveform_file') || event.hasOwnProperty('variable_size_waveform_file')) {
      const id = event.event_resource_id;
      const preferred_origin_id = event.preferred_origin_id;
      self.getEvent(event, null).then(eventFile => {
        if (eventFile) {
          const eventData = self.parseMiniseed(eventFile, false);
          if (eventData && eventData.hasOwnProperty('sensors')) {
            // filter and recompute composite traces
            self.allSensors = self.addCompositeTrace(self.filterData(eventData.sensors));
            self.timeOrigin = eventData.timeOrigin;
            self.timeEnd = moment(self.timeOrigin).add(globals.fixedDuration, 'seconds');
            if (self.allSensors.length > 0) {
              // get origins
              this._catalogService.get_origins_by_id(self.site, self.network, id).subscribe(origins => {
                let origin = self.findValue(origins, 'origin_resource_id', preferred_origin_id);
                if (!origin) {
                  window.alert('Event preferred origin from catalog not found');
                  console.log('Event preferred origin from catalog not found');
                  origin = self.findValue(origins, 'preferred_origin', true);
                }
                this.page_number = 1;
                if (origin) {
                  self.waveformOrigin = origin;
                  // get travel times for preferred origin
                  this._catalogService.get_traveltimes_by_id(self.site, self.network, id, origin.origin_resource_id)
                    .subscribe(traveltimes => {
                      self.originTravelTimes = traveltimes;
                      this.addPredictedPicksData(self.allSensors, self.timeOrigin);
                      // get arrivals, picks for preferred origin
                      this._catalogService.get_arrivals_by_id(self.site, self.network, id, origin.origin_resource_id)
                        .subscribe(picks => {
                          self.allPicks = picks;
                          self.allPicksChanged = JSON.parse(JSON.stringify(self.allPicks));
                          this.addArrivalsPickData(self.allSensors, self.timeOrigin);

                          self.activateRemoveBias(false);

                          if (!self.bSortTraces) { // sort traces on when loading all data (no pagination)
                            self.bSortTraces = !self.bSortTraces;
                            $('#sortTraces').toggleClass('active');
                            $('#sortTraces').prop('hidden', true); // hide button
                          }
                          self.sortTraces();

                          $('#toggleSaveEventType').prop('disabled', true); // save button disabled initially
                          $('#toggleSaveEventStatus').prop('disabled', true); // save button disabled initially

                          // display data (first page)
                          self.changePage(true);
                        });
                    });
                } else {
                  console.log('No event preferred origin found');
                  // display data (first page)
                  self.changePage(true);
                }
              });
              console.log('Loaded data for ' + self.allSensors.length + ' sensors');
              this.eventTimeOriginHeader = 'Site: ' + this.site +
                ' Network: ' + this.network + ' ' +
                moment(eventData.timeOrigin).utc().utcOffset(self.timezone)
                  .format('YYYY-MM-DD HH:mm:ss.S');
            }
          }
        }
      });
    }
  }

  loadEventFirstPage(event) {
    const self = this;

    if (event.hasOwnProperty('waveform_file') || event.hasOwnProperty('variable_size_waveform_file')) {
      const message = event;
      const id = event.event_resource_id;
      const preferred_origin_id = event.preferred_origin_id;
      // first page
      this.page_number = 1;
      self.bDataLoading = true;
      self.getEventPage(id, 1).then(eventFile => {
        if (id === self.currentEventId) {
          if (eventFile) {
            const eventData = self.parseMiniseed(eventFile, false);
            if (eventData && eventData.hasOwnProperty('sensors')) {
              // filter and recompute composite traces
              self.allSensors = self.addCompositeTrace(self.filterData(eventData.sensors));
              self.loaded_pages = 1;
              self.progressValue = (self.loaded_pages / self.num_pages) * 100;
              for (let i = self.allSensors.length; i < self.num_pages * (self.page_size - 1); i++) {
                self.allSensors[i] = { 'channels': [] };
              }
              self.timeOrigin = eventData.timeOrigin;
              self.timeEnd = moment(self.timeOrigin).add(globals.fixedDuration, 'seconds');
              if (self.allSensors.length > 0) {
                // get origins
                this._catalogService.get_origins_by_id(self.site, self.network, id).subscribe(origins => {
                  let origin = self.findValue(origins, 'origin_resource_id', preferred_origin_id);
                  if (!origin) {
                    window.alert('Warning: Event preferred origin from catalog not found');
                    origin = self.findValue(origins, 'preferred_origin', true);
                  }
                  if (origin) {
                    self.waveformOrigin = origin;
                    // get travel times for preferred origin
                    this._catalogService.get_traveltimes_by_id
                      (self.site, self.network, id, origin.origin_resource_id)
                      .subscribe(traveltimes => {
                        self.originTravelTimes = traveltimes;
                        this.addPredictedPicksData(self.allSensors, self.timeOrigin);
                        // get arrivals, picks for preferred origin
                        this._catalogService.get_arrivals_by_id
                          (self.site, self.network, id, origin.origin_resource_id)
                          .subscribe(picks => {
                            self.allPicks = picks;
                            self.allPicksChanged = JSON.parse(JSON.stringify(self.allPicks));
                            this.addArrivalsPickData(self.allSensors, self.timeOrigin);

                            self.picksBias = 0;
                            if (self.bRemoveBias) { // by default turn remove bias off with paged loading
                              self.bRemoveBias = !self.bRemoveBias;
                              $('#togglePredictedPicksBias').toggleClass('active');
                            }

                            if (self.bSortTraces) { // by default turn off sort traces with paged loading
                              self.bSortTraces = !self.bSortTraces;
                              $('#sortTraces').toggleClass('active');
                              $('#sortTraces').prop('hidden', false); // button visible
                            }

                            $('#toggleSaveEventType').prop('disabled', true); // save button disabled initially
                            $('#toggleSaveEventStatus').prop('disabled', true); // save button disabled initially

                            // disable buttons until all pages are loaded
                            $('#togglePredictedPicksBias').prop('disabled', true); // button disabled
                            $('#sortTraces').prop('disabled', true); // button disabled

                            self.getEvent(event, true).then(contextFile => {
                              if (id === self.currentEventId) {
                                if (contextFile) {
                                  const contextData = self.parseMiniseed(contextFile, true);
                                  if (contextData && contextData.hasOwnProperty('sensors')) {
                                    self.contextSensor = self.filterData(contextData.sensors);
                                    self.contextSensor = contextData.sensors;
                                    self.contextTimeOrigin = contextData.timeOrigin;
                                  }
                                }
                                self.changePage(true);  // display data (first page)
                                if (self.loaded_pages === self.num_pages) {
                                  self.afterLoading(id);
                                } else {
                                  this.asyncLoadEventPages(id);  // load next pages
                                }
                              }
                            });

                            this.eventTimeOriginHeader = 'Site: ' + this.site +
                              ' Network: ' + this.network + ' ' +
                              moment(eventData.timeOrigin).utc().utcOffset(self.timezone)
                                .format('YYYY-MM-DD HH:mm:ss.S');
                          });
                      });
                  } else {
                    window.alert('No event preferred origin found');
                  }
                });
              }
            }
          }
        }

      });
    }
  }

  async asyncLoadEventPages(event_id) {
    const self = this;

    for (let i = 2; i <= self.num_pages; i++) {
      if (event_id !== self.currentEventId) {
        console.log('Changed event on loading pages');
        break;
      }
      await self.getEventPage(event_id, i).then(eventFile => {
        if (event_id === self.currentEventId) {
          const eventData = self.parseMiniseed(eventFile, false);
          if (eventData && eventData.hasOwnProperty('sensors') && eventData.sensors.length > 0) {
            if (!self.timeOrigin.isSame(eventData.timeOrigin)) {
              console.log('Warning: Different origin time on page: ', i);
            }
            // filter and recompute composite traces
            const sensors = self.addCompositeTrace(self.filterData(eventData.sensors));
            self.addPredictedPicksData(sensors, self.timeOrigin);
            self.addArrivalsPickData(sensors, self.timeOrigin);
            for (let j = 0; j < sensors.length; j++) {
              self.allSensors[(self.page_size - 1) * (i - 1) + j] = sensors[j];
            }
          }
          self.loaded_pages++;
          self.progressValue = self.loaded_pages / self.num_pages * 100;
          if (self.loaded_pages === self.num_pages) {
            self.afterLoading(event_id);
          }
        } else {
          console.log('Changed event on await loading');
        }
      });
    }
  }


  afterLoading(event_id) {
    const self = this;

    if (event_id !== self.currentEventId) {
      console.log('Changed event on afterloading');
      return;
    }
    // eliminate placeholders, sanitize sensors array
    let index = self.allSensors.findIndex(sensor => sensor.channels.length === 0);
    while (index >= 0) {
      self.allSensors.splice(index, 1);
      index = self.allSensors.findIndex(sensor => sensor.channels.length === 0);
    }
    self.num_pages = Math.ceil(self.allSensors.length / (self.page_size - 1));
    self.bDataLoading = false; // unlock page changes
    console.log('Loaded data for ' + self.allSensors.length + ' sensors');
    // enable toolbar buttons after all pages are loaded
    $('#sortTraces').prop('disabled', false);
    $('#togglePredictedPicksBias').prop('disabled', false);
    // remove bias from predicted picks, force a refresh
    // self.activateRemoveBias(true);
  }

  confirmEvent(event) {
    console.log(event);
    if (event.hasOwnProperty('reprocess')) {
      const event_id = event.reprocess.event_resource_id;
      // const new_origin_id = event.reprocess.origin_resource_id;
      console.log(event_id);
    }

  }

  sort_array_by(field, reverse, primer) {

    const key = primer ?
      function (x) { return primer(x[field]); } :
      function (x) { return x[field]; };

    reverse = !reverse ? 1 : -1;

    return function (a, b) {
      const A = key(a), B = key(b);
      return ((A < B) ? -1 : ((A > B) ? 1 : 0)) * [-1, 1][+!!reverse];
    };
  }

  findValue(obj, key, value) {
    return obj.find(v => v[key] === value);
  }
  findNestedValue(obj, key, subkey, value, otherkey, othervalue) {
    return obj.find(v => (v[key][subkey].toString() === value.toString() && v[otherkey] === othervalue));
  }
  renderPage() {
    const self = this;

    const pageNumber = self.page_number;
    const pageSize = self.page_size - 1; // traces loaded from API
    const numPages = globals.enablePagingLoad ?
      self.num_pages : Math.ceil(self.allSensors.length / pageSize);
    if (pageNumber > 0 && pageNumber <= numPages) {
      self.activeSensors = self.allSensors.slice
        ((pageNumber - 1) * pageSize, Math.min(pageNumber * pageSize, self.allSensors.length));
      self.activeSensors.push(self.contextSensor[0]);  // context trace is last
      self.renderCharts();
      self.renderContextChart();
      self.setChartKeys();
      for (const sensor of self.activeSensors) {
        sensor.chart.options.viewportMinStack = self.xViewPortMinStack;
        sensor.chart.options.viewportMaxStack = self.xViewportMaxStack;
      }
    }
  }


  changePage(reset) {
    const self = this;
    if (!reset) {
      this.updateArrivalWithPickData();
    }
    if (self.bDataLoading && self.page_number > self.loaded_pages) {
      window.alert('Please wait for requested page to load');
      return;  // no page change til data is fully loaded
    }
    // reset last selected channel
    self.lastDownTarget = null;
    // reset picks last known state
    self.lastPicksState = null;
    if (reset) { // first page , new event
      self.xViewPortMinStack = [];
      self.xViewportMaxStack = [];
    } else {             // remember zoom history
      self.xViewPortMinStack = self.activeSensors[0].chart.options.viewportMinStack;
      self.xViewportMaxStack = self.activeSensors[0].chart.options.viewportMaxStack;
    }
    self.destroyCharts();
    self.renderPage();
  }

  onInteractiveProcess() {
    const self = this;
    this.updateArrivalWithPickData();
    self._catalogService.update_event_picks_by_id
      (self.currentEventId, self.allPicksChanged)
      .subscribe((response) => {
        console.log(response);
      },
        (error) => {
          window.alert('Error updating event: ' + error.error.message);
        });
  }

  toggleMenu(command) {
    const self = this;
    (<any>self.menu).style.display = command === 'show' ? 'block' : 'none';
    self.bMenuVisible = !self.bMenuVisible;
  }

  setPosition({ top, left }) {
    const self = this;
    (<any>self.menu).style.left = `${left}px`;
    (<any>self.menu).style.top = `${top}px`;
    self.toggleMenu('show');
  }

  maxValue(dataPoints) {
    const self = this;
    let maximum = Math.abs(dataPoints[0].y);
    for (let i = 0; i < dataPoints.length; i++) {
      if (Math.abs(dataPoints[i].y) > maximum) {
        maximum = Math.abs(dataPoints[i].y);
      }
    }
    const ret = Math.ceil(maximum * (self.convYUnits * 10000)) / (self.convYUnits * 10000);
    return ret;
  }

  calculateTimeOffset(time, origin) {  // microsec time offset from the origin full second with millisec precision

    const diff =
      moment(time).millisecond(0)
        .diff(moment(origin).millisecond(0), 'seconds') * 1000000
      + moment(time).millisecond() * 1000;
    return diff;
  }

  calculateTimeOffsetMicro(time, origin) {  // microsec time offset from the origin full second with microsec precision

    const diff =
      moment(time).millisecond(0)
        .diff(moment(origin).millisecond(0), 'seconds') * 1000000
      + parseInt(time.slice(-7, -1), 10);
    return diff;
  }


  addTimeOffsetMicro(origin, micro) {  // microsec time offset from the origin full second with microsec precision

    const fullseconds = Math.floor(micro / 1000000);
    const microsec = micro - fullseconds * 1000000;
    const str = '000000' + microsec;
    const ts = moment(origin).millisecond(0).add(fullseconds, 'seconds');
    return ts.toISOString().slice(0, -4) + str.substring(str.length - 6) + 'Z';
  }

  destroyCharts() {
    const self = this;
    if (self.activeSensors) {
      for (let i = 0; i < self.activeSensors.length; i++) {
        self.activeSensors[i].chart.destroy();
        const elem = document.getElementById(self.activeSensors[i].container);
        if (elem) {
          elem.parentElement.removeChild(elem);
        }
      }
    }
  }


  renderCharts() {
    const self = this;
    // Chart Options, Render
    const divStyle = 'height: ' + self.chartHeight + 'px; max-width: 2000px; margin: 0px auto;';

    for (let i = 0; i < self.activeSensors.length - 1; i++) {

      self.activeSensors[i].container = i.toString() + 'Container';

      if ($('#' + self.activeSensors[i].container).length === 0) {
        $('<div>').attr({
          'id': self.activeSensors[i].container,
          'style': divStyle
        }).appendTo('#waveform-panel');
      }

      const data = [];
      for (const channel of self.activeSensors[i].channels) {
        if ((!self.bDisplayComposite && channel.channel_id !== globals.compositeChannelCode)
          || (self.bDisplayComposite && channel.channel_id === globals.compositeChannelCode)
          || (self.bDisplayComposite && self.activeSensors[i].channels.length === 1)) {
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

      const yMax = self.getYmax(i);

      const options = {
        zoomEnabled: true,
        zoomType: 'x',
        animationEnabled: true,
        rangeChanged: function (e) {
          self.bHoldEventTrigger = true;
          if (!e.chart.options.viewportMinStack) {
            e.chart.options.viewportMinStack = [];
            e.chart.options.viewportMaxStack = [];
          }
          if (e.trigger === 'zoom') {
            if (self.bZoomAll) {
              self.zoomAllCharts(e.axisX[0].viewportMinimum, e.axisX[0].viewportMaximum, true);
            } else {
              e.chart.options.viewportMinStack.push(e.axisX[0].viewportMinimum);
              e.chart.options.viewportMaxStack.push(e.axisX[0].viewportMaximum);
            }
          }
          if (e.trigger === 'reset') {
            self.resetChartViewX(e.chart);
          }
          document.getElementById('toolbar').focus();
        },
        title: {
          text: self.activeSensors[i].sensor_code,
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
          contentFormatter: function (e) {
            const content = ' ' +
              '<strong>' + Math.ceil(e.entries[0].dataPoint.y * self.convYUnits * 1000000) / 1000000 + ' mm/s</strong>' +
              '<br/>' +
              '<strong>' + Math.ceil(e.entries[0].dataPoint.x / 1000000 * 1000000) / 1000000 + ' s</strong>';
            return content;
          }
        },
        axisX: {
          minimum: self.timeOrigin ? self.timeOrigin.millisecond() * 1000 : 0,
          maximum: self.getXmax(i),
          viewportMinimum: self.bZoomAll && self.xViewPortMinStack.length > 0 ?
            self.xViewPortMinStack[self.xViewPortMinStack.length - 1] : self.getXvpMin(),
          viewportMaximum: self.bZoomAll && self.xViewportMaxStack.length > 0 ?
            self.xViewportMaxStack[self.xViewportMaxStack.length - 1] : self.getXvpMax(),
          includeZero: true,
          labelAutoFit: false,
          labelWrap: false,
          labelFormatter: function (e) {
            if (e.value === 0) {
              const d = moment(self.timeOrigin).utc().utcOffset(self.timezone);
              return d.format('HH:mm:ss.S');
            } else {
              return e.value / 1000000 + ' s';
            }
          },
          stripLines: self.activeSensors[i].picks
        },
        axisY: {
          minimum: -yMax,
          maximum: yMax,
          interval: self.bCommonAmplitude ? null : yMax / 2,
          includeZero: true,
          labelFormatter: function (e) {
            if (e.value === 0) {
              return '0 mm/s';
            } else {
              return Math.ceil(e.value * self.convYUnits * 1000) / 1000;
            }
          }
        },
        data: data
      };

      self.activeSensors[i].chart = new CanvasJS.Chart(self.activeSensors[i].container, options);

      self.activeSensors[i].chart.render();
    }
  }

  addEventListeners() {
    const self = this;

    document.addEventListener('keydown', (e: any) => {
      const target = e.target || e.srcElement;
      if (!/INPUT|TEXTAREA|SELECT|BUTTON/.test(target.nodeName)) {
        if (e.keyCode === 80) {  // p
          self.togglePredictedPicks();
        }
        if (e.keyCode === 90) {  // z
          self.toggleCommonTime();
        }
        if (e.keyCode === 88) {   // x
          self.toggleCommonAmplitude();
        }
        if (e.keyCode === 68) {   // d
          if (self.pickingMode === 'P') {
            self.pickingMode = 'none';
          } else {
            self.pickingMode = 'P';
          }
        }
        if (e.keyCode === 70) {   // f
          if (self.pickingMode === 'S') {
            self.pickingMode = 'none';
          } else {
            self.pickingMode = 'S';
          }
        }
        if (e.keyCode === 83) {   // s, undo picking
          self.undoLastPicking();
        }
        if (e.keyCode === 72) {   // h, help
          document.getElementById('helpBtn').click();
        }
        if (e.keyCode === 39) {  // right arrow moves pick to right
          if (self.pickingMode !== 'none' && self.lastDownTarget !== null && self.lastDownTarget > -1) {
            const step = globals.pickTimeStep * 1000; // in microseconds
            if (e.shiftKey) { // shift key - fast mode - by 10 * step
              self.movePick(self.lastDownTarget, self.pickingMode, step * 10, true, true);
            } else { // by step
              self.movePick(self.lastDownTarget, self.pickingMode, step, true, true);
            }
          }
        }
        if (e.keyCode === 37) {  // left arrow moves pick to left
          if (self.pickingMode !== 'none' && self.lastDownTarget !== null && self.lastDownTarget > -1) {
            const step = globals.pickTimeStep * 1000; // in microseconds
            if (e.shiftKey) { // shift key - fast mode - by 10 * step
              self.movePick(self.lastDownTarget, self.pickingMode, -step * 10, true, true);
            } else { // by step
              self.movePick(self.lastDownTarget, self.pickingMode, -step, true, true);
            }
          }
        }
        if (e.keyCode === 49 || e.keyCode === 97) {
          if (self.page_number > 1) {
            self.page_number = self.page_number - 1;
            self.changePage(false);
          }
        }
        if (e.keyCode === 50 || e.keyCode === 98) {
          const numPages = globals.enablePagingLoad ?
            self.loaded_pages : Math.ceil(self.allSensors.length / (self.page_size - 1));
          if (self.page_number < numPages) {
            self.page_number = self.page_number + 1;
            self.changePage(false);
          }
        }
      }
    },
      false);

  }

  renderContextChart() {
    const self = this;
    const divStyle = 'height: ' + self.chartHeight + 'px; max-width: 2000px; margin: 0px auto;';
    // Chart Options, Render

    const i = self.activeSensors.length - 1;

    self.activeSensors[i].container = i.toString() + 'Container';

    if ($('#' + self.activeSensors[i].container).length === 0) {
      $('<div>').attr({
        'id': self.activeSensors[i].container,
        'style': divStyle
      }).appendTo('#waveform-panel');
    }

    const data = [];
    for (const channel of self.activeSensors[i].channels) {
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

    const yMax = self.getYmax(i);

    const timeOriginValue = self.calculateTimeOffset(self.timeOrigin, self.contextTimeOrigin);
    const optionsContext = {
      zoomEnabled: true,
      animationEnabled: true,
      title: {
        text: self.activeSensors[i].sensor_code,
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
        contentFormatter: function (e) {
          const content = ' ' +
            '<strong>' + Math.ceil(e.entries[0].dataPoint.y * self.convYUnits * 1000000) / 1000000 + ' mm/s</strong>' +
            '<br/>' +
            '<strong>' + Math.ceil(e.entries[0].dataPoint.x / 1000000 * 1000000) / 1000000 + ' s</strong>';
          return content;
        }
      },
      axisX: {
        minimum: self.contextTimeOrigin.millisecond() * 1000,
        maximum: Math.max(
          self.contextSensor[0].channels[0].microsec + self.contextSensor[0].channels[0].duration,
          self.calculateTimeOffset(self.timeEnd, self.contextTimeOrigin)),
        viewportMinimum: self.xViewPortMinStack.length > 0 ?
          self.xViewPortMinStack[self.xViewPortMinStack.length - 1] : null,
        viewportMaximum: self.bZoomAll && self.xViewportMaxStack.length > 0 ?
          self.xViewportMaxStack[self.xViewportMaxStack.length - 1] : null,
        includeZero: true,
        labelAutoFit: false,
        labelWrap: false,
        labelFormatter: function (e) {
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
        interval: self.bCommonAmplitude ? null : yMax / 2,
        includeZero: true,
        labelFormatter: function (e) {
          if (e.value === 0) {
            return '0 mm/s';
          } else {
            return Math.ceil(e.value * self.convYUnits * 1000) / 1000;
          }
        }
      },
      data: data
    };
    optionsContext.data[0].dataPoints[0]['indexLabel'] =
      moment(self.contextSensor[0].channels[0].start).utc().utcOffset(self.timezone).format('HH:mm:ss.S');
    self.activeSensors[i].chart = new CanvasJS.Chart(self.activeSensors[i].container, optionsContext);

    self.activeSensors[i].chart.render();
  }

  onPickingModeChange(value) {
    const self = this;
    self.pickingMode = value;
  }

  setChartKeys() {
    const self = this;
    for (let j = 0; j < self.activeSensors.length; j++) {
      const canvas_chart = '#' + self.activeSensors[j].container + ' > .canvasjs-chart-container > .canvasjs-chart-canvas';

      if (j < self.activeSensors.length - 1) {    // exclude context trace
        // Create or move picks
        $(canvas_chart).last().on('click', function (e) {
          if (self.selected === -1) { // ignore if we have a drag event
            const ind = parseInt($(this).parent().parent()[0].id.replace('Container', ''), 10);
            const chart = self.activeSensors[ind].chart;
            const parentOffset = $(this).parent().offset();
            const relX = e.pageX - parentOffset.left;
            if (self.pickingMode === 'P') { // create or move P pick on Left mouse click in P picking mode
              if (!self.bHoldEventTrigger) {
                self.addPick(ind, 'P', chart.axisX[0].convertPixelToValue(relX));
              }
            } else if (self.pickingMode === 'S') { // create or move S pick on Left mouse click in S picking mode
              if (!self.bHoldEventTrigger) {
                self.addPick(ind, 'S', chart.axisX[0].convertPixelToValue(relX));
              }
            } else {
              if (e.ctrlKey) {  // create or move P on Ctrl + left mouse button click
                self.addPick(ind, 'P', chart.axisX[0].convertPixelToValue(relX));
              } else if (e.shiftKey) {   // create or move S pick on Shift + left mouse button click
                self.addPick(ind, 'S', chart.axisX[0].convertPixelToValue(relX));
              }
            }
          }
        });

        // Drag picks
        $(canvas_chart).last().on('mousedown', function (e) {
          // e.target equals current canvaj_chart: $(canvas_chart)[1]
          const ind = parseInt($(this).parent().parent()[0].id.replace('Container', ''), 10);
          self.lastDownTarget = ind;

          if (!($(e.target).parents('.menu').length > 0)) {
            if (self.bMenuVisible) {
              self.selectedContextMenu = -1;
              self.toggleMenu('hide');
              return;
            }
          }
          const chart = self.activeSensors[ind].chart;
          const parentOffset = $(this).parent().offset();
          const relX = e.pageX - parentOffset.left;
          const relY = e.pageY - parentOffset.top;
          if (e.button === 0) {  // drag active on left mouse button only
            // check if we are on a pick
            // Get the selected stripLine & change the cursor
            const pickLines = chart.axisX[0].stripLines;
            for (let i = 0; i < pickLines.length; i++) {
              const label = pickLines[i].label;
              if (label !== label.toLowerCase()) { // exclude predicted picks (lowercase labels)
                if (pickLines[i].get('bounds') &&
                  relX > pickLines[i].get('bounds').x1 - globals.snapDistance &&
                  relX < pickLines[i].get('bounds').x2 + globals.snapDistance &&
                  relY > pickLines[i].get('bounds').y1 &&
                  relY < pickLines[i].get('bounds').y2) {  // move pick
                  self.savePicksState(ind, self.activeSensors[ind].sensor_code, self.activeSensors[ind].picks);
                  $(this)[0].style.cursor = 'pointer';
                  self.selected = i;
                  break;
                }
              }
            }
          } else if (e.button === 1) {  // remove P or S on Middle mouse Click
            if (self.pickingMode === 'P') {
              self.deletePicks(ind, 'P', null); // remove P picks on Middle mouse click in P picking mode
            } else if (self.pickingMode === 'S') {
              self.deletePicks(ind, 'S', null); // remove S picks on Middle mouse click in S picking mode
            } else {
              if (e.ctrlKey) {
                self.deletePicks(ind, 'P', null); // remove P on Ctrl + Middle mouse button click
              } else if (e.shiftKey) {
                self.deletePicks(ind, 'S', null); // remove S on Shift + Middle mouse button click
              }
            }
          } else if (e.button === 2) {  // save position on right mouse button, context menu
            self.lastSelectedXPosition = chart.axisX[0].convertPixelToValue(relX);
          }
        });

        $(canvas_chart).last().on('mousemove', function (e) {  // move selected stripLine
          if (self.selected !== -1) {
            self.bHoldEventTrigger = true;
            const i = parseInt($(this).parent().parent()[0].id.replace('Container', ''), 10);
            const chart = self.activeSensors[i].chart;
            const parentOffset = $(this).parent().offset();
            const relX = e.pageX - parentOffset.left;
            const data = chart.options.data[0].dataPoints;
            const position = Math.round(chart.axisX[0].convertPixelToValue(relX));
            const pickType = chart.options.axisX.stripLines[self.selected].label;
            const otherPickType = pickType === 'P' ? 'S' : pickType === 'S' ? 'P' : '';
            const otherPick = self.findValue(self.activeSensors[i].picks, 'label', otherPickType);
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
              $(this)[0].style.cursor = 'pointer';
              chart.options.axisX.stripLines[self.selected].value = position;
              self.activeSensors[i].picks = chart.options.axisX.stripLines;
              chart.options.zoomEnabled = false;
              chart.render();
            }
          }
        });

        $(canvas_chart).last().on('mouseup', function (e) {
          setTimeout(function () {
            self.bHoldEventTrigger = false;
          }, 500);
          if (self.selected !== -1) {   // clear selection and change the cursor
            $(this)[0].style.cursor = 'default';
            self.selected = -1;
            const i = parseInt($(this).parent().parent()[0].id.replace('Container', ''), 10);
            const chart = self.activeSensors[i].chart;
            chart.options.axisX.stripLines = self.activeSensors[i].picks;
            chart.options.zoomEnabled = true;   // turn zoom back on
            chart.render();
            document.getElementById('toolbar').focus();
          }
        });

      }  // not on context trace

      // Wheel events: zoomp/pan, move picks in picking mode
      $(canvas_chart)[1].addEventListener('wheel', function (e) {
        // in pick mode wheel up moves pick left, wheel down moves pick right
        if (self.pickingMode !== 'none'
          && !e.ctrlKey && !e.shiftKey && !e.altKey) {
          const i = parseInt($(this).parent().parent()[0].id.replace('Container', ''), 10);
          if (i < self.activeSensors.length - 1) {
            const step = globals.pickTimeStep * 1000; // in microseconds
            if (e.deltaY < 0) { // scrolling up
              self.movePick(i, self.pickingMode, -step, true, false);
            } else if (e.deltaY > 0) { // scrolling down
              self.movePick(i, self.pickingMode, step, true, false);
            }
          }
        }
        // Y Zoom if Ctrl + Wheel, X axis (time) Zoom if Shift + Wheel; X axis (time) pan if Alt + Wheel
        if (e.ctrlKey || e.shiftKey || e.altKey) {

          e.preventDefault();

          const i = parseInt($(this).parent().parent()[0].id.replace('Container', ''), 10);
          const chart = self.activeSensors[i].chart;

          const relOffsetX = e.clientX - self.pageOffsetX;
          const relOffsetY = e.clientY - self.pageOffsetY - i * self.chartHeight;

          if (relOffsetX < chart.plotArea.x1 ||
            relOffsetX > chart.plotArea.x2 ||
            relOffsetY < chart.plotArea.y1 ||
            relOffsetY > chart.plotArea.y2) {
            return;
          }

          const axis = (e.shiftKey || e.altKey) ? chart.axisX[0] : e.ctrlKey ? chart.axisY[0] : null;

          const viewportMin = axis.get('viewportMinimum'),
            viewportMax = axis.get('viewportMaximum'),
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
            if (self.bZoomAll
              && i < self.activeSensors.length - 1) {  // exclude context trace
              self.zoomAllCharts(newViewportMin, newViewportMax, e.shiftKey || e.altKey);
            } else {  // zoom selected trace only
              if (newViewportMin >= axis.get('minimum') && newViewportMax <= axis.get('maximum')) {
                axis.set('viewportMinimum', newViewportMin, false);
                axis.set('viewportMaximum', newViewportMax);
                chart.render();
              }
            }
            document.getElementById('toolbar').focus();
          }
        }
      });

      if (j < self.activeSensors.length - 1) {  // exclude context trace
        $('#' + self.activeSensors[j].container).on('contextmenu', e => {
          e.preventDefault();
          const origin = {
            left: e.pageX,
            top: e.pageY
          };
          self.setPosition(origin);
          self.selectedContextMenu = j;
          return false;
        });
      }
    }
  }


  togglePredictedPicks() {
    const self = this;
    self.bShowPredictedPicks = !self.bShowPredictedPicks;
    if (self.bShowPredictedPicks) {
      $('#togglePredictedPicks').addClass('active');
      $('#togglePredictedPicks')[0].setAttribute('aria-pressed', 'true');
    } else {
      $('#togglePredictedPicks').removeClass('active focus');
      $('#togglePredictedPicks')[0].setAttribute('aria-pressed', 'false');
    }
    self.togglePredictedPicksVisibility(self.bShowPredictedPicks);
  }

  toggleCommonTime() {
    const self = this;
    self.bCommonTime = !self.bCommonTime;
    if (self.bCommonTime) {
      $('#commonTime').addClass('active');
      $('#commonTime')[0].setAttribute('aria-pressed', 'true');
    } else {
      $('#commonTime').removeClass('active focus');
      $('#commonTime')[0].setAttribute('aria-pressed', 'false');
    }
    self.resetAllChartsViewX();
  }

  toggleCommonAmplitude() {
    const self = this;
    self.bCommonAmplitude = !self.bCommonAmplitude;
    if (self.bCommonAmplitude) {
      $('#commonAmplitude').addClass('active');
      $('#commonAmplitude')[0].setAttribute('aria-pressed', 'true');
    } else {
      $('#commonAmplitude').removeClass('active focus');
      $('#commonAmplitude')[0].setAttribute('aria-pressed', 'false');
    }
    self.resetAllChartsViewY();
  }

  updateZoomStackCharts(vpMin, vpMax) {
    const self = this;
    if (self.xViewPortMinStack.length === 0 || self.xViewPortMinStack[self.xViewPortMinStack.length - 1] !== vpMin) {
      self.xViewPortMinStack.push(vpMin);
      self.xViewportMaxStack.push(vpMax);
      for (let i = 0; i < self.activeSensors.length; i++) {
        const chart = self.activeSensors[i].chart;
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

  resetAllChartsViewX() {
    const self = this;
    for (let i = 0; i < self.activeSensors.length - 1; i++) {
      self.resetChartViewX(self.activeSensors[i].chart);
    }
    self.resetChartViewXContext(self.activeSensors[self.activeSensors.length - 1].chart);
  }

  resetAllChartsViewY() {
    const self = this;
    for (let i = 0; i < self.activeSensors.length - 1; i++) {
      self.resetChartViewY(self.activeSensors[i].chart);
    }
    self.resetChartViewYContext(self.activeSensors[self.activeSensors.length - 1].chart);
  }

  resetAllChartsViewXY() {
    const self = this;

    for (let i = 0; i < self.activeSensors.length - 1; i++) {
      self.resetChartViewXY(self.activeSensors[i].chart);
    }
    self.resetChartViewXYContext(self.activeSensors[self.activeSensors.length - 1].chart);
  }


  resetChartViewX(chart) {
    const self = this;
    const channel = parseInt(chart.container.id.replace('Container', ''), 10);
    chart.options.axisX.viewportMinimum = self.getXvpMin();
    chart.options.axisX.viewportMaximum = self.getXvpMax();
    chart.options.axisX.minimum = self.timeOrigin ? self.timeOrigin.millisecond() * 1000 : 0;
    chart.options.axisX.maximum = self.getXmax(channel);
    chart.options.viewportMinStack = [];
    chart.options.viewportMaxStack = [];
    chart.render();
  }

  resetChartViewXContext(chart) {
    const self = this;
    chart.options.axisX.viewportMinimum = null;
    chart.options.axisX.viewportMaximum = null;
    chart.options.axisX.minimum = self.contextTimeOrigin.millisecond() * 1000;
    chart.options.axisX.maximum = self.getXmaxContext();
    chart.options.viewportMinStack = [];
    chart.options.viewportMaxStack = [];
    chart.render();
  }

  resetChartViewY(chart) {
    const self = this;
    const channel = parseInt(chart.container.id.replace('Container', ''), 10);
    chart.options.axisY.viewportMinimum = null;
    chart.options.axisY.viewportMaximum = null;
    chart.options.axisY.maximum = self.getYmax(channel);
    chart.options.axisY.minimum = -chart.options.axisY.maximum;
    chart.options.axisY.interval = chart.options.axisY.maximum / 2;
    chart.render();
  }

  resetChartViewYContext(chart) {
    const self = this;
    chart.options.axisY.viewportMinimum = null;
    chart.options.axisY.viewportMaximum = null;
    chart.options.axisY.maximum = self.getYmaxContext();
    chart.options.axisY.minimum = -chart.options.axisY.maximum;
    chart.options.axisY.interval = chart.options.axisY.maximum / 2;
    chart.render();
  }

  resetChartViewXY(chart) {
    const self = this;
    const channel = parseInt(chart.container.id.replace('Container', ''), 10);
    chart.options.axisX.viewportMinimum = self.getXvpMin();
    chart.options.axisX.viewportMaximum = self.getXvpMax();
    chart.options.axisX.minimum = self.timeOrigin ? self.timeOrigin.millisecond() * 1000 : 0;
    chart.options.axisX.maximum = self.getXmax(channel);
    chart.options.viewportMinStack = [];
    chart.options.viewportMaxStack = [];
    chart.options.axisY.viewportMinimum = null;
    chart.options.axisY.viewportMaximum = null;
    chart.options.axisY.maximum = self.getYmax(channel);
    chart.options.axisY.minimum = -chart.options.axisY.maximum;
    chart.render();
  }

  resetChartViewXYContext(chart) {
    const self = this;
    chart.options.axisX.viewportMinimum = null;
    chart.options.axisX.viewportMaximum = null;
    chart.options.axisX.minimum = self.contextTimeOrigin.millisecond() * 1000;
    chart.options.axisX.maximum = self.getXmaxContext();
    chart.options.viewportMinStack = [];
    chart.options.viewportMaxStack = [];
    chart.options.axisY.viewportMinimum = null;
    chart.options.axisY.viewportMaximum = null;
    chart.options.axisY.maximum = self.getYmaxContext();
    chart.options.axisY.minimum = -chart.options.axisY.maximum;
    chart.render();
  }

  getXmax(pos) {
    const self = this;
    const endMicrosec = self.activeSensors[pos].channels[0].microsec + self.activeSensors[pos].channels[0].duration;
    return self.bCommonTime ?
      Math.max(endMicrosec, self.timeOrigin.millisecond() * 1000 + globals.fixedDuration * 1000000) : endMicrosec;
  }

  getXmaxContext() {
    const self = this;
    const val = self.contextSensor[0].channels.length > 0 ?
      self.contextSensor[0].channels[0].microsec + self.contextSensor[0].channels[0].duration : null;
    return val;
  }

  getXvpMax() {
    const self = this;
    return self.bCommonTime ? self.timeOrigin.millisecond() * 1000 + globals.fixedDuration * 1000000 : null;
  }

  getXvpMin() {
    const self = this;
    return self.bCommonTime ? 0 : null;
  }

  getValueMaxAll() {
    const self = this;
    let val;
    for (let i = 0; i < self.activeSensors.length - 1; i++) {
      for (let j = 0; j < self.activeSensors[i].channels.length; j++) {
        val = i === 0 && j === 0 ?
          self.maxValue(self.activeSensors[0].channels[0].data) :
          Math.max(self.maxValue(self.activeSensors[i].channels[j].data), val);
      }
    }
    return val;
  }


  getYmax(sensor) {
    const self = this;
    let val = 0;
    for (let j = 0; j < self.activeSensors[sensor].channels.length; j++) {
      val = j === 0 ?
        self.maxValue(self.activeSensors[sensor].channels[0].data) :
        Math.max(self.maxValue(self.activeSensors[sensor].channels[j].data), val);
    }
    return (self.bCommonAmplitude || val === 0) ? self.getValueMaxAll() : val;
  }

  getYmaxContext() {
    const self = this;
    const val = self.contextSensor[0].channels.length > 0 ?
      self.maxValue(self.contextSensor[0].channels[0].data) : 0;
    return (val === 0) ? self.getValueMaxAll() : val;
  }


  getAxisMinAll(isXaxis) {
    const self = this;
    let min;
    for (let i = 0; i < self.activeSensors.length; i++) {
      const chart = self.activeSensors[i].chart;
      const axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
      min = i === 0 ? axis.get('minimum') : Math.min(axis.get('minimum'), min);
    }
    return min;
  }

  getAxisMaxAll(isXaxis) {
    const self = this;
    let max;
    for (let i = 0; i < self.activeSensors.length - 1; i++) {
      const chart = self.activeSensors[i].chart;
      const axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
      max = i === 0 ? axis.get('maximum') : Math.max(axis.get('maximum'), max);
    }
    return max;
  }

  zoomAllCharts(vpMin, vpMax, isXaxis) {
    const self = this;
    if (isXaxis) {
      self.updateZoomStackCharts(vpMin, vpMax);
    }
    if (vpMin >= self.getAxisMinAll(isXaxis) && vpMax <= self.getAxisMaxAll(isXaxis)) {
      for (let i = 0; i < self.activeSensors.length - 1; i++) {
        const chart = self.activeSensors[i].chart;
        const axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
        axis.set('viewportMinimum', vpMin, false);
        axis.set('viewportMaximum', vpMax);
        chart.render();
      }
    }
  }

  savePicksState(ind, sensor, picks) {
    const self = this;
    self.lastPicksState = {};
    self.lastPicksState.index = ind;
    self.lastPicksState.sensor_code = sensor;
    self.lastPicksState.picks = JSON.parse(JSON.stringify(picks));
  }

  undoLastPicking() {
    const self = this;
    if (self.lastPicksState) {
      const ind = self.lastPicksState.index;
      const sensor = self.activeSensors[ind];
      if (self.lastPicksState.sensor_code === sensor.sensor_code) {
        const chart = sensor.chart;
        const picks = self.lastPicksState.picks;
        self.savePicksState(ind, sensor.sensor_code, sensor.picks);
        sensor.picks = picks;
        chart.options.axisX.stripLines = sensor.picks;
        chart.render();
      }
    }
  }

  addPick(ind, pickType, value) {
    const self = this;
    const sensor = self.activeSensors[ind];
    const chart = sensor.chart;
    const data = chart.options.data[0].dataPoints;
    const position = value ? Math.round(value) : Math.round(self.lastSelectedXPosition);
    if (position < data[0].x || position > data[data.length - 1].x) {
      window.alert('Pick cannot be created outside of the current trace view');
      return;
    }
    sensor.picks = (typeof sensor.picks !== 'undefined' && sensor.picks instanceof Array) ? sensor.picks : [];
    const otherPickType = pickType === 'P' ? 'S' : pickType === 'S' ? 'P' : '';
    const otherPick = self.findValue(sensor.picks, 'label', otherPickType);
    if (otherPick) {
      if (pickType === 'P') {
        if (position > otherPick.value) {
          window.alert('P Pick cannot be moved past S Pick');
          return;
        }
      } else if (pickType === 'S') {
        if (position < otherPick.value) {
          window.alert('S Pick cannot be moved before P Pick');
          return;
        }
      }
    }
    self.savePicksState(ind, sensor.sensor_code, sensor.picks);
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
    document.getElementById('toolbar').focus();
  }

  deletePicks(ind, pickType, value) {
    const self = this;
    const sensor = self.activeSensors[ind];
    self.savePicksState(ind, sensor.sensor_code, sensor.picks);
    const chart = sensor.chart;
    if (value) {
      sensor.picks = sensor.picks
        .filter(el => el.label !== pickType || el.label === pickType && el.value !== value);
    } else {  // no value specified delete all picks of this type
      sensor.picks = sensor.picks.filter(el => el.label !== pickType);
    }
    chart.options.axisX.stripLines = sensor.picks;
    chart.render();
    document.getElementById('toolbar').focus();
  }

  movePick(ind, pickType, value, fromCurrentPosition, issueWarning) {
    const self = this;
    const sensor = self.activeSensors[ind];
    const chart = sensor.chart;
    sensor.picks = (typeof sensor.picks !== 'undefined' && sensor.picks instanceof Array) ? sensor.picks : [];
    // find existing pick of this type
    const pick = self.findValue(sensor.picks, 'label', pickType);
    if (!pick) {
      if (issueWarning) {
        window.alert('No ' + pickType + ' pick to move');
      }
      return;
    }
    const data = chart.options.data[0].dataPoints;
    const position = fromCurrentPosition ? Math.round(pick.value + value) : Math.round(value);
    if (position < data[0].x || position > data[data.length - 1].x) {
      window.alert('Pick cannot be moved outside of the current trace view');
      return;
    }
    const otherPickType = pickType === 'P' ? 'S' : pickType === 'S' ? 'P' : '';
    const otherPick = self.findValue(sensor.picks, 'label', otherPickType);
    if (otherPick) {
      if (pickType === 'P') {
        if (position > otherPick.value) {
          window.alert('P Pick cannot be moved past S Pick');
          return;
        }
      } else if (pickType === 'S') {
        if (position < otherPick.value) {
          window.alert('S Pick cannot be moved before P Pick');
          return;
        }
      }
    }
    self.savePicksState(ind, sensor.sensor_code, sensor.picks);
    // move pick
    pick.value = position;
    sensor.picks = sensor.picks.filter(el => el.label !== pickType);
    sensor.picks.push(pick);
    chart.options.axisX.stripLines = sensor.picks;
    chart.render();
    document.getElementById('toolbar').focus();
  }

  toggleTooltip(ind, value) {
    const self = this;
    value = value ? value : !self.activeSensors[ind].chart.options.toolTip.enabled;
    self.activeSensors[ind].chart.options.toolTip.enabled = value;
    self.activeSensors[ind].chart.render();
    document.getElementById('toolbar').focus();
  }

  back() {
    const self = this;
    if (self.bZoomAll) {
      if (self.xViewPortMinStack && self.xViewPortMinStack.length > 0) {
        self.xViewPortMinStack.pop();
        self.xViewportMaxStack.pop();
      }
      for (let j = 0; j < self.activeSensors.length - 1; j++) {
        const chart = self.activeSensors[j].chart;
        chart.options.viewportMinStack = self.xViewPortMinStack;
        chart.options.viewportMaxStack = self.xViewportMaxStack;
        if (!chart.options.axisX) {
          chart.options.axisX = {};
        }
        if (self.xViewPortMinStack && self.xViewPortMinStack.length > 0) {
          chart.options.axisX.viewportMinimum = self.xViewPortMinStack[self.xViewPortMinStack.length - 1];
          chart.options.axisX.viewportMaximum = self.xViewportMaxStack[self.xViewportMaxStack.length - 1];
          chart.render();
        } else {
          self.resetChartViewX(chart);
        }
      }
    } else {
      if (self.lastDownTarget !== null && self.lastDownTarget > -1) {
        const chart = self.activeSensors[self.lastDownTarget].chart;
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
          self.resetChartViewX(chart);
        }
      }
    }
    document.getElementById('toolbar').focus();
  }

  updateArrivalWithPickData() {
    const self = this;
    if (self.activeSensors) {
      for (let i = 0; i < self.activeSensors.length - 1; i++) {
        const sensor = self.activeSensors[i];
        this.updateSensorPicks(sensor, 'P');
        this.updateSensorPicks(sensor, 'S');
      }
    }
  }

  updateSensorPicks(sensor, picktype) {
    const self = this;
    const pick = sensor.picks ? self.findValue(sensor.picks, 'label', picktype) : undefined;
    const arrpick = self.findNestedValue
      (self.allPicksChanged, 'pick', 'sensor', sensor.sensor_code, 'phase', picktype);
    if (pick) {
      const pick_time = self.addTimeOffsetMicro(self.timeOrigin, pick.value);
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
        const newpick = {
          azimuth: null,
          distance: null,
          earth_model: null,
          phase: picktype,
          pick: {
            evaluation_mode: 'manual',
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
        self.allPicksChanged.push(newpick);
      }
    } else {
      if (arrpick) {  // delete pick
        console.log(sensor.sensor_code, picktype);
        console.log('delete pick');
        console.log(arrpick);
        self.allPicksChanged = self.allPicksChanged.filter(item => item !== arrpick);
      }
    }

  }

  addArrivalsPickData(sensors, origin) {
    const self = this;
    const missingSensors = [];
    for (const arrival of self.allPicks) {
      if (arrival.hasOwnProperty('pick')) {
        const pick = arrival.pick;

        if (pick.sensor) {
          if (moment(pick.time_utc).isValid()) {
            const sensor = self.findValue(sensors, 'sensor_code', pick.sensor.toString());
            if (sensor) {
              sensor.picks = (typeof sensor.picks !== 'undefined' && sensor.picks instanceof Array) ?
                sensor.picks : [];
              const pickKey = arrival.phase === 'P' ? 'P' : arrival.phase === 'S' ? 'S' : '';
              if (pickKey !== '') {
                sensor[pickKey.toLowerCase() + '_pick_time_utc'] = pick.time_utc;
                sensor.picks.push({
                  value: self.calculateTimeOffsetMicro(pick.time_utc, origin),   // rel timeOrigin full second
                  thickness: globals.picksLineThickness,
                  color: pickKey === 'P' ? 'blue' : pickKey === 'S' ? 'red' : 'black',
                  label: pickKey,
                  labelAlign: 'far',
                });
              }
            } else {
              if (!globals.enablePagingLoad && !missingSensors.includes(pick.sensor_code)) {
                missingSensors.push(pick.sensor_code);
              }
            }
          } else {
            console.log('Invalid pick time for ' + pick.sensor + ' (' + pick.phase_hint + '): ' + pick.time_utc);
          }

        } else {
          console.log('Invalid pick sensor for arrival id: ' + arrival.arrival_resource_id);
        }
      } else {
        console.log('Picks not found for arrival id: ' + arrival.arrival_resource_id);
      }
    }
    if (missingSensors.length > 0) {
      self.picksWarning = 'No waveforms for picks at sensors: ' + missingSensors.toString();
    }
  }

  addTime(start_time, traveltime): String {
    const self = this;
    const d = moment(start_time);
    d.millisecond(0);   // to second precision
    const seconds = parseFloat(start_time.slice(-8, -1)) + traveltime;
    const end_time = moment(d).add(Math.floor(seconds), 'seconds'); // to the second
    return end_time.toISOString().slice(0, -4) + (seconds % 1).toFixed(6).substring(2) + 'Z';
  }

  addPredictedPicksData(sensors, origin) {
    const self = this;
    for (const sensor of sensors) {
      if (sensor.hasOwnProperty('sensor_code')) {
        const sensorOrigin = self.findValue(self.originTravelTimes, 'sensor_id', sensor.sensor_code);
        if (sensorOrigin) {
          sensor.picks = (typeof sensor.picks !== 'undefined' && sensor.picks instanceof Array) ? sensor.picks : [];
          for (const pickKey of ['P', 'S']) {
            const key = 'travel_time_' + pickKey.toLowerCase();
            if (sensorOrigin.hasOwnProperty(key)) {
              const picktime_utc = this.addTime(this.waveformOrigin.time_utc, sensorOrigin[key]);
              const pickTime = moment(picktime_utc.toString());  // UTC
              if (!self.picksWarning && (pickTime.isBefore(origin) || pickTime.isAfter(this.timeEnd))) {
                self.picksWarning += 'Predicted picks outside the display time window\n';
              }
              sensor[pickKey.toLowerCase() + '_predicted_time_utc'] = picktime_utc;
              sensor.picks.push({
                value: self.calculateTimeOffsetMicro(picktime_utc, origin),  // relative to timeOrigin's full second
                thickness: globals.predictedPicksLineThickness,
                lineDashType: 'dash',
                opacity: 0.5,
                color: pickKey === 'P' ? 'blue' : pickKey === 'S' ? 'red' : 'black',
                label: pickKey.toLowerCase(),
                labelAlign: 'far',
                labelFormatter: function (e) {
                  return e.stripLine.opacity === 0 ? '' : e.stripLine.label;
                }
              });
            }
          }
        }
      }
    }
  }

  togglePredictedPicksVisibility(show) {
    const self = this;
    for (const sensor of this.allSensors) {
      if (sensor.hasOwnProperty('picks')) {
        for (const pick of sensor.picks) {
          if (pick.label === pick.label.toLowerCase()) {
            pick.opacity = show ? 0.5 : 0;
          }
        }
      }
    }
    self.changePage(false);
  }


  calcPicksBias() {
    const self = this;
    let picksTotalBias = 0; // calculate pickBias as average value of picks - predicted picks
    let nPicksBias = 0;
    for (const sensor of self.allSensors) {
      for (const pickKey of ['p', 's']) {
        const predicted_key = pickKey + '_predicted_time_utc';
        const pick_key = pickKey + '_pick_time_utc';
        if (sensor.hasOwnProperty(predicted_key) && sensor.hasOwnProperty(pick_key)) {
          const pickTime = moment(sensor[pick_key]);
          const referenceTime = moment(sensor[predicted_key]);
          if (pickTime.isValid() && referenceTime.isValid()) {
            const microsec = sensor[pick_key].slice(-7, -1);
            const microsec_ref = sensor[predicted_key].slice(-7, -1);
            const offset = pickTime.millisecond(0)
              .diff(referenceTime.millisecond(0), 'seconds') * 1000000;
            picksTotalBias += offset + parseInt(microsec, 10) - parseInt(microsec_ref, 10);
            nPicksBias++;
          }
        }
      }
    }
    self.picksBias = Math.round(picksTotalBias / nPicksBias);
  }

  activateRemoveBias(show) {
    const self = this;

    if (!self.bRemoveBias) { // turn remove bias on when loading all data (no pagination)
      self.bRemoveBias = !self.bRemoveBias;
      $('#togglePredictedPicksBias').toggleClass('active');
    }
    self.calcPicksBias();
    self.changePredictedPicksByBias(self.bRemoveBias, show);
  }

  changePredictedPicksByBias(removeBias, show) {
    const self = this;

    if (self.picksBias !== 0) {
      for (const sensor of this.allSensors) {
        if (sensor.hasOwnProperty('picks')) {
          for (const pick of sensor.picks) {
            if (pick.label === pick.label.toLowerCase()) {
              pick.value = removeBias ? pick.value + self.picksBias : pick.value - self.picksBias;
            }
          }
        }
      }
      if (self.contextSensor[0].hasOwnProperty('picks')) {
        for (const pick of self.contextSensor[0].picks) {
          if (pick.label === pick.label.toLowerCase()) {
            pick.value = removeBias ? pick.value + self.picksBias : pick.value - self.picksBias;
          }
        }
      }
      if (show) {
        self.changePage(false);
      }
    }
  }

  sortTraces() {
    const self = this;

    if (Array.isArray(self.allSensors)) {
      let sortKey = '';
      if (self.allSensors.some(el => el.hasOwnProperty('p_predicted_time_utc'))) {
        sortKey = 'p_predicted_time_utc';
      } else if (self.allSensors.some(el => el.hasOwnProperty('s_predicted_time_utc'))) {
        sortKey = 's_predicted_time_utc';
      }
      if (sortKey) {
        self.allSensors.sort
          (this.sort_array_by
            (sortKey, false, function (x) { return x ? moment(x) : moment.now(); })
          );
      }
    }
  }

  parseMiniseed(file, isContext): any {
    const self = this;
    const records = miniseed.parseDataRecords(file);
    const channelsMap = miniseed.byChannel(records);
    const sensors = [];
    let zTime = null, timeOrigin = null;
    const eventData = {};
    let changetimeOrigin = false;
    channelsMap.forEach(function (this, value, key, map) {
      const sg = miniseed.createSeismogram(channelsMap.get(key));
      const header = channelsMap.get(key)[0].header;
      let valid = false;
      if (isContext || (sg.y().includes(NaN) === false && sg.y().some(el => el !== 0))) {
        valid = true;
      } else {
        console.log('Warning - zero data channel: ' + sg.codes());
        self.tracesInfo = self.tracesInfo ?
          (self.tracesInfo.includes(sg.codes()) ? self.tracesInfo : self.tracesInfo + ', ' + sg.codes()) :
          'Zero traces: ' + sg.codes();
      }
      if (!zTime) {
        zTime = moment(sg.start());  // starting time (use it up to tenth of second)
        zTime.millisecond(Math.floor(zTime.millisecond() / 100) * 100);
      } else {
        if (!sg.start().isSame(zTime, 'second')) {
          zTime = moment(moment.min(zTime, sg.start()));
          changetimeOrigin = true;
        }
      }
      const seismogram = valid ? filter.rMean(sg) : sg;
      const channel = {};
      channel['code_id'] = isContext ? sg.codes() + '...CONTEXT' : sg.codes();
      channel['sensor_code'] = sg.stationCode();
      channel['channel_id'] = isContext ? sg.channelCode() + '...CONTEXT' : sg.channelCode();
      channel['sample_rate'] = sg.sampleRate();
      channel['start'] = sg.start();  // moment object (good up to milisecond)
      // microsecond stored separately, tenthMilli from startBTime + microsecond from Blockette 1001
      channel['microsec'] = header.startBTime.tenthMilli * 100 + header.blocketteList[0].body.getInt8(5);
      channel['raw'] = seismogram;
      channel['valid'] = valid;
      const data = [];
      for (let k = 0; k < seismogram.numPoints(); k++) {
        data.push({
          x: channel['microsec'] + (k * 1000000 / channel['sample_rate']),   // trace microsecond offset
          y: seismogram.y()[k],  // trace after mean removal
        });
      }
      channel['data'] = data;
      channel['duration'] = (seismogram.numPoints() - 1) * 1000000 / channel['sample_rate'];  // in microseconds
      let sensor = self.findValue(sensors, 'sensor_code', sg.stationCode());
      if (!sensor) {
        sensor = { sensor_code: sg.stationCode(), channels: [] };
        sensors.push(sensor);
      }
      const invalid = (sensor.channels).findIndex((x) => !x.valid);
      if (invalid >= 0) {
        sensor.channels[invalid] = channel;  // valid channel replaces invalid channel (placeholder)
      } else {
        if (valid || (!valid && sensor.channels.length === 0)) {
          sensor.channels.push(channel);
        }
      }
    });
    if (zTime && zTime.isValid()) {
      timeOrigin = moment(zTime);
      if (changetimeOrigin) {
        console.log('***changetimeOrigin channels change in earliest time second detected');
        zTime.millisecond(0);
        for (const sensor of sensors) {
          for (const channel of sensor.channels) {
            if (!channel.start.isSame(zTime, 'second')) {
              const offset = channel.start.diff(zTime, 'seconds') * 1000000;
              channel.microsec += offset;
              for (const datasample of channel.data) { // microsecond offset from new zeroTime
                datasample['x'] += offset;
              }
            }
          }
        }

      }
    }
    eventData['sensors'] = sensors;
    eventData['timeOrigin'] = timeOrigin;
    return (eventData);
  }


  createButterworthFilter(sample_rate): any {
    const self = this;
    let butterworth = null;
    if (self.lowFreqCorner >= 0 && self.highFreqCorner <= sample_rate / 2) {
      butterworth = filter.createButterworth(
        self.numPoles, // poles
        self.passband,
        self.lowFreqCorner, // low corner
        self.highFreqCorner, // high corner
        1 / sample_rate
      );
    }
    return butterworth;
  }

  applyFilter() {
    const self = this;

    if (self.bFilterChanged && self.allSensors.length > 0) {
      self.saveOption('numPoles');
      self.saveOption('lowFreqCorner');
      self.saveOption('highFreqCorner');
      self.allSensors = self.addCompositeTrace(self.filterData(self.allSensors)); // filter and recompute composite traces
      self.contextSensor = self.filterData(self.contextSensor);
      self.changePage(false);
    }
  }


  filterData(sensors): any[] {
    const self = this;
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
            const butterworth = self.createButterworthFilter(channel.sample_rate);
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
    self.bFilterChanged = false;
    return sensors;
  }


  addCompositeTrace(sensors): any[] {
    let message = '';
    for (const sensor of sensors) {
      if (sensor.channels.length === 3) {
        if (sensor.channels[0].start.isSame(sensor.channels[1].start) &&
          sensor.channels[0].start.isSame(sensor.channels[2].start) &&
          sensor.channels[0].microsec === sensor.channels[1].microsec &&
          sensor.channels[0].microsec === sensor.channels[2].microsec) {
          if (sensor.channels[0].sample_rate === sensor.channels[1].sample_rate &&
            sensor.channels[0].sample_rate === sensor.channels[2].sample_rate) {
            if (sensor.channels[0].data.length === sensor.channels[1].data.length &&
              sensor.channels[0].data.length === sensor.channels[2].data.length) {
              const compositeTrace = {};
              compositeTrace['code_id'] = sensor.channels[0].code_id.slice(0, -1) + globals.compositeChannelCode;
              compositeTrace['sensor_code'] = sensor.sensor_code;
              compositeTrace['channel_id'] = globals.compositeChannelCode;
              compositeTrace['sample_rate'] = sensor.channels[0].sample_rate;
              compositeTrace['start'] = sensor.channels[0].start;  // moment object (good up to milisecond)
              compositeTrace['microsec'] = sensor.channels[0].microsec;
              compositeTrace['data'] = [];
              compositeTrace['duration'] = sensor.channels[0].duration;  // in microseconds
              for (let k = 0; k < sensor.channels[0].data.length; k++) {
                let compositeValue = 0, sign = 1;
                for (let j = 0; j < 3; j++) {
                  const value = sensor.channels[j].data[k]['y'];
                  sign = sensor.channels[j].channel_id.toLowerCase() === globals.signComponent.toLowerCase() ?
                    Math.sign(value) : sign;
                  compositeValue += Math.pow(value, 2);
                }
                sign = sign === 0 ? 1 : sign;   // do not allow zero value to zero composite trace value
                compositeValue = Math.sqrt(compositeValue) * sign;
                compositeTrace['data'].push({
                  x: sensor.channels[0].data[k]['x'],
                  y: compositeValue
                });
              }
              sensor.channels.push(compositeTrace);
            } else {
              console.log('Cannot create 3C composite trace for sensor: '
                + sensor['sensor_code'] + ' different channel lengths');
            }
          } else {
            console.log('Cannot create 3C composite trace for sensor: ' +
              sensor['sensor_code'] + ' different sample rates: ' +
              sensor.channels[0].sample_rate + sensor.channels[2].sample_rate + sensor.channels[2].sample_rate);
          }
        } else {
          console.log('Cannot create 3C composite trace for sensor: '
            + sensor['sensor_code'] + ' different channels start times ' +
            sensor.channels[0].start.toISOString() + sensor.channels[1].start.toISOString()
            + sensor.channels[2].start.toISOString());
        }
      } else {
        message += 'Cannot create 3C composite trace for sensor: ' + sensor['sensor_code'] +
          ' available channels: ' + sensor.channels.length + ' (' +
          (sensor.channels.length > 0 ? sensor.channels[0].channel_id +
            (sensor.channels.length > 1 ? sensor.channels[1].channel_id
              : ' ') : ' ') + ')\n';
      }
    }
    if (message) {
      console.log(message);
      // window.alert(message);
    }
    return sensors;
  }


  getEvent(event, bContext): any {
    const self = this;

    return new Promise(resolve => {
      const mshr = new XMLHttpRequest();
      const waveform_file = bContext ? event.waveform_context_file :
        event.hasOwnProperty('waveform_file') && event.waveform_file ? event.waveform_file : event.variable_size_waveform_file;
      mshr.open('GET', waveform_file, true);
      mshr.responseType = 'arraybuffer';
      self.loading = true;
      mshr.onreadystatechange = () => {
        if (mshr.readyState === mshr.DONE) {
          if (mshr.status === 200) {
            self.loading = false;
            resolve(mshr.response);
          } else {
            self.loading = false;
            window.alert('Error getting miniseed data file');
            console.log('Error getting miniseed', mshr.statusText);
          }
        }
      };
      mshr.send();
    });
  }


  async getEventPage(event_id, page) {
    const self = this;
    const query: EventWaveformQuery = {
      page_number: page,
      traces_per_page: globals.chartsPerPage - 1
    };
    self.loading = page === 1 ? true : false;
    const response = await this._eventApiService.getEventWaveform(event_id, query).toPromise();
    self.loading = false;

    if (page === 1) {
      self.num_pages = globals.max_num_pages;
      const filename = ApiUtil.getAttachmentFilenameFromArrayBufferHttpResponse(response);

      if (filename.indexOf('of_') && filename.lastIndexOf('.')) {
        self.num_pages = parseInt(
          filename.substring(filename.indexOf('of_') + 3, filename.lastIndexOf('.')), 10);
      }
    }

    return response.body;
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

}
