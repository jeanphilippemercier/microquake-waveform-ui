var jsondata;
var channelsObjs = [];

window.onload = function () {

	var startTime0 = new Date();
	var totalPoints = 0;
	var sameScale = true;
	var showTooltip = false;
	var zoomY = false;
	toMicro = 1000000;  // seconds to microseconds factor
	toMmUnits = 10000000;  // factor to convert input units (m/1e10) to mmm
	initialDuration = 1 * toMicro;  // same scale time window to display in microseconds (1 second)
	var selected = -1;
	var lastSelectedXPosition = -1;
	var lastDownTarget = -1;
	var zoomSteps = 50; 	// for wheel mouse zoom
	var pageOffsetY = 40; // due to toolbars, etc
	var chartHeight = 120; // height of each chart in pixels

	var maxValue = function(dataPoints) {
	  var maximum = dataPoints[0].y;
	  for (i = 0; i < dataPoints.length; i++) {
	    if (dataPoints[i].y > maximum) {
	      maximum = dataPoints[i].y;
	    }
	  }
	  return Math.ceil(maximum/10)*10;
	};

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
	    		channelsObjs[index].button=channelsObjs[index].container + "Btn";
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
		    	// channelsObjs[index].datapicks=[];
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
		    		/* channelsObjs[index].datapicks.push({
		    			x: pickMicro + pickTimeDiff*1000,
		    			y: 0,
		    			indexLabel: "P"
		    		}); */
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
		    		/* channelsObjs[index].datapicks.push({
		    			x: pickMicro + pickTimeDiff*1000,
		    			y: 0,
		    			indexLabel: "S"
		    		}); */
		    	}		    	
		    	index ++;		    	
	    	}
	    }

		var startTime = new Date();
	    // document.getElementById("timeToLoad").innerHTML = "Load Time: " + (startTime - startTime0) + "ms";

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
		        		e.chart.options.viewportMinStack.push(e.axisX[0].viewportMinimum);
		        		e.chart.options.viewportMaxStack.push(e.axisX[0].viewportMaximum);
		        		var channel = parseInt( chart.container.id.replace("Container",""));
		        		document.getElementById(channelsObjs[channel].button).style.display = "inline";
		        	}
		        	if(e.trigger === "reset"){
		        		resetChartView(e.chart);
		        		e.chart.options.viewportMinStack=[];
		         		e.chart.options.viewportMinStack=[];
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
					minimum:0,
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
/*{
						type: "scatter",
						mouseover: onMouseover,
						mouseout: onMouseout,
						indexLabelOrientation: "horizontal",
						toolTipContent: null,
						highlightEnabled: false,
						fillOpacity: 0,
						dataPoints: channelsObjs[i].datapicks
}*/
				]
			};			

			channelsObjs[i].chart = new CanvasJS.Chart(channelsObjs[i].container, options);
			
			channelsObjs[i].chart.render();			
			totalPoints += channelsObjs[i].data.length;

			toolbar = document.getElementsByClassName("canvasjs-chart-toolbar")[i];
			$("<button>").attr({
	    		'id': channelsObjs[i].button,
	    		'class': "btn-back"
			}).html('\u21e6').appendTo(toolbar);			
			button = document.getElementById( channelsObjs[i].button);
			button.addEventListener( "click", back);
	    }

		$("#changeTimeScale").click(function () {
			sameScale = !sameScale;
			resetCharts();
			$("#changeTimeScale")[0].innerHTML = sameScale ? "Full Time Scale" : "Same Time Scale";
		});

		function resetCharts() {
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
			document.getElementById(channelsObjs[channel].button).style.display = getXvpMax() == null ? "none" : "inline";
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

/*
		function onRightClick(e){
			console.log("Right clicked on: x = " + e.dataPoint.x + " and y = " + e.dataPoint.y);
		}

		function onMouseover(e){
			var i = parseInt(e.chart.container.id.replace("Container",""));
			var chartContainer = channelsObjs[i].chart.container;
			console.log(chartContainer);
			chartContainer.addEventListener('contextmenu', e.chart.rightClick = function(ev){
				console.log('RC');
				ev.preventDefault();
		    	onRightClick(e);
		    	return false;
		  	}, false);
		}

		function onMouseout(e){
			var i = parseInt(e.chart.container.id.replace("Container",""));
			var chartContainer = channelsObjs[i].chart.container;
			chartContainer.removeEventListener('contextmenu', e.chart.rightClick);
		}
*/

		$("#showTooltip").click(function () {
			showTooltip = !showTooltip;

			for (var i = 0; i < index; i++) {
				channelsObjs[i].chart.options.toolTip.enabled = showTooltip;
				$("#showTooltip")[0].innerHTML = showTooltip ? "Hide Tooltip" : "Show Tooltip";
				channelsObjs[i].chart.render();
			}
		});

		$("#zoomMode").click(function () {
			zoomY = !zoomY;			
			for (var i = 0; i < index; i++) {
				channelsObjs[i].chart.options.zoomType = zoomY ? "xy" : "x"
				channelsObjs[i].chart.render();
			}
			$("#zoomMode")[0].innerHTML = zoomY ? "X Zoom and Pan" : "XY Zoom and Pan";
		});


		function back(){
			var i = parseInt(event.target.id.replace("ContainerBtn",""));
			var chart = channelsObjs[i].chart;

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
		        chart.options.viewportMinStack=[];
		        resetChartView(chart);
		  	}
		}

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

					    if(newViewportMin >= axis.get("minimum") && newViewportMax <= axis.get("maximum") && (newViewportMax - newViewportMin) > (2 * interval)){
					      	axis.set("viewportMinimum", newViewportMin, false);
					      	axis.set("viewportMaximum", newViewportMax);
					      	chart.render();
					    }
					    break;
				  	}
			  	}
			}
		}, false);


		for (var j = 0; j < index; j++) {
		
			canvas = "#" + channelsObjs[j].container + " > .canvasjs-chart-container"
			$(canvas).on("mousedown", function(e) {
				var index = parseInt($(this).parent()[0].id.replace("Container",""));
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
					      			// $(this).css("cursor","pointer");
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

			$(canvas).on("mousemove", function(e) {
			  // Move the selected stripLine
			  	if(selected !== -1) {
					var i = parseInt( $(this).parent()[0].id.replace("Container",""));
					chart = channelsObjs[i].chart;
			    	var parentOffset = $(this).parent().offset();
			    	var relX = e.pageX - parentOffset.left;
			    	chart.options.axisX.stripLines[selected].value = chart.axisX[0].convertPixelToValue(relX);
			    	chart.options.zoomEnabled = false;
			    	// chart.options.data[0].markerSize = 5;
			    	chart.options.data[0].cursor = "pointer";
					document.getElementById(channelsObjs[i].button).style.display = "none";
			    	chart.render();
			  	}
			});


			$(canvas).on("mouseup", function(e) {
				if(selected !== -1) {
				  	// Clear Selection and change the cursor
				  	selected = -1;
				  	// $(this).css("cursor","default");
				  	// Turn zoom back on
					var i = parseInt( $(this).parent()[0].id.replace("Container",""));
					chart = channelsObjs[i].chart;
			    	chart.options.zoomEnabled = true;
			    	// chart.options.data[0].markerSize = 0;
			    	chart.options.data[0].cursor = "default";
			    	document.getElementById(channelsObjs[i].button).style.display = "inline";
			    	chart.render();
		    	}
			});

			canvas_chart = canvas + " > .canvasjs-chart-canvas";
			$(canvas_chart)[1].addEventListener("mousedown", function(e){
				lastDownTarget = e.target;
			});

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

			  	if(newViewportMin >= axis.get("minimum") && newViewportMax <= axis.get("maximum") && (newViewportMax - newViewportMin) > (2 * interval)){
			    	axis.set("viewportMinimum", newViewportMin, false);
			    	axis.set("viewportMaximum", newViewportMax);
			    	chart.render();
			  	}			  	
			});

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
