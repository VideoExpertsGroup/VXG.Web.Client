/*-------MODEL-------*/
var VXGCameraListModel = function VXGCameraListModel() {

};

VXGCameraListModel.prototype.getData = function getCameraList( updateDataCBFunc, waitFunc, cameraListApiFunc, cameraListWrongCB, offset=0, limit=-1 ) {

    var debugData = {
	listData : "data"
    };
    
    var requestParams = {
	offset: offset
    }
    if (limit > 0) {
	requestParams['limit'] = limit;
    }
    
    waitFunc(true);
    return cameraListApiFunc(requestParams).then( function(answer) {  //vs_api
	waitFunc(false);
	
	updateDataCBFunc(answer['data'], answer['offset'], answer['total'], answer['allCamsToken']); 
	
	console.warn('Debug api-func');
	return answer['data'].length!==limit;
    }, function(r) {
	waitFunc(false);
	cameraListWrongCB(r);
    });
}

VXGCameraListModel.prototype.minTwoDigits = function minTwoDigits(n) {
    return (n < 10 ? '0' : '') + n;
}

VXGCameraListModel.prototype.GetStartAndEndTime = function GetStartAndEndTime(period, timedelta=0){
    let et = new Date( new Date().getTime() - (timedelta * 1000));
    let st = new Date(et.getTime() - period); 
    let result = {};

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
    
    result['et70'] = et.getTime();
    result['st70'] = st.getTime();
    
    return result;    
}

VXGCameraListModel.prototype.getBaseURLFromToken = function(access_token) {
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
    return "http://" + _url + (_at['api_p'] ? ':' + _at['api_p'] : "");
};

VXGCameraListModel.prototype.eventList = function(obj, accessToken) {
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
            args.offset += args.limit;
            if (r['objects'] && r.objects.length && (r.objects.length + r.offset < r.total_count))
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

VXGCameraListModel.prototype.getSparklineData = function getSparklineData (element,  vxgToken, updateSparklineDataCB, waitFunc, sparklineBars=8, sparklinePeriod=3600) {
    if (sparklinePeriod < 120) {
	sparklinePeriod = 600;
    }

    let limit = sparklinePeriod/60; 
    let timeLimits = this.GetStartAndEndTime(sparklinePeriod*1000);

    var obj = {
        limit: limit,
        events: "object_and_scene_detection,yolov4_detection",
        include_meta: true,
        meta:  "Person,Car",
        order_by: '-time',
        access_token: vxgToken,
        start: timeLimits['st'],
        end: timeLimits['et']
    };  

    var answerData = {
	result: -1,
	description: "Error"
    };

    let self = this;

    waitFunc(element, true);
    this.eventList(obj, vxgToken).done(function (eventlist) {
        waitFunc(element, false); 
	answerData['result'] = 0;
	answerData['description'] = "Success";
	answerData['data'] = eventlist;
	if (eventlist.length) $(element).show();
        self.prepareSparklineData(answerData, element, vxgToken, timeLimits['st70'], timeLimits['et70'], sparklineBars, updateSparklineDataCB );
    }).fail(function (r) {
        waitFunc(element, false); 
        console.error(r);
	answerData['result'] = -1;
	answerData['description'] = r;
    });
}

VXGCameraListModel.prototype.prepareSparklineData = function prepareSparklineData( answer, showElem, vxgToken, start, end,  count, showFunc) {
    let sparkLineData = [];

    let data = answer['data'];
    if (data.length == 0) {
	for (i=0; i< count; i++) {
	    sparkLineData.push(0);
	}
	showFunc(showElem, vxgToken, sparkLineData);
	
	return;
    }

    let sorted = data.sort((a,b) => (a.time > b.time) ? 1 : ((b.time > a.time) ? -1 : 0));

    let timeDelta = (end - start) / count;


    let self = this;

    let periodNum = 1;
    let periodCnt = 0;
    let periodSum = 0;
    $.each(sorted, function () {
	var time 	= Date.parse( this.time + 'Z');
	var car		= this.meta['Car'] ? parseInt(this.meta['Car']) : 0;
	var person	= this.meta['Person'] ? parseInt(this.meta['Person']) : 0;
	
	if (time < (start + timeDelta * periodNum)) {
	    periodCnt++;
	    periodSum += car + person;
	} else {
	    var middle = Math.round(( (periodSum/periodCnt)  + Number.EPSILON) * 100) / 100
	    if (middle === undefined || isNaN(middle)) {
		middle = 0;
	    }
	    sparkLineData.push(middle);
	    periodCnt = 1;
	    periodSum = car + person;
	    periodNum++;
	}
    });
    var middle = Math.round(( (periodSum/periodCnt) + Number.EPSILON) * 100) / 100
    if (middle === undefined || isNaN(middle)) {
	middle = 0;
    }
    sparkLineData.push(middle);
    
    showFunc(showElem, vxgToken, sparkLineData);
};


/*-------VIEW--------*/

var VXGCameraListView = function VXGCameraListView(element) {
    this.element = element;
};

VXGCameraListView.prototype.initDraw = function initDraw(controller, cameraName, meta) {
    this.element.innerHTML = 
    	'<div class= "VXGCameraListContainer">'
    +	'	<div class="VXGCameraList">'
    +	'		<table class="table-hover no-margins with-images cameras-list" id="VXGCameraListTableSuper" style="border-collapse: collapse; width:100%;">'
    +	'		<thead>'
    +	'			<tr>'
    +	'				<th>Preview</th>'
    //+	'				<th>Name</th>'
    +	'				<th>Location</th>'
    +	'				<th>Meta</th>'
    +	'				<th ifscreen="plan2camera">Plan</th>'
    +	'				<th>Action</th>'
    +	'			</tr>'
    +	'		</thead>'
    +	'		<tbody class="VXGCameraListTable">'
    +	'		</tbody>'
    +	'		</table><div style="text-align:center;margin: 10px 0;"><button type="button" class="vxgbutton more" data-attr="camera">More</button></div>'
    +	'	</div>'
    +	'	<span class="VXGCameraListEmpty invisible"> No camera found. <a ifscreen="addcamera" href="javascript:void(0)" class="VXGCameraListAdd">Add a camera</a></span>'
    +	'</div>';
    let element = this.element;

    this.tbody   = this.element.getElementsByClassName('VXGCameraListTable')[0]; 
    this.more   = this.element.getElementsByClassName('more')[0]; 
    this.container = this.element.getElementsByClassName('VXGCameraListContainer')[0]; 
    this.nocameras = this.element.getElementsByClassName('VXGCameraListEmpty')[0]; 
    this.cameras = this.element.getElementsByClassName('VXGCameraList')[0]; 
    this.addCamera = this.element.getElementsByClassName('VXGCameraListAdd')[0]; 

    var emptylist = [];
    
    this.render(controller, emptylist, 0, 0);
}

VXGCameraListView.prototype.getRandomInt = function getRandomInt(min, max) {
    //min = Math.ceil(min);
    //max = Math.floor(max);
    //return Math.floor(Math.random() * (max - min + 1)) + min;
    return 0;
}

VXGCameraListView.prototype.objByIndex = function objByIndex( index ) {
    if ((index !== undefined) && (index >= 0) && (index < this.list.length)) {
	return this.list[index];
    }
    return null;
}

VXGCameraListView.prototype.objByCamid = function objByCamid ( camid ) {
    var ret_val = null;
    if (this.list !== undefined) {
	for (var i = 0; i < this.list.length; i++) {
	    if (this.list[i]["id"] == camid) {
		ret_val = this.list[i];
		break;
	    }
	}
    }
    return ret_val;
}

VXGCameraListView.prototype.showMenu = function showMenu(event, whoCall, indexCarrier, controller, recall=false, self=this) {
	let el = $(whoCall).find('.VXGCameraListMenu');

    let cam = controller.objByIndex($(indexCarrier).data('index'));
    var cameraUrlsStr = sessionStorage.getItem("cameraUrls");
    var cameraUrls = cameraUrlsStr ? JSON.parse(cameraUrlsStr) : [];
    var savedCam = cameraUrls.length != 0 ? cameraUrls.find(x => x.id === cam.camera_id) : "";

    var urlMenuItem = savedCam && savedCam.url && savedCam.url != "nourl" ? 
        `<a class="listmenu-item mwebui" href="${savedCam.url}" target="_blank"><i class="fa fa-window-restore" aria-hidden="true"></i> <span class="listitem-name"> Camera UI </span></a>` :
        "";

    if (!savedCam) {
        vxg.api.cloud.getCameraConfig(cam.camera_id, cam.token).then(function(config) {
            var link;
            if (config.url && config.url.includes("onvif")) {
                var s = config.url.replace("onvif://", "");
                link = s.replace("/onvif/device_service", "");
                cameraUrls.push({id: config.id, url: 'http://' + link});
                sessionStorage.setItem("cameraUrls", JSON.stringify(cameraUrls));
            } else if (config.url && config.url.includes('/uplink_camera/')) {
                core.elements['global-loader'].show();
                return vxg.api.cloud.getUplinkUrl(config.id, config.url).then(function(urlinfo) {
                    if (!urlinfo.id && !urlinfo.url) {
                        cameraUrls.push({id: config.id, url: "nourl"});
                        sessionStorage.setItem("cameraUrls", JSON.stringify(cameraUrls));
                    } else {
                        cameraUrls.push({id: urlinfo.id, url: urlinfo.url});
                        sessionStorage.setItem("cameraUrls", JSON.stringify(cameraUrls));
                    }

                    core.elements['global-loader'].hide();
                    self.showMenu(event, whoCall, indexCarrier, controller, true);
                });
            } else {
                cameraUrls.push({id: config.id, url: "nourl"});
                sessionStorage.setItem("cameraUrls", JSON.stringify(cameraUrls));
            }

            return self.showMenu(event, whoCall, indexCarrier, controller, true);

        });
    }

	let menu = `
        <div class="VXGCameraListMenu">
        	<div class="listmenu-item mcamera" ifscreen="tagsview" onclick_toscreen="tagsview"><i class="fa fa-video-camera" aria-hidden="true"></i> <span class="listitem-name"> Timeline </span> </div>
        	<div class="listmenu-item msetting" ifscreen="camerasettings"><i class="fa fa-cog" aria-hidden="true"></i> <span class="listitem-name"> Stream Settings </span></div>
        	<div class="listmenu-item mchart" ifscreen="camerameta"><i class="fa fa-bar-chart" aria-hidden="true"></i> <span class="listitem-name"> Metadata </span></div>
        	<div class="listmenu-item mconfigure" ifscreen="addcamera"><i class="fa fa-wrench" aria-hidden="true"></i> <span class="listitem-name"> Config </span></div>
        	${urlMenuItem}
        	<div class="listmenu-item mtrash"><i class="fa fa-trash-o" aria-hidden="true"></i> <span class="listitem-name"> Remove </span></div>
        </div>
    `;
	if (!el.length && savedCam) {
	    $(whoCall).append(menu);
	    el = $(whoCall).find('.VXGCameraListMenu');
	    
	    $(whoCall).find('.mcamera').unbind().bind('click', function(evt){
			let index = $(indexCarrier).data('index');
			let obj = controller.objByIndex(index);		
			if (self.callbackFunc !== undefined) {
			    self.callbackFunc("timeline", obj);
			}
			evt.stopPropagation();
			el.remove();
	    });
	    $(whoCall).find('.msetting').unbind().bind('click', function(evt){
			let index = $(indexCarrier).data('index');
			let obj = controller.objByIndex(index);		
			if (self.callbackFunc !== undefined) {
			    self.callbackFunc("settings", obj);
			}
			evt.stopPropagation();
			el.remove();
	    });
	    $(whoCall).find('.mchart').unbind().bind('click', function(evt){
			let index = $(indexCarrier).data('index');
			let obj = controller.objByIndex(index);		
			if (self.callbackFunc !== undefined) {
			    self.callbackFunc("metadata", obj);
			}
			evt.stopPropagation();
			el.remove();
	    });
	    $(whoCall).find('.mconfigure').unbind().bind('click', function(evt){
			let index = indexCarrier.data('index');
			let obj = controller.objByIndex(index);		
			if (self.callbackFunc !== undefined) {
			    self.callbackFunc("configuration", obj);
			}
			evt.stopPropagation();
			el.remove();
	    });
	    $(whoCall).find('.mtrash').unbind().bind('click', function(evt){
			let index = $(indexCarrier).data('index');
			let camera = controller.objByIndex(index);		

                        dialogs['mdialog'].activate('<h7>Do you want to delete camera '+camera.src.name+'?</h7><p>It can\'t be cancelled </p><p><button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;<button name="delete" class="vxgbutton">Delete</button></p>').then(function(r){
                            if (r.button!='delete') return;
                            core.elements['global-loader'].show();
                            if (camera) camera.deleteCameraPromise().then(function(){
                                var oldsubid = camera.src.meta.subid;
                                var planIndex = vxg.user.src.plans.findIndex(p => p.id == oldsubid);
                                if (planIndex > -1) vxg.user.src.plans[planIndex].used--;

                                var aiCams_string = sessionStorage.getItem("aiCams");
                                if (aiCams_string) {
                                    var aiCams_array = aiCams_string.split(",").filter(e => e);
                                    if (aiCams_array.includes(camera.camera_id.toString())) {
                                        var newAiCams = aiCams_string.replace("," + camera.camera_id, "");
                                        sessionStorage.setItem("aiCams", newAiCams); 
                                    }
                                }
                                sessionStorage.removeItem(camera.camera_id);

                                var backToCam = sessionStorage.getItem("backToCam");
                                if (backToCam == camera.camera_id) sessionStorage.removeItem("backToCam");

                                var cameraUrlsStr = sessionStorage.getItem("cameraUrls");
                                var cameraUrls = cameraUrlsStr ? JSON.parse(cameraUrlsStr) : "";
                                if (cameraUrls) {
                                    var removeCurrent = cameraUrls.filter(cam => cam.id != camera.camera_id);
                                    sessionStorage.setItem("cameraUrls", JSON.stringify(removeCurrent));
                                }

                                core.elements['global-loader'].hide();
                                return screens['reports'].on_show();
                            }, function(r){
                                core.elements['global-loader'].hide();
                                let err_text = 'Failed to delete camera';
                                if (r && r.responseJSON && r.responseJSON.errorDetail) err_text = r.responseJSON.errorDetail;
                                dialogs['mdialog'].activate('<h7>Error</h7><p>'+err_text+'</p><p><button name="cancel" class="vxgbutton">Ok</button></p>');
                            });
                
                        });

/*
			if (self.callbackFunc !== undefined) {
			    self.callbackFunc("remove", obj);
			}
			evt.stopPropagation();
			el.remove();
*/
	    });
	}
	el.mouseleave(function(){
	    el.remove();
	});
		
	let w = el.width();
	let h = el.height();
	let ww = $(window).width();
	let hh = $(window).height();
	if (event.clientX+w<=ww) {
		el.css('left',event.clientX-10);
	} else {
		el.css('right',ww - event.clientX-10);
	}
	if (event.clientY+h<=hh) {
		el.css('top',event.clientY-10);
	} else {
		el.css('bottom',hh-event.clientY-10);
	}
}

// different render based on list/groupBylLoc
VXGCameraListView.prototype.render = function render(controller, vxgcameralistdata, offset, total, allcamtoken) {
	let tbody	= this.tbody;
	let more	= this.more;
	let self	= this;
	        
	if (!offset) $(tbody).empty();
        

        if ( !offset && vxgcameralistdata.length <= 0) {
    	    $(this.container).addClass('nocameras');
	    $(this.cameras).addClass('invisible');
	    $(this.nocameras).removeClass('invisible');
        } else {
	    $(this.container).removeClass('nocameras');        
	    $(this.cameras).removeClass('invisible');
	    $(this.nocameras).addClass('invisible');
        }
        
        $(this.addCamera).unbind().bind('click', function(){
	    if (self.callbackFunc !== undefined) {
		self.callbackFunc("add", null);
	    }
	});
    
    // new showai
    var aiCameras_local = sessionStorage.getItem('aiCams');

    if (vxgcameralistdata.length > 0) {
        if (!aiCameras_local) {
            var camera_ids = vxgcameralistdata.map(c => c.camera_id );
            vxg.api.cloud.getAIEnabledCameras(camera_ids).then(function(aiEnabledCameras) {
                var aiCamString_local = "";
                aiEnabledCameras.ai_cameras.forEach(camid => {
                    aiCamString_local += "," + camid;
                    $("#ai_" + camid).html('<button class="vxgbutton-transparent" access_token="'+camid+'">Show AI</button>');
                    //Clicks on any column of row except camera preview and actions -> update chart
                    $("#ai_" + camid).find('button').off('click').on('click',function(){
                        let index = $("#ai_" + camid).parent().data('index');	    
                        let obj = controller.objByIndex(index);
        
                        if (self.callbackFunc !== undefined) 
                        self.callbackFunc("statistics", obj);
                    });
                });
                sessionStorage.setItem("aiCams", aiCamString_local);
            })
        }
    }

    var camerasView = sessionStorage.getItem("camerasView");
    var cameraGroups = [];
    var locCountArr = [];
    if (vxgcameralistdata.length > 0 && camerasView == "cameras-group") {
        cameraGroups = this.groupByLocation(vxgcameralistdata);

        cameraGroups.forEach(loc => {
            let tr = 
            `
                <tr data-loc="${loc}" class="location-group-toggle droppable" id="${loc}-toggle" >
                    <td class="quad-preview-wrapper">
                        <div class="top-row">
                            <img class="quad-preview" id="${loc}-qp1" data-imgIndex="0" data-imgLoc="${loc}" src="/core/modules/player/camera.svg">
                            <img class="quad-preview" id="${loc}-qp2" data-imgIndex="1" data-imgLoc="${loc}" src="/core/modules/player/camera.svg">
                        </div>
                        <div class="bottom-row ${loc}-bottom">
                            <img class="quad-preview" id="${loc}-qp3" data-imgIndex="2" data-imgLoc="${loc}" src="/core/modules/player/camera.svg">
                            <img class="quad-preview" id="${loc}-qp4" data-imgIndex="3" data-imgLoc="${loc}" src="/core/modules/player/camera.svg">
                        </div>                      
                    </td>
                    <td class="location-name">${loc}</td>
                    <td colspan="4"></td>
                </tr>
            `;

            $(tbody).append( $(tr) );

            $(".location-group-toggle").off('click').on('click', function() {
                var thisLoc = $(this).attr("data-loc");
                $("." + thisLoc + "-row").toggle();
            })

            locCountArr.push({'location' : loc, 'count' : 0, "tokens": []});
        })
    }
        
	$.each(vxgcameralistdata, function (index) {
            if (vxgcameralistdata[index].src.name.substr(0,11)=="#StorageFor" && !isNaN(parseInt(vxgcameralistdata[index].src.name.substr(11)))) return;
            if (vxgcameralistdata[index].src&&vxgcameralistdata[index].src.meta&&vxgcameralistdata[index].src.meta.isstorage=='isstorage') return;

	    vxgcameralistdata[index].allCamsToken = allcamtoken;

	    let sparkline = [];
	    let sparklineBars = controller.sparklineBars;
	    for(let i=0; i < sparklineBars; i++){
	        sparkline.push(self.getRandomInt(0, 10))
	    }
	    
        var hideCamera = "";
        var locClass = "";
        var groupCam = "";
        var locNum = 1;
        var camLoc = vxgcameralistdata[index].src.meta ? vxgcameralistdata[index].src.meta.location : "";         
        if (cameraGroups.length > 0 && cameraGroups.includes(camLoc) && camerasView == "cameras-group") {
            hideCamera = "hide";
            locClass = camLoc + "-row";
            groupCam = "groupCam";
            //var locConut = locCountArr.find(l => l.location == camLoc);
            var locIndex = locCountArr.findIndex(l => l.location == camLoc);
            locNum = locCountArr[locIndex].count;
        }

        var draggableClass = camerasView == "cameras-group"? "draggable" : "";
	        
	    let tr = 
	'<tr class="sl'+vxgcameralistdata[index].camera_id+'" data-index="' + index + '" access_token="'+ vxgcameralistdata[index].token  +'">' 
    +	'	<td style="width:45%"><div class="namePrev"><campreview></campreview><span id="name_'+ vxgcameralistdata[index].camera_id +'" class="sname"></span></div></td>' 
    //+	'	<td width="10%" class="sname"></td>' 
//    +   '   <td style="width:5%" class="uilink" id="'+ vxgcameralistdata[index].camera_id+'-ui">' + ((urlEle) ? urlEle : '') + '</td>'
    +	'	<td style="width:13%" class="sloc"></td>' 
    +	'	<td style="width:10%" class="showplans"  id="planbtn_'+ vxgcameralistdata[index].camera_id +'"></td>' 
//    +	'	<td class="sparkline-container"><span class="sparkline" data-token="' + vxgcameralistdata[index].token + '" data-dataset="'+sparkline+'" style="display:none"></span></td>' 
    +	'	<td style="width:17%" class="showai" id="ai_'+ vxgcameralistdata[index].camera_id +'" data-token="' + vxgcameralistdata[index].camera_id + '"></td>' 
//    +	'	<td ifscreen="plan2camera"><div class="splan vxgbutton-transparent hide" onclick_toscreen="plan2camera"></div></td>'
    +	'	<td  style="width:10%" class="VXGCameraListActions">'
    +	'	<div class="VXGCameraListSettings"><svg class="inline-svg-icon icon-action"><use xlink:href="#action"></use></svg></div>'
    +	'	</td>'
    +	'</tr>';

        if (groupCam) {
            $("#" + camLoc + "-toggle").last().after(tr);
            if (locNum <= 4) {                    
                locCountArr[locIndex].count++;
                locCountArr[locIndex].tokens.push(vxgcameralistdata[index].token);
            }
        } else {
            $(tbody).append( $(tr) );
        }

        if (vxgcameralistdata[index].src.meta && vxgcameralistdata[index].src.meta.subid && vxgcameralistdata[index].src.meta.subid != "") {
            // camera has a plan, show dialog to unassign on click
            var camid = vxgcameralistdata[index].camera_id;
            $("#planbtn_" + camid).html('<button class="vxgbutton-transparent plan-btn" access_token="'+camid+'">View Sub</button>');
            $("#planbtn_" + camid).find('button').off('click').on('click', function() {
                var camName = $("#name_" + camid).text();
                var subDialog = `
                    <h1 id="plans-title">Unassign Subscription from Camera ${camName}</h1>
                    <p class="curr-sub"> ${vxgcameralistdata[index].src.meta.subname} </p>
                    <button name="apply" class="vxgbutton assign-btn unsub" id="unsubscribe">Unsubscribe</button>
                `;
                dialogs['mdialog'].activate(subDialog).then(function(r){
                    if (r.button!='apply') return;

                    var oldsubid = vxgcameralistdata[index].src.meta.subid;

                    delete vxgcameralistdata[index].src.meta.subid;
                    delete vxgcameralistdata[index].src.meta.subname;

                    obj = {
                        "old_sub": oldsubid,
                        "id": camid,
                        "meta": vxgcameralistdata[index].src.meta
                    }

                    core.elements['global-loader'].show();

                    vxg.api.cloudone.camera.setPlans(obj).then(function (ret) {
                        location.reload();
                    },function(r){
                        if (r && r.responseJSON && r.responseJSON.errorDetail)
                            alert(r.responseJSON.errorDetail);
                        else
                            alert('Falied to remove subscription');
                        core.elements['global-loader'].hide();
                    });                  
                                    
                });		

            });
        } else {
            // camera doesn't have plan, show list of available ones
            
            if (vxg.user.src.plans && vxg.user.src.plans.length != 0) {
                var camid = vxgcameralistdata[index].camera_id;
                var meta = vxgcameralistdata[index].src.meta; 
                $("#planbtn_" + camid).html('<button class="vxgbutton plan-btn" access_token="'+camid+'">Assign Sub</button>');
                $("#planbtn_" + camid).find('button').off('click').on('click', function() {
                    var camName = $("#name_" + camid).text();
                    planTable = `
                        <tr class="plan-header">
                            <th>Plan</th>
                            <th>Count</th>
                            <th>Used</th>
                            <th></th>
                        </tr>
                    `;
                    vxg.user.src.plans.forEach(plan => {
                        if (plan.count != 0) {
                            var enabled = plan.count != plan.used ? `onclick="checkPlan('${plan.id}')` : "";
                            planTable += `
                            <tr class="plan ${ !enabled ? "disabled" : ""}" ${enabled}">
                                <td class="plan-desc" planid="${plan.id}"> ${plan.name} </td>
                                <td class="plan-count">${plan.count}</td>
                                <td class="used-count" >${plan.used}</td>
                                <td class="checkbox choose-sub">
                                    <input id="plan_${plan.id}" class="plans-check" type="radio"  ${ !enabled ? "disabled" : ""} name="subid" value="${plan.id}">
                                    <input style="display:none;" id="name_${plan.id}" value="${plan.name}">
                                </td>
                            </tr>
                            `;
                        }
                    });
    
                    var plansDialog = `
                        <h1 id="plans-title">Assign Subscription to Camera ${camName}</h1>
                        <table class="plansTable">
                            ${planTable}
                        </table>
                        <button name="apply" class="vxgbutton assign-btn">Assign</button>
                    `;
                    dialogs['mdialog'].activate(plansDialog).then(function(r){
                        if (r.button!='apply') return;
    
                        var subInfo = {
                            "subid": r.form.subid,
                            "subname": $("#name_" + r.form.subid).val()
                        };
    
                        var newMeta = {
                            ...subInfo,
                            ...meta
                          };
                        
                        obj = {
                            "id": camid,
                            "meta": newMeta
                        }
    
                        core.elements['global-loader'].show();
    
                        vxg.api.cloudone.camera.setPlans(obj).then(function (ret) {
                            location.reload();
                        },function(r){
                            if (r && r.responseJSON && r.responseJSON.errorDetail)
                                alert(r.responseJSON.errorDetail);
                            else
                                alert('Falied to delete setting');
                            core.elements['global-loader'].hide();
                        });                       
                    });		
    
                });
            } 
            
        }

        if (aiCameras_local) {
            var aiCameras_array = aiCameras_local.split(",").filter(e => e);
            if (aiCameras_array.includes(vxgcameralistdata[index].camera_id.toString())) {
                var camid = vxgcameralistdata[index].camera_id;
                $("#ai_" + camid).html('<button class="vxgbutton-transparent" access_token="'+camid+'">Show AI</button>');
                //Clicks on any column of row except camera preview and actions -> update chart
                $("#ai_" + camid).find('button').off('click').on('click',function(){
                    let index = $("#ai_" + camid).parent().data('index');	    
                    let obj = controller.objByIndex(index);
    
                    if (self.callbackFunc !== undefined) 
                    self.callbackFunc("statistics", obj);
                });
            }
        }

            {
                let chid = vxgcameralistdata[index].camera_id;
                $(tbody).find('.sl'+chid+' .sloc').html( vxgcameralistdata[index].getLocation());
                vxgcameralistdata[index].getBsrc().then(function(bsrc){
                    if (!bsrc) 
                        $(tbody).find('.sl'+chid+' .splan').parent().html('');
                    else
                        $(tbody).find('.sl'+chid+' .splan').removeClass('hide').html( bsrc['planName'] ? bsrc['planName'] : 'UPGRADE');
                });
                vxgcameralistdata[index].getName().then(function(name){
                    $(tbody).find('.sl'+chid+' .sname').html( name);
                });
            }
	//Clicks on 1st column of row -> play camera
	    $(tbody).find('td:nth-child(1)').off('click').on('click',function(){
	    	    let index = $(this).parent().data('index');	    
	    	let obj = controller.objByIndex(index);
		
		if (self.callbackFunc !== undefined) 
		    self.callbackFunc("play", obj);
	    });
	    //Clicks on columt with actions -> show menu with some actions
	    $(tbody).find('.VXGCameraListSettings').unbind().bind('click', function(event){
		self.showMenu(event, this, $(this).parent().parent(), controller, self );
	    });
        
	});


    let currentLocInfo;

    let promiseChain = Promise.resolve();
    for (let i = 0; i < locCountArr.length; i++) { 
        currentLocInfo = locCountArr[i];

        for(let j = 0; j < currentLocInfo.tokens.length; j++) {        
            const makeNextPromise = (currentLocInfo) => () => {
                return vxg.api.cloud.getPreview(currentLocInfo.tokens[j])
                    .then((r) => {
                        var locImage = document.querySelector('[data-imgloc="'+currentLocInfo.location+'"][data-imgindex="' + j + '"]');
                        $(locImage).attr("src", r.url);
                        return true;
                    });
            }
            promiseChain = promiseChain.then(makeNextPromise(currentLocInfo))
        }
    }

    if (locCountArr.length != 0) {
        // gets rid of extra image spaces after
        locCountArr.forEach(locInfo => {
            if (locInfo.count == 3) $("#" + locInfo.location + "-qp4").remove();
            else if (locInfo.count <= 2) $("." + locInfo.location + "-bottom").remove();
            if (locInfo.count == 1) $("#" + locInfo.location + "-qp2").remove();
        });
    }
    
    $(".draggable").draggable({
        revert : function(event, ui) {
            $(this).data("uiDraggable").originalPosition = {
                top : 0,
                left : 0
            };
            return !event;
        }
    });
    $(".droppable").droppable({
        drop :function(event, ui) {
            core.elements['global-loader'].show();
            $(ui.draggable).hide();
            var location = $(this).attr("data-loc");
            var channel_id = $(ui.draggable).attr("data-camid");
            vxg.api.cloudone.camera.setLocations(channel_id, location).then(function() {
                window.location.reload();
            }, function(err) {
                alert(err.responseJSON.errorDetail);
                window.location.reload();
            })
        }
    });

    $( ".groupCam" ).on( "dblclick", function() {
        var channel_id = $(this).attr("data-camid");
        core.elements['global-loader'].show();
        vxg.api.cloudone.camera.setLocations(channel_id, "").then(function() {
            window.location.reload();
        }, function(err) {
            alert(err.responseJSON.errorDetail);
            window.location.reload();
        })
    });

	$('.sparkline').each(function () {
	    let dataset = $(this).data('dataset').split(',').map(x=>+x);
	    $(this).sparkline(dataset, {
		type: 'bar',
		height: '20px',
		width: '200px',
		barColor: '#7BB247',
		barSpacing: 4
	    });
	    let roToken = $(this).data('token');
	    if (self.sparklineLoad !== undefined
	    && roToken !== undefined
	    ) {
		self.sparklineLoad( this, roToken, controller);
	    }
	});
}

function checkPlan(plan_id) {
    $("#plan_" + plan_id).prop("checked", true);
}

VXGCameraListView.prototype.showWait = function showWait(isWait) {
    let element = this.container;

    if (isWait) {
        $(element).addClass("waitdata");
    } else {
        $(element).removeClass("waitdata");    
    }
};

VXGCameraListView.prototype.showSparklineWait  = function showSparklineWait(element, isWait) {

    if (isWait) {
        $(element).find('canvas').addClass("waitdata");
    } else {
        $(element).find('canvas').removeClass("waitdata");    
    }
}

VXGCameraListView.prototype.updateSparkline = function updateSparkline(element, data) {
    
    $(element).sparkline(data,{
		type: 'bar',
		height: '20px',
		width: '200px',
		barColor: '#7BB247',
		barSpacing: 4
	    });
}

/*------CONTROLLER--*/
///init component func
///element - <div>-element to which VXGChart vill be connected
var VXGCameraListController = function VXGCameraListController( element ) {
    if (element === undefined) {
	return;
    }
    this.clModel	= new VXGCameraListModel();
    this.clView		= new VXGCameraListView( element );

    this.clView.element.showCameraList 	= this.showCameraList.bind(this);
    this.clView.element.getCameraByCamid= this.objByCamid.bind(this);
    this.clView.element.setSparklineSettings = this.setSparklineSettings.bind(this);
    this.clView.element.setAllCamToken 	= this.setAllCamToken.bind(this);

    this.clView.initDraw(this);
};

VXGCameraListController.prototype.showCameraList = function showCameraList (cameraListApiFunc, cameraListWrongFunc, listControllCallbackFunc, first) {
    let self = this;
    if (first) this.offset=0;
    this.clView.callbackFunc 	= listControllCallbackFunc;
    this.clModel.getData(this.updateDataCB.bind(this), this.showWait.bind(this), cameraListApiFunc, cameraListWrongFunc, this.offset===undefined?0:this.offset , 20).then(function(r){
        if (!r) $(self.clView.element).find('.more').show();
        else $(self.clView.element).find('.more').hide();
    });
    this.clView.element.getElementsByClassName('more')[0].onclick = function(){
        $(self.clView.element).find('.more').hide();
        if (self.offset===undefined) self.offset=0;
        self.offset += 20;
        self.showCameraList (cameraListApiFunc, cameraListWrongFunc, listControllCallbackFunc);
    }
}

VXGCameraListController.prototype.setAllCamToken = function setAllCamToken (token) {
    this.allCamToken = token;
}

VXGCameraListController.prototype.setSparklineSettings = function setSparklineSettings (sparklineBars=8, sparklinePeriod=3600) {
    this.sparklineBars		= sparklineBars;
    this.sparklinePeriod	= sparklinePeriod;
    
    this.clView.sparklineLoad = this.getSparklineData.bind();
}

///showCameraList - connect callback(CB)-function beetwen chartModel and chartView
VXGCameraListController.prototype.updateDataCB = function updateDataCB(vxgcameralistdata, offset, total, allcamtoken) {
    this.list = vxgcameralistdata;
	this.listoffset = offset;
	this.listtotal  = total;

    var obj = null;    
    
    if (allcamtoken === undefined) {
	if (this.allCamToken !== undefined) {
	    allcamtoken = this.allCamToken;
	}
    }
    
    if (vxgcameralistdata.length > 0) {
	var obj = vxgcameralistdata[0];
	if (allcamtoken !== undefined) {
	    obj.allCamsToken = allcamtoken;
	} 
    }
    if (!offset) this.clView.callbackFunc('gotData', obj);

    this.clView.render(this, vxgcameralistdata, offset, total, allcamtoken);
};

VXGCameraListController.prototype.updateSparklineDataCB = function updateSparklineDataCB (element, vxgToken, data) {
    if (this.list !== undefined 
    && this.list.length > 0) {
	let obj = this.objByRoToken(vxgToken);
	obj.sparklineData = data;
	
	this.clView.callbackFunc('gotSparklineData', obj);
    }
    this.clView.updateSparkline(element, data);
}

VXGCameraListController.prototype.getSparklineData = function getSparklineData( element, cameraToken, self=this ) {
    if ( element	!= undefined 
    && cameraToken	!= undefined
    ) {
        self.clModel.getSparklineData( element,  cameraToken, self.updateSparklineDataCB.bind(self), self.showSparklineWait.bind(self), self.spraklineBars, self.sparklinePeriod);
    }
}

///showWait - connect function beetwen chartModel and chartView
VXGCameraListController.prototype.showSparklineWait = function showSparklineWait (element, isWait) {
    this.clView.showSparklineWait(element, isWait);
};


VXGCameraListController.prototype.objByIndex = function objByIndex( index ) {
    if ((index !== undefined) && (index >= 0) && (index < this.list.length)) {
	return this.list[index];
    }
    return null;
}

VXGCameraListController.prototype.objByCamid = function objByCamid ( camid ) {
    var ret_val = null;
    if (this.list !== undefined) {
	for (var i = 0; i < this.list.length; i++) {
	    if (this.list[i]["camera_id"] == camid) {
		ret_val = this.list[i];
		break;
	    }
	}
    }
    return ret_val;
}

VXGCameraListController.prototype.objByRoToken = function objByRoToken ( token ) {
    var ret_val = null;
    if (this.list !== undefined) {
	for (var i = 0; i < this.list.length; i++) {
	    if (this.list[i].token == token) {
		ret_val = this.list[i];
		break;
	    }
	}
    }
    return ret_val;
}

///showWait - connect function beetwen chartModel and chartView
VXGCameraListController.prototype.showWait = function showWait (isWait) {
    console.warn('DEBUG swhoWait '+ isWait);
    this.clView.showWait(isWait);
};
