window.screens = window.screens || {};
var path = window.core.getPath('activity.js');

function somethingWrong2( err ) {
	console.warn('Something wrong' + err);
}

function listActivityCB2( operation,  obj ) {
	$('.activity').not('.menu-item').removeClass('loader');

	if (!obj) return;

	let access_token = obj['access_token'];
	let time  = obj['time'];
	let camera = obj['camera'];
	
	if (operation === "event") {
	    console.log('callbackFunc ' + operation + ' with access_token ' + access_token + " byTime: " + time );
	    if (camera !== undefined && camera != null) {
		let token = camera.token;
		window.screens['tagsview'].camera = camera;
	        window.screens['tagsview'].activate(token, (new Date(time)).getTime(), 'noback');
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
			// localStorage.setItem("initialLoading", true);
        console.log("DEBUG: Activity search text:" + text );
		var search_obj = {};
        search_obj.meta = text;

	targetElement = this.wrapper.find('.activity_activitylist')[0];
	this.activate();
        // targetElement.acceptVXGFilter(search_obj);
    },
    'on_before_show':async function(r){
			const self = this;
			localStorage.setItem("page", "activity");
        if (this.from_back) return defaultPromise();;
        if (this.scroll_top!==undefined)
            delete this.scroll_top;

				const { data: lkey } = await vxg.api.cloudone.license();
				const aliasesRes = await vxg.api.cloud.getAliases(lkey);
				this.aliases = aliasesRes.objects.map(aliases => aliases.alias_name);

				const activityFilter = localStorage.getItem("activityFilter");
				const mergedAliasesAndEvents = [...this.aliases, ...this.events]
				if (activityFilter) window.skin.use_filter = activityFilter;
				else window.skin.use_filter = mergedAliasesAndEvents;


//        alert('show Testscreen');
	    targetElement = this.wrapper.find('.activity_activitylist')[0];
	    var activity_controller = new VXGActivityController(targetElement);

			// localStorage.setItem("initialLoading", true);
			// targetElement.showActivityList();
	    
	    let allCamToken	= vxg.user.src.allCamsToken;
		if (localStorage.cameraList) {
			var cameraList = JSON.parse(localStorage.cameraList).objects;
			var cameras = cameraList.map(cam => {
				var newCam = new vxg.cameras.objects.Camera(cam.token ? cam.token : cam.id);
				newCam.src = cam;
				return newCam;
			})
			
			if (cameras.length > 0) {
				let camera0	= cameras[0];
				
				let apiGetActivityFunc	= vxg.api.cloud.getEventslist;// vs_api.user.camera.event.list;
				somethingWrongFunc	= somethingWrong2;
				let controlCbFunc 	= listActivityCB2;
				targetElement.setCameraArray(cameras);
						camera0.getToken().then(function(token){
													localStorage.setItem("initialLoading", true);
													targetElement.showActivityList( token, allCamToken, apiGetActivityFunc.bind(this) , somethingWrong2.bind(this), controlCbFunc.bind(this),0,200,true, true, null);
						});
	
			} else {
				targetElement.showActivityList();
			}
		} else {
			vxg.cameras.getFullCameraList(500, 0).then(function (answer) {
				if (answer.length > 0) {
					let camera0	= answer[0];
					
					let apiGetActivityFunc	= vxg.api.cloud.getEventslist;// vs_api.user.camera.event.list;
					somethingWrongFunc	= somethingWrong2;
					let controlCbFunc 	= listActivityCB2;
					targetElement.setCameraArray(answer);
							camera0.getToken().then(function(token){
														localStorage.setItem("initialLoading", true);
														targetElement.showActivityList( token, allCamToken, apiGetActivityFunc.bind(this) , somethingWrong2.bind(this), controlCbFunc.bind(this),0,200,true);
							});
		
				}else {
					targetElement.showActivityList();
				}
			});
		}
        return defaultPromise();
    },
    'on_show':function(r){
			$('.activity').not('.menu-item').addClass('loader');
		core.elements['header-search'].show();
		$('.mainsearch').find('input').attr("placeholder", "Search Tags");
        if (core.elements['header-search']) core.elements['header-search'].find('input').val(localStorage.getItem('activityTextFilter') ?? window.skin.use_text_filter);
        if (this.scroll_top!==undefined)
            $('.screens').scrollTop(this.scroll_top);
        return defaultPromise();
    },
// Когда экран "прячется" - например вследствие активации другого экрана
    'on_hide':function(){
        localStorage.setItem("eventsList", false);
        this.scroll_top = $('.screens').scrollTop();
	let targetElement = core.elements['header-search'].find('input')[0];
	if (targetElement !== undefined) {
	    targetElement.value = "";
	}

//        alert('hide Test screen');
    },
// Когда все скрипты и стили загружены <i class="fa fa-filter" aria-hidden="true"></i>

    'on_ready': async function(){
        let self = this;
        core.elements['header-right'].prepend(`<div class="activityfilterContainer">
													<div class="transparent-button activityfilter">
														<button id="activityfilter-btn" class="vxgfilterbtn"> ${$.t('action.filter')}</button>
													</div>
												</div>`);
		

		
        core.elements['header-right'].find('.activityfilterContainer .activityfilter').click(async function(){

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
*/			var cameras;
			if (localStorage.cameraList) {
				var cameraList = JSON.parse(localStorage.cameraList).objects;
				cameras = cameraList.map(cam => {
					var newCam = new vxg.cameras.objects.Camera(cam.token ? cam.token : cam.id);
					newCam.src = cam;
					return newCam;
				})
			} else {
				cameras = await vxg.cameras.getFullCameraList(500, 0);
			}

			let activityCamera1Filter = localStorage.getItem("activityCamera1Filter") ?? window.skin.use_camera1_filter;
			let htmlCamera = '<option></option>';
			for (let i = 0; i < cameras.length; i++) {
				htmlCamera += `<option value="${cameras[i].src.id}" ${cameras[i].src.id == activityCamera1Filter ? 'selected' : ''}>${cameras[i].src.name}</option>`;
			}

			var activityTimeFilter = localStorage.getItem("activityTimeFilter") ?? window.skin.use_time_filter;
			let timeFilterDatetime;
			if (activityTimeFilter) {
				timeFilterDatetime = new Date(activityTimeFilter);
				timeFilterDatetime.setMinutes(timeFilterDatetime.getMinutes() - timeFilterDatetime.getTimezoneOffset());
			}

			// let buttonClass = '';
			// if (isEmpty(window.skin.use_camera1_filter) && isEmpty(window.skin.use_filter) && isEmpty(window.skin.use_time_filter)) {
			// 	buttonClass = 'unset';
			// } else {
			// 	buttonClass = 'set';
			// }

			// const { data: lkey } = await vxg.api.cloudone.license();
			// const aliasesRes = await vxg.api.cloud.getAliases(lkey);
			// const aliases = aliasesRes.objects.map(aliases => aliases.alias_name)
			// console.log(aliases);

			var activityFilter = localStorage.getItem("activityFilter");
			var savedFiltersStr = activityFilter == null ? window.skin.use_filter : activityFilter;
			var savedFilters = savedFiltersStr ? savedFiltersStr.split(',') : [];
			const mergedAliasesAndEvents = [...self.aliases, ...self.events];
			var defaultFilters = mergedAliasesAndEvents.join(',');
			var customFiltersList = savedFilters.filter(f => !defaultFilters.includes(f) );
			var customFilterString = "";
			customFiltersList.forEach(c => { customFilterString += (customFilterString?', ':'')+c; });

            dialogs['mdialog'].activate(`
				<h7 data-i18n="activity.selectFilter" class="font-md">${$.t('activity.selectFilter')}</h7>
				<div class="filter-box">
					<div class="camera-filter-cont">
						<div class="camera-select-cont">
								<label class="camera-filter-label font-md" for="filter-camera-select" data-i18n="activity.eventCameraLabel">${$.t('activity.eventCameraLabel')}</label>
								<select class="camera-select" id="filter-camera-select" name="filter-camera-select">${htmlCamera}</select>
						</div>
					</div>
					<div class="time-filter-cont">
						<div class="time-input-cont">
								<label class="time-filter-label font-md" for="filter-time-input" data-i18n="activity.eventEndTimeLabel">${$.t('activity.eventEndTimeLabel')}</label>
								<input class="time-input" id="filter-time-input" type="datetime-local" name="filter-time-input" value="${timeFilterDatetime ? timeFilterDatetime.toISOString().slice(0, 16) : ''}"/>
						</div>
					</div>
					<div class="type-filter-cont">
						<label class="type-filter-label font-md" data-i18n="activity.eventTypeLabel">${$.t('activity.eventTypeLabel')}</label>
						<ul class="activitylist">

							${
								mergedAliasesAndEvents.map(name => (
									`
									<li>
										<label class="filter-label custom-checkbox">
											<span>${$.t(`common.eventTypes.${name}`)}</span>
											<input type="checkbox" `+(savedFilters.indexOf(name)!==-1?'checked':'')+` name=${name}>
											<span class="checkmark"></span>		
										</label>
									</li>
									`
								)).join('')
							}

							<li>
								<p class="custom-input-label">${$.t('activity.customEventList')}</p>
								<input type="text" class="custom-filter-input" name="custom_filter_list" value="${customFilterString}">
							</li>
						</ul>
					</div>
				</div>
				<div class="filter-button-container">
					<button name="clear" class="vxgbutton">${$.t('action.clear')}</button>
					<button name="apply" class="vxgbutton">${$.t('action.set')}</button>
				</div>`).then(function(r){
					if (r && r.button === 'apply') {
						let f='';
						let customFilterArr = r.form.custom_filter_list ? r.form.custom_filter_list.split(',') : [];
						for (let c in customFilterArr) { f += (f?',':'')+customFilterArr[c].trim(); }
										for (let i in r.form){ if (r.form[i]=='on') f += (f?',':'')+i; }
						
						localStorage.setItem("activityFilter", f);
										window.skin.use_filter = f;
		
										let camId = r.form['filter-camera-select'];
						localStorage.setItem("activityCamera1Filter", camId);
						window.skin.use_camera1_filter = camId;
		
						let endTime = r.form['filter-time-input'];
					let utcTime = endTime ? new Date(endTime).toISOString() : '';
					localStorage.setItem("activityTimeFilter", utcTime);
					window.skin.use_time_filter = utcTime;
		
					if (isEmpty(window.skin.use_camera1_filter) && isEmpty(window.skin.use_filter) && isEmpty(window.skin.use_time_filter)) {
						$('#activityfilter-btn').removeClass("set");
						$('#activityfilter-btn').addClass("unset");
					} else {
						$('#activityfilter-btn').addClass("set");
						$('#activityfilter-btn').removeClass("unset");
					}
		
						// localStorage.setItem("initialLoading", true);
										self.activate();
					} else if (r && r.button === 'clear') {
						localStorage.setItem("activityFilter", '');
						window.skin.use_filter = '';
						localStorage.setItem("activityCamera1Filter", '');
						window.skin.use_camera1_filter = '';
						localStorage.setItem("activityTimeFilter", '');
						window.skin.use_time_filter = '';
						// localStorage.setItem("initialLoading", true);
						$('#activityfilter-btn').removeClass("set");
						$('#activityfilter-btn').addClass("unset");
						self.activate();
					}
            });
				$("#filter-time-input").flatpickr({enableTime: true,
					dateFormat: "Y-m-d H:i"});
        });

//        alert('on_ready Test screen');
    },
// Когда скрипт инициализируется первый раз (чтоб не выполнять лишнюю работу, возможно даже не нужную пользователю)
    'on_init':function(){
			localStorage.setItem("activityTimeFilter", '');
			window.skin.use_time_filter = localStorage.getItem("activityTimeFilter");
			window.skin.use_camera1_filter = localStorage.getItem("activityCamera1Filter");
			window.skin.use_filter = localStorage.getItem("activityFilter");
			if (isEmpty(window.skin.use_camera1_filter) && isEmpty(window.skin.use_filter) && isEmpty(window.skin.use_time_filter)) {
				$('#activityfilter-btn').removeClass("set");
				$('#activityfilter-btn').addClass("unset");
			} else {
				$('#activityfilter-btn').addClass("set");
				$('#activityfilter-btn').removeClass("unset");
			}
//        alert('on_init Test screen');
        return defaultPromise();
    },
		aliases: [],
		events: ['network', 'object_and_scene_detection', 'search_multiple_users_in_image_v2']
};

const isEmpty = value => {
	return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}