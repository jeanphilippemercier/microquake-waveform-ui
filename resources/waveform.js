var jsondata;
var channelsObjs = [];

window.onload = function () {

	var startTime = new Date();
	var totalPoints = 0;
	var sameScale = true;
	var showTooltip = false;
	var zoomY = false;
	var zoomAll = false;
	toMicro = 1000000;  // seconds to microseconds factor
	toMmUnits = 10000000;  // factor to convert input units (m/1e10) to mmm
	initialDuration = 1 * toMicro;  // same scale time window to display in microseconds (1 second)
	var selected = -1;
	var lastSelectedXPosition = -1;
	var lastDownTarget = -1;  // last mouse down selection
	var zoomSteps = 20; 	// for wheel mouse zoom
	var pageOffsetY = 80; // due to toolbars, etc
	var chartHeight = 120; // height of each chart in pixels

	var maxValue = function(dataPoints) {
	  var maximum = Math.abs(dataPoints[0].y);
	  for (i = 0; i < dataPoints.length; i++) {
	    if (Math.abs(dataPoints[i].y) > maximum) {
	      maximum = Math.abs(dataPoints[i].y);
	    }
	  }
	  return Math.ceil(maximum/(toMmUnits/10))*(toMmUnits/10);
	};

/*
	$('#user-toolbar').toolbar({
		content: '#user-toolbar-options', 
		position: 'right',
		style: 'primary'
	});
*/

	$.getJSON("data/data.json", function(json) {
	    jsondata = json;
	    var delta = 1000000./json.rate;
	    origin = new Date();
	    index = 0;
	    divStyle= "height: "+ chartHeight + "px; max-width: 920px; margin: 0px auto;";

		for (key in json)
	    {
	    	if(typeof json[key] == "object") {
		    	traceOrigin = new Date(json[key].start.split('.')[0] + "Z");  // +"Z" to UTC
		    	if(traceOrigin.getTime() < origin.getTime()) {
		    		origin = traceOrigin;
		    		firstLabel = json[key].start.split('.')[0].replace('T',' ');
		    	}
	    	}
	    }

// Load data and picks to channelObj
		for (key in json)
	    {
	    	if(typeof json[key] == "object") {

	    		channelsObjs[index]={};
	    		channelsObjs[index].station=key;
	    		datesplit = json[key].start.split('.');
	    		channelsObjs[index].start=json[key].start;
	    		traceOrigin = new Date(datesplit[0] + "Z");  // +"Z" to UTC
	    		microsec = parseInt(datesplit[1]);
	    		microsec = microsec + (traceOrigin.getTime() - origin.getTime())*1000;

	    		channelsObjs[index].container=index + "Container";
	    		// channelsObjs[index].button=channelsObjs[index].container + "Btn";
				$("<div>").attr({
	    			'id': channelsObjs[index].container,
	    			'style': divStyle
				}).appendTo("body");

				channelsObjs[index].data=[];
		    	for (var i = 0; i < json[key].data.length; i++) {
		    		channelsObjs[index].data.push({
		    			x: microsec + (i * delta),
		    			y: json[key].data[i]
		    		});
		    	}
		    	channelsObjs[index].duration = (channelsObjs[index].data.length - 1) * delta;

		    	channelsObjs[index].picks=[];
		    	if(json[key].hasOwnProperty("p-pick")) {
		    		datesplit = json[key]["p-pick"].split('.');
					pickTime = new Date(datesplit[0] + "Z");  // to UTC
					pickMicro = parseInt(datesplit[1]);
					pickTimeDiff = (pickTime.getTime()-origin.getTime());
		    		channelsObjs[index].picks.push({
		    			value: pickMicro + pickTimeDiff*1000,
		    			thickness: 2,
		    			color: "red",
		    			label: "P",
		    			labelAlign: "far"
		    		});
		    	}
		    	if(json[key].hasOwnProperty("s-pick")) {
		    		datesplit = json[key]["s-pick"].split('.');
					pickTime = new Date(datesplit[0] + "Z");  // to UTC
					pickMicro = parseInt(datesplit[1]);
					pickTimeDiff = (pickTime.getTime()-origin.getTime());
		    		channelsObjs[index].picks.push({
		    			value: pickMicro + pickTimeDiff*1000,
		    			thickness: 2,
		    			color: "blue",
		    			label: "S",
		    			labelAlign: "far"
		    		});
		    	}
		    	index ++;
	    	}
	    }

// Chart Options, Render
	    var options;
	    for (var i = 0; i < index; i++) {
			options = {
				zoomEnabled: true,
				zoomType: zoomY ? "xy" : "x",
				animationEnabled: true,
		      	rangeChanged: function(e){
		        	if (!e.chart.options.viewportMinStack){
						e.chart.options.viewportMinStack = [];
						e.chart.options.viewportMaxStack = [];
		        	}
					if(e.trigger === "zoom"){
		        		if(zoomAll && !zoomY) {
							zoomAllCharts(e.axisX[0].viewportMinimum, e.axisX[0].viewportMaximum, true);
		        		}
		        		else {
		        			e.chart.options.viewportMinStack.push(e.axisX[0].viewportMinimum);
		        			e.chart.options.viewportMaxStack.push(e.axisX[0].viewportMaximum);
		        		}
		        	}
		        	if(e.trigger === "reset"){
		        		resetChartView(e.chart);
		        		e.chart.options.viewportMinStack=[];
		         		e.chart.options.viewportMaxStack=[];
		        	}
		      	},
				title: {
					text: channelsObjs[i].station,
					dockInsidePlotArea: true,
					fontSize: 12,
					fontFamily: "tahoma",
					fontColor: "blue",
					horizontalAlign: "left"
				},
				toolTip: {
					enabled: showTooltip,
					contentFormatter: function (e) {
						var content = " ";
						content += "<strong>" + e.entries[0].dataPoint.y/toMmUnits + " mm/s</strong>";
						content += "<br/>";
						content += "<strong>" + e.entries[0].dataPoint.x/toMicro + " s</strong>";
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
					labelFormatter: function(e){
						if(e.value ==0) {
							return firstLabel;
						}
						else {
							return  e.value/toMicro +" s" ;
						}
					},
					stripLines: channelsObjs[i].picks
				},
				axisY: {
					minimum: -getYmax(i),
					maximum: getYmax(i),
					includeZero: true,
					labelFormatter: function(e){
						if(e.value == 0) {
							return  "0 mm/s";
						}
						else {
							return  e.value/toMmUnits;
						}
					}
				},
				data: [
					{
						type: "line",
						lineColor: "black",
						lineThickness: 1,
						highlightEnabled: true,
						dataPoints: channelsObjs[i].data
					}
				]
			};

			channelsObjs[i].chart = new CanvasJS.Chart(channelsObjs[i].container, options);
			channelsObjs[i].chart.render();
			totalPoints += channelsObjs[i].data.length;

/* 			// Add back button to toolbar
			toolbar = document.getElementsByClassName("canvasjs-chart-toolbar")[i];
			$("<button>").attr({
	    		'id': channelsObjs[i].button,
	    		'class': "btn-back"
			}).html('\u21e6').appendTo(toolbar);
			button = document.getElementById( channelsObjs[i].button);
			button.addEventListener( "click", back);
*/
	    }

		$("#changeTimeScale").click(function () {
			sameScale = !sameScale;
			$(this).button('toggle');
			$(this).toggleClass('active');
			resetChartsView();
			// $("#changeTimeScale")[0].innerHTML = sameScale ? "Full Time Scale" : "Same Time Scale";
		});

		function resetCharts() {
			for (var i = 0; i < index; i++) {
				chart = channelsObjs[i].chart;
				chart.options.axisX.viewportMinimum = null;
				chart.options.axisX.viewportMaximum = null;
				chart.options.axisY.viewportMinimum = null;
				chart.options.axisY.viewportMaximum = null;
				chart.options.viewportMinStack=[];
				chart.options.viewportMaxStack=[];
				// document.getElementById(channelsObjs[i].button).style.display = "none";
				chart.render();
			}
		}

		function updateZoomStackCharts(vpMin, vpMax) {
			for (var i = 0; i < index; i++) {
				chart = channelsObjs[i].chart;
	        	if (!chart.options.viewportMinStack){
					chart.options.viewportMinStack = [];
					chart.options.viewportMaxStack = [];
	        	}
	        	chart.options.viewportMinStack.push(vpMin);
		        chart.options.viewportMaxStack.push(vpMax);
			}

		}

		function clearZoomStackCharts(vpMin, vpMax) {
			for (var i = 0; i < index; i++) {
				chart = channelsObjs[i].chart;
				chart.options.viewportMinStack = [];
				chart.options.viewportMaxStack = [];
			}

		}

		function resetChartsView() {
			for (var i = 0; i < index; i++) {
				resetChartView(channelsObjs[i].chart);
			}
		}

		function resetChartView(chart) {
			var channel = parseInt( chart.container.id.replace("Container",""));
			chart.options.axisX.viewportMinimum = getXvpMin();
			chart.options.axisX.viewportMaximum = getXvpMax();
			chart.options.axisX.minimum = 0;
			chart.options.axisX.maximum = getXmax(channel);
			chart.options.axisY.viewportMinimum = null;
			chart.options.axisY.viewportMaximum = null;
			chart.options.axisY.minimum = -getYmax(channel);
			chart.options.axisY.maximum = getYmax(channel);
			// document.getElementById(channelsObjs[channel].button).style.display = getXvpMax() == null ? "none" : "inline";
			chart.render();
		}

		function getXmax(channel) {
			return sameScale ? Math.max(((channelsObjs[channel].data.length - 1) * delta, initialDuration)) : channelsObjs[channel].duration;
		}

		function getXvpMax() {
			return sameScale ? initialDuration : null;
		}

		function getXvpMin() {
			return sameScale ? 0 : null;
		}

		function getValueMaxAll() {
			for (var i = 0; i < index; i++) {
				max = i==0 ? maxValue(channelsObjs[0].data) : Math.max(maxValue(channelsObjs[i].data), max);
			}
			return max;
		}

		function getYmax(channel) {
			return sameScale ? getValueMaxAll() : maxValue(channelsObjs[channel].data);
		}


		function getAxisMinAll(isXaxis) {
			for (var i = 0; i < index; i++) {
				chart = channelsObjs[i].chart;
				axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
				min = i==0 ? axis.get("minimum") : Math.min(axis.get("minimum"), min);
			}
			return min;
		}

		function getAxisMaxAll(isXaxis) {
			for (var i = 0; i < index; i++) {
				chart = channelsObjs[i].chart;
				axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
				max = i==0 ? axis.get("maximum") : Math.max(axis.get("maximum"), max);
			}
			return max;
		}

		function zoomAllCharts(vpMin, vpMax, isXaxis) {
			updateZoomStackCharts(vpMin, vpMax);
			var axisMin = getAxisMinAll(isXaxis);
			var axisMax = getAxisMaxAll(isXaxis);
		  	if(vpMin >= axisMin && vpMax <= axisMax){
				for (var i = 0; i < index; i++) {
					chart = channelsObjs[i].chart;
					axis = isXaxis ? chart.axisX[0] : chart.axisY[0];
					zoomChartView(axis, vpMin, vpMax);
				}
		  	}
		}

		function zoomChartView(axis, vpMin, vpMax) {

		    axis.set("viewportMinimum", vpMin, false);
		    axis.set("viewportMaximum", vpMax);
		    chart.render();

		}


		function addPick(chartIndex, pickType, value) {
			var chart = channelsObjs[chartIndex].chart;
			var position = value ? value : lastSelectedXPosition;
    		channelsObjs[chartIndex].picks.push({
    			value: position,
    			thickness: 2,
    			color: pickType == 'P' ? "red" : pickType == 'S' ? "blue" : "black",
    			label: pickType,
    			labelAlign: "far"
    		});
			chart.options.axisX.stripLines = channelsObjs[chartIndex].picks;
			chart.render();
		}

		function deletePicks(chartIndex, pickType, value) {
			var chart = channelsObjs[chartIndex].chart;
			if(value) {
				channelsObjs[chartIndex].picks = channelsObjs[chartIndex].picks.filter( el => el.label !== pickType || el.label == pickType && el.value !== value);
			}
			else {  // no value specified delete all picks of this type
				channelsObjs[chartIndex].picks = channelsObjs[chartIndex].picks.filter( el => el.label !== pickType);
			}
			chart.options.axisX.stripLines = channelsObjs[chartIndex].picks;
			chart.render();
		}

		$("#showTooltip").click(function () {
			showTooltip = !showTooltip;
			$(this).button('toggle');
			$(this).toggleClass('active');
			// $("#showTooltip")[0].innerHTML = showTooltip ? "Hide Tooltip" : "Show Tooltip";
			for (var i = 0; i < index; i++) {
				channelsObjs[i].chart.options.toolTip.enabled = showTooltip;
				channelsObjs[i].chart.render();
			}
		});

		$("#zoomAll").click(function () {
			zoomAll = !zoomAll;
    		$(this).button('toggle');
    		$(this).toggleClass('active');
			// $("#zoomAll")[0].innerHTML = zoomAll ? "Zoom Selected" : "Zoom All";
		});

		$("#zoomMode").click(function () {
			zoomY = !zoomY;
			$(this).button('toggle');
			$(this).toggleClass('active');
			for (var i = 0; i < index; i++) {
				channelsObjs[i].chart.options.zoomType = zoomY ? "xy" : "x"
				channelsObjs[i].chart.render();
			}
			// $("#zoomMode")[0].innerHTML = zoomY ? "X Zoom and Pan" : "XY Zoom and Pan";
		});

		$("#resetAll").click(function () {
			$(this).button('toggle');
			// $(this).toggleClass('active');
			resetChartsView();
		});

		$("#backBtn").click(function () {
			back();
		});

		function back(){
			// var i = parseInt(event.target.id.replace("ContainerBtn",""));

			for (var j = 0; j < index; j++) {
				canvas_chart = "#" + channelsObjs[j].container + " > .canvasjs-chart-container" + " > .canvasjs-chart-canvas";
			  	if(	zoomAll ||
			  		lastDownTarget == $(canvas_chart)[1])  // chart with last mouse selection
			  	{
					chart = channelsObjs[j].chart;

					var viewportMinStack = chart.options.viewportMinStack;
				  	var viewportMaxStack = chart.options.viewportMaxStack;
				  	if(!chart.options.axisX){
				  		chart.options.axisX = {};
				  	}
				  	if(viewportMinStack && viewportMinStack.length >= 1){
				      	viewportMinStack.pop();
				      	viewportMaxStack.pop();
				      	chart.options.axisX.viewportMinimum = viewportMinStack[viewportMinStack.length-1];
				      	chart.options.axisX.viewportMaximum = viewportMaxStack[viewportMaxStack.length-1];
				      	chart.render();
				  	}
				  	else{
				      	chart.options.viewportMinStack=[];
				        chart.options.viewportMaxStack=[];
				        resetChartView(chart);
				  	}
				  	if (!zoomAll) 
				  		break;
				}
			}
		}

// Keyboard interaction for Zoom
		document.addEventListener('keydown', function(e) {
			if (e.keyCode == '37' ||
				e.keyCode == '38' ||
				e.keyCode == '39' ||
				e.keyCode == '40')
			{
				e.preventDefault();
				for (var j = 0; j < index; j++) {
					canvas_chart = "#" + channelsObjs[j].container + " > .canvasjs-chart-container" + " > .canvasjs-chart-canvas";
				  	if(lastDownTarget == $(canvas_chart)[1]) {

						chart = channelsObjs[j].chart;

					    var axis = e.altKey ? chart.axisX[0] : chart.axisY[0];
					    var viewportMin = axis.get("viewportMinimum"),
					        viewportMax = axis.get("viewportMaximum"),
					        interval = (axis.get("maximum") - axis.get("minimum"))/zoomSteps;  // control zoom step
					    var newViewportMin, newViewportMax;

					    if (e.keyCode == '38') {// up arrow
					      newViewportMin = viewportMin + interval;
					      newViewportMax = viewportMax - interval;
					    }
					    else if (e.keyCode == '40') {// down arrow
					      newViewportMin = viewportMin - interval;
					      newViewportMax = viewportMax + interval;
					    }
					    else if (e.keyCode == '37') {// left arrow
					      newViewportMin = viewportMin - interval;
					      newViewportMax = viewportMax - interval;
					    }
					    else if (e.keyCode == '39') {// right arrow
					      newViewportMin = viewportMin + interval;
					      newViewportMax = viewportMax + interval;
					    }

					    if ((newViewportMax - newViewportMin) > (2 * interval)) {
						  	if(zoomAll){
						  		zoomAllCharts(newViewportMin, newViewportMax, e.altKey);
						  	}
						  	else {
							    if(newViewportMin >= axis.get("minimum") && newViewportMax <= axis.get("maximum") ){
							      	axis.set("viewportMinimum", newViewportMin, false);
							      	axis.set("viewportMaximum", newViewportMax);
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

// Drag picks
		for (var j = 0; j < index; j++) {
			canvas_chart = "#" + channelsObjs[j].container + " > .canvasjs-chart-container > .canvasjs-chart-canvas";
			$(canvas_chart).last().on("mousedown", function(e) {
				lastDownTarget = e.target;
				var index = parseInt($(this).parent().parent()[0].id.replace("Container",""));
				chart = channelsObjs[index].chart;
			  	var parentOffset = $(this).parent().offset();
			  	var relX = e.pageX - parentOffset.left;
			  	var relY = e.pageY - parentOffset.top;
				if(e.button ==0) {  // drag active on left mouse button only
				  	// Get the selected stripLine & change the cursor
				  	var snapDistance = 10;  // 5 initial
				  	for(var i = 0; i < chart.axisX[0].stripLines.length; i++) {
				  		if(chart.axisX[0].stripLines[i].get("bounds")) {
					    	if(relX > chart.axisX[0].stripLines[i].get("bounds").x1 - snapDistance && relX < chart.axisX[0].stripLines[i].get("bounds").x2 + snapDistance && relY > chart.axisX[0].stripLines[i].get("bounds").y1 && relY < chart.axisX[0].stripLines[i].get("bounds").y2) {
								if(e.ctrlKey) {  // remove pick
									selLine = chart.options.axisX.stripLines[i]
									deletePicks(index, selLine.label, selLine.value);
								}
								else {  // move pick
					      			selected = i;
					      			$(this).addClass('pointerClass');
								}
					      		break;
					    	}
				  		}
				  	}
				}
				else if(e.button ==1) {  // add new P or S
						if(e.ctrlKey) {  // add new P on Ctrl + center mouse button click
							addPick(index,'P', chart.axisX[0].convertPixelToValue(relX));
						}
						else if (e.shiftKey) {   // add new S pick on Shift + center mouse button click
							addPick(index,'S', chart.axisX[0].convertPixelToValue(relX));
						}
				}
				else if(e.button ==2) {  // save position on right mouse button, context menu
    				lastSelectedXPosition = chart.axisX[0].convertPixelToValue(relX);
				}
			});

			$(canvas_chart).last().on("mousemove", function(e) {  // move selected stripLine
			  	if(selected !== -1) {
					var i = parseInt( $(this).parent().parent()[0].id.replace("Container",""));
					chart = channelsObjs[i].chart;
			    	var parentOffset = $(this).parent().offset();
			    	var relX = e.pageX - parentOffset.left;
			    	chart.options.axisX.stripLines[selected].value = chart.axisX[0].convertPixelToValue(relX);
			    	chart.options.zoomEnabled = false;
					document.getElementById(channelsObjs[i].button).style.display = "none";
			    	chart.render();
			  	}
			});


			$(canvas_chart).last().on("mouseup", function(e) {
				if(selected !== -1) { 	// clear selection and change the cursor
				  	selected = -1;
				  	$(this).removeClass('pointerClass');
					// var i = parseInt( $(this).parent()[0].id.replace("Container",""));
					var i = parseInt( $(this).parent().parent()[0].id.replace("Container",""));
					chart = channelsObjs[i].chart;
			    	chart.options.zoomEnabled = true;   // turn zoom back on
			    	// document.getElementById(channelsObjs[i].button).style.display = "inline";
			    	chart.render();
		    	}
			});

// Zoom: on mouse wheel event zoom on Y axis, or on X axis if Alt key pressed
			$(canvas_chart)[1].addEventListener("wheel", function(e){
			  	e.preventDefault();

				var i = parseInt( $(this).parent().parent()[0].id.replace("Container",""));
				chart = channelsObjs[i].chart;

			  	var relOffsetY = e.clientY - pageOffsetY - i * chartHeight;

 				if(e.clientX < chart.plotArea.x1 || e.clientX > chart.plotArea.x2 || relOffsetY < chart.plotArea.y1 || relOffsetY > chart.plotArea.y2)
			  		return;

			  	var axis = e.altKey ? chart.axisX[0] : chart.axisY[0];

			  	var viewportMin = axis.get("viewportMinimum"),
			    	viewportMax = axis.get("viewportMaximum"),
			      	interval = (axis.get("maximum") - axis.get("minimum"))/zoomSteps;  // control zoom step

			  	var newViewportMin, newViewportMax;

			  	if (e.deltaY < 0) {
			    	newViewportMin = viewportMin + interval;
			    	newViewportMax = viewportMax - interval;
			  	}
			  	else if (e.deltaY > 0) {
			    	newViewportMin = viewportMin - interval;
			    	newViewportMax = viewportMax + interval;
			  	}

			  	if((newViewportMax - newViewportMin) > (2 * interval)){
				  	if(zoomAll){
				  		zoomAllCharts(newViewportMin, newViewportMax, e.altKey);
				  	}
				  	else {  // zoom selected trace only
					  	if(newViewportMin >= axis.get("minimum") && newViewportMax <= axis.get("maximum")){
					    	axis.set("viewportMinimum", newViewportMin, false);
					    	axis.set("viewportMaximum", newViewportMax);
					    	chart.render();
					  	}
				  	}
			  	}
			}, {
				// passive: true
			});

// Context menu selections
			$("#" + channelsObjs[j].container).contextMenu({
			  selector: "div",
			  items: {
			    "deleteP": {
			      name: "Delete P picks",
			      callback: function() {
					var i = parseInt( $(this).parent()[0].id.replace("Container",""));
					deletePicks(i, 'P');
			        return;
			      }
			    },
			    "deleteS": {
			      name: "Delete S picks",
			      callback: function() {
					var i = parseInt( $(this).parent()[0].id.replace("Container",""));
					deletePicks(i, 'S');
			        return;
			      }
			    },
			    "newP": {
			      name: "New P pick",
			      callback: function() {
					var i = parseInt( $(this).parent()[0].id.replace("Container",""));
					addPick(i, 'P');
			        return;
			      }
			    },
			    "newS": {
			      name: "New S pick",
			      callback: function() {
					var i = parseInt( $(this).parent()[0].id.replace("Container",""));
					addPick(i, 'S');
			        return;
			      }
			    },
			    "tooltip": {
			      name: "Toggle Tooltip",
			      callback: function() {
			        $("#showTooltip").trigger("click");
			      }
			    },
			    "zoom": {
			      name: "Toggle Zoom All Traces",
			      callback: function() {
			        $("#zoomAll").trigger("click");
			      }
			    },
			    "reset": {
			      name: "Reset All Traces",
			      callback: function() {
			        $("#resetAll").trigger("click");
			      }
			    },
			    "sep1": "---------",
			    "cancel": {
			      name: "Cancel",
			      callback: function() {
			        return;
			      }
			    }
			  }
			});

		}

	    var endTime = new Date();
		document.getElementById("timeToRender").innerHTML = "Render Time: " + (endTime - startTime) + "ms";

	    console.log(index + " channels");
	    console.log(totalPoints + " total data points");

	});


};
