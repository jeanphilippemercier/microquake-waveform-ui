/*jshint esversion: 6 */
import { Component, ViewChild, OnInit } from '@angular/core';
import * as $ from 'jquery';
import * as CanvasJS from './canvasjs.min';
import { environment } from '../environments/environment';
import { CatalogApiService } from './catalog-api.service';
import * as miniseed from 'seisplotjs-miniseed';
import * as filter from 'seisplotjs-filter';
import * as moment from 'moment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
    title = 'waveform-ui';

    public catalog: any;
    public allSites: any[];
    public allPicks: any[];
    public originTravelTimes: any[];
    public activeSites: any[];
    public lastPicksState: any;
    public originTime: any;
    public origin: any;
    public waveformOrigin: any;
    public options: any;
    private saveOption: Function;

    public bCommonTime: Boolean;
    public bCommonAmplitude: Boolean;
    public bZoomAll: Boolean;
    public bDisplayComposite: Boolean;
    public bSortTraces: Boolean;
    public bShowPredictedPicks: Boolean;
    public bRemoveBias: Boolean;
    public numPoles: any;
    public lowFreqCorner: any;
    public highFreqCorner: any;

    public pickingMode: any;
    public onPickingModeChange: Function;

    private createButterworthFilter: Function;
    private passband: any;

    public applyFilter: Function;
    private filterData: Function;
    public bFilterChanged: Boolean;

    private sample_rate: any;
    public picksBias: number;
    private convYUnits: number;

    public selected: number;
    public selectedContextMenu: number;
    public lastSelectedXPosition: number;
    public lastDownTarget: any;  // last mouse down selection
    private bHoldEventTrigger: Boolean;

    private menu: any;
    private bMenuVisible: Boolean;

    private renderCharts: Function;
    private destroyCharts: Function;
    private setChartKeys: Function;
    private getEvent: Function;
    private getEventPage: Function;
    private getAttachmentFilename: Function;
    private parseMiniseed: Function;
    private loadEvent: Function;
    private loadEventFirstPage: Function;
    private loadEventPages: Function;
    private afterLoading: Function;
    private addCompositeTrace: Function;

    private toggleMenu: Function;
    private setPosition: Function;
    private maxValue: Function;
    private toggleCommonTime: Function;
    private toggleCommonAmplitude: Function;
    private updateZoomStackCharts: Function;
    private resetAllChartsViewX: Function;
    public resetAllChartsViewXY: Function;
    private resetAllChartsViewY: Function;
    private resetChartViewX: Function;
    private resetChartViewXY: Function;
    private resetChartViewY: Function;
    private getXmax: Function;
    private getYmax: Function;
    private getXvpMax: Function;
    private getXvpMin: Function;
    private getValueMaxAll: Function;
    private getAxisMaxAll: Function;
    private getAxisMinAll: Function;
    private zoomAllCharts: Function;
    private addPick: Function;
    private movePick: Function;
    private deletePicks: Function;
    private savePicksState: Function;
    public undoLastPicking: Function;
    private addPickData: Function;
    private addArrivalsPickData: Function;
    private addPredictedPicksData: Function;
    private togglePredictedPicksVisibility: Function;
    private calcPicksBias: Function;
    private changePredictedPicksByBias: Function;
    private activateRemoveBias: Function;
    private togglePredictedPicks: Function;
    private toggleTooltip: Function;
    public back: Function;
    private renderPage: Function;
    public displayPage: Function;
    private sort_array_by: Function;
    private findValue: Function;
    private addTime: Function;
    private sortTraces: Function;


    private xViewPortMinStack: any[];
    private xViewportMaxStack: any[];

    private timezone: string;

    public page_size = environment.chartsPerPage;
    public page_number: number;
    public num_pages: number;
    public loaded_pages: number;
    public window_height = window.innerHeight;
    public chartHeight: number;
    public pageOffsetX: number;
    public pageOffsetY: number;

    public loading = false;
    public monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug',
      '    Sep', 'Oct', 'Nov', 'Dec'];

    public currentEventId: string;

    public picksWarning: string;

    getNotification(message) {
        // console.log(message);
        if (message.hasOwnProperty('timezone')) {
            this.timezone = message.timezone;
        }
        if (message.action === 'load' && message.event_resource_id !== this.currentEventId) {
            if (environment.enablePagingLoad) {
                this.loadEventFirstPage(message);
            } else {
                this.loadEvent(message);
            }
        }
        this.picksWarning = '';
        $('#infoTime')[0].innerHTML = 'Event ' +
                    moment(message.time_utc).utc().utcOffset(this.timezone).format('YYYY-MM-DD HH:mm:ss') +
                    '<small>'
                    + message.time_utc.slice(-8, -1) +
                    moment().utc().utcOffset(this.timezone).format('Z')
                    + '</small>';
        this.origin['time_utc'] = message.time_utc;
        this.origin['magnitude'] = message.magnitude ? parseFloat(message.magnitude).toFixed(2) + ' (' + message.magnitude_type + ')' : '';
        this.origin['x'] = message.x ? message.x : '';
        this.origin['y'] = message.y ? message.y : '';
        this.origin['z'] = message.z ? message.z : '';
        this.origin['npick'] = message.npick ? message.npick : '';
        this.origin['eval'] =  message.eval_status === 'A' ? 'Accepted (A)' : 'Rejected (R)';
        this.origin['type'] = message.event_type === 'earthquake' ? 'Seismic Event (E)' :
           message.event_type === 'blast' || message.event_type === 'explosion' ? 'Blast (B)' : 'Other (O)';
        this.origin['mode'] = message.evaluation_mode ?
            message.evaluation_mode[0].toUpperCase() + message.evaluation_mode.substr(1).toLowerCase() : '';
        this.origin['status'] = message.status ?
            message.status[0].toUpperCase() + message.status.substr(1).toLowerCase() : '';
        this.origin['time_residual'] = message.time_residual ? message.time_residual : '';
        this.origin['uncertainty'] = message.uncertainty ? message.uncertainty : '';
        this.origin['event_resource_id'] = message.event_resource_id;
        this.origin['preferred_origin_id'] = message.preferred_origin_id;
    }

    constructor(private _catalogService: CatalogApiService) { }

    public ngOnInit() {

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

        self.numPoles = self.options.hasOwnProperty('numPoles') ? self.options.numPoles : environment.numPoles;
        self.lowFreqCorner = self.options.hasOwnProperty('lowFreqCorner') ? self.options.lowFreqCorner : environment.lowFreqCorner;
        self.highFreqCorner = self.options.hasOwnProperty('highFreqCorner') ? self.options.highFreqCorner : environment.highFreqCorner;

        self.passband = filter.BAND_PASS;

        self.convYUnits = 1000; // factor to convert input units from m to mmm
        // self.convYUnits = 10000000;  // factor to convert input units (m/1e10) to mmm

        self.selected = -1;
        self.selectedContextMenu = -1;
        self.lastSelectedXPosition = -1;

        self.menu = document.querySelector('.menu');
        self.bMenuVisible = false;

        self.pageOffsetX = $('#waveform-panel').offsetParent()[0].offsetLeft;
        self.pageOffsetY = $('#waveform-panel').position().top + $('#zeroTime').height();
        self.chartHeight = Math.floor((window.innerHeight - self.pageOffsetY) / environment.chartsPerPage);
        self.page_number = 0;

        self.origin = {};
        self.waveformOrigin = {};

        self.timezone = '+00:00';
        self.bFilterChanged = true;

        self.pickingMode = 'none';
        self.lastPicksState = null;

        const divStyle = 'height: ' + self.chartHeight + 'px; max-width: 2000px; margin: 0px auto;';

/*
        this._catalogService.get_day_events().subscribe(data => {
                this.catalog = data;
                this.catalog.sort((a, b) => (new Date(a.time_utc) > new Date(b.time_utc)) ? -1 : 1);
                const event = this.catalog[0];
                this.loadEvent(event);
            },
            err => console.error(err),
            () => console.log('done loading')
        );
*/

        this.saveOption = option => {
            self.options[option] = self[option];
            window.localStorage.setItem('viewer-options', JSON.stringify(self.options));
        };

        this.loadEvent = event => {
            if (event.hasOwnProperty('waveform_file') || event.hasOwnProperty('variable_size_waveform_file')) {
                const id = event.event_resource_id;
                const preferred_origin_id = event.preferred_origin_id;
                self.getEvent(event).then(eventFile => {
                    if (eventFile) {
                        const eventData = self.parseMiniseed(eventFile);
                        if (eventData && eventData.hasOwnProperty('sites')) {
                            // filter and recompute composite traces
                            self.allSites = self.addCompositeTrace(self.filterData(eventData.sites));
                            self.originTime = eventData.originTime;
                            self.currentEventId = id;
                            if (self.allSites.length > 0) {
                                // get origins
                                this._catalogService.get_origins_by_id(id).subscribe(origins => {
                                    let origin = self.findValue(origins, 'origin_resource_id', preferred_origin_id);
                                    if (!origin) {
                                        window.alert('Event preferred origin from catalog not found');
                                        console.log('Event preferred origin from catalog not found');
                                        origin = self.findValue(origins, 'preferred_origin', true);
                                    }
                                    if (origin) {
                                        self.waveformOrigin = origin;
                                        // get travel times for preferred origin
                                        this._catalogService.get_traveltimes_by_id(id, origin.origin_resource_id).subscribe(traveltimes => {
                                            self.originTravelTimes = traveltimes;
                                            this.addPredictedPicksData(self.allSites);
                                            // get arrivals, picks for preferred origin
                                            this._catalogService.get_arrivals_by_id(id, origin.origin_resource_id).subscribe(picks => {
                                              self.allPicks = picks;
                                              this.addArrivalsPickData(self.allSites);

                                              self.activateRemoveBias(false);

                                              if (!self.bSortTraces) { // sort traces on when loading all data (no pagination)
                                                self.bSortTraces = !self.bSortTraces;
                                                $('#sortTraces').toggleClass('active');
                                                $('#sortTraces').prop('hidden', true); // hide button
                                              }
                                              self.sortTraces();

                                              // display data (first page)
                                              self.page_number = 1;
                                              self.displayPage(true);
                                            });
                                        });
                                    } else {
                                        console.log('No event preferred origin found');
                                            // display data (first page)
                                            self.page_number = 1;
                                            self.displayPage(true);

                                    }

                                });
                                console.log('Loaded data for ' + self.allSites.length + ' sites');
                                $('#zeroTime')[0].innerHTML = '<strong>Traces time origin: </strong>' +
                                  moment(eventData.originTime).utc().utcOffset(self.timezone)
                                      .format('YYYY-MM-DD HH:mm:ss.S');

                            }
                        }
                    }
                });
            }
        };

        this.loadEventFirstPage = event => {
            if (event.hasOwnProperty('waveform_file') || event.hasOwnProperty('variable_size_waveform_file')) {
                const id = event.event_resource_id;
                const preferred_origin_id = event.preferred_origin_id;
                // first page
                self.getEventPage(id, 1).then(eventFile => {
                    if (eventFile) {
                        const eventData = self.parseMiniseed(eventFile);
                        if (eventData && eventData.hasOwnProperty('sites')) {
                            // filter and recompute composite traces
                            self.allSites = self.addCompositeTrace(self.filterData(eventData.sites));
                            self.loaded_pages = 1;
                            for (let i = self.allSites.length; i < self.num_pages * self.page_size; i++) {
                                self.allSites[i] = { 'channels': []};
                            }
                            self.originTime = eventData.originTime;
                            self.currentEventId = id;
                            if (self.allSites.length > 0) {
                                // get origins
                                this._catalogService.get_origins_by_id(id).subscribe(origins => {
                                    let origin = self.findValue(origins, 'origin_resource_id', preferred_origin_id);
                                    if (!origin) {
                                        window.alert('Warning: Event preferred origin from catalog not found');
                                        origin = self.findValue(origins, 'preferred_origin', true);
                                    }
                                    if (origin) {
                                        self.waveformOrigin = origin;
                                        // get travel times for preferred origin
                                        this._catalogService.get_traveltimes_by_id(id, origin.origin_resource_id).subscribe(traveltimes => {
                                            self.originTravelTimes = traveltimes;
                                            this.addPredictedPicksData(self.allSites);
                                            // get arrivals, picks for preferred origin
                                            this._catalogService.get_arrivals_by_id(id, origin.origin_resource_id).subscribe(picks => {
                                              self.allPicks = picks;
                                              this.addArrivalsPickData(self.allSites);

                                              self.picksBias = 0;
                                              if (self.bRemoveBias) { // turn remove bias off by default when loading data with pagination
                                                self.bRemoveBias = !self.bRemoveBias;
                                                $('#togglePredictedPicksBias').toggleClass('active');
                                              }

                                              if (self.bSortTraces) { // turn sort traces off by default when loading data with pagination
                                                self.bSortTraces = !self.bSortTraces;
                                                $('#sortTraces').toggleClass('active');
                                                $('#sortTraces').prop('hidden', false); // button visible
                                              }

                                              // disable buttons until all pages are loaded
                                              $('#togglePredictedPicksBias').prop('disabled', true); // button disabled
                                              $('#sortTraces').prop('disabled', true); // button disabled

                                              // display data (first page)
                                              self.page_number = 1;
                                              self.displayPage(true);

                                              // console.log('Loaded data for ' + self.allSites.length + ' sites');
                                              $('#zeroTime')[0].innerHTML = '<strong>Traces time origin: </strong>' +
                                                  moment(eventData.originTime).utc().utcOffset(self.timezone)
                                                      .format('YYYY-MM-DD HH:mm:ss.S');

                                            });
                                            self.loadEventPages(id);
                                        });
                                    } else {
                                        window.alert('No event preferred origin found');
                                    }

                                });
                            }
                        }
                    }
                });
            }
        };

        this.loadEventPages = event_id => {
            for (let i = 2; i <= self.num_pages; i++) {
                self.getEventPage(event_id, i).then(eventFile => {
                    if (eventFile) {
                        const eventData = self.parseMiniseed(eventFile);
                        if (eventData && eventData.hasOwnProperty('sites') && eventData.sites.length > 0) {
                            // filter and recompute composite traces
                            const sites = self.addCompositeTrace(self.filterData(eventData.sites));
                            this.addPredictedPicksData(sites);
                            this.addArrivalsPickData(sites);
                            for (let j = 0; j < sites.length; j++) {
                                self.allSites[self.page_size * (i - 1) + j] = sites[j];
                            }
                            if (i === self.num_pages && sites.length < self.page_size) { // last page, eliminate extra items
                                const items = self.page_size - sites.length;
                                self.allSites.splice(-items, items);
                            }
                            self.loaded_pages ++;
                            if (self.loaded_pages === self.num_pages) {
                                self.afterLoading();
                            }
                        }
                    }
                });
            }
        };

        this.afterLoading = () => {
            // enable toolbar buttons after all pages are loaded
            $('#sortTraces').prop('disabled', false);
            $('#togglePredictedPicksBias').prop('disabled', false);
            // remove bias from predicted picks, force a refresh
            // self.activateRemoveBias(true);
        };

        this.sort_array_by = (field, reverse, primer) => {

           const key = primer ?
               function(x) {return primer(x[field]); } :
               function(x) {return x[field]; };

           reverse = !reverse ? 1 : -1;

           return function (a, b) {
               const A = key(a), B = key(b);
               return ( (A < B) ? -1 : ((A > B) ? 1 : 0) ) * [-1, 1][+!!reverse];
           };
        };

        this.findValue = (obj, key, value) => obj.find(v => v[key] === value);

        this.renderPage = (pageNumber, pageSize) => {
            const numPages = environment.enablePagingLoad ?
                self.num_pages : Math.ceil(self.allSites.length / self.page_size);
            if (pageNumber > 0 && pageNumber <= numPages) {
                self.activeSites = self.allSites.slice
                    ((pageNumber - 1) * pageSize, Math.min( pageNumber * pageSize, self.allSites.length));
                self.renderCharts();
                self.setChartKeys();
                for (const site of self.activeSites) {
                    site.chart.options.viewportMinStack = self.xViewPortMinStack;
                    site.chart.options.viewportMaxStack = self.xViewportMaxStack;
                }
            }
        };

        this.displayPage = (reset) => {
            // reset last selected channel
            self.lastDownTarget = null;
            // reset picks last known state
            self.lastPicksState = null;
            if (reset) { // first page , new event
                self.xViewPortMinStack = [];
                self.xViewportMaxStack = [];
            } else {             // remember zoom history
                self.xViewPortMinStack = self.activeSites[0].chart.options.viewportMinStack;
                self.xViewportMaxStack = self.activeSites[0].chart.options.viewportMaxStack;
            }
            self.destroyCharts();
            self.renderPage(self.page_number, self.page_size);
        };

        this.toggleMenu = command => {
         (<any>self.menu).style.display = command === 'show' ? 'block' : 'none';
          self.bMenuVisible = !self.bMenuVisible;
        };

        this.setPosition = ({ top, left }) => {
          (<any>self.menu).style.left = `${left}px`;
          (<any>self.menu).style.top = `${top}px`;
          self.toggleMenu('show');
        };

        this.maxValue = (dataPoints) => {
            let maximum = Math.abs(dataPoints[0].y);
            for (let i = 0; i < dataPoints.length; i++) {
                if (Math.abs(dataPoints[i].y) > maximum) {
                    maximum = Math.abs(dataPoints[i].y);
                }
            }
            const ret = Math.ceil(maximum * (self.convYUnits * 1000)) / (self.convYUnits * 1000);
            return ret;
        };

        this.destroyCharts = () => {
            if (self.activeSites) {
                for (let i = 0; i < self.activeSites.length; i++) {
                    self.activeSites[i].chart.destroy();
                    const elem = document.getElementById(self.activeSites[i].container);
                    elem.parentElement.removeChild(elem);
                }
            }
        };

        this.renderCharts = () => {
           // Chart Options, Render

            for (let i = 0; i < self.activeSites.length; i++) {

                self.activeSites[i].container = i.toString() + 'Container';

                if ( $('#' + self.activeSites[i].container).length === 0 ) {
                    $('<div>').attr({
                        'id': self.activeSites[i].container,
                        'style': divStyle
                    }).appendTo('#waveform-panel');
                }

                const data = [];
                for (const channel of self.activeSites[i].channels) {
                    if ( (!self.bDisplayComposite && channel.channel_id !== environment.compositeChannelCode)
                        || (self.bDisplayComposite && channel.channel_id === environment.compositeChannelCode)
                        || (self.bDisplayComposite && self.activeSites[i].channels.length === 1)) {
                        data.push(
                            {
                                name: channel.code_id,
                                type: 'line',
                                color: environment.linecolor[channel.channel_id.toUpperCase()],
                                lineThickness: environment.lineThickness,
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
                    rangeChanged: function(e) {
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
                    },
                    title: {
                        text: self.activeSites[i].station_code,
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
                        minimum: self.originTime ? self.originTime.millisecond() * 1000 : 0,
                        maximum: self.getXmax(i),
                        viewportMinimum: self.bZoomAll && self.xViewPortMinStack.length > 0 ?
                            self.xViewPortMinStack[self.xViewPortMinStack.length - 1] : self.getXvpMin(),
                        viewportMaximum: self.bZoomAll && self.xViewportMaxStack.length > 0 ?
                            self.xViewportMaxStack[self.xViewportMaxStack.length - 1] : self.getXvpMax(),
                        includeZero: true,
                        labelAutoFit: false,
                        labelWrap: false,
                        labelFormatter: function(e) {
                            if (e.value === 0) {
                                const d = moment(self.origin).utc().utcOffset(self.timezone);
                                return d.format('HH:mm:ss.S');
                            } else {
                                return  e.value / 1000000 + ' s' ;
                            }
                        },
                        stripLines: self.activeSites[i].picks
                    },
                    axisY: {
                        minimum: -yMax,
                        maximum: yMax,
                        interval: self.bCommonAmplitude ? null : yMax / 2,
                        includeZero: true,
                        labelFormatter: function(e) {
                            if (e.value === 0) {
                                return  '0 mm/s';
                            } else {
                                return Math.ceil(e.value * self.convYUnits * 1000) / 1000;
                            }
                        }
                    },
                    data: data
                };
                self.activeSites[i].chart = new CanvasJS.Chart(self.activeSites[i].container, options);
                self.activeSites[i].chart.render();
            }
        };

        this.onPickingModeChange = value => {
            self.pickingMode = value;
        };

        this.setChartKeys = () => {
            for (let j = 0; j < self.activeSites.length; j++) {
                const canvas_chart = '#' + self.activeSites[j].container + ' > .canvasjs-chart-container > .canvasjs-chart-canvas';

                $(canvas_chart).last().on('click', function(e) {
                    if (self.selected === -1) { // ignore if we have a drag event
                        const ind = parseInt($(this).parent().parent()[0].id.replace('Container', ''), 10);
                        const chart = self.activeSites[ind].chart;
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
                $(canvas_chart).last().on('mousedown', function(e) {
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
                    const chart = self.activeSites[ind].chart;
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
                                    relX > pickLines[i].get('bounds').x1 - environment.snapDistance &&
                                    relX < pickLines[i].get('bounds').x2 + environment.snapDistance &&
                                    relY > pickLines[i].get('bounds').y1 &&
                                    relY < pickLines[i].get('bounds').y2) {  // move pick
                                        self.savePicksState(ind, self.activeSites[ind].station_code, self.activeSites[ind].picks);
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

                $(canvas_chart).last().on('mousemove', function(e) {  // move selected stripLine
                    if (self.selected !== -1) {
                        self.bHoldEventTrigger = true;
                        const i = parseInt( $(this).parent().parent()[0].id.replace('Container', ''), 10);
                        const chart = self.activeSites[i].chart;
                        const parentOffset = $(this).parent().offset();
                        const relX = e.pageX - parentOffset.left;
                        const data = chart.options.data[0].dataPoints;
                        const position = Math.round(chart.axisX[0].convertPixelToValue(relX));
                        if (position >= data[0].x && position <= data[data.length - 1].x) {
                            $(this)[0].style.cursor = 'pointer';
                            chart.options.axisX.stripLines[self.selected].value = position;
                            self.activeSites[i].picks = chart.options.axisX.stripLines;
                            chart.options.zoomEnabled = false;
                            chart.render();
                        }
                    }
                });

                $(canvas_chart).last().on('mouseup', function(e) {
                    setTimeout(function() {
                        self.bHoldEventTrigger = false;
                    }, 500);
                    if (self.selected !== -1) {   // clear selection and change the cursor
                        $(this)[0].style.cursor = 'default';
                        self.selected = -1;
                        const i = parseInt($(this).parent().parent()[0].id.replace('Container', ''), 10);
                        const chart = self.activeSites[i].chart;
                        chart.options.axisX.stripLines = self.activeSites[i].picks ;
                        chart.options.zoomEnabled = true;   // turn zoom back on
                        chart.render();
                    }
                });

                // Wheel events: zoomp/pan, move picks in picking mode
                $(canvas_chart)[1].addEventListener('wheel', function(e) {
                    // in pick mode wheel up moves pick left, wheel down moves pick right
                    if (self.pickingMode !== 'none') {
                        const i = parseInt($(this).parent().parent()[0].id.replace('Container', ''), 10);
                        const step = environment.pickTimeStep * 1000; // in microseconds
                        if (e.deltaY < 0) { // scrolling up
                            self.movePick(i, self.pickingMode, -step, true, false);
                        } else if (e.deltaY > 0) { // scrolling down
                            self.movePick(i, self.pickingMode, step, true, false);
                        }
                    }
                    // Y Zoom if Ctrl + Wheel, X axis (time) Zoom if Shift + Wheel; X axis (time) pan if Alt + Wheel
                    if (e.ctrlKey || e.shiftKey || e.altKey) {

                        e.preventDefault();

                        const i = parseInt($(this).parent().parent()[0].id.replace('Container', ''), 10);
                        const chart = self.activeSites[i].chart;

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
                            interval = (viewportMax - viewportMin) / environment.zoomSteps;  // control zoom step
                            // interval = (axis.get('maximum') - axis.get('minimum'))/zoomSteps;  // alternate control zoom step

                        let newViewportMin, newViewportMax;

                        if (e.ctrlKey || e.shiftKey) { // amplitude or time zoom
                            if (e.deltaY < 0) { // wheel down
                                newViewportMin = viewportMin + interval;
                                newViewportMax = viewportMax - interval;
                            } else if (e.deltaY > 0) { // wheel up
                                newViewportMin = viewportMin - interval;
                                newViewportMax = viewportMax + interval;
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
                            if (self.bZoomAll) {
                                self.zoomAllCharts(newViewportMin, newViewportMax, e.shiftKey || e.altKey);
                            } else {  // zoom selected trace only
                                if (newViewportMin >= axis.get('minimum') && newViewportMax <= axis.get('maximum')) {
                                    axis.set('viewportMinimum', newViewportMin, false);
                                    axis.set('viewportMaximum', newViewportMax);
                                    chart.render();
                                }
                            }
                        }
                    }
                });

                $('#' + self.activeSites[j].container).on('contextmenu', e => {
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
        };

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

        document.addEventListener('keydown', e => {
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
                if (self.pickingMode !== 'none' && self.lastDownTarget !== null &&  self.lastDownTarget > -1) {
                    const step = environment.pickTimeStep * 1000; // in microseconds
                    if (e.shiftKey) { // shift key - fast mode - by 10 * step
                        self.movePick(self.lastDownTarget, self.pickingMode, step * 10, true, true);
                    } else { // by step
                        self.movePick(self.lastDownTarget, self.pickingMode, step, true, true);
                    }
                }
            }
            if (e.keyCode === 37) {  // left arrow moves pick to left
                if (self.pickingMode !== 'none' && self.lastDownTarget !== null && self.lastDownTarget > -1) {
                   const step = environment.pickTimeStep * 1000; // in microseconds
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
                    self.displayPage(false);
                }
            }
            if (e.keyCode === 50 || e.keyCode === 98) {
                const numPages = environment.enablePagingLoad ?
                    self.num_pages : Math.ceil(self.allSites.length / self.page_size);
                if (self.page_number < numPages) {
                    self.page_number = self.page_number + 1;
                    self.displayPage(false);
                }
            }
        },
        false);

        $('#zoomAll').on('click', () => {
            self.bZoomAll = !self.bZoomAll;
            $(this).toggleClass('active');
        });

        $('#display3C').on('click', () => {
            self.bDisplayComposite = !self.bDisplayComposite;
            $(this).toggleClass('active');
            self.displayPage(false);
        });

        $('#sortTraces').on('click', () => {
            if (!self.bSortTraces) { // turn on once only
                self.bSortTraces = !self.bSortTraces;
                $(this).toggleClass('active');
                self.sortTraces();
                self.displayPage(false);
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
        $('.menu li').click(function() {
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

        this.togglePredictedPicks = () => {
            self.bShowPredictedPicks = !self.bShowPredictedPicks;
            if (self.bShowPredictedPicks) {
                $('#togglePredictedPicks').addClass('active');
                $('#togglePredictedPicks')[0].setAttribute('aria-pressed', 'true');
            } else {
                $('#togglePredictedPicks').removeClass('active focus');
                $('#togglePredictedPicks')[0].setAttribute('aria-pressed', 'false');
            }
            self.togglePredictedPicksVisibility(self.bShowPredictedPicks);
        };

        this.toggleCommonTime = () => {
            self.bCommonTime = !self.bCommonTime;
            if (self.bCommonTime) {
                $('#commonTime').addClass('active');
                $('#commonTime')[0].setAttribute('aria-pressed', 'true');
            } else {
                $('#commonTime').removeClass('active focus');
                $('#commonTime')[0].setAttribute('aria-pressed', 'false');
            }
            self.resetAllChartsViewX();
        };

        this.toggleCommonAmplitude = () => {
            self.bCommonAmplitude = !self.bCommonAmplitude;
            if (self.bCommonAmplitude) {
                $('#commonAmplitude').addClass('active');
                $('#commonAmplitude')[0].setAttribute('aria-pressed', 'true');
            } else {
                $('#commonAmplitude').removeClass('active focus');
                $('#commonAmplitude')[0].setAttribute('aria-pressed', 'false');
            }
            self.resetAllChartsViewY();
        };

        this.updateZoomStackCharts = (vpMin, vpMax) => {
            if (self.xViewPortMinStack.length === 0 || self.xViewPortMinStack[self.xViewPortMinStack.length - 1] !== vpMin) {
                self.xViewPortMinStack.push(vpMin);
                self.xViewportMaxStack.push(vpMax);
                for (let i = 0; i < self.activeSites.length; i++) {
                    const chart = self.activeSites[i].chart;
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
        };

        this.resetAllChartsViewX = () => {
            for (let i = 0; i < self.activeSites.length; i++) {
                self.resetChartViewX(self.activeSites[i].chart);
            }
        };

        this.resetAllChartsViewY = () => {
            for (let i = 0; i < self.activeSites.length; i++) {
                self.resetChartViewY(self.activeSites[i].chart);
            }
        };

        this.resetAllChartsViewXY = () => {
            for (let i = 0; i < self.activeSites.length; i++) {
                self.resetChartViewXY(self.activeSites[i].chart);
            }
        };

        this.resetChartViewX = (chart) => {
            const channel = parseInt( chart.container.id.replace('Container', ''), 10);
            chart.options.axisX.viewportMinimum = self.getXvpMin();
            chart.options.axisX.viewportMaximum = self.getXvpMax();
            chart.options.axisX.minimum = self.originTime ? self.originTime.millisecond() * 1000 : 0;
            chart.options.axisX.maximum = self.getXmax(channel);
            chart.options.viewportMinStack = [];
            chart.options.viewportMaxStack = [];
            chart.render();
        };

        this.resetChartViewY = (chart) => {
            const channel = parseInt(chart.container.id.replace('Container', ''), 10);
            chart.options.axisY.viewportMinimum = null;
            chart.options.axisY.viewportMaximum = null;
            chart.options.axisY.maximum = self.bCommonAmplitude ? self.getYmax(channel) : null;
            chart.options.axisY.minimum = self.bCommonAmplitude ? -chart.options.axisY.maximum : null;
            chart.options.axisY.interval = self.bCommonAmplitude ? chart.options.axisY.maximum / 2 : null;
            chart.render();
        };

        this.resetChartViewXY = (chart) => {
            const channel = parseInt(chart.container.id.replace('Container', ''), 10);
            chart.options.axisX.viewportMinimum = self.getXvpMin();
            chart.options.axisX.viewportMaximum = self.getXvpMax();
            chart.options.axisX.minimum = self.originTime ? self.originTime.millisecond() * 1000 : 0;
            chart.options.axisX.maximum = self.getXmax(channel);
            chart.options.viewportMinStack = [];
            chart.options.viewportMaxStack = [];
            chart.options.axisY.viewportMinimum = null;
            chart.options.axisY.viewportMaximum = null;
            chart.options.axisY.maximum = self.getYmax(channel);
            chart.options.axisY.minimum = -chart.options.axisY.maximum;
            chart.render();
        };

        this.getXmax = (pos) => {
            const endMicrosec = self.activeSites[pos].channels[0].microsec + self.activeSites[pos].channels[0].duration;
            return self.bCommonTime ?
                Math.max(endMicrosec, environment.fixedDuration * 1000000) :  endMicrosec;
        };

        this.getXvpMax = () => {
            return self.bCommonTime ? environment.fixedDuration * 1000000 : null;
        };

        this.getXvpMin = () => {
            return self.bCommonTime ? 0 : null;
        };

        this.getValueMaxAll = () => {
            let val;
            for (let i = 0; i < self.activeSites.length; i++) {
                for (let j = 0; j < self.activeSites[i].channels.length; j++) {
                    val = i === 0 && j === 0 ?
                        self.maxValue(self.activeSites[0].channels[0].data) :
                        Math.max(self.maxValue(self.activeSites[i].channels[j].data), val);
                }
            }
            return val;
        };

        this.getYmax = (site) => {
            let val;
            for (let j = 0; j < self.activeSites[site].channels.length; j++) {
                val = j === 0 ?
                    self.maxValue(self.activeSites[site].channels[0].data) :
                    Math.max(self.maxValue(self.activeSites[site].channels[j].data), val);
            }
            return self.bCommonAmplitude ?  self.getValueMaxAll() : val;
        };

        this.getAxisMinAll = (isXaxis) => {
            let min;
            for (let i = 0; i < self.activeSites.length; i++) {
                const chart = self.activeSites[i].chart;
                const axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
                min = i === 0 ? axis.get('minimum') : Math.min(axis.get('minimum'), min);
            }
            return min;
        };

        this.getAxisMaxAll = (isXaxis) => {
            let max;
            for (let i = 0; i < self.activeSites.length; i++) {
                const chart = self.activeSites[i].chart;
                const axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
                max = i === 0 ? axis.get('maximum') : Math.max(axis.get('maximum'), max);
            }
            return max;
        };

        this.zoomAllCharts = (vpMin, vpMax, isXaxis) => {
            if (isXaxis) {
                self.updateZoomStackCharts(vpMin, vpMax);
            }
            if (vpMin >= self.getAxisMinAll(isXaxis) && vpMax <= self.getAxisMaxAll(isXaxis)) {
                for (let i = 0; i < self.activeSites.length; i++) {
                    const chart = self.activeSites[i].chart;
                    const axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
                    axis.set('viewportMinimum', vpMin, false);
                    axis.set('viewportMaximum', vpMax);
                    chart.render();
                }
            }
        };

        this.savePicksState = (ind, site, picks) => {
            self.lastPicksState = {};
            self.lastPicksState.index = ind;
            self.lastPicksState.station_code = site;
            self.lastPicksState.picks = JSON.parse(JSON.stringify(picks));
        };

        this.undoLastPicking = () => {
            if (self.lastPicksState) {
                const ind = self.lastPicksState.index;
                const site = self.activeSites[ind];
                if (self.lastPicksState.station_code === site.station_code) {
                    const chart = site.chart;
                    const picks = self.lastPicksState.picks;
                    self.savePicksState(ind, site.station_code, site.picks);
                    site.picks = picks;
                    chart.options.axisX.stripLines = site.picks;
                    chart.render();
                }
            }
        };

        this.addPick = (ind, pickType, value) => {
            const site = self.activeSites[ind];
            const chart = site.chart;
            const data = chart.options.data[0].dataPoints;
            const position = value ? Math.round(value) : Math.round(self.lastSelectedXPosition);
            if (position < data[0].x || position > data[data.length - 1].x) {
                window.alert('Pick cannot be created outside of the current trace view');
                return;
            }
            site.picks = ( typeof site.picks !== 'undefined' && site.picks instanceof Array ) ? site.picks : [];
            self.savePicksState(ind, site.station_code, site.picks);
            // remove any existing pick of this type
            site.picks = site.picks.filter( el => el.label !== pickType);
            site.picks.push({
                value: position,
                thickness: environment.picksLineThickness,
                color: pickType === 'P' ? 'blue' : pickType === 'S' ? 'red' : 'black',
                label: pickType,
                labelAlign: 'far'
            });
            chart.options.axisX.stripLines = site.picks;
            chart.render();
        };

        this.deletePicks = (ind, pickType, value) => {
            const site = self.activeSites[ind];
            self.savePicksState(ind, site.station_code, site.picks);
            const chart = site.chart;
            if (value) {
                site.picks = site.picks
                .filter( el => el.label !== pickType || el.label === pickType && el.value !== value);
            } else {  // no value specified delete all picks of this type
                site.picks = site.picks.filter( el => el.label !== pickType);
            }
            chart.options.axisX.stripLines = site.picks;
            chart.render();
        };

        this.movePick = (ind, pickType, value, fromCurrentPosition, issueWarning) => {
            const site = self.activeSites[ind];
            const chart = site.chart;
            site.picks = ( typeof site.picks !== 'undefined' && site.picks instanceof Array ) ? site.picks : [];
            // find existing pick of this type
            const pick = self.findValue(site.picks, 'label', pickType);
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
            self.savePicksState(ind, site.station_code, site.picks);
            // move pick
            pick.value = position;
            site.picks = site.picks.filter( el => el.label !== pickType);
            site.picks.push(pick);
            chart.options.axisX.stripLines = site.picks;
            chart.render();
        };


        this.toggleTooltip = (ind, value) => {
            value = value ? value : !self.activeSites[ind].chart.options.toolTip.enabled;
            self.activeSites[ind].chart.options.toolTip.enabled = value;
            self.activeSites[ind].chart.render();
        };

        this.back = () => {
            if (self.bZoomAll) {
                if (self.xViewPortMinStack && self.xViewPortMinStack.length > 0) {
                    self.xViewPortMinStack.pop();
                    self.xViewportMaxStack.pop();
                }
                for (let j = 0; j < self.activeSites.length; j++) {
                    const chart = self.activeSites[j].chart;
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
                    const chart = self.activeSites[self.lastDownTarget].chart;
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
        };

        this.addArrivalsPickData = (sites) => {
            const missingSites = [];
            for (const arrival of self.allPicks) {
                if (arrival.hasOwnProperty('pick')) {
                const pick = arrival.pick;
                    if (moment(pick.time_utc).isValid()) {
                        const site = self.findValue(sites, 'station_code', pick.station_code);
                        if (site) {
                            site.picks = ( typeof site.picks !== 'undefined' && site.picks instanceof Array ) ? site.picks : [];
                            const pickKey = arrival.phase === 'P' ? 'P' : arrival.phase === 'S' ? 'S' : '';
                            if (pickKey !== '') {
                                const pickTime = moment(pick.time_utc);  // UTC
                                const microsec = pick.time_utc.slice(-7, -1);
                                const zTime = moment(this.originTime);
                                zTime.millisecond(0);
                                const offset = pickTime.diff(zTime, 'seconds') * 1000000;
                                site[pickKey.toLowerCase() + '_pick_time_utc'] = pick.time_utc;
                                const pickValue = parseInt(microsec, 10) + offset;
                                site.picks.push({
                                    value: pickValue,
                                    thickness: environment.picksLineThickness,
                                    color: pickKey === 'P' ? 'blue' : pickKey === 'S' ? 'red' : 'black',
                                    label: pickKey,
                                    labelAlign: 'far',
                                });
                            }
                        } else  {
                            if (!environment.enablePagingLoad && !missingSites.includes(pick.station_code)) {
                                missingSites.push(pick.station_code);
                            }
                        }
                    } else {
                        console.log('Invalid pick time for ' + pick.station_code + ' (' + pick.phase_hint + '): ' + pick.time_utc);
                    }
                } else {
                    console.log('Picks not found for arrival id: ' + arrival.arrival_resopurce_id);
                }
            }
            if (missingSites.length > 0) {
                self.picksWarning = 'No waveforms for picks at sites: ' + missingSites.toString();
            }
        };

        this.addTime = (start_time, traveltime): String => {
            const d = moment(start_time);
            d.millisecond(0);   // to second precision
            const seconds = parseFloat(start_time.slice(-8, -1)) + traveltime;
            const end_time = moment(d).add(Math.floor(seconds), 'seconds'); // to the second
            return end_time.toISOString().slice(0, -4) + (seconds % 1).toFixed(6).substring(2) + 'Z';
        };

        this.addPredictedPicksData = (sites) => {
            // for (const station of self.originTravelTimes) {
            for (const site of sites) {
                // if (station.hasOwnProperty('station_id')) {
                if (site.hasOwnProperty('station_code')) {
                    // const site = self.findValue(self.allSites, 'station_code', station.station_id);
                    const station = self.findValue(self.originTravelTimes, 'station_id', site.station_code);
                    // if (site) {
                    if (station) {
                        site.picks = ( typeof site.picks !== 'undefined' && site.picks instanceof Array ) ? site.picks : [];
                        for (const pickKey of ['P', 'S']) {
                            const key = 'travel_time_' + pickKey.toLowerCase();
                            if (station.hasOwnProperty(key)) {
                                const picktime_utc = this.addTime(this.waveformOrigin.time_utc, station[key]);
                                const pickTime = moment(picktime_utc);  // UTC
                                const microsec = picktime_utc.slice(-7, -1);
                                const zTime = moment(this.originTime);
                                zTime.millisecond(0);
                                const offset = pickTime.diff(zTime, 'seconds') * 1000000;
                                if (offset < 0 && !self.picksWarning) {
                                    self.picksWarning += 'Predicted picks outside the display time window\n';
                                }
                                site[pickKey.toLowerCase() + '_predicted_time_utc'] = picktime_utc;
                                site.picks.push({
                                    value: parseInt(microsec, 10) + offset,
                                    thickness: environment.predictedPicksLineThickness,
                                    lineDashType: 'dash',
                                    opacity: 0.5,
                                    color: pickKey === 'P' ? 'blue' : pickKey === 'S' ? 'red' : 'black',
                                    label: pickKey.toLowerCase(),
                                    labelAlign: 'far',
                                    labelFormatter: function(e) {
                                        return  e.stripLine.opacity === 0 ? '' : e.stripLine.label;
                                    }
                                });
                            }
                        }
                    }
                }
            }
        };

        this.togglePredictedPicksVisibility = (show) => {
            for (const site of this.allSites) {
                if (site.hasOwnProperty('picks')) {
                    for (const pick of site.picks) {
                        if (pick.label === pick.label.toLowerCase()) {
                            pick.opacity = show ? 0.5 : 0;
                        }
                    }
                }
            }
            self.displayPage(false);
        };

        this.calcPicksBias = () => {
            let picksTotalBias = 0; // calculate pickBias as average value of picks - predicted picks
            let nPicksBias = 0;
            for (const site of self.allSites) {
                for (const pickKey of ['p', 's']) {
                    const predicted_key = pickKey + '_predicted_time_utc';
                    const pick_key = pickKey + '_pick_time_utc';
                    if (site.hasOwnProperty(predicted_key) && site.hasOwnProperty(pick_key)) {
                            const pickTime = moment(site[pick_key]);
                            const zTime = moment(site[predicted_key]);
                        if (pickTime.isValid() && zTime.isValid()) {
                            const microsec = site[pick_key].slice(-7, -1);
                            const microsec_ref = site[predicted_key].slice(-7, -1);
                            zTime.millisecond(0);
                            const offset = pickTime.diff(zTime, 'seconds') * 1000000;
                            picksTotalBias += parseInt(microsec, 10) + offset - parseInt(microsec_ref, 10);
                            nPicksBias++;
                        }
                    }
                }
            }
            self.picksBias = Math.round(picksTotalBias / nPicksBias);
        };

        this.activateRemoveBias = (show) => {
            if (!self.bRemoveBias) { // turn remove bias on when loading all data (no pagination)
                self.bRemoveBias = !self.bRemoveBias;
                $('#togglePredictedPicksBias').toggleClass('active');
            }
            self.calcPicksBias();
            self.changePredictedPicksByBias(self.bRemoveBias, show);
        };

        this.changePredictedPicksByBias = (removeBias, show) => {
            if (self.picksBias !== 0) {
                for (const site of this.allSites) {
                    if (site.hasOwnProperty('picks')) {
                        for (const pick of site.picks) {
                            if (pick.label === pick.label.toLowerCase()) {
                                pick.value = removeBias ? pick.value + self.picksBias : pick.value - self.picksBias;
                            }
                        }
                    }
                }
                if (show) {
                    self.displayPage(false);
                }
            }
        };

        this.sortTraces = () => {
          if (Array.isArray(self.allSites)) {
              self.allSites.sort
                (this.sort_array_by
                 ('p_predicted_time_utc', false, function(x) { return x ? moment(x) : moment.now(); })
                );
          }
        };

        this.parseMiniseed = (file): any => {
            const records = miniseed.parseDataRecords(file);
            const channelsMap = miniseed.byChannel(records);
            const sites = [];
            let zTime = null, originTime = null;
            const eventData = {};
            let changeOriginTime = false;
            channelsMap.forEach( function(this, value, key, map) {
                const sg = miniseed.createSeismogram(channelsMap.get(key));
                const header = channelsMap.get(key)[0].header;
                if (sg.y().includes(NaN) === false && sg.y().some(el => el !== 0)) {
                    if (!zTime) {
                        zTime = moment(sg.start());  // starting time (use it up to second)
                    } else {
                        if (!sg.start().isSame(zTime, 'second')) {
                            zTime = moment(moment.min(zTime, sg.start()));
                            changeOriginTime = true;
                        }
                    }
                    const seismogram = filter.rMean(sg);
                    const channel = {};
                    channel['code_id'] = sg.codes();
                    channel['station_code'] = sg.stationCode();
                    channel['channel_id'] = sg.channelCode();
                    channel['sample_rate'] = sg.sampleRate();
                    channel['start'] = sg.start();  // moment object (good up to milisecond)
                    // microsecond stored separately, tenthMilli from startBTime + microsecond from Blockette 1001
                    channel['microsec'] = header.startBTime.tenthMilli * 100 + header.blocketteList[0].body.getInt8(5);
                    channel['raw'] = seismogram;
                    const waveform = [];
                    for (let k = 0; k < seismogram.numPoints(); k++) {
                        waveform.push({
                            x: channel['microsec'] + (k * 1000000 / channel['sample_rate']),   // trace microsecond offset
                            y: seismogram.y()[k]  // trace after mean removal
                        });
                    }
                    channel['data'] = waveform;
                    channel['duration'] = (seismogram.numPoints() - 1) * 1000000 / channel['sample_rate'];  // in microseconds
                    let site = self.findValue(sites, 'station_code', sg.stationCode());
                    if (!site) {
                        site = { station_code: sg.stationCode(), channels: [] };
                        sites.push(site);
                    }
                    site.channels.push(channel);
                }
            });
            if (zTime && zTime.isValid()) {
                originTime = moment(zTime);
                originTime.millisecond(Math.floor(zTime.millisecond() / 100) * 100);
                zTime.millisecond(0);
                if (changeOriginTime) {
                    console.log('***changeOriginTime channels change in earliest time second detected');
                    for (let i = 0; i < sites.length; i++) {
                        for (let j = 0; j < sites[i].channels.length; j++) {
                            if (!sites[i].channels[j].start.isSame(zTime, 'second')) {
                                const offset = sites[i].channels[j].start.diff(zTime, 'seconds') * 1000000;
                                sites[i].channels[j].microsec = sites[i].channels[j].microsec + offset;
                                for (let k = 0; k < sites[i].channels[j].data.length; k++) { // microsecond offset from zeroTime
                                    sites[i].channels[j].data[k]['x'] = sites[i].channels[j].data[k]['x'] + offset;
                                }
                            }
                        }
                    }
                }
            }
            eventData['sites'] = sites;
            eventData['originTime'] = originTime;
            return(eventData);
        };


        this.createButterworthFilter = (sample_rate): any => {
            let butterworth = null;
            if (self.lowFreqCorner > 0 && self.highFreqCorner < sample_rate / 2 ) {
                butterworth = filter.createButterworth(
                                     self.numPoles, // poles
                                     self.passband,
                                     self.lowFreqCorner, // low corner
                                     self.highFreqCorner, // high corner
                                     1 / sample_rate
                );
            }
            return butterworth;
        };

        this.applyFilter = () => {
            if (self.bFilterChanged && self.allSites.length > 0) {
                self.saveOption('numPoles');
                self.saveOption('lowFreqCorner');
                self.saveOption('highFreqCorner');
                self.allSites = self.addCompositeTrace(self.filterData(self.allSites)); // filter and recompute composite traces
                self.displayPage(false);
            }
        };

        this.filterData = (sites): any[] => {
            for (const site of sites) {
                // remove composite traces if existing
                const pos = site.channels.findIndex(v => v.channel_id === environment.compositeChannelCode);
                if (pos >= 0) {
                    site.channels.splice(pos, 1);
                }
                for (const channel of site.channels) {
                    if (channel.hasOwnProperty('raw')) {
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
                    } else {
                        console.log('Error applying filter cannot find raw data');
                        break;
                    }
                }
            }
            self.bFilterChanged = false;
            return sites;
        };

        this.addCompositeTrace = (sites): any[] => {
            let message = '';
            for (const site of sites) {
                if (site.channels.length === 3) {
                    if (site.channels[0].start.isSame(site.channels[1].start) &&
                        site.channels[0].start.isSame(site.channels[2].start) &&
                        site.channels[0].microsec === site.channels[1].microsec &&
                        site.channels[0].microsec === site.channels[2].microsec) {
                        if (site.channels[0].sample_rate === site.channels[1].sample_rate &&
                            site.channels[0].sample_rate === site.channels[2].sample_rate) {
                            if (site.channels[0].data.length === site.channels[1].data.length &&
                                site.channels[0].data.length === site.channels[2].data.length) {
                                const compositeTrace = {};
                                compositeTrace['code_id'] = site.channels[0].code_id.slice(0, -1) + environment.compositeChannelCode;
                                compositeTrace['station_code'] = site.station_code;
                                compositeTrace['channel_id'] = environment.compositeChannelCode;
                                compositeTrace['sample_rate'] = site.channels[0].sample_rate;
                                compositeTrace['start'] = site.channels[0].start;  // moment object (good up to milisecond)
                                compositeTrace['microsec'] = site.channels[0].microsec;
                                compositeTrace['data'] = [];
                                compositeTrace['duration'] = site.channels[0].duration;  // in microseconds
                                for (let k = 0; k < site.channels[0].data.length; k++) {
                                    let compositeValue = 0, sign = 1;
                                    for (let j = 0; j < 3; j++) {
                                        const value = site.channels[j].data[k]['y'];
                                        sign = site.channels[j].channel_id.toLowerCase() === environment.signComponent.toLowerCase() ?
                                            Math.sign(value) : sign;
                                        compositeValue += Math.pow(value, 2);
                                    }
                                    sign = sign === 0 ? 1 : sign;   // do not allow zero value to zero composite trace value
                                    compositeValue = Math.sqrt(compositeValue) * sign;
                                    compositeTrace['data'].push({
                                        x: site.channels[0].data[k]['x'],
                                        y: compositeValue
                                    });
                                }
                                site.channels.push(compositeTrace);
                            } else {
                                console.log('Cannot create 3C composite trace for site: '
                                    + site['station_code'] + ' different channel lengths');
                            }
                        } else {
                            console.log('Cannot create 3C composite trace for site: ' + site['station_code'] + ' different sample rates: ' +
                                site.channels[0].sample_rate + site.channels[2].sample_rate + site.channels[2].sample_rate);
                        }
                    } else {
                        console.log('Cannot create 3C composite trace for site: '
                            + site['station_code'] + ' different channels start times ' +
                            site.channels[0].start.toISOString() + site.channels[1].start.toISOString()
                            + site.channels[2].start.toISOString());
                    }
                } else {
                    message += 'Cannot create 3C composite trace for site: ' + site['station_code'] +
                        ' available channels: ' + site.channels.length + ' (' +
                        (site.channels.length > 0 ? site.channels[0].channel_id +
                        (site.channels.length > 1 ? site.channels[1].channel_id
                            : ' ') : ' ') + ')\n';
                }
            }
            if (message) {
                console.log(message);
                // window.alert(message);
            }
            return sites;
        };

        this.getEvent = (event): any => {
            return new Promise(resolve => {
                const mshr = new XMLHttpRequest();
                const waveform_file = event.hasOwnProperty('waveform_file') && event.waveform_file ?
                    event.waveform_file : event.variable_size_waveform_file;
                mshr.open('GET', waveform_file, true);
                mshr.responseType = 'arraybuffer';
                self.loading = true;
                mshr.onreadystatechange = () => {
                    if (mshr.readyState === mshr.DONE) {
                        if (mshr.status === 200)  {
                            self.loading = false;
                            resolve (mshr.response);
                        } else {
                            self.loading = false;
                            console.log('Error getting miniseed', mshr.statusText);
                        }
                    }
                };
                mshr.send();
            });
        };

        this.getEventPage = (event_id, page): any => {
            return new Promise(resolve => {
                const mshr = new XMLHttpRequest();
                const waveform_file = environment.apiUrl + environment.apiEvents + '/' + event_id +
                        '/waveform?page_number=' + page.toString() +
                        '&traces_per_page=' + environment.chartsPerPage.toString();
                mshr.open('GET', waveform_file, true);
                mshr.responseType = 'arraybuffer';
                self.loading = page === 1 ? true : false;
                mshr.onreadystatechange = () => {
                    if (mshr.readyState === mshr.DONE) {
                        if (mshr.status === 200)  {
                            self.loading = false;
                            if (page === 1) {
                                const filename = self.getAttachmentFilename(mshr);
                                if (filename.indexOf('of_') && filename.lastIndexOf('.') ) {
                                   self.num_pages = parseInt(
                                       filename.substring(filename.indexOf('of_') + 3, filename.lastIndexOf('.')), 10);
                                }
                            }
                            resolve (mshr.response);
                        } else {
                            self.loading = false;
                            console.log('Error getting miniseed', mshr.statusText);
                        }
                    }
                };
                mshr.send();
            });
        };

        this.getAttachmentFilename = (xhr): any => {
            let filename = '';
            const disposition = xhr.getResponseHeader('Content-Disposition');
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                  filename = matches[1].replace(/['"]/g, '');
                }
            }
            return filename;
        };


    }
}
