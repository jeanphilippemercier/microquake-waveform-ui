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

    public catalog;

    public eventMessage: any;

    getNotification(message) {
        console.log(message);
        this.eventMessage = message;
    }

    constructor(private _catalogService: CatalogApiService) { }

    ngOnInit() {
        let zeroTime = new Date();
        let commonAmplitude = false;
        let commonTimeState = true;
        let showTooltip = false;
        let showHelp = false;
        let zoomAll = false;
        const toMicro = 1000000;  // seconds to microseconds factor
        // const toMmUnits = 10000000;  // factor to convert input units (m/1e10) to mmm
        const toMmUnits = 0.001;  // factor to convert input units (m) to mmm
        const initialDuration = toMicro;  // time window to display in microseconds (1 second)
        let selected = -1;
        let selectedContextMenu = -1;
        let lastSelectedXPosition = -1;
        let lastDownTarget;  // last mouse down selection
        const zoomSteps = 5;    // for wheel mouse zoom
        const pageOffsetY = 40;
        const snapDistance = 10;
        let channels = [];

        const menu = document.querySelector('.menu');
        let menuVisible = false;

        let eventMessage = null;

        function getNotification(message) {
            console.log(message);
            eventMessage = message;
        }


        this._catalogService.get_recent_events_week().subscribe(data => {
                this.catalog = data;
                this.catalog.sort((a, b) => (new Date(a.time_utc) > new Date(b.time_utc)) ? -1 : 1);
                const event = this.catalog[0];
                getEvent(event).then(eventData => {
                    if (eventData) {
                        channels = eventData.channels;
                        zeroTime = eventData.zeroTime;
                        console.log(channels);
                        renderCharts();
                        addListeners();
                    }
                });
                getEventInfo(event);
            },
            err => console.error(err),
            () => console.log('done loading')
        );


        const toggleMenu = command => {
         (<any>menu).style.display = command === 'show' ? 'block' : 'none';
          menuVisible = !menuVisible;
        };

        const setPosition = ({ top, left }) => {
          (<any>menu).style.left = `${left}px`;
          (<any>menu).style.top = `${top}px`;
          toggleMenu('show');
        };

        function maxValue (dataPoints, res) {
            res = res ? res : 10;
            let maximum = Math.abs(dataPoints[0].y);
            for (let i = 0; i < dataPoints.length; i++) {
                if (Math.abs(dataPoints[i].y) > maximum) {
                    maximum = Math.abs(dataPoints[i].y);
                }
            }
            return Math.ceil(maximum / (toMmUnits / res)) * (toMmUnits / res);
        }

        function destroyCharts(chans) {
            for (let i = 0; i < chans.length; i++) {
                chans[i].chart.destroy();
                const elem = document.getElementById(chans[i].container);
                elem.parentElement.removeChild(elem);
            }
        }

        function renderCharts() {
           // Chart Options, Render

            for (let i = 0; i < channels.length; i++) {

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
                            if (zoomAll) {
                                zoomAllCharts(e.axisX[0].viewportMinimum, e.axisX[0].viewportMaximum, true);
                            } else {
                                e.chart.options.viewportMinStack.push(e.axisX[0].viewportMinimum);
                                e.chart.options.viewportMaxStack.push(e.axisX[0].viewportMaximum);
                            }
                        }
                        if (e.trigger === 'reset') {
                            resetChartViewX(e.chart);
                        }
                    },
                    title: {
                        text: channels[i].station,
                        dockInsidePlotArea: true,
                        fontSize: 12,
                        fontFamily: 'tahoma',
                        fontColor: 'blue',
                        horizontalAlign: 'left'
                    },
                    toolTip: {
                        enabled: showTooltip,
                        contentFormatter: function (e) {
                            const content = ' ' +
                             '<strong>' + e.entries[0].dataPoint.y / toMmUnits + ' mm/s</strong>' +
                             '<br/>' +
                             '<strong>' + e.entries[0].dataPoint.x / toMicro + ' s</strong>';
                            return content;
                        }
                    },
                    axisX: {
                        minimum: 0,
                        maximum: getXmax(i),
                        viewportMinimum: getXvpMin(),
                        viewportMaximum: getXvpMax(),
                        includeZero: true,
                        labelAutoFit: false,
                        labelWrap: false,
                        labelFormatter: function(e) {
                            if (e.value === 0) {
                                return zeroTime.toISOString().split('.')[0].replace('T', ' ');
                            } else {
                                return  e.value / toMicro + ' s' ;
                            }
                        },
                        stripLines: channels[i].picks
                    },
                    axisY: {
                        minimum: -getYmax(i),
                        maximum: getYmax(i),
                        includeZero: true,
                        labelFormatter: function(e) {
                            if (e.value === 0) {
                                return  '0 mm/s';
                            } else {
                                return  e.value / toMmUnits;
                            }
                        }
                    },
                    data: [
                        {
                            type: 'line',
                            lineColor: 'black',
                            lineThickness: 1,
                            highlightEnabled: true,
                            dataPoints: channels[i].data
                        }
                    ]
                };
                channels[i].chart = new CanvasJS.Chart(channels[i].container, options);
                channels[i].chart.render();
            }
            console.log(channels.length + ' total channels');
        }

        function addListeners() {
            for (let j = 0; j < channels.length; j++) {
                const canvas_chart = '#' + channels[j].container + ' > .canvasjs-chart-container > .canvasjs-chart-canvas';
                // Drag picks
                $(canvas_chart).last().on('mousedown', function(e) {
                    lastDownTarget = e.target;

                    if (!($(e.target).parents('.menu').length > 0)) {
                        if (menuVisible) {
                            selectedContextMenu = -1;
                            toggleMenu('hide');
                            return;
                        }
                    }
                    const ind = parseInt($(this).parent().parent()[0].id.replace('Container', ''), 10);
                    const chart = channels[ind].chart;
                    const parentOffset = $(this).parent().offset();
                    const relX = e.pageX - parentOffset.left;
                    const relY = e.pageY - parentOffset.top;
                    if (e.button === 0) {  // drag active on left mouse button only
                        // Get the selected stripLine & change the cursor
                        for (let i = 0; i < chart.axisX[0].stripLines.length; i++) {
                            if (chart.axisX[0].stripLines[i].get('bounds')) {
                                if (relX > chart.axisX[0].stripLines[i].get('bounds').x1 - snapDistance &&
                                 relX < chart.axisX[0].stripLines[i].get('bounds').x2 + snapDistance &&
                                 relY > chart.axisX[0].stripLines[i].get('bounds').y1 &&
                                 relY < chart.axisX[0].stripLines[i].get('bounds').y2) {
                                    if (e.ctrlKey) {  // remove pick
                                        const selLine = chart.options.axisX.stripLines[i];
                                        deletePicks(ind, selLine.label, selLine.value);
                                    } else {  // move pick
                                        selected = i;
                                        $(this).addClass('pointerClass');
                                    }
                                    break;
                                }
                            }
                        }
                    } else if (e.button === 1) {  // add new P or S
                            if (e.ctrlKey) {  // add new P on Ctrl + center mouse button click
                                addPick(ind, 'P', chart.axisX[0].convertPixelToValue(relX));
                            } else if (e.shiftKey) {   // add new S pick on Shift + center mouse button click
                                addPick(ind, 'S', chart.axisX[0].convertPixelToValue(relX));
                            }
                    } else if (e.button === 2) {  // save position on right mouse button, context menu
                        lastSelectedXPosition = chart.axisX[0].convertPixelToValue(relX);
                    }
                });

                $(canvas_chart).last().on('mousemove', function(e) {  // move selected stripLine
                    if (selected !== -1) {
                        const i = parseInt( $(this).parent().parent()[0].id.replace('Container', ''), 10);
                        const chart = channels[i].chart;
                        const parentOffset = $(this).parent().offset();
                        const relX = e.pageX - parentOffset.left;
                        chart.options.axisX.stripLines[selected].value = chart.axisX[0].convertPixelToValue(relX);
                        chart.options.zoomEnabled = false;
                        chart.render();
                    }
                });

                $(canvas_chart).last().on('mouseup', function(e) {
                    if (selected !== -1) {   // clear selection and change the cursor
                        selected = -1;
                        $(this).removeClass('pointerClass');
                        // let i = parseInt( $(this).parent()[0].id.replace('Container',''));
                        const i = parseInt($(this).parent().parent()[0].id.replace('Container', ''), 10);
                        const chart = channels[i].chart;
                        chart.options.zoomEnabled = true;   // turn zoom back on
                        // document.getElementById(channels[i].button).style.display = 'inline';
                        chart.render();
                    }
                });

                // Zoom: on mouse wheel event zoom on Y axis if Ctrl key is pressed, or on X axis if Shift key pressed
                $(canvas_chart)[1].addEventListener('wheel', function(e) {
                    if (e.ctrlKey || e.shiftKey || e.altKey) {

                        e.preventDefault();

                        const i = parseInt($(this).parent().parent()[0].id.replace('Container', ''), 10);
                        const chart = channels[i].chart;

                        const relOffsetY = e.clientY - pageOffsetY - i * environment.chartHeight;

                        if (e.clientX < chart.plotArea.x1 ||
                         e.clientX > chart.plotArea.x2 ||
                         relOffsetY < chart.plotArea.y1 ||
                         relOffsetY > chart.plotArea.y2) {
                            return;
                        }

                        const axis = (e.shiftKey || e.altKey) ? chart.axisX[0] : e.ctrlKey ? chart.axisY[0] : null;

                        const viewportMin = axis.get('viewportMinimum'),
                            viewportMax = axis.get('viewportMaximum'),
                            interval = (viewportMax - viewportMin) / zoomSteps;  // control zoom step
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
                            if (zoomAll) {
                                zoomAllCharts(newViewportMin, newViewportMax, e.shiftKey || e.altKey);
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

                $('#' + channels[j].container).on('contextmenu', e => {
                      e.preventDefault();
                      const origin = {
                        left: e.pageX,
                        top: e.pageY
                      };
                      setPosition(origin);
                      selectedContextMenu = j;
                      return false;
                });

            }
        }

        $('#commonAmplitude').on('click', () => {
            commonAmplitude = !commonAmplitude;
            $(this).toggleClass('active');
            resetAllChartsViewY();
        });

        $('#commonTime').on('click', () => {
            commonTimeState = !commonTimeState;
            $(this).toggleClass('active');
            resetAllChartsViewX();
        });

        document.addEventListener('keydown', e => {
            if (e.keyCode === 90) {
                toggleCommonTime();
            }
            if (e.keyCode === 88) {
                toggleCommonAmplitude();
            }
        },
        false);

        $('#showTooltip').on('click', () => {
            showTooltip = !showTooltip;
            $(this).toggleClass('active');
            for (let i = 0; i < channels.length; i++) {
                toggleTooltip(i, showTooltip);
            }
        });

        $('#showHelp').on('click', () => {
            showHelp = !showHelp;
            $(this).toggleClass('active');
        });

        $('#zoomAll').on('click', () => {
            zoomAll = !zoomAll;
            $(this).toggleClass('active');
        });

        $('#resetAll').on('click', () => {
            resetAllChartsViewXY();
        });

        $('#backBtn').on('click', () => {
            back();
        });

        // If the context menu element is clicked
        $('.menu li').click(function() {
            if (selectedContextMenu !== -1) {
                // This is the triggered action name
                const action = $(this).attr('data-action');
                switch (action) {

                    // A case for each action. Your actions here
                    case 'deleteP': deletePicks(selectedContextMenu, 'P', null); break;
                    case 'deleteS': deletePicks(selectedContextMenu, 'S', null); break;
                    case 'newP': addPick(selectedContextMenu, 'P', null); break;
                    case 'newS': addPick(selectedContextMenu, 'S', null); break;
                    case 'showTooltip': toggleTooltip(selectedContextMenu, null); break;
                    default: break;
                }
            }

            // Hide it AFTER the action was triggered
            selectedContextMenu = -1;
            toggleMenu('hide');
        });

        function toggleCommonTime() {
            commonTimeState = !commonTimeState;
            if (commonTimeState) {
                $('#commonTime').addClass('active');
                $('#commonTime')[0].setAttribute('aria-pressed', 'true');
            } else {
                $('#commonTime').removeClass('active focus');
                $('#commonTime')[0].setAttribute('aria-pressed', 'false');
            }
            resetAllChartsViewX();
        }

        function toggleCommonAmplitude() {
            commonAmplitude = !commonAmplitude;
            if (commonAmplitude) {
                $('#commonAmplitude').addClass('active');
                $('#commonAmplitude')[0].setAttribute('aria-pressed', 'true');
            } else {
                $('#commonAmplitude').removeClass('active focus');
                $('#commonAmplitude')[0].setAttribute('aria-pressed', 'false');
            }
            resetAllChartsViewY();
        }

        function updateZoomStackCharts(vpMin, vpMax) {
            for (let i = 0; i < channels.length; i++) {
                const chart = channels[i].chart;
                if (!chart.options.viewportMinStack) {
                    chart.options.viewportMinStack = [];
                    chart.options.viewportMaxStack = [];
                }
                chart.options.viewportMinStack.push(vpMin);
                chart.options.viewportMaxStack.push(vpMax);
            }
        }

        function resetAllChartsViewX() {
            for (let i = 0; i < channels.length; i++) {
                resetChartViewX(channels[i].chart);
            }
        }

        function resetAllChartsViewY() {
            for (let i = 0; i < channels.length; i++) {
                resetChartViewY(channels[i].chart);
            }
        }

        function resetAllChartsViewXY() {
            for (let i = 0; i < channels.length; i++) {
                resetChartViewXY(channels[i].chart);
            }
        }

        function resetChartViewX(chart) {
            const channel = parseInt( chart.container.id.replace('Container', ''), 10);
            chart.options.axisX.viewportMinimum = getXvpMin();
            chart.options.axisX.viewportMaximum = getXvpMax();
            chart.options.axisX.minimum = 0;
            chart.options.axisX.maximum = getXmax(channel);
            chart.options.viewportMinStack = [];
            chart.options.viewportMaxStack = [];
            chart.render();
        }

        function resetChartViewY(chart) {
            const channel = parseInt( chart.container.id.replace('Container', ''), 10);
            chart.options.axisY.viewportMinimum = null;
            chart.options.axisY.viewportMaximum = null;
            chart.options.axisY.minimum = -getYmax(channel);
            chart.options.axisY.maximum = getYmax(channel);
            chart.render();
        }

        function resetChartViewXY(chart) {
            const channel = parseInt( chart.container.id.replace('Container', ''), 10);
            chart.options.axisX.viewportMinimum = getXvpMin();
            chart.options.axisX.viewportMaximum = getXvpMax();
            chart.options.axisX.minimum = 0;
            chart.options.axisX.maximum = getXmax(channel);
            chart.options.viewportMinStack = [];
            chart.options.viewportMaxStack = [];
            chart.options.axisY.viewportMinimum = null;
            chart.options.axisY.viewportMaximum = null;
            chart.options.axisY.minimum = -getYmax(channel);
            chart.options.axisY.maximum = getYmax(channel);
            chart.render();
        }

        function getXmax(pos) {
            return commonTimeState ? Math.max(channels[pos].duration, initialDuration) :  channels[pos].duration;
        }

        function getXvpMax() {
            return commonTimeState ? initialDuration : null;
        }

        function getXvpMin() {
            return commonTimeState ? 0 : null;
        }

        function getValueMaxAll() {
            let val;
            for (let i = 0; i < channels.length; i++) {
                val = i === 0 ? maxValue(channels[0].data, null) : Math.max(maxValue(channels[i].data, null), val);
            }
            return val;
        }

        function getYmax(channel) {
            return commonAmplitude ?  getValueMaxAll() : maxValue(channels[channel].data, 100);
        }

        function getAxisMinAll(isXaxis) {
            let min;
            for (let i = 0; i < channels.length; i++) {
                const chart = channels[i].chart;
                const axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
                min = i === 0 ? axis.get('minimum') : Math.min(axis.get('minimum'), min);
            }
            return min;
        }

        function getAxisMaxAll(isXaxis) {
            let max;
            for (let i = 0; i < channels.length; i++) {
                const chart = channels[i].chart;
                const axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
                max = i === 0 ? axis.get('maximum') : Math.max(axis.get('maximum'), max);
            }
            return max;
        }

        function zoomAllCharts(vpMin, vpMax, isXaxis) {
            updateZoomStackCharts(vpMin, vpMax);
            if (vpMin >= getAxisMinAll(isXaxis) && vpMax <= getAxisMaxAll(isXaxis)) {
                for (let i = 0; i < channels.length; i++) {
                    const chart = channels[i].chart;
                    const axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
                    axis.set('viewportMinimum', vpMin, false);
                    axis.set('viewportMaximum', vpMax);
                    chart.render();
                }
            }
        }

        function addPick(ind, pickType, value) {
            const chart = channels[ind].chart;
            const position = value ? value : lastSelectedXPosition;
            channels[ind].picks.push({
                value: position,
                thickness: 2,
                color: pickType === 'P' ? 'red' : pickType === 'S' ? 'blue' : 'black',
                label: pickType,
                labelAlign: 'far'
            });
            chart.options.axisX.stripLines = channels[ind].picks;
            chart.render();
        }

        function deletePicks(ind, pickType, value) {
            const chart = channels[ind].chart;
            if (value) {
                channels[ind].picks = channels[ind].picks
                .filter( el => el.label !== pickType || el.label === pickType && el.value !== value);
            } else {  // no value specified delete all picks of this type
                channels[ind].picks = channels[ind].picks.filter( el => el.label !== pickType);
            }
            chart.options.axisX.stripLines = channels[ind].picks;
            chart.render();
        }

        function toggleTooltip(ind, value) {
            value = value ? value : !channels[ind].chart.options.toolTip.enabled;
            channels[ind].chart.options.toolTip.enabled = value;
            channels[ind].chart.render();
        }

        function back() {
            for (let j = 0; j < channels.length; j++) {
                const canvas_chart = '#' + channels[j].container +
                    ' > .canvasjs-chart-container' + ' > .canvasjs-chart-canvas';
                if (zoomAll || lastDownTarget === $(canvas_chart)[1]) {
                    const chart = channels[j].chart;
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
                        resetChartViewX(chart);
                    }
                    if (!zoomAll) {
                        break;
                    }
                }
            }
        }

        function addPickData(pickType, data, obj) {
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
        }

        function getEventInfo(event) {
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
        }

        function getEvent(event): any {
            return new Promise(resolve => {
                const mshr = new XMLHttpRequest();
                mshr.open('GET', event.waveform_file, true);
                mshr.responseType = 'arraybuffer';
                mshr.onreadystatechange = () => {
                    if (mshr.readyState === mshr.DONE) {
                        if (mshr.status === 200)  {
                            const records = miniseed.parseDataRecords(mshr.response);
                            const channelsMap = miniseed.byChannel(records);
                            const chans = [];
                            let i = 0;
                            let zTime = null;
                            const eventData = {};
                            let sampleRate = 0;
                            let rescan = false;
                            const divStyle = 'height: ' + environment.chartHeight + 'px; max-width: 2000px; margin: 0px auto;';
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
                                    addPickData('P', sg, chans[i]);
                                    addPickData('S', sg, chans[i]);
                                    chans[i].container = i.toString() + 'Container';

                                    if ( $('#' + chans[i].container).length === 0 ) {
                                        $('<div>').attr({
                                            'id': chans[i].container,
                                            'style': divStyle
                                        }).appendTo('#waveform-panel');
                                    }
                                    if (i > 60) {
                                        return false;
                                    }
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
                            resolve(eventData);
                        } else {
                            console.log('Error getting miniseed', mshr.statusText);
                        }
                    }
                };
                mshr.send();
            });
        }

    }

}
