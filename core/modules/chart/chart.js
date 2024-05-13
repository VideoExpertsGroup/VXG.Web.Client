window.screens = window.screens || {};
window.controls = window.controls || {};
var path = window.core.getPath('chart.js');

window.controls['chart'] = {
    'js':[path+'VXGChart/VXGChart.js', path+'../../common/chartJs/Chart.min.js'],
    'css':[path+'chart.css', path+'VXGChart/VXGChart.css'],
    'observedAttributes':function(){
        return ['access_token','meta','start_time','end_time'];
    },
    // Called when control added into page
    'on_init':function(){
        let self = this;
	controls['chart'].attributeChangedCallback.apply(this);
    },
    chartPointCB: function ( data ) {
	let start = data['start']/1000;
	let end   = data['end']/1000;
	let accessToken = data.vxgToken;
	
	if (start && end && accessToken) {
		window.screens['camerameta'].activate(accessToken, start, end);
	}
    },
    // Called on every attribute (from list above) change
    'attributeChangedCallback':function(name, value){
        let self = this;
        // VXG access token
        let access_token = $(this).attr('access_token');
        // Meta filter
        var meta = $(this).attr('meta');
        // Start time in UTC
        let start_time = $(this).attr('start_time');
        // End time in UTC
        let end_time = $(this).attr('end_time');
        var period = $(this).attr('period'); //in seconds
        var timeformat = $(this).attr('timeformat'); //24h/12h
	
	let legend_max_color = $(this).attr('legend_max_color');
	let legend_min_color = $(this).attr('legend_min_color');
	let legend_avg_color = $(this).attr('legend_avg_color');
	
	var visualOptions = {};
	visualOptions.color_of_average_curve = (legend_avg_color)? legend_avg_color : window.core.getCustomPropertyValue('--average-curve-color');
	visualOptions.color_of_min_curve = (legend_min_color)? legend_min_color : window.core.getCustomPropertyValue('--min-curve-color');
	visualOptions.color_of_max_curve = (legend_max_color)? legend_max_color : window.core.getCustomPropertyValue('--max-curve-color');
	visualOptions.show_meta_select = false;
	visualOptions.show_report_select = false;
	visualOptions.show_period_select = false;
	
	if (meta === undefined) {
		meta = 'Person';
	}
	
	self = new VXGChartController(self, "", meta, visualOptions);
	if (timeformat === '12h') {
		self.setTimeFormat('12h');
	} else {
		self.setTimeFormat('24h');
	}
	self.setPointCallback(chartPointCB);

	var timedelta = 0;
	if (period !== undefined) {
		self.periodChange(period);
		if (end_time !== undefined) {
			let et = new Date( end_time + "Z");
			let curtime = new Date();
			let et_ms = et.getTime();
			timedelta = curtime.getTime() - et_ms;
		}
	} else if (end_time !== undefined && start_time !== undefined) {
		let et = new Date( end_time + "Z");
		let st = new Date( start_time + "Z");
		let curtime = new Date();
		let et_ms = et.getTime();
		let st_ms = st.getTime();

		let period = et_ms - st_ms;
		self.periodChange(period/1000);
		timedelta = curtime.getTime() - et_ms;
	}
	if (name === undefined) {
		name = "";
	}
	
	self.setSource( access_token, name, timedelta/1000 );
/*
        // load and show preview
        $(this).css('background-image','none');
        return vxg.cameras.getCameraFrom(access_token).then(function(camera){
            if (!camera) return;
            return camera.getPreview().then(function(url){
                $(self).css('background-image','url('+url+')');
                $(self).removeClass('spinner');
            },function(){
                $(self).removeClass('spinner');
            });
        });
*/        
    }
}
