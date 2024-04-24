window.screens = window.screens || {};
var path = window.core.getPath('activity.js');

function somethingWrong2( err ) {
	console.warn('Something wrong' + err);
}

function listActivityCB2( operation,  obj ) {
	let access_token = obj['access_token'];
	let time  = obj['time'];
	let camera = obj['camera'];
	
	if (operation === "event") {
	    console.log('callbackFunc ' + operation + ' with access_token ' + access_token + " byTime: " + time );
	    if (camera !== undefined && camera != null) {
		let token = camera.token;
		window.screens['tagsview'].camera = camera;
	        window.screens['tagsview'].activate(token, (new Date(time)).getTime());
	    }	
	} else if (operation === "meta") {
	    if (camera !== undefined && camera != null) {
		let token = camera.token;
		window.screens['camerametaview'].activate(token, obj.eventid, obj.ai_type);
	    }
	}
}

window.screens['activity'] = {
    'menu_weight':50,
    'menu_name': $.t('activity.title'),
    'get_args':function(){
    },
//  TODO:
//    'menu_toggle':true,
//    'menu_disabled':true,
    'menu_icon': '<i class="fa fa-eye" aria-hidden="true"></i>',
    'html': path+'activity.html',
    'css':[path+'activity.css',
/*i need unload VXGActivityList if here, and load mutually exclusive VXGActivityCollection*/
	path+'../../common/VXGActivity/VXGActivityCollection.css',
    ],
    'stablecss':[
    ],
    'commoncss':[
	'VXGActivity/VXGActivity.css'
    ],
    'commonjs':[
	'VXGActivity/VXGActivity.js'
    ],
    'js': [
    ],
// Когда экран "активируется" - например вследствие нажатия меню
    'on_search':function(text){
			localStorage.setItem("activityTextFilter", text);
      window.skin.use_text_filter = text;
			localStorage.setItem("initialLoading", true);
        console.log("DEBUG: Activity search text:" + text );
		var search_obj = {};
        search_obj.meta = text;

	targetElement = this.wrapper.find('.activity_activitylist')[0];
	this.activate();
        // targetElement.acceptVXGFilter(search_obj);
    },
    'on_before_show':function(r){
			localStorage.setItem("page", "activity");
        if (this.from_back) return defaultPromise();;
        if (this.scroll_top!==undefined)
            delete this.scroll_top;

//        alert('show Testscreen');
	    targetElement = this.wrapper.find('.activity_activitylist')[0];
	    var activity_controller = new VXGActivityController(targetElement);

			localStorage.setItem("initialLoading", true);
			targetElement.showActivityList();
	    
	    let allCamToken	= vxg.user.src.allCamsToken;
	    window.vxg.cameras.getCameraListPromise(100, 0).then(function (answer) {
		if (answer.length > 0) {
		    let camera0	= answer[0];
		    
		    let apiGetActivityFunc	= vxg.api.cloud.getEventslist;// vs_api.user.camera.event.list;
		    somethingWrongFunc	= somethingWrong2;
		    let controlCbFunc 	= listActivityCB2;
		    targetElement.setCameraArray(answer);
                    camera0.getToken().then(function(token){
												localStorage.setItem("initialLoading", true);
												targetElement.showActivityList( token, allCamToken, apiGetActivityFunc.bind(this) , somethingWrong2.bind(this), controlCbFunc.bind(this),0,200,true, true);
                    });

		}else {
				localStorage.setItem("initialLoading", true);
		    targetElement.showActivityList();
		}
	    }, function(r) {
		localStorage.setItem("initialLoading", true);
		targetElement.showActivityList();
	    });
        return defaultPromise();
    },
    'on_show':function(r){
		core.elements['header-search'].show();
		$('.mainsearch').find('input').attr("placeholder", "Search Tags");
        if (core.elements['header-search']) core.elements['header-search'].find('input').val(localStorage.getItem('activityTextFilter') ?? window.skin.use_text_filter);
        if (this.scroll_top!==undefined)
            $('.screens').scrollTop(this.scroll_top);
        return defaultPromise();
    },
// Когда экран "прячется" - например вследствие активации другого экрана
    'on_hide':function(){
        this.scroll_top = $('.screens').scrollTop();
	let targetElement = core.elements['header-search'].find('input')[0];
	if (targetElement !== undefined) {
	    targetElement.value = "";
	}

//        alert('hide Test screen');
    },
// Когда все скрипты и стили загружены <i class="fa fa-filter" aria-hidden="true"></i>

    'on_ready':function(){
        let self = this;
        core.elements['header-right'].prepend(`<div class="activityfilterContainer">
													<div class="transparent-button activityfilter">
														<span id="activityfilter-btn"> ${$.t('action.filter')}</span>
													</div>
												</div>`);
		

		
        core.elements['header-right'].find('.activityfilterContainer .activityfilter').click(function(){

/*
	case "yolov4_detection":
	case "object_and_scene_detection":
	    name="Object detection";break;
	case "facial_analysis":
	    name="AWS image facial analysis";break;
	case "motion":
	    name="Motion";break;
	case "sound":
	    name="Sound";break;
	case "linecross":
	    name="Line cross";break;
*/			

			var activityFilter = localStorage.getItem("activityFilter");
			var savedFiltersStr = activityFilter == null ? window.skin.use_filter : activityFilter;
			var savedFilters = savedFiltersStr.split(',');
			var defaultFilters = "motion,object_and_scene_detection,post_object_and_scene_detection,network,vehicle_stopped_detection,plate_recognition,crowd_detection";
			var customFiltersList = savedFilters.filter(f => !defaultFilters.includes(f) );
			var customFilterString = "";
			customFiltersList.forEach(c => { customFilterString += (customFilterString?', ':'')+c; });

            dialogs['mdialog'].activate(`
				<h7 data-i18n="activity.selectMotionFilter" class="font-md">${$.t('activity.selectMotionFilter')}</h7>
				<div>
					<ul class="activitylist">
						<li>
							<label class="filter-label custom-checkbox">
								<span>${$.t('common.eventTypes.motion')}</span>
								<input type="checkbox" `+(savedFilters.indexOf('motion')!==-1?'checked':'')+` name="motion">
								<span class="checkmark"></span>	
							</label>
						</li>
						<li>
							<label class="filter-label custom-checkbox">
								<span>${$.t('common.eventTypes.objectDetection')}</span>
								<input type="checkbox" `+(savedFilters.indexOf('object_and_scene_detection')!==-1?'checked':'')+` name="object_and_scene_detection">
								<span class="checkmark"></span>	
							</label>
						</li>
						<li>
							<label class="filter-label custom-checkbox">
								<span>${$.t('common.eventTypes.peopleDetection')}</span>
								<input type="checkbox" `+(savedFilters.indexOf('post_object_and_scene_detection')!==-1?'checked':'')+` name="post_object_and_scene_detection">
								<span class="checkmark"></span>		
							</label>
						</li>
						<li>
							<label class="filter-label custom-checkbox">
								<span>${$.t('common.eventTypes.network')}</span>
								<input type="checkbox" `+(savedFilters.indexOf('network')!==-1?'checked':'')+` name="network">
								<span class="checkmark"></span>		
							</label>
						</li>
						<li>
							<label class="filter-label custom-checkbox">
								<span>${$.t('common.eventTypes.vehicleStopped')}</span>
								<input type="checkbox" `+(savedFilters.indexOf('vehicle_stopped_detection')!==-1?'checked':'')+` name="vehicle_stopped_detection">
								<span class="checkmark"></span>		
							</label>
						</li>
						<li>
							<label class="filter-label custom-checkbox">
								<span>${$.t('common.eventTypes.LPR')}</span>
								<input type="checkbox" `+(savedFilters.indexOf('plate_recognition')!==-1?'checked':'')+` name="plate_recognition">
								<span class="checkmark"></span>		
							</label>
						</li>
						<li>
							<label class="filter-label custom-checkbox">
								<span>${$.t('common.eventTypes.crowd')}</span>
								<input type="checkbox" `+(savedFilters.indexOf('crowd_detection')!==-1?'checked':'')+` name="crowd_detection">
								<span class="checkmark"></span>		
							</label>
						</li>
						<li>
							<p class="custom-input-label">${$.t('activity.customEventList')}</p>
							<input type="text" class="custom-filter-input" name="custom_filter_list" value="${customFilterString}">
						</li>
					</ul>
				</div>
				<div>
					<button name="apply" class="vxgbutton" style="width:100%">${$.t('action.set')}</button>
				</div>`).then(function(r){
                if (!r || r.button!='apply') return;
				let f='';
				let customFilterArr = r.form.custom_filter_list ? r.form.custom_filter_list.split(',') : [];
				for (let c in customFilterArr) { f += (f?',':'')+customFilterArr[c].trim(); }
                for (let i in r.form){ if (r.form[i]=='on') f += (f?',':'')+i; }
				if (f.split(",").length != 3) $('#activityfilter-btn').addClass("filterset");
				else $('#activityfilter-btn').removeClass("filterset");
				localStorage.setItem("activityFilter", f);
                window.skin.use_filter = f;
								localStorage.setItem("initialLoading", true);
                self.activate();
            });
        });

		vxg.cameras.getFullCameraList(500, 0).then(function(cameras) {
			var activityCamera1Filter = localStorage.getItem("activityCamera1Filter") ?? window.skin.use_camera1_filter;
			let el = $("#filter-camera-select");
			let html = '<option></option>';
			for (let i = 0; i < cameras.length; i++) {
				html += `<option value="${cameras[i].src.id}" ${cameras[i].src.id === activityCamera1Filter ? 'selected' : ''}>${cameras[i].src.name}</option>`;
			}
			el.html(html);
			$("#set-camera-filter").on("click", function() {
				let camId = $("#filter-camera-select").val();
				localStorage.setItem("activityCamera1Filter", camId);
				localStorage.setItem("initialLoading", true);
				window.skin.use_camera1_filter = camId;
				self.activate();
			});
		});

		$("#set-time-filter").on("click", function() {
			var endTime = $("#filter-time-input").val();
			var utcTime = endTime ? new Date(endTime).toISOString() : '';
			localStorage.setItem("activityTimeFilter", utcTime);
			localStorage.setItem("initialLoading", true);
			window.skin.use_time_filter = utcTime;
			self.activate();
		});

		$("#filter-time-input").flatpickr({enableTime: true,
			dateFormat: "Y-m-d H:i"});

//        alert('on_ready Test screen');
    },
// Когда скрипт инициализируется первый раз (чтоб не выполнять лишнюю работу, возможно даже не нужную пользователю)
    'on_init':function(){
		var activityFilter = localStorage.getItem("activityFilter");
		window.skin.use_filter = activityFilter == null ? '' : activityFilter;

		if (window.skin.use_filter.split(",").length != 3) $('#activityfilter-btn').addClass("filterset");
		else $('#activityfilter-btn').removeClass("filterset");

		var activityTimeFilter = localStorage.getItem("activityTimeFilter") ?? window.skin.use_time_filter;
		if (activityTimeFilter) {
			var timeFilterDatetime = new Date(activityTimeFilter);
			timeFilterDatetime.setMinutes(timeFilterDatetime.getMinutes() - timeFilterDatetime.getTimezoneOffset());
			$('#filter-time-input').val(timeFilterDatetime.toISOString().slice(0,16));
		}
		window.skin.use_time_filter = activityTimeFilter == null ? '' : activityTimeFilter;

//        alert('on_init Test screen');
        return defaultPromise();
    }
};