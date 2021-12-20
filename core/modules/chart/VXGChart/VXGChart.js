
/*-------MODEL-------*/
var VXGChartModel = function VXGChartModel(XMLHttpRequest, pointCnt) {
  this.XMLHttpRequest = XMLHttpRequest;
  this.pointCnt = pointCnt;
};

VXGChartModel.prototype.getBaseURLFromToken = function(access_token) {
    try {
	var _at = JSON.parse(atob(access_token));    
    } catch (e) {
	return null;
    }
    var _default_host = 'web.skyvr.videoexpertsgroup.com';
    var _url = _at['api'] ? _at['api'] : _default_host;
    if (_url === _default_host) {
        return "https://" + _url;
    }
    
    var proto = location.protocol;
    
    return proto + "//" + _url + (_at['api_p'] ? ':' + _at['api_p'] : "");
};

VXGChartModel.prototype.eventList = function(obj, accessToken) {
    var headers = null;
    if (obj.hasOwnProperty('access_token') )
    {
        headers = {'Authorization': 'Acc ' + obj.access_token};
        delete obj.access_token;
    }
    
    var args = obj || {};
    args.offset = args['offset'] || 0;
    args.limit = args['limit'] || 1000;

    var d = $.Deferred();
    var _baseurl = this.getBaseURLFromToken(accessToken);
    if (_baseurl == null) {
	d.reject("can't parse access token");
	return d.promise();
    }
    var data = [];
    function getData() {
        $.ajax({
            type: 'GET',
            url: _baseurl + '/api/v2/storage/events/',
            headers: headers,
            contentType: "application/json",
            data: args
        }).done(function(r) {
            data = data.concat(r['objects']);
            args.offset += r.meta.limit;
            if (r['objects'] && r.objects.length && (r.objects.length + r.meta.offset < r.meta.total_count))
                getData();
            else
                d.resolve(data);
        }).fail(function() {
            d.reject(data);
        });
    }
    getData();
    return d.promise();
};

VXGChartModel.prototype.minTwoDigits = function minTwoDigits(n) {
    return (n < 10 ? '0' : '') + n;
};

VXGChartModel.prototype.GetStartAndEndTime = function GetStartAndEndTime(period, timedelta=0){
    var align = 0;

    let et = new Date( new Date().getTime() - (timedelta * 1000));
    let st = new Date(et.getTime() - period); 

    if ((period/1000) / 3600 > 12) {
	align = 60; //align to hour
    } else if ((period/1000) / 60 > 12 ) {
	align = 10; // align to 10min
    } 

    let result = {};

    if (align > 10) {
	result['et'] = et.getUTCFullYear() 
	+ "-" + this.minTwoDigits(Number(et.getUTCMonth()) + 1) 
	+ "-" + this.minTwoDigits(et.getUTCDate()) 
	+ "T" + this.minTwoDigits(et.getUTCHours()) +  ":00:00";
	result['st'] = st.getUTCFullYear() 
	+ "-" + this.minTwoDigits(Number(st.getUTCMonth()) + 1) 
	+ "-" + this.minTwoDigits(st.getUTCDate()) 
	+ "T" + this.minTwoDigits(st.getUTCHours()) + ":00:00";
    } else if (align > 0) {
	var aligned_minutes = Math.round(et.getUTCMinutes()/10)*10;
	var correct_hour = 0;
	if (aligned_minutes >= 60){
	    correct_hour = 1;
	    aligned_minutes = 0;
	}
	result['et'] = et.getUTCFullYear() 
	+ "-" + this.minTwoDigits(Number(et.getUTCMonth()) + 1) 
	+ "-" + this.minTwoDigits(et.getUTCDate()) 
	+ "T" + this.minTwoDigits(et.getUTCHours() + correct_hour) 
	+ ":" + this.minTwoDigits( aligned_minutes  ); 
	+ ":00" ;
	result['st'] = st.getUTCFullYear() 
	+ "-" + this.minTwoDigits(Number(st.getUTCMonth()) + 1) 
	+ "-" + this.minTwoDigits(st.getUTCDate()) 
	+ "T" + this.minTwoDigits(st.getUTCHours() + correct_hour) 
	+ ":" + this.minTwoDigits( aligned_minutes  ) 
	+ ":00" ;
    } else {    
	result['et'] = et.getUTCFullYear() 
	+ "-" + this.minTwoDigits(Number(et.getUTCMonth()) + 1) 
	+ "-" + this.minTwoDigits(et.getUTCDate()) 
	+ "T" + this.minTwoDigits(et.getUTCHours()) 
	+ ":" + this.minTwoDigits(et.getUTCMinutes()) 
	+ ":" + this.minTwoDigits(et.getUTCSeconds());
	result['st'] = st.getUTCFullYear() 
	+ "-" + this.minTwoDigits(Number(st.getUTCMonth()) + 1) 
	+ "-" + this.minTwoDigits(st.getUTCDate()) 
	+ "T" + this.minTwoDigits(st.getUTCHours()) 
	+ ":" + this.minTwoDigits(st.getUTCMinutes()) 
	+ ":" + this.minTwoDigits(st.getUTCSeconds());
    }
    
    return result;    
}


VXGChartModel.prototype.prepareChartData = function prepareChartData( answer, meta, showFunc, timeformat='24h' ) {
    let data		= answer['data'];
    let timelimits	= answer['timelimits'];

    //synthetic-period-edge-points 
    let endevent        = {time: timelimits['et']};
    data.push(endevent);
    let startevent	= {time: timelimits['st']};
    data.push(startevent);    

    //data-points
    let sorted = data.sort((a,b) => (a.time > b.time) ? 1 : ((b.time > a.time) ? -1 : 0));
    
    let labels = [];
    let chartData = [];
    let periods = [];
    
    var chartDataMax = [];
    var chartDataAvg = [];
    var chartDataMin = [];

    let self = this;

    let st = new Date( timelimits['st'] + "Z");
    let et = new Date( timelimits['et'] + "Z");
    let st_time_ms = st.getTime();
    let et_time_ms = et.getTime();
    var point_count = 25;
    
    if (et_time_ms - st_time_ms <= 7200000) { //1*60*60*1000 ms
	point_count = 10;
    }
    
    let calc_period_ms = (et_time_ms - st_time_ms)/(point_count-1);
    let calc_semiperiod_ms = calc_period_ms/2;
    
    var prev_time_ms = st_time_ms;
    var check = 0;
    var varodd = 0;
    var prev_label = "";
    var last_max = 0;
    var last_min = 0;
    var last_avg = 0;
    for (var i = 0; i < point_count; i++) {
	let curtime = prev_time_ms + i*calc_period_ms;
        var sum = 0, cnt = 0, min = 0, max = 0, avg = 0;

	let labeltime = new Date( curtime );
	var label = '';
	if (timeformat === '12h') {
		var hh = labeltime.getHours();
		var ampm = (hh < 12) ? "am" : "pm";
		var hours = (hh == 0)? 12 : ((hh < 13) ? hh : hh - 12);
		
		label = labeltime.getFullYear() + "-" 
		+ self.minTwoDigits(Number(labeltime.getMonth()) + 1) + "-" 
		+ self.minTwoDigits(labeltime.getDate()) + ' ' 
		+ self.minTwoDigits(hours) + ':' 
		+ self.minTwoDigits(labeltime.getMinutes()) + ':' 
		+ this.minTwoDigits(labeltime.getSeconds()) + ' ' 
		+ ampm;
	} else {
		label = labeltime.getFullYear() + "-" 
		+ self.minTwoDigits(Number(labeltime.getMonth()) + 1) + "-" 
		+ self.minTwoDigits(labeltime.getDate()) + ' ' 
		+ self.minTwoDigits(labeltime.getHours()) + ':' 
		+ self.minTwoDigits(labeltime.getMinutes()) + ':' 
		+ this.minTwoDigits(labeltime.getSeconds());
	}
	labels.push(label);
	
	var gotdata_period = false;
	var gotdata_now = false;
	
	for (var j = check; j < sorted.length; j++) {  
		var localDate = new Date(sorted[j].time + "Z");
		let time_ms = localDate.getTime();
//		if ( (time_ms <= (curtime + calc_period_ms)) 
		if ( (time_ms <= (curtime + calc_semiperiod_ms)) && (time_ms > (curtime - calc_semiperiod_ms)) 
		) {
			gotdata_now = (sorted[j].meta && sorted[j].meta[meta])? true : false;
			if(!gotdata_period) {
				gotdata_period = gotdata_now;
			}
			var objectCnt = ( gotdata_now ) ? parseInt(sorted[j].meta[meta]) : 0;
			if ( (j > 0) //prevent influence of left-synthetic-edge-point on avg-calculation
			&& ( (gotdata_period && gotdata_now) ) //prevent influence of rigth-synthetic-edge-point
			) { 
			    cnt = cnt + 1;
			}
			sum = sum + objectCnt;
			if (objectCnt > max ) {
			    max = objectCnt;
			}
			if ( (( (min == 0) || (objectCnt < min)) 
			&& ( (gotdata_period && gotdata_now) || (!gotdata_period && !gotdata_now) )) //prevent influence of rigth-synthetic-edge-point
			){
			    min = objectCnt;
			}
		} else {
			check = j;
			break;
		}
	}
	periods[label] = { 'end':(curtime + calc_semiperiod_ms), 'start':(curtime - calc_semiperiod_ms) };
	
	chartDataMax.push(max);
	chartDataMin.push(min);
	if (cnt == 0) {
		avg = 0; 
	} else {
		avg = (sum/cnt).toFixed();
	}
	chartDataAvg.push(avg);
    }
    
    answer['chartData'] = chartDataAvg;
    answer['chartDataMax'] = chartDataMax;
    answer['chartDataMin'] = chartDataMin;
    answer['meta']	= meta;
    answer['labels'] 	= labels;
    answer['periods'] = periods;
    
    showFunc(answer);
};

VXGChartModel.prototype.getChartData = function getChartData( vxgToken, showFunc, waitFunc, period=600 , meta="Person", timedelta=0, timeformat='24h') {
    if (period < 120) {
	period = 600;
    }

    let limit = period/60; 
    this.timeLimits = this.GetStartAndEndTime(period*1000, timedelta);

    var obj = {
        limit: 7200, //limit,
        events: "object_and_scene_detection,yolov4_detection",
        include_meta: true,
        meta:  meta,
        order_by: '-time',
        access_token: vxgToken,
        start: this.timeLimits['st'],
        end: this.timeLimits['et']
    };  

    var answerData = {
	result: -1,
	description: "Error"
    };

    let self = this;

    waitFunc(true);
    this.eventList(obj, vxgToken).done(function (eventlist) {
        waitFunc(false); 
	answerData['result'] = 0;
	answerData['description'] = "Success";
	answerData['data'] = eventlist;
	answerData['timelimits'] = self.timeLimits;
        self.prepareChartData(answerData, meta, showFunc, timeformat);
    }).fail(function (r) {
        waitFunc(false);        
        console.error(r);

	answerData['result'] = -1;
	answerData['description'] = r;
	
	answerData['chartData'] = [];
	answerData['chartDataMax'] = [];
	answerData['chartDataMin'] = [];
	answerData['labels'] 	= [];
	
        showFunc(answerData);	
    });
};

VXGChartModel.prototype.getReport = function getReport(nextFunc) {
    //STUB FOR REAL REPORT
        let storageObj = {
        "httpcode": 200,
        "lead_time_sec": -1,
        "data": [],
        "allCamsToken": null,
        "limit": 25,
        "offset": 0,
        "total": 10
    }

    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storageObj));
    
    nextFunc(dataStr);
}

/*-------VIEW--------*/

var VXGChartView = function VXGChartView(element, pointCnt) {
    this.element = element;
    this.pointCnt = pointCnt;
    this.timeFormat = '24h';
};

VXGChartView.prototype.initDraw = function initDraw(controller, cameraName, meta) {
    this.meta = meta;
    
    if (this.visualOptions === undefined || this.visualOptions == null) {
	this.visualOptions = {};
    }

    if (this.visualOptions.color_of_average_curve === undefined) {
	this.visualOptions.color_of_average_curve = "rgba(123, 178, 71, 1.0)";
    }
    if (this.visualOptions.color_of_min_curve === undefined) {
	this.visualOptions.color_of_min_curve = "rgba(0, 0, 255, 1.0)";
    }
    if (this.visualOptions.color_of_max_curve === undefined) {
	this.visualOptions.color_of_max_curve = "rgba(255, 0, 0, 1.0)";
    }
    var show_meta_select = false;
    var show_period_select = false;
    var show_report_select = false;
    
    if (this.visualOptions.show_meta_select !== undefined ){
	show_meta_select = this.visualOptions.show_meta_select;
    }
    if (this.visualOptions.show_period_select !== undefined ){
	show_period_select = this.visualOptions.show_period_select;
    }
    if (this.visualOptions.show_report_select  !== undefined ){
	show_report_select  = this.visualOptions.show_report_select ;
    }
    
    
    let metaselect = (meta == "Person")? "People counting" : (meta + " counting");

    this.element.innerHTML = 
    	'<div class="VXGChart VXGChartContainer">'
    +	'	<div class="VXGChartContainer3">'
    +	'		<div class="VXGChartContainer2">'
    +	'			<div class="" ' + ((!show_meta_select)?(' style="display:none;"'):('')) +  ' >'
    +	'				<div class="VXGChartDropmenu">'
    +	'					<div class="VXGChart menu" tabindex="0"><span>' + metaselect + '</span>'
    +	'					    <ul id="count-type" class="menu-dropdown" x-placement="bottom-start" style="position: absolute; top: 19px; left: 0px; will-change: top, left;">'
    +	'						    <li data-type="Person"><span>People counting</span></li>'
    +	'					    	<li data-type="Car"><span>Car counting</span></li>'
    +	'					    </ul>'
    +   '					</div>'
    +	'				</div>'
//    +	'				<div class="VXGChartRefreshContainer">'
//    +	'					<button type="button" class="VXGChart btn btn-primary btn-xs VXGChartRefresh">Refresh</button>'
//    +	'				</div>'
    +	'			</div>'
    +	'			<div class="chart-container" style="position: relative; height: calc(100%'+ ((!show_meta_select)?(''):(' - 29px')) + ((!(show_period_select || show_report_select) )?(''):(' - 25px')) + ');">'
    +	'				<canvas class="VXGChart VXGLinechart""></canvas>'
    +	'			</div>'
    +	'			<div>'
    +	'				<span class="VXGChart reportDownload vxgbutton-transparent" ' + ((!show_report_select)?(' style="display:none;"'):('')) +'>Download Report</span>'
    +	'				<a class="VXGDownloadAnchorElem" style="display:none"></a>'
        +	'					<div class="btn-group period" ' + ((!show_period_select)?(' style="display:none;"'):(''))  + ' >'
        +	'					<span class="shift-left"></span>'
        +	'						<button data-period="600"   type="button" class="VXGChart btn btn-white btn-xs period10m" >10 min</button>'
        +	'						<button data-period="3600"  type="button" class="VXGChart btn btn-white btn-xs period1h active">1 hour</button>'
        +	'						<button data-period="86400" type="button" class="VXGChart btn btn-white btn-xs period1d">1 day</button>'
        +	'					<span class="shift-right"></span>'
        +	'					</div>'
    +	'				<div>'
    +	'				</div>'
    +	'			</div>' 
    +	'		</div>'
    +	'		<div class="VXGChartWaiter"></div>'
    +	'	</div>'
    +	'</div>';
    let element = this.element;
    

    
    this.canvas = this.element.getElementsByClassName('VXGLinechart')[0];
    this.waiter	= this.element.getElementsByClassName('VXGChartWaiter')[0];
    this.name	= $('.VXGChartCameraName')[0]; 
    
//    this.element.getElementsByClassName('VXGChartRefresh')[0].onclick = function() {
//	controller.chartRefresh();
//    }

    this.element.getElementsByClassName('reportDownload')[0].onclick = function() {
	controller.downloadReportStep1();
    }
    
// this in function body- current button, this - outside function body is VXGChartView.instance, $(this) - jquery current button    
    let self = this;
    this.element.getElementsByClassName('shift-left')[0].onclick = function() {

	controller.timedelta += controller.period;
	if (controller.period == 600) {
	    controller.periodChange(600, controller.timedelta);  
	} else if (controller.period == 3600) {
	    controller.periodChange(3600, controller.timedelta);  
	} else if (controller.period == 86400) {
	    controller.periodChange(86400, controller.timedelta);  
	}
    }

    this.element.getElementsByClassName('shift-right')[0].onclick = function() {
	if (controller.timedelta >= 0) {
	    controller.timedelta -= controller.period;
	    if (controller.timedelta < 0) {
		controller.timedelta = 0;
	    }
	    
	    if (controller.period == 600) {
		controller.periodChange(600, controller.timedelta);  
	    } else if (controller.period == 3600, controller.timedelta) {
		controller.periodChange(3600, controller.timedelta);  
	    } else if (controller.period == 86400) {
		controller.periodChange(86400, controller.timedelta);  
	    }
	}
    }



    this.element.getElementsByClassName('period10m')[0].onclick= function() { 
        $(this).addClass('active').siblings().removeClass('active'); 
        controller.timedelta = 0;
        controller.periodChange(600);  
    };
    this.element.getElementsByClassName('period1h')[0].onclick = function() { 
        $(this).addClass('active').siblings().removeClass('active');
        controller.timedelta = 0;        
	controller.periodChange(3600); 
    };
    this.element.getElementsByClassName('period1d')[0].onclick = function() { 
        $(this).addClass('active').siblings().removeClass('active');
        controller.timedelta = 0;        
        controller.periodChange(86400);
    };
    let dropmenu = this.dropmenu = this.element.getElementsByClassName('VXGChartDropmenu')[0];
    $(dropmenu).on('click', '#count-type li', function () {
	$(dropmenu).closest('.VXGChartDropmenu').find('.menu').blur();
	$(dropmenu).closest('.VXGChartDropmenu').find('.VXGChart > span').text($(this).text());
	controller.switchMeta($(this).data('type'))
    });

    self.clearData();
}



VXGChartView.prototype.clearData = function clearData() {
    let labels = [];
    let points = [];
    let ptCnt = 2;
    let meta  = this.meta;
  
    for ( i=0; i < ptCnt; i++) {
	labels.push("");
	points.push(0);
    }
  
    var emptyModel = {
	labels : labels,
	meta   : meta,
	chartData : points,
	chartDataMax: points,
	chartDataMin: points
    };
    this.render(emptyModel);
}



VXGChartView.prototype.render = function render(viewModel) {

    if (this.cameraName !== undefined && this.name !== undefined) {
        this.name.innerHTML = this.cameraName;    
    }

/*
    var test = [];
    for (var i = 0; i < viewModel['chartData'].length; i++) {
	test.push( viewModel['chartData'][i] + 1);
    }
*/

    var dataset = [
            {
                label: "avg",
                backgroundColor: "rgba(123, 178, 71, 0)",
                borderColor:  this.visualOptions.color_of_average_curve ,
                pointBackgroundColor: this.visualOptions.color_of_average_curve,
                pointBorderColor: "#fff",
                pointStyle: 'circle',
                data: viewModel['chartData']
            }
        ];
        
    if (viewModel['chartDataMax'] !== undefined) {
	dataset.push ({
		label: "max",
                backgroundColor: "rgba(123, 178, 71, 0)",
                borderColor:  this.visualOptions.color_of_max_curve,
                pointBackgroundColor:  this.visualOptions.color_of_max_curve,
                pointBorderColor: "#fff",
                pointStyle: 'triangle',
                data: viewModel['chartDataMax']
	});
    }
    if (viewModel['chartDataMin'] !== undefined) {
	dataset.push ({
		label: "min",
                backgroundColor: "rgba(123, 178, 71, 0)",
                borderColor:  this.visualOptions.color_of_min_curve,
                pointBackgroundColor: this.visualOptions.color_of_min_curve,
                pointBorderColor: "#fff",
                pointStyle: 'rect',
                data: viewModel['chartDataMin']
	});
    }

    let lineData = {
        labels: viewModel['labels'],
        datasets: dataset
    };
    
    let self = this;
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    
    self.currentPeriods = viewModel['periods'];
    
    function clickHandler(evt) {
	var firstPoint = self.chart.getElementAtEvent(evt)[0];
	if (firstPoint) {
	    var label = self.chart.data.labels[firstPoint._index];
	    var value = self.chart.data.datasets[firstPoint._datasetIndex].data[firstPoint._index];
	    
	    console.log("DBG: " + label + " " + value);
	    if (self.currentPeriods) {
		console.log('DBG Periods start:' + self.currentPeriods[label].start + ' end:' + self.currentPeriods[label].end );
		if (self.pointCallback) {
			var obj = self.currentPeriods[label];
			if (self.vxgToken) {
				obj.vxgToken = self.vxgToken;
			}
			self.pointCallback(obj);
		}
	    }
	}
    };
    
    let lineOptions = {
        legend: {
            display: true,
            position: 'bottom',
            align: 'center',
	    labels: {
		useLineStyle: true
	    }
        },
        onClick: clickHandler,
        responsive: true,
        scaleBeginAtZero: true,
        maintainAspectRatio: false,
    	scales: {
	    yAxes: [{
		ticks: {
		     min: 0,
		     autoSkip: true,
		     autoSkipPadding: 10
		},
		afterBuildTicks: function(axis, ticks){
			var filterTicks = [];
			for (var i=0; i < ticks.length; i++) {
				if ( ticks[i] % 1 == 0 ) {
				    filterTicks.push(ticks[i]);
				}
			}
			return filterTicks;
		}
	    }],
	    xAxes: [{
		ticks: {
		    autoSkip: true,
		    autoSkipPadding: 60,
		    maxRotation: 0
		},
		afterUpdate: function(axis) {
			console.log("afterupdate");
			var ticks = axis._ticksToDraw;
			var prevpm = -1;
			for (var i=0; i < ticks.length; i++) {
			    if (ticks[i].value !== '') {
				var datetime = ticks[i].value.split(' ');
				var time = datetime[0];
				if (self.timeFormat === '12h'){
					var ampm = datetime[1];
					var date = datetime[2] + datetime[3];

					if (prevpm !== ampm && (prevpm === 'pm' || prevpm == -1)) {
					} else {
					    ticks[i].label = time + ' ' + ampm;
					}
					prevpm = ampm;
				} else {
					var date = datetime[1] +' '+ datetime[2];
					var hour = time.split(":")[0];
					if (prevpm <= hour && (prevpm !== -1)) {
					    ticks[i].label = time;
					}
					prevpm = hour;
				}
			    }
			}
			axis._ticksToDraw = ticks;
		},
		afterBuildTicks: function(axis, ticks){
			var filterTicks = [];
			var prev = '';
			for (var i=0; i < ticks.length; i++) {
				if (ticks[i] === '') {
				    filterTicks.push('');
				    continue;
				}
				var datetime = ticks[i].split(' ');
				var data = datetime[0];
				var dataarr = data.split('-');
				var year = dataarr[0];
				var month = dataarr[1];
				var day = dataarr[2];
				var time = datetime[1];
				var timearr = time.split(':');
				var hours = timearr[0];
				var minutes = timearr[1];
				var seconds = timearr[2];

				if (self.timeFormat === '12h'){
				    var ampm = datetime[2];
				    var newval = hours + ':' + minutes + ' ' + ampm + ' ('+ day + ' ' + monthNames[Number.parseInt(month) - 1]  + ')';
				    if (newval !== prev) {
					filterTicks.push ( newval);
				    }
				    prev = newval;
				} else {
				    var newval = hours + ':' + minutes + ' ('+ day + ' ' + monthNames[Number.parseInt(month) - 1]  + ')';
				    if (newval !== prev) {
					filterTicks.push ( newval);
				    }
				    prev = newval;
				}
			}
			return filterTicks;
		}
	    }]
	}
    };
    
    if (this.chart !== undefined) {
	this.chart.data = lineData;
	this.chart.update();
    } else {
	let ctx = this.canvas.getContext("2d");
	ctx.globalCompositeOperation='destination-over';
	this.chart = new Chart(ctx, {type: 'line', data: lineData, options: lineOptions});
    }
};

VXGChartView.prototype.showWait = function showWait(isWait) {
    let element = this.waiter;

    if (isWait) {
        $(element).addClass("waitdata");
    } else {
        $(element).removeClass("waitdata");    
    }
};

VXGChartView.prototype.downloadReport = function downloadReport(report) {
    let dlAnchorElem = this.element.getElementsByClassName('VXGDownloadAnchorElem')[0];
    dlAnchorElem.setAttribute("href",     report     );
    dlAnchorElem.setAttribute("download", "report.json");
    dlAnchorElem.click();
};

/*------CONTROLLER--*/
///init component func
///element - <div>-element to which VXGChart vill be connected
///cameraName - initial name of chart, can be changed later. Default value - empty string ""
///meta - initial type of chart units. Default value = Person
var VXGChartController = function VXGChartController( element, cameraName="", meta="Person", visualOptions=null) {
    if (element === undefined) {
	return;
    }
    
    this.pointCnt	= 10;
    this.cameraName 	= cameraName;
    this.chartModel	= new VXGChartModel(XMLHttpRequest, this.pointCnt);
    this.chartView	= new VXGChartView( element, this.pointCnt, cameraName, meta);
    this.chartView.visualOptions = visualOptions;
    this.meta 		= meta;

    this.chartModel.eventsnet = 180; //events net - (delta in seconds between events) to build correct chart incase noevents

    this.chartView.element.setSource	= this.setSource.bind(this);
    this.chartView.element.chartRefresh	= this.chartRefresh.bind(this);
    this.chartView.element.periodChange = this.periodChange.bind(this);
    this.chartView.element.switchMeta	= this.switchMeta.bind(this);
    this.chartView.element.setPointCallback = this.setPointCallback.bind(this);
    
    this.chartView.initDraw(this, cameraName, meta);
};

///setSource - get and draw data by VXGcamera accessToken as chart by meta for period
///vxgToken - VXGCamera access token
///cameraName - initial name of chart, can be changed later. Default value - empty string ""
///startTimeDelta - time delta to showing chart for set period but from the last. Default: 0 - current date
VXGChartController.prototype.setSource = function setSource( vxgToken , cameraName="", startTimeDelta=0 ) {
    this.timedelta	= startTimeDelta;
    this.vxgToken 	= vxgToken;
    if (this.period === undefined) {
	this.period = 3600;
    }

    if (cameraName !== undefined) {
	this.chartView.cameraName = cameraName;
    }
    this.chartView.vxgToken = vxgToken;
    this.chartView.clearData();

    if (this.vxgToken !== undefined) {
        this.chartModel.getChartData( vxgToken, this.showChart.bind(this), this.showWait.bind(this), this.period , this.meta , this.timedelta, this.chartView.timeFormat);
    }
};

///periodChange - change the period of data drawn to chartline
///period - int value - number of secconds from current moment
VXGChartController.prototype.periodChange = function periodChange(period, timedelta = 0) {
    this.period 	= period;
    this.timedelta 	= timedelta;
    
    this.chartView.clearData();

    if (this.vxgToken !== undefined) {
        this.chartModel.getChartData( this.vxgToken, this.showChart.bind(this), this.showWait.bind(this), period, this.meta,  this.timedelta, this.chartView.timeFormat );
    }
};

VXGChartController.prototype.chartRefresh = function chartRefresh() {

    this.chartView.clearData();

    if (this.vxgToken !== undefined
    && this.period !== undefined
    && this.meta !== undefined
    && this.timedelta !== undefined
    ) {
        this.chartModel.getChartData( this.vxgToken, this.showChart.bind(this), this.showWait.bind(this), this.period, this.meta,  this.timedelta, this.chartView.timeFormat );
    }
};

///switchMeta - changing chart units
///meta - string value ("Person" or "Car")
VXGChartController.prototype.switchMeta = function switchMeta ( meta ) {

    this.chartView.clearData();

    console.warn('DEBUG switchMeta '+ meta);
    this.meta = meta;
    if (this.vxgToken !== undefined) {
        this.chartModel.getChartData( this.vxgToken, this.showChart.bind(this), this.showWait.bind(this), this.period, this.meta,  this.timedelta, this.chartView.timeFormat );
    }
};

///showChart - connect function beetwen chartModel and chartView
VXGChartController.prototype.showChart = function showChart(preparedData) {
    this.chartView.render(preparedData);
};

///showWait - connect function beetwen chartModel and chartView
VXGChartController.prototype.showWait = function showWait (isWait) {
    console.warn('DEBUG swhoWait '+ isWait);
    this.chartView.showWait(isWait);
};

///downloadReportStep1 - connect function beetwen chartView and chartModel
VXGChartController.prototype.downloadReportStep1 = function downloadReportStep1() {
    console.warn('DEBUG downloadReportStep1');

    let st = (new Date(this.chartModel.timeLimits['st']+'Z')).getTime()/1000;
    let et = (new Date(this.chartModel.timeLimits['et']+'Z')).getTime()/1000;
    window.screens['camerameta'].activate(this.vxgToken, st, et, true);


//    this.chartModel.getReport(this.downloadReportStep2.bind(this));
};
///downloadReportStep2 - connect function beetwen chartModel and chartView
VXGChartController.prototype.downloadReportStep2 = function downloadReportStep2( report ) {
    console.warn('DEBUG downloadReportStep2');
    this.chartView.downloadReport(report);
};

VXGChartController.prototype.setTimeFormat = function setTimeFormat( format ) {
	if (format === '12h') {
		this.chartView.timeFormat = '12h';
	} else {
		this.chartView.timeFormat = '24h';
	}
}

VXGChartController.prototype.setPointCallback = function setPointCallback( func ) {
	this.chartView.pointCallback = func;
}


