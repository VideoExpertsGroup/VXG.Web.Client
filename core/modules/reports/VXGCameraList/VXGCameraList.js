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
    +	'		<table class="table-hover no-margins with-images cameras-list" style="border-collapse: collapse;">'
    +	'		<thead>'
    +	'			<tr>'
    +	'				<th>Preview</th>'
    +	'				<th>Name</th>'
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

VXGCameraListView.prototype.showMenu = function showMenu(event, whoCall, indexCarrier, controller, self=this) {
	let el = $(whoCall).find('.VXGCameraListMenu');
	let menu = ''
    +	'<div class="VXGCameraListMenu">'
    +	'	<div class="svgbtnbeforehover mcamera" ifscreen="tagsview" onclick_toscreen="tagsview">Timeline</div>'
    +	'	<div class="svgbtnbeforehover msetting" ifscreen="camerasettings">Camera</div>'
    +	'	<div class="svgbtnbeforehover mchart" ifscreen="camerameta">Metadata</div>'
    +	'	<div class="svgbtnbeforehover mconfigure" ifscreen="addcamera">Config</div>'
    +	'	<div class="svgbtnbeforehover mtrash">Remove</div>'
    +	'</div>';
	if (!el.length) {
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
                                localStorage.removeItem(camera.camera_id);
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
        
	$.each(vxgcameralistdata, function (index) {
            if (vxgcameralistdata[index].src.name.substr(0,11)=="#StorageFor" && !isNaN(parseInt(vxgcameralistdata[index].src.name.substr(11)))) return;
            if (vxgcameralistdata[index].src&&vxgcameralistdata[index].src.meta&&vxgcameralistdata[index].src.meta.isstorage=='isstorage') return;

	    vxgcameralistdata[index].allCamsToken = allcamtoken;

	    let sparkline = [];
	    let sparklineBars = controller.sparklineBars;
	    for(let i=0; i < sparklineBars; i++){
	        sparkline.push(self.getRandomInt(0, 10))
	    }
	    
//	    let dataraw = JSON.stringify(bsrc)
	        
	    let tr = 
	'<tr class="sl'+vxgcameralistdata[index].camera_id+'" data-index="' + index + '" access_token="'+ vxgcameralistdata[index].token  +'">' 
    +	'	<td><div ><campreview></campreview></div></td>' 
    +	'	<td class="sname"></td>' 
    +	'	<td class="sloc"></td>' 
//    +	'	<td class="sparkline-container"><span class="sparkline" data-token="' + vxgcameralistdata[index].token + '" data-dataset="'+sparkline+'" style="display:none"></span></td>' 
    +	'	<td class="showai" data-token="' + vxgcameralistdata[index].camera_id + '"></td>' 
    +	'	<td ifscreen="plan2camera"><div class="splan vxgbutton-transparent hide" onclick_toscreen="plan2camera"></div></td>'
    +	'	<td class="VXGCameraListActions">'
    +	'	<div class="VXGCameraListSettings"><svg class="inline-svg-icon icon-action"><use xlink:href="#action"></use></svg></div>'
    +	'	</td>'
    +	'</tr>';

	    $(tbody).append( $(tr) );
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








/*
            this.getBsrc().then(function(bsrc){
	        let sparkline = [];
	        let sparklineBars = controller.sparklineBars;
	        for(let i=0; i < sparklineBars; i++){
	            sparkline.push(self.getRandomInt(0, 10))
	        }
	    
	        let dataraw = JSON.stringify(bsrc)
	        
	        let tr = 
	'<tr cameraod="" data-index="' + index + '" access_token="'+ bsrc.roToken  +'">' 
    +	'	<td><div ><campreview></campreview></div></td>' 
    +	'	<td>'+bsrc.name+'</td>' 
    +	'	<td>' + ((bsrc.location==null) ? "" : bsrc.location) + '</td>' 
    +	'	<td class="sparkline-container"><span class="sparkline" data-token="' + bsrc['roToken'] + '" data-dataset="'+sparkline+'"></span></td>' 
    +	'	<td ifscreen="plan2camera"><span class="vxgbutton-transparent" onclick_toscreen="plan2camera">'+(bsrc['planName'] ? bsrc['planName'] : 'UPGRADE')+'</span></td>'
    +	'	<td class="VXGCameraListActions">'
    +	'	<div class="VXGCameraListSettings"><svg class="inline-svg-icon icon-action"><use xlink:href="#action"></use></svg></div>'
    +	'	</td>'
    +	'</tr>';

	        $(tbody).append( $(tr) );
		//Clicks on 1st column of row -> play camera
	        $(tbody).find('td:nth-child(1)').off('click').on('click',function(){
	    	    let index = $(this).parent().data('index');	    
	    	    let obj = controller.objByIndex(index);
		
		    if (self.callbackFunc !== undefined) 
		        self.callbackFunc("play", obj);
	        });
		//Clicks on any column of row except camera preview and actions -> update chart
	        $(tbody).find('td:nth-child(2),td:nth-child(3),td:nth-child(4)').off('click').on('click',function(){
		    let index = $(this).parent().data('index');	    
		    let obj = controller.objByIndex(index);

		    if (self.callbackFunc !== undefined) 
		        self.callbackFunc("statistics", obj);
	        });
	    //Clicks on columt with actions -> show menu with some actions
	        $(tbody).find('.VXGCameraListSettings').unbind().bind('click', function(event){
		    self.showMenu(event, this, $(this).parent().parent(), controller, self );
	        });
            });
*/
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
	$('.showai').each(function () {
	    let s = this;
	    let camid = $(this).data('token');
            window.vxg.cameras.getCameraByIDPromise(parseInt(camid)).then(function(camera){
                return camera.events.getList(1, 0, undefined, undefined, 'object_and_scene_detection,yolov4_detection', 'Person,Car').then(function(r){
                    if (!r.length) return;
                    $(s).html('<button class="vxgbutton-transparent" access_token="'+camid+'">Show AI</button>');
		    //Clicks on any column of row except camera preview and actions -> update chart
		    $(s).find('button').off('click').on('click',function(){
			let index = $(this).parent().parent().data('index');	    
			let obj = controller.objByIndex(index);

			if (self.callbackFunc !== undefined) 
			    self.callbackFunc("statistics", obj);
		    });

                });
            });

        });
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
