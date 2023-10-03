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
    'menu_name':'Activity',
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
	'sdk/vxgwebsdk/popper.min.js',
	'sdk/vxgwebsdk/bootstrap.min.js',
	'VXGActivity/VXGActivity.js'
    ],
    'js': [
    ],
// Когда экран "активируется" - например вследствие нажатия меню
    'on_search':function(text){
        console.log("DEBUG: Activity search text:" + text );
        var search_obj = {};
        if (text.toLowerCase() === "motion"){
    	    search_obj.motion = true;
        } else {
	    search_obj.meta = true;
	    if (text && (text.length > 0)) {
		search_obj.label = text;
	    } else {
		search_obj.motion = true;
		search_obj.sound = true;
		search_obj.linecross = true;
	    }
        }
        
	targetElement = this.wrapper.find('.activity_activitylist')[0];
        targetElement.acceptVXGFilter(search_obj);
    },
    'on_before_show':function(r){
        if (this.from_back) return defaultPromise();;
        if (this.scroll_top!==undefined)
            delete this.scroll_top;

//        alert('show Testscreen');
	    targetElement = this.wrapper.find('.activity_activitylist')[0];
	    var activity_controller = new VXGActivityController(targetElement);
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
                        targetElement.showActivityList( token, allCamToken, apiGetActivityFunc.bind(this) , somethingWrong2.bind(this), controlCbFunc.bind(this),0,40,true);
                    });

		}else {
		    targetElement.showActivityList();
		}
	    }, function(r) {
		targetElement.showActivityList();
	    });
        return defaultPromise();
    },
    'on_show':function(r){
        if (core.elements['header-search']) core.elements['header-search'].find('input').val(this.search_text ? this.search_text : '');
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
														<span id="activityfilter-btn"> Filter</span>
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

            dialogs['mdialog'].activate(`
				<h7>Select motion filter</h7>
				<div>
					<ul class="activitylist">
						<li>
							<label class="filter-label custom-checkbox">
								<span>Motion</span>
								<input type="checkbox" `+(savedFilters.indexOf('motion')!==-1?'checked':'')+` name="motion">
								<span class="checkmark"></span>	
							</label>
						</li>
						<li>
							<label class="filter-label custom-checkbox">
								<span>Object detection</span>
								<input type="checkbox" `+(savedFilters.indexOf('object_and_scene_detection')!==-1?'checked':'')+` name="object_and_scene_detection">
								<span class="checkmark"></span>	
							</label>
						</li>
						<li>
							<label class="filter-label custom-checkbox">
								<span>People detection</span>
								<input type="checkbox" `+(savedFilters.indexOf('post_object_and_scene_detection')!==-1?'checked':'')+` name="post_object_and_scene_detection">
								<span class="checkmark"></span>		
							</label>
						</li>
					</ul>
				</div>
				<div>
					<button name="apply" class="vxgbutton-transparent" style="width:192px">Set</button>
				</div>`).then(function(r){
                if (!r || r.button!='apply') return;
				let f='';
                for (let i in r.form){
                    if (r.form[i]=='on') f += (f?',':'')+i;
                }
				if (f.split(",").length != 3) $('#activityfilter-btn').addClass("filterset");
				else $('#activityfilter-btn').removeClass("filterset");
				localStorage.setItem("activityFilter", f);
                window.skin.use_filter = f==''?'none':f;
                self.activate();
            });

        });
//        alert('on_ready Test screen');
    },
// Когда скрипт инициализируется первый раз (чтоб не выполнять лишнюю работу, возможно даже не нужную пользователю)
    'on_init':function(){
		var activityFilter = localStorage.getItem("activityFilter");
		window.skin.use_filter = activityFilter == null ? 'motion,object_and_scene_detection,post_object_and_scene_detection' : activityFilter;

		if (window.skin.use_filter.split(",").length != 3) $('#activityfilter-btn').addClass("filterset");
		else $('#activityfilter-btn').removeClass("filterset");

//        alert('on_init Test screen');
        return defaultPromise();
    }
};