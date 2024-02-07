/*-------MODEL-------*/
var VXGActivityModel = function VXGActivityModel() {
};

VXGActivityModel.prototype.getData = function getData( params, updateDataCBFunc, waitFunc, apiFunc, apiWrongFunc ) {

    //let accesToken	= params["roToken"];
    let requestParams	= params["requestParams"];
    let prevOffset 	= requestParams["offset"];

    waitFunc(true);

	// Konst We need to change requestParams on parameters and change API a little bit 
    apiFunc (requestParams['token'], requestParams['limit'], requestParams['offset'], requestParams ).done(function (eventlist) {
	waitFunc(false);
	params.requestParams.offset = prevOffset;
	updateDataCBFunc(params, eventlist['objects'])
    }).fail(function (r) {
	waitFunc(false);        
	console.error(r);
	apiWrongFunc(r);
    });
}

/*-------VIEW--------*/

var VXGActivityView = function VXGActivityView(element) {
    this.element = element;
};

VXGActivityView.prototype.capitalizeFirstLetter = function(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

VXGActivityView.prototype.initDraw = function initDraw(controller) {

    this.element.innerHTML = 
    	'<div class= "VXGActivityContainer">'
    +	'	<div class= "VXGActivityContainer2">'    	
    +	'		<div class="activity-content">'
    +	'			<div class="feed-activity-list"></div>'
    +	`			<div class="d-flex w-100"><div class="VXGActivityMore vxgbutton-transparent">${$.t('common.more')}...</div></div>`
    +	'		</div>'
    +	'		<div class="VXGActivityFilter">'
    +	'			<div class="VXGActivityFilterTable">'
    +	`			<h6>${$.t('common.filters')}</h6><br>`
    +	'				<div class="table-row filter-setting">'
    +	`					<div class="filter-label">${$.t('common.motion')}</div>`
    +	'					<div><input id="filter-motion" type="checkbox" class="VXGActivityFilterCheckbox VXGActivityFilterMotion" checked> <label for="filter-motion"></label></div>'
    +	'				</div>'
    +	'				<div class="table-row filter-setting">'
    +	`					<div class="filter-label">${$.t('common.meta')}</div>`
    +	'					<div><input id="filter-meta" type="checkbox" class="VXGActivityFilterCheckbox VXGActivityFilterMeta" checked> <label for="filter-meta"></label></div>'
    +	'				</div>'
    +	`				<div class="filter-setting flex"><div class="filter-label">${$.t('activity.peopleThreshold')}</div>`
    +	'					<div>'
    +	'						<div class="VXGActivityDropMenu btn-group count-type" >'
    +	'							<div tabindex="0" data-solution="-1" class="VXGActivityFilterPersonSolution menu" style="width:50px;"><span></span>' 
    +	'<ul id="count-type" class="menu-dropdown" data-who="Person">'
    +	'								<li><span data-solution="-1">&le;</span></li>'
    +	'								<li><span data-solution="1">&gt;</span></li>'
    +	'								<li><span data-solution="0">=</span></li>'
    +	'							</ul>'
    +	'</div>'
    +	'						</div>'
    +	'					</div>'
    +	`					<div><input type="number" class="VXGActivityFilterPersonVal" placeholder="${$.t('activity.peopleThresholdPlaceholder')}"/></div>`
    +	'				</div>'
    +	`				<div class="filter-setting flex"><div class="filter-label">${$.t('activity.carsThreshold')}</div>`
    +	'					<div>'
    +	'						<div class="VXGActivityDropMenu btn-group count-type">'
    +	'							<div tabindex="0" data-solution="-1" class="VXGActivityFilterCarSolution menu" style="width:50px;"><span></span>' +
		'<ul id="count-type" class="menu-dropdown" data-who="Car">'
		+	'								<li><span data-solution="-1">&le;</span></li>'
		+	'								<li><span data-solution="1">&gt;</span></li>'
		+	'								<li><span data-solution="0">=</span></li>'
		+	'							</ul>' +
		'</div>'
    +	'						</div>'
    +	'					</div>'
    +	`					<div><input type="number" class="VXGActivityFilterCarVal" placeholder="${$.t('activity.carsThresholdPlaceholder')}"/></div>`
    +	'				</div>'
/*    +	'				<div class="filter-setting"><div class="filter-label">Label</div><div><input type="text" class="VXGActivityFilterLabelVal" placeholder="enter label"></div></div>'
*/
    +	'				<div><div><center style="padding-top: 20px;">'
    +	`					<span class="VXGActivityFilterAccept vxgbutton-transparent">${$.t('action.apply')}</span>`
    +	`					<span class="VXGActivityFilterCancel vxgbutton-transparent">${$.t('action.cancel')}</span>`
    +	`					<span class="VXGActivityFilterClear vxgbutton-transparent">${$.t('common.default')}</span>`
    +	'				</center></div></div>'
    +	'			</div>'
    +	'		</div>'
    +	`		<div class="VXGActivityNoEvents"><span>${$.t('activity.noEvents')}</span></div>`
    +	'		<div class="VXGActivityWaiter"></div>'
    +	'	</div>'
    +	'</div>';
    let element = this.element;
    
    this.more		= this.element.getElementsByClassName('VXGActivityMore')[0]; 
    this.container	= this.element.getElementsByClassName('VXGActivityContainer')[0]; 
    this.waiter		= this.element.getElementsByClassName('VXGActivityWaiter')[0]; 
    this.noevents	= this.element.getElementsByClassName('VXGActivityNoEvents')[0]; 
    this.filterview	= this.element.getElementsByClassName('VXGActivityFilter')[0]; 
    let self		= this;
    
    let dropmenu = this.element.getElementsByClassName('VXGActivityDropMenu');
    $.each(dropmenu, function(){
	$(this).on('click', '#count-type li', function () {
		let val = $(this).closest('div').blur().find('> span');
		let mainbtn = $(this).closest('div').blur();
		$(val).text($(this).text());
		let solval = $(this).find('> span').data('solution');
		mainbtn.attr('data-solution', solval);
	});
    });

    var met = this.element.getElementsByClassName('VXGActivityFilterMeta')[0]; 
    $(met).off().on ('click', function() {
	let table	= $(this).parent().parent().parent().parent();

	let metValElem  = table.find('.VXGActivityFilterMeta');
	let metVal	= $(metValElem[0]).is(":checked")? true : false;

	let carSolElem	= table.find('.VXGActivityFilterCarSolution');
	let carValElem	= table.find('.VXGActivityFilterCarVal');
	let perSolElem	= table.find('.VXGActivityFilterPersonSolution');
	let perValElem	= table.find('.VXGActivityFilterPersonVal');
	let perSolSpan = $(perSolElem[0]).find('> span');
	let carSolSpan = $(carSolElem[0]).find('> span');

	if (metVal == false) {
	    carSolSpan.text('≤');
	    $(carSolElem[0]).attr('data-solution', -1);
	    $(carValElem[0]).val("");
	
	    $(perSolElem[0]).attr('data-solution', -1);
	    $(perValElem[0]).val("");
	    perSolSpan.text('≤');
	    
	    $(perSolElem[0]).attr({'disabled': 'disabled' });
	    $(carSolElem[0]).attr({'disabled': 'disabled' });
	    $(perValElem[0]).attr({'disabled': 'disabled' });
	    $(carValElem[0]).attr({'disabled': 'disabled' });
	} else {
	    $(perSolElem[0]).removeAttr('disabled');
	    $(carSolElem[0]).removeAttr('disabled');
	    $(perValElem[0]).removeAttr('disabled');
	    $(carValElem[0]).removeAttr('disabled');
	}
    });

    var btn = this.element.getElementsByClassName('VXGActivityFilterAccept')[0]; 
    
    $(btn).off().on ('click', function() {
	console.log("Filter accept click");
	//TODO filter accept
	let table	= $(this).parent().parent().parent().parent();


	let metValElem  = table.find('.VXGActivityFilterMeta');
	let motValElem  = table.find('.VXGActivityFilterMotion');
	let carSolElem	= table.find('.VXGActivityFilterCarSolution');
	let carValElem	= table.find('.VXGActivityFilterCarVal');
	let perSolElem	= table.find('.VXGActivityFilterPersonSolution');
	let perValElem	= table.find('.VXGActivityFilterPersonVal');
	let lblValElem	= table.find('.VXGActivityFilterLabelVal');
	
	let motVal	= $(motValElem[0]).is(":checked")? true : false;
	let metVal	= $(metValElem[0]).is(":checked")? true : false;

	let carSol	= $(carSolElem[0]).attr('data-solution');
	let carVal	= $(carValElem[0]).val();
	let perSol	= $(perSolElem[0]).attr('data-solution');
	let perVal	= $(perValElem[0]).val();
	let lblVal	= $(lblValElem[0]).val();
	
	var isFilterChanged = false;
	
	self.filter = {
	    motion: motVal,
	    meta: metVal
	}
	if (motVal == false) {
	    isFilterChanged = true;
	}

	if (metVal == false) {
	    isFilterChanged = true;
	}
/*
	if (lblVal !== "") {
	    self.filter.label = lblVal;
	    isFilterChanged = true;
	}
*/	
	if (perVal !== "") {
	    self.filter.personVal = perVal;
	    self.filter.personFlt = perSol;
	    isFilterChanged = true;
	}
	if (carVal !== ""){
	    self.filter.carVal = carVal;
	    self.filter.carFlt = carSol;
	    isFilterChanged = true;
	}
	self.callbackFunc("filterChanged", isFilterChanged);
	
	controller.acceptVXGFilter(self.filter);
	controller.showVXGFilter(false);
    });
    btn = this.element.getElementsByClassName('VXGActivityFilterCancel')[0]; 
    $(btn).off().on ('click', function() {
	console.log("Filter cancel click");    
	controller.showVXGFilter(false);
    });
    btn = this.element.getElementsByClassName('VXGActivityFilterClear')[0]; 
    $(btn).off().on ('click', function() {
	self.clearFilterForm();
    });
    
    let emptyModel = [];
    this.render(controller, emptyModel);
}

VXGActivityView.prototype.ActivitiesList_resolve_name = function ActivitiesList_resolve_name(event_name){
    var name = "";
    switch(event_name) {
	case "yolov4_detection":
	case "object_and_scene_detection":
	    name=$.t('common.eventTypes.objectDetection');break;
	case "post_object_and_scene_detection":
	    name=$.t('common.eventTypes.peopleDetection');break;
	case "facial_analysis":
	    name=$.t('common.eventTypes.awsImageFacialAnalysis');break;
	case "motion":
	    name=$.t('common.eventTypes.motion');break;
	case "sound":
	    name=$.t('common.eventTypes.sound');break;
	case "linecross":
	    name=$.t('common.eventTypes.lineCross');break;
	case "network":
		name=$.t('common.eventTypes.network');break;
	case "vehicle_stopped_detection":
		name=$.t('common.eventTypes.vehicleStopped');break;
	case "crowd_detection":
		name=$.t('common.eventTypes.crowd');break;
	case "plate_recognition":
		name=$.t('common.eventTypes.LPR');break;
	default:
	    name=event_name;break;
    }
    return name;
}

VXGActivityView.prototype.ActivitiesList_resolve_status = function ActivitiesList_resolve_status(event_status){
	var status = "";
	switch(event_status) {
	case "not_handled":
		status=$.t('common.eventStatuses.new');break;
	case "in_progress":
		status=$.t('common.eventStatuses.inProgress');break;
	case "processed":
		status=$.t('common.eventStatuses.completed');break;
	default:
		status=event_status;break;
	}
	return status;
}

VXGActivityView.prototype.ActivitiesList_get_meta = function ActivitiesList_get_meta(event, additional_search){
    if (!event.hasOwnProperty('meta'))
	return "";

    var output = ""; 
    if (event.name === "object_and_scene_detection" || event.name === "yolov4_detection") {   
	if (event.meta.hasOwnProperty('Person') && event.meta.Person > 0)
	    output += `${$.t('common.persons').toLowerCase()}: ` + event.meta.Person + " ";
	if (event.meta.hasOwnProperty('Car') && event.meta.Car > 0)
	    output += `${$.t('common.cars').toLowerCase()}: ` + event.meta.Car + " ";

	if ( additional_search !== undefined  
	&& event.meta.hasOwnProperty(additional_search)
	){
	    output =  additional_search + ((event.meta[additional_search] !== undefined && parseInt(event.meta[additional_search]) > 0 ) ? (" : " +event.meta[additional_search]) : (""));
	}
    }
    return this.capitalizeFirstLetter(output);
}

VXGActivityView.prototype.ActivitiesList_filter = function ActivitiesList_filter(self=this, event){
    if (self.filter === undefined
    || self.filter == null
    ) {
	return true;
    }

//    if (!event.hasOwnProperty('meta') && (self.filter.motion == true) ) {
    if ( self.filter.motion == true && event.name === 'motion' ) {
	return true;
    }

    if (event.name === "object_and_scene_detection" || event.name === "yolov4_detection") {     
	if (
	    self.filter.personVal === undefined 
	&&  self.filter.personFlt === undefined
	&&  self.filter.carVal === undefined 
	&&  self.filter.carFlt === undefined
	&&  self.filter.label === undefined
	) {
	    return true;
	}
    
    
	var ret_val = false;
	if (self.filter.personVal !== undefined 
	&&  self.filter.personFlt !== undefined
	){
	    if (self.filter.personFlt == -1 ) {
		if ( (event.meta.hasOwnProperty('Person') && event.meta.Person <= parseInt(self.filter.personVal) && event.meta.Person > 0) 
		 ) {
		    ret_val = true;
		}
	    } else if (self.filter.personFlt == 0 ) {
		if ( (event.meta.hasOwnProperty('Person') && event.meta.Person == parseInt(self.filter.personVal))
		) {
		    ret_val = true;
		}
	    } else if (self.filter.personFlt == 1 ) {
		if ( ( event.meta.hasOwnProperty('Person') && event.meta.Person > parseInt(self.filter.personVal))
		) {
		    ret_val = true;
		}
	    }
	} 
	if (self.filter.carVal !== undefined 
	&&  self.filter.carFlt !== undefined
	){
	    if (self.filter.carFlt == -1 ) {
		if (( event.meta.hasOwnProperty('Car') && event.meta.Car <= parseInt(self.filter.carVal) && event.meta.Car > 0) 
		) {
		    ret_val = true;
		}
	    } else if (self.filter.carFlt == 0 ) {
		if (( event.meta.hasOwnProperty('Car') && event.meta.Car == parseInt(self.filter.carVal)) 
		){
		    ret_val = true;
		}
	    } else if (self.filter.carFlt == 1 ) {
		if (( event.meta.hasOwnProperty('Car') && event.meta.Car > parseInt(self.filter.carVal)) 
		) {
		    ret_val = true;
		}
	    }
	} 
	if (self.filter.label !== undefined) {
	    if ( event.meta.hasOwnProperty(self.filter.label)) {
		ret_val = true;
	    }
	}
	return ret_val;
    }
    return false;
}


VXGActivityView.prototype.timeDifference = function timeDifference(current, previous) {
    let msPerMinute = 60 * 1000;

    let msPerHour = msPerMinute * 60;
    let msPerDay = msPerHour * 24;
    let msPerMonth = msPerDay * 30;
    let msPerYear = msPerDay * 365;

    let elapsed = current - previous;

    if (elapsed < msPerMinute) {
        return Math.round(elapsed/1000) + ' s ago';
    }

    else if (elapsed < msPerHour) {
        return Math.round(elapsed/msPerMinute) + ' m ago';
    }

    else if (elapsed < msPerDay ) {
        return Math.round(elapsed/msPerHour ) + ' h ago';
    }

    else if (elapsed < msPerMonth) {
        return Math.round(elapsed/msPerDay) + ' d ago';
    }

    else if (elapsed < msPerYear) {
        return Math.round(elapsed/msPerMonth) + ' mo ago';
    }

    else {
        return Math.round(elapsed/msPerYear ) + ' y ago';
    }
}

VXGActivityView.prototype.objByCamid = function objByCamid ( camid ) {
    var ret_val = null;
    if (this.cameraslist !== undefined) {
	for (var i = 0; i < this.cameraslist.length; i++) {
	    if (this.cameraslist[i].getCameraID() == camid) {
		ret_val = this.cameraslist[i];
		break;
	    }
	}
    }
    return ret_val;
}


VXGActivityView.prototype.render = function render(controller, params, VXGActivitydata) {
    this.more.classList.remove('spinner');
    let activitiesContainer = this.element.getElementsByClassName('feed-activity-list')[0]; 
	let isActivitiesPage = $(this.element).hasClass("activity_activitylist") ? true : false;

    var offset = 0;
    var limit  = 40;
    if (params !== undefined) {
	var reqParams = params.requestParams;
	if (reqParams !== undefined) {
	    offset = reqParams.offset;
	    limit  = reqParams.limit;
	}
    }

    if (offset == 0) {
	$(activitiesContainer).empty();
    }
    
    if (offset == 0 && (VXGActivitydata === undefined || VXGActivitydata.length == 0)) {
	let span = $(this.noevents).find("span")[0];
	if (this.filter !== undefined && this.filter != null) {
	    $(span).text($.t('activity.noEventsFoundForSuchFilter'));
	} else if ($(controller.clView.element).hasClass("report_activitylist")) {
		$(span).text("No events in Favourited cameras");
	} else {
	    $(span).text($.t('activity.noEvents'));
	}
	$(this.noevents).addClass("visible");
    } else {
	$(this.noevents).removeClass("visible");
    }
    
    
    if ( VXGActivitydata === undefined ) {
	return;
    }
    
    let currentTime = new Date();
    let self = this;
    
    let additional_search  = ((this.filter !== undefined && this.filter !== null )&& this.filter['label'] !== undefined)? this.filter.label : undefined;
    
    $.each(VXGActivitydata, function () {
            //if (!this.thumb || !this.thumb.url) return;
            if (self.ActivitiesList_filter !== undefined 
            && self.ActivitiesList_filter(self, this) == false) {
                return;
            }
	    var options_date = {  year: 'numeric', month: 'numeric', day: 'numeric' };
	    var options_time = {   };
	    let date = new Date(this.time+"Z");
	    let timeString = date.toLocaleString('en-US',options_date) + " " + date.toLocaleTimeString('en-US',options_time);    

	    let tags={};
	    var objects = ""; 

	    if (this.meta != null) {
		let a=[];
		var skipMetaList = ["description", "process", "total", "start_time", "end_time", "ip_address", "user_id", "result"]
		for (var prop in this.meta){
		    if (! (prop == this.name || this.meta[prop] === "" || skipMetaList.includes(prop))){
			a.push({a:prop,v:this.meta[prop]});
		    }
		}
		a = a.sort(function(a, b){return parseInt(b.v)-parseInt(a.v)});
		for (var prop in a) {
// Exclude Groop ID , meta and ai_engine
		    if (! (a[prop].a == this.name || a[prop].v === "" || a[prop].a === "total" || skipMetaList.includes(prop))){
			let v = a[prop].v;
			objects += (objects?", ":"")+a[prop].a+ (parseInt(v)?"&nbsp;("+v+")":"");
			tags[a[prop].a]=v;
		    }
		}
	    }

	    var cameraInfo = '';
	    let camera = self.objByCamid(this.camid);
	    if (camera != null) {
		cameraInfo = '<span class="camera-name"><camfield field="name" access_token="'+camera.camera_id+'"></camfield></span>';
	    }

		var eventStatus = this.meta && this.meta.process ? this.meta.process : "no_status";
		var sendMeta = this.meta ? this.meta : {};

		let dclass = "event-ele ";
		let addon = "";
		if (isActivitiesPage) {
	    	dclass+=" event-processing ";
			addon = `
			img_url="${((this.thumb && this.thumb.url) ? this.thumb.url : '')}" 
			event_name="${this.name}"
			event_id="${this.id}" 
			event_status="${self.ActivitiesList_resolve_status(eventStatus)}"
			display_name="${self.ActivitiesList_resolve_name(this.name)}" 
			token="${(camera ? camera.token : null)}" 
			tags="${btoa(JSON.stringify(tags, null, 2))}" 
			meta="${btoa(JSON.stringify(sendMeta, null, 2))}" 
			camera_name="${(camera ? camera.src.name : null)}" 
			location="${(camera && camera.src.meta ? camera.src.meta.location : null)}"
			time="${this.time}Z" 
			filemeta="${((this.filemeta && this.filemeta.download && this.filemeta.download.url ? this.filemeta.download.url : ''))}"
			`;
		} else {
			if (this.name == "motion") {
				dclass += "toeventview";
				addon = 'camid="'+this.camid+'" time="'+this.time+'Z" eventname="'+ this.name +'"';
			} else {
				dclass += "tometaview";
				addon = 'img_url="'+ ((this.thumb && this.thumb.url) ? this.thumb.url : '') + '" ai_type="' + this.name + '" event_id="'+this.id+'" token="'+ self.roToken +'" meta="'+btoa(JSON.stringify(tags))+'" camid="'+this.camid+'" time="' + this.time + 'Z"' ;		
			}
		}

		var thumb_src = !this.thumb || !this.thumb.url ? "" : this.thumb.url;
	    
            let feedEl = 
        	'<div class="feed-element mr-1">'
	    +	'	<div class="'+ dclass + '" '+ addon + ' eventid="' + this.id +'">' 
	    +	'		<div class="image-container d-flex align-items-center">' 		
	    +	'			<div class="image-stub"></div><img crossorigin="anonymous" id="event_'+ this.id +'_thumbnail" src="' + thumb_src + '" alt="">'
	    +	'		</div>' 
	    +	'		<div class="VXGActivityCardInfo flex-grow-1">'
	    +	'			<small class="VXGActivityCardInfoTimeback float-right text-navy"><b>' + self.timeDifference(currentTime, new Date(this.time +"Z")) + '</b></small>' 
	    +	'			<div class="VXGActivityCardInfoMain flex-column h-100 justify-content-between">'
	    +	'				<div class="event-info">'
	    +	cameraInfo
//	    +	'					<div>' + meta + '</div>' 	    
	    +	'					<small class="text-muted">' + timeString + '</small>' 
	    +	'				</div>'
	    +	'				<div class="event-name ' + eventStatus + '">' 
		+	'					<span>' + self.ActivitiesList_resolve_name(this.name)  + '</span>'
		+	'				</div>' 
	    +	'			</div>' 
	    +	'		</div>' 
	    +	'	</div>' 
	    +	'</div>';
	    
	    //if (this.thumb) {
		$(activitiesContainer).append($(feedEl));

		var eventid = this.id;
		if (!this.thumb || !this.thumb.url) {
			window.vxg.cameras.getCameraByIDPromise(parseInt(this.camid)).then(function(camera) {
				camera.getPreview().then(function(url) {
					var thumb_id = "event_"+eventid+"_thumbnail";
					document.getElementById(thumb_id).src = url;
				});
			});
		}

	    //}
	});

	$('.event-processing').on("click", function() {

		window.event_processing = window.event_processing || {};
		window.event_processing.thumb_url = $(this).attr("img_url");
		window.event_processing.camera_name = $(this).attr("camera_name");
		window.event_processing.token = $(this).attr("token");
		window.event_processing.meta = $(this).attr("meta");
		window.event_processing.tags = $(this).attr("tags");
		window.event_processing.filemeta_download = $(this).attr("filemeta");
		window.event_processing.event_id = $(this).attr("event_id");
		window.event_processing.event_status = $(this).attr("event_status");
		window.event_processing.event_name = $(this).attr("event_name");
		window.event_processing.display_name = $(this).attr("display_name");
		window.event_processing.time = $(this).attr("time");
		window.event_processing.location = $(this).attr("location");

		window.event_processing.user_email = vxg.user.src.email.replaceAll("@", "_AT_").replaceAll(".", "_DOT_");

		window.event_processing.metascreen = window.screens['camerametaview'];

		var url = window.location.origin + "/activity_processing.html";
		window.open(url, '_blank').focus();
	});

	if (VXGActivitydata !== undefined && VXGActivitydata.length == limit) {
		$(this.more).addClass('visible');
	} else {
		$(this.more).removeClass('visible');
                this.more.classList.remove('spinner');
	}
	
	$('.toeventview').unbind().click( function() {
	    let camid 	= $(this).attr('camid');
	    let eventid = $(this).attr('eventid');
	    let time 	= $(this).attr('time');
	    let name	= $(this).attr('eventname');
	    let camera = self.objByCamid(camid);
	    
	    let obj = {
		camid: camid,
		eventid: eventid,
		time: time,
		name: name,
		camera: camera
	    };
	    self.callbackFunc("event", obj);
	});
        $('.tometaview').unbind().click(function(){
	    let camid 	= $(this).attr('camid');
	    let eventid = $(this).attr('eventid');
		let time 	= $(this).attr('time');
		let ai_type 	= $(this).attr('ai_type');
	    let tags_s	= $(this).attr('meta');
            let tags = JSON.parse(atob(tags_s));
	    let camera = self.objByCamid(camid);

	    let obj = {
		camid: camid,
		eventid: eventid,
		time: time,
		meta: tags,
		ai_type: ai_type,
		camera: camera
	    };	    
	    self.callbackFunc("meta", obj)
        });   
        $(this.more).unbind().click(function(){
	    controller.moreData(params);
            self.more.classList.add('spinner');
        });
}

VXGActivityView.prototype.showWait = function showWait(isWait) {
    let element = this.waiter;
    //let more	= this.more;
    let noevents = this.noevents;
    
    if (isWait === undefined) {
	var iswait = $(element).hasClass("waitdata");
	isWait = !iswait;
        $(noevents).addClass("visible"); //trick - for fake request
    } 
    
    if (isWait) {
        $(element).addClass("waitdata");
        $(noevents).removeClass("visible");
    } else {
        $(element).removeClass("waitdata"); 
    }
};

VXGActivityView.prototype.showFilter = function showFilter(isShow) {
    let element = this.filterview;
    
    if (isShow === undefined) {
	var isshow = $(element).hasClass("visible");
	isShow = !isshow;
    } 
    
    if (isShow) {
	$(element).addClass('visible');
    } else {
	$(element).removeClass('visible');
    }
}

VXGActivityView.prototype.clearFilterForm = function () {
	console.log("Filter clear click");        
	let table	=  $(this.filterview).find('.VXGActivityFilterTable')[0];//$(this).parent().parent().parent().parent();

	let motValElem  = $(table).find('.VXGActivityFilterMotion');
	let metValElem  = $(table).find('.VXGActivityFilterMeta');
	let carSolElem	= $(table).find('.VXGActivityFilterCarSolution');
	let carValElem	= $(table).find('.VXGActivityFilterCarVal');
	let perSolElem	= $(table).find('.VXGActivityFilterPersonSolution');
	let perValElem	= $(table).find('.VXGActivityFilterPersonVal');
	let lblValElem	= $(table).find('.VXGActivityFilterLabelVal');

	let perSolSpan = $(perSolElem[0]).find('> span');
	let carSolSpan = $(carSolElem[0]).find('> span');

	$(motValElem[0]).prop('checked', true);
	$(metValElem[0]).prop('checked', true);

	$(perSolElem[0]).removeAttr('disabled');
	$(carSolElem[0]).removeAttr('disabled');
	$(perValElem[0]).removeAttr('disabled');
	$(carValElem[0]).removeAttr('disabled');

	carSolSpan.text('≤');
	$(carSolElem[0]).attr('data-solution', -1);
	$(carValElem[0]).val("");
	
	$(perSolElem[0]).attr('data-solution', -1);
	$(perValElem[0]).val("");
	perSolSpan.text('≤');
	
	$(lblValElem[0]).val("");
}


/*------CONTROLLER--*/
///init component func
///element - <div>-element to which VXGChart vill be connected
var VXGActivityController = function VXGActivityController( element ) {
    if (element === undefined) {
	return;
    }

    this.clModel	= new VXGActivityModel();
    this.clView		= new VXGActivityView( element );

    this.clView.initDraw(this);

    //Show activity list - used from application-js to call from element-arg
    this.clView.element.showActivityList= this.showActivityList.bind(this);
    //Show activity list - used from application-js to provide camera-list from element-arg, to show who is master of event
    this.clView.element.setCameraArray	= this.setCameraArray.bind(this);
    //Show activity list - used from application-js to provide camera-list from element-arg, to show filter-view inside component
    this.clView.element.showVXGFilter	= this.showVXGFilter.bind(this);
    //Show activity list - used from application-js to provide camera-list from element-arg or by inside-filter-view, to update event-list
    this.clView.element.acceptVXGFilter = this.acceptVXGFilter.bind(this);
};


///showActivityList - Main func by showing events
///rotoken - roToken from VXGCamera camera.list request (vs_api)
///allcamtoken - token from camea.list(vx_api), special rotoken used for geting information from  bunch of cameras
///apiGetActivityFunc - function-pointer requesting data (vs_api.user.camera.event.list )
///apiGetActivityWrongFunc - function-pointer that handle error answer frim apiGetActivityFunc
///controlCallbackFunc - function-pointe that handle some action from component like
///	 function listActivityCB(operation, obj),there operation - is name, obj - is event-record;
///offset - request field for bigdata for getting data with offset (default: 0)
///limit  - request field for bigdata for getting data with limited amount (default: 40)
VXGActivityController.prototype.showActivityList = function showActivityList ( rotoken, allcamtoken, apiGetActivityFunc , apiGetActivityWrongFunc, controlCallbackFunc, offset=0, limit=40, use_filter, use_time_filter) {
    this.clView.callbackFunc 	= controlCallbackFunc;
    this.activityFunc		= apiGetActivityFunc;
    this.wrongFunc 		= apiGetActivityWrongFunc;
    this.clView.roToken 	= rotoken;
    this.clView.allCamsToken	= allcamtoken;
    this.clView.filter		= undefined;
    
    this.clView.clearFilterForm();

    if (rotoken === "" || allcamtoken === ""
    || rotoken === undefined || allcamtoken === undefined
    ) {
	this.clView.render(this);
	this.clView.showWait(); //trick for fake request
    } else {
        let f = !use_filter ? (window.skin&&window.skin.events_filter?window.skin.events_filter:"") : window.skin.use_filter;
		let tf = !use_time_filter ? '' : window.skin.use_time_filter;
	let params = {
		roToken: rotoken,
		allCamsToken: allcamtoken,
		requestParams: {
		    token: allcamtoken,
		    offset: offset,
		    limit: limit,
		    //events: f,
			include_filemeta_download: true,
		    include_meta: true,
		    order_by: '-time',
		}
	};
	if (f) params.requestParams.events = f;
	if (tf) params.requestParams.end = tf;
	this.clModel.getData( params, this.updateDataCB.bind(this), this.showWait.bind(this), apiGetActivityFunc, apiGetActivityWrongFunc);
    }
}

//moreData - function-handler for More-button components - use previos parameters defined by showActivityList
VXGActivityController.prototype.moreData = function moreData (params) {
    var activityFunc	= this.activityFunc;
    var wrongFunc 	= this.wrongFunc;
    var rotoken		= this.clView.roToken;
    var allcamtoken	= this.clView.allCamsToken;

    if (params		!== undefined 
    && activityFunc	!== undefined 
    && wrongFunc	!== undefined
    && rotoken		!== undefined
    && allcamtoken	!== undefined
    ){

	if (params !== undefined) {
	    var reqParams = params.requestParams;
		if (reqParams !== undefined) {
		    reqParams.offset = reqParams.offset + reqParams.limit;
		    let newparams = {
			roToken: rotoken,
			allCamsToken: allcamtoken,
			requestParams: reqParams
		    };
                    newparams.requestParams.token = allcamtoken;
		    this.clModel.getData( newparams, this.updateDataCB.bind(this), this.showWait.bind(this), this.activityFunc, this.wrongFunc);
		}
	}
    }
}

///acceptVXGFilter - third method to get data, used previos parameters defined by showActivityList, but with new object-filter
///	full filter-object is 
///	{ 
///		motion: true,			//filtering by motion-events if true
///		sound: true,			//filtering by sound-events if true
///		linecross: true,		//filtering by linecross-events if true
///		label: anydata.string,		//filtering object_and_scene_detection-events if it has such record with anydata.string-name
///		personVal: anydata.number,	//filtering object_and_scene_detection-events with record Person, value is not used for request- anydata.number-count of person should be filtered 
///		personFlt: 0,			//not used for request, only while rendering - type of person-filtering -1 less or equal, 0 - equal, 1 - more
///		carVal: anudata.number,		//filtering object_and_scene_detection-events with record Car, value is not used for request- anydata.number-count of car should be filtered 
///		carFlt: 0			//not used for request, only while rendering - type of car-filtering -1 less or equal, 0 - equal, 1 - more
///		start: <date>			//period-start
///		end: <date> 			//period-end
///	}}
///	removing record from filter-object do ignore this filter
///	if filter === undefined - disable any filtering
VXGActivityController.prototype.acceptVXGFilter = function acceptVXGFilter(filter) {
    var activityFunc	= this.activityFunc;
    var wrongFunc 	= this.wrongFunc;
    var rotoken		= this.clView.roToken;
    var allcamtoken	= this.clView.allCamsToken;

    if (activityFunc	!== undefined 
    && wrongFunc	!== undefined
    && rotoken		!== undefined
    && allcamtoken	!== undefined
    ){
	var events = "motion,sound,linecross,object_and_scene_detection,yolov4_detection";
	var meta = "";
	
	if (filter !== undefined) {
		if (filter.meta !== undefined) {
			meta = filter.meta;
		}

	    if (filter.label !== undefined && filter.label !== "") {
		let prepareLabel = filter.label.charAt(0).toUpperCase() + filter.label.slice(1).toLowerCase();
		filter.label = prepareLabel;
	    } else {
		delete filter.label;
	    }
	    
	    this.clView.filter = filter; 
	    
	    events = "";
	    if ((filter.motion !== undefined) 
	    && (filter.motion === true)
	    ){
		if (events != "") {
		    events += ","
		}
		events += "motion";
	    }
	    if ((filter.sound !== undefined) 
	    && (filter.sound === true)
	    ){
		if (events != "") {
		    events += ","
		}
		events += "sound";
	    }
	    if ((filter.linecross !== undefined) 
	    && (filter.linecross === true)
	    ){
		if (events != "") {
		    events += ","
		}
		events += "linecross";
	    }
	    if ((filter.meta !== undefined)
	    && (filter.meta === true)) {
	    	if (events != "") {
		    events += ","
		}
		events += "object_and_scene_detection,yolov4_detection";
	    }
	    
	    if ((filter.personVal !== undefined)
	    || (filter.carVal !== undefined)
	    || (filter.label !== undefined)
	    ){
		if (events != "") {
		    events += ","
		}
		
		if((filter.personVal !== undefined)) {
		    if (meta != ""){
			meta += ",";
		    }
		    meta += "Person";
		}
		if((filter.carVal !== undefined)) {
		    if (meta != ""){
			meta += ",";
		    }
		    meta += "Car";
		}
		if((filter.label !== undefined)) {
		    if (meta != ""){
			meta += ",";
		    }
		    meta += encodeURIComponent(filter.label);
		}
	    }
	}
	/*
	if (events === "") {
	    events = "object_and_scene_detection,yolov4_detection";
	    this.clView.filter = undefined;
	}
	*/
	let requestParams = {
	    token: allcamtoken,
	    offset: 0,
	    limit:  40,
	    //events: events,
	    include_meta: true,
		include_filemeta_download: true,
	    order_by: '-time'
	};

	if (events) requestParams.events = events;
	
	if ((meta !== "") && ((filter.motion === undefined) || (filter.motion === false)) ) {
	    requestParams.meta = meta;
	}
	
	if (filter.start !== undefined && filter.end !== undefined) {
	    requestParams['start'] = filter.start;
	    requestParams['end'] = filter.end;
	}
    
	let params = {
		roToken: rotoken,
		allCamsToken: allcamtoken,
		requestParams: requestParams
	};
	

	this.clModel.getData( params, this.updateDataCB.bind(this), this.showWait.bind(this), this.activityFunc, this.wrongFunc);
    }    
}

///setCameraArray - (optional) provide camera.list for component to render event.list (e.g. vs_api.user.camera.list) with camera's name 
VXGActivityController.prototype.setCameraArray = function setCameraArray ( cameras ){
    this.clView.cameraslist = cameras;
}

///showCameraList - connect function beetwen chartModel and chartView
VXGActivityController.prototype.updateDataCB = function updateCameraList( params, data ) {
    this.clView.render( this, params, data);
};

///showWait - connect function beetwen chartModel and chartView
VXGActivityController.prototype.showWait = function showWait (isWait) {
    console.warn('DEBUG swhoWait '+ isWait);
    this.clView.showWait(isWait);
};

///showVXGFilter - wrap func for viewModel.showFilter-func
VXGActivityController.prototype.showVXGFilter = function showVXGFilter (isShow=undefined) {
    this.clView.showFilter(isShow);
}

