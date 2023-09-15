window.screens = window.screens || {};
var path = window.core.getPath('reports.js');

function somethingWrong( err ) {
	console.warn('Something wrong' + err);
}

function addCamera(){
	window.screens['newcamera'].activate();
}

function addFilter(){
	let targetElement = $(this.document).find('.report_activitylist')[0];
	targetElement.showVXGFilter();
}

function refresh() {
	let targetElement = $(this.document).find('.linechart')[0];
	targetElement.chartRefresh();
}

function wrapRequest_cameraList_vxcore_to_vsapi (obj){
    let offset		= (obj['offset'] === undefined)? 0 : obj['offset'];
    let limit		= (obj['limit'] === undefined)? 100 : obj['limit'];    

// TODO: get all cals token from vxg.api.cloud
    let allCamToken	= vxg.user.src.allCamsToken;
    
    return window.vxg.cameras.getCameraFilterListPromise(limit, offset).then(function (answer) {
	var data = [];
	for(i = 0; i < answer.length; i++) {
	    data.push(answer[i]);
	}
	let obj = {
	    data: data,
	    offset : offset,
	    total : data.length,
	    allCamsToken: allCamToken
	};
	return obj;
    });
};

function listActivityCB( operation,  obj ) {
	let camid = obj['camid'];
	let time  = obj['time'];
	let timestamp = (new Date(time)).getTime();

	if (operation === "event") {
	    let targetElement = this.wrapper.find('.cameralist')[0];
	    let camera = targetElement.getCameraByCamid(camid);
	    console.log('callbackFunc ' + operation + 'with camera ' + camera['camera_id'] );

	    window.screens['tagsview'].camera = camera;
	    window.screens['tagsview'].activate(camera['token'], timestamp);	    
	} else if (operation === "meta") {
	    let targetElement = this.wrapper.find('.cameralist')[0];
	    let camera = targetElement.getCameraByCamid(camid);
	    window.screens['camerametaview'].activate(camera['token'], obj['eventid'], obj['ai_type']);
	} else if (operation === "filterChanged") {
	    //TODO checkFilter-btn green dot
	    console.log('callbackFunc ' + operation + 'isChanged ' + obj );

	    let targetElement = this.wrapper.find('.addfilter')[0];
	    if (obj === true) {
		$(targetElement).addClass("active");
	    } else {
		$(targetElement).removeClass("active");
	    }
	}
}

var sparkline_data_flag = 0;
function listControlCB(action, camera) {
	if (action === "statistics") {
	    let targetElement = this.wrapper.find('.linechart')[0];
	    targetElement.setSource( camera['token'], camera['src']['name'] );
            this.wrapper.addClass('showstat');
	} else if (action === "gotData") {
	    let targetElement = this.wrapper.find('.report_activitylist')[0];
	    let targetElementChart = this.wrapper.find('.linechart')[0];	    
	    let apiGetActivityFunc	= vxg.api.cloud.getEventslist;// vs_api.user.camera.event.list;
	    let somethingWrongFunc	= somethingWrong;
	    let controlCbFunc 		= listActivityCB;
	    
	    if (camera === null || camera === undefined) {
		//nodata comes, so stop activity loader by calling function w/o params
		targetElement.showActivityList();
	        targetElementChart.setSource();
	    } else {
		let allCamToken = (camera['allCamsToken'] !== undefined)? camera['allCamsToken'] : vxg.user.src.allCamsToken;
	    
		targetElement.showActivityList( camera['token'], allCamToken, apiGetActivityFunc.bind(this) , somethingWrong.bind(this), controlCbFunc.bind(this) );
	    }
	    
	    sparkline_data_flag = 0;
	} else if ((action === 'timeline') || (action === 'play') ) {
	    console.log('callbackFunc ' + action + 'with camera ' + camera['name'] );
	    
	    window.screens['tagsview'].camera = camera;
	    window.screens['tagsview'].activate(camera['token']);	    
	    
	    
	} else if (action === 'gotSparklineData') {
	    console.log('callbackFunc ' + action + 'with camera ' + camera['name'] );
	    let data = camera.sparklineData;
	    //<catching sparkline> Catch the first with some sparkline data to show at chart
	    //sparkline_data_flag - flag resulting catching 0 - nothing cathc, 1 - something catch
	    if (sparkline_data_flag == 0 
	    && data !== undefined) {
		for (i = 0; i < data.length; i++) {
		    if (data[i] > 0) {
			sparkline_data_flag = 1;
			break;
		    }
		}
		if (sparkline_data_flag == 1) {
		    let targetElement = this.wrapper.find('.linechart')[0];
		    targetElement.setSource( camera['token'], camera.src['name'] );
		}
	    }
	    //</catching sparkline>
	} else if (action === "settings") {
	    window.screens['camerasettings'].activate(camera['token']);
	} else if (action === "metadata") {
	    window.screens['camerameta'].activate(camera['token']);
	} else if (action === "add") {
	    addCamera();
	} else if (action === "remove") {
	    window.screens['removecamera'].activate(camera['token']);
	    console.log('TODO: remove camera ' + camera['name']);
	} else if (action === "configuration") {
	    window.screens['addcamera'].activate(camera['token']);
	    console.log('TODO: configure camera ' + camera['name']);
	}
}

function chartPointCB ( data ) {
	let start = data['start']/1000;
	let end   = data['end']/1000;
	let accessToken = data.vxgToken;
	
	if (start && end && accessToken) {
		window.screens['camerameta'].activate(accessToken, start, end);
	}
}

window.screens['reports'] = {
    'menu_weight': 10,
    'menu_name':'Reports',
    'get_args':function(){
    },
//  TODO:
//    'menu_toggle':true,
//    'menu_disabled':true,
    'menu_icon': path+'reports.svg',
    'menu_icon_hover': path+'reportsh.svg',
    'html': path+'reports.html',
    'css':[
	path+'reports.css', 
	path+'VXGCameraList/VXGCameraListList.css',
/*i need unload VXGActivityCollection if here, and load mutually exclusive VXGActivityList*/	
	path+'../../common/VXGActivity/VXGActivityList.css' 
    ],
    'stablecss':[ 
	path+'../chart/VXGChart/VXGChart.css',
	path+'VXGCameraList/VXGCameraList.css'
    ],
    'commoncss': [
	'VXGActivity/VXGActivity.css',
	'sdk/vxgwebsdk/bootstrap.min.css'
    ],
    'commonjs':[
	'sdk/vxgwebsdk/popper.min.js',
	'sdk/vxgwebsdk/bootstrap.min.js',
	'VXGActivity/VXGActivity.js'
    ],
    'js': [
	path+'sparkline/jquery.sparkline.min.js', 
	path+'../../common/chartJs/Chart.min.js',
	path+'VXGCameraList/VXGCameraList.js', 
	path+'../chart/VXGChart/VXGChart.js',
    ],
// Когда экран "активируется" - например вследствие нажатия меню
    'on_show':function(r){
	    let targetElement = this.wrapper.find('.cameralist')[0];
            this.wrapper.removeClass('showstat');
	    let apiGetCameraListFunc	//= vs_api.user.camera.list; 
					//= window.vxg.cameras.getCameraListPromise;
					= wrapRequest_cameraList_vxcore_to_vsapi;
	    let somethingWrongFunc	= somethingWrong;
	    let listControlCbFunc 	= listControlCB;
	    
	    targetElement.setSparklineSettings(8, 3600); //8bars over hour    
	    targetElement.showCameraList( apiGetCameraListFunc.bind(this) , somethingWrong.bind(this), listControlCbFunc.bind(this), true );

	    targetElement = this.wrapper.find('.addfilter')[0];
	    $(targetElement).removeClass("active");
	    
	    targetElement = this.wrapper.find('.report_activitylist')[0];
	    //simulate loading process, so start activity loader by calling function w/o params
	    targetElement.showActivityList();
	    
        return defaultPromise();
    },
// Когда экран "прячется" - например вследствие активации другого экрана
    'on_hide':function(){
//        alert('hide Test screen');
	let targetElement = this.wrapper.find('.report_activitylist')[0];
	targetElement.showVXGFilter(false);
    
    },
// Когда все скрипты и стили загружены
    'on_ready':function(){
//        alert('on_ready Test screen');
    },
// Когда скрипт инициализируется первый раз (чтоб не выполнять лишнюю работу, возможно даже не нужную пользователю)
    'on_init':function(){
    	    let targetElement = this.wrapper.find('.cameralist')[0];
	    let list_controller = new VXGCameraListController(targetElement);
	    targetElement.setSparklineSettings(8, 3600); //8bars over hour    


	    targetElement = this.wrapper.find('.linechart')[0];
	    var visualOptions = {};
	    visualOptions.color_of_average_curve = (window.skin)? window.skin.color_of_average_curve : "#00ff00";
	    visualOptions.color_of_min_curve = (window.skin)? window.skin.color_of_min_curve : "#ff0000";
	    visualOptions.color_of_max_curve = (window.skin)? window.skin.color_of_max_curve : "#0000ff";
	    visualOptions.show_meta_select = true;
	    visualOptions.show_report_select = true;
	    visualOptions.show_period_select = true;

	    var chart_controller = new VXGChartController(targetElement, "", "Person", visualOptions);
	    targetElement.setPointCallback(chartPointCB);
    
	    targetElement = this.wrapper.find('.report_activitylist')[0];
	    var activity_controller = new VXGActivityController(targetElement);
//	let targetElement = this.wrapper.find('.cameralist')[0];
//	let list_controller = new VXGCameraListController(targetElement);
//	targetElement = this.wrapper.find('.linechart')[0];
//	var chart_controller = new VXGChartController(targetElement);

		// set to list be default
		var viewType = sessionStorage.getItem("camerasView");
		if (viewType) $("." + viewType).addClass("active");
		else $(".cameras-list").addClass("active");

		$(".cameras-view").click(function() {
			$(this).addClass('active');

			if ($(this).hasClass('cameras-list')) { 
				$(".cameras-group").removeClass("active");
				sessionStorage.setItem("camerasView", "cameras-list");
			} else {
				$(".cameras-list").removeClass("active");
				sessionStorage.setItem("camerasView", "cameras-group");
			}

			location.reload();
		})
	
        return defaultPromise();
    }
    
};