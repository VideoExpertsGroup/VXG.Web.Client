/* ATTENTION: Do not edit this file for no good reason!!!. This is a kernel file, and the performance of the entire system depends on its contents. */

window.vxg = window.vxg || {};
vxg.api = vxg.api || {};
vxg.api.cloudone = vxg.api.cloudone || {};
vxg.api.cloudone.apiSrc = vxg.api.cloudone.apiSrc || window.location.origin;
vxg.api.cloudone.user = vxg.api.cloudone.user || {};
vxg.api.cloudone.partner = vxg.api.cloudone.partner || {};

//////////////////////////////////////////////////
// User api

vxg.api.cloudone.user.login = function(obj){
    var d = $.Deferred();
    if (obj['password']) {
alert('only firebase support!');
//	obj.password = CryptoJS.SHA3(obj.password, {outputLength: vs_api.hashBits}).toString(CryptoJS.enc.Base64);
    }
/*
    else if (vs_api['token'] && vs_api.token !== '') {
        if (!obj['token'])
            obj['token'] = vs_api.token;
//        obj['uid'] = vs_api.uid;
        if (vs_api.manage_uid)
            obj['manage_uid'] = vs_api.manage_uid;
    }
*/
	if ($.isEmptyObject(obj)) {
		setTimeout(d.reject,10);
    } else {
        $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc + '/api/v1/user/login/',
            contentType: "application/json",
            data: JSON.stringify(obj)
        }).done(function(r){
// TODO: old authorisation - delete if no need
/*
            vs_api.token = r.token;
            vs_api.uid = r.uid;
            if (r['dealerUID'])
                vs_api.dealerUID = r.dealerUID;
            vs_api.role = r.role;
            if (obj['password']) {
                localStorage.removeItem("manage_uid");
                localStorage.removeItem("manage_uid_path");
            }
            if(obj["remember_me"] && obj["remember_me"] === true){
                localStorage.setItem("api_token", vs_api.token);
            }else{
                sessionStorage.setItem("api_token", vs_api.token);
            }
            if (r['settings']) {
                vs_api.options = r['settings'];
            }
            localStorage.setItem("uid", vs_api.uid);
*/
//            createManagePath();
// r['scripts'].push('core/modules/servers/servers.js');
            d.resolve(r);
        }).fail(function(r){
            localStorage.removeItem("api_token");
            sessionStorage.removeItem("api_token");
            d.reject(r);
        });
    }
	return d.promise();
};

vxg.api.cloudone.user.list = function(obj){
    var data = obj || {};
//    data.uid = vs_api.uid;
//    if (vs_api.manage_uid)
//        data.manage_uid = vs_api.manage_uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/list/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.user.update = function(obj){
//    if (obj['password']) obj.password = CryptoJS.SHA3(obj.password, {outputLength: vs_api.hashBits}).toString(CryptoJS.enc.Base64);
    var data = obj || {};
//    data.uid = vs_api.uid;
//    if (vs_api.manage_uid)
//        data.manage_uid = vs_api.manage_uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/update/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.user.del = function(partnerID){
    var data = {id: partnerID};
//    data.uid = vs_api.uid;
//    if (vs_api.manage_uid)
//        data.manage_uid = vs_api.manage_uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/del/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.user.relation = function(obj){
    var data = obj || {};
//    data.uid = vs_api.uid;
//    if (vs_api.manage_uid)
//        data.manage_uid = vs_api.manage_uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/relation/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.user.invite = function(obj){
//    if (obj['password']) obj.password = CryptoJS.SHA3(obj.password, {outputLength: vs_api.hashBits}).toString(CryptoJS.enc.Base64);
    var data = obj || {};
//    data.uid = vs_api.uid;
//    if (vs_api.manage_uid)
//        data.manage_uid = vs_api.manage_uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/invite/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.user.change_password = function(obj){
alert('Function non supported');
};

vxg.api.cloudone.user.getUsedPlans = function(){
    var data = {};
//    data.uid = vs_api.uid;
//    if (vs_api.manage_uid)
//        data.manage_uid = vs_api.manage_uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/getusedplans/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.user.getPlans = function(obj){
    var data = obj || {};
//    data.uid = vs_api.uid;
//    if (vs_api.manage_uid)
//        data.manage_uid = vs_api.manage_uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/plans/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.user.getAccountStats = function(obj){
    var data = obj || {};
//    data.uid = vs_api.uid;
//    if (vs_api.manage_uid)
//        data.manage_uid = vs_api.manage_uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/get_stats/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

//////////////////////////////////////////////////
// Storage api
vxg.api.cloudone.storage = vxg.api.cloudone.storage || {};
//storage-list
vxg.api.cloudone.storage.getStorages = function(){
    var data = {};
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/storage/get/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
}

//create-storage
vxg.api.cloudone.storage.postStorage = function( obj ){
    var data = obj || {};
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/storage/post/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
}

//modify-storage by obj.id
vxg.api.cloudone.storage.putStorage = function( obj ){
    var data = obj || {};
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/storage/put/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
}

// remove storage object by id
vxg.api.cloudone.storage.removeStorage = function( obj ){
    var data = obj || {};
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/storage/del/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
}

//////////////////////////////////////////////////
// VXG Server api

vxg.api.cloudone.server = vxg.api.cloudone.server || {}

vxg.api.cloudone.server.list = function(obj){
    var data = obj || {};
//    data.uid = vs_api.uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/server/list/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.server.add = function(uuid){
    var data = {uuid:uuid};
//    data.uid = vs_api.uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/server/add/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.server.del = function(id){
    var data = {serverid:id};
//    data.uid = vs_api.uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/server/del/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.server.cameraslist = function(obj){
    var data = obj || {};
//    data.uid = vs_api.uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/server/cameraslist/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

//////////////////////////////////////////////////
// Camera api

vxg.api.cloudone.camera = vxg.api.cloudone.camera || {}

vxg.api.cloudone.camera.setPlans = function(obj){
    var data = obj || {};
//    data.uid = vs_api.uid;
//    if (vs_api.manage_uid)
//        data.manage_uid = vs_api.manage_uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/plan/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.camera.list = function(obj){
    var data = obj || {};
//    data.uid = vs_api.uid;
//    if (vs_api.manage_uid)
//        data.manage_uid = vs_api.manage_uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/list/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.camera.getEventTypes = function(channel_id){
    var data = {channel_id:channel_id};
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/get_event_types/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
}
vxg.api.cloudone.camera.setEventTypes = function(channel_id, event_types){
    var data = {channel_id:channel_id, event_types:event_types};
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/set_event_types/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
}
vxg.api.cloudone.camera.getLocations = function(obj){
    var data = obj || {};
//    data.uid = vs_api.uid;
//    if (vs_api.manage_uid)
//        data.manage_uid = vs_api.manage_uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/getlocations/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.camera.setLocations = function(channel_id, location){
    var data = {channel_id:channel_id, location:location};
//    data.uid = vs_api.uid;
//    if (vs_api.manage_uid)
//        data.manage_uid = vs_api.manage_uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/setlocation/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};


vxg.api.cloudone.camera.getLocsForUser = function(user_id){
    var data = {userId:user_id};
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/user_locations/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
}


vxg.api.cloudone.camera.setGroup = function(channel_id, group){
    var data = {channel_id:channel_id, group:group};
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/set_group/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.camera.shareCamera = function(channel_id, time){
    var data = {channel_id:channel_id, expired_seconds: time};
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/sharecamera/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.camera.getStorageCamera = function(){
    var data = {};
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/get_storage/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.camera.backupCamera = function(channel_id, obj){
    var data = {channel_id:channel_id, startTime: obj.startTime, endTime: obj.endTime, overwrite: obj.overwrite};
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/backup/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.camera.update = function(obj){
    var data = obj || {};
//    data.uid = vs_api.uid;
//    if (vs_api.manage_uid)
//        data.manage_uid = vs_api.manage_uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/update/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.camera.del = function(cameraID, gatewayInfo = null){
    var data = {id: cameraID};
    if (gatewayInfo?.gatewayUrl) data.gatewayUrl = gatewayInfo.gatewayUrl;
    if (gatewayInfo?.gatewayId) data.gatewayId = gatewayInfo.gatewayId;
    if (gatewayInfo?.gatewayUsername) data.gatewayUsername = gatewayInfo.gatewayUsername;
    if (gatewayInfo?.gatewayPassword) data.gatewayPassword = gatewayInfo.gatewayPassword;  
//    data.uid = vs_api.uid;
//    if (vs_api.manage_uid)
//        data.manage_uid = vs_api.manage_uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/del/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

//////////////////////////////////////////////////
// Map api

vxg.api.cloudone.addresses = vxg.api.cloudone.addresses || {};

vxg.api.cloudone.addresses.list = function(obj){
    var data = obj || {};
//    data.uid = vs_api.uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/addresses/list/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.addresses.upload = function(obj){
    var data = obj || {};
//    data.uid = vs_api.uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/addresses/upload/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.addresses.del = function(obj){
    var data = obj || {};
//    data.uid = vs_api.uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/addresses/del/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.addresses.find = function(obj){
    var data = obj || {};
//    data.uid = vs_api.uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/addresses/find/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.camera.add = function(obj){
    var data = obj || {};
//    data.uid = vs_api.uid;
//    if (vs_api.manage_uid)
//        data.manage_uid = vs_api.manage_uid;
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/add/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.license = function(obj){
    var data = obj || {};
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/key/',
            contentType: "application/json",
			data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.access_reports = function(obj){
    var data = obj || {};
    return vxg.user.getToken().then(function(r){
        data.token = r;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/access_reports/',
            contentType: "application/json",
			data: JSON.stringify(data)
        });
    });
};

vxg.api.cloudone.partner.list = function (obj) {
    return $.ajax({
        type: 'POST',
        url: vxg.api.cloudone.apiSrc + '/api/v1/partner/list/',
        contentType: "application/json",
    });
};

vxg.api.cloudone.partner.update = function (obj) {
    var data = obj || {};
    return $.ajax({
        type: 'POST',
        url: vxg.api.cloudone.apiSrc + '/api/v1/partner/update/',
        contentType: "application/json",
        data: JSON.stringify(data)
    });
};

vxg.api.cloudone.partner.del = function (obj) {
    var data = obj || {};
    return vxg.user.getToken().then(function(r){
		data.token = r;
		return $.ajax({
			type: 'POST',
			url: vxg.api.cloudone.apiSrc + '/api/v1/partner/del/',
			contentType: "application/json",
			data: JSON.stringify(data)
		});
	});
};

vxg.api.cloudone.partner.del_camera = function (obj) {
    var data = obj || {};
    return vxg.user.getToken().then(function(r){
		data.token = r;
		return $.ajax({
			type: 'POST',
			url: vxg.api.cloudone.apiSrc + '/api/v1/partner/del_camera/',
			contentType: "application/json",
			data: JSON.stringify(data)
		});
	});
};


vxg.api.cloudone.partner.get_plans = function (obj) {
    var data = obj || {};
    return vxg.user.getToken().then(function(r){
		data.token = r;
		return $.ajax({
			type: 'POST',
			url: vxg.api.cloudone.apiSrc + '/api/v1/partner/get_plans/',
			contentType: "application/json",
			data: JSON.stringify(data)
		});
	});
};

vxg.api.cloudone.partner.assign_plans = function (userid, plansStr) {
    var data = {};
    return vxg.user.getToken().then(function(r){
		data.token = r;
		return $.ajax({
            type: 'GET',
            url: vxg.api.cloudone.apiSrc + '/api/v1/distrib/plans/assign/?id=' + userid +'&plans='+plansStr,
			contentType: "application/json",
			data: JSON.stringify(data)
		});
	});
};
