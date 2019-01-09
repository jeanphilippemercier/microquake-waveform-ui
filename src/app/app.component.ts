/*jshint esversion: 6 */
import { Component, ViewChild, OnInit } from '@angular/core';
import * as $ from 'jquery';
import * as CanvasJS from './canvasjs.min';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
    title = 'waveform-ui-angular';

    ngOnInit() {
        const channels = [];
        const startTime = new Date();
        let totalPoints = 0;
        let commonScaleX = true;
        let commonScaleY = false;
        let showTooltip = false;
        let showHelp = false;
        let zoomY = false;
        let zoomAll = false;
        const toMicro = 1000000;  // seconds to microseconds factor
        const toMmUnits = 10000000;  // factor to convert input units (m/1e10) to mmm
        const initialDuration = toMicro;  // time window to display in microseconds (1 second)
        let selected = -1;
        let selectedContextMenu = -1;
        let lastSelectedXPosition = -1;
        let lastDownTarget;  // last mouse down selection
        const zoomSteps = 5;    // for wheel mouse zoom
        const pageOffsetY = 40;
        const chartHeight = 120; // height of each chart in pixels
        const divStyle = 'height: ' + chartHeight + 'px; max-width: 2000px; margin: 0px auto;';
        const snapDistance = 10;

        const menu = document.querySelector('.menu');
        let menuVisible = false;

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

        $.getJSON('./assets/data.json', function(json) {
            const delta = 1000000 / json.rate;  // sample interval in microseconds
            const timeScaleOrigin = getEarliestTime(json);

            let index = 0;
            for (const key in json) {
                if ( typeof json[key] === 'object' && json[key].hasOwnProperty('data') && json[key].hasOwnProperty('start')) {
                    channels[index] = {};
                    channels[index].station = key;
                    channels[index].start = json[key].start;

                    const datesplit = json[key].start.split('.');
                    const traceStartTime = new Date(datesplit[0] + 'Z');  // UTC
                    const microsec = parseInt(datesplit[1], 10) +
                     (traceStartTime === timeScaleOrigin.time ? 0 : (traceStartTime.getTime() - timeScaleOrigin.time.getTime()) * 1000);

                    channels[index].container = index.toString() + 'Container';

                    if ( $('#' + channels[index].container).length === 0 ) {
                        $('<div>').attr({
                            'id': channels[index].container,
                            'style': divStyle
                        }).appendTo('#waveform-panel');
                    }

                    channels[index].data = [];
                    for (let k = 0; k < json[key].data.length; k++) {
                        channels[index].data.push({
                            x: microsec + (k * delta),
                            y: json[key].data[k]
                        });
                    }
                    channels[index].duration = (channels[index].data.length - 1) * delta;
                    addPickData('P', json[key], channels[index]);
                    addPickData('S', json[key], channels[index]);
                    index ++;
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
                            value: parseInt(datesplit[1], 10) +
                             (pickTime === timeScaleOrigin.time ? 0 : (pickTime.getTime() - timeScaleOrigin.time.getTime()) * 1000),
                            thickness: 2,
                            color: pickKey === 'p-pick' ? 'blue' : pickKey === 's-pick' ? 'red' : 'black',
                            label: pickType,
                            labelAlign: 'far'
                        });
                    }
                }
            }

            function getEarliestTime(data) {
                let label;
                let earliest = new Date();
                for (const key in data) {
                    if ( typeof data[key] === 'object' && data[key].hasOwnProperty('start')) {
                        const start = new Date(data[key].start.split('.')[0] + 'Z');  // UTC
                        if (start.getTime() < earliest.getTime()) {
                            earliest = start;
                            label = data[key].start.split('.')[0].replace('T', ' ');
                        }
                    }
                }
                return {label: label, time: earliest};
            }

            // Chart Options, Render
            for (let i = 0; i < channels.length; i++) {
                const options = {
                    zoomEnabled: true,
                    zoomType: zoomY ? 'xy' : 'x',
                    animationEnabled: true,
                    rangeChanged: function(e) {
                        if (!e.chart.options.viewportMinStack) {
                            e.chart.options.viewportMinStack = [];
                            e.chart.options.viewportMaxStack = [];
                        }
                        if (e.trigger === 'zoom') {
                            if (zoomAll && !zoomY) {
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
                                return timeScaleOrigin.label;
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
                totalPoints += channels[i].data.length;
            }

            $('#changeTimeScale').on('click', function () {
                commonScaleX = !commonScaleX;
                $(this).toggleClass('active');
                resetAllChartsViewX();
            });

            $('#changeAmplitudeScale').on('click', function () {
                commonScaleY = !commonScaleY;
                $(this).toggleClass('active');
                resetAllChartsViewY();
            });

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

            function getXmax(channel) {
                return commonScaleX ? Math.max(channels[channel].duration, initialDuration) :  channels[channel].duration;
            }

            function getXvpMax() {
                return commonScaleX ? initialDuration : null;
            }

            function getXvpMin() {
                return commonScaleX ? 0 : null;
            }

            function getValueMaxAll() {
                let val;
                for (let i = 0; i < channels.length; i++) {
                    val = i === 0 ? maxValue(channels[0].data, null) : Math.max(maxValue(channels[i].data, null), val);
                }
                return val;
            }

            function getYmax(channel) {
                return commonScaleY ?  getValueMaxAll() : maxValue(channels[channel].data, 100);
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

            $('#showTooltip').on('click', function () {
                showTooltip = !showTooltip;
                $(this).toggleClass('active');
                for (let i = 0; i < channels.length; i++) {
                    toggleTooltip(i, showTooltip);
                }
            });

            $('#showHelp').on('click', function () {
                showHelp = !showHelp;
                $(this).toggleClass('active');
            });

            $('#zoomAll').on('click', function () {
                zoomAll = !zoomAll;
                $(this).toggleClass('active');
            });

            $('#zoomMode').on('click', function () {
                zoomY = !zoomY;
                $(this).toggleClass('active');
                for (let i = 0; i < channels.length; i++) {
                    channels[i].chart.options.zoomType = zoomY ? 'xy' : 'x';
                    channels[i].chart.render();
                }
            });

            $('#resetAll').on('click', function () {
                resetAllChartsViewXY();
            });

            $('#backBtn').on('click', function () {
                back();
            });

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

/*
            document.addEventListener('keydown', function(e) {
                if (e.keyCode === 37 ||
                    e.keyCode === 38 ||
                    e.keyCode === 39 ||
                    e.keyCode === 40) {
                    e.preventDefault();
                    for (let j = 0; j < channels.length; j++) {
                        const canvas_chart = '#' + channels[j].container +
                            ' > .canvasjs-chart-container > .canvasjs-chart-canvas';
                        if (lastDownTarget === $(canvas_chart)[1]) {

                            const chart = channels[j].chart;

                            const axis = e.shiftKey ? chart.axisX[0] : e.ctrlKey ? chart.axisY[0] : null;
                            const viewportMin = axis.get('viewportMinimum'),
                                viewportMax = axis.get('viewportMaximum'),
                                interval = (viewportMax - viewportMin) / zoomSteps;  // control zoom step
                                // interval = (axis.get('maximum') - axis.get('minimum'))/zoomSteps;
                            let newViewportMin, newViewportMax;

                            if (e.keyCode === 38) {// up arrow
                                newViewportMin = viewportMin + interval;
                                newViewportMax = viewportMax - interval;
                            } else if (e.keyCode === 40) {// down arrow
                                newViewportMin = viewportMin - interval;
                                newViewportMax = viewportMax + interval;
                            } else if (e.keyCode === 37) {// left arrow
                                newViewportMin = viewportMin - interval;
                                newViewportMax = viewportMax - interval;
                            } else if (e.keyCode === 39) {// right arrow
                                newViewportMin = viewportMin + interval;
                                newViewportMax = viewportMax + interval;
                            }

                            if ((newViewportMax - newViewportMin) > (2 * interval)) {
                                if (zoomAll) {
                                    zoomAllCharts(newViewportMin, newViewportMax, e.shiftKey);
                                } else {
                                    if (newViewportMin >= axis.get('minimum') && newViewportMax <= axis.get('maximum')) {
                                        axis.set('viewportMinimum', newViewportMin, false);
                                        axis.set('viewportMaximum', newViewportMax);
                                        chart.render();
                                    }
                                }
                            }
                            break;
                        }
                    }
                }
            },
            false);
*/
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

                $(canvas_chart).last().on('mouseup', function() {
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

                        const relOffsetY = e.clientY - pageOffsetY - i * chartHeight;

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

                $('#' + channels[j].container).on('contextmenu', function(e) {
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

            // If the context menu element is clicked
            $('.menu li').click(function() {
                if (selectedContextMenu !== -1) {
                    // This is the triggered action name
                    switch ($(this).attr('data-action')) {

                        // A case for each action. Your actions here
                        case 'deleteP': deletePicks(selectedContextMenu, 'P', null); break;
                        case 'deleteS': deletePicks(selectedContextMenu, 'S', null); break;
                        case 'newP': addPick(selectedContextMenu, 'P', null); break;
                        case 'newS': addPick(selectedContextMenu, 'S', null); break;
                        case 'showTooltip': toggleTooltip(selectedContextMenu, null); break;
                    }
                }

                // Hide it AFTER the action was triggered
                selectedContextMenu = -1;
                toggleMenu('hide');
            });

            const endTime = new Date();
            // document.getElementById('timeToRender').innerHTML = 'Render Time: ' + (endTime - startTime) + 'ms';

            console.log(channels.length + ' total channels');
            console.log(totalPoints + ' total data points');
        });

    }
}
