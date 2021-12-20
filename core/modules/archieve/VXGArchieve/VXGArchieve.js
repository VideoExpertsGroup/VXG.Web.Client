/*-------MODEL-------*/
var VXGArchieveModel = function VXGArchieveModel() {
};

VXGArchieveModel.prototype.getData = function getData( params, updateDataCBFunc, waitFunc, apiFunc, apiWrongFunc ) {

    //let accesToken	= params["roToken"];
    let requestParams	= params["requestParams"];
    let prevOffset 	= requestParams["offset"];

    waitFunc(true);

	// Konst We need to change requestParams on parameters and change API a little bit
    apiFunc (requestParams['token'], requestParams['limit'], requestParams['offset'], requestParams ).done(function (eventlist) {
	waitFunc(false);
	params.requestParams.offset = prevOffset;
	updateDataCBFunc(params, eventlist['objects']);
    }).fail(function (r) {
	waitFunc(false);
	console.error(r);
	apiWrongFunc(r);
    });
}

VXGArchieveModel.prototype.getData2 = function (params, updateDataCBFunc, waitFunc, getClipIdsByMetaFunc, getClipsByIdSetFunc, apiWrongFunc ) {
	let token = params.token;
	let word  = params.searchword;
	
	waitFunc(true);
	getClipIdsByMetaFunc( token , word ).done( function(res){

		var clipids = '';
		for (var i=0; i < res.objects.length; i++){
			if (clipids === '') {
				clipids += res.objects[i].long.clip_id;
			} else {
				clipids += ',' + res.objects[i].long.clip_id;
			}
		}
		if (clipids === '') {
			waitFunc(false);
			updateDataCBFunc(params, [] );
		} else {
			getClipsByIdSetFunc (token, clipids).done( function(eventlist){
				waitFunc(false);
				updateDataCBFunc(params, eventlist['objects']);
			}).fail( function(err2) {
				waitFunc(false);
				apiWrongFunc(err2);
				console.error(err2);
			});
		}
	}).fail( function(err) {
		waitFunc(false);
		apiWrongFunc(err);
		console.error(err);
	});
}

VXGArchieveModel.prototype.deleteClip = function deleteClip( params, deleteClipFunc, controller ) {
    let token = params.token;
    let clipid = params.clipid;

    if (token === undefined || clipid === undefined) {
	controller.apiWrongFunc('DeleteClip: wrong parameters');
	return;
    }
    controller.showWait(true);

    deleteClipFunc (token, clipid ).done(function ( result ) {
	controller.showWait(false);
	controller.updateList();
    }).fail(function (r) {
	controller.showWait(false);
	controller.wrongFunc(r);
	controller.updateList();
	console.error(r);
    });
}

VXGArchieveModel.prototype.getMeta = function getMeta( getmetaFunc, params, viewInstance ) {
	viewInstance.showWaitInfo(true);
	
	let token = params.token;
	let clipid = params.clipid;
	
	if (token === undefined || clipid === undefined) {
		viewInstance.infoError('invalid parameters');
		viewInstance.showWaitInfo(false);
		return;
	}
	getmetaFunc (token , clipid)
	.done (function(data){ 
		viewInstance.renderInfo(data, 'get');
		viewInstance.showWaitInfo(false);
	}).fail ( function(r){
		viewInstance.infoError(r.statusText);
		viewInstance.showWaitInfo(false);
	})
}

VXGArchieveModel.prototype.createMeta = function createMeta( createmetaFunc, params, viewInstance ) {
	viewInstance.showWaitInfo(true);
	
	let token = params.token;
	let clipid = params.clipid;
	let note = params.note;
	let time  = params.time;
	let clipname = params.clipname;
	let clipcase = params.clipcase;
	let clipincident = params.clipincident;
	
	if (token === undefined || clipid === undefined || note === undefined || time === undefined) {
		viewInstance.infoError('invalid parameters');
		viewInstance.showWaitInfo(false);
		return;
	}
	createmetaFunc (token , clipid, note, time, clipname, clipcase, clipincident)
	.done (function(data){ 
		viewInstance.renderInfo(data, 'create');
		viewInstance.showWaitInfo(false);
	}).fail ( function(r){
		viewInstance.infoError(r.statusText);
		viewInstance.showWaitInfo(false);
	})
}

VXGArchieveModel.prototype.updateMeta = function updateMeta( updatemetaFunc, params, viewInstance ) {
	viewInstance.showWaitInfo(true);
	
	let token = params.token;
	let id = params.id;
	let note = params.note;
	let clipname = params.clipname;
	let clipcase = params.clipcase;
	let clipincident = params.clipincident;
	
	if (token === undefined || id === undefined || note === undefined ) {
		viewInstance.infoError('invalid parameters');
		viewInstance.showWaitInfo(false);
		return;
	}
	
	updatemetaFunc (token , id, note, clipname, clipcase, clipincident)
	.done (function(data){ 
		viewInstance.renderInfo(data, 'update');
		viewInstance.showWaitInfo(false);
	}).fail ( function(r){
		viewInstance.infoError(r.statusText);
		viewInstance.showWaitInfo(false);
	})
}

VXGArchieveModel.prototype.shareClip = function shareClip( shareclipFunc, getclipFunc,  params, viewInstance ) {
	viewInstance.showWaitShare(true);
	
	let token  = params.token;
	let clipid = params.clipid;
	let expire = params.expire;

	if (token === undefined || clipid === undefined || expire === undefined ) {
		viewInstance.shareError('invalid parameters');
		viewInstance.showWaitShare(false);
		return;
	}
	
	shareclipFunc (token , clipid, expire)
	.done (function(data_share){ 
		data_share.clipid = clipid;
		viewInstance.renderShare(data_share);
		viewInstance.showWaitShare(false);
/*	
		let spectoken = data_share.token;
		if( spectoken === undefined) {
			viewInstance.shareError(r.statusText);
			viewInstance.showWaitShare(false);
		} else {
			getclipFunc (token, spectoken, clipid)
			.done(function(data_clip){
				viewInstance.renderShare(data_clip);
				viewInstance.showWaitShare(false);
			}).fail( function(r){
				viewInstance.shareError(r.statusText);
				viewInstance.showWaitShare(false);
			})
		}
*/		
	}).fail ( function(r){
		viewInstance.shareError(r.statusText);
		viewInstance.showWaitShare(false);
	})
}


/*-------VIEW--------*/

/*MAIN FUNCTIONALITY*/

var VXGArchieveView = function VXGArchieveView(element) {
    this.element = element;
};

VXGArchieveView.prototype.capitalizeFirstLetter = function(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

VXGArchieveView.prototype.initDraw = function initDraw(controller) {

    this.element.innerHTML =
    	'<div class= "VXGArchieveContainer">'
    +	'	<div class= "VXGArchieveContainer2">'
    +	'		<div class="Archieve-content">'
    +	'			<div class="feed-Archieve-list"></div>'
    +	'			<div class="d-flex w-100"><div class="VXGArchieveMore vxgbutton-transparent">More...</div></div>'
    +	'		</div>'
    +	'		<div class="VXGArchieveNoData"><span>No clips</span></div>'
    +	'		<div class="VXGArchieveWaiter"></div>'
    +	'	</div>'
    +	'	<div class="VXGArchieveCurtain"></div>'
    +	'	<div class="VXGArchieveDeleteDialog">'
    +	'		<div class="VXGArchieveInfoHeader"><div class="VXGArchieveDeleteTitle">Delete clip</div></div>'
    +	'		<table class="VXGArchiveDeleteTable">'
    +	'			<tr><td colspan=2>Deleting clip&nbsp;<span class="VXGArchieveDeleteClipname">%clipname%</span></td></tr>'
    +	'			<tr><td colspan=2><span>Are you sure?</span></td></tr>'
    +	' 			<tr style="height: 50px; vertical-align: bottom;"><td style="text-align: right;"><div class="VXGArchieveDeleteConfirm vxgbutton-transparent">Delete</div></td>'
    +	'				<td style="text-align: left;"><div class="VXGArchieveDeleteCancel vxgbutton-transparent">Cancel</div></td></tr>'
    +	'		</table>'
    +	'	</div>'
    +	'	<div class="VXGArchieveInfo">'
    +	'		<div class="VXGArchieveInfoHeader"><div class="VXGArchieveInfoClose"></div><div class="VXGArchieveInfoTitle"><span>Notes</span></div></div>'
    +	'		<div class="VXGArchieveInfoContent">'
    +	'			<table class="VXGArchiveInfoTable">'
    +	'				<tr><td>Name:</td><td><div class="VXGArchieveInfoNameValue"></div></td></tr>'
    +	'				<tr><td>Camera:</td><td><div class="VXGArchieveInfoCamnameValue"></div></td></tr>'
    +	'				<tr><td>Time:</td><td><div class="VXGArchieveInfoDateValue"></div></td>	</tr>'
    +	'				<tr><td>Incident:</td><td><div class="VXGArchieveInfoIncidentValue"></div></td></tr>'
    +	'				<tr><td>Case:</td><td><input class="VXGArchieveInfoCaseValue"></name></td></tr>'
    +	'				<tr style="height:100%;"><td colspan=2>	<textarea maxlength=300 class="VXGArchieveInfoDesc" placeholder="Enter note text..."></textarea></td></tr>'
    +	'			</table>'
    +	'		</div>'
    +	'		<div class="VXGArchieveInfoError"></div>'
    +	'		<div class="VXGArchieveInfoControls"><div class="VXGArchieveInfoApply vxgbutton-transparent">Apply</div></div>'
    +	'		<div class="VXGArchieveInfoWaiter"></div>'
    +	'	</div>'
    +	'	<div class="VXGArchieveShare">'
    +	'		<div class="VXGArchieveInfoHeader"><div class="VXGArchieveShareClose"></div><div class="VXGArchieveInfoTitle"><span>Share</span></div></div>'
    +	'		<div class="VXGArchieveInfoContent">'
    +	'			<table class="VXGArchiveShareTable">'
    +	'				<tr><td>Name:</td><td colspan=2><div class="VXGArchieveShareNameValue">TODO</div></td></tr>'
    +	'				<tr><td>Camera:</td><td colspan=2><div class="VXGArchieveShareCamnameValue">TODO</div></td></tr>'
    +	'				<tr><td colspan=3><div class="VXGArchieveShareGroup">'
    +	'					<div class="VXGArchieveShare30m vxgbutton-transparent">30 mins</div>'
    +	'					<div class="VXGArchieveShare1h vxgbutton-transparent">1 hour</div>'
    +	'					<div class="VXGArchieveShare12h vxgbutton-transparent">12 hours</div></div></td></tr>'
    +	'				<tr style="height:100%;"><td colspan=3><textarea maxlength=300 class="VXGArchieveShareLink" placeholder="Link will be here..."></textarea></td></tr>'
    +	'			</table>'
    +	'		</div>'
    +	'		<div class="VXGArchieveShareError"></div>'
    +	'		<div class="VXGArchieveInfoControls"><div class="VXGArchieveShareCopyLink vxgbutton-transparent">Copy link</div></div>'
    +	'		<div class="VXGArchieveShareWaiter"></div>'
    +	'	</div>'
    +	'	<div class="VXGArchievePlayer">'
    +	'		<div class="VXGArchieveInfoHeader"><div class="VXGArchievePlayerClose"></div><div class="VXGArchieveInfoTitle"><span>Player</span></div></div>'
    +	'		<div class="VXGArchieveInfoContent">'
    +	'			<table class="VXGArchiveInfoTable">'
    +	'				<tr><td>Name:</td><td><div class="VXGArchievePlayerNameValue">TODO</div></td></tr>'
    +	'				<tr><td>Camera:</td><td><div class="VXGArchievePlayerCamnameValue">TODO</div></td></tr>'
    +	'				<tr><td colspan=2>'
    +	'					<video controls class="VXGArchievePlayerVideo" style="width:100%;height:32vw;"><source class="VXGArchievePlayerSourceValue"/></video>'
    +	'				</td></tr>'
    +	'			</table>'
    +	'		</div>'
    +	'	</div>'
    +	'</div>';
    let element = this.element;

    let self		= this;

    this.controller	= controller;
    this.more		= this.element.getElementsByClassName('VXGArchieveMore')[0];
    this.container	= this.element.getElementsByClassName('VXGArchieveContainer')[0];
    this.waiter		= this.element.getElementsByClassName('VXGArchieveWaiter')[0];
    this.nodata		= this.element.getElementsByClassName('VXGArchieveNoData')[0];
    this.info		= this.element.getElementsByClassName('VXGArchieveInfo')[0];
    this.infowaiter	= this.element.getElementsByClassName('VXGArchieveInfoWaiter')[0];
    this.infonote 	= this.element.getElementsByClassName('VXGArchieveInfoDesc')[0];
    this.share		= this.element.getElementsByClassName('VXGArchieveShare')[0];
    this.sharewaiter	= this.element.getElementsByClassName('VXGArchieveShareWaiter')[0];
    this.sharelink 	= this.element.getElementsByClassName('VXGArchieveShareLink')[0];
    this.player		= this.element.getElementsByClassName('VXGArchievePlayer')[0];
    this.deletedialog 	= this.element.getElementsByClassName('VXGArchieveDeleteDialog')[0];
    this.curtain 	= this.element.getElementsByClassName('VXGArchieveCurtain')[0];

    

    $(self.share).find('.VXGArchieveShareClose').unbind().click( function() {
	self.hideShare();
    });

    $(self.share).find('.VXGArchieveShare30m').unbind().click( function() {
	shareByDelta(self, controller, 30*60*1000);
    });

    $(self.share).find('.VXGArchieveShare1h').unbind().click( function() {
	shareByDelta(self, controller, 60*60*1000);
    });

    $(self.share).find('.VXGArchieveShare12h').unbind().click( function() {
	shareByDelta(self, controller, 12*60*60*1000);
    });

    $(self.share).find('.VXGArchieveShareCopyLink').unbind().click( function() {
    	let link = self.share.getElementsByClassName('VXGArchieveShareLink')[0];
	var text = link.value;
	navigator.clipboard.writeText(text).then(function() {
	    console.log('Async: Copying to clipboard was successful!');
	}, function(err) {
	    console.error('Async: Could not copy text: ', err);
	});
    });

    $(self.player).find('.VXGArchievePlayerClose').unbind().click( function() {
	self.hidePlayer();
    });

    let emptyModel = [];
    this.render(controller, emptyModel);
}

function minTwoDigits(n) {
    return (n < 10 ? '0' : '') + n;
};

function timeToUtcString(time) {
	var retval = time.getUTCFullYear() 
	+ "-" + minTwoDigits(Number(time.getUTCMonth()) + 1) 
	+ "-" + minTwoDigits(time.getUTCDate()) 
	+ "T" + minTwoDigits(time.getUTCHours()) 
	+ ":" + minTwoDigits(time.getUTCMinutes()) 
	+ ":" + minTwoDigits(time.getUTCSeconds());
	
	return retval;
}


VXGArchieveView.prototype.timeDifference = function timeDifference(current, previous) {
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

VXGArchieveView.prototype.objByCamid = function objByCamid ( camid ) {
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

VXGArchieveView.prototype.render = function render(controller, params, VXGArchievedata) {
    let dataContainer = this.element.getElementsByClassName('feed-Archieve-list')[0];

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
	$(dataContainer).empty();
    }

    if (offset == 0 && (VXGArchievedata === undefined || VXGArchievedata.length == 0)) {
	let span = $(this.nodata).find("span")[0];
        $(span).text("No clips");
	$(this.nodata).addClass("visible");
    } else {
	$(this.nodata).removeClass("visible");
    }

    if (VXGArchievedata !== undefined && VXGArchievedata.length == limit) {
	$(this.more).addClass('visible');
    } else {
	$(this.more).removeClass('visible');
    }

    if ( VXGArchievedata === undefined ) {
	return;
    }

    let currentTime = new Date();
    let self = this;


    $.each(VXGArchievedata, function () {
	    if (this.status !== 'done') {
		return; //continue-analog
	    }
	    let clip = this;
	    var options_date = {  year: 'numeric', month: '2-digit', day: '2-digit' };
	    var options_time = {  hour: '2-digit', minute: '2-digit', second: '2-digit' };
	    let date_created = new Date(this.created+"Z");
	    let date_incident = new Date(this.start+"Z");
	    
	    let timeCreated = date_created.toLocaleString('en-US',options_date) + " " + date_created.toLocaleTimeString('en-US',options_time);
	    let timeIncident = date_incident.toLocaleString('en-US',options_date) + " " + date_incident.toLocaleTimeString('en-US',options_time);
	    
	    var cameraInfo = '';
	    var camtoken = '';
	    var camname = '';
	    var allcamtoken = '';
	    var storagetoken = '';
	    
	    var camera = null;
	    var source_camera = null;

	    if (this.source_camid !== undefined) {
		source_camera = self.objByCamid(this.source_camid);
	    } 
	    camera = self.objByCamid(this.camid);
	    
	    if (source_camera != null) {
		camname = ' camname="'+source_camera.src.name +'"';
		camtoken = ' camtoken="'+source_camera.src.token+'"';
		allcamtoken = ' allcamtoken="' + self.allCamsToken  + '"';
		cameraInfo = '<span">'+source_camera.src.name+'</span>';
		storagetoken = ' storagetoken="' + params.roToken + '"';
	    } else if (camera != null) {
		allcamtoken = ' allcamtoken="' + self.allCamsToken  + '"';
		camname = ' camname="'+camera.src.name +'"';
		camtoken = ' camtoken="'+camera.src.token+'"';
		cameraInfo = '<span">'+camera.src.name+'</span>';
		storagetoken = ' storagetoken="' + params.roToken + '"';
	    }

	    let size = this.size || 0;
	    let sizekb = size/1024;
	    var sizeString = 0 + ' MB';
	    if (sizekb > 1024 ) {
		sizeString = Number(size/(1024*1024)).toFixed(2) + ' MB';
	    }  else {
		sizeString = Number(size/(1024)).toFixed(2) + ' KB';
	    }

	    let clipLength = new Date(this.duration * 1000).toISOString().substr(11, 8);

            let feedEl =
		'<div class="feed-Archieve-element mr-3">'
	    +	'	<div class="VXGArchieveClipInfo" clipurl="' + this.url + '" clipid="' + this.id +'" cliptitle="'+ this.title+'" camid="'+this.camid +'"' + camtoken + camname + allcamtoken + storagetoken + '>'
	    +	'		<div class="clip-info-container">'
	    +   '			<div class="clip-size">'+sizeString+'</div><div class="clip-length">'+clipLength+'</div>'
	    +   '		</div>'
	    +	'		<div class="arch-image-container">'
	    +	'			<img ' + ( (this.thumb && this.thumb.url) ? ('src="' + this.thumb.url + '"' ) : '') + ' alt="">'
	    +	'			<div class="VXGArchievePlayButton"></div>'
	    +	'		</div>'
	    +	'		<div class="VXGArchieveCardInfo">'
	    +	'			<div class="VXGArchieveCardInfoMain">'
	    +	'				<div class="VXGArchieveCreated"><div class="VXGArchieveCardInfoCreatedValue">' + timeCreated + '</div></div>'
	    +	'				<div class="VXGArchieveCardInfoTitle">' + ((this.title.length > 0)? this.title : '&nbsp;') + '</div>'
	    +	'				<div class="VXGArchieveCardInfoCamera">' + cameraInfo  + '</div>'
//	    +	'				<div class="VXGArchieveIncident"><div class="VXGArchieveCardInfoIncident">Incident:</div><div class="VXGArchieveCardInfoIncidentValue">' + timeIncident + '</div></div>'
//	    +	'				<div class="VXGArchieveCreated"><div class="VXGArchieveCardInfoCreated">Created:</div><div class="VXGArchieveCardInfoCreatedValue">' + timeCreated + '</div></div>'
	    +	'			</div>'
	    +	'			<div class="VXGArchieveSettings"></div>'
	    +	'		</div>'
	    +	'		<div class="VXGArchieveMenu">'
	    +	'			<div class="VXGArchieveClipMeta">Notes</div>'
	    +	'			<div class="VXGArchieveClipDownload">Download</div>'
	    +	'			<div class="VXGArchieveClipShare">Share</div>'	    
	    +	'			<div class="VXGArchieveClipDelete">Delete</div>'
	    +	'		</div>'
	    +	'	</div>'
	    +	'</div>';
	    $(dataContainer).append($(feedEl));
	});
	
	$('.VXGArchieveSettings').unbind().click( function() {
		$(this).parent().next('.VXGArchieveMenu').addClass('visible');
	});
	$('.VXGArchieveMenu').mouseleave(function(){
	    $('.VXGArchieveMenu').removeClass('visible');
	});
	
	$('.VXGArchievePlayButton').unbind().click( function() {
		if (self.callbackFunc) {
			var clipinfo = {};
			clipinfo.clipurl = $(this).parent().parent().attr('clipurl');
			clipinfo.cliptitle = $(this).parent().parent().attr('cliptitle');
			clipinfo.camname = $(this).parent().parent().attr('camname');
			clipinfo.camid = $(this).parent().parent().attr('camid');
			clipinfo.clipid = $(this).parent().parent().attr('clipid');
			clipinfo.camtoken = $(this).parent().parent().attr('camtoken');
			clipinfo.allcamtoken = $(this).parent().parent().attr('allcamtoken');
			if (!clipinfo.allcamtoken) clipinfo.allcamtoken = vxg.user.src.allCamsToken;

			self.callbackFunc('play', clipinfo);
		} else {
			let clipurl = $(this).parent().parent().attr('clipurl');
			let cliptitle = $(this).parent().parent().attr('cliptitle');
			let camname = $(this).parent().parent().attr('camname');
			self.showPlayer(clipurl, cliptitle, camname);	    
		}
	});
	
	$('.VXGArchieveClipDownload').unbind().click( function() {
		let clipurl = $(this).parent().parent().attr('clipurl');
		let cliptitle = $(this).parent().parent().attr('cliptitle');
		var dlAnchorElem = document.createElement('a');
		dlAnchorElem.setAttribute("href",     clipurl     );
		dlAnchorElem.setAttribute("download", cliptitle);
	        dlAnchorElem.click();
	});
	$('.VXGArchieveClipDelete').unbind().click( function() {
		let clipid = $(this).parent().parent().attr('clipid');
		let camtoken = $(this).parent().parent().attr('camtoken');
		let allcamtoken = $(this).parent().parent().attr('allcamtoken');
		let cliptitle = $(this).parent().parent().attr('cliptitle');
		
		if (allcamtoken == null || allcamtoken === undefined) {
			allcamtoken = camtoken;
		}
		$('.VXGArchieveMenu').removeClass('visible');
		self.showDeleteDialog(clipid, cliptitle, allcamtoken);
	});
	$('.VXGArchieveClipShare').unbind().click( function() {
		let clipid = $(this).parent().parent().attr('clipid');
		let camid = $(this).parent().parent().attr('camid');
		let camtoken = $(this).parent().parent().attr('camtoken');
		let allcamtoken = $(this).parent().parent().attr('allcamtoken');
		let camname = $(this).parent().parent().attr('camname');
		let title = $(this).parent().parent().attr('cliptitle');
		
		if (allcamtoken == null || allcamtoken === undefined) {
			allcamtoken = camtoken;
		}
		self.showShare(clipid, title, camid, allcamtoken, camname);
	});
	$('.VXGArchieveClipMeta').unbind().click( function() {
		let clipid = $(this).parent().parent().attr('clipid');
		let camid = $(this).parent().parent().attr('camid');
		let camtoken = $(this).parent().parent().attr('camtoken');
		let allcamtoken = $(this).parent().parent().attr('allcamtoken');
		let storagetoken = $(this).parent().parent().attr('storagetoken');
		let camname = $(this).parent().parent().attr('camname');
		let title = $(this).parent().parent().attr('cliptitle');
		let clipcase = '';
		let clipincident = new Date();
		if (storagetoken == null || storagetoken === undefined) {
			storagetoken = camtoken;
		}

		self.showInfo(clipid, title, camid, storagetoken, camname, clipcase='', clipincident.getTime());
	});
        $(this.more).unbind().click(function(){
	    controller.moreData(params);
        });
}


VXGArchieveView.prototype.showWait = function showWait(isWait) {
    let element = this.waiter;
    //let more	= this.more;
    let nodata = this.nodata;

    if (isWait === undefined) {
	var iswait = $(element).hasClass("waitdata");
	isWait = !iswait;
        $(nodata).addClass("visible"); //trick - for fake request
    }

    if (isWait) {
        $(element).addClass("waitdata");
        $(nodata).removeClass("visible");
    } else {
        $(element).removeClass("waitdata");
    }
};

/*NOTES FUNCTIONALITY*/

VXGArchieveView.prototype.showWaitInfo = function showWaitInfo(isWait) {

    let element = this.infowaiter;
    if (isWait) {
        $(element).addClass("waitdata");
    } else {
        $(element).removeClass("waitdata");
    }
};

VXGArchieveView.prototype.infoError = function infoError(description) {
	console.log('TODO: infoError:' + description);
	let self = this;
	
	let dateel = self.info.getElementsByClassName('VXGArchieveInfoError')[0];
	dateel.innerHTML = dateel.inerHtml = dateel.innerhtml = '<span>Error: ' +  description + '</span>';
};

VXGArchieveView.prototype.renderInfo = function renderInfo(data, method) {
	let self = this;
	if (method === 'get') {
		if (data!==undefined && data.objects!==undefined && data.objects.length == 0) {
			$(self.info).attr("newnote", true);
		} else {
			var id = data.objects[0].id;
			var time = data.objects[0].timestamp;
			var note = data.objects[0].string.description;
			var clipname = data.objects[0].string.clipname;
			var clipcase = data.objects[0].string.clipcase;
			var clipincident = data.objects[0].long.incident;
			
			$(self.info).attr("newnote", false);
			$(self.info).attr("id", id);
			$(self.info).attr("time", time);
			
			self.infonote.value = note;
			
			let date = new Date(time+'Z');
			var timeString = date.toLocaleString();
			let dateel = self.info.getElementsByClassName('VXGArchieveInfoDateValue')[0];
			dateel.innerHTML = dateel.inerHtml = dateel.innerhtml = timeString;
			
			if (clipincident !== undefined) {
				let incdate = new Date(clipincident);
				timeString = incdate.toLocaleString();
				$(self.info).attr("clipincident", clipincident);
			} else {
				timeString = '';
			}
			let incdateel = self.info.getElementsByClassName('VXGArchieveInfoIncidentValue')[0];
			incdateel.innerHTML = incdateel.inerHtml = incdateel.innerhtml = timeString;
			
			if (clipcase === undefined) {
				clipcase = '';
			} else {
				$(self.info).attr("clipcase", clipcase);
			}
			let caseel = self.info.getElementsByClassName('VXGArchieveInfoCaseValue')[0];
			caseel.value = clipcase;
		}
	} else if (method === 'create' || method === 'update') {
		var id = data.objects[0].id;
		var time = data.objects[0].timestamp;

		$(self.info).attr("newnote", false);
		$(self.info).attr("id", id);
		$(self.info).attr("time", time);
		
		self.hideInfo();
	}
};

VXGArchieveView.prototype.hideInfo = function hideInfo() {
	let self = this;
	self.info.classList.remove('visible');
	self.curtain.classList.remove('visible');
}


VXGArchieveView.prototype.showInfo = function showInfo (clipid, cliptitle, cameraid, cameratoken, cameraname, clipcase, clipincident ) {
	let self = this;
	self.hideShare();
	self.hidePlayer();

	$(self.info).find('.VXGArchieveInfoClose').unbind().click( function() {
	    self.hideInfo();
	});

	$(self.info).find('.VXGArchieveInfoApply').unbind().click( function() {
		//self.info.classList.remove('visible');
		let newnote = $(self.info).attr("newnote");
		var isnew = ( newnote === "true")? true : false;
		
		let newclipname = $(self.info).attr("clipname");
		let time = $(self.info).attr("time");
		let newincident = $(self.info).attr("clipincident");

		let caseel = self.info.getElementsByClassName('VXGArchieveInfoCaseValue')[0];
		let newclipcase = caseel.value;

		let errel = self.info.getElementsByClassName('VXGArchieveInfoError')[0];
		errel.innerHTML = errel.inerHtml = errel.innerhtml = '';

		let note = self.infonote.value;
		if (isnew) {
			self.controller.createMeta(clipid, cameratoken, note, time, newclipname, newclipcase, newincident);
		} else {
			let noteid   = $(self.info).attr("id");
			self.controller.updateMeta(noteid, cameratoken, note, newclipname, newclipcase, newincident);
		}
	});

	self.showWaitInfo(true);
	let date = new Date();
	let timeString = date.toLocaleString();
	let dateel = self.info.getElementsByClassName('VXGArchieveInfoDateValue')[0];
	dateel.innerHTML = dateel.inerHtml = dateel.innerhtml =  timeString;
	
	let title = self.info.getElementsByClassName('VXGArchieveInfoNameValue')[0];
	title.innerHTML = title.innerHtml = title.innerhtml =  cliptitle;

	let camname = self.info.getElementsByClassName('VXGArchieveInfoCamnameValue')[0];
	camname.innerHTML = camname.innerHtml = camname.innerhtml =  cameraname;

	let description = self.info.getElementsByClassName('VXGArchieveInfoDesc')[0];	
	description.value = "";

	let incdateel = self.info.getElementsByClassName('VXGArchieveInfoIncidentValue')[0];
	incdateel.innerHTML = incdateel.inerHtml = incdateel.innerhtml = '';

	let caseel = self.info.getElementsByClassName('VXGArchieveInfoCaseValue')[0];
	caseel.value = '';

	let errel = self.info.getElementsByClassName('VXGArchieveInfoError')[0];
	errel.innerHTML = errel.inerHtml = errel.innerhtml = '';
	
	$(self.info).attr("time", timeToUtcString(date) );
	$(self.info).attr("clipincident", clipincident );
	$(self.info).attr("clipcase", clipcase );
	$(self.info).attr("clipname", cliptitle );
	
	self.info.classList.add('visible');
	self.curtain.classList.add('visible');
	self.controller.getMeta(clipid, cameratoken);
}

/*SHARE FUNCTIONALITY*/

function shareByDelta(viewInstance, controllerInstance, delta) {
	let dateel = viewInstance.share.getElementsByClassName('VXGArchieveShareError')[0];
	dateel.innerHTML = dateel.inerHtml = dateel.innerhtml = '';

	let clipid = $(viewInstance.share).attr("clipid");
	let cameratoken = $(viewInstance.share).attr("cameratoken");

	let curtime = new Date();
	let exptime = new Date( curtime.getTime() + delta);
	let expire = timeToUtcString(exptime);
	
	controllerInstance.shareClip( clipid, cameratoken, expire);
}

VXGArchieveView.prototype.showWaitShare = function showWaitShare(isWait) {
    let element = this.sharewaiter;
    if (isWait) {
        $(element).addClass("waitdata");
    } else {
        $(element).removeClass("waitdata");
    }
};

VXGArchieveView.prototype.shareError = function shareError(description) {
	console.log('TODO: shareError:' + description);

	let self = this;
	
	let dateel = self.share.getElementsByClassName('VXGArchieveShareError')[0];
	dateel.innerHTML = dateel.inerHtml = dateel.innerhtml =  '<span>Error: ' + description + '</span>';
};

VXGArchieveView.prototype.renderShare = function renderShare(data) {
	let self = this;
	
	var clipurl = window.location.protocol + '//' + window.location.hostname + ((window.location.port === "")?(''):(':' +  window.location.port))  + window.location.pathname.substr(0,window.location.pathname.lastIndexOf('/')) + '/sharedClip.html';
	clipurl += '?id=' + data.clipid +'&token=' + data.token;
	
	self.sharelink.value = clipurl;
};


VXGArchieveView.prototype.hideShare = function hideShare() {
	let self = this;
	self.share.classList.remove('visible');
	self.curtain.classList.remove('visible');
}

VXGArchieveView.prototype.showShare = function showShare (clipid, cliptitle, cameraid, cameratoken, cameraname ) {
	let self = this;
	self.hideInfo();
	self.hidePlayer();
	
	let title = self.share.getElementsByClassName('VXGArchieveShareNameValue')[0];	
	title.innerHTML = title.innerHtml = title.innerhtml =  cliptitle;

	let camname = self.share.getElementsByClassName('VXGArchieveShareCamnameValue')[0];
	camname.innerHTML = camname.innerHtml = camname.innerhtml =  cameraname;

	let link = self.share.getElementsByClassName('VXGArchieveShareLink')[0];	
	link.value = "";

	let errel = self.share.getElementsByClassName('VXGArchieveShareError')[0];
	errel.innerHTML = errel.inerHtml = errel.innerhtml = '';
	
	$(self.share).attr("clipid", clipid);
	$(self.share).attr("cameratoken", cameratoken);
	
	self.share.classList.add('visible');
	self.curtain.classList.add('visible');
}

/*PLAYER FUNCTIONALITY*/
VXGArchieveView.prototype.hidePlayer = function hidePlayer() {
	let self = this;
	self.player.classList.remove('visible');
	self.curtain.classList.remove('visible');
	
	var videotag = self.player.getElementsByClassName('VXGArchievePlayerVideo')[0];
	
	videotag.pause();
	videotag.currentTime = 0;
}

VXGArchieveView.prototype.showPlayer = function showPlayer (clipurl, cliptitle, cameraname ) {
	let self = this;
	self.hideInfo();
	self.hideShare();
	
	let title = self.player.getElementsByClassName('VXGArchievePlayerNameValue')[0];	
	title.innerHTML = title.innerHtml = title.innerhtml =  cliptitle;

	let camname = self.player.getElementsByClassName('VXGArchievePlayerCamnameValue')[0];
	camname.innerHTML = camname.innerHtml = camname.innerhtml =  cameraname;
	
	self.player.classList.add('visible');
	self.curtain.classList.add('visible');
	
	var source = self.player.getElementsByClassName('VXGArchievePlayerSourceValue')[0];
	var videotag = self.player.getElementsByClassName('VXGArchievePlayerVideo')[0];
	
	$(source).attr('src', clipurl);
	videotag.load();
}

/*DELETE DIALOG*/

VXGArchieveView.prototype.showDeleteDialog = function showPlayer (clipid, cliptitle, camtoken ) {
	let self = this;
	
	let title = self.deletedialog.getElementsByClassName('VXGArchieveDeleteClipname')[0];	
	title.innerHTML = title.innerHtml = title.innerhtml =  cliptitle;

	self.deletedialog.classList.add('visible');
	self.curtain.classList.add('visible');
	
	let deleteConfirm = self.deletedialog.getElementsByClassName('VXGArchieveDeleteConfirm')[0];
	let deleteCancel = self.deletedialog.getElementsByClassName('VXGArchieveDeleteCancel')[0];
	
	deleteConfirm.onclick = function() {
		self.controller.deleteClip( clipid, camtoken);
		self.deletedialog.classList.remove('visible');
		self.curtain.classList.remove('visible');
	};
	
	deleteCancel.onclick = function() {
		self.deletedialog.classList.remove('visible');
		self.curtain.classList.remove('visible');
	};
}

/*------CONTROLLER--*/
///init component func
///element - <div>-element to which VXGChart vill be connected
var VXGArchieveController = function VXGArchieveController( element ) {
    if (element === undefined) {
	return;
    }

    this.clModel	= new VXGArchieveModel();
    this.clView		= new VXGArchieveView( element );

    this.clView.initDraw(this);
    this.clView.controller = this;

    //Show Archieve list - used from application-js to call from element-arg
    this.clView.element.showArchieveList= this.showArchieveList.bind(this);
    //Show Archieve list - used from application-js to provide camera-list from element-arg, to show who is master of event
    this.clView.element.setCameraArray	= this.setCameraArray.bind(this);
    
    this.clView.element.updateList = this.updateList.bind(this);
    
    this.clView.element.setMetaControlFuncs = this.setMetaControlFuncs.bind(this);
    this.clView.element.setShareControlFuncs = this.setShareControlFuncs.bind(this);
    this.clView.element.setSearchByMetaFuncs = this.setSearchByMetaFuncs.bind(this);
};


///showArchieveList - Main func by showing data
///rotoken - roToken from VXGCamera camera.list request (vs_api)
///allcamtoken - token from camea.list(vx_api), special rotoken used for geting information from  bunch of cameras
///apiGetClipListFunc - function-pointer requesting data (vs_api.user.camera.event.list )
///apiSeleteClipFunc - function-pointer deleting element from list
///apiGetClipListWrongFunc - function-pointer that handle error answer frim apiGetArchieveFunc
///controlCallbackFunc - function-pointe that handle some action from component like
///	 function listArchieveCB(operation, obj),there operation - is name, obj - is event-record;
///offset - request field for bigdata for getting data with offset (default: 0)
///limit  - request field for bigdata for getting data with limited amount (default: 40)
VXGArchieveController.prototype.showArchieveList = function showArchieveList ( rotoken, allcamtoken, apiGetClipListFunc, apiDeleteClipFunc, apiGetClipListWrongFunc, controlCallbackFunc, offset=0, limit=40 ) {
    this.clView.callbackFunc 	= controlCallbackFunc;
    this.archieveFunc		= apiGetClipListFunc;
    this.deleteClipFunc		= apiDeleteClipFunc;
    this.wrongFunc 		= apiGetClipListWrongFunc;

    this.clView.roToken 	= rotoken;
    this.clView.allCamsToken	= allcamtoken;

//    if (rotoken === "" || allcamtoken === ""
//    || rotoken === undefined || allcamtoken === undefined
    if (!allcamtoken
    ) {
	this.clView.render(this);
	this.clView.showWait(); //trick for fake request
    } else {
	let params = {
		roToken: rotoken,
		allCamsToken: allcamtoken,
		requestParams: {
		    token: allcamtoken,
		    offset: offset,
		    limit: limit,
		    order_by: '-created',
		}
	};
	this.clModel.getData( params, this.updateDataCB.bind(this), this.showWait.bind(this), this.archieveFunc, this.wrongFunc);
    }
}

//moreData - function-handler for More-button components - use previos parameters defined by showArchieveList
VXGArchieveController.prototype.moreData = function moreData (params) {
    var archieveFunc	= this.archieveFunc;
    var wrongFunc 	= this.wrongFunc;
    var rotoken		= this.clView.roToken;
    var allcamtoken	= this.clView.allCamsToken;

    if (params		!== undefined
    && archieveFunc	!== undefined
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
		    this.clModel.getData( newparams, this.updateDataCB.bind(this), this.showWait.bind(this), this.archieveFunc, this.wrongFunc);
		}
	}
    }
}

//updateList - function-handler for update components 
VXGArchieveController.prototype.updateList = function updateList ( searchword ) {
    var archieveFunc	= this.archieveFunc;
    var wrongFunc 	= this.wrongFunc;
    var rotoken		= this.clView.roToken || undefined;
    var allcamtoken	= this.clView.allCamsToken || undefined;
    var getClipIdsByMeta= this.getclipidsbymeta || undefined;
    var getClipsByIdSet	= this.getclipsbyidset || undefined;

    if (rotoken === "" || allcamtoken === ""  || rotoken === undefined || allcamtoken === undefined  ) {
	if (wrongFunc) {
		wrongFunc('token is undefined');
	}
	return;
    } else {
	if (searchword === undefined
	|| getClipIdsByMeta === undefined
	|| getClipsByIdSet === undefined
	) {
		let params = {
			roToken: rotoken,
			allCamsToken: allcamtoken,
			requestParams: {
				token: allcamtoken,
				offset: 0,
				limit: 40,
				order_by: '-created',
			}
		};
		this.clModel.getData( params, this.updateDataCB.bind(this), this.showWait.bind(this), this.archieveFunc, this.wrongFunc);
	} else {
		let params = {
			token: allcamtoken,
			searchword: searchword
		};
		this.clModel.getData2(params, this.updateDataCB.bind(this), this.showWait.bind(this), getClipIdsByMeta, getClipsByIdSet, this.wrongFunc );
	}
    }
}

///setCameraArray - (optional) provide camera.list for component to render event.list (e.g. vs_api.user.camera.list) with camera's name
VXGArchieveController.prototype.setCameraArray = function setCameraArray ( cameras ){
    this.clView.cameraslist = cameras;
}

///showCameraList - connect function beetwen chartModel and chartView
VXGArchieveController.prototype.updateDataCB = function updateCameraList( params, data ) {
    this.clView.render( this, params, data);
};

///showWait - connect function beetwen chartModel and chartView
VXGArchieveController.prototype.showWait = function showWait (isWait) {
    this.clView.showWait(isWait);
};

VXGArchieveController.prototype.deleteClip  = function( clipid, cameratoken) {
    if (this.deleteClipFunc !== undefined && this.deleteClipFunc  != null) {
	let params = {};
	params.clipid     = clipid;
	params.token  = cameratoken;
	   
	this.clModel.deleteClip( params, this.deleteClipFunc, this );
    } 
}

VXGArchieveController.prototype.setMetaControlFuncs = function setMetaControlFuncs(get, create, update){
    this.getmeta = get;
    this.createmeta = create;
    this.updatemeta = update;
}

VXGArchieveController.prototype.setSearchByMetaFuncs = function ( getclipidsbymeta, getclipsbyidset){
    this.getclipidsbymeta = getclipidsbymeta;
    this.getclipsbyidset   = getclipsbyidset;
}

VXGArchieveController.prototype.getMeta = function(clipid, cameratoken) {
    if (this.getmeta !== undefined && this.getmeta != null) {
	let params = {};
	params.clipid = clipid;
	params.token  = cameratoken;
	
	this.clModel.getMeta ( this.getmeta, params, this.clView );
    } else {
	this.clView.showWaitInfo( false );
    }
}

VXGArchieveController.prototype.createMeta = function(clipid, cameratoken, note, time, clipname, clipcase, clipincident) {
    if (this.createmeta !== undefined && this.createmeta != null) {
	let params = {};
	params.clipid = clipid;
	params.token  = cameratoken;
	params.note   = note;
	params.time   = time;
	params.clipname = clipname;
	params.clipcase = clipcase;
	params.clipincident = clipincident;
	   
	this.clModel.createMeta ( this.createmeta, params, this.clView );
    } else {
        this.clView.showWaitInfo( false );
    }
}

VXGArchieveController.prototype.updateMeta  = function(noteid, cameratoken, note, clipname, clipcase, clipincident) {
    if (this.updatemeta !== undefined && this.updatemeta != null) {
	let params = {};
	params.id     = noteid;
	params.token  = cameratoken;
	params.note   = note;
	params.clipname = clipname;
	params.clipcase = clipcase;
	params.clipincident = clipincident;
	   
	this.clModel.updateMeta ( this.updatemeta, params, this.clView );
    } else {
        this.clView.showWaitInfo( false );
    }
}

VXGArchieveController.prototype.setShareControlFuncs = function setShareControlFuncs(get, share){
    this.shareclip = share;
    this.getshared = get;
}

VXGArchieveController.prototype.shareClip = function(clipid, cameratoken, expire) {
    if ((this.shareclip !== undefined && this.shareclip != null)
     && (this.getshared !== undefined && this.getshared != null)
    ) {
	let params = {};
	params.clipid = clipid;
	params.token  = cameratoken;
	params.expire = expire;
  
	this.clModel.shareClip ( this.shareclip, this.getshared, params, this.clView );
    } else {
        this.clView.showWaitShare( false );
    }
}

