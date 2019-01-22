/*jshint esversion: 6 */
import { Component, ViewChild, OnInit } from '@angular/core';
import * as $ from 'jquery';
import * as CanvasJS from './canvasjs.min';
import { environment } from '../environments/environment';
import { CatalogApiService } from './catalog-api.service';
import * as miniseed from 'seisplotjs-miniseed';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
    title = 'waveform-ui-angular';

    public catalog: any;
    public allChannels: any[];
    public activeChannels: any[];
    public zeroTime: Date;

    public commonTimeState: Boolean;
    public commonYState: Boolean;
    public showTooltip: Boolean;
    public showHelp: Boolean;
    public zoomAll: Boolean;

    private convYUnits: number;

    public selected: number;
    public selectedContextMenu: number;
    public lastSelectedXPosition: number;
    public lastDownTarget: any;  // last mouse down selection

    public eventMessage: any;

    private menu: any;
    private menuVisible: Boolean;

    private renderCharts: Function;
    private destroyCharts: Function;
    private setChartKeys: Function;
    private getEvent: Function;
    private getEventInfo: Function;
    private parseMiniseed: Function;
    private loadEvent: Function;

    private toggleMenu: Function;
    private setPosition: Function;
    private maxValue: Function;
    private toggleCommonTime: Function;
    private toggleCommonAmplitude: Function;
    private updateZoomStackCharts: Function;
    private resetAllChartsViewX: Function;
    private resetAllChartsViewXY: Function;
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
    private deletePicks: Function;
    private addPickData: Function;
    private toggleTooltip: Function;
    private back: Function;
    private setPage: Function;
    private page_size: number;

    public loading = false;

    getNotification(message) {
        console.log(message);
        this.eventMessage = message;
        this.loadEvent(message);
    }

    constructor(private _catalogService: CatalogApiService) { }

    public ngOnInit() {

        const self = this;

        self.commonTimeState = true;
        self.commonYState = false;
        self.showTooltip = false;
        self.showHelp = false;
        self.zoomAll = false;

        self.convYUnits = 0.001; // factor to convert input units (m) to mmm
        // self.convYUnits = 10000000;  // factor to convert input units (m/1e10) to mmm

        self.selected = -1;
        self.selectedContextMenu = -1;
        self.lastSelectedXPosition = -1;

        self.menu = document.querySelector('.menu');
        self.menuVisible = false;

        self.page_size = 10;

        const divStyle = 'height: ' + environment.chartHeight + 'px; max-width: 2000px; margin: 0px auto;';

        this._catalogService.get_recent_events_week().subscribe(data => {
                this.catalog = data;
                this.catalog.sort((a, b) => (new Date(a.time_utc) > new Date(b.time_utc)) ? -1 : 1);
                const event = this.catalog[0];
                this.loadEvent(event);
            },
            err => console.error(err),
            () => console.log('done loading')
        );

        this.loadEvent = event => {
            if (event.hasOwnProperty('waveform_file')) {
                self.destroyCharts();
                self.getEvent(event).then(eventFile => {
                    if (eventFile) {
                        const eventData = self.parseMiniseed(eventFile);
                        self.allChannels = eventData.channels;
                        self.zeroTime = eventData.zeroTime;
                        self.setPage(1);
                        console.log(self.activeChannels);
                        self.renderCharts();
                        self.setChartKeys();
                    }
                });
                self.getEventInfo(event);
            }
        };

        this.setPage = pageNumber => {
            self.activeChannels = self.allChannels.slice((pageNumber - 1) * self.page_size, pageNumber * self.page_size);

        };

        this.toggleMenu = command => {
         (<any>self.menu).style.display = command === 'show' ? 'block' : 'none';
          self.menuVisible = !self.menuVisible;
        };

        this.setPosition = ({ top, left }) => {
          (<any>self.menu).style.left = `${left}px`;
          (<any>self.menu).style.top = `${top}px`;
          self.toggleMenu('show');
        };

        this.maxValue = (dataPoints, res) => {
            res = res ? res : 10;
            let maximum = Math.abs(dataPoints[0].y);
            for (let i = 0; i < dataPoints.length; i++) {
                if (Math.abs(dataPoints[i].y) > maximum) {
                    maximum = Math.abs(dataPoints[i].y);
                }
            }
            return Math.ceil(maximum / (self.convYUnits / res)) * (self.convYUnits / res);
        };

        this.destroyCharts = () => {
            if (self.activeChannels) {
                for (let i = 0; i < self.activeChannels.length; i++) {
                    self.activeChannels[i].chart.destroy();
                    const elem = document.getElementById(self.activeChannels[i].container);
                    elem.parentElement.removeChild(elem);
                }
            }
        };

        this.renderCharts = () => {
           // Chart Options, Render

            for (let i = 0; i < self.activeChannels.length; i++) {

                if ( $('#' + self.activeChannels[i].container).length === 0 ) {
                    $('<div>').attr({
                        'id': self.activeChannels[i].container,
                        'style': divStyle
                    }).appendTo('#waveform-panel');
                }

                const options = {
                    zoomEnabled: true,
                    zoomType: 'x',
                    animationEnabled: true,
                    rangeChanged: function(e) {
                        if (!e.chart.options.viewportMinStack) {
                            e.chart.options.viewportMinStack = [];
                            e.chart.options.viewportMaxStack = [];
                        }
                        if (e.trigger === 'zoom') {
                            if (self.zoomAll) {
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
                        text: self.activeChannels[i].station,
                        dockInsidePlotArea: true,
                        fontSize: 12,
                        fontFamily: 'tahoma',
                        fontColor: 'blue',
                        horizontalAlign: 'left'
                    },
                    toolTip: {
                        enabled: self.showTooltip,
                        contentFormatter: function (e) {
                            const content = ' ' +
                             '<strong>' + e.entries[0].dataPoint.y / self.convYUnits + ' mm/s</strong>' +
                             '<br/>' +
                             '<strong>' + e.entries[0].dataPoint.x / 1000000 + ' s</strong>';
                            return content;
                        }
                    },
                    axisX: {
                        minimum: 0,
                        maximum: self.getXmax(i),
                        viewportMinimum: self.getXvpMin(),
                        viewportMaximum: self.getXvpMax(),
                        includeZero: true,
                        labelAutoFit: false,
                        labelWrap: false,
                        labelFormatter: function(e) {
                            if (e.value === 0) {
                                return self.zeroTime.toISOString().split('.')[0].replace('T', ' ');
                            } else {
                                return  e.value / 1000000 + ' s' ;
                            }
                        },
                        stripLines: self.activeChannels[i].picks
                    },
                    axisY: {
                        minimum: -self.getYmax(i),
                        maximum: self.getYmax(i),
                        includeZero: true,
                        labelFormatter: function(e) {
                            if (e.value === 0) {
                                return  '0 mm/s';
                            } else {
                                return  e.value / self.convYUnits;
                            }
                        }
                    },
                    data: [
                        {
                            type: 'line',
                            lineColor: 'black',
                            lineThickness: 1,
                            highlightEnabled: true,
                            dataPoints: self.activeChannels[i].data
                        }
                    ]
                };
                self.activeChannels[i].chart = new CanvasJS.Chart(self.activeChannels[i].container, options);
                self.activeChannels[i].chart.render();
            }
            console.log(self.activeChannels.length + ' total activeChannels');
        };

        this.setChartKeys = () => {
            for (let j = 0; j < self.activeChannels.length; j++) {
                const canvas_chart = '#' + self.activeChannels[j].container + ' > .canvasjs-chart-container > .canvasjs-chart-canvas';
                // Drag picks
                $(canvas_chart).last().on('mousedown', function(e) {
                    self.lastDownTarget = e.target;

                    if (!($(e.target).parents('.menu').length > 0)) {
                        if (self.menuVisible) {
                            self.selectedContextMenu = -1;
                            self.toggleMenu('hide');
                            return;
                        }
                    }
                    const ind = parseInt($(this).parent().parent()[0].id.replace('Container', ''), 10);
                    const chart = self.activeChannels[ind].chart;
                    const parentOffset = $(this).parent().offset();
                    const relX = e.pageX - parentOffset.left;
                    const relY = e.pageY - parentOffset.top;
                    if (e.button === 0) {  // drag active on left mouse button only
                        // Get the selected stripLine & change the cursor
                        for (let i = 0; i < chart.axisX[0].stripLines.length; i++) {
                            if (chart.axisX[0].stripLines[i].get('bounds')) {
                                if (relX > chart.axisX[0].stripLines[i].get('bounds').x1 - environment.snapDistance &&
                                 relX < chart.axisX[0].stripLines[i].get('bounds').x2 + environment.snapDistance &&
                                 relY > chart.axisX[0].stripLines[i].get('bounds').y1 &&
                                 relY < chart.axisX[0].stripLines[i].get('bounds').y2) {
                                    if (e.ctrlKey) {  // remove pick
                                        const selLine = chart.options.axisX.stripLines[i];
                                        self.deletePicks(ind, selLine.label, selLine.value);
                                    } else {  // move pick
                                        self.selected = i;
                                        $(this).addClass('pointerClass');
                                    }
                                    break;
                                }
                            }
                        }
                    } else if (e.button === 1) {  // add new P or S
                            if (e.ctrlKey) {  // add new P on Ctrl + center mouse button click
                                self.addPick(ind, 'P', chart.axisX[0].convertPixelToValue(relX));
                            } else if (e.shiftKey) {   // add new S pick on Shift + center mouse button click
                                self.addPick(ind, 'S', chart.axisX[0].convertPixelToValue(relX));
                            }
                    } else if (e.button === 2) {  // save position on right mouse button, context menu
                        self.lastSelectedXPosition = chart.axisX[0].convertPixelToValue(relX);
                    }
                });

                $(canvas_chart).last().on('mousemove', function(e) {  // move selected stripLine
                    if (self.selected !== -1) {
                        const i = parseInt( $(this).parent().parent()[0].id.replace('Container', ''), 10);
                        const chart = self.activeChannels[i].chart;
                        const parentOffset = $(this).parent().offset();
                        const relX = e.pageX - parentOffset.left;
                        chart.options.axisX.stripLines[self.selected].value = chart.axisX[0].convertPixelToValue(relX);
                        chart.options.zoomEnabled = false;
                        chart.render();
                    }
                });

                $(canvas_chart).last().on('mouseup', function(e) {
                    if (self.selected !== -1) {   // clear selection and change the cursor
                        self.selected = -1;
                        $(this).removeClass('pointerClass');
                        // let i = parseInt( $(this).parent()[0].id.replace('Container',''));
                        const i = parseInt($(this).parent().parent()[0].id.replace('Container', ''), 10);
                        const chart = self.activeChannels[i].chart;
                        chart.options.zoomEnabled = true;   // turn zoom back on
                        // document.getElementById(self.activeChannels[i].button).style.display = 'inline';
                        chart.render();
                    }
                });

                // Zoom: on mouse wheel event zoom on Y axis if Ctrl key is pressed, or on X axis if Shift key pressed
                $(canvas_chart)[1].addEventListener('wheel', function(e) {
                    if (e.ctrlKey || e.shiftKey || e.altKey) {

                        e.preventDefault();

                        const i = parseInt($(this).parent().parent()[0].id.replace('Container', ''), 10);
                        const chart = self.activeChannels[i].chart;

                        const relOffsetY = e.clientY - environment.pageOffsetY - i * environment.chartHeight;

                        if (e.clientX < chart.plotArea.x1 ||
                         e.clientX > chart.plotArea.x2 ||
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
                            if (e.deltaY < 0) {
                                newViewportMin = viewportMin + interval;
                                newViewportMax = viewportMax - interval;
                            } else if (e.deltaY > 0) {
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
                            if (self.zoomAll) {
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

                $('#' + self.activeChannels[j].container).on('contextmenu', e => {
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
            self.commonYState = !self.commonYState;
            $(this).toggleClass('active');
            self.resetAllChartsViewY();
        });

        $('#commonTime').on('click', () => {
            self.commonTimeState = !self.commonTimeState;
            $(this).toggleClass('active');
            self.resetAllChartsViewX();
        });

        document.addEventListener('keydown', e => {
            if (e.keyCode === 90) {
                self.toggleCommonTime();
            }
            if (e.keyCode === 88) {
                self.toggleCommonAmplitude();
            }
        },
        false);

        $('#showTooltip').on('click', () => {
            self.showTooltip = !self.showTooltip;
            $(this).toggleClass('active');
            for (let i = 0; i < self.activeChannels.length; i++) {
                self.toggleTooltip(i, self.showTooltip);
            }
        });

        $('#showHelp').on('click', () => {
            self.showHelp = !self.showHelp;
            $(this).toggleClass('active');
        });

        $('#zoomAll').on('click', () => {
            self.zoomAll = !self.zoomAll;
            $(this).toggleClass('active');
        });

        $('#resetAll').on('click', () => {
            self.resetAllChartsViewXY();
        });

        $('#backBtn').on('click', () => {
            self.back();
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

        this.toggleCommonTime = () => {
            self.commonTimeState = !self.commonTimeState;
            if (self.commonTimeState) {
                $('#commonTime').addClass('active');
                $('#commonTime')[0].setAttribute('aria-pressed', 'true');
            } else {
                $('#commonTime').removeClass('active focus');
                $('#commonTime')[0].setAttribute('aria-pressed', 'false');
            }
            self.resetAllChartsViewX();
        };

        this.toggleCommonAmplitude = () => {
            self.commonYState = !self.commonYState;
            if (self.commonYState) {
                $('#commonAmplitude').addClass('active');
                $('#commonAmplitude')[0].setAttribute('aria-pressed', 'true');
            } else {
                $('#commonAmplitude').removeClass('active focus');
                $('#commonAmplitude')[0].setAttribute('aria-pressed', 'false');
            }
            self.resetAllChartsViewY();
        };

        this.updateZoomStackCharts = (vpMin, vpMax) => {
            for (let i = 0; i < self.activeChannels.length; i++) {
                const chart = self.activeChannels[i].chart;
                if (!chart.options.viewportMinStack) {
                    chart.options.viewportMinStack = [];
                    chart.options.viewportMaxStack = [];
                }
                chart.options.viewportMinStack.push(vpMin);
                chart.options.viewportMaxStack.push(vpMax);
            }
        };

        this.resetAllChartsViewX = () => {
            for (let i = 0; i < self.activeChannels.length; i++) {
                self.resetChartViewX(self.activeChannels[i].chart);
            }
        };

        this.resetAllChartsViewY = () => {
            for (let i = 0; i < self.activeChannels.length; i++) {
                self.resetChartViewY(self.activeChannels[i].chart);
            }
        };

        this.resetAllChartsViewXY = () => {
            for (let i = 0; i < self.activeChannels.length; i++) {
                self.resetChartViewXY(self.activeChannels[i].chart);
            }
        };

        this.resetChartViewX = (chart) => {
            const channel = parseInt( chart.container.id.replace('Container', ''), 10);
            chart.options.axisX.viewportMinimum = self.getXvpMin();
            chart.options.axisX.viewportMaximum = self.getXvpMax();
            chart.options.axisX.minimum = 0;
            chart.options.axisX.maximum = self.getXmax(channel);
            chart.options.viewportMinStack = [];
            chart.options.viewportMaxStack = [];
            chart.render();
        };

        this.resetChartViewY = (chart) => {
            const channel = parseInt( chart.container.id.replace('Container', ''), 10);
            chart.options.axisY.viewportMinimum = null;
            chart.options.axisY.viewportMaximum = null;
            chart.options.axisY.minimum = -self.getYmax(channel);
            chart.options.axisY.maximum = self.getYmax(channel);
            chart.render();
        };

        this.resetChartViewXY = (chart) => {
            const channel = parseInt( chart.container.id.replace('Container', ''), 10);
            chart.options.axisX.viewportMinimum = self.getXvpMin();
            chart.options.axisX.viewportMaximum = self.getXvpMax();
            chart.options.axisX.minimum = 0;
            chart.options.axisX.maximum = self.getXmax(channel);
            chart.options.viewportMinStack = [];
            chart.options.viewportMaxStack = [];
            chart.options.axisY.viewportMinimum = null;
            chart.options.axisY.viewportMaximum = null;
            chart.options.axisY.minimum = -self.getYmax(channel);
            chart.options.axisY.maximum = self.getYmax(channel);
            chart.render();
        };

        this.getXmax = (pos) => {
            return self.commonTimeState ?
                Math.max(self.activeChannels[pos].duration, environment.fixedDuration * 1000000) :  self.activeChannels[pos].duration;
        };

        this.getXvpMax = () => {
            return self.commonTimeState ? environment.fixedDuration * 1000000 : null;
        };

        this.getXvpMin = () => {
            return self.commonTimeState ? 0 : null;
        };

        this.getValueMaxAll = () => {
            let val;
            for (let i = 0; i < self.activeChannels.length; i++) {
                val = i === 0 ?
                    self.maxValue(self.activeChannels[0].data, null) : Math.max(self.maxValue(self.activeChannels[i].data, null), val);
            }
            return val;
        };

        this.getYmax = (channel) => {
            return self.commonYState ?  self.getValueMaxAll() : self.maxValue(self.activeChannels[channel].data, 100);
        };

        this.getAxisMinAll = (isXaxis) => {
            let min;
            for (let i = 0; i < self.activeChannels.length; i++) {
                const chart = self.activeChannels[i].chart;
                const axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
                min = i === 0 ? axis.get('minimum') : Math.min(axis.get('minimum'), min);
            }
            return min;
        };

        this.getAxisMaxAll = (isXaxis) => {
            let max;
            for (let i = 0; i < self.activeChannels.length; i++) {
                const chart = self.activeChannels[i].chart;
                const axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
                max = i === 0 ? axis.get('maximum') : Math.max(axis.get('maximum'), max);
            }
            return max;
        };

        this.zoomAllCharts = (vpMin, vpMax, isXaxis) => {
            self.updateZoomStackCharts(vpMin, vpMax);
            if (vpMin >= self.getAxisMinAll(isXaxis) && vpMax <= self.getAxisMaxAll(isXaxis)) {
                for (let i = 0; i < self.activeChannels.length; i++) {
                    const chart = self.activeChannels[i].chart;
                    const axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
                    axis.set('viewportMinimum', vpMin, false);
                    axis.set('viewportMaximum', vpMax);
                    chart.render();
                }
            }
        };

        this.addPick = (ind, pickType, value) => {
            const chart = self.activeChannels[ind].chart;
            const position = value ? value : self.lastSelectedXPosition;
            self.activeChannels[ind].picks.push({
                value: position,
                thickness: 2,
                color: pickType === 'P' ? 'red' : pickType === 'S' ? 'blue' : 'black',
                label: pickType,
                labelAlign: 'far'
            });
            chart.options.axisX.stripLines = self.activeChannels[ind].picks;
            chart.render();
        };

        this.deletePicks = (ind, pickType, value) => {
            const chart = self.activeChannels[ind].chart;
            if (value) {
                self.activeChannels[ind].picks = self.activeChannels[ind].picks
                .filter( el => el.label !== pickType || el.label === pickType && el.value !== value);
            } else {  // no value specified delete all picks of this type
                self.activeChannels[ind].picks = self.activeChannels[ind].picks.filter( el => el.label !== pickType);
            }
            chart.options.axisX.stripLines = self.activeChannels[ind].picks;
            chart.render();
        };

        this.toggleTooltip = (ind, value) => {
            value = value ? value : !self.activeChannels[ind].chart.options.toolTip.enabled;
            self.activeChannels[ind].chart.options.toolTip.enabled = value;
            self.activeChannels[ind].chart.render();
        };

        this.back = () => {
            for (let j = 0; j < self.activeChannels.length; j++) {
                const canvas_chart = '#' + self.activeChannels[j].container +
                    ' > .canvasjs-chart-container' + ' > .canvasjs-chart-canvas';
                if (self.zoomAll || self.lastDownTarget === $(canvas_chart)[1]) {
                    const chart = self.activeChannels[j].chart;
                    const viewportMinStack = chart.options.viewportMinStack;
                    const viewportMaxStack = chart.options.viewportMaxStack;
                    if (!chart.options.axisX) {
                        chart.options.axisX = {};
                    }
                    if (viewportMinStack && viewportMinStack.length >= 1) {
                        viewportMinStack.pop();
                        viewportMaxStack.pop();
                        chart.options.axisX.viewportMinimum = viewportMinStack[viewportMinStack.length - 1];
                        chart.options.axisX.viewportMaximum = viewportMaxStack[viewportMaxStack.length - 1];
                        chart.render();
                    } else {
                        self.resetChartViewX(chart);
                    }
                    if (!self.zoomAll) {
                        break;
                    }
                }
            }
        };

        this.addPickData = (pickType, data, obj) => {
            obj.picks = ( typeof obj.picks !== 'undefined' && obj.picks instanceof Array ) ? obj.picks : [];
            const pickKey = pickType === 'P' ? 'p-pick' : pickType === 'S' ? 's-pick' : '';
            if (pickKey !== '') {
                if (data.hasOwnProperty(pickKey)) {
                    const datesplit = data[pickKey].split('.');
                    const pickTime = new Date(datesplit[0] + 'Z');  // to UTC
                    obj.picks.push({
                        value: parseInt(datesplit[1], 10),
                         // + (pickTime === zeroTime ? 0 : (pickTime.getTime() - zeroTime.getTime()) * 1000),
                        thickness: 2,
                        color: pickKey === 'p-pick' ? 'blue' : pickKey === 's-pick' ? 'red' : 'black',
                        label: pickType,
                        labelAlign: 'far'
                    });
                }
            }
        };

        this.getEventInfo = (event) => {
          const qmlhr = new XMLHttpRequest();
          qmlhr.open('GET', event.event_file , true);
          qmlhr.onreadystatechange = function() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                // Typical action to be performed when the document is ready:
                const qml = qmlhr.responseXML;
                console.log(qml);
              } else {
                console.log('Error getting QuakeML', this.statusText);
              }
            }
          };
          qmlhr.send();
        };

        this.parseMiniseed = (file): any => {
            const records = miniseed.parseDataRecords(file);
            const channelsMap = miniseed.byChannel(records);
            const chans = [];
            let i = 0;
            let zTime = null;
            const eventData = {};
            let sampleRate = 0;
            let rescan = false;
            channelsMap.forEach( function(this, value, key, map) {
                const sg = miniseed.createSeismogram(channelsMap.get(key));
                const header = channelsMap.get(key)[0].header;
                if (sg._y.includes(NaN) === false) {
                    if (i === 0) {
                        sampleRate = sg.sampleRate();
                        zTime = new Date(sg._start.toISOString().split('.')[0] + 'Z');  // starting time to second
                    } else {
                        const channelZeroTime = new Date(sg._start.toISOString().split('.')[0] + 'Z');
                        if (channelZeroTime.getTime() < zTime.getTime()) {
                            zTime = channelZeroTime;
                            rescan = true;
                        }
                    }
                    chans[i] = {};
                    chans[i].station = sg.codes();
                    chans[i].start = sg._start.toDate();
                    // tenthMilli from startBTime + microsecond from Blockette 1001
                    chans[i].microsec = header.startBTime.tenthMilli * 100 + header.blocketteList[0].body.getInt8(5);
                    chans[i].data = [];
                    for (let k = 0; k < sg.numPoints(); k++) {
                        chans[i].data.push({
                            x: chans[i].microsec + (k * 1000000 / sampleRate),
                            y: sg._y[k]
                        });
                    }
                    chans[i].duration = (sg.numPoints() - 1) * 1000000 / sampleRate;
                    self.addPickData('P', sg, chans[i]);
                    self.addPickData('S', sg, chans[i]);
                    chans[i].container = i.toString() + 'Container';
                    i ++;
                }
            });
            if (rescan) {
                console.log('rescan channels change in earliest time detected');
                for (let j = 0; j < chans.length; j++) {
                    const channelZeroTime = new Date(chans[j].start.toISOString().split('.')[0] + 'Z');
                    if (channelZeroTime !== zTime) {
                        for (let k = 0; k < chans[k].data.length; k++) {
                            chans[k].data['x'] = chans[k].data['x']
                               + (channelZeroTime.getTime() - zTime.getTime()) * 1000;
                        }
                    }
                }
            }
            eventData['channels'] = chans;
            eventData['zeroTime'] = zTime;
            return(eventData);
        };

        this.getEvent = (event): any => {
            return new Promise(resolve => {
                const mshr = new XMLHttpRequest();
                mshr.open('GET', event.waveform_file, true);
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

    }

}
