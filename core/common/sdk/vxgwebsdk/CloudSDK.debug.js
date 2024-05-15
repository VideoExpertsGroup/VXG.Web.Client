// CloudSDK.debug.js
// version: 3.3.19
// date-of-build: 240226
// copyright (c) VXG Inc
// Includes gl-matrix  <https://github.com/toji/gl-matrix>
// ver: 3.3.0 // Available under MIT License 
// <https://github.com/toji/gl-matrix/blob/master/LICENSE.md> 
// Includes rangeslider.js <https://github.com/andreruffert/rangeslider.js>
// Available under MIT License 
// <https://github.com/andreruffert/rangeslider.js/blob/develop/LICENSE.md> 
// Includes momentjs  <https://github.com/moment/moment/>
// ver: 2.29.1// Available under MIT License 
// <https://github.com/moment/moment/blob/develop/LICENSE> 
// Includes moment-timezone <https://github.com/moment/moment-timezone/>
// ver: 0.5.32// Available under MIT License 
// <https://github.com/moment/moment-timezone/blob/develop/LICENSE> 


window.Log = function(elid){
	var self = this;
	self.mElementID = elid;
	self.el = document.getElementById(elid);
	if(self.el){
		self.el.innerHTML = '<div class="logger-line">Start</div>'; // cleanup
	}

	self.escape = function(msg){
		if(typeof(msg) === 'undefined'){
			return 'undefined';
		}
		if(typeof(msg) === 'object'){
			msg = JSON.stringify(msg);
		}
		var escaped = msg;
		var findReplace = [[/&/g, "&amp;"], [/</g, "&lt;"], [/>/g, "&gt;"], [/"/g, "&quot;"]]
		//for(var item in findReplace)
		for(var item = 0; item < findReplace.length; item++)
			escaped = escaped.replace(findReplace[item][0], findReplace[item][1]);
		return escaped;
	}

	self.info = function(msg){
		console.log(msg);
		if(self.el){
			self.el.innerHTML += '<div class="logger-line info">' + self.escape(msg) + '</div>';
		}
	}

	self.error = function(msg){
		console.error(msg);
		if(self.el){
			self.el.innerHTML += '<div class="logger-line error">' + self.escape(msg) + '</div>';
		}
	}

	self.warn = function(msg){
		console.warn(msg);
		if(self.el){
			self.el.innerHTML += '<div class="logger-line warn">' + self.escape(msg) + '</div>';
		}
	}
}

window.CloudHelpers = window.CloudHelpers || {};

CloudHelpers.POSITION_LIVE = -1;


window.CloudHelpers.RequestWrap = function(){
    var self = this;
    var isRequestAnswersAllowed = 1;

    self.request = function(obj) {
	var p = CloudHelpers.promise();
	var xhr = ("onload" in new XMLHttpRequest()) ? new XMLHttpRequest : new XDomainRequest;
	xhr.open(obj.type, obj.url, true);
	xhr.withCredentials = true;

	if(obj.contentType){
		xhr.setRequestHeader('Content-Type', obj.contentType);
	}
	if (obj.access_token) {
		xhr.setRequestHeader('Authorization', "Acc " + obj.access_token);
	}
// [TECH-2963] In some cases this header can produce CORS-block , removing to prevent
//	else if(obj.token){ 
//		xhr.setRequestHeader('Authorization', "SkyVR " + obj.token);
//	} 
	xhr.onload = function() {
		var r = "";
		if(this.responseText != ""){
			try{
				r = JSON.parse(this.responseText);
			}catch(e){
				console.error(e);
				p.reject(CloudReturnCode.ERROR_WRONG_RESPONSE);
				return;
			}
		}
		var st = this.status;
		if (isRequestAnswersAllowed != 0) {
		    if(st >= 200 && st < 300){
			p.resolve(r);
		    }else{
			p.reject(r);
		    }
		}
		delete xhr;
	}
	xhr.onerror = function(){
		p.reject(xhr);
		delete xhr;
	}
	if(obj.data){
		xhr.send(obj.data);
	}else{
		xhr.send();
	}
	return p;
    }

    self.destroy = function(){
	this.isRequestAnswerAlowed = 0;
    }
}



// helper function for parsing urls
CloudHelpers.parseUri = function(str) {
	var result = {}
	result.source = str;
	var arr = str.split("/");
	// parse protocol
	result.protocol = arr[0];
	result.protocol = result.protocol.slice(0, result.protocol.length-1);
	result.protocol = result.protocol.toLowerCase();
	str = str.slice(result.protocol.length + 3);

	if (result.protocol == 'http') {
		result.port = 80;
	}

	if (result.protocol == 'https') {
		result.port = 443;
	}

	// parse user/password/host/port
	var end1_of_hp = str.indexOf("/");
	end1_of_hp = end1_of_hp != -1 ? end1_of_hp : str.length;
	var end2_of_hp = str.indexOf("?");
	end2_of_hp = end2_of_hp != -1 ? end2_of_hp : str.length;
	var end_of_hp = Math.min(end1_of_hp, end2_of_hp);
	var uphp = str.substring(0, end_of_hp);
	str = str.slice(end_of_hp); // host
	var uspass = "";
	while(uphp.indexOf("@") != -1){
		uspass += uphp.substring(0, uphp.indexOf("@") + 1);
		uphp = uphp.slice(uphp.indexOf("@") + 1);
	}
	if(uspass != ""){
		if(uspass.indexOf(":") != -1){
			var a = uspass.split(":");
			result.user = a[0];
			result.password = a[1];
			result.password = result.password.substring(0,result.password.length -1);
		}else{
			result.user = uspass;
		}
	}

	if(uphp.indexOf(":") != -1){
		var reg_port = new RegExp(".*:(\\d+)$", "g");
		var port = reg_port.exec(uphp);
		if(port && port.length > 1){
			result.port = parseInt(port[1],10);
			uphp = uphp.slice(0, uphp.length - port[1].length - 1);
		}
	}
	result.host = uphp;

	// parse path/query
	if(str.indexOf("?") != -1){
		result.query = str.substring(str.indexOf("?"), str.length);
		result.path = str.substring(0, str.indexOf("?"));
	}else{
		result.query = "";
		result.path = str;
	}
	if(!result.path || result.path == ""){
		result.path = "/";
	}
	return result;
}

// Helper object (for replace jquery)
CloudHelpers.promise = function(){
	var d = {};
	d.completed = false;
	d.failed = false;
	d.successed = false;
	d.done = function(callback){
		d.done_callback = callback;
		if(d.completed && typeof d.done_callback === "function" && d.successed){
			d.done_callback.apply(this, d.result_arguments);
		}
		return d;
	}

	d.fail = function(callback){
		d.fail_callback = callback;
		if(d.completed && typeof d.fail_callback === "function" && d.failed){
			d.fail_callback.apply(this,d.error_arguments);
		}
		return d;
	}

	d.resolve = function() {
		if(!d.completed){
			d.result_arguments = arguments; // [];
			if(typeof d.done_callback === "function"){
				d.done_callback.apply(this, d.result_arguments);
			}
		}
		d.successed = true;
		d.completed = true;
	}
	d.reject = function() {
		if(!d.completed){
			d.error_arguments = arguments;
			if(typeof d.fail_callback === "function"){
				d.fail_callback.apply(this, d.error_arguments);
			}
		}
		d.failed = true;
		d.completed = true;
	}
	return d;
};

CloudHelpers.waitPromises = function(arr_promise){
	var p = CloudHelpers.promise();
	var max_len = arr_promise.length;
	var result = [];
	function cmpl(r){
		result.push(r);
		if(result.length == max_len){
			p.resolve(result);
		}
	};
	//for(var i in arr_promise){
	for (var i = 0; i < max_len; i++){
		arr_promise[i].done(cmpl).fail(cmpl);
	}
	return p;
}

// Helper object (for replace jquery request)
CloudHelpers.request = function(obj){
	var p = CloudHelpers.promise();
	var xhr = ("onload" in new XMLHttpRequest()) ? new XMLHttpRequest : new XDomainRequest;
	xhr.open(obj.type, obj.url, true);
	// Fix for CNVR-1134 CloudSDK Web: need processing cookies in sdk
	// But server can has some problems with sessions
	xhr.withCredentials = true;
	if(obj.contentType){
		xhr.setRequestHeader('Content-Type', obj.contentType);
	}
//	if(obj.token){
//		xhr.setRequestHeader('Authorization', "SkyVR " + obj.token);
//	}
	xhr.onload = function() {
		var r = "";
		if(this.responseText != ""){
			try{
				r = JSON.parse(this.responseText);
			}catch(e){
				console.error(e);
				p.reject(CloudReturnCode.ERROR_WRONG_RESPONSE);
				return;
			}
		}
		var st = this.status;
		// console.log("Status: " + st);
		// console.log("responseText: " + this.responseText);
		if(st >= 200 && st < 300){
			p.resolve(r);
		}else{
			p.reject(r);
		}
		delete xhr;
	}
	xhr.onerror = function(){
		p.reject(xhr);
		delete xhr;
	}
	if(obj.data){
		xhr.send(obj.data);
	}else{
		xhr.send();
	}
	return p;
}

// Helper object (for replace jquery request)
CloudHelpers.request2 = function(obj){
	var p = CloudHelpers.promise();
	var xhr = ("onload" in new XMLHttpRequest()) ? new XMLHttpRequest : new XDomainRequest;
	xhr.open(obj.type, obj.url, true);
	// Fix for CNVR-1134 CloudSDK Web: need processing cookies in sdk
	// But server can has some problems with sessions
	xhr.withCredentials = true;
	if(obj.contentType){
		xhr.setRequestHeader('Content-Type', obj.contentType);
	}
//	if(obj.token){
//		xhr.setRequestHeader('Authorization', "SkyVR " + obj.token);
//	}
	if(obj.access_token){
		xhr.setRequestHeader('Authorization', "Acc " + obj.access_token);
	}
	if(obj.license_key){
		xhr.setRequestHeader('Authorization', "Lic " + obj.license_key);
	}

	xhr.onload = function() {
		var r = "";
		if(this.responseText != ""){
			try{
				r = JSON.parse(this.responseText);
			}catch(e){
				console.error(e);
				p.reject(CloudReturnCode.ERROR_WRONG_RESPONSE);
				return;
			}
		}
		var st = this.status;
		// console.log("Status: " + st);
		// console.log("responseText: " + this.responseText);
		if(st >= 200 && st < 300){
			p.resolve(r);
		}else{
			p.reject(r);
		}
		delete xhr;
	}
	xhr.onerror = function(){
		p.reject(xhr);
		delete xhr;
	}
	if(obj.data){
		xhr.send(obj.data);
	}else{
		xhr.send();
	}
	return p;
}

// Helper object (for replace jquery request)
CloudHelpers.requestJS = function(url, beforeEval){
	var p = CloudHelpers.promise();
	var xhr = ("onload" in new XMLHttpRequest()) ? new XMLHttpRequest : new XDomainRequest;
	xhr.open("GET", url, true);
	// Fix for CNVR-1134 CloudSDK Web: need processing cookies in sdk
	// But server can has some problems with sessions
	// xhr.withCredentials = true;
	xhr.onload = function() {
		var r = "";
		if(this.responseText != ""){
			try{
				r = this.responseText;
			}catch(e){
				console.error(e);
				p.reject(CloudReturnCode.ERROR_WRONG_RESPONSE);
				return;
			}
		}
		var st = this.status;
		// console.log("Status: " + st);
		// console.log("responseText: " + this.responseText);
		if(st >= 200 && st < 300){
			if (beforeEval) {
				r = beforeEval(r);
			}
			eval(r);
			p.resolve(r);
		}else{
			p.reject(r);
		}
		delete xhr;
	}
	xhr.onerror = function(){
		p.reject(xhr);
		delete xhr;
	}
	xhr.send();
	return p;
}

CloudHelpers.handleError = function(err, p, callback){
	if(err.errorDetail && err.status == 404){
		p.reject(CloudReturnCode.ERROR_NOT_FOUND);
	}else if(err.errorDetail && err.status == 401){
		p.reject(CloudReturnCode.ERROR_NOT_AUTHORIZED);
	}else{
		if(callback){
			callback(err, p);
		}else{
			p.reject(err);
		}
	}
}

CloudHelpers.requestAsyncList = function(getData, request_data, p){
	var result = {
		meta: {
			limit: 1000,
			offset: 0,
			total_count: -1
		},
		objects: []
	};
	request_data.limit = result.meta.limit;
	request_data.offset = result.meta.offset;

	getData(request_data).fail(function(err){
		p.reject(err);
	}).done(function(r){
		result.meta.total_count = r.meta.total_count;
		// result.meta.expire = r.meta.expire;
		result.objects = result.objects.concat(r.objects);
		if(r.meta.offset + r.objects.length >= r.meta.total_count){
			p.resolve(result);
		}else{
			var p_all = [];
			for(var i = result.meta.limit; i < result.meta.total_count; i = i + result.meta.limit){
				request_data.offset = i;
				p_all.push(getData(request_data));
			}
			CloudHelpers.waitPromises(p_all).done(function(p_results){
				for (var i=0; i < p_results.length; i++) {
					result.objects = result.objects.concat(p_results[i].objects);
				}
				p.resolve(result);
			}).fail(function(err){
				p.reject(err);
			});
		}
	});
}

CloudHelpers.flashVersion = undefined;

CloudHelpers.getFlashVersion = function(){
  // ie
  try {
    try {
      // avoid fp6 minor version lookup issues
      // see: http://blog.deconcept.com/2006/01/11/getvariable-setvariable-crash-internet-explorer-flash-6/
      var axo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.6');
      try { axo.AllowScriptAccess = 'always'; }
      catch(e) { return '6,0,0'; }
    } catch(e) {}
    return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
  // other browsers
  } catch(e) {
    try {
      if(navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin){
        return (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]).description.replace(/\D+/g, ",").match(/^,?(.+),?$/)[1];
      }
    } catch(e) {}
  }
  return '0,0,0';
}

CloudHelpers.supportFlash = function(){
	if(!CloudHelpers.flashVersion){
		CloudHelpers.flashVersion = CloudHelpers.getFlashVersion();
	}
	return CloudHelpers.flashVersion != "0,0,0";
}

CloudHelpers.useHls = function(){
	return CloudHelpers.isMobile() || !CloudHelpers.supportFlash() || CloudHelpers.containsPageParam("hls");
}

CloudHelpers.supportWebRTC = function(){
	/*var MediaStream =  $window.webkitMediaStream || $window.MediaStream;
	var IceCandidate = $window.mozRTCIceCandidate || $window.webkitRTCIceCandidate || $window.RTCIceCandidate;
	var SessionDescription = $window.mozRTCSessionDescription || $window.webkitRTCSessionDescription || $window.RTCSessionDescription;*/
	// var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.RTCPeerConnection;
	return !!(window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.RTCPeerConnection);
}

CloudHelpers.mapToUrlQuery = function(params){
	if(!params) return "";
	var res = [];
	for(var i in params){
		res.push(encodeURIComponent(i) + "=" + encodeURIComponent(params[i]));
	}
	return res.join("&");
}

// detect lang on page

CloudHelpers.lang = function(){
	return CloudHelpers.sLang || CloudHelpers.locale();
};

CloudHelpers.locale = function() {
	langs = ['en', 'ko', 'ru']
	CloudHelpers.sLang = 'en';
	if(CloudHelpers.containsPageParam('lang') && langs.indexOf(CloudHelpers.pageParams['lang']) >= -1){
		CloudHelpers.sLang = CloudHelpers.pageParams['lang'];
	} else if (navigator) {
		var navLang = 'en';
		navLang = navigator.language ? navigator.language.substring(0,2) : navLang;
		navLang = navigator.browserLanguage ? navigator.browserLanguage.substring(0,2) : navLang;
		navLang = navigator.systemLanguage ? navigator.systemLanguage.substring(0,2) : navLang;
		navLang = navigator.userLanguage ? navigator.userLanguage.substring(0,2) : navLang;
		if(langs.indexOf(navLang) >= -1){
			CloudHelpers.sLang = navLang;
		}else{
			console.warn("Unsupported lang " + navLang + ", will be used default lang: " + CloudHelpers.sLang)
		}

		CloudHelpers.sLang =  langs.indexOf(navLang) >= -1 ? navLang : CloudHelpers.sLang;
	} else {
		CloudHelpers.sLang = 'en';
	}
	return CloudHelpers.sLang;
};

// parse param of page
CloudHelpers.parsePageParams = function() {
	var loc = window.location.search.slice(1);
	var arr = loc.split("&");
	var result = {};
	var regex = new RegExp("(.*)=([^&#]*)");
	for(var i = 0; i < arr.length; i++){
		if(arr[i].trim() != ""){
			p = regex.exec(arr[i].trim());
			// console.log("results: " + JSON.stringify(p));
			if(p == null){
				result[decodeURIComponent(arr[i].trim().replace(/\+/g, " "))] = '';
			}else{
				result[decodeURIComponent(p[1].replace(/\+/g, " "))] = decodeURIComponent(p[2].replace(/\+/g, " "));
			};
		};
	};
	return result;
};
CloudHelpers.pageParams = CloudHelpers.parsePageParams();
CloudHelpers.containsPageParam = function(name){
	return (typeof CloudHelpers.pageParams[name] !== "undefined");
};

CloudHelpers.keepParams = ["lang", "url", "fcno", "vendor", "demo",
"messaging", "hls", "svcp_host", "backwardDeactivateAfter", "mobile",
"experimental_hls", "page_id", "preview", "customswf"
];

CloudHelpers.changeLocationState = function(newPageParams){
	var url = '';
	var params = [];

	//for(var i in CloudHelpers.keepParams){
	for(var i = 0 ; i < CloudHelpers.keepParams.length; i++){
		var name = CloudHelpers.keepParams[i];
		if(CloudHelpers.containsPageParam(name))
			params.push(name + '=' + encodeURIComponent(CloudHelpers.pageParams[name]))
	}

	for(var p in newPageParams){
		params.push(encodeURIComponent(p) + "=" + encodeURIComponent(newPageParams[p]));
	}
	var new_url = (window.location.protocol=='file:'?'http:':window.location.protocol) + "//" + window.location.host + window.location.pathname + '?' + params.join("&");
	try{
		if(window.history.pushState)
			window.history.pushState(newPageParams, document.title, new_url);
		else
			console.error("window.history.pushState - function not found");
	}catch(e){
		console.error("changeLocationState: Could not change location to " + new_url);
	}
//	CloudHelpers.pagePwindow.btoa('Hello, world'); params = CloudHelpers.parsePageParams();
}

CloudHelpers.osname = function(){
	var os="unknown";
	if (navigator.appVersion.indexOf("Win")!=-1) os="win";
	if (navigator.appVersion.indexOf("Mac")!=-1) os="mac";
	if (navigator.appVersion.indexOf("X11")!=-1) os="unix";
	if (navigator.appVersion.indexOf("Linux")!=-1) os="linux";
	return os;
};

CloudHelpers.isSafari = function(){
	var chr = window.navigator.userAgent.toLowerCase().indexOf("chrome") > -1;
	var sfri = window.navigator.userAgent.toLowerCase().indexOf("safari") > -1;
	return !chr && sfri;
}

CloudHelpers.isEdge = function(){
	return window.navigator.userAgent.indexOf("Edge") > -1;
}

CloudHelpers.isChrome = function(){
	var bIsChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
	return bIsChrome;
}

CloudHelpers.isMobile = function() {
	if(navigator.userAgent.match(/Android/i)
		|| navigator.userAgent.match(/webOS/i)
		|| navigator.userAgent.match(/iPhone/i)
		|| navigator.userAgent.match(/iPad/i)
		|| navigator.userAgent.match(/iPod/i)
		|| navigator.userAgent.match(/BlackBerry/i)
		|| navigator.userAgent.match(/Windows Phone/i)
	){
		return true;
	};
	return false;
}

CloudHelpers.isIpV4 = function(ip){
	return (ip.match(/^([0-9]{1,3}\.){3}[0-9]{1,3}/)!=null);
}

CloudHelpers.parseUTCTime = function(str){
	str = str.replace(new RegExp('-', 'g'), ' ');
	str = str.replace(new RegExp('T', 'g'), ' ');
	str = str.replace(new RegExp(':', 'g'), ' ');
	var arr = str.split(' ');
	var d = new Date();
	d.setUTCFullYear(parseInt(arr[0],10));
	d.setUTCMonth(parseInt(arr[1],10)-1);
	d.setUTCDate(parseInt(arr[2],10));
	d.setUTCHours(parseInt(arr[3],10));
	d.setUTCMinutes(parseInt(arr[4],10));
	d.setUTCSeconds(parseInt(arr[5],10));
	var t = d.getTime();
	t = t - t % 1000;
	return t;
}

CloudHelpers.formatUTCTime = function(t){
	var d = new Date();
	d.setTime(t);
	var str = d.getUTCFullYear() + "-"
		+ ("00" + (d.getUTCMonth()+1)).slice(-2) + "-"
		+ ("00" + d.getUTCDate()).slice(-2) + "T"
		+ ("00" + d.getUTCHours()).slice(-2) + ":"
		+ ("00" + d.getUTCMinutes()).slice(-2) + ":"
		+ ("00" + d.getUTCSeconds()).slice(-2);
	return str;
};

CloudHelpers.readableFormatUTCTime = function(t){
	var d = new Date();
	d.setTime(t);
	var str = d.getUTCFullYear() + "/"
		+ ("00" + (d.getUTCMonth()+1)).slice(-2) + "/"
		+ ("00" + d.getUTCDate()).slice(-2) + " "
		+ ("00" + d.getUTCHours()).slice(-2) + ":"
		+ ("00" + d.getUTCMinutes()).slice(-2) + ":"
		+ ("00" + d.getUTCSeconds()).slice(-2);
	return str;
};


CloudHelpers.ONE_SECOND = 1000;
CloudHelpers.ONE_MINUTE = 60*1000;
CloudHelpers.ONE_HOUR = 60*60*1000;

CloudHelpers.getCurrentTimeUTC = function(){
	return Date.now();
};

CloudHelpers.isLocalFile = function() {
	return window.location.protocol != "https:" && window.location.protocol != "http:";
}

CloudHelpers.combineURL = function(url, login, password){
	if(login == "") login = undefined;
	if(password == "") password = undefined;
	var a = CloudHelpers.parseUri(url);
	var result = a.protocol + "://";
	if(login || password){
		result += login;
		if(password){
			result += ":" + password;
		}
		result += "@";
	}
	result += a.host + (a.port != "" ? ":" + a.port : '') + a.path;
	return result;
}

CloudHelpers.validIpV4 = function(ip){
	var cur_a = ip.split(".");
	for(var i = 0; i < 4; i++){
		var t = parseInt(cur_a[i],10);
		if(t < 0 || t > 255){
			return false;
		}
	}
	return true;
}

CloudHelpers.convertIpV4ToInt = function(ip){
	var cur_a = ip.split(".");
	var result = 0;
	var k = 1;
	for(var i = 3; i >= 0; i--){
		result += parseInt(cur_a[i],10)*k;
		k = k*256;
	}
	return result;
}

CloudHelpers.isValidHostID = function(url){
	var a = CloudHelpers.parseUri(url);
	if(a.host == "localhost") return true;
	if(CloudHelpers.isIpV4(a.host)){
		if(!CloudHelpers.validIpV4(a.host)){
			console.error("Address " + a.host + " - invalid address");
			return false;
		}
	}
	return true;
}

CloudHelpers.isLocalUrlOrIP = function(url){
	var a = CloudHelpers.parseUri(url);
	if(a.host == "localhost") return true;
	if(CloudHelpers.isIpV4(a.host)){
		if(!CloudHelpers.validIpV4(a.host)){
			console.error("Address " + a.host + " - invalid address");
			return true;
		}

		var cur_a = CloudHelpers.convertIpV4ToInt(a.host);
		var local_addresses = [];
		local_addresses.push({'from': '127.0.0.0', 'to': '127.255.255.255', 'comment': 'localhost addresses'});
		//for(var i in local_addresses){
		for(var i = 0; i < local_addresses.length; i++) {
			var range_from = CloudHelpers.convertIpV4ToInt(local_addresses[i].from);
			var range_to = CloudHelpers.convertIpV4ToInt(local_addresses[i].to);
			var comment = local_addresses[i].comment;
			if(cur_a >= range_from && cur_a <= range_to){
				console.error(comment);
				return true;
			}
		}

	}
	return false;
}

CloudHelpers.isPublicUrl = function(url){
	var a = CloudHelpers.parseUri(url);
	if(a.host == "localhost") return false;
	if(CloudHelpers.isIpV4(a.host)){
		if(!CloudHelpers.validIpV4(a.host)){
			console.error("Address " + a.host + " - invalid address");
			return false;
		}

		var cur_a = CloudHelpers.convertIpV4ToInt(a.host);
		var local_addresses = [];
		local_addresses.push({'from': '10.0.0.0', 'to': '10.255.255.255', 'comment': 'single class A network'});
		local_addresses.push({'from': '172.16.0.0', 'to': '172.31.255.255', 'comment': '16 contiguous class B network'});
		local_addresses.push({'from': '192.168.0.0', 'to': '192.168.255.255', 'comment': '256 contiguous class C network'});
		local_addresses.push({'from': '169.254.0.0', 'to': '169.254.255.255', 'comment': 'Link-local address also refered to as Automatic Private IP Addressing'});
		local_addresses.push({'from': '127.0.0.0', 'to': '127.255.255.255', 'comment': 'localhost addresses'});
		//for(var i in local_addresses){
		for(var i = 0; i < local_addresses.length; i++) {
			var range_from = CloudHelpers.convertIpV4ToInt(local_addresses[i].from);
			var range_to = CloudHelpers.convertIpV4ToInt(local_addresses[i].to);
			var comment = local_addresses[i].comment;
			if(cur_a >= range_from && cur_a <= range_to){
				console.error(comment);
				return false;
			}
		}
	}
	return true;
}
CloudHelpers.isFrame = function(){
	try {
		return window.self !== window.top;
	} catch (e) {
		return true;
	}
}

CloudHelpers.isIE = function() {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('msie') !== -1 || ua.indexOf('trident') > -1) {
        return true;
    }
    return false;
}

CloudHelpers.isFireFox = function(){
	return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
}

CloudHelpers.isAndroid = function() {
	if(navigator.userAgent.match(/Android/i)){
		return true;
	};
	return false;
}

CloudHelpers.isIOS = function() {
	if(navigator.userAgent.match(/iPhone/i)
		|| navigator.userAgent.match(/iPad/i)
		|| navigator.userAgent.match(/iPod/i)
	){
		return true;
	};
	return false;
}

CloudHelpers.isWindowsPhone = function() {
	if(navigator.userAgent.match(/Windows Phone/i)){
		return true;
	};
	return false;
}

CloudHelpers.isBlackBerry = function() {
	if(navigator.userAgent.match(/BlackBerry/i)){
		return true;
	};
	return false;
}

CloudHelpers.splitUserInfoFromURL = function(url){
	var a = CloudHelpers.parseUri(url);
	var result = a.protocol + "://" + a.host + (a.port ? ":" + a.port : '') + a.path;
	// console.log(a);
	var login = a.user;
	var password = a.password;
	return {url: result, login: login, password: password};
}

CloudHelpers.getAbsolutePosition = function(element){
	var r = { x: element.offsetLeft, y: element.offsetTop };
	if (element.offsetParent) {
	var tmp = CloudHelpers.getAbsolutePosition(element.offsetParent);
		r.x += tmp.x;
		r.y += tmp.y;
	}
	return r;
};

CloudHelpers.cache = CloudHelpers.cache || {};
CloudHelpers.cache.timezones = CloudHelpers.cache.timezones || {};

// helper function
CloudHelpers.getOffsetTimezone = function(timezone) {
	if(!moment) {
		console.warn("Requrired moment.js library");
		return 0;
	}
	if(CloudHelpers.cache.timezones[timezone] == undefined){
		var n = new Date();
		if(timezone && timezone != ""){
			var offset = moment(n).tz(timezone).format("Z");
			var c = offset[0];
			if(c < '0' || c > '9'){
				offset = offset.substring(1);
			};
			var ts_sig = (c == '-') ? -1 : 1;
			var hs = offset.split(":");
			offset = ts_sig *(parseInt(hs[0],10)*60 + parseInt(hs[1],10));
			CloudHelpers.cache.timezones[timezone] = offset*60000;
		}else{
			CloudHelpers.cache.timezones[timezone] = 0;
		}
	}
	return CloudHelpers.cache.timezones[timezone];
}


// polyfill for ie11
Number.isInteger = Number.isInteger || function(value) {
    return typeof value === "number" &&
           isFinite(value) &&
           Math.floor(value) === value;
};


CloudHelpers.autoPlayAllowed = true;
CloudHelpers.checkAutoplay = function(ch_auto_callback){
	ch_auto_callback = ch_auto_callback || function() {};
	var d = new CloudHelpers.promise();
	d.done(function(){
		console.log("checkAutoplay: done")
		ch_auto_callback(CloudHelpers.autoPlayAllowed);
	})
	d.fail(function(){
		console.log("checkAutoplay: waiting")
		ch_auto_callback(CloudHelpers.autoPlayAllowed);
	})
	var _result = null;
	var tmp_video_el = document.createElement("div");
	tmp_video_el.innerHTML = "<video muted></video>";
	tmp_video_el = tmp_video_el.children[0];
	tmp_video_el.addEventListener('waiting', function() {
		console.log("checkAutoplay: waiting, ", _result)
		if (_result == null) {
			CloudHelpers.autoPlayAllowed = true;
 			d.resolve(); // it's ok autoplay for Chrome
			tmp_video_el.parentNode.removeChild(tmp_video_el);
		}
	}, false);

	var p = tmp_video_el.play();
	var s = '';
	if (window['Promise']) {
		s = window['Promise'].toString();
	}

	if (p && s.indexOf('function Promise()') !== -1
		|| s.indexOf('function ZoneAwarePromise()') !== -1) {

		p.catch(function(error) {
			// console.error("checkAutoplay, error:", error)
			// Check if it is the right error
			if(error.name == "NotAllowedError") {
				console.error("error.name:", "NotAllowedError")
				// CloudHelpers.autoPlayAllowed = false;
				_result = false;
				CloudHelpers.autoPlayAllowed = _result;
				d.reject();
			} else {
				d.reject();
				if (error.name != "AbortError"){
					console.error("checkAutoplay: happened something else");
					throw error; // happened something else
				}
			}
			//tmp_video_el.remove();
			if (tmp_video_el.parentNode) {
				tmp_video_el.parentNode.removeChild(tmp_video_el);
			}
		})
	} else {
		console.warn("checkAutoplay could not work in your browser");
		d.reject();
		ch_auto_callback(CloudHelpers.autoPlayAllowed);
	}
}

if (typeof document !== 'undefined') {
	CloudHelpers.checkAutoplay(function(d){ console.log("checkautoplay: autoplay2 ", d); });
}

// http://jsbin.com/otecul/1/edit
CloudHelpers.humanFileSize = function(bytes) {
    var thresh = 1024;
    if(bytes < thresh) return bytes + ' B';
    var units = ['kB','MB','GB','TB','PB','EB','ZB','YB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(bytes >= thresh);
    return bytes.toFixed(1)+' '+units[u];
};


CloudHelpers.base64_encode = function(str){
	return window.btoa(str);
}

CloudHelpers.base64_decode = function(b64){
	return window.atob(b64);
}

CloudHelpers.copy = function(obj){
	if (null == obj || "object" != typeof obj) {
		console.error("Expected object");
		return obj;
	}
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

CloudHelpers.unpackAccessToken = function(access_token) {
	var result = {
		host: 'web.skyvr.videoexpertsgroup.com'
	};
	var camid = 0;
	try {
		var obj = atob(access_token);
		obj = JSON.parse(obj);
		console.log("Token: ", obj);
		if (!obj.token) {
			console.error('Invalid access token format (missing "token")');
			return null;
		}

		if (!obj.access) {
			console.error('Invalid access token format (missing "access")');
			return null;
		}

		if (obj.token && obj.camid && obj.access && obj.token !== '' && obj.camid !== '' && obj.access !== ''){
			result.share_token = obj.token;
			result.camid = obj.camid;
			result.access = obj.access;
		}

		if (obj.api) {
			result.host = obj.api;
			// console.log('self.host: ', result.host);
		}

		if (obj.api_p) {
			result.api_port = obj.api_p;
			// console.log('self.api_port: ', result.api_port);
		}

		if (obj.api_security_port) {
			result.api_security_port = obj.api_security_port;
			// console.log('self.api_security_port: ', result.api_security_port);
		}

	} catch (err) {
		console.error('Invalid access token format');
		return null;
	}

	result.base_url = result.host;
	if (result.host == 'web.skyvr.videoexpertsgroup.com') {
		result.base_url = 'https://' + result.host;
	} else if (location.protocol === 'https:') {
		result.base_url = 'https://' + result.host;
		if (result.api_secutiry_port != null) {
			result.base_url += ':' + result.api_secutiry_port;
			result.port = result.api_secutiry_port;
		} else {
			result.port = 443;
		}
	} else if (location.protocol === 'http:' || location.protocol==="file:") {
		result.base_url = 'http://' + result.host;
		if (self.api_port != null) {
			result.base_url += ':' + result.api_port;
			result.port = result.api_port;
		} else {
			result.port = 80;
		}
	} else {
		console.error('Invalid protocol');
		return null;
	}

	return result;
}

CloudHelpers.createCallbacks = function() {
	return new function() {
		var mCallbacks = {};
		console.log(this);
		var self = this;
		self.executeCallbacks = function(evnt, args){
			function execCB(n, evnt_, args_){
				setTimeout(function(){
					mCallbacks[n](evnt_, args_);
				},1);
			}
			for(var n in mCallbacks){
				execCB(n, evnt, args);
			}
		}
		self.removeCallback = function(uniqname){
			delete mCallbacks[uniqname];
		}
		self.addCallback = function(uniqname, func){
			if(typeof(func) !== "function"){
				console.error("Second parameter expected function");
				return;
			}
			if(mCallbacks[uniqname]){
				console.warn(uniqname + " - already registered callback, will be removed before add");
				self.removeCallback(uniqname);
			}
			mCallbacks[uniqname] = func;
		}
	};
}

CloudHelpers.compareVersions = function(v1,v2) {
		v1 = v1 || "0.0.0";
		v2 = v2 || "0.0.0";
		var _v1 = v1.split(".");
		var _v2 = v2.split(".");
		if (_v1.length != 3 || _v2.length != 3) {
				console.error("[CloudHelpers.compareVersions] could not compare versions ", v1, v2);
				return
		}
		for (var i = 0; i < 3; i++) {
				_v1[i] = parseInt(_v1[i], 10);
				_v2[i] = parseInt(_v2[i], 10);
				if (_v1[i] != _v2[i]) {
						return _v2[i] - _v1[i];
				}
		}
		return 0;
}


// Cloud API Library.
// Network Layer Between FrontEnd And BackEnd.
// Part of CloudSDK

window.CloudAPI = function(cloud_token, svcp_url){
	var self = this;
	self.token = cloud_token.token;
	self.token_expire = cloud_token.expire;
	self.token_expireUTC = Date.parse(cloud_token.expire + "Z");
	self.host = svcp_url;
	self.token_type = cloud_token.type;
	self.requestWrap = new CloudHelpers.RequestWrap();

	self.isShareToken = function(){
		return self.token_type == 'share';
	}

	self.endpoints = {
		api: self.host + "api/v2/",
		cameras: self.host+"api/v2/cameras/",
		admin_cameras: self.host+"api/v2/admin/cameras/",
		camsess: self.host+"api/v2/camsess/",
		server: self.host+"api/v2/server/",
		account: self.host+"api/v2/account/",
		cmngrs: self.host+"api/v2/cmngrs/",
		storage: self.host+"api/v2/storage/",
		clips: self.host+"api/v2/storage/clips/",
		channels: self.host+"api/v3/channels/"

	};

	self.endpoints_v4 = {
		api: self.host + "api/v4/",
		live_watch: self.host + "api/v4/live/watch/",
		images: self.host+"api/v4/storage/images/"
	};

	self._getCloudToken = function(){
		return self.token;
	};

	self.updateApiToken = function(){
		return self.requestWrap.request({
			url: self.endpoints.account + 'token/api/',
			type: 'GET',
			token: self._getCloudToken()
		});
	}

	// get fresh token
	if(!self.isShareToken()){
		self.updateApiToken().done(function(new_token){
			console.warn("[CloudConnection] Cloud Token Api refreshed");
			self.token = new_token.token;
			self.token_expire = new_token.expire;
			self.token_expireUTC = Date.parse(new_token.expire + "Z");
			// start poling token thread
			clearInterval(self.updateTokenInterval);
			self.updateTokenInterval = setInterval(function(){
				if(self.token_expireUTC - new Date().getTime() < 20*60000){ // less then 20 minutes
					self.updateApiToken().done(function(new_token){
						console.warn("[CloudConnection] Cloud Token api refreshed");
						self.token = new_token.token;
						self.token_expire = new_token.expire;
						self.token_expireUTC = Date.parse(new_token.expire + "Z");
					});
				}else{
					console.log("[CloudConnection] Cloud Token is live");
				}
			}, 5*60000); // every 5 minutes
		});
	}

	self.dispose = function(){
		delete self.requestWrap;
		self.token = null;
		clearInterval(self.updateTokenInterval);
	}

	self.createCamera = function(data){
		return self.requestWrap.request({
			url: self.endpoints.cameras + '?detail=detail',
			type: 'POST',
			token: self._getCloudToken(),
			data: JSON.stringify(data),
			contentType: 'application/json'
		});
	}

	self.camerasList = function(data){
		data = data || {};
		if(self.isShareToken()){
			data.token = self._getCloudToken();
		}
		var query = CloudHelpers.mapToUrlQuery(data);
		return self.requestWrap.request({
			url: self.endpoints.cameras + "?" + query,
			type: 'GET',
			token: self._getCloudToken(),
			// data: JSON.stringify(data),
			contentType: 'application/json'
		});
	}

	self.getCameraList = self.camerasList;

	self.deleteCamera = function(camid){
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + '/',
			type: 'DELETE',
			token: self._getCloudToken()
		});
	}

	self.getCamera = function(camid, data){ // deprecated
		data = data || {};
		data['detail'] = 'detail';
		if(self.isShareToken()){
			data.token = self._getCloudToken();
		}
		var query = CloudHelpers.mapToUrlQuery(data);
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + '/?' + query,
			type: 'GET',
			token: self._getCloudToken()
		});
	}

	self.getCamera2 = function(camid, data){ // new
		data = data || {};
		if(self.isShareToken()){
			data.token = self._getCloudToken();
		}
		var query = CloudHelpers.mapToUrlQuery(data);
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + '/?' + query,
			type: 'GET',
			token: self._getCloudToken()
		});
	}

	self.cameraUsage = function(camid){
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + '/usage/',
			type: 'GET',
			token: self._getCloudToken()
		});
	}

	self.updateCamera = function(camid, data){
		data = data || {};
		if(self.isShareToken()){
			data.token = self._getCloudToken();
		}
		var query = CloudHelpers.mapToUrlQuery(data);
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + '/?' + query,
			type: 'PUT',
			token: self._getCloudToken(),
			data: JSON.stringify(data),
			contentType: 'application/json'
		});
	}

	self.cameraLiveUrls = function(camid, streamid = ""){
		var data = {};
		var r_url = self.endpoints.cameras + camid + '/live_urls/?';
		if (streamid !== "") {
			data.stream_id = streamid;
		}

		if(self.isShareToken()){
			data.token = self._getCloudToken();
			//data.media_urls = 'webrtc';
			r_url = self.endpoints_v4.live_watch + '?';
		}
		var query = CloudHelpers.mapToUrlQuery(data);
		return self.requestWrap.request({
			url: r_url + query,
			type: 'GET',
			token: self._getCloudToken()
			//data: JSON.stringify(data),
		});
	}

	self.cameraBackwardUrls = function(camid){
		var data = {};
		var r_url = self.endpoints.cameras + camid + '/live_urls/?media_urls=webrtc_back,rtmp_back&';
		if(self.isShareToken()){
			data.token = self._getCloudToken();
		}
		var query = CloudHelpers.mapToUrlQuery(data);
		return self.requestWrap.request({
			url: r_url + query,
			type: 'GET',
			token: self._getCloudToken(),
			data: JSON.stringify(data),
		});
	}

	self.cameraStreamUrls_webrtc = function(camid){
		var data = {};
		var r_url = self.endpoints.cameras + camid + '/stream_urls/?';
		data.proto = 'webrtc';

		if(self.isShareToken()){
			data.token = self._getCloudToken();
		}
		var query = CloudHelpers.mapToUrlQuery(data);
		return self.requestWrap.request({
			url: r_url + query,
			type: 'GET',
			token: self._getCloudToken(),
			data: JSON.stringify(data),
		});
	}

	self.getServerTime = function(){
		var p = CloudHelpers.promise();

		self.requestWrap.request({
			url: self.endpoints.api + 'server/time/',
			type: 'GET'
		}).done(function(r){
			var current_utc = CloudHelpers.getCurrentTimeUTC();
			self.diffServerTime = Date.parse(r.utc + "Z") - current_utc;
			p.resolve(r);
		}).fail(function(err){
			p.reject(err);
		})
		return p;
	}

	self.getAccountInfo = function(){
		return self.requestWrap.request({
			url: self.endpoints.account,
			type: 'GET',
			token: self._getCloudToken()
		});
	}

	self.getAccountCapabilities = function(){
		return self.requestWrap.request({
			url: self.endpoints.account + "capabilities/",
			type: 'GET',
			token: self._getCloudToken()
		});
	}

	self.cameraMediaStreams = function(camid){
		var data = {};
		if(self.isShareToken()){
			data.token = self._getCloudToken();
		}
		var query = CloudHelpers.mapToUrlQuery(data);
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + "/media_streams/?" + query,
			type: 'GET',
			token: self._getCloudToken(),
		});
	};

	self.updateCameraMediaStreams = function(camid, data){
		data = data || {};
		if(self.isShareToken()){
			data.token = self._getCloudToken();
		}
		var query = CloudHelpers.mapToUrlQuery(data);
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + '/media_streams/?' + query,
			type: 'PUT',
			token: self._getCloudToken(),
			data: JSON.stringify(data),
			contentType: 'application/json'
		});	
	};

	self.getCameraVideoStreams = function(camid) {
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + "/video/streams",
			type: 'GET',
			contentType: 'application/json',
			token: self._getCloudToken(),
		});
	}
	
	self.getCameraVideoStream = function(camid,videoid){
		var data = {};
		if(self.isShareToken()){
			data.token = self._getCloudToken();
		}
		var query = CloudHelpers.mapToUrlQuery(data);
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + "/video/streams/"+videoid+"/?" + query,
			type: 'GET',
			token: self._getCloudToken(),
		});
	};


	self.cameraPreview = function(camid){
		var data = {};
		if(self.isShareToken()){
			data.token = self._getCloudToken();
		}
		var query = CloudHelpers.mapToUrlQuery(data);
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + "/preview/?" + query,
			type: 'GET',
			token: self._getCloudToken()
		});
	};

	self.cameraUpdatePreview = function(camid){
		var get_params = {};
		if(self.isShareToken()){
			get_params.token = self._getCloudToken();
		}
		var query = CloudHelpers.mapToUrlQuery(get_params);
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + "/preview/update/?" + query,
			type: 'POST',
			token: self._getCloudToken()
		});
	};


	self.cameraSendPtz = function(camid, data){
		data = data || {};
		var get_params = {};
		if(self.isShareToken()){
			get_params.token = self._getCloudToken();
		}
		var query = CloudHelpers.mapToUrlQuery(get_params);
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + "/send_ptz/?" + query,
			type: 'POST',
			token: self._getCloudToken(),
			data: JSON.stringify(data),
			contentType: 'application/json'
		});
	}

	self.cameraPtzExecute = function(camid, data){
		data = data || {};
		var get_params = {};
		if(self.isShareToken()){
			get_params.token = self._getCloudToken();
		}
		var query = CloudHelpers.mapToUrlQuery(get_params);
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + "/ptz/execute/?" + query,
			type: 'POST',
			token: self._getCloudToken(),
			data: JSON.stringify(data),
			contentType: 'application/json'
		});
	}

	self.cameraPtz = function(camid){
		var data = {};
		if(self.isShareToken()){
			data.token = self._getCloudToken();
		}
		var query = CloudHelpers.mapToUrlQuery(data);
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + "/ptz/?" + query,
			type: 'GET',
			token: self._getCloudToken(),
		});
	}

	self.cameraAudio = function(camid) {
		var data = {};
		if(self.isShareToken()){
			data.token = self._getCloudToken();
		}
		var query = CloudHelpers.mapToUrlQuery(data);
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + "/audio/?" + query,
			type: 'GET',
			token: self._getCloudToken(),
		});
	}

	self.storageRecords = function(camid, startDT, endDt){
		var p = CloudHelpers.promise();
		var request_data = {
			camid: camid,
			limit: 1000,
			offset: 0,
			start: startDT
		};
		if(endDt)
			request_data.end = endDt;

		if(self.isShareToken()){
			request_data.token = self._getCloudToken();
		}

		function getData(req_data){
			var query = CloudHelpers.mapToUrlQuery(req_data);
			return self.requestWrap.request({
				url: self.endpoints.storage + "data/?" + query,
				type: 'GET',
				token: self._getCloudToken()
			});
		};

		CloudHelpers.requestAsyncList(getData, request_data, p);
		return p;
	};

	self.storageRecordsFirst = function(camid, startDT, nLimit){
		// console.log("storageRecordsFirst, nLimit: " + nLimit);

		var p = CloudHelpers.promise();
		var request_data = {
			camid: camid,
			limit: nLimit,
			offset: 0,
			start: startDT
		};
		request_data.limit = nLimit;
		if(self.isShareToken()){
			request_data.token = self._getCloudToken();
		}

		/*function getData(req_data){
			console.log("req_data: ", query);
			var query = CloudHelpers.mapToUrlQuery(req_data);
			console.log(query);
			return self.requestWrap.request({
				url: self.endpoints.storage + "data/?" + query,
				type: 'GET',
				token: self._getCloudToken()
			});
		};*/

		// CloudHelpers.requestAsyncList(getData, request_data_st, p);
		// return p;

		var query = CloudHelpers.mapToUrlQuery(request_data);
		return self.requestWrap.request({
			url: self.endpoints.storage + "data/?" + query,
			type: 'GET',
			token: self._getCloudToken()
		});
	};

	self.storageTimeline = function(camid, start_dt, end_dt, slice){
		var request_data = {
			start: start_dt,
			end: end_dt,
			slices: slice
		};
		if(self.isShareToken()){
			request_data.token = self._getCloudToken();
		}

		var query = CloudHelpers.mapToUrlQuery(request_data);
		return self.requestWrap.request({
			url: self.endpoints.storage + "timeline/" + camid + "/?" + query,
			type: 'GET',
			token: self._getCloudToken()
		});
	};

	self.storageActivity = function(camid, use_timezone){

		var request_data = {
			camid: camid
		};

		if(use_timezone){
			request_data.daysincamtz = '';
		}

		if(self.isShareToken()){
			request_data.token = self._getCloudToken();
		}

		var query = CloudHelpers.mapToUrlQuery(request_data);
		return self.requestWrap.request({
			url: self.endpoints.storage + "activity/?" + query,
			type: 'GET',
			token: self._getCloudToken()
		});
	};

	/* cameramanager */

	self.resetCameraManager = function(cmid, data){
		if(self.isShareToken()){
			data = data || {};
			return self.requestWrap.request({
				url: self.endpoints.cmngrs + cmid + "/reset/?token=" + self._getCloudToken(),
				type: 'POST',
				// token: self._getCloudToken(),
				data: JSON.stringify(data),
				contentType: 'application/json'
			});
		}else{
			data = data || {};
			return self.requestWrap.request({
				url: self.endpoints.cmngrs + cmid + "/reset/",
				type: 'POST',
				token: self._getCloudToken(),
				data: JSON.stringify(data),
				contentType: 'application/json'
			});
		}
	};

	self.updateCameraManager = function(cmid, data){
		data = data || {};
		return self.requestWrap.request({
			url: self.endpoints.cmngrs + cmid + "/",
			type: 'PUT',
			token: self._getCloudToken(),
			data: JSON.stringify(data),
			contentType: 'application/json'
		});
	};

	/* camsess */

	self.getCamsessList = function(data){
		var query = CloudHelpers.mapToUrlQuery(data);
		return self.requestWrap.request({
			url: self.endpoints.camsess + "?" + query,
			type: 'GET',
			token: self._getCloudToken(),
			// data: JSON.stringify(data),
			contentType: 'application/json'
		});
	}

	self.getCamsess = function(id){
		return self.requestWrap.request({
			url: self.endpoints.camsess + id + "/?detail=detail",
			type: 'GET',
			token: self._getCloudToken(),
			// data: JSON.stringify(data),
			contentType: 'application/json'
		});
	}

	self.getCamsessRecords = function(sessid){
		return self.requestWrap.request({
			url: self.endpoints.camsess + sessid + "/records/",
			type: 'GET',
			token: self._getCloudToken(),
			// data: JSON.stringify(data),
			contentType: 'application/json'
		});
	}

	self.deleteCamsess = function(sessid){
		return self.requestWrap.request({
			url: self.endpoints.camsess + sessid + "/",
			type: 'DELETE',
			token: self._getCloudToken(),
		});
	}

	// sharing
	self.creareCameraSharingToken = function(camid, share_name, acls){
		share_name = share_name || '';
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + "/sharings/",
			type: 'POST',
			data: JSON.stringify({camid: camid, name: share_name, access: acls}),
			contentType: 'application/json',
			token: self._getCloudToken(),
		});
	}

	self.updateCameraSharingToken = function(camid, shid, obj){
		obj = obj || {};
		obj.camid = camid;
		obj.shid = shid;
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + "/sharings/" + shid + "/",
			type: 'PUT',
			data: JSON.stringify(obj),
			contentType: 'application/json',
			token: self._getCloudToken(),
		});
	}

	self.getCameraSharingTokensList = function(camid){
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + "/sharings/?detail=detail",
			type: 'GET',
			token: self._getCloudToken(),
		});
	}

	self.deleteCameraSharingToken = function(camid, sharing_token){
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid + "/sharings/" + sharing_token + '/',
			type: 'DELETE',
			token: self._getCloudToken(),
		});
	}

	self.toggleMemRec = function(camid, mem_rec, access_token) {
		var obj = obj || {};
		obj.memorycard_recording = mem_rec;
		return self.requestWrap.request({
			url: self.endpoints.cameras + camid,
			type: 'PUT',
			data: JSON.stringify(obj),
			contentType: 'application/json',
			access_token: access_token,
		});
	}

	// clips
	self.createClip = function ( camid, title, start, end, delete_at, access_token ) {
	    title = title || '';

	    obj = {};
	    obj.camid		= camid;
	    obj.source_camid	= camid;
	    obj.start		= start;
	    obj.end		= end;
	    obj.wait_for_data	= true;
	    if (delete_at !== undefined) {
		obj.delete_at = delete_at;
	    }
	    var request = {};
	    request.url = self.endpoints.clips;
	    request.type = 'POST';
	    request.data = JSON.stringify(obj);
	    request.contentType = 'application/json';
	    if (access_token !== undefined) {
		request.access_token = access_token;
	    } else {
		request.token = self._getCloudToken();
	    }

	    return self.requestWrap.request(request);
	}

	self.getClip = function ( clipid , access_token) {
	    var request = {};
	    request.url = self.endpoints.clips + clipid + '/';
	    request.type = 'GET';
	    if (access_token !== undefined) {
		request.access_token = access_token;
	    } else {
		request.token = self._getCloudToken();
	    }

	    return self.requestWrap.request(request);
	}

	self.getChannels = function(){
		return self.requestWrap.request({
			url: self.endpoints.channels,
			type: 'GET',
			token: self._getCloudToken(),
		});
	}

	self.getCameraStreamingURLs = function(camid){
	    return self.requestWrap.request({
		url: self.endpoints.cameras + camid + "/stream_urls/",
		type: 'GET',
		token: self._getCloudToken()
	    });
	};

	//images
	self.cameraImages = function( options ){
		var data = {};
		if(self.isShareToken()){
			data.token = self._getCloudToken();
		}
		if (options.start !== undefined){
			data.start = options.start;
		}
		if (options.end !== undefined) {
			data.end = options.end;
		}
		if (options.order_by !== undefined) {
			data.order_by = options.order_by;
		}
		if (options.origin !== undefined) {
			data.origin = options.origin;
		}
		if (options.limit !== undefined) {
			data.limit = options.limit;
		}
		if (options.offset !== undefined) {
			data.offset = options.offset;
		}
		var r_url = self.endpoints_v4.images + '?';

		var query = CloudHelpers.mapToUrlQuery(data);

		return self.requestWrap.request({
			url: r_url + query,
			type: 'GET',
			token: self._getCloudToken(),
			data: JSON.stringify(data),
		});
	}
};

window.SkyVR = window.CloudAPI;

CloudAPI.config = {
	url: "",
	url_cameras: "",
	url_api: "",
	cameraID: "",
	user_name: "",
	vendor: ""
};

CloudAPI.setToCookie = function(name, value) {
	var date = new Date( new Date().getTime() + (7 * 24 * 60 * 60 * 1000) ); // cookie on week
	document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + "; path=/; expires="+date.toUTCString();
}

CloudAPI.getFromCookie = function(name) {
	var matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : '';
}

CloudAPI.removeFromCookie = function(name) {
	document.cookie = encodeURIComponent(name) + "=; path=/;";
}

CloudAPI.cache = {
	cameras: {},
	timezones: {}
};

CloudAPI.cache.cameraInfo = function(camid){
	if(camid)
		return CloudAPI.cache.cameras[camid];
	else if(CloudAPI.isCameraID())
		return CloudAPI.cache.cameras[CloudAPI.cameraID()];
};

// symlink
CloudAPI.cache.getCameraInfo = CloudAPI.cache.cameraInfo;

CloudAPI.cache.mergeObjects = function(obj1, obj2){
	// rewrite options
	for(var k in obj2){
		var t = typeof obj2[k];
		if(t == "boolean" || t == "string" || t == "number"){
			if(obj1[k] != obj2[k]){
				if(obj1[k]){
					console.log("Changed " + k);
					CloudAPI.events.trigger('CAMERA_INFO_CHANGED', {'name':k, 'new_value':obj2[k]});
				}
				obj1[k] = obj2[k];
			}
		}else if(Array.isArray(obj2[k])){
			obj1[k] = obj2[k];
		}else if(t == "object"){
			if(!obj1[k]) obj1[k] = {};
			obj1[k] = CloudAPI.cache.mergeObjects(obj1[k], obj2[k]);
		}
	}
	return obj1;
}

CloudAPI.cache.updateCameraInfo = function(cam){
	var camid = cam.id;
	if(!CloudAPI.cache.cameras[camid]){
		CloudAPI.cache.cameras[camid] = {};
	};
	CloudAPI.cache.cameras[camid] = CloudAPI.cache.mergeObjects(CloudAPI.cache.cameras[camid], cam);
}

CloudAPI.cache.setCameraInfo = function(cam){
	var camid = cam.id;
	if(CloudAPI.cache.cameras[camid] == undefined){
		CloudAPI.cache.cameras[camid] = {};
	};
	var changed_p2p_settings = cam['p2p_streaming'] && cam['p2p_streaming'] == true ? true : false; // need request

	var prev_cam = CloudAPI.cache.cameras[camid];
	CloudAPI.cache.cameras[camid] = CloudAPI.cache.mergeObjects(prev_cam, cam);

	// TODO clean rewrite options (exclude p2p and p2p_settings and video and audio struct)
	CloudAPI.cache.cameras[camid]['lastTimeUpdated'] = Date.now();
	// console.log("[CLOUDAPI] CloudAPI.cache.cameras[" + camid + "]: ", CloudAPI.cache.cameras[camid]);
	return changed_p2p_settings;
};
CloudAPI.cache.setP2PSettings = function(cameraID, p2p_settings){
	if(CloudAPI.cache.cameras[cameraID] == undefined){
		CloudAPI.cache.cameras[cameraID] = {};
	}
	/*for(var k in cam){
	var t = typeof cam[k];
	// console.log("Type: " + t);
	if(t == "boolean" || t == "string" || t == "number"){
		if(CloudAPI.cache.cameras[camid][k] != cam[k]){
			if(CloudAPI.cache.cameras[camid][k])
				console.log("Changed " + k);
			CloudAPI.cache.cameras[camid][k] = cam[k];
		}*/
	CloudAPI.cache.cameras[cameraID].p2p = p2p_settings;
	CloudAPI.cache.cameras[cameraID].p2p_settings = CloudAPI.cache.cameras[cameraID].p2p;
	// console.log("[CLOUDAPI] setP2PSettings. CloudAPI.cache.cameras[" + cameraID + "]: ", CloudAPI.cache.cameras[cameraID]);
};

CloudAPI.cache.setMemoryCard = function(cameraID, memory_card){
	if(CloudAPI.cache.cameras[cameraID] == undefined){
		CloudAPI.cache.cameras[cameraID] = {};
	}
	CloudAPI.cache.cameras[cameraID].memory_card = memory_card;
};

CloudAPI.cache.setPtzCaps = function(cameraID, ptz_caps){
	if(CloudAPI.cache.cameras[cameraID] == undefined){
		CloudAPI.cache.cameras[cameraID] = {};
	}
	CloudAPI.cache.cameras[cameraID].ptz = ptz_caps;
};

CloudAPI.cache.updateCameraAudio = function(cameraID, audio_struct){
	if(!CloudAPI.cache.cameras[cameraID]){
		CloudAPI.cache.cameras[cameraID] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]["audio"]){
		CloudAPI.cache.cameras[cameraID]["audio"] = {};
	}
	CloudAPI.cache.cameras[cameraID].audio = CloudAPI.cache.mergeObjects(CloudAPI.cache.cameras[cameraID].audio, audio_struct);
};
CloudAPI.cache.cameraAudio = function(cameraID){
	cameraID = cameraID || CloudAPI.cameraID();
	if(!CloudAPI.cache.cameras[cameraID]){
		return {};
	};
	return CloudAPI.cache.cameras[cameraID].audio;
};
CloudAPI.cache.updateCameraVideo = function(cameraID, video_struct){
	if(!CloudAPI.cache.cameras[cameraID]){
		CloudAPI.cache.cameras[cameraID] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]["video"]){
		CloudAPI.cache.cameras[cameraID]["video"] = {};
	}
	var video = CloudAPI.cache.cameras[cameraID]["video"];
	CloudAPI.cache.cameras[cameraID]["video"] = CloudAPI.cache.mergeObjects(video, video_struct);
};
CloudAPI.cache.cameraVideo = function(cameraID){
	cameraID = cameraID || CloudAPI.cameraID();
	if(!CloudAPI.cache.cameras[cameraID]){
		return {};
	};
	return CloudAPI.cache.cameras[cameraID].video;
}
CloudAPI.cache.cameraVideoStreamName = function(cameraID){
	cameraID = cameraID || CloudAPI.cameraID();
	if(!CloudAPI.cache.cameras[cameraID]){
		return {};
	};
	var video = CloudAPI.cache.cameras[cameraID].video;
	if(video.streams){
		//for(var v in video.streams){
		for(var i = 0 ; i < video.streams.length; i++){
			return v;
		}
	}
	return;
};
CloudAPI.cache.cameraVideoStreams = function(cameraID){
	cameraID = cameraID || CloudAPI.cameraID();
	if(!CloudAPI.cache.cameras[cameraID]){
		return {};
	};
	var video = CloudAPI.cache.cameras[cameraID].video;
	if(video.streams){
		return video.streams;
	}
	return;
};
CloudAPI.cache.setLimits = function(cameraID, struct_limits){
	if(!CloudAPI.cache.cameras[cameraID]){
		CloudAPI.cache.cameras[cameraID] = {};
	};
	CloudAPI.cache.cameras[cameraID].limits = struct_limits;
};
CloudAPI.cache.updateCameraVideoStream = function(cameraID, vs_id, struct){
	if(!CloudAPI.cache.cameras[cameraID]){
		CloudAPI.cache.cameras[cameraID] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['video']){
		CloudAPI.cache.cameras[cameraID]['video'] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['video']['streams']){
		CloudAPI.cache.cameras[cameraID]['video']['streams'] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['video']['streams'][vs_id]){
		CloudAPI.cache.cameras[cameraID]['video']['streams'][vs_id] = {};
	};
	var prev = CloudAPI.cache.cameras[cameraID]['video']['streams'][vs_id];
	CloudAPI.cache.cameras[cameraID]['video']['streams'][vs_id] = CloudAPI.cache.mergeObjects(prev, struct);
}
CloudAPI.cache.setAudioStream = function(cameraID, as_id, struct){
	if(!CloudAPI.cache.cameras[cameraID]){
		CloudAPI.cache.cameras[cameraID] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['audio']){
		CloudAPI.cache.cameras[cameraID]['audio'] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['audio']['streams']){
		CloudAPI.cache.cameras[cameraID]['audio']['streams'] = {};
	};
	CloudAPI.cache.cameras[cameraID]['audio']['streams'][as_id] = struct;
}
CloudAPI.cache.setMediaStreams = function(cameraID, media_streams_struct){
	if(!CloudAPI.cache.cameras[cameraID]){
		CloudAPI.cache.cameras[cameraID] = {};
	};
	CloudAPI.cache.cameras[cameraID]['media_streams'] = media_streams_struct;
};
CloudAPI.cache.updateEventProcessingEventsMotion = function(cameraID, struct){
	if(!CloudAPI.cache.cameras[cameraID]){
		CloudAPI.cache.cameras[cameraID] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['event_processing']){
		CloudAPI.cache.cameras[cameraID]['event_processing'] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['event_processing']['events']){
		CloudAPI.cache.cameras[cameraID]['event_processing']['events'] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['event_processing']['events']['motion']){
		CloudAPI.cache.cameras[cameraID]['event_processing']['events']['motion'] = {};
	};
	var prev = CloudAPI.cache.cameras[cameraID]['event_processing']['events']['motion'];
	CloudAPI.cache.cameras[cameraID]['event_processing']['events']['motion'] = CloudAPI.cache.mergeObjects(prev, struct);
};
CloudAPI.cache.updateCameraEventProcessingEventsSound = function(cameraID, struct){
	if(!CloudAPI.cache.cameras[cameraID]){
		CloudAPI.cache.cameras[cameraID] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['event_processing']){
		CloudAPI.cache.cameras[cameraID]['event_processing'] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['event_processing']['events']){
		CloudAPI.cache.cameras[cameraID]['event_processing']['events'] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['event_processing']['events']['sound']){
		CloudAPI.cache.cameras[cameraID]['event_processing']['events']['sound'] = {};
	};
	var prev = CloudAPI.cache.cameras[cameraID]['event_processing']['events']['sound'];
	CloudAPI.cache.cameras[cameraID]['event_processing']['events']['sound'] = CloudAPI.cache.mergeObjects(prev, struct);
};

CloudAPI.generateNewLocation = function(page){
	var params = [];
	if(CloudHelpers.containsPageParam("lang"))
		params.push("lang=" +encodeURIComponent(CloudAPI.pageParams["lang"]));
	if(CloudHelpers.containsPageParam("vendor"))
		params.push("vendor=" +encodeURIComponent(CloudAPI.pageParams["vendor"]));
	if(CloudHelpers.containsPageParam("mobile"))
		params.push('mobile=' + encodeURIComponent(CloudAPI.pageParams['mobile']))
	params.push("p=" +encodeURIComponent(page));
	return "?" + params.join("&");
}

CloudAPI.setURL = function(url){
	if(CloudAPI.config.url != url){
		CloudAPI.config.url = url;
		CloudAPI.config.url_api = url+"api/v2/";
		CloudAPI.config.url_cameras = url+"api/v2/cameras/";
		CloudAPI.config.url_admin_cameras = url+"api/v2/admin/cameras/";
		CloudAPI.config.url_camsess = url+"api/v2/camsess/";
		CloudAPI.config.url_server = url+"api/v2/server/";
		CloudAPI.config.url_account = url+"api/v2/account/";
		CloudAPI.config.url_cmngrs = url+"api/v2/cmngrs/";
		CloudAPI.config.url_storage = url+"api/v2/storage/";
		CloudAPI.config.url_clips = url+"api/v2/storage/clips/";
		CloudAPI.config.anonToken = {
			token: '',
			type: 'anon',
			expire: '',
			expireTimeUTC: 0
		};
		// console.log(localStorage);
		if( localStorage !== undefined && localStorage.getItem('SkyVR_anonToken'))
			CloudAPI.config.anonToken = JSON.parse(localStorage.getItem('SkyVR_anonToken'));
		CloudAPI.config.apiToken = {
			token: '',
			type: 'api',
			expire: '',
			expireTimeUTC: 0
		};
		CloudAPI.config.shareToken = {};
		var old_token = CloudAPI.getFromStorage('SkyVR_apiToken');
		if(old_token){
			var apiToken = JSON.parse(old_token)
			if(apiToken.expireTimeUTC > Date.now()){
				CloudAPI.config.apiToken = apiToken;
			}
		}
		CloudAPI.setToStorage('CloudAPI_svcp_host', url);
	};
};


CloudAPI.isExpiredApiToken = function(){
	if(CloudAPI.config.apiToken.expireTimeUTC){
		if(CloudAPI.config.apiToken.expireTimeUTC > Date.now()){
			return false;
		}else{
			return true;
		}
	}else{
		return true;
	}
}

CloudAPI.applyApiToken = function(){
	$.ajaxSetup({
		crossDomain: true,
		cache: false,
		beforeSend: function(xhr,settings) {
			if(CloudAPI.config.apiToken && CloudAPI.config.apiToken.token) {
//				xhr.setRequestHeader('Authorization', 'SkyVR ' + CloudAPI.config.apiToken.token);
			}
		}
	});
}
// $.support.cors = true;
/*
CloudAPI.updatePageProgressCaption = function(){

	var loading_translate = {
		'en' : 'Loading...',
		'ru' : 'Загрузка...',
		'ko' : '카메라 정보 가져오는 중...',
		'it' : 'Caricamento in corso...'
	}

	try{
		if(document.getElementById('progress-caption')){
			if(loading_translate[CloudAPI.lang()]){
				document.getElementById('progress-caption').innerHTML = loading_translate[CloudAPI.lang()];
			}else{
				document.getElementById('progress-caption').innerHTML = loading_translate["en"];
			}
		}
	}catch(e){
	}
}

CloudAPI.loadVendorScripts = function(vendor, path){
	if(vendor != ''){
		var js = document.createElement("script");
		js.type = "text/javascript";
		js.src = (path ? path : './') + 'vendor/' + vendor + "/cc.js";
		document.head.appendChild(js);

		js.onload = function(){
			CloudAPI.updatePageProgressCaption(); // TODO move to CloudUI
			if(CloudHelpers.containsPageParam("customswf")){
				cc.custom_videojs_swf = "swf/video-js-custom-vxg.swf";
			}

			if(CloudAPI.onLoadedVendorScript){
				CloudAPI.onLoadedVendorScript();
			}
		}

		js.onerror = function(){
			console.error("Not found vendor use default");
			CloudAPI.config.vendor = 'VXG';
			CloudAPI.loadVendorScripts(CloudAPI.config.vendor, path);
		}

		var cc_css = document.createElement("link");
		cc_css.rel = "stylesheet";
		cc_css.href = (path ? path : './') + "vendor/" + vendor + "/cc.min.css";
		document.head.appendChild(cc_css);

		var cc_css2 = document.createElement("link");
		cc_css2.rel = "stylesheet";
		cc_css2.href = (path ? path : './') + "vendor/" + vendor + "/pageloader.min.css";
		document.head.appendChild(cc_css2);
	}else{
		// Load default scripts
		console.log('Not found vendor');
		CloudAPI.loadVendorScripts('VXG', path);
	}
};

CloudAPI.url = function() {
	return CloudAPI.config.url;
};

CloudAPI.setCameraID = function(id){
	if(CloudAPI.config.cameraID != id && id){
		CloudAPI.config.cameraID = id;
		console.log("[CLOUDAPI] new cam id: " + id);
		if(!CloudAPI.cache.camera){
			CloudAPI.cameraInfo().done(function(cam){
				CloudAPI.cache.camera = cam;
			});
		}
	} else if (!id){
		CloudAPI.config.cameraID = undefined;
		CloudAPI.cache.camera = undefined;
	}
};
CloudAPI.cameraID = function(){
	return CloudAPI.config.cameraID;
};
CloudAPI.cameraManagerID = function(){
	return CloudAPI.cache.cameras[CloudAPI.config.cameraID]['cmngrid'];
};
CloudAPI.isCameraID = function(){
	if(CloudAPI.config.cameraID == undefined){
		console.error("[CLOUDAPI] cameraID is undefined");
		return false;
	};
	return true;
};
CloudAPI.isP2PStreaming_byId = function(camid){
	var cam = CloudAPI.cache.cameras[camid];
	if(cam && cam['p2p_streaming'] && cam.p2p_streaming == true){
		return true;
	}
	return false;
};
CloudAPI.isP2PStreaming = function(){
	if(CloudAPI.cache.cameraInfo() == undefined){
		console.error("[CLOUDAPI] cameraID is undefined");
		return false;
	};
	return CloudAPI.isP2PStreaming_byId(CloudAPI.cache.cameraInfo().id);
};

CloudAPI.hasMemoryCard_byId = function(camid){
	var cam = CloudAPI.cache.cameras[camid];
	if(cam && cam['memory_card'] && cam.memory_card.status != "none"){
		return true;
	}
	return false;
}

CloudAPI.hasMemoryCard = function(){
	if(CloudAPI.cache.cameraInfo() == undefined){
		console.error("[CLOUDAPI] cameraID is undefined");
		return false;
	};
	return CloudAPI.hasMemoryCard_byId(CloudAPI.cache.cameraInfo().id);
}

CloudAPI.convertUTCTimeToStr = function(t){
	var d = new Date();
	d.setTime(t);
	var monthesTrans = ["short_Jan", "short_Feb", "short_Mar",
		"short_Apr", "short_May", "short_June",
		"short_July", "short_Aug", "short_Sep",
		"short_Oct", "short_Nov", "short_Dec"
	];
	var str = d.getUTCDate() + CloudUI.tr(monthesTrans[d.getUTCMonth()]) + " " + d.getUTCFullYear() + " "
		+ ("00" + d.getUTCHours()).slice(-2) + ":" + ("00" + d.getUTCMinutes()).slice(-2) + ":" + ("00" + d.getUTCSeconds()).slice(-2);
	if(CloudAPI.lang() == 'ko'){
		str = ("00" + (d.getUTCMonth() + 1)).slice(-2) + '/' + ("00" + d.getUTCDate()).slice(-2) + "/" + d.getUTCFullYear() + " "
			+ ("00" + d.getUTCHours()).slice(-2) + ":" + ("00" + d.getUTCMinutes()).slice(-2) + ":" + ("00" + d.getUTCSeconds()).slice(-2);
	}
	return str;
};

CloudAPI.convertUTCTimeToSimpleStr = function(t){
	var d = new Date();
	d.setTime(t);
	var str = d.getUTCFullYear() + "-"
		+ ("00" + (d.getUTCMonth()+1)).slice(-2) + "-"
		+ ("00" + d.getUTCDate()).slice(-2) + " "
		+ ("00" + d.getUTCHours()).slice(-2) + ":"
		+ ("00" + d.getUTCMinutes()).slice(-2) + ":"
		+ ("00" + d.getUTCSeconds()).slice(-2);
	return str;
}

// helper function
CloudAPI.getOffsetTimezone = function() {
	var cam = CloudAPI.cache.cameraInfo();
	if(!cam) return 0;
	if(CloudAPI.cache.timezones[cam.timezone] == undefined){
		var n = new Date();
		if(cam.timezone && cam.timezone != ""){
			var cameraOffset = moment(n).tz(cam.timezone).format("Z");
			var c = cameraOffset[0];
			if(c < '0' || c > '9'){
				cameraOffset = cameraOffset.substring(1);
			};
			var ts_sig = (c == '-') ? -1 : 1;
			var hs = cameraOffset.split(":");
			cameraOffset = ts_sig *(parseInt(hs[0],10)*60 + parseInt(hs[1],10));
			CloudAPI.cache.timezones[cam.timezone] = cameraOffset*60000;
		}else{
			CloudAPI.cache.timezones[cam.timezone] = 0;
		}
	}
	return CloudAPI.cache.timezones[cam.timezone];
}
CloudAPI.getCurrentTimeUTC = function(){
	return Date.now();
};
CloudAPI.getCurrentTimeByCameraTimezone = function(){
	return Date.now() + CloudAPI.getOffsetTimezone();
};
*/

CloudAPI.enable401handler = function() {
	/*$.ajaxSetup({
		error : function(jqXHR, textStatus, errorThrown) {
			if (jqXHR.status == 401 && jqXHR.statusText == "UNAUTHORIZED") {

				var uri = CloudAPI.parseUri(CloudAPI.url);
				var uri2 = CloudAPI.parseUri(CloudAPI.config.url);
				if(uri.host == "" || uri.host == uri2.host){
					CloudAPI.disable401handler();

					if(application.apiToken) {
						application.apiToken.destroy();
					}
					application.cleanupHeader();
					try{ application.player.disposeVideo(); }catch(e) { console.error(e); }
					try{ application.timeline.dispose(); }catch(e) { console.error(e); }

					event.trigger(event.UNAUTHORIZED_REQUEST);
					// application.trigger('showSignIn');
					// window.location = "?";
				}
			}
		}
	});*/
};
CloudAPI.disable401handler = function() {
	$.ajaxSetup({
		error : function(jqXHR, textStatus, errorThrown) {
		}
	});
};
CloudAPI.printStack = function(){
	var err = new Error();
	console.error(err.stack);
};
// constants for pages
CloudAPI.PAGE_SIGNIN = "signin";

/*	CloudAPI.getUTC = function(camtimezone){
	var now = new Date();
	var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
	var d = new Date.now();
	var t = d.getTimezoneOffset();
};*/

CloudAPI.hasAccess = function(caminfo, rule){
	if(SkyUI.isDemo()) return true;
	if(!caminfo) return false;
	if(!caminfo['access']) return true;
	var bResult = false;
//	for(var s in caminfo['access']){
	for(var s = 0; s < caminfo['access'].length; s++){
		if(caminfo['access'][s] == rule)
			bResult = true;
	}
	return bResult;
}

CloudAPI.hasAccessSettings = function(caminfo){
	if(SkyUI.isDemo()) return true;
	caminfo = caminfo || CloudAPI.cache.cameraInfo();
	return CloudAPI.hasAccess(caminfo, "all");
}

CloudAPI.hasAccessMotionDetection = function(caminfo){
	if(SkyUI.isDemo())return true;
	caminfo = caminfo || CloudAPI.cache.cameraInfo();
	return CloudAPI.hasAccess(caminfo, 'all') || CloudAPI.hasAccess(caminfo, 'ptz');
};

CloudAPI.hasAccessClips = function(caminfo){
	if(SkyUI.isDemo())return true;
	caminfo = caminfo || CloudAPI.cache.cameraInfo();
	return CloudAPI.hasAccess(caminfo, "clipping") || CloudAPI.hasAccess(caminfo, "clipplay") || CloudAPI.hasAccess(caminfo, "watch") || CloudAPI.hasAccess(caminfo, "cplay") || CloudAPI.hasAccess(caminfo, "all");
}

CloudAPI.hasAccessLive = function(caminfo){
	if(SkyUI.isDemo())return true;
	caminfo = caminfo || CloudAPI.cache.cameraInfo();
	return CloudAPI.hasAccess(caminfo, "ptz") || CloudAPI.hasAccess(caminfo, "live") || CloudAPI.hasAccess(caminfo, "watch") || CloudAPI.hasAccess(caminfo, "all");
}

CloudAPI.hasAccessPlayback = function(caminfo){
	if(SkyUI.isDemo())return true;
	caminfo = caminfo || CloudAPI.cache.cameraInfo();
	return CloudAPI.hasAccess(caminfo, "clipping") || CloudAPI.hasAccess(caminfo, "play") || CloudAPI.hasAccess(caminfo, "watch") || CloudAPI.hasAccess(caminfo, "splay") || CloudAPI.hasAccess(caminfo, "all");
}

CloudAPI.hasAccessMakeClip = function(caminfo){
	if(SkyUI.isDemo())return true;
	caminfo = caminfo || CloudAPI.cache.cameraInfo();
	return CloudAPI.hasAccess(caminfo, "clipping") || CloudAPI.hasAccess(caminfo, "all");
}

CloudAPI.hasAccessBackAudio = function(caminfo){
	if(SkyUI.isDemo())return true;
	caminfo = caminfo || CloudAPI.cache.cameraInfo();
	return CloudAPI.hasAccess(caminfo, "all") || CloudAPI.hasAccess(caminfo, "backaudio");
}

CloudAPI.handleNothing = function(response){
	// nothing
};

CloudAPI.handleNothingError = function(xhr, ajaxOptions, thrownError){
	// nothing
};
CloudAPI.handleError = function(xhr, ajaxOptions, thrownError){
	console.error(thrownError);
};

CloudAPI.parseUri = function(str) {
	// parseUri 1.2.2
	// (c) Steven Levithan <stevenlevithan.com>
	// MIT License
	function parseUri(str) {
		var	o   = parseUri.options,
			m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
			uri = {},
			i   = 14;

		while (i--) uri[o.key[i]] = m[i] || "";

		uri[o.q.name] = {};
		uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
			if ($1) uri[o.q.name][$1] = $2;
		});

		return uri;
	};
	parseUri.options = {
		strictMode: false,
		key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
		q:   {
			name:   "queryKey",
			parser: /(?:^|&)([^&=]*)=?([^&]*)/g
		},
		parser: {
			strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
			loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
		}
	};
	return parseUri(str)
};

CloudAPI.logout = function(callback){
	$.ajax({
		url: CloudAPI.config.url_account + "logout/",
		type: 'POST',
		success: callback,
		error: CloudAPI.handleError
	});
};
CloudAPI.cameraVideoStream = function(vs_id){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.config.cameraID;
	$.ajax({
		url : CloudAPI.config.url_cameras + camid + "/video/streams/" + vs_id + "/",
		type : "GET"
	}).done(function(response){
		CloudAPI.cache.updateCameraVideoStream(camid, vs_id, response);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};

CloudAPI.cameraLimits = function(){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.config.cameraID;
	$.ajax({
		url : CloudAPI.config.url_cameras + camid + "/limits/",
		type : "GET"
	}).done(function(response){
		CloudAPI.cache.setLimits(CloudAPI.cameraID(), response);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};

CloudAPI.cameraEventProcessingEventsMotion = function(){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.config.cameraID;
	$.ajax({
		url : CloudAPI.config.url_cameras + camid + "/event_processing/events/motion/",
		type : "GET"
	}).done(function(response){
		CloudAPI.cache.updateEventProcessingEventsMotion(camid, response);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
}
CloudAPI.updateCameraEventProcessingEventsMotion = function(data){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.cameraID();
	$.ajax({
		url : CloudAPI.config.url_cameras + camid + "/event_processing/events/motion/",
		type : 'PUT',
		data:  JSON.stringify(data),
		contentType: 'application/json'
	}).done(function(){
		CloudAPI.cache.updateEventProcessingEventsMotion(camid, data);
		d.resolve();
	}).fail(function(){
		d.reject();
	});
	return d;
}

CloudAPI.cameraEventProcessingEventsSound = function(){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.config.cameraID;
	$.ajax({
		url : CloudAPI.config.url_cameras + camid + "/event_processing/events/sound/",
		type : "GET"
	}).done(function(response){
		CloudAPI.cache.updateCameraEventProcessingEventsSound(camid, response);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
}

/*
CloudAPI.cameraSendPtz = function(data){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.cameraID();
	$.ajax({
		url : CloudAPI.config.url_cameras + camid + "/send_ptz/",
		type : 'POST',
		data:  JSON.stringify(data),
		contentType: 'application/json'
	}).done(function(response){
		console.log(response);
		d.resolve();
	}).fail(function(){
		d.reject();
	});
	return d;
}

CloudAPI.cameraPtzExecute = function(data){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.cameraID();
	$.ajax({
		url : CloudAPI.config.url_cameras + camid + "/ptz/execute/",
		type : 'POST',
		data:  JSON.stringify(data),
		contentType: 'application/json'
	}).done(function(response){
		console.log(response);
		d.resolve();
	}).fail(function(){
		d.reject();
	});
	return d;
}

CloudAPI.cameraPtz = function(camid){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = camid || CloudAPI.cameraID();
	$.ajax({
		url : CloudAPI.config.url_cameras + camid + "/ptz/",
		type : 'GET'
	}).done(function(r){
		CloudAPI.cache.setPtzCaps(camid, r);
		d.resolve(r);
	}).fail(function(r){
		d.reject(r);
	});
	return d;
}
*/

CloudAPI.updateCameraEventProcessingEventsSound = function(data){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.cameraID();
	$.ajax({
		url : CloudAPI.config.url_cameras + camid + "/event_processing/events/sound/",
		type : 'PUT',
		data:  JSON.stringify(data),
		contentType: 'application/json'
	}).done(function(){
		// console.log("");
		CloudAPI.cache.updateCameraEventProcessingEventsSound(camid, data);
		d.resolve();
	}).fail(function(){
		d.reject();
	});
	return d;
}

CloudAPI.updateCameraVideoStream = function(vs_id, data){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.cameraID();
	$.ajax({
		url : CloudAPI.config.url_cameras + camid + "/video/streams/" + vs_id + "/",
		type : "PUT",
		data:  JSON.stringify(data),
		contentType: 'application/json'
	}).done(function(){
		console.log("[CLOUDAPI] [CLOUDAPI] Updated video/streams/" + vs_id + " in cache for " + camid);
		CloudAPI.cache.updateCameraVideoStream(camid, vs_id, data);
		d.resolve();
	}).fail(function(){
		d.reject();
	})
	return d;
};
// depreacted please use updateCameraVideoStream
CloudAPI.setVBRQuality = function(newValue, vs_id, cb_success, cb_error){
	if(!CloudAPI.isCameraID()) return;
	cb_success = (cb_success == undefined) ? CloudAPI.handleNothing : cb_success;
	cb_error = (cb_error == undefined) ? CloudAPI.handleError : cb_error;
	var data = {};
	data.vbr_quality = newValue;
	data.vbr = true;
	$.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.config.cameraID + "/video/streams/" + vs_id + "/",
		type: 'PUT',
		success: cb_success,
		error: cb_success,
		data:  JSON.stringify(data),
		contentType: 'application/json'
	});
};
CloudAPI.formatMemoryCard = function(){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()){
		d.reject();
		return d;
	}
	var camid = CloudAPI.config.cameraID;
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + "/format_memory_card/",
		type: 'POST'
	}).done(function(response){
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};

CloudAPI.cameraMemoryCard = function(camid){
	var d = $.Deferred();
	var camid = camid || CloudAPI.config.cameraID;
	if(!camid){
		d.reject();
		return d;
	}
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + "/memory_card/",
		type: 'GET'
	}).done(function(response){
		CloudAPI.cache.setMemoryCard(camid, response)
		d.resolve(response);
	}).fail(function(){
		CloudAPI.cache.setMemoryCard(camid, { "status" : "none" });
		d.reject();
	});
	return d;
};

CloudAPI.cameraWifi = function(){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()){
		d.reject();
		return d;
	}
	$.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.config.cameraID + "/wifi/",
		type: 'GET'
	}).done(function(response){
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};

CloudAPI.cameraFirmwares = function(){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()){
		d.reject();
		return d;
	}
	$.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.config.cameraID + "/firmwares/?limit=1000",
		type: 'GET',
		contentType: 'application/json'
	}).done(function(response){
		d.resolve(response.objects);
	}).fail(function(){
		d.reject();
	});
	return d;
};

CloudAPI.cameraFirmwaresUpgrade = function(version){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()){
		d.reject();
		return d;
	}
	console.log("[CLOUDAPI] upgrade firmware to version: " + version);
	var data = {};
	data.version = version;
	$.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.config.cameraID + "/firmwares/upgrade/",
		type: 'POST',
		data:  JSON.stringify(data),
		contentType: 'application/json'
	}).done(function(){
		d.resolve();
	}).fail(function(jqXHR, textStatus){
		console.error("[CLOUDAPI] cameraFirmwaresUpgrade, " + textStatus, jqXHR);
		d.reject();
	});
	return d;
};

CloudAPI.accountInfo = function(){
	var d = $.Deferred();
	$.ajax({
		url: CloudAPI.config.url_account,
		type: 'GET',
		cache : false
	}).done(function(r){
		CloudAPI.cache.account = r;
		d.resolve(r);
	}).fail(function(r){
		console.log("Fail " + CloudAPI.config.url_account);
		console.error(r);
		d.reject(r);
	});
	return d;
}

CloudAPI.anonToken = function(){
	var d = $.Deferred();
	var now = Date.now();
	var min = CloudAPI.config.anonToken.expireTimeUTC - 10*60*1000; // 10 min
	var max = CloudAPI.config.anonToken.expireTimeUTC - 5*60*1000; // 5 min
	if(now > min && now < max){
		$.ajaxSetup({
			crossDomain: true,
			cache: false,
			headers:{
//				'Authorization': 'SkyVR ' + CloudAPI.config.anonToken.token
			}
		});
		d.resolve(CloudAPI.config.anonToken);
	}else{
		$.ajax({
			url: CloudAPI.config.url_account + "token/anon/",
			type: 'GET'
		}).done(function(tk){
			CloudAPI.config.anonToken.token = tk.token;
			CloudAPI.config.anonToken.type = tk.type;
			CloudAPI.config.anonToken.expire = tk.expire;
			CloudAPI.config.anonToken.expireTimeUTC = Date.parse(tk.expire+'Z');
			CloudAPI.setToStorage('SkyVR_anonToken', JSON.stringify(CloudAPI.config.anonToken));
			$.ajaxSetup({
				crossDomain: true,
				cache: false,
				headers:{
//					'Authorization': 'SkyVR ' + tk.token
				}
			});
			d.resolve(CloudAPI.config.anonToken);
		}).fail(function(){
			d.reject();
		});
	}
	return d;
};

CloudAPI.accountShare = function(data){
	var params = {};
	params.camid = CloudAPI.cameraID();
	return $.ajax({
		url: CloudAPI.config.url_account + 'share/',
		type: 'POST',
		data:  JSON.stringify(data),
		contentType: 'application/json',
		cache : false
	});
};
CloudAPI.capabilities = function(cb_success, cb_error){
	cb_success = (cb_success == undefined) ? CloudAPI.handleNothing : cb_success;
	cb_error = (cb_error == undefined) ? CloudAPI.handleError : cb_error;
	$.ajax({
		url: CloudAPI.config.url_api + "capabilities/",
		type: 'GET',
		success: cb_success,
		error: cb_error
	});
};

CloudAPI.cameraInfo = function(camid){
	var d = $.Deferred();
	camid = camid || CloudAPI.cameraID();
	if(camid == undefined){
		d.reject();
		return d;
	}
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + "/",
		type: 'GET'
	}).done(function(response){

		if(CloudAPI.cache.cameras[response.id] && !CloudAPI.cache.cameras[response.id]["memory_card"]){
			console.log("cameraInfo cahce has not memory card info for camid=" + response.id);
			CloudAPI.cameraMemoryCard(response.id);
		}else if(!CloudAPI.cache.cameras[response.id]){
			console.log("cameraInfo has not in cache for camid=" + response.id);
			CloudAPI.cameraMemoryCard(response.id);
		}


		// SET to cache
		if(CloudAPI.cache.setCameraInfo(response)){
			CloudAPI.cameraP2PSettings(camid).done(function(p2p_settings){
				d.resolve(CloudAPI.cache.cameras[camid]);
			}).fail(function() {
				d.resolve(CloudAPI.cache.cameras[camid]);
			});
		}else{
			d.resolve(CloudAPI.cache.cameras[camid]);
		}
	}).fail(function(){
		d.reject();
	});
	return d;
};

CloudAPI.updateCamera = function(data){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	$.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.cameraID() + "/",
		type: 'PUT',
		data:  JSON.stringify(data),
		contentType: 'application/json'
	}).done(function(response){
		console.log("[CLOUDAPI] Updated camera in cache for " + CloudAPI.cameraID());
		data.id = CloudAPI.cameraID();
		CloudAPI.cache.updateCameraInfo(data);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};

CloudAPI.cameraMesaging = function(camid){
	var d = $.Deferred();
	camid = camid || CloudAPI.cameraID();
	if(camid == undefined){
		d.reject();
		return d;
	}
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + "/raw_messaging/",
		type: 'GET'
	}).done(function(r){
		d.resolve(r);
	}).fail(function(r){
		d.reject(r);
	});
	return d;
};

CloudAPI.updateCameraAudio = function(data){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.cameraID();
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + "/audio/",
		type: 'PUT',
		data:  JSON.stringify(data),
		contentType: 'application/json'
	}).done(function(response){
		console.log("[CLOUDAPI] Updated audio in cache for " + camid);
		CloudAPI.cache.updateCameraAudio(camid, data);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};
CloudAPI.cameraAudio = function(){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.cameraID();
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + "/audio/",
		type: 'GET'
	}).done(function(response){
		CloudAPI.cache.updateCameraAudio(camid, response);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};
CloudAPI.cameraVideo = function(){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.cameraID();
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + "/video/",
		type: 'GET'
	}).done(function(response){
		CloudAPI.cache.updateCameraVideo(camid, response);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};
CloudAPI.updateCameraVideo = function(data){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.cameraID();
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + "/video/",
		type: 'PUT',
		contentType: 'application/json',
		data:  JSON.stringify(data)
	}).done(function(response){
		CloudAPI.cache.updateCameraVideo(camid, data);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};

// TODO deprecated
CloudAPI.setCameraVideo = function(new_values, cb_success, cb_error){
	if(!CloudAPI.isCameraID()) return;
	cb_success = cb_success || CloudAPI.handleNothing;
	cb_error = cb_error || CloudAPI.handleError;
	return $.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.cameraID() + "/video/",
		type: 'PUT',
		success: cb_success,
		error: cb_error,
		contentType: 'application/json',
		data:  JSON.stringify(new_values)
	});
};
CloudAPI.cameraMediaStreams = function(){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.cameraID();
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + "/media_streams/",
		type: 'GET'
	}).done(function(response){
		CloudAPI.cache.setMediaStreams(camid, response);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};

CloudAPI.updateCameraMediaStreams = function(params, camid){
	var d = $.Deferred();
	camid = camid || CloudAPI.cameraID()
	if(!camid) {
		d.reject();
		return d;
	}
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + "/media_streams/",
		type: 'PUT',
		data:  JSON.stringify(params),
		contentType: 'application/json'
	}).done(function(r){
		d.resolve(r);
	}).fail(function(r){
		d.reject(r);
	});
	return d;
};

CloudAPI.cameraLiveUrls = function(camid){
	var d = $.Deferred();
	camid = camid || CloudAPI.cameraID();
	if(!camid){
		d.reject();
		return d;
	}

	$.ajax({
		url: CloudAPI.config.url_cameras + camid + "/live_urls/",
		type: 'GET'
	}).done(function(liveurls){
		d.resolve(liveurls);
	}).fail(function(r){
		d.reject(r);
	});
	return d;
};

CloudAPI.cameraBackwardStart = function(){
	if(!CloudAPI.isCameraID()) return;
	var data = {};
	if(!CloudAPI.config.backwardURL) return;
	data.url = CloudAPI.config.backwardURL;
	if(CloudAPI.config.tmpBackwardURL == CloudAPI.config.backwardURL)
		CloudAPI.config.tmpBackwardURLCount++;
	else{
		CloudAPI.config.tmpBackwardURLCount = 1;
		CloudAPI.config.tmpBackwardURL = CloudAPI.config.backwardURL;
	}

	if(CloudAPI.isP2PStreaming()){
		console.log("[CLOUDAPI] Send (audio streaming) backward start: " + CloudAPI.config.backwardURL);
		$.ajax({
			url: CloudAPI.config.url_cameras + CloudAPI.cameraID() + "/audio/backward/start/",
			type: 'POST',
			success: CloudAPI.handleNothing,
			data:  JSON.stringify(data),
			contentType: 'application/json'
		});
	}
};

CloudAPI.cameraBackwardStop = function(){
	if(!CloudAPI.isCameraID()) return;
	var data = {}
	if(!CloudAPI.config.backwardURL) return;
	data.url = CloudAPI.config.backwardURL;
	// CloudAPI.config.backwardURL = undefined;
	if(CloudAPI.config.tmpBackwardURL == CloudAPI.config.backwardURL){
		if(CloudAPI.config.tmpBackwardURLCount == 0)
			return;
		else
			CloudAPI.config.tmpBackwardURLCount--;
	}

	if(CloudAPI.isP2PStreaming()){
		console.log("[CLOUDAPI] Send (audio streaming) backward stop: " + CloudAPI.config.backwardURL);
		$.ajax({
			url: CloudAPI.config.url_cameras + CloudAPI.cameraID() + "/audio/backward/stop/",
			type: 'POST',
			success: CloudAPI.handleNothing,
			data:  JSON.stringify(data),
			contentType: 'application/json'
		});
	}
};
CloudAPI.cameraSchedule = function(){
	if(!CloudAPI.isCameraID()) return;
	return $.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.cameraID() + "/schedule/",
		type: 'GET',
		cache : false
	});
};
CloudAPI.updateCameraSchedule = function(data){
	return $.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.cameraID() + "/schedule/",
		type: 'PUT',
		data: JSON.stringify(data),
		cache : false,
		contentType: 'application/json'
	});
};
CloudAPI.hasAccessCameraPreview = function(camid){
	var caminfo = CloudAPI.cache.cameraInfo(camid);
	if(!caminfo) return false;
	return CloudAPI.hasAccess(caminfo, 'live') || CloudAPI.hasAccess(caminfo, 'all') || CloudAPI.hasAccess(caminfo, 'ptz');
};
CloudAPI.cameraPreview = function(cameraID, cb_success, cb_error){
	cb_success = (cb_success == undefined) ? CloudAPI.handleNothing : cb_success;
	cb_error = (cb_error == undefined) ? CloudAPI.handleError : cb_error;
	return $.ajax({
		url: CloudAPI.config.url_cameras + cameraID + "/preview/",
		type: 'GET',
		success: cb_success,
		error: cb_error
	});
};
CloudAPI.hasAccessCameraUpdatePreview = function(camid){
	var caminfo = CloudAPI.cache.cameraInfo(camid);
	if(!caminfo) return false;
	return CloudAPI.hasAccess(caminfo, 'live') || CloudAPI.hasAccess(caminfo, 'all') || CloudAPI.hasAccess(caminfo, 'ptz');
};
CloudAPI.cameraUpdatePreview = function(cameraID){
	return $.ajax({
		url: CloudAPI.config.url_cameras + cameraID + "/preview/update/",
		type: 'POST'
	});
};
CloudAPI.storageDataFirstRecord = function(startDT){
	var d = $.Deferred();
	var request_data = {
		camid: CloudAPI.cameraID(),
		limit: 1,
		offset: 0
	};
	if(startDT){
		request_data.start = startDT;
	}
	$.ajax({
		url: CloudAPI.config.url_storage + "data/",
		data: request_data,
		cache : false,
		type: 'GET'
	}).done(function(data){
		if(data.objects.length > 0){
			d.resolve(data.objects[0]);
		}else{
			d.reject();
		}
	}).fail(function(){
		d.reject();
	})
	return d;
};
CloudAPI.storageEventsFirstRecord = function(){
	var d = $.Deferred();
	var request_data = {
		camid: CloudAPI.cameraID(),
		limit: 1,
		offset: 0
	};
	$.ajax({
		url: CloudAPI.config.url_storage + "events/",
		data: request_data,
		cache : false,
		type: 'GET'
	}).done(function(data){
		if(data.objects.length > 0){
			d.resolve(data.objects[0]);
		}else{
			d.reject();
		}
	}).fail(function(){
		d.reject();
	})
	return d;
};
CloudAPI.storageThumbnailsFirstRecord = function(){
	var d = $.Deferred();
	var request_data = {
		camid: CloudAPI.cameraID(),
		limit: 1,
		offset: 0
	};
	$.ajax({
		url: CloudAPI.config.url_storage + "thumbnails/",
		data: request_data,
		cache : false,
		type: 'GET'
	}).done(function(data){
		if(data.objects.length > 0){
			d.resolve(data.objects[0]);
		}else{
			d.reject();
		}
	}).fail(function(){
		d.reject();
	})
	return d;
};

CloudAPI.getAllData = function(url, req_data){
	// TODO
}


CloudAPI.storageThumbnails = function(startDT, endDt){
	var d = $.Deferred();
	var result = {
		meta: {
			limit: 1000,
			offset: 0,
			total_count: -1
		},
		objects: []
	};
	// TODO if not selected camera
	var request_data = {
		camid: CloudAPI.cameraID(),
		limit: result.meta.limit,
		offset: result.meta.offset,
		start: startDT
	};
	if(endDt)
		request_data.end = endDt;

	function getData(req_data){
		var req_d = $.Deferred();
		$.ajax({
			url: CloudAPI.config.url_storage + "thumbnails/",
			data: req_data,
			cache : false,
			async: true,
			type: 'GET'
		}).done(function(data){
			req_d.resolve(data);
		}).fail(function(){
			req_d.reject();
		});
		return req_d;
	};

	getData(request_data).fail(function(){
		d.reject();
	}).done(function(data){
		result.meta.total_count = data.meta.total_count;
		result.meta.expire = data.meta.expire;
		$.merge(result.objects,data.objects);
		if(data.meta.offset + data.objects.length >= data.meta.total_count){
			d.resolve(result);
		}else{
			var d_all = [];
			for(var i = result.meta.limit; i < data.meta.total_count; i = i + result.meta.limit){
				request_data.offset = i;
				d_all.push(getData(request_data));
			}
			// wait all response
			$.when.apply($, d_all).done(function(){
				for (var i=0; i < arguments.length; i++) {
					$.merge(result.objects,arguments[i].objects);
				}
				d.resolve(result);
			}).fail(function(){
				d.reject();
			});
		}
	});
	return d;
};

CloudAPI.storageTimeline = function(startDT, endDt){
	var d = $.Deferred();
	var result = {
		meta: {
			limit: 1000,
			offset: 0,
			total_count: -1
		},
		objects: []
	};
	// TODO if not selected camera
	var request_data = {
		slices: 1,
		camid: CloudAPI.cameraID(),
		limit: result.meta.limit,
		offset: result.meta.offset,
		start: startDT
	};
	if(endDt)
		request_data.end = endDt;

	function getData(req_data){
		var req_d = $.Deferred();
		$.ajax({
			url: CloudAPI.config.url_storage + "timeline/" + CloudAPI.cameraID() + "/",
			data: req_data,
			cache : false,
			async: true,
			type: 'GET'
		}).done(function(data){
			req_d.resolve(data);
		}).fail(function(){
			req_d.reject();
		});
		return req_d;
	};

	getData(request_data).fail(function(){
		d.reject();
	}).done(function(data){
		result.meta.total_count = data.meta.total_count;
		result.meta.expire = data.meta.expire;
		$.merge(result.objects,data.objects);
		if(data.meta.offset + data.objects.length >= data.meta.total_count){
			d.resolve(result);
		}else{
			var d_all = [];
			for(var i = result.meta.limit; i < data.meta.total_count; i = i + result.meta.limit){
				request_data.offset = i;
				d_all.push(getData(request_data));
			}
			// wait all response
			$.when.apply($, d_all).done(function(){
				for (var i=0; i < arguments.length; i++) {
					$.merge(result.objects,arguments[i].objects);
				}
				d.resolve(result);
			}).fail(function(){
				d.reject();
			});
		}
	});
	return d;
};

CloudAPI.storageEvents = function(startDT, endDt){
	var d = $.Deferred();
	var result = {
		meta: {
			limit: 1000,
			offset: 0,
			total_count: -1
		},
		objects: []
	};
	// TODO if not selected camera
	var request_data = {
		camid: CloudAPI.cameraID(),
		limit: result.meta.limit,
		offset: result.meta.offset,
		start: startDT
	};
	if(endDt)
		request_data.end = endDt;
	function getData(req_data){
		var req_d = $.Deferred();
		$.ajax({
			url: CloudAPI.config.url_storage + "events/",
			data: req_data,
			cache : false,
			async: true,
			type: 'GET'
		}).done(function(data){
			req_d.resolve(data);
		}).fail(function(){
			req_d.reject();
		});
		return req_d;
	};

	getData(request_data).fail(function(){
		d.reject();
	}).done(function(data){
		result.meta.total_count = data.meta.total_count;
		result.meta.expire = data.meta.expire;
		$.merge(result.objects,data.objects);
		if(data.meta.offset + data.objects.length >= data.meta.total_count){
			d.resolve(result);
		}else{
			var d_all = [];
			for(var i = result.meta.limit; i < data.meta.total_count; i = i + result.meta.limit){
				request_data.offset = i;
				d_all.push(getData(request_data));
			}
			// wait all response
			$.when.apply($, d_all).done(function(){
				for (var i=0; i < arguments.length; i++) {
					$.merge(result.objects,arguments[i].objects);
				}
				d.resolve(result);
			}).fail(function(){
				d.reject();
			});
		}
	});
	return d;
};

CloudAPI.cameraMotionDetectionDemo=function(){
	var data=JSON.parse('{"caps": {"columns": 23, "max_regions": 8, "region_shape": "rect", "rows": 15, "sensitivity": "region"}}');
	return data;
};

CloudAPI.cameraMotionDetection = function(){
	return $.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.cameraID() + "/motion_detection/",
		type: 'GET'
	});
};
CloudAPI.cameraMotionDetectionRegionsDemo=function(){
	var data_regions=JSON.parse('{"meta": {"limit": 20, "next": null, "offset": 0, "previous": null, "total_count": 8}, "objects": [{"enabled": true, "id": 2686, "map": "ZmQwMDBjM2ZjMDAwN2Y4MDAwZmYwMDAxZmUwMDAzZmNlNjAw", "name": "motion1", "sensitivity": 5}, {"enabled": true, "id": 2687, "map": "ZjYwMDBmMGZmODAwMWZmMDAwM2ZlMDAwN2ZjMDAwZmY4MDAxZmZmMDAw", "name": "motion2", "sensitivity": 5}, {"enabled": true, "id": 2688, "map": "ZjQwMDBmM2ZlMDAwN2ZjMDAwZmY4MDAxZmYwMDAzZmUwMDA3ZmNmMjAw", "name": "motion3", "sensitivity": 5}, {"enabled": true, "id": 2689, "map": "ZWMwMDBjMWZlMDAwM2ZjMDAwN2Y4MDAwZmYwMDAxZmVmNzAw", "name": "motion4", "sensitivity": 5}, {"enabled": true, "id": 2690, "map": "ZTQwMDA2ZTAwMDAxYzAwMDAzODBmOTAw", "name": "motion5", "sensitivity": 5}, {"enabled": true, "id": 2691, "map": "MmIwMWZmMDAwM2ZlMDAwN2ZjMDAwZmY4MDAxZmYwMDAzZmUwMDA3ZmMwMDBmZjgwMDFmZjAwMDNmZTAwMDdmYzAwMGZmODAwMWZmMDAwM2ZlMDAwN2ZjMDAw", "name": "motion6", "sensitivity": 5}, {"enabled": true, "id": 2692, "map": "MTJmZjgwMDFmZjAwMDNmZTAwMDdmYzAwMGZmODAwMWZmMDAwM2ZlMGU4MDA=", "name": "motion7", "sensitivity": 5}, {"enabled": false, "id": 2693, "map": "", "name": "motion8", "sensitivity": 5}]}');
	return data_regions;
};
CloudAPI.cameraMotionDetectionRegions = function(){
	return $.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.cameraID() + "/motion_detection/regions/",
		type: 'GET'
	});
};

CloudAPI.cameraP2PSettings = function(cameraID, cb_success, cb_error, cb_always){
	cameraID = cameraID || CloudAPI.cameraID();
	cb_success = (cb_success == undefined) ? CloudAPI.handleNothing : cb_success;
	cb_error = (cb_error == undefined) ? CloudAPI.handleError : cb_error;
	cb_always = (cb_always == undefined) ? CloudAPI.handleNothing : cb_always;
	return $.ajax({
		url: CloudAPI.config.url_cameras + cameraID + "/p2p_settings/",
		type: 'GET',
		success: function(response){
			CloudAPI.cache.setP2PSettings(cameraID, response);
			cb_success(response);
		},
		error: cb_error,
		complete: cb_always
	});
};
CloudAPI.cameraSetP2PSettings = function(data){
	return $.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.cameraID() + "/p2p_settings/",
		type: 'PUT',
		data: JSON.stringify(data),
		cache : false,
		contentType: 'application/json'
	});
};
CloudAPI.cameraLog = function(){
	return $.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.cameraID() + "/log/",
		type: 'GET'
	});
};
CloudAPI.cameraLogDownload = function(url){
	var d = $.Deferred();
	var xmlhttp = null;
	if (window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}else{// code for IE6, IE5
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange=function(){
		if (xmlhttp.readyState == XMLHttpRequest.DONE){
			if(xmlhttp.status==200)
				d.resolve(xmlhttp.responseText);
			else
				d.reject();
		}
	}
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
	return d.promise();
};
CloudAPI.cameraLogUpdate = function(){
	return $.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.cameraID() + "/log/update/",
		type: 'POST'
	});
};
CloudAPI.cameraManagersList = function(cb_success, cb_error){
	cb_success = cb_success || CloudAPI.handleNothing
	cb_error = cb_error || CloudAPI.handleError;
	$.ajax({
		url: CloudAPI.config.url_cmngrs,
		type: 'GET',
		success: cb_success,
		error: cb_error
	});
}

CloudAPI.cameraManagerReset = function(cmnr_id){
	var params = {};
	return $.ajax({
		url: CloudAPI.config.url_cmngrs + cmnr_id + '/reset/',
		type: 'POST'
	});
}

CloudAPI.camerasList = function(params){
	params = params || {};
	var d = $.Deferred();
	var result = {
		meta: {
			limit: 20,
			offset: 0,
			total_count: -1
		},
		objects: []
	};
	var request_data = {
		limit: result.meta.limit,
		offset: result.meta.offset
	};
	for(var t in params){
		request_data[t] = params[t];
	}
	function getData(req_data){
		var req_d = $.Deferred();
		$.ajax({
			url: CloudAPI.config.url_cameras,
			data: req_data,
			cache : false,
			type: 'GET'
		}).done(function(data){
			req_d.resolve(data);
		}).fail(function(){
			req_d.reject();
		});
		return req_d;
	};

	function p2pUpdateAndResolve(result){
		var count = 0;
		var len = result.objects.length;
		if(count == len) d.resolve(result);
		for(var i = 0; i < len; i++){
			cam = result.objects[i];
			// SET to cache
			if(CloudAPI.cache.setCameraInfo(cam)){
				console.log("update p2p_settings: ", cam.id);
				CloudAPI.cameraP2PSettings(cam.id).done(function(p2p_settings){
					// update memory cardinfo
					CloudAPI.cameraMemoryCard(cam.id).done(function(){
						count = count + 1;
						if(count == len) d.resolve(result);
					}).fail(function(){
						count = count + 1;
						if(count == len) d.resolve(result);
					});
					// count = count + 1;
					// if(count == len) d.resolve(result);
				}).fail(function(){
					count = count + 1;
					if(count == len) d.resolve(result);
				});
			}else{
				// console.log("p2p_settings updated: ", i, len);
				count = count + 1;
				if(count == len) d.resolve(result);
			}
		}
	}
	getData(request_data).fail(function(){
		d.reject();
	}).done(function(data){
		result.meta.total_count = data.meta.total_count;
		$.merge(result.objects, data.objects);
		if(data.meta.offset + data.objects.length >= data.meta.total_count){
			p2pUpdateAndResolve(result)
		}else{
			var d_all = [];
			for(var i = result.meta.limit; i < data.meta.total_count; i = i + result.meta.limit){
				request_data.offset = i;
				d_all.push(getData(request_data));
			}
			// wait all response
			$.when.apply($, d_all).done(function(){
				for (var i=0; i < arguments.length; i++) {
					$.merge(result.objects,arguments[i].objects);
				}
				p2pUpdateAndResolve(result)
			}).fail(function(){
				d.reject();
			});
		}
	});
	return d;
}
CloudAPI.camerasListByCriterions = function(criterions, cb_success, cb_error){
	cb_success = cb_success || CloudAPI.handleNothing
	cb_error = cb_error || CloudAPI.handleError;

	$.ajax({
		url: CloudAPI.config.url_cameras,
		data: criterions,
		type: 'GET',
		success: cb_success,
		error: cb_error
	});
}

CloudAPI.cameraManagerInfo = function(cameraManagerID, cb_success, cb_error){
	cb_success = cb_success || CloudAPI.handleNothing
	cb_error = cb_error || CloudAPI.handleError;
	$.ajax({
		url: CloudAPI.config.url_cmngrs + cameraManagerID + "/",
		type: 'GET',
		success: cb_success,
		error: cb_error
	});
}
CloudAPI.cameraManagerSetTimezone = function(cameraManagerID, newTimeZone, cb_success, cb_error){
	cb_success = cb_success || CloudAPI.handleNothing
	cb_error = cb_error || CloudAPI.handleError;
	var obj = {};
	obj.timezone = newTimeZone;
	$.ajax({
		url: CloudAPI.config.url_cmngrs + cameraManagerID + "/",
		type: 'PUT',
		success: cb_success,
		error: cb_error,
		data:  JSON.stringify(obj),
		contentType: 'application/json'
	});
}

CloudAPI.storageClipList = function(){
	var d = $.Deferred();
	var result = {
		meta: {
			limit: 100,
			offset: 0,
			total_count: -1
		},
		objects: []
	};
	var request_data = {
		limit: result.meta.limit,
		offset: result.meta.offset,
		camid: CloudAPI.cameraID(),
		usecamtz: ''
	};

	function getData(req_data){
		var req_d = $.Deferred();
		$.ajax({
			url: CloudAPI.config.url_clips,
			data: req_data,
			cache : false,
			type: 'GET'
		}).done(function(data){
			req_d.resolve(data);
		}).fail(function(){
			req_d.reject();
		});
		return req_d;
	};

	getData(request_data).fail(function(){
		d.reject();
	}).done(function(data){
		result.meta.total_count = data.meta.total_count;
		result.meta.expire = data.meta.expire;
		$.merge(result.objects,data.objects);
		if(data.meta.offset + data.objects.length >= data.meta.total_count){
			d.resolve(result);
		}else{
			var d_all = [];
			for(var i = result.meta.limit; i < data.meta.total_count; i = i + result.meta.limit){
				request_data.offset = i;
				d_all.push(getData(request_data));
			}
			// wait all response
			$.when.apply($, d_all).done(function(){
				for (var i=0; i < arguments.length; i++) {
					$.merge(result.objects,arguments[i].objects);
				}
				d.resolve(result);
			}).fail(function(){
				d.reject();
			});
		}
	});
	return d;
};

// deprecated
CloudAPI.storageClipListAnon = function(token){
	var d = $.Deferred();
	CloudAPI.anonToken().done(function(tk){
		var result = {
			meta: {
				limit: 100,
				offset: 0,
				total_count: -1
			},
			objects: []
		};
		var request_data = {
			limit: result.meta.limit,
			offset: result.meta.offset,
			usecamtz: ''
		};
		if(token) request_data.token = token;
		function getData(req_data){
			var req_d = $.Deferred();
			$.ajax({
				url: CloudAPI.config.url_clips,
				data: req_data,
				cache : false,
				type: 'GET',
				headers: {
//					'Authorization':'SkyVR ' + tk.token
				}
			}).done(function(data){
				req_d.resolve(data);
			}).fail(function(){
				req_d.reject();
			});
			return req_d;
		};

		getData(request_data).fail(function(){
			d.reject();
		}).done(function(data){
			result.meta.total_count = data.meta.total_count;
			result.meta.expire = data.meta.expire;
			$.merge(result.objects,data.objects);
			if(data.meta.offset + data.objects.length >= data.meta.total_count){
				d.resolve(result);
			}else{
				var d_all = [];
				for(var i = result.meta.limit; i < data.meta.total_count; i = i + result.meta.limit){
					request_data.offset = i;
					d_all.push(getData(request_data));
				}
				// wait all response
				$.when.apply($, d_all).done(function(){
					for (var i=0; i < arguments.length; i++) {
						$.merge(result.objects,arguments[i].objects);
					}
					d.resolve(result);
				}).fail(function(){
					d.reject();
				});
			}
		});
	}).fail(function(){
		d.reject();
	});
	return d;
};

CloudAPI.storageClipCreate = function(title, group, start, end, delete_at){
	var data = {};
	data.camid = CloudAPI.cameraID();
	data.title = title;
	data.group = group;
	data.start = start;
	data.end = end;
	data.delete_at = delete_at;
	return $.ajax({
		url: CloudAPI.config.url_clips,
		type: 'POST',
		data: JSON.stringify(data),
		cache : false,
		contentType: 'application/json'
	});
}
CloudAPI.storageClip = function(clipid){
	return $.ajax({
		url: CloudAPI.config.url_clips + clipid + "/",
		type: 'GET',
		cache : false
	});
};

CloudAPI.serverTime = function(){
	return $.ajax({
		url: CloudAPI.config.url_server + "time/",
		type: 'GET',
		cache : false
	});
};

CloudAPI.storageClipAnon = function(clipid, token){
	var d = $.Deferred();
	var params = {};
	if(token) params.token = token;
	CloudAPI.anonToken().done(function(tk){
		$.ajax({
			url: CloudAPI.config.url_clips + clipid + "/",
			type: 'GET',
			data: params,
			cache : false,
			headers: {
//				'Authorization':'SkyVR ' + tk.token
			}
		}).done(function(data){
			d.resolve(data);
		}).fail(function(){
			d.reject();
		});
	}).fail(function(){
		d.reject();
	});
	return d;
};

CloudAPI.storageClipDelete = function(clipid){
	return $.ajax({
		url: CloudAPI.config.url_clips + clipid + "/",
		type: 'DELETE',
		cache : false
	});
};

CloudAPI.storageClipUpdate = function(clipid, data){
	return $.ajax({
		url: CloudAPI.config.url_clips + clipid + "/",
		data: JSON.stringify(data),
		type: 'PUT',
		cache : false,
		contentType: 'application/json'
	});
};

CloudAPI.cameraSettings = function(){
	var d = $.Deferred();
	var d_all = [];
	function anyway(d){
		var d2 = $.Deferred();
		d.always(function(){ d2.resolve();});
		return d2;
	}

	function mediaStreams(){
		var d2 = $.Deferred();
		CloudAPI.cameraMediaStreams().done(function(media_streams){
			console.log("MediaStreams: ", media_streams);
			var ms_arr = media_streams['mstreams_supported'];
			var current_ms = media_streams['live_ms_id'];
			if(ms_arr.length > 0 && current_ms != ''){
				var vs_id = '';
				for(var i = 0; i < ms_arr.length; i++){
					if(ms_arr[i]['id'] == current_ms){
						vs_id = ms_arr[i]['vs_id'];
						break;
					}
				}
				if(vs_id != ''){
					CloudAPI.cameraVideoStream(vs_id).done(function(){
						d2.resolve();
					}).fail(function(){
						d2.reject();
					});
				}else{
					d2.reject();
				}
			}else{
				d2.resolve();
			}
		}).fail(function(){
			d2.reject();
		});
		return d2;
	}

	d_all.push(anyway(mediaStreams()));

	if(!CloudAPI.cache.cameraInfo().url){
		d_all.push(anyway(CloudAPI.cameraVideo()));
		d_all.push(anyway(CloudAPI.cameraAudio()));
		d_all.push(anyway(CloudAPI.cameraLimits()));
		d_all.push(anyway(CloudAPI.cameraEventProcessingEventsMotion()));
		d_all.push(anyway(CloudAPI.cameraEventProcessingEventsSound()));
		d_all.push(anyway(CloudAPI.cameraMemoryCard()));
		// d_all.push(anyway(CloudAPI.cameraWifi()));
	}

	$.when.apply($, d_all).done(function(){
		d.resolve(CloudAPI.cache.cameraInfo());
	}).fail(function(){
		d.reject();
	});
	return d;
}

CloudAPI.createCamsess = function(data){
	data = data || {};
	return $.ajax({
		url: CloudAPI.config.url_camsess,
		data: JSON.stringify(data),
		type: 'POST',
		contentType: 'application/json',
		cache : false,
	});
}

CloudAPI.updateCamsess = function(id, data){
	data = data || {};
	return $.ajax({
		url: CloudAPI.config.url_camsess + id + '/',
		data: JSON.stringify(data),
		type: 'PUT',
		contentType: 'application/json',
		cache : false,
	});
}

CloudAPI.cameraCreate = function(data){
	var d = $.Deferred();
	data = data || {};
	$.ajax({
		url: CloudAPI.config.url_cameras,
		type: 'POST',
		data: JSON.stringify(data),
		cache : false,
		contentType: 'application/json'
	}).done(function(r){
		d.resolve(r);
	}).fail(function(r){
		d.reject(r);
	});
	return d;
}

CloudAPI.cameraDelete = function(camid){
	var d = $.Deferred();
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + '/',
		type: 'DELETE',
		cache : false
	}).done(function(r){
		d.resolve(r);
	}).fail(function(r){
		d.reject(r);
	});
	return d;
}

CloudAPI.cameraUpdate = function(camid, data){
	var d = $.Deferred();
	data = data || {};
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + '/',
		type: 'PUT',
		data: JSON.stringify(data),
		cache : false,
		contentType: 'application/json'
	}).done(function(r){
		d.resolve(r);
	}).fail(function(r){
		d.reject(r);
	});
	return d;
}

CloudAPI.adminCameras = function(params){
	params = params || {};
	return $.ajax({
		url: CloudAPI.config.url_admin_cameras,
		data: params,
		type: 'GET',
		cache : false,
	});
}

CloudAPI.adminCameraInfo = function(camid){
	return $.ajax({
		url: CloudAPI.config.url_admin_cameras + camid + '/',
		type: 'GET',
		cache : false
	});
}

CloudAPI.updateAdminCamera = function(camid, params){
	params = params || {};
	return $.ajax({
		url: CloudAPI.config.url_admin_cameras + camid + '/',
		type: 'PUT',
		data: JSON.stringify(params),
		contentType: 'application/json',
		cache : false
	});
}

CloudAPI.store = {};
CloudAPI.store.volume = function(v){ if(v) CloudAPI.setToStorage('volume', v); return CloudAPI.getFromStorage('volume'); }
CloudAPI.store.prev_volume = function(v){ if(v) CloudAPI.setToStorage('prev_volume', v); return CloudAPI.getFromStorage('prev_volume'); }
CloudAPI.store.zoom = function(v){ if(v != undefined) CloudAPI.setToStorage('zoom', v); return CloudAPI.getFromStorage('zoom'); }
CloudAPI.store.zoom_left = function(v){ if(v != undefined) CloudAPI.setToStorage('zoom_left', v); return CloudAPI.getFromStorage('zoom_left'); }
CloudAPI.store.zoom_top = function(v){ if(v != undefined) CloudAPI.setToStorage('zoom_top', v); return CloudAPI.getFromStorage('zoom_top'); }
CloudAPI.store.user_profile = function(v){ if(v != undefined) CloudAPI.setToStorage('user_profile', v); return CloudAPI.getFromStorage('user_profile'); }
CloudAPI.store.svcp_host = function(v){ if(v != undefined) CloudAPI.setToStorage('svcp_host', v); return CloudAPI.getFromStorage('svcp_host'); }

CloudAPI.storageTemp = {};
CloudAPI.storageMode = 'local';

CloudAPI.detectStorageMode = function(){
	try{
		localStorage.setItem('detectStorageMode','yes');
	}catch(e){
		CloudAPI.storageMode = 'temp';
	}
}
CloudAPI.detectStorageMode();

CloudAPI.setToStorage = function(k,v){
	if(CloudAPI.storageMode == 'local'){
		localStorage.setItem(k,v);
	}else{
		CloudAPI.storageTemp[k] = v;
	}
}

CloudAPI.getFromStorage = function(k){
	if(CloudAPI.storageMode == 'local'){
		return localStorage.getItem(k);
	}else{
		return CloudAPI.storageTemp[k];
	}
}

CloudAPI.removeFromStorage = function(k){
	if(CloudAPI.storageMode == 'local'){
		localStorage.removeItem(k);
	}else{
		CloudAPI.storageTemp[k] = undefined;
	}
}

CloudAPI.loadApiTokenFromHref = function(){
	var prms = window.location.href.split("#");
	var token = prms[prms.length - 1];
	token = token.split("&");


	//for(var i in token){
	for(var i = 0; i < token.length; i++){
		var name = token[i].split("=")[0];
		var param = decodeURIComponent(token[i].split("=")[1]);
		if(name == "token"){
			CloudAPI.config.apiToken = CloudAPI.config.apiToken || {};
			CloudAPI.config.apiToken.token = param;
			CloudAPI.config.apiToken.type = "api";
		}else if(name == "expire"){
			CloudAPI.config.apiToken = CloudAPI.config.apiToken || {};
			CloudAPI.config.apiToken.expire = param;
			CloudAPI.config.apiToken.expireTimeUTC = Date.parse(param + "Z");
		}
	}
	console.log("Href token: ", CloudAPI.config.apiToken);
	CloudAPI.setToStorage('SkyVR_apiToken', JSON.stringify(CloudAPI.config.apiToken));
}

CloudAPI.cleanupApiToken = function(){
	CloudAPI.removeFromStorage('SkyVR_apiToken');
	CloudAPI.config.apiToken = null;
	$.ajaxSetup({
		crossDomain: true,
		cache: false,
		beforeSend: function(xhr,settings) {
			xhr.setRequestHeader('Authorization', '');
		}
	});
}

// set url

if(CloudHelpers.containsPageParam("svcp_host")){
	CloudAPI.setURL(CloudAPI.pageParams["svcp_host"]);
}else if(CloudAPI.getFromStorage('CloudAPI_svcp_host')){
	CloudAPI.setURL(CloudAPI.getFromStorage('CloudAPI_svcp_host'));
}else{
	CloudAPI.setURL((window.location.protocol=='file:'?'http':window.location.protocol) + "//" + window.location.host.toString() + "/");
}

/* events */
CloudAPI.events = {};
CloudAPI.events.listeners = {};
CloudAPI.events.names = ['CAMERA_INFO_CHANGED']; // todo define events name
CloudAPI.events.on = function(eventname, eventid, func){
	if(CloudAPI.events.names.indexOf(eventname) == -1){
		console.error("[CLOUDAPI] Could not find event with name " + eventname);
		return;
	}
	if(!CloudAPI.events.listeners[eventname]){
		CloudAPI.events.listeners[eventname] = {};
	}
	CloudAPI.events.listeners[eventname][eventid] = func;
}

CloudAPI.events.off = function(eventname, eventid){
	if(CloudAPI.events.names.indexOf(eventname) == -1){
		console.error("[CLOUDAPI] Could not find event with name " + eventname);
		return;
	}
	if(!CloudAPI.events.listeners[eventname]){
		console.error("[CLOUDAPI] Could not find event with name " + eventname);
		return;
	}
	if(!CloudAPI.events.listeners[eventname][eventid]){
		console.error("[CLOUDAPI] Could not find event with name " + eventname + " by id " + eventid);
		return;
	}
	delete CloudAPI.events.listeners[eventname][eventid];
}

CloudAPI.events.trigger = function(eventname, data){ // app, event - temporary variables
	if(CloudAPI.events.names.indexOf(eventname) == -1){
		console.error("[CLOUDAPI] Could not find event with name " + eventname);
		return;
	}
	if(CloudAPI.events.listeners[eventname]){
		var elist = CloudAPI.events.listeners[eventname];
		setTimeout(function(){
			for(var id in elist){
				try{elist[id](data);}catch(e){console.error("[CLOUDAPI] error on execute callback event (" + id + ")", e)};
			}
		},1);
	}
}

window.CloudReturnCode = {};

CloudReturnCode.OK = {
	name: 'OK',
	code: 0,
	text: 'Success'
};

CloudReturnCode.OK_COMPLETIONPENDING = {
	name: 'OK_COMPLETIONPENDING',
	code: 1,
	text: 'Operation Pending'
};

CloudReturnCode.ERROR_NOT_CONFIGURED = {
	name: 'ERROR_NOT_CONFIGURED',
	code: -2,
	text: 'Object not configured'
};

CloudReturnCode.ERROR_NOT_IMPLEMENTED = {
	name: 'ERROR_NOT_IMPLEMENTED',
	code: -1,
	text: 'Function not implemented'
};

CloudReturnCode.ERROR_NO_MEMORY = {
	name: 'ERROR_NO_MEMORY',
	code: -12,
	text: 'Out of memory'
};

CloudReturnCode.ERROR_ACCESS_DENIED = {
	name: 'ERROR_ACCESS_DENIED',
	code: -13,
	text: 'Access denied'
};

CloudReturnCode.ERROR_BADARGUMENT = {
	name: 'ERROR_BADARGUMENT',
	code: -22,
	text: 'Invalid argument'
};

CloudReturnCode.ERROR_STREAM_UNREACHABLE = {
	name: 'ERROR_STREAM_UNREACHABLE',
	code: -5049,
	text: 'The stream specified is not reachable. Please check source URL or restart the stream'
};

CloudReturnCode.ERROR_EXPECTED_FILTER = {
	name: 'ERROR_EXPECTED_FILTER',
	code: -5050,
	text: 'Expected filter'
};

CloudReturnCode.ERROR_NO_CLOUD_CONNECTION = {
	name: 'ERROR_NO_CLOUD_CONNECTION',
	code: -5051,
	text: 'No cloud connection (has not conenction object or token is invalid)'
};

CloudReturnCode.ERROR_WRONG_RESPONSE = {
	name: 'ERROR_WRONG_RESPONSE',
	code: -5052,
	text: 'Response from cloud expected in json, but got something else'
}

CloudReturnCode.ERROR_SOURCE_NOT_CONFIGURED = {
	name: 'ERROR_SOURCE_NOT_CONFIGURED',
	code: -5053,
	text: 'Source not configured'
}

CloudReturnCode.ERROR_INVALID_SOURCE = {
	name: 'ERROR_INVALID_SOURCE',
	code: -5054,
	text: 'Invalid source'
}

CloudReturnCode.ERROR_RECORDS_NOT_FOUND = {
	name: 'ERROR_RECORDS_NOT_FOUND',
	code: -5055,
	text: 'Records are not found'
}

CloudReturnCode.ERROR_STREAM_UNREACHABLE_HLS = {
	name: 'ERROR_STREAM_UNREACHABLE_HLS',
	code: -5056,
	text: 'The stream specified is not reachable (HLS).'
};

CloudReturnCode.ERROR_NOT_FOUND_HLS_PLUGIN = {
	name: 'ERROR_NOT_FOUND_HLS_PLUGIN',
	code: -5057,
	text: 'HLS plugin not found.'
};

CloudReturnCode.ERROR_COULD_NOT_DECODE_STREAM_OR_COULD_NOT_SET_COOKIE_HLS = {
	name: 'ERROR_COULD_NOT_DECODE_STREAM_OR_COULD_NOT_SET_COOKIE_HLS',
	code: -5058,
	text: 'Could not decode stream or could not set cookie for streaming server (please allow cookie).'
};

CloudReturnCode.ERROR_WEBRTC_SERVER_ERROR = {
	name: 'ERROR_WEBRTC_SERVER_ERROR',
	code: -5059,
	text: 'Unable to connect to server. Please check that you added an exception for the certificate, and that the port is available.'
};

CloudReturnCode.ERROR_CAMERA_OFFLINE = {
	name: 'ERROR_CAMERA_OFFLINE',
	code: -5060,
	text: 'Video source is offline'
};

CloudReturnCode.PLAYER_NOT_SUPPORTED = {
	name: 'PLAYER_NOT_SUPPORTED',
	code: -5061,
	text: 'Player not supported'
};

CloudReturnCode.NOT_SUPPORTED_FORMAT = {
	name: 'NOT_SUPPORTED_FORMAT',
	code: -5062,
	text: 'Not supported format'
}

CloudReturnCode.ERROR_HLS_ENDED = {
	name: 'ERROR_HLS_ENDED',
	code: -5063,
	text: 'The stream is ended (HLS).'
};

CloudReturnCode.ERROR_INVALID_ACCESS_TOKEN_FORMAT = {
	name: 'ERROR_INVALID_ACCESS_TOKEN_FORMAT',
	code: -5064,
	text: 'Invalid access token format'
}

CloudReturnCode.ERROR_CHANNEL_NOT_FOUND = {
	name: 'ERROR_CHANNEL_NOT_FOUND',
	code: -5065,
	text: 'Channel is not found'
}

CloudReturnCode.ERROR_NETWORK_ERROR = {
	name: 'ERROR_NETWORK_ERROR',
	code: -5066,
	text: 'Network error'
}

CloudReturnCode.ERROR_ACCESS_TOKEN_REQUIRED = {
	name: 'ERROR_ACCESS_TOKEN_REQUIRED',
	code: -5067,
	text: 'Access token is required'
}

CloudReturnCode.ERROR_ACCESS_TOKEN_EXPIRED = {
	name: 'ERROR_ACCESS_TOKEN_EXPIRED',
	code: -5068,
	text: 'Access token is expired'
};

CloudReturnCode.ERROR_NOT_AUTHORIZED = {
	name: 'ERROR_NOT_AUTHORIZED',
	code: -5401,
	text: 'Failed authorization on cloud (wrong credentials)'
}

CloudReturnCode.ERROR_NOT_FOUND = {
	name: 'ERROR_NOT_FOUND',
	code: -5404,
	text: 'Not found object'
}

window.CloudCameraPrivacyFilter = {};

CloudCameraPrivacyFilter.PS_OWNER_NOT_PUBLIC = {
	name: 'PS_OWNER_NOT_PUBLIC',
	code: 0,
	text: 'My cameras which not public'
};

CloudCameraPrivacyFilter.PS_OWNER = {
	name: 'PS_OWNER',
	code: 1,
	text: 'Only my cameras'
};

CloudCameraPrivacyFilter.PS_PUBLIC_NOT_OWNERS = {
	name: 'PS_PUBLIC_NOT_OWNERS',
	code: 2,
	text: 'Public cameras exclude my'
};

CloudCameraPrivacyFilter.PS_PUBLIC = {
	name: 'PS_PUBLIC',
	code: 3,
	text: 'All public cameras'
};

CloudCameraPrivacyFilter.PS_OWNERS_PUBLIC = {
	name: 'PS_OWNERS_PUBLIC',
	code: 4,
	text: 'My public cameras'
};

CloudCameraPrivacyFilter.PS_ALL = {
	name: 'PS_ALL',
	code: 5,
	text: 'All cameras'
};

window.CloudCameraRecordingMode = {};

CloudCameraRecordingMode.CONTINUES = {
	name: 'CONTINUES',
	code: 0
};

CloudCameraRecordingMode.BY_EVENT = {
	name: 'BY_EVENT',
	code: 1
};

CloudCameraRecordingMode.NO_RECORDING = {
	name: 'NO_RECORDING',
	code: 2
};

CloudCameraRecordingMode.SERVER_BY_EVENT = {
	name: 'SERVER_BY_EVENT',
	code: 3
};

window.CloudCameraStatus = {};

CloudCameraStatus.ACTIVE = {
	name: 'ACTIVE',
	code: 0
};

CloudCameraStatus.UNAUTHORIZED = {
	name: 'UNAUTHORIZED',
	code: 1
};

CloudCameraStatus.INACTIVE = {
	name: 'INACTIVE',
	code: 2
};

CloudCameraStatus.INACTIVE_BY_SCHEDULER = {
	name: 'INACTIVE_BY_SCHEDULER',
	code: 3
};

CloudCameraStatus.OFFLINE = {
	name: 'OFFLINE',
	code: 4
};

// construct
window.CloudTrialConnection = function(){
	var self = this;
	self.mAPI = null;
	self.AccountProviderUrl = (window.location.protocol=='file:'?'http:':window.location.protocol) + "//cnvrclient2.videoexpertsgroup.com/";

	self.setAccpUrl = function(new_accp_url){
		self.AccountProviderUrl = new_accp_url;
	};

	self.setSvcpUrlBase = function(new_svcp_url){
		self.ServiceProviderUrl = new_svcp_url;
	};

	self.setApiConfig = function(api_host, api_port, api_secure_port){
		self.ApiHost = api_host;
		self.ApiPort = api_port;
		self.ApiSecurePort = api_secure_port;
	};

	self.setCamConfig = function(cam_host, cam_port, cam_secure_port){
		self.CamHost = cam_host;
		self.CamPort = cam_port;
		self.CamSecurePort = cam_secure_port;
	};

	// Open without redirects
	self.open = function(license_key){
		var p = CloudHelpers.promise();
		self.TrialKey = license_key;
		self.RequestData = {
			username: self.TrialKey,
			password: self.TrialKey,
			cloud_token:  true
		};
		self._asyncLogin(p);
		return p;
	}

	self.isOpened = function(){
		return self.mAPI != null;
	}
	self.close = function(){
		self.mAPI = null;
	}

	self._getAPI = function(){
		return self.mAPI;
	}

	self.getUserInfo = function(){
		var p = CloudHelpers.promise();
		if(!self.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}
		self.mAPI.getAccountInfo().done(function(accInfo){
			self.mAPI.getAccountCapabilities().done(function(caps){
				var info = new CloudUserInfo(self, accInfo, caps);
				p.resolve(info);
			}).fail(function(err){
				CloudHelpers.handleError(err, p);
			});
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		})
		return p;
	}

	self.getServerTimeDiff = function(){
		return self.mAPI.diffServerTime;
	}

	self._asyncLogin = function(p){
		CloudHelpers.request({
			url: self.AccountProviderUrl + "api/v1/account/login/",
			type: 'POST',
			data: JSON.stringify(self.RequestData),
			contentType: 'application/json'
		}).done(function(r){
			if(r.cloud_token && r.cloud_token.token){
				var scvp_host = CloudHelpers.parseUri(r.svcp_auth_app_url).host;
				scvp_host = (window.location.protocol=='file:'?'http:':window.location.protocol) + "//" + scvp_host + "/";
				self.mAPI = new CloudAPI(r.cloud_token, self.ServiceProviderUrl || scvp_host);
				self.mAPI.getServerTime().done(function(){
					p.resolve();
				}).fail(function(err){
					p.reject(err);
				})
			}else{
				console.warn("Try again after 1 sec");
				setTimeout(function(){
					self._asyncLogin(p);
				},1000);
			}
		}).fail(function(err){
			console.error(err);
			p.reject(err);
		});
	}
}

// construct
window.CloudTokenConnection = function(options){
	var self = this;
	self.mAPI = null;
	self.options = options;
	// self.AccountProviderUrl = window.location.protocol + "//cnvrclient2.videoexpertsgroup.com/";
	self.ServiceProviderUrl = (window.location.protocol=='file:'?'http:':window.location.protocol) + "//" + (self.options.cloud_domain ? self.options.cloud_domain : "web.skyvr.videoexpertsgroup.com")+"/";

	// Open without redirects
	self.open = function(token, expire, svcp_host){
		var cloud_token = {
			token: token,
			expire: expire,
			type: 'api'
		};
		if(svcp_host){
			self.ServiceProviderUrl = svcp_host;
		}
		var p = CloudHelpers.promise();
		self.mAPI = new CloudAPI(cloud_token, self.ServiceProviderUrl);
		self.mAPI.getServerTime().done(function(){
			p.resolve();
		}).fail(function(err){
			p.reject(err);
		});
		return p;
	}

	self.isOpened = function(){
		return self.mAPI != null;
	}
	self.close = function(){
		self.mAPI = null;
	}

	self._getAPI = function(){
		return self.mAPI;
	}

	self.getUserInfo = function(){
		var p = CloudHelpers.promise();
		if(!self.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}
		self.mAPI.getAccountInfo().done(function(accInfo){
			self.mAPI.getAccountCapabilities().done(function(caps){
				console.warn("caps:", caps)
				var info = new CloudUserInfo(self, accInfo, caps);
				p.resolve(info);
			}).fail(function(err){
				CloudHelpers.handleError(err, p);
			});
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		})
		return p;
	}

	self.getServerTimeDiff = function(){
		return self.mAPI.diffServerTime;
	}
}

// construct
window.CloudShareConnection = function(options){
	var self = this;
	self.options = options;
	self.mAPI = null;
	self.ServiceProviderUrl = (window.location.protocol=='file:'?'http:':window.location.protocol) + "//" + (self.options.cloud_domain ? self.options.cloud_domain : "web.skyvr.videoexpertsgroup.com") + "/";

	// Open without redirects
	self.open = function(token){
		var cloud_token = {
			token: token,
			expire: "",
			type: "share"
		};
		var p = CloudHelpers.promise();
		self.mAPI = new CloudAPI(cloud_token, self.ServiceProviderUrl);

		self.mAPI.getServerTime().done(function(){
			p.resolve();
		}).fail(function(err){
			p.reject(err);
		});
		return p;
	}
	self.updateToken = function (token) {
		if (self.mAPI) {
			self.mAPI.token = token;
		}
	}
	self.isOpened = function(){
		return self.mAPI != null;
	}
	self.close = function(){
		self.mAPI = null;
	}

	self._getAPI = function(){
		return self.mAPI;
	}

	self.getUserInfo = function(){
		var p = CloudHelpers.promise();
		if(!self.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}
		self.mAPI.getAccountInfo().done(function(accInfo){
			self.mAPI.getAccountCapabilities().done(function(caps){
				console.warn("caps:", caps)
				var info = new CloudUserInfo(self, accInfo, caps);
				p.resolve(info);
			}).fail(function(err){
				CloudHelpers.handleError(err, p);
			});
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		})
		return p;
	}

	self.getServerTimeDiff = function(){
		return self.mAPI.diffServerTime;
	}
}

// construct
window.CloudUserConnection = function(){
	var self = this;
	self.mAPI = null;
	self.AccountProviderUrl = (window.location.protocol=='file:'?'http:':window.location.protocol) + "//cnvrclient2.videoexpertsgroup.com/";
	var mUsername, mPassword;
	// Open without redirects
	self.open = function(username,password){
		mUsername = username;
		mPassword = password;
		var p = CloudHelpers.promise();
		self.RequestData = {
			username: mUsername,
			password: mPassword,
			cloud_token:  true
		};
		self._asyncLogin(p);
		return p;
	}

	self.isOpened = function(){
		return self.mAPI != null;
	}
	self.close = function(){
		self.mAPI = null;
	}

	self._getAPI = function(){
		return self.mAPI;
	}

	self.getUserInfo = function(){
		var p = CloudHelpers.promise();
		if(!self.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}
		self.mAPI.getAccountInfo().done(function(accInfo){
			// console.warn("info:", accInfo)
			self.mAPI.getAccountCapabilities().done(function(caps){
				console.warn("caps:", caps)
				var info = new CloudUserInfo(self, accInfo, caps);
				p.resolve(info);
			}).fail(function(err){
				if(err.status == 500){
					var info = new CloudUserInfo(self, accInfo);
					p.resolve(info);
				}else{
					CloudHelpers.handleError(err, p);
				}
			});
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		})
		return p;
	}

	self.getServerTimeDiff = function(){
		return self.mAPI.diffServerTime;
	}

	self._asyncLogin = function(p){
		CloudHelpers.request({
			url: self.AccountProviderUrl + "api/v1/account/login/",
			type: 'POST',
			data: JSON.stringify(self.RequestData),
			contentType: 'application/json'
		}).done(function(r){
			if(r.cloud_token && r.cloud_token.token){
				var scvp_host = CloudHelpers.parseUri(r.svcp_auth_app_url).host;
				scvp_host = (window.location.protocol=='file:'?'http:':window.location.protocol) + "//" + scvp_host + "/";
				self.mAPI = new CloudAPI(r.cloud_token, scvp_host);
				self.mAPI.getServerTime().done(function(){
					p.resolve();
				}).fail(function(err){
					p.reject(err);
				})
			}else{
				console.warn("Try again after 1 sec");
				setTimeout(function(){
					self._asyncLogin(p);
				},1000);
			}
		}).fail(function(err){
			console.error(err);
			p.reject(err);
		});
	}
}

// construct
window.CloudUserInfo = function(conn, jsonUser, jsonCapabilities){
	var self = this;
	var mConn = conn;
	var mOrigJsonAccount;
	var mOrigJsonCapabilities;

	var mID, mEmail, mFirstName, mLastName, mPreferredName;
	var mHostedCamerasLimit, mTotalCamerasLimit;
	var mHostedCamerasCreated, mTotalCamerasCreated;

	function _parseJson(data_user, data_caps){
		mOrigJsonAccount = data_user;
		mOrigJsonCapabilities = data_caps;
		mID = data_user['id'];
		mEmail = data_user['email'];
		mFirstName = data_user['first_name'];
		mLastName = data_user['last_name'];
		mPreferredName = data_user['preferred_name'];
		if(data_caps){
			mTotalCamerasLimit = data_caps['cameras_creation']['limits']['total_cameras'];
			mHostedCamerasLimit = data_caps['cameras_creation']['limits']['hosted_cameras'];
			mTotalCamerasCreated = data_caps['cameras_creation']['created']['total_cameras'];
			mHostedCamerasCreated = data_caps['cameras_creation']['created']['hosted_cameras'];
		}else{
			mTotalCamerasLimit = 0;
			mHostedCamerasLimit = 0;
			mTotalCamerasCreated = 0;
			mHostedCamerasCreated = 0;
		}
	}
	var mUpdateData = {};

	_parseJson(jsonUser, jsonCapabilities);

	self._getConn = function(){
		return mConn;
	}

	self._origJsonAccount = function(){
		return mOrigJsonAccount;
	}

	self._origJsonCapabilities = function(){
		return mOrigJsonCapabilities;
	}

	self.getID = function(){
		return mID;
	}

	self.getEmail = function(){
		return mEmail;
	}

	self.getFirstName = function(){
		return mFirstName;
	}

	self.getLastName = function(){
		return mLastName;
	}

	self.getPreferredName = function(){
		return mPreferredName;
	}

	self.getCameraLimit = function(){
		return mTotalCamerasLimit;
	}

	self.getCameraCreated = function(){
		return mTotalCamerasCreated;
	}

	self.refresh = function(){
		var p = CloudHelpers.promise();
		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}
		mConn._getAPI().getAccountInfo().done(function(accInfo){
			mConn._getAPI().getAccountCapabilities().done(function(caps){
				_parseJson(accInfo,caps);
				p.resolve();
			}).fail(function(err){
				if(err.status == 500){
					_parseJson(accInfo);
				}else{
					CloudHelpers.handleError(err, p);
				}
			});
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		})
		return p;
	}
}

// construct
window.CloudCamera = function(conn, jsonData){
	var self = this;
	self.type = 'camera';
	var mConn = conn;
	var mOrigJson;
	var mID = jsonData.id;
	var mCameraManagerID = jsonData.cmngrid;
	var mURL, mURLLogin, mURLPassword;
	var mStatus, mTZ, mLatitude, mLongitude;
	var mDeleteAt, mName, mRecMode, mRecStatus;
	var mBrand, mGroupName, mFirmwareVersion;
	var mLed, mModel, mUUID, mSerialNumber;
	var mPublic;

	function _parseJsonData(data){
		mOrigJson = data;
		mURLLogin = data.login;
		mURLPassword = data.password;
		mURL = data.url;
		mName = data.name;
		mTZ = data.timezone;
		mStatus = data.status;
		mLatitude = data.latitude;
		mLongitude = data.longitude;
		mRecMode = data.rec_mode;
		mRecStatus = data.rec_status == 'on';
		mDeleteAt = data.delete_at;
		mBrand = data.brand;
		mGroupName = data.group_name;
		mFirmwareVersion = data.fw_version;
		mModel = data.model;
		mSerialNumber = data.serial_number;
		mUUID = data.uuid;
		mLed = data.led;
		mPublic = data.public ? data.public : false;
	}
	var mUpdateData = {};

	_parseJsonData(jsonData);

	self._getConn = function(){
		console.log("mConn = " + mConn)
		return mConn;
	}

	self._origJson = function(){
		return mOrigJson;
	}

	self.getID = function(){
		return mID;
	}
	self.getRecStatus = function(){
		console.warn("TODO");
	}
	self.hasPTZ = function(){
		console.warn("TODO");
	}
	self.getURL = function(){
		return mURL;
	}
	self.setURL = function(url){
		mURL = url;
		mUpdateData['url'] = url;
	}
    self.getURLLogin = function(){
		return mURLLogin;
	}

	self.setURLLogin = function(val){
		mURLLogin = val;
		mUpdateData['login'] = val;
	}

    self.getURLPassword = function(){
		return mURLPassword;
	}

    self.setURLPassword = function(val){
		mURLPassword = val;
		mUpdateData['password'] = val;
	}

	self.getDeleteAt = function(){
		return mDeleteAt;
	}

    self.getTimezone = function(){
		return mTZ;
	}

    self.setTimezone = function(timezone){
		mTZ = timezone;
		mUpdateData["timezone"] = timezone;
	}

	self.isPublic = function(){
		return mPublic;
	}
    self.setPublic = function(bValue){
		mPublic = bValue;
		mUpdateData["public"] = bValue;
	}

	self.getStatus = function(){
		var st = mStatus.toUpperCase();
		if(CloudCameraStatus[st]){
			return CloudHelpers.copy(CloudCameraStatus[st]);
		}else{
			console.error("Unknown camera status");
		}
		return null;
	}

	self.getName = function(){
		return mName;
	}

	self.setName = function(name){
		mName = name;
		mUpdateData["name"] = name;
	}

	self.getLatitude = function(){
		return mLatitude;
	}

	self.setLatitude = function(latitude){
		mLatitude = latitude;
		mUpdateData['latitude'] = latitude;
	}

	self.getLongitude = function(){
		return mLongitude;
	}

	self.setLongitude = function(longitude){
		mLongitude = longitude;
		mUpdateData['longitude'] = longitude;
	}

	self.isRecording = function(){
		return mRecStatus;
	}

	self.getCameraManagerID = function(){
		return mCameraManagerID;
	}

	self.getBrand = function(){
		return mBrand;
	}

	self.getGroupName = function(){
		return mGroupName;
	}

	self.getFirmwareVersion = function(){
		return mFirmwareVersion;
	}

	self.getModel = function(){
		return mModel;
	}

	self.getUUID = function(){
		return mUUID;
	}

	self.getLed = function(){
		return mLed;
	}

	self.setRecordingMode = function(mode){
		if(mode.name == CloudCameraRecordingMode.CONTINUES.name){
			mUpdateData['rec_mode'] = "on";
		}else if(mode.name == CloudCameraRecordingMode.BY_EVENT.name){
			mUpdateData['rec_mode'] = "by_event";
		}else if(mode.name == CloudCameraRecordingMode.NO_RECORDING.name){
			mUpdateData['rec_mode'] = "off";
		}else if(mode.name == CloudCameraRecordingMode.SERVER_BY_EVENT.name){
			mUpdateData['rec_mode'] = "server_by_event";
		}else{
			console.error("[CloudCamera] Unknown mode of recording");
		}
	}

	self.getRecordingMode = function(){
		if(mRecMode == "on"){
			return CloudHelpers.copy(CloudCameraRecordingMode.CONTINUES);
		}else if(mRecMode == "by_event"){
			return CloudHelpers.copy(CloudCameraRecordingMode.BY_EVENT);
		}else if(mRecMode == "off"){
			return CloudHelpers.copy(CloudCameraRecordingMode.NO_RECORDING);
		}else if(mRecMode === "server_by_event"){
			return CloudHelpers.copy(CloudCameraRecordingMode.SERVER_BY_EVENT);
		}else{
			console.error("[CloudCamera] Unknown mode of recording");
		}
	}

	self.save = function(){
		var p = CloudHelpers.promise();

		mConn._getAPI().updateCamera(mID, mUpdateData).done(function(r){
			_parseJsonData(r);
			if(mUpdateData['timezone']){ // timezone need change in cameramanager
				mConn._getAPI().updateCameraManager(mCameraManagerID, {timezone: mUpdateData['timezone']}).done(function(){
					mTZ = mUpdateData['timezone'];
					mUpdateData = {};
					p.resolve();
				}).fail(function(err){
					CloudHelpers.handleError(err, p);
				});
			}else{
				mUpdateData = {};
				p.resolve();
			}
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		});
		return p;
	}

	self.getPreview = function(){
		var p = CloudHelpers.promise();

		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}
		var diffTime = mConn._getAPI().diffServerTime;
		mConn._getAPI().cameraPreview(mID).done(function(r){
			console.log(r);
			var preview_time = CloudHelpers.parseUTCTime(r.time);
			curr_time = CloudHelpers.getCurrentTimeUTC() + diffTime;
			if((curr_time - preview_time)/1000 > 60){
				mConn._getAPI().cameraUpdatePreview(mID).done(function(up_r){
					p.resolve(r.url);
				}).fail(function(up_err){
					CloudHelpers.handleError(up_err, p);
				});
			}else{
				p.resolve(r.url);
			}
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		});
		return p;
	}

	self.getTimeline = function(start,end){
		var p = CloudHelpers.promise();

		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}
		var start_dt = CloudHelpers.formatUTCTime(start);
		var end_dt = CloudHelpers.formatUTCTime(end);
		var slice = 4;
		mConn._getAPI().storageTimeline(mID,start_dt,end_dt,slice).done(function(r){
			var res = {};
			res.start = start;
			res.end = end;
			res.periods = []
			var list = r.objects[0][slice];
			//for(var i in list){
			for(var i = 0; i < list.length; i++) {
				var period = {}
				period.start = CloudHelpers.parseUTCTime(list[i][0]);
				period.end = period.start + list[i][1]*1000;
				res.periods.push(period);
			}
			p.resolve(res);
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		});
		return p;
	}

	self.getTimelineDays = function(use_timezone){
		var p = CloudHelpers.promise();

		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}
		mConn._getAPI().storageActivity(mID,use_timezone).done(function(r){
			var res = [];
			//for(var i in r.objects){
			for(var i = 0; i < r.objects.length; i++) {
				res.push(CloudHelpers.parseUTCTime(r.objects[i] + 'T00:00:00'));
			}
			p.resolve(res);
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		});
		return p;
	}

	self.getCameraUsage = function(){
		var p = CloudHelpers.promise();

		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}
		mConn._getAPI().cameraUsage(mID).done(function(r){
			p.resolve(r);
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		});
		return p;
	}

	var sharing_token_name = 'COMMON_SHARING_TOKEN';

	function channelCode(share_token){
		var channel = {};
		channel.token = share_token;
		channel.camid = mID;
		channel.access = 'watch';
		if(mConn.ServiceProviderUrl){
			channel.svcp = mConn.ServiceProviderUrl;
		}

		if(mConn.ApiHost){
			channel.api = mConn.ApiHost;
		}

		if(mConn.ApiPort && mConn.ApiPort != 80){
			channel.api_p = mConn.ApiPort;
		}

		if(mConn.ApiSecurePort && mConn.ApiSecurePort != 443){
			channel.api_sp = mConn.ApiSecurePort;
		}

		// console.log("js: " + JSON.stringify(channel));
		// console.log("js2: " + btoa(JSON.stringify(channel)));
		return CloudHelpers.base64_encode(JSON.stringify(channel));
	}

	self.enableSharing = function(){
		var p = CloudHelpers.promise();
		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}
		mConn._getAPI().getCameraSharingTokensList(mID).done(function(r){
			var bFound = false;
			//for(var i in r.objects){
			for(var i = 0; i < r.objects.length; i++){
				var sh_tkn = r.objects[i];
				if(sh_tkn.name == sharing_token_name){
					bFound = true;
					if(sh_tkn.enabled == true){
						p.resolve(channelCode(sh_tkn.token, mID, 'watch'));
					}else{
						mConn._getAPI().updateCameraSharingToken(mID, sh_tkn.id, {enabled: true}).done(function(r2){
							// console.log(r2);
							p.resolve(channelCode(sh_tkn.token, mID, 'watch'));
						}).fail(function(err){
							CloudHelpers.handleError(err, p);
						})
					}
					// mConn._getAPI().
					return;
				}
			}
			if(!bFound){
				mConn._getAPI().creareCameraSharingToken(mID, sharing_token_name, ['live', 'play', 'clipsplay']).done(function(r){
					p.resolve(channelCode(r.token, mID, 'watch'));
				}).fail(function(err){
					CloudHelpers.handleError(err, p);
				});
			}
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		});
		return p;
	}

	self.disableSharing = function(sharing_token){
		var p = CloudHelpers.promise();
		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}
		mConn._getAPI().getCameraSharingTokensList(mID).done(function(r){
			var bFound = false
			//for(var i in r.objects){
			for(var i = 0; i < r.objects.length; i++){
				var sh_tkn = r.objects[i];
				if(sh_tkn.name == sharing_token_name){
					bFound = true;
					mConn._getAPI().updateCameraSharingToken(mID, sh_tkn.id, {enabled: false}).done(function(r2){
						console.log(r2);
						p.resolve();
					}).fail(function(err){
						CloudHelpers.handleError(err, p);
					})
					return;
				}
			}
			p.reject();
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		});
		return p;
	}

	self.toggleMemRec = function(mem_rec, access_token) {
		var p = CloudHelpers.promise();

		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}

		mConn._getAPI().toggleMemRec(mID, mem_rec, access_token)
		.done(function(r){
			p.resolve(r);
		})
		.fail(function(err){
			CloudHelpers.handleError(err, p);
		});
		return p;
	}

	self.createClip = function(title, start, end, delete_at, accessToken) {
		var p = CloudHelpers.promise();

		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}
		var start_dt = CloudHelpers.formatUTCTime(start);
		var end_dt = CloudHelpers.formatUTCTime(end);
		var del_at_dt = CloudHelpers.formatUTCTime(delete_at);

		mConn._getAPI().createClip(mID, title, start_dt, end_dt, del_at_dt, accessToken)
		.done(function(r){
			p.resolve(r);
		})
		.fail(function(err){
			CloudHelpers.handleError(err, p);
		});
		return p;
	}

	self.getClip = function (clipid, accessToken) {
	    var p = CloudHelpers.promise();

	    if(!mConn || !mConn.isOpened()){
		p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
		return p;
	    }
	    mConn._getAPI().getClip(clipid, accessToken)
	    .done(function(r){
		p.resolve(r);
	    })
	    .fail(function(err){
		CloudHelpers.handleError(err, p);
	    });
	    return p;
	}


	var sharing_token_name_for_stream = 'COMMON_SHARING_TOKEN_FOR_STREAM';

	function channelCodeForStream(share_token){
		var channel = {};
		channel.token = share_token;
		channel.camid = mID;
		channel.cmngrid = mCameraManagerID;
		channel.access = 'all';
		channel.api_p = 80;
		channel.api_sp = 443;
		channel.cam = "cam.skyvr.videoexpertsgroup.com";
		channel.cam_p = 8888; // default port
		channel.cam_sp = 8883; // default port

		if(mConn.ServiceProviderUrl){
			channel.svcp = mConn.ServiceProviderUrl;
			// channel.api = mConn.ServiceProviderUrl;
		}
		if(mConn.ApiHost){
			channel.api = mConn.ApiHost;
		}

		if(mConn.ApiPort && mConn.ApiPort != 80){
			channel.api_p = mConn.ApiPort;
		}

		if(mConn.ApiSecurePort && mConn.ApiSecurePort != 443){
			channel.api_sp = mConn.ApiSecurePort;
		}

		if(mConn.CamHost){
			channel.cam = mConn.CamHost;
		}

		if(mConn.CamPort){
			channel.cam_p = mConn.CamPort;
		}

		if(mConn.CamSecurePort){
			channel.cam_sp = mConn.CamSecurePort;
		}

		// console.log("js: " + JSON.stringify(channel));
		// console.log("js2: " + btoa(JSON.stringify(channel)));
		return CloudHelpers.base64_encode(JSON.stringify(channel));
	}

	self.enableSharingForStream = function(){
		var p = CloudHelpers.promise();
		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}
		mConn._getAPI().getCameraSharingTokensList(mID).done(function(r){
			var bFound = false;
			//for(var i in r.objects){
			for(var i = 0; i < r.objects.length; i++){
				var sh_tkn = r.objects[i];
				if(sh_tkn.name == sharing_token_name_for_stream){
					bFound = true;
					if(sh_tkn.enabled == true){
						p.resolve(channelCodeForStream(sh_tkn.token));
					}else{
						mConn._getAPI().updateCameraSharingToken(mID, sh_tkn.id, {enabled: true}).done(function(r2){
							// console.log(r2);
							p.resolve(channelCodeForStream(sh_tkn.token));
						}).fail(function(err){
							CloudHelpers.handleError(err, p);
						})
					}
					// mConn._getAPI().
					return;
				}
			}
			if(!bFound){
				mConn._getAPI().creareCameraSharingToken(mID, sharing_token_name_for_stream, ['all']).done(function(r){
					p.resolve(channelCodeForStream(r.token));
				}).fail(function(err){
					CloudHelpers.handleError(err, p);
				});
			}
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		});
		return p;
	}

    self.getStreamingURL = function(){
        var p = CloudHelpers.promise();
        if(!mConn || !mConn.isOpened()){
            p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
            return p;
        }
        mConn._getAPI().getCameraStreamingURLs(mID).done(function(r){
            p.resolve(r);
        }).fail(function(err){
            CloudHelpers.handleError(err, p);
        });
        return p;
    };

    self.setPublishPassword = function(val){
        mUpdateData['publish_password'] = val;
    };

}

window.CloudCameraListFilter = function(){
	var self = this;
	self.filterParams = {
		'detail': 'detail',
		'limit': 50
	};

	self.setLimit = function(limit){
		self.filterParams['limit'] = limit;
	}

	self.setOffset = function(offset){
		self.filterParams['offset'] = offset;
	}

	self.setName = function(name){
		if(name !== undefined){
			self.filterParams['name'] = name;
		}else{
			delete self.filterParams['name'];
		}
	}

	self.setPartOfName = function(name){
		if(name !== undefined){
			self.filterParams['name__icontains'] = name;
		}else{
			delete self.filterParams['name__icontains'];
		}
	}

	self.sortByName = function(asc){
		self.filterParams['order_by'] = (asc ? '-' : '') + 'name';
	}

	self.sortByDate = function(asc){
		self.filterParams['order_by'] = (asc ? '-' : '') + 'created';
	}

	self.setOwner = function(val){
		console.warn("setPublic is deprecated");
		if(val !== undefined){
			self.filterParams['is_owner'] = val;
		}else{
			delete self.filterParams['is_owner'];
		}
	}

	self.setPublic = function(val){
		console.warn("setPublic is deprecated");
		if(val !== undefined){
			self.filterParams['public'] = val;
		}else{
			delete self.filterParams['public'];
		}
	}

	self.setForStream = function(val){
		if(val !== undefined){
			if(val !== undefined){
				self.filterParams['url__isnull'] = val;
			}else{
				delete self.filterParams['url__isnull'];
			}
		}else{
			delete self.filterParams['url__isnull'];
		}
	}

	self.setPrivacy = function(val){
		if(val !== undefined && val.name){
			if(val.name == "PS_OWNER_NOT_PUBLIC"){
				self.filterParams['public'] = false;
				self.filterParams['is_owner'] = true;
			}else if(val.name == "PS_OWNER"){
				delete self.filterParams['public'];
				self.filterParams['is_owner'] = true;
			}else if(val.name == "PS_PUBLIC_NOT_OWNERS"){
				self.filterParams['public'] = true;
				self.filterParams['is_owner'] = false;
			}else if(val.name == "PS_PUBLIC"){
				self.filterParams['public'] = true;
				delete self.filterParams['is_owner'];
			}else if(val.name == "PS_OWNERS_PUBLIC"){
				self.filterParams['public'] = true;
				self.filterParams['is_owner'] = true;
			}else if(val.name == "PS_ALL"){
				delete self.filterParams['public'];
				delete self.filterParams['is_owner'];
			}else{
				console.error("Unknown privacy filter");
				delete self.filterParams['public'];
				delete self.filterParams['is_owner'];
			}
		}else{
			console.error("Unknown privacy filter");
			delete self.filterParams['public'];
			delete self.filterParams['is_owner'];
		}
	}

	self.setURL = function(url){
		if(url !== undefined){
			self.filterParams['url'] = url;
		}else{
			delete self.filterParams['url'];
		}
	}

	self.setLatLngBounds = function(latitude_min, latitude_max, longitude_min, longitude_max){
		 console.warn("[CloudCamerasListFilter] SetLatLngBounds, TODO test -1 < lat,lang < 1");
		 // TODO: don't forget check situation when MAX < MIN (if it possible, of course)!!!!
		 if(latitude_min <= latitude_max){
			self.filterParams['latitude__gte'] = latitude_min;
			self.filterParams['latitude__lte'] = latitude_max;
        }

        if(longitude_min <= longitude_max){
			self.filterParams['longitude__gte'] = longitude_min;
			self.filterParams['longitude__lte'] = longitude_max;
        }
	}

	self._values = function(){
		return self.filterParams;
	}
}

// construct
window.CloudCameraList = function(conn){
	var self = this;
	var mConn = conn;

	self.getCamera = function(camid){
		var p = CloudHelpers.promise();

		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}

		mConn._getAPI().getCamera(camid).done(function(r){
			p.resolve(new CloudCamera(mConn, r));
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		});
		return p;
	}

	self.createCamera = function(url, login, password){
		var p = CloudHelpers.promise();

		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}

		var data = {
			url: url,
			login: login,
			password: password
		};
		mConn._getAPI().createCamera(data).done(function(r){
			p.resolve(new CloudCamera(mConn, r));
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		});
		return p;
	}

	self.createCameraForStream = function(){
		var p = CloudHelpers.promise();

		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}

		var data = {};
		mConn._getAPI().createCamera(data).done(function(r){
			p.resolve(new CloudCamera(mConn, r));
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		});
		return p;
	}

	self.findOrCreateCamera = function(url){
		var p = CloudHelpers.promise();
		var camFilter = new CloudCameraListFilter();
		camFilter.setOwner(true);
		var u = CloudHelpers.splitUserInfoFromURL(url);
		camFilter.setURL(u.url);
		u.login = u.login || "";
		mConn._getAPI().camerasList(camFilter._values()).done(function(r){
			var bFound = false;
			//for(var i in r.objects){
			for(var i=0; i < r.objects.length; i++){
				var cam = r.objects[i];
				cam['login'] = cam['login'] || "";
				if(cam['login'] == u.login){
					bFound = true;
					p.resolve(new CloudCamera(mConn, cam));
					break;
				}
			}
			if(!bFound){
				self.createCamera(u.url, u.login, u.password).done(function(r){
					p.resolve(r);
				}).fail(function(err){
					CloudHelpers.handleError(err, p);
				})
			}
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		})
		return p;
	}


	self.getCameraList = function(camFilter){
		var p = CloudHelpers.promise();

		camFilter = camFilter || new CloudCameraListFilter();
		if(!camFilter['_values']){
			console.error(CloudReturnCode.ERROR_EXPECTED_FILTER);
			p.reject(CloudReturnCode.ERROR_EXPECTED_FILTER);
			return p;
		}

		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}

		mConn._getAPI().camerasList(camFilter._values()).done(function(r){
			var arr = [];
			//for(var i in r.objects){
			for(var i = 0; i < r.objects.length; i++){
				arr.push(new CloudCamera(mConn, r.objects[i]));
			}
			p.resolve(arr);
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		})
		return p;
	}

	self.getCameraListLight = function(camFilter){
		var p = CloudHelpers.promise();

		camFilter = camFilter || new CloudCameraListFilter();
		if(!camFilter['_values']){
			console.error(CloudReturnCode.ERROR_EXPECTED_FILTER);
			p.reject(CloudReturnCode.ERROR_EXPECTED_FILTER);
			return p;
		}

		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}
		var filter = camFilter._values();
		delete filterMap['detail'];
		mConn._getAPI().camerasList(filter).done(function(r){
			p.resolve(r.objects);
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		})
		return p;
	}

	self.deleteCamera = function(camid){
		var p = CloudHelpers.promise();

		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}

		mConn._getAPI().deleteCamera(camid).done(function(){
			p.resolve();
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		});
		return p;
	}
}

// construct
window.CloudSession = function(conn, jsonData){
	var self = this;
	self.type = 'session';
	var mConn = conn;
	var mOrigJson;
	var mID = jsonData.id;

	// TODO

	var mActive, mTitle, mPreviewURL, mAuthor;
	var mStreaming, mPublic, mLatitude, mLongitude;
	var mStart, mEnd, mHasRecords;
	var mHasAccessAll;
	var mHasAccessWatch;
	var mStatisticsLive = 0, mStatisticsPeakLive = 0, mStatisticsPlayback = 0;
	var mAuthorPreferredName;
	var mLiveURL_rtmp, mLiveURL_hls, mLiveURL_expire;

	mPreviewURL = "";

	function _parseJsonData(data){
		mOrigJson = data;
		mActive = data.active;
		mTitle = data.title;
		if(data.preview){
			mPreviewURL = data.preview.url;
		}

		if(data.live_urls){
			mLiveURL_rtmp = data.live_urls.rtmp;
			mLiveURL_hls = data.live_urls.hls;
			mLiveURL_expire = data.live_urls.expire;
		}

		mLatitude = data.latitude;
		mLongitude = data.longitude;
		mStreaming = data.streaming;
		mPublic = data.public;
		mStart = data.start;
		mEnd = data.end;
		mHasRecords = data.has_records;
		if(data.statistics){
			mStatisticsPeakLive = data.statistics.peak_live || 0;
			mStatisticsPlayback = data.statistics.playback || 0;
			mStatisticsLive = data.statistics.live || 0;
		}

		if(data.author){
			// TODO: author:{first_name: "Evgenii", id: "user5", last_name: "Sopov", name: "Evgenii Sopov", preferred_name: "evgenii"}
			mAuthorPreferredName = data.author.preferred_name;
		}else{
			mAuthorPreferredName = "unknown";
		}

		if(data.access){
			mHasAccessAll = data.access.indexOf("all") != -1;
			mHasAccessWatch = data.access.indexOf("watch") != -1;
		}
	}
	var mUpdateData = {};

	_parseJsonData(jsonData);

	self._getConn = function(){
		return mConn;
	}

	self._origJson = function(){
		return mOrigJson;
	}

	self.hasAccessAll = function(){
		return mHasAccessAll;
	}

	self.hasAccessWatch = function(){
		return mHasAccessAll || mHasAccessWatch;
	}

	self.getID = function(){
		return mID;
	}

	self.isOnline = function(){
		return mActive;
	}

	self.getTitle = function(){
		return mTitle;
	}

	self.getAuthorPreferredName = function(){
		return mAuthorPreferredName;
	}

	self.getStatisticsLive = function(){
		return mStatisticsLive;
	}

	self.getStatisticsPeakLive = function(){
		return mStatisticsPeakLive;
	}

	self.getStatisticsPlayback = function(){
		return mStatisticsPlayback;
	}

	self.getStartTime = function(){
		if(mStart == null){
			console.error("[CloudSession] #" + mID + " Start time is null");
			return 0;
		}
		return CloudHelpers.parseUTCTime(mStart);
	}

	self.getEndTime = function(){
		if(mStart == null){
			console.error("[CloudSession] #" + mID + " End time is null but session is mActive: " + mActive);
			return 0;
		}
		return CloudHelpers.parseUTCTime(mEnd);
	}

	self.getPreview = function(){
		return mPreviewURL;
	}

	self.getLatitude = function(){
		return mLatitude;
	}

	self.getLongitude = function(){
		return mLongitude;
	}

	self.isStreaming = function(){
		return mStreaming;
	}

	self.isPublic = function(){
		return mPublic;
	}

	self.hasRecords = function(){
		return mHasRecords;
	}

	self.getLiveUrl_Rtmp = function(){
		return mLiveURL_rtmp;
	}

	self.getLiveUrl_HLS = function(){
		return mLiveURL_hls;
	}

	self.getLiveUrl_Expire = function(){
		return mLiveURL_expire;
	}

	self.refresh = function(){
		var p = CloudHelpers.promise();
		mConn._getAPI().getCamsess(mID).done(function(r){
			_parseJsonData(r);
			p.resolve();
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		});
		return p;
	}
}

window.CloudSessionListFilter = function(){
	var self = this;
	self.filterParams = {
		'limit': 50,
		'order_by': '-start' // default
	};

	self.setLimit = function(limit){
		self.filterParams['limit'] = limit;
	}

	self.setOffset = function(offset){
		self.filterParams['offset'] = offset;
	}

	self.setTitle = function(s){
		self.filterParams["title__icontains"] = s; // ignore case
	}

	self.setStartLessThen = function(s){
		self.filterParams['start__lte'] = s;
	}

	self.setHasRecords = function(s){
		if(s == 'any'){
			// all
        }else if(s == 'yes'){
			self.filterParams['has_records'] = true;
			self.filterParams['active'] = false;
		}else if(s == 'no'){
			self.filterParams['has_records'] = false;
			self.filterParams['active'] = false;
		}else{
			console.error("[CloudSessionListFilter] setHasRecords, expected 'any', 'yes' or 'no'")
		}
	}

	self.setStreaming = function(s){
		if(s == 'any'){
			// all
        }else if(s == 'yes'){
			self.filterParams['streaming'] = true;
			self.filterParams['camera_online'] = true;
			self.filterParams['active'] = true;
		}else if(s == 'no'){
			self.filterParams['streaming'] = false;
			delete self.filterParams['camera_online'];
			self.filterParams['active'] = false;
		}else{
			console.error("[CloudSessionListFilter] setStreaming, expected 'any', 'yes' or 'no'")
		}
	}

	self.setAuthorName = function(s){
		self.filterParams['author_name__icontains'] = s;
	}

	self.setAuthorID = function(n){
		if(n){
			self.filterParams['author_id'] = n;
		}else{
			delete self.filterParams['author_id'];
		}
	}

	self.setAuthorPreferredName = function(s){
		if(s){
			self.filterParams['author_preferred_name__icontains'] = s;
		}else{
			delete self.filterParams['author_preferred_name__icontains'];
		}
	}

	self.setWithDetails = function(){
		console.warn("[CloudSessionListFilter] 'setWithDetails' not supported anymore. Please use getSessionList or getSessionListLight")
	}

	self.setOnline = function(s){
		console.warn("[CloudSessionListFilter] 'setOnline' not supported anymore")
	}

	self.setPublic = function(s){
		if(s == 'any'){
			// any
        }else if(s == 'yes'){
			self.filterParams['public'] = true;
		}else if(s == 'no'){
			self.filterParams['public'] = false;
		}else{
			console.error("[CloudSessionListFilter] setOnline, expected 'any', 'yes' or 'no'")
		}
	}

	self.setLatLngBounds = function(latitude_min, latitude_max, longitude_min, longitude_max){
		if(latitude_min <= latitude_max){
			self.filterParams['latitude__gte'] = latitude_min;
			self.filterParams['latitude__lte'] = latitude_max;
		}else{
			console.error("[CloudCamerasListFilter] latitude_max must be greater or equal to latitude_min");
		}

		if(longitude_min <= longitude_max){
			self.filterParams['longitude__gte'] = longitude_min;
			self.filterParams['longitude__lte'] = longitude_max;
		}else{
			console.error("[CloudCamerasListFilter] longitude_max must be greater or equal to longitude_min");
		}
	}

	self._values = function(){
		var filterMapCopy = {};
		for(var p in self.filterParams){
			filterMapCopy[p] = self.filterParams[p];
		}
		return filterMapCopy;
	}
}

// construct
window.CloudSessionList = function(conn){
	var self = this;
	var mConn = conn;

	self.getSession = function(sessid){
		var p = CloudHelpers.promise();

		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}

		mConn._getAPI().getCamsess(sessid).done(function(r){
			p.resolve(new CloudSession(mConn, r));
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		});
		return p;
	}

	self.getSessionList = function(sessionFilter){
		var p = CloudHelpers.promise();

		sessionFilter = sessionFilter || new CloudSessionListFilter();
		if(!sessionFilter['_values']){
			console.error(CloudReturnCode.ERROR_EXPECTED_FILTER);
			p.reject(CloudReturnCode.ERROR_EXPECTED_FILTER);
			return p;
		}

		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}
		var filterMap = sessionFilter._values();
		filterMap['detail'] = 'detail';
		mConn._getAPI().getCamsessList(filterMap).done(function(r){
			var arr = [];
			//for(var i in r.objects){
			for(var i=0; i < r.objects.length; i++){
				arr.push(new CloudSession(mConn, r.objects[i]));
			}
			p.resolve(arr);
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		})
		return p;
	}

	self.getSessionListLight = function(sessionFilter){
		var p = CloudHelpers.promise();

		sessionFilter = sessionFilter || new CloudSessionListFilter();
		if(!sessionFilter['_values']){
			console.error(CloudReturnCode.ERROR_EXPECTED_FILTER);
			p.reject(CloudReturnCode.ERROR_EXPECTED_FILTER);
			return p;
		}

		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}
		var filterMap = sessionFilter._values();
		delete filterMap['detail'];
		mConn._getAPI().getCamsessList(filterMap).done(function(r){
			p.resolve(r.objects);
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		})
		return p;
	}

	self.deleteSession = function(sessid){
		var p = CloudHelpers.promise();

		if(!mConn || !mConn.isOpened()){
			p.reject(CloudReturnCode.ERROR_NO_CLOUD_CONNECTION);
			return p;
		}

		mConn._getAPI().deleteCamsess(sessid).done(function(){
			p.resolve();
		}).fail(function(err){
			CloudHelpers.handleError(err, p);
		});
		return p;
	}
}

window.CloudPlayerEvent = {};

CloudPlayerEvent.CONNECTING = {
	name: 'CONNECTING',
	code: 0,
	text: 'Connection is establishing'
};

CloudPlayerEvent.CONNECTED = {
	name: 'CONNECTED',
	code: 1,
	text: 'Connection is established'
};

CloudPlayerEvent.PLAYED = {
	name: 'PLAYED',
	code: 2,
	text: 'Player changes state to PLAY.'
};

CloudPlayerEvent.PAUSED = {
	name: 'PAUSED',
	code: 3,
	text: 'Player state is PAUSE.'
};

CloudPlayerEvent.STOPED = {
	name: 'STOPED',
	code: 4,
	text: 'Player state is STOP.'
};

CloudPlayerEvent.CLOSED = {
	name: 'CLOSED',
	code: 6,
	text: 'Player state is CLOSED.'
};

CloudPlayerEvent.SEEK_COMPLETED = {
	name: 'SEEK_COMPLETED',
	code: 17,
	text: 'setPosition() is successfully finished.'
};

CloudPlayerEvent.ERROR = {
	name: 'ERROR',
	code: 105,
	text: 'Player is disconnected from media stream due to an error'
};

CloudPlayerEvent.SOURCE_CHANGED = {
	name: 'SOURCE_CHANGED',
	code: 3000,
	text: 'setSource() is successfully finished.'
};

CloudPlayerEvent.POSITION_JUMPED = {
	name: 'POSITION_JUMPED',
	code: 3001,
	text: 'Position was changed by player (possible that player did not found records).'
};

CloudPlayerEvent.RANGE_ENDED = {
	name: 'RANGE_ENDED',
	code: 4455,
	text: 'The player reached the end of the range when playing'
}

CloudPlayerEvent.CHANNEL_STATUS = {
	name: 'CHANNEL_STATUS',
	code: 4456,
	text: 'When channel status'
}

CloudPlayerEvent.USER_CLICKED_ON_TIMELINE = {
	name: 'USER_CLICKED_ON_TIMELINE',
	code: 4457,
	text: 'When user click on timeline.'
};

CloudPlayerEvent.CHANGED_CONTROLS = {
	name: 'CHANGED_CONTROLS',
	code: 4458,
	text: 'Event when controls changes'
};

CloudPlayerEvent.TIMELINE_END_UPDATED = {
	name: 'TIMELINE_END_UPDATED',
	code: 4459,
	text: 'Event when timeline end updated'
};

CloudPlayerEvent.ACCESS_TOKEN_EXPIRED_IN_5MIN = {
	name: 'ACCESS_TOKEN_EXPIRED_IN_5MIN',
	code: 4460,
	text: 'Access token expired in 5 minutes'
};


window._cloudPlayers = window._cloudPlayers || {};

window.CloudPlayer = function(elid, options){
	var self = this;
	self.options = options = options || {};
	self.elid = elid;
	var mConn = null;
	var mEvent = null;
	var mShowedBigPlayButton = false;
	var mShowedLoading = true;
	var mTimeWaitStartStream = 0;
	var mStopped = true;
	var mPlaying = false;
	var mPausing = false;
	var mHLSLinkExpire = 0;
	var mSafariAndHlsNotStarted = false;
	var mCallbacks = CloudHelpers.createCallbacks();
	var mUsedPlayer = '';
	var mWebRTC_el = null;
	var mWebRTC0_Player = null;
	var mWebRTC2_Player = null;
	var mNativeHLS_el = null;
	var mNativeHLS_Player = null;
/*
	var mNativeVideo1_el = null;
	var mNativeVideo2_el = null;
*/
	var mLiveModeAutoStart = false;
	var mPolingCameraStatus = null;
	var mCallback_onError = null; // deprecated
	var mCallback_onChannelStatus = null; // deprecated
	var mPlayerFormatForced = null;
	var mIsDewarping = null;
	var mElementCalendar = null;
	var mCurrentTimeInterval = null;
	var mExpireHLSTimeInterval = null;
	var mEnablePlaybackNative = true;
	var mTrasholdPlayback = 0; // default in ms for playback
	var mPreferredPlayerFormat = null;
	var f_callbackFullscreenFunc = null;
	var mAccessToken = null;
	var mAccessTokenExpire = null;
	var mAccessTokenTimeInterval = null;
	var isBackwardAudioStarted = false;
	var mBackwardAudioFormats = undefined;
	var mRecordMode = "records";
	var f_callbackIOsFullscreenFunc = null;
	var mVxgcloudplayer = null;

	self.sdCardCompatible = true;
	var hasMultipleStreams = null;
	var streamQuality = "main";
	var liveResId = null;
	var mainResId =  null;
	var mainVsId  = null;
	var liveVsId  = null;
	self.VsFormat  = null;



	self.mPTZActions = null;
	self.mPTZShow = true;

	self.isMobile = CloudHelpers.isMobile();

	self.timePolingLiveUrls = 15000;
	self.player = document.getElementById(elid);

	if (_cloudPlayers[elid]) {
		return _cloudPlayers[elid];
	}

	var mCurrentRecord_vjs = null;
	var mNextRecord_vjs = null;

	var mRangeMin = -1;
	var mRangeMax = -1;
	var mVideoSizeLive = {w: 0, h: 0};

	// configure hls plugin
	if (CloudHelpers.isChrome() && !self.isMobile) {
		videojs.options.hls = videojs.options.hls || {};
		videojs.options.html5.nativeAudioTracks = true;
		videojs.options.html5.nativeVideoTracks = false;//true;
		videojs.options.hls.overrideNative = false;
	} else {
		videojs.options.hls = videojs.options.hls || {};
		videojs.options.html5.nativeAudioTracks = false;
		videojs.options.html5.nativeVideoTracks = false;
		videojs.options.hls.overrideNative = true;
	}
	// videojs.options.hls.withCredentials = false;
	videojs.options.hls.enableLowInitialPlaylist = true;
	videojs.options.suppressNotSupportedError = false;
	// videojs.options.hls.blacklistDuration = 0;
	// videojs.options.hls.handleManifestRedirects = false;
	// videojs.options.hls.bandwidth
	videojs.options.techCanOverridePoster = true;

	if (self.player == null) {
		console.error("[CloudPlayer] Not found element");
		return null;
	}

	if (self.player.tagName != 'DIV') {
		console.error("[CloudPlayer] Expected DIV tag but got " + self.player.tagName);
		return null;
	}


	var mPosition = -1;

	var mWaitSourceActivationCounter = 0;
	var mTimePolingCameraStatus_inactive = 2000;
	var mTimePolingCameraStatus_active = 5000;

	var mCurrentPlayRecord = null;
	var mNextPlayRecord = null;
	self.m = {};
	self.m.mute = false;
	self.m.waitSourceActivation = options.waitSourceActivation || 0;
	/*if (self.m.waitSourceActivation > 60000) {
		console.warn("[CloudPlayer] option waitSourceActivation must be less than 30");
		self.m.waitSourceActivation = 30;
	}*/
	self.m.useTimezone = options.useTimezone;
	if (self.m.useTimezone) {
		console.warn("[CloudPlayer] useTimezone: " + self.m.useTimezone);
	}

	if (self.m.waitSourceActivation < 0) {
		console.warn("[CloudPlayer] option waitSourceActivation must be greater than -1");
		self.m.waitSourceActivation = 0;
	}

	self.m.useNativeHLS = options.useNativeHLS || false;

	self.m.backwardAudio = false;
	self.m.backwardAudio = options.backwardAudio || self.player.getAttribute('backward-audio') != null || self.m.backwardAudio;
	self.defualtAutohide = 3000;
	if (options["autohide"] !== undefined) {
		self.m.autohide = options.autohide
	} else {
		self.m.autohide = self.defualtAutohide;
	}

	if (options.trasholdPlaybackInMs) {
		mTrasholdPlayback = options.trasholdPlaybackInMs;
		console.log("[CloudPlayer] applied option trasholdPlaybackInMs " + options.trasholdPlaybackInMs);
	}

	self.mPlayerFormat = 'html5';

	// load format from storage

	var tmp_plr_frmt = '';
	if (options.preferredPlayerFormat) {
		self.mPreferredPlayerFormat = options.preferredPlayerFormat;
		tmp_plr_frmt = options.preferredPlayerFormat;
	} else {
		try{
			tmp_plr_frmt = localStorage.getItem("preferred_player_format");
			if (tmp_plr_frmt === 'jpeg'){
				tmp_plr_frmt = '';
			}
		} catch (e) {
			console.error("[CloudPlayer] error load format: ", e)
		}
	}

	if (tmp_plr_frmt == 'webrtc' || tmp_plr_frmt == 'html5' || tmp_plr_frmt == 'flash' || tmp_plr_frmt == 'jpeg') {
		self.mPlayerFormat = tmp_plr_frmt;
	} else{
		if(tmp_plr_frmt != null){
		}
		console.warn("[CloudPlayer] Unknown player format: ", tmp_plr_frmt, ", html5 is used by default");
	}

	if (options.useOnlyPlayerFormat) {
		var use_plr_frmt = options.useOnlyPlayerFormat;

		if (use_plr_frmt !== 'webrtc' && use_plr_frmt !== 'html5' && use_plr_frmt !== 'flash' && use_plr_frmt !== 'jpeg') {
			console.error("Wrong value of useOnlyPlayerFormat, expected 'webrtc' or 'html5' or 'flash'")
		} else {
			self.mPlayerFormat = use_plr_frmt;
			self.mPreferredPlayerFormat = use_plr_frmt;
			mPlayerFormatForced = use_plr_frmt;
			if (use_plr_frmt !== 'jpeg') {
				try { localStorage.setItem("preferred_player_format", use_plr_frmt); } catch(e) {}
			}
		}
	}

	if (options.mute !== undefined) {
		self.m.mute = options.mute === true ? true : false
	}

	self.swf_backwardaudio = '';

	// default
	self.player.classList.add("cloudplayer");
	self.player.classList.add("green");
	self.player.classList.add("black");

	self.player.innerHTML = ''
		+ '<div class="cloudplayer-loader" style="display: inline-block"></div>'
		+ '<div class="cloudplayer-screenshot-loading" style="display: none">'
		+ '		<div class="cloudplayer-screenshot-loading">'
		+ '     </div>'
		+ '</div>'
		+ '<div class="cloudplayer-error" style="display: none">'
		+ '	<div class="cloudplayer-error-text" style="display: none"></div>'
		+ '</div>'
		+ '<div class="cloudplayer-ptz">'
		+ '<div class="ptz-controls">'
		+ '	<div class="ptz-arrow ptz-top"></div>'
		+ '	<div class="ptz-arrow ptz-right"></div>'
		+ '	<div class="ptz-arrow ptz-bottom"></div>'
		+ '	<div class="ptz-arrow ptz-left"></div>'
		+ '<div class="ptz-zoom">'
		+ '	<div class="ptz-zoom-plus"></div>'
		+ '	<div class="ptz-zoom-minus"></div>'
		+ '</div>'
		+ '</div>'
		+ '<div class="ptz-presets">'
		+ '<h4>Presets</h4>'
		+ '<ul class="presets-list">'
		+ '<li data-presetNo="1">1</li>'
		+ '<li data-presetNo="2">2</li>'
		+ '<li data-presetNo="3">3</li>'
		+ '<li data-presetNo="4">4</li>'
		+ '<li data-presetNo="5">5</li>'
		+ '</ul>'
		+ '</div>'
		+ '</div>'
		+ '<div class="cloudplayer-controls-zoom-container">'
		+ '	<div class="cloudplayer-controls-zoom-position">'
		+ '		<div class="cloudplayer-zoom-position-cursor"></div>'
		+ '	</div>'
		+ '	<div class="cloudplayer-controls-zoom' + ((self.isMobile)?' mobile ':'') + '">'
		+ '		<div class="cloudplayer-zoom-up"></div>'
		+ '		<div class="cloudplayer-zoom-progress zoom10x"></div>'
		+ '		<div class="cloudplayer-zoom-down"></div>'
		+ '	</div>'
		+ '</div>'
		+ '<div class="cloudplayer-controls-timelapse-container">'
		+ '	<div class="cloudplayer-timelapse-controls">'
		+ '		<div class="cloudplayer-timelapse-left" ><span class="cloudplayer-timelapse-icon">&#10094;&#10094;</span></div>'
		+ '		<div class="cloudplayer-timelapse-pause"><span class="cloudplayer-timelapse-icon">&#10073;&#10073;</span></div>'
		+ '		<div class="cloudplayer-timelapse-right"><span class="cloudplayer-timelapse-icon">&#10095;&#10095;</span></div>'
		+ '	</div>'
		+ '</div>'
		+ '<div class="cloudplayer-watermark">'
		+ '</div>'
		+ '<div class="cloudplayer-sdkversion">SDK ' + CloudSDK.version + '</div>'
		+ '<div class="cloudplayer-selectcliptime">'
                + '    <table><tr><td>Before<br/><span>(sec.)</span></td><td>Date/Time</td><td>After<br/><span>(sec.)</span></td></tr>'
                + '    <tr><td><input class="clipbefore" type="number" min=1 max=3600 value="10"></td><td class="clipdt"></td><td><input class="clipafter" type="number" min=1 max=3600 value="10"></td></tr>'
                + '    <tr><td colspan="3"><div class="clipcreatebtn">Create clip &gt;</div></td></tr></table>'
                + '</div>'
		+ '<div class="cloudplayer-selectbackuptime">'
		+ '    <table class="mem_rec_hide"><tr><td>Duration<br/><span>(sec.)</span></td><td>Date/Time</td></tr>'
		+ '    <tr><td style="width: 50%"><input class="backupduration" type="number" min=1 max=3600 value="900" style="width: 100%"></td><td class="syncdt" style="width: 50%"></td></tr>'
		+ '    <tr><td colspan="2"><div class="sdcardbackupbtn">Start SD Card Backup &gt;</div></td></tr>'
		+ '    <tr><td colspan="2" id="backup_result"></td></tr></table>'
		+ '	   <div class="sd-divider mem_rec_hide"></div> '
		+ '    <div class="enable-disable-sdcard"></div>'
		+ '</div>'
		+ '<div class="cloudplayer-info' + ((self.isMobile)?' mobile ':'') + '">'
		+ '<div class="cloudplayer-info-main">'
		+ '		<div class="cloudplayer-info-title">Settings</div>'
		+ '		<div class="cloudplayer-info-container">'
		+ '		<div class="cloudplayer-info-player-quality enabled"> Stream:'
		+ '		<div class="selected-quality">Main</div></div>'
		+ '		<div class="cloudplayer-info-player-mode" style="' + (mPlayerFormatForced !== null ? 'disabled' : '' ) + '"> Preferred format: '
		+ '		<div class="selected-format"></div></div>'
		+ (CloudHelpers.isIE() ? ('') : (
		  '		<div class="cloudplayer-info-player-dewarping enabled"  style="' + (mIsDewarping !== null && False ? 'display: none' : '' ) + '">Dewarping: '
		+ '		<div class="selected-dewarping">Off</div></div>'
		  ))
		+ '		<div class="cloudplayer-info-player-speed enabled">Speed: '
		+ '		<div class="selected-speed">1x</div></div>'
		+ '		<!-- div class="cloudplayer-info-latency">Player Latency: '
		+ '			<div class="cloudplayer-info-latency-minimal">Minimal Latency</div>'
		+ '			/ '
		+ ' 		<div class="cloudplayer-info-latency-smoothless">Maximum Smoothness</div>'
		+ '		</div -->'
		+ '		<!-- div class="cloudplayer-info-latency-not-supported">Player Latency: Setting is not available for HTML5 player</div -->'
		+ '		<div class="cloudplayer-info-bufferlength"></div>'
		+ '		<div class="cloudplayer-info-audio-stream">Audio stream: '
		+'			<div class="cloudplayer-info-audio-stream-on">On</div>'
		+ '			/ '
		+ ' 		<div class="cloudplayer-info-audio-stream-off">Off</div>'
		+'		</div>'
		+ '		<div class="cloudplayer-info-playerversion">Version: ' + CloudSDK.version + ' (' + CloudSDK.datebuild + ')</div>'
		+ '		<div class="cloudplayer-info-playertype">Used player:</div>'
		+ '</div>'
		+ '</div>'
		+ '<div class="cloudplayer-info-setting quality-select">'
		+ '		<div class="cloudplayer-info-title"><span class="back"></span>Stream</div>'
		+ '		<div class="cloudplayer-info-container">'
		+ '			<div class="cloudplayer-player-mode cloudplayer-quality-mode quality-main selected" data-quality="main">Main</div>'
		+ '			<div class="cloudplayer-player-mode cloudplayer-quality-mode quality-live" data-quality="live">Live</div>'
		+ '		</div>'
		+ '</div>'
		+ '<div class="cloudplayer-info-setting mode-select">'
		+ '		<div class="cloudplayer-info-title"><span class="back"></span>Preferred format</div>'
		+ '		<div class="cloudplayer-info-container">'
		+ '			<div class="cloudplayer-player-mode cloudplayer-webrtc-mode" style="display: none">'+(options['alt_protocol_names']?'Low latency':'WebRTC')+'</div>'
		+ ' 			<div class="cloudplayer-player-mode cloudplayer-flash-mode selected">'+(options['alt_protocol_names']?'Standard':'RTMP')+'</div>'
		+ ' 			<div class="cloudplayer-player-mode cloudplayer-html5-mode">'+(options['alt_protocol_names']?'Reliable':'HLS')+'</div>'
		+ '			<div class="cloudplayer-player-mode cloudplayer-jpeg-mode">'+(options['alt_protocol_names']?'Performance':'JPEG')+'</div>'
		+ '		</div>'
		+ '</div>'
		+ '<div class="cloudplayer-info-setting dewarping-select">'
		+ '		<div class="cloudplayer-info-title"><span class="back"></span>Dewarping</div>'
		+ '		<div class="cloudplayer-info-container">'
		+ '			<div class="cloudplayer-player-mode cloudplayer-dewarping-mode selected" data-dewarping="0">Off</div>'
		+ '			<div class="cloudplayer-player-mode cloudplayer-dewarping-mode" data-dewarping="1">On</div>'
		+ '		</div>'
		+ '</div>'
		+ '<div class="cloudplayer-info-setting speed-select">'
		+ '		<div class="cloudplayer-info-title"><span class="back"></span>Speed</div>'
		+ '		<div class="cloudplayer-info-container">'
		+ '			<div class="cloudplayer-player-mode cloudplayer-speed-mode" data-speed="0.125">0.125x</div>'
		+ '			<div class="cloudplayer-player-mode cloudplayer-speed-mode'+ ((self.isMobile)?' mobile ':'') +'" data-speed="0.25">0.25x</div>'
		+ '			<div class="cloudplayer-player-mode cloudplayer-speed-mode" data-speed="0.5">0.5x</div>'
		+ '			<div class="cloudplayer-player-mode cloudplayer-speed-mode selected" data-speed="1">1x</div>'
		+ '			<div class="cloudplayer-player-mode cloudplayer-speed-mode'+ ((self.isMobile)?' mobile ':'') +'" data-speed="2">2x</div>'
		+ '			<div class="cloudplayer-player-mode cloudplayer-speed-mode" data-speed="4">4x</div>'
		+ '			<div class="cloudplayer-player-mode cloudplayer-speed-mode'+ ((self.isMobile)?' mobile ':'') +'" data-speed="8">8x</div>'
		+ '			<div class="cloudplayer-player-mode cloudplayer-speed-mode" data-speed="16">16x</div>'
		+ '		</div>'
		+ '</div>'
		+ '</div>'
		+ '<div class="cloudplayer-backwardaudio-container">' + (self.m.backwardAudio ? ''
		+ '		<object data="' + self.swf_backwardaudio + '" type="application/x-shockwave-flash" id="backwardaudio_swf_single" align="top">'
		+ '			<param name="movie" value="' + self.swf_backwardaudio + '" />'
		+ '			<embed type="application/x-shockwave-flash" src="' + self.swf_backwardaudio + '">'
		+ '			<param name="allowScriptAccess" value="always"/>'
		+ '			<param value="allowNetworking" value="all"/>'
		+ '			<param name="menu" value="true" />'
		+ '			<param name="wmode" value="transparent"/>'
		+ '			<!-- param name="bgcolor" value="#ffffff" / -->'
		+ '			<param name="menu" value="false" />'
		+ '		</object>' : '')
		+ '		<video class="cloudplayer-backward-webrtc" crossorigin="anonymous" autoplay=true preload playsinline="true" style="width: 10px; height: 10px; background-color: #000;"></video>'
		+ '</div>'
		+ '<div class="cloudplayer-calendar-container"></div>'
		+ '<div class="cloudplayer-live-container"></div>'
		+ '<div class="cloudplayer-controls-container">'
		+ '<div class="cloudplayer-timeline-container"></div>'
		+ '<div class="cloudplayer-controls">'
		+ '	<div class="cloudplayer-play" style="display: none"></div>'
		+ '	<div class="cloudplayer-stop" style="display: none"></div>'
		+ '	<div class="cloudplayer-pause hidden"></div>'
		+ '	<div class="cloudplayer-volume-mute"></div>'
		+ '	<div class="cloudplayer-volume-container">'
		+ '		<input type="range" min="0" max="100" value="100" step="1" data-buffer="0" id="volume" class="cloudplayer-volume" data-rangeSlider>'
		+ '		<output></output>'
		+ '	</div>'
		+ '	<div class="cloudplayer-time' + ((self.isMobile)?' mobile ':'') + ((options.hideTime)?' hidden' : '') + '"></div>'
		+ '	<div class="cloudplayer-volume-down"></div>'
		+ '	<div class="cloudplayer-volume-progress vol7"></div>'
		+ '	<div class="cloudplayer-volume-up"></div>'
		+ '	<div class="cloudplayer-right-divider"></div>'
		+ '	<div class="cloudplayer-microphone disabled"></div>'
		+ '	<div class="cloudplayer-get-clip" style="display: none"></div>'
		+ '	<div class="cloudplayer-get-shot" style="display: none"></div>'
		+ '	<div class="cloudplayer-sd-backup" style="display: none"></div>'
		+ '	<div class="cloudplayer-record-mode mode-records" style="display: none"></div>'
		+ '	<div class="cloudplayer-single-element-divider"></div>'
		+ '	<div class="cloudplayer-settings"></div>'
		+ '	<div class="cloudplayer-show-zoom"></div>'
		+ '	<div class="cloudplayer-show-ptz"></div>'
		+ '	<div class="cloudplayer-fullscreen"></div>'
		+ '</div>'
		+ '</div>'
		+ '<div class="cloudcameracalendar-content'+ ((self.isMobile)?' mobile ':'') +'">'
		+ '</div>'
		+ '<div class="cloudplayer-big-play-button" style="display: none"></div>'
		+ '<canvas class="cloudplayer-stub-snapshot" style="width:100%; height:100%; display:none;"></canvas>'
		+ '<canvas class="cloudplayer-snapshot hidden"></canvas>'
		+ '<div class="cloudplayer-share-clip" style="width:100%; height:100%; display:none;"></div>'
		+ '<div class="allvideotags" style="width:100%; height:100%;" >'
		+ '	<video crossorigin="anonymous" id="' + elid + '_vjs" class="video-js" preload="auto" class="video-js vjs-default-skin vjs-live vjs-fill" '
		+ '		controls width="100%" height="100%"'
//		+ '		data-setup=\'{"aspectRatio":"16:9", "fluid": true}\''
		+ '		 muted=' + self.m.mute + ' autoplay=true preload playsinline="true"></video>'
/*		+ '	<video crossorigin="anonymous" id="' + elid + '_vjs2" class="video-js" preload="auto" class="video-js vjs-default-skin vjs-live"'
		+ '		 muted=' + self.m.mute + ' autoplay=true preload playsinline="true" ></video>'
*/
/*
		+ '	<video crossorigin="anonymous" id="' + elid + '_nv1" class="cloudplayer-native-video ' + elid + '_nv1"'
		+ '		autoplay=true preload  playsinline="true" ></video>'
		+ '	<video crossorigin="anonymous" id="' + elid + '_nv2" class="cloudplayer-native-video ' + elid + '_nv2"'
		+ ' 		autoplay=true preload  playsinline="true" ></video>'
*/
		+ '	<div class="cloudplayer-vxgcloudplayer-container" style="position:absolute;top:0;left:0;width:100%!important;height:100%!important;z-index:-2;display:block;">'
		+ '		<vxg-cloud-player class="cloudplayer-vxgcloudplayer" '
		+ 			'id="' + elid +  '_vxg_cloud_player" '
		+			'timelineselector="#'+elid+'_timeline" '
		+			'thumbnails '
		+			'videomodule="k-video-sdvxg" '
		+			'controls="k-control-timepicker " '
//		+			'options="{&quot;onlypreview&quot;:1}" '
		+			'style="display: block; width:100%;height:100%;">'
		+		'</vxg-cloud-player>'
		+ '	</div>'
		+ '	<video crossorigin="anonymous" id="' + elid + '_native_hls" class="cloudplayer-native-hls"'
		+ '		muted=' + self.m.mute + ' autoplay=true preload  playsinline="true" ></video>'
		+ '	<video crossorigin="anonymous" id="' + elid + '_webrtc" class="cloudplayer-webrtc"'
		+ '		muted=' + self.m.mute + ' preload  playsinline="true" ></video>'
		+ ' 	<div id="' + elid +'_jpg" class="cloudplayer-jpeg"></div>'
		+ ' 	<div id="' + elid +'_timelapse" class="cloudplayer-timelapse"></div>'
		+ '</div>'
		+ '<div class="cloudplayer-black-screen" style="display: none">'
		+ '		<div class="cloudplayer-watermark"></div>'
		+ '		<div class="cloudplayer-sdkversion">SDK ' + CloudSDK.version + '</div>'
		+ '</div>'
		+ '<div class="cloudplayer-debug" style="display: none; position : absolute; z-index: 12; width: 100%; height : 50px; background-color: white;">'
		+ '/<div>'
	;

	self.vjs = videojs(elid + '_vjs', {
		"controls": false,
	});

	//self.vjs2 = videojs(elid + '_vjs2', {
	//	"controls": false
	//}).ready(function(){
		//self.vjs2.style.display = "none";
	//});


	self.vjs.on('error',function(error){
		_hideloading();
		if(self.vjs.error() != null){
			var e = self.vjs.error();
			if (self.isLive()) {
				if (e.code == 4 && !CloudHelpers.supportFlash() && !self.isMobile && self.mPlayerFormat == "flash") {
					//self._showerror({name: "REQUIRE_FLASH", text: "Please install and enable <a target='_black' href='https://get.adobe.com/flashplayer/'>Adobe Flash Player</a> and try again", code: -6001});
					self._showConsoleError({name: "REQUIRE_FLASH", text: "Please install and enable <a target='_black' href='https://get.adobe.com/flashplayer/'>Adobe Flash Player</a> and try again", code: -6001});
				} else if(e.code == 3 && self.isMobile) {
					//self._showerror(CloudReturnCode.ERROR_COULD_NOT_DECODE_STREAM_OR_COULD_NOT_SET_COOKIE_HLS);
					self._showConsoleError(CloudReturnCode.ERROR_COULD_NOT_DECODE_STREAM_OR_COULD_NOT_SET_COOKIE_HLS);
				} else {
					//self._showerror({name: "VIDEOJS_ERROR", text: "Code " + e.code + ": " + e.message, code: -6000});
					self._showConsoleError({name: "VIDEOJS_ERROR", text: "Code " + e.code + ": " + e.message, code: -6000});
				}
			} else {
				//self._showerror({name: "VIDEOJS_ERROR", text: "Code " + e.code + ": " + e.message, code: -6000});
				self._showConsoleError({name: "VIDEOJS_ERROR", text: "Code " + e.code + ": " + e.message, code: -6000});
			}
		}
		self._hideSnapshot(false);
		self.stop("by_vjs_error");
		setTimeout(function(){
		    self.play();
		},1000);
	});

/*
	var mPlaybackPlayer1 = null;
	var mPlaybackPlayer2 = null;

	if (mEnablePlaybackNative) {
		mPlaybackPlayer1 = new CloudPlayerNativeVideo(elid + '_nv1');
		mPlaybackPlayer2 = new CloudPlayerNativeVideo(elid + '_nv2');
	} else {
		mPlaybackPlayer1 = self.vjs;
		//mPlaybackPlayer2 = self.vjs2;
	}
*/

	var mUniqPlay = null;
	// poling time
	self.time = 0;

	var el_player = self.player;//document.querySelector('.cloudplayer');
	var el_controls = self.player.getElementsByClassName('cloudplayer-controls')[0];
	var el_volume = self.player.getElementsByClassName('cloudplayer-volume')[0];
	var el_controls_zoom_container = self.player.getElementsByClassName('cloudplayer-controls-zoom-container')[0];
	var el_controls_zoom = self.player.getElementsByClassName('cloudplayer-controls-zoom')[0];
	var el_controls_zoom_position = self.player.getElementsByClassName('cloudplayer-controls-zoom-position')[0];
	var el_controls_container = self.player.getElementsByClassName('cloudplayer-controls-container')[0];
	var el_controls_zoom_switcher = self.player.getElementsByClassName('cloudplayer-show-zoom')[0];
	var el_controls_ptz_switcher = self.player.getElementsByClassName('cloudplayer-show-ptz')[0];
	var el_controls_microphone = self.player.getElementsByClassName('cloudplayer-microphone')[0];
	var el_controls_get_shot = self.player.getElementsByClassName('cloudplayer-get-shot')[0];
	var el_controls_get_clip = self.player.getElementsByClassName('cloudplayer-get-clip')[0];
	var el_controls_sd_backup = self.player.getElementsByClassName('cloudplayer-sd-backup')[0];
	var el_selectbackuptime = self.player.getElementsByClassName('cloudplayer-selectbackuptime')[0];
	var el_toggle_sd_sync = self.player.getElementsByClassName('enable-disable-sdcard')[0];
	var el_controls_ptz_container = self.player.getElementsByClassName('cloudplayer-ptz')[0];
	var mElementPlay = self.player.getElementsByClassName('cloudplayer-play')[0];
	var el_info = self.player.getElementsByClassName('cloudplayer-info')[0];
	var el_clipcreatebtn = self.player.getElementsByClassName('clipcreatebtn')[0];
	var el_sdcardbackupbtn = self.player.getElementsByClassName('sdcardbackupbtn')[0];
	var el_stop = self.player.getElementsByClassName('cloudplayer-stop')[0];
	var el_pause = self.player.getElementsByClassName('cloudplayer-pause')[0];
	var el_loader = self.player.getElementsByClassName('cloudplayer-loader')[0];
	var mElError = self.player.getElementsByClassName('cloudplayer-error')[0];
	var mElErrorText = self.player.getElementsByClassName('cloudplayer-error-text')[0];
	var el_player_time = self.player.getElementsByClassName('cloudplayer-time')[0];
	var el_player_cliptime = self.player.getElementsByClassName('clipdt')[0];
	var el_player_synctime = self.player.getElementsByClassName('syncdt')[0];
	var mElBigPlayButton = self.player.getElementsByClassName('cloudplayer-big-play-button')[0];
	var mWebRTC_el = self.player.getElementsByClassName('cloudplayer-webrtc')[0];
	var mNativeHLS_el = self.player.getElementsByClassName('cloudplayer-native-hls')[0];
/*
	var mNativeVideo1_el = self.player.getElementsByClassName(elid + '_nv1')[0];
	var mNativeVideo2_el = self.player.getElementsByClassName(elid + '_nv2')[0];
*/
	var mJpegPlayer_el = self.player.getElementsByClassName('cloudplayer-jpeg')[0];
	var mTimelapsePlayer_el = self.player.getElementsByClassName('cloudplayer-timelapse')[0];
	var mTimelapseControlsContainer_el = self.player.getElementsByClassName('cloudplayer-controls-timelapse-container')[0];

	var el_timelapse_left = self.player.getElementsByClassName('cloudplayer-timelapse-left')[0];
	var el_timelapse_pause = self.player.getElementsByClassName('cloudplayer-timelapse-pause')[0];
	var el_timelapse_right = self.player.getElementsByClassName('cloudplayer-timelapse-right')[0];
	var el_record_mode = self.player.getElementsByClassName('cloudplayer-record-mode')[0];

	//mNativeVideo1_el = document.getElementById(elid + '_nv1');
	//mNativeVideo2_el = document.getElementById(elid + '_nv2');
	var mElPlrType = self.player.getElementsByClassName('cloudplayer-info-playertype')[0];
	var mElSettingsOpen = self.player.getElementsByClassName('cloudplayer-settings')[0];
	var mElSettingsClose = self.player.getElementsByClassName('cloudplayer-info-close')[0];

	var mElSettings_back_buttons = self.player.querySelectorAll('.cloudplayer-info-title .back');
	var mElSettings_format_container = self.player.getElementsByClassName('cloudplayer-info-player-mode')[0];
	var mElSettings_speed_container = self.player.querySelector('.cloudplayer-info-player-speed');
	var mElSettings_selected_quality_container = self.player.getElementsByClassName('selected-quality')[0];
	var mElSettings_selected_format_container = self.player.getElementsByClassName('selected-format')[0];
	var mElSettings_selected_speed_container = self.player.querySelector('.cloudplayer-info-player-speed.enabled .selected-speed');
	var mElSettings_selected_dewarping_container = self.player.querySelector('.cloudplayer-info-player-dewarping.enabled .selected-dewarping');
	var mElSettings_wantWebRTC = self.player.getElementsByClassName('cloudplayer-webrtc-mode')[0];
	var mElSettings_wantFlash = self.player.getElementsByClassName('cloudplayer-flash-mode')[0];
	var mElSettings_wantHTML5 = self.player.getElementsByClassName('cloudplayer-html5-mode')[0];
	var mElSettings_wantJpeg = self.player.getElementsByClassName('cloudplayer-jpeg-mode')[0];
	var mElementCalendar = self.player.getElementsByClassName('cloudcameracalendar-content')[0];
	var mElementCalendarButton = self.player.getElementsByClassName('cloudplayer-calendar-container')[0];

	var el_controls_ptz_left = self.player.getElementsByClassName('ptz-left')[0];
	var el_controls_ptz_right = self.player.getElementsByClassName('ptz-right')[0];
	var el_controls_ptz_up = self.player.getElementsByClassName('ptz-top')[0];
	var el_controls_ptz_down = self.player.getElementsByClassName('ptz-bottom')[0];
	var el_controls_ptz_zoomin = self.player.getElementsByClassName('ptz-zoom-plus')[0];
	var el_controls_ptz_zoomout = self.player.getElementsByClassName('ptz-zoom-minus')[0];

	var el_calendar_container = self.player.getElementsByClassName('cloudplayer-calendar-container')[0];
	var el_live_container = self.player.getElementsByClassName('cloudplayer-live-container')[0];

	var mElSettings_quality_mode = self.player.querySelectorAll('.cloudplayer-quality-mode');
	var mElSettings_speed_mode = self.player.querySelectorAll('.cloudplayer-speed-mode');
	var mElSettings_dewarping_mode = self.player.querySelectorAll('.cloudplayer-dewarping-mode');

	var mVxgcloudplayer = self.player.getElementsByClassName('cloudplayer-vxgcloudplayer')[0];

	var mJpegPlayer = new CloudPlayerJpegLive( mJpegPlayer_el );
	if (self.options.jpegForcedUpdatePeriod) {
		mJpegPlayer.setForcedUpdatePeriod(self.options.jpegForcedUpdatePeriod);
	}

	var mTimelapsePlayer = new CloudPlayerJpegTimelapse (mTimelapsePlayer_el);

	var el_shareclip = self.player.getElementsByClassName('cloudplayer-share-clip')[0];
	if (el_shareclip !== undefined){
	    var shareClip = new CloudShareClipController(el_shareclip, self._shareClipCallback);
	}

	for (var quality = mElSettings_quality_mode.length - 1; quality >= 0; quality--) {
		mElSettings_quality_mode[quality].onclick = selectQuality;
	}

	for (var speed = mElSettings_speed_mode.length - 1; speed >= 0; speed--) {
		mElSettings_speed_mode[speed].onclick = selectSpeed;
	}

	for (var dewarping = mElSettings_dewarping_mode.length - 1; dewarping >= 0; dewarping--) {
		mElSettings_dewarping_mode[dewarping].onclick = selectDewarping;
	}


	if(typeof rangeSlider !== "undefined") {
	    rangeSlider.create(el_volume);
	}

	var selector = '[data-rangeSlider]',
		elements = document.querySelectorAll(selector);

	function valueOutput(element) {
		var value = element.value,
			output = element.parentNode.getElementsByTagName('output')[0];
		output.innerHTML = value+'%';
	}

	for (var i = elements.length - 1; i >= 0; i--) {
		valueOutput(elements[i]);
	}

	function selectQuality() {
		for (var el = mElSettings_quality_mode.length - 1; el >= 0; el--) {
			mElSettings_quality_mode[el].classList.remove('selected');
		}

		this.classList.add('selected');
		mElSettings_selected_quality_container.textContent = this.textContent;
		_applyQuality(this.dataset.quality);
	}

	function selectSpeed(){
		for (var el = mElSettings_speed_mode.length - 1; el >= 0; el--) {
			mElSettings_speed_mode[el].classList.remove('selected');
		}

		this.classList.add('selected');
		mElSettings_selected_speed_container.textContent = this.textContent;
		_applySpeed(this.dataset.speed);
	}


	function selectDewarping(){
		for (var el = mElSettings_dewarping_mode.length - 1; el >= 0; el--) {
			mElSettings_dewarping_mode[el].classList.remove('selected');
		}

		this.classList.add('selected');
		mElSettings_selected_dewarping_container.textContent = this.textContent;
		_applyDewarping(this.dataset.dewarping);
	}

	Array.prototype.slice.call(document.querySelectorAll('input[type="range"]')).forEach(function (el) {
		el.addEventListener('input', function (e) {
			valueOutput(e.target);
		}, false);
	});

	for(i=0; i<mElSettings_back_buttons.length; i++){
		mElSettings_back_buttons[i].onclick = function(){
			self.collapseMenu();
		}
	}

	function _applyQuality(quality) {
		// request live_url for first stream (low) or second stream (high)
		streamQuality = quality;
		_loadLiveUrl(mUniqPlay);
	}

	function _applyDewarping(dewarping)
	{
		if (dewarping == 1)
			self.pano.start();
		else
			self.pano.stop();
	}

	function _applySpeed(speed){
		//var p = document.getElementById(player.playerElementID).getElementsByClassName('cloudplayer-native-video');
		var p = el_player.getElementsByClassName('cloudplayer-native-video');
		for (var i=0;i<p.length;i++)
			p[i].defaultPlaybackRate=p[i].playbackRate=speed;

		if (mVxgcloudplayer) {
			mVxgcloudplayer.playbackRate = speed;
		}
	}

	function _hideerror(){
		mElError.style.display = "none";
		mElErrorText.style.display = "none";
	}

	function _isShowedError() {
		return mElError.style.display == "block";
	}

	var loader_to = null;
	function _showloading( timeout ){
		var to = Number(timeout);
		if (CloudHelpers.isIE()){
			if (isNaN(to)){
				to = 0;
			}
		} else if (Number.isNaN(to)) {
			to = 0;
		}

		if(self.mShowedBigPlayButton == true){
			_hideloading();
		} else if(!mShowedLoading){
			if (to == 0) {
				el_loader.style.display = "inline-block";
				mShowedLoading = true;
			} else if (to > 0) {
				loader_to = setTimeout( function(){
					el_loader.style.display = "inline-block";
					mShowedLoading = true;
				}, to);
			}
		}
	}

	function _hideloading(){
		if(mShowedLoading){
			if (loader_to != null) {
				clearTimeout(loader_to);
			}
			el_loader.style.display = "none";
			mShowedLoading = false;
		}
	}

	/* settings */

	self.onDocumentClick = function(event) {
		var isClickInside = el_info.contains(event.target) || mElSettingsOpen == event.target || mElSettingsOpen.contains(event.target) ||
			mElementCalendar == event.target || mElementCalendar.contains(event.target) ||
			el_controls_get_shot == event.target || el_controls_get_clip == event.target || el_controls_sd_backup == event.target || el_controls_microphone == event.target ||
			el_controls_zoom_switcher == event.target || el_controls_zoom_switcher.contains(event.target) ||
			el_controls_zoom_container == event.target || el_controls_zoom_container.contains(event.target) ||
                        mElementCalendarButton == event.target || mElementCalendarButton.contains(event.target) ||
						el_selectbackuptime == event.target || el_selectbackuptime.contains(event.target);

		if (!isClickInside) {
			self.player.classList.remove('showing-zoom', 'showing-settings');
			if(self.sdControls) {
				self.player.getElementsByClassName('cloudplayer-selectbackuptime')[0].style.display = "none";
			}

			if(self.calendar){
				self.calendar.hideCalendar();
				var el_timelineCalendar = self.player.getElementsByClassName('cloudcameratimeline-calendar')[0];
				if (el_timelineCalendar)
					el_timelineCalendar.classList.remove("shadowed");
			}
		}
	};
	document.addEventListener('click', self.onDocumentClick);

	mElSettingsOpen.onclick = function(){
		el_player.classList.remove('showing-quality-selection');
		el_player.classList.remove('showing-format-selection');
		el_player.classList.remove('showing-speed-selection');
		el_player.classList.remove('showing-dewarping-selection');

		self.player.classList.toggle('showing-settings');
		self.player.classList.remove('showing-zoom');
		self.player.getElementsByClassName('cloudplayer-selectcliptime')[0].style.display = "none";
		self.player.getElementsByClassName('cloudplayer-selectbackuptime')[0].style.display = "none";

		if(self.calendar){
			self.calendar.hideCalendar();
			var el_timelineCalendar = self.player
				.getElementsByClassName('cloudcameratimeline-calendar')[0];
			if (el_timelineCalendar) el_timelineCalendar.classList.remove("shadowed");
		}
	};

	mElSettings_selected_quality_container.onclick = function () {
		el_player.classList.toggle('showing-quality-selection');
	};

	mElSettings_selected_format_container.onclick = function(){
		el_player.classList.toggle('showing-format-selection');
	};

	mElSettings_selected_speed_container.onclick = function () {
		el_player.classList.toggle('showing-speed-selection');
	};

	if ((mElSettings_selected_dewarping_container !== undefined) && (mElSettings_selected_dewarping_container !== null)) {
		mElSettings_selected_dewarping_container.onclick = function () {
			el_player.classList.toggle('showing-dewarping-selection');
		}
	}

	// mElSettingsClose.onclick = function(){
	// 	el_info.style.display = 'none';
	// }

	el_controls_ptz_left.onmousedown = function(){
	    var api = mConn._getAPI()
	    if (api == null) {
		return;
	    }
	    if (!self.mPTZActions || (self.mPTZActions.indexOf('left') == -1) ) {
		return;
	    }

	    var data = {
		"action":"left",
		"timeout": 10000
	    }
	    api.cameraPtzExecute(self.mSrc.getID(), data).done(function(r){
		console.log('shifted to left');
	    }).fail(function(r){
		console.error(r);
	    });
	}

	el_controls_ptz_right.onmousedown = function(){
	    var api = mConn._getAPI()
	    if (api == null) {
		return;
	    }
	    if (!self.mPTZActions || (self.mPTZActions.indexOf('right') == -1) ) {
		return;
	    }

	    var data = {
		"action":"right",
		"timeout": 10000
	    }
	    api.cameraPtzExecute(self.mSrc.getID(), data).done(function(r){
		console.log('shifted to right');
	    }).fail(function(r){
		console.error(r);
	    });
	}

	el_controls_ptz_up.onmousedown = function(){
    	    var api = mConn._getAPI()
	    if (api == null) {
		return;
	    }
	    if (!self.mPTZActions || (self.mPTZActions.indexOf('top') == -1) ) {
		return;
	    }

	    var data = {
		"action":"top",
		"timeout": 10000
	    }
	    api.cameraPtzExecute(self.mSrc.getID(), data).done(function(r){
		console.log('shifted to up');
	    }).fail(function(r){
		console.error(r);
	    });
	}

	el_controls_ptz_down.onmousedown = function(){
	    var api = mConn._getAPI()
	    if (api == null) {
		return;
	    }
	    if (!self.mPTZActions || (self.mPTZActions.indexOf('bottom') == -1) ) {
		return;
	    }

	    var data = {
		"action":"bottom",
		"timeout": 10000
	    }
	    api.cameraPtzExecute(self.mSrc.getID(), data).done(function(r){
		console.log('shifted to down');
	    }).fail(function(r){
		console.error(r);
	    });
	}

	el_controls_ptz_zoomin.onmousedown = function(){
	    var api = mConn._getAPI()
	    if (api == null) {
		return;
	    }
	    if (!self.mPTZActions || (self.mPTZActions.indexOf('zoom_in') == -1) ) {
		return;
	    }

	    var data = {
		"action":"zoom_in",
		"timeout": 10000
	    }
	    api.cameraPtzExecute(self.mSrc.getID(), data).done(function(r){
		console.log('Zoomed in');
	    }).fail(function(r){
		console.error(r);
	    });
	}

	el_controls_ptz_zoomout.onmousedown = function(){
	    var api = mConn._getAPI()
	    if (api == null) {
		return;
	    }
	    if (!self.mPTZActions || (self.mPTZActions.indexOf('zoom_out') == -1) ) {
		return;
	    }
	    var data = {
		"action":"zoom_out",
		"timeout": 10000
	    }
	    api.cameraPtzExecute(self.mSrc.getID(), data).done(function(r){
		console.log('Zoomed out');
	    }).fail(function(r){
		console.error(r);
	    });
	}

	el_controls_ptz_zoomin.onmouseup =
	el_controls_ptz_zoomout.onmouseup =
	el_controls_ptz_left.onmouseup =
	el_controls_ptz_right.onmouseup =
	el_controls_ptz_up.onmouseup =
	el_controls_ptz_down.onmouseup = function(){
    	    var api = mConn._getAPI()
	    if (api == null) {
		return;
	    }
	    if (!self.mPTZActions || (self.mPTZActions.indexOf('stop') == -1) ) {
		return;
	    }
	    var data = {
		"action": "stop",
		"timeout": 1000
	    }
	    api.cameraPtzExecute(self.mSrc.getID(), data).done(function(r){
		console.log('stop move');
	    }).fail(function(r){
		console.error(r);
	    });
	}

	el_controls_zoom_switcher.onclick = function(){
		self.player.classList.toggle('showing-zoom');
		self.player.classList.remove('showing-settings');
		self.player.getElementsByClassName('cloudplayer-selectcliptime')[0].style.display = "none";
		self.player.getElementsByClassName('cloudplayer-selectbackuptime')[0].style.display = "none";
		if(self.calendar){
			self.calendar.hideCalendar();
			var el_timelineCalendar = self.player
				.getElementsByClassName('cloudcameratimeline-calendar')[0];
			if (el_timelineCalendar) el_timelineCalendar.classList.remove("shadowed");
		}
	};

	el_controls_ptz_switcher.onclick = function(){
		if (mPosition == -1) {
			el_player.classList.toggle('showing-ptz');
		}
	};

	el_controls_get_shot.onclick = function(){
		self._getSnapshot();
	};

	el_controls_microphone.onclick = function() {
		if (mPosition == -1) {
			self._sendBackwardAudio();
		}
	};

	el_clipcreatebtn.onclick = function(){
		var el_selectcliptime = self.player.getElementsByClassName('cloudplayer-selectcliptime')[0];
		el_selectcliptime.style.display = "none";
		var b = el_selectcliptime.getElementsByClassName('clipbefore')[0];
		var e = el_selectcliptime.getElementsByClassName('clipafter')[0];
		if (isNaN(b.value) || isNaN(e.value)){
			alert('"Before" and "after" fields must contain a number');
			return;
		}
		b = parseInt(b.value);
		e = parseInt(e.value);
		if (b<0 || e<0){
			alert('"Before" and "after" fields must be above or equal 0');
			return;
		}
		if (b+e<10){
			alert('Min clip length is 10 seconds');
			return;
		}
		if (b+e>3600){
			alert('Max clip length is 1 hour (3600 seconds)');
			return;
		}

		e = e>3600 ? 3600 : e;
		self._getShareClip(b,e);
	}

	el_controls_get_clip.onclick = function(){
		if (shareClipInterval) {
			alert('Please wait until your previous clip making will completely finished');
			return;
		}
		if (mPosition == -1) {
			alert("Select a position with the recorded video on the timeline");
			return;
		}
		var el_selectcliptime = self.player.getElementsByClassName('cloudplayer-selectcliptime')[0];
		if (el_selectcliptime.style.display == "block")
			el_selectcliptime.style.display = "none";
		else {
			el_selectcliptime.style.display = "block";
			self.player.classList.remove('showing-zoom', 'showing-settings');
		}

//		var cld = el_selectcliptime.getElementsByClassName('clipdt')[0];
//		cld.innerText = _formatTimeCameraRecords(mPosition);
	};

	el_controls_sd_backup.onclick = function(){
		var el_selectcliptime = self.player.getElementsByClassName('cloudplayer-selectbackuptime')[0];
		if (el_selectcliptime.style.display == "block") {
			el_selectcliptime.style.display = "none";
			self.sdControls = false;
		}
		else {
			el_selectcliptime.style.display = "block";
			if (mPosition == -1) el_player_synctime.innerHTML = new Date().toLocaleString();
			else el_player_synctime.innerHTML = new Date(mPosition).toLocaleString();
			self.player.classList.remove('showing-zoom', 'showing-settings');
			self.sdControls = true;
		}
	};

	el_sdcardbackupbtn.onclick = function(){
		var el_selectbackuptime = self.player.getElementsByClassName('cloudplayer-selectbackuptime')[0];
		el_selectbackuptime.style.display = "none";
		var dur = el_selectbackuptime.getElementsByClassName('backupduration')[0];
		if (isNaN(dur.value)){
			alert('"Duration" field must contain a number');
			return;
		}
		dur = parseInt(dur.value);
		if (dur<0){
			alert('"Duration" field must be above or equal 0');
			return;
		}
		if (dur>3600){
			alert('Max backup length is 1 hour (3600 seconds)');
			return;
		}

		dur = dur>3600 ? 3600 : dur;
		self._getSdBackup(dur);
	}

	el_toggle_sd_sync.onclick = function() {
		var curVal = this.getAttribute("enabled") == "true" ? true : false;
		self._toggleSync(!curVal);
	}

	function showTimelapseControls (isShow) {
		mTimelapseControlsContainer_el.style.display = (isShow)?"flex":"none";
	}

	el_record_mode.onclick = function() {
		if (el_record_mode.classList.contains('mode-records')){
			el_record_mode.classList.remove('mode-records');
			el_record_mode.classList.add('mode-timelapse');
			showTimelapseControls(true);
			mRecordMode = "timelapse";
		} else {
			el_record_mode.classList.add('mode-records');
			el_record_mode.classList.remove('mode-timelapse');
			showTimelapseControls(false);
			mRecordMode = "records";
		}
		self.play();
	}

	el_timelapse_left.onclick = function(){
		console.log('TODO: timelapse left');
		if (mTimelapsePlayer) {
			mPlaying = true;

			mTimelapsePlayer.rewind(self.time);
		}
	}
	el_timelapse_pause.onclick = function(){
		console.log('TODO: timelapse pause');
		if (mTimelapsePlayer) {
			mStopped = false;
			mPlaying = false;
			mTimelapsePlayer.pause();
		}
	}
	el_timelapse_right.onclick = function(){
		console.log('TODO: timelapse right');
		if (mTimelapsePlayer) {
			mPlaying = true;

			mTimelapsePlayer.fastforward(self.time);
		}
	}

	mElSettings_wantWebRTC.onclick = function(){
		if (options.useOnlyPlayerFormat !== undefined) {
		    return;
		}

		self.setPlayerFormat('webrtc');
		self.play();
	}
	mElSettings_wantFlash.onclick = function(){
		if (options.useOnlyPlayerFormat !== undefined) {
		    return;
		}

		self.setPlayerFormat('flash');
		self.play();
	}
	mElSettings_wantHTML5.onclick = function(){
		if (options.useOnlyPlayerFormat !== undefined) {
		    return;
		}

		self.setPlayerFormat('html5');
		self.play();
	}
	mElSettings_wantJpeg.onclick = function(){
		if (options.useOnlyPlayerFormat !== undefined) {
		    return;
		}
		self.setPlayerFormat('jpeg');
		self.play();
	}

	//mElSettings_circular_fisheye_on.onclick = function(){
	//	mElSettings_circular_fisheye_on.classList.add('selected');
	//	mElSettings_circular_fisheye_off.classList.remove('selected');
	//	self.pano.start();
	//}
	//mElSettings_circular_fisheye_off.onclick = function(){
	//	mElSettings_circular_fisheye_off.classList.add('selected');
	//	mElSettings_circular_fisheye_on.classList.remove('selected');
	//	self.pano.stop();
	//}


	if(self.isMobile){
		mElSettings_wantFlash.style.display = 'none';
	}

	function _updatePlayerFormatUI(live_urls) {
		live_urls = live_urls || {};
		mElSettings_wantWebRTC.style.display = (!CloudHelpers.isIE() && (live_urls.rtc || live_urls.webrtc)) ? '' : 'none';
		//hide rtmp as Flash-player cause Flash is going to be hide
		mElSettings_wantFlash.style.display = 'none';//(!self.isMobile && live_urls.rtmp) ? '' : 'none';
		mElSettings_wantHTML5.style.display = (live_urls.hls) ? 'block' : 'none';
		mElSettings_wantJpeg.style.display = (live_urls.hls) ? 'block' : 'none';
		// UI
		mElSettings_wantWebRTC.classList.remove('selected');
		mElSettings_wantFlash.classList.remove('selected');
		mElSettings_wantHTML5.classList.remove('selected');
		mElSettings_wantJpeg.classList.remove('selected');

		if(self.mPlayerFormat == 'webrtc'){
			mElSettings_wantWebRTC.classList.add('selected');
			mElSettings_selected_format_container.textContent = mElSettings_wantWebRTC.textContent;
		} else if(self.mPlayerFormat == 'flash'){
			mElSettings_wantFlash.classList.add('selected');
			mElSettings_selected_format_container.textContent = mElSettings_wantFlash.textContent;
		} else if(self.mPlayerFormat == 'html5'){
			mElSettings_wantHTML5.classList.add('selected');
			mElSettings_selected_format_container.textContent = mElSettings_wantHTML5.textContent;
		} else if(self.mPlayerFormat == 'jpeg'){
			mElSettings_wantJpeg.classList.add('selected');
			mElSettings_selected_format_container.textContent = mElSettings_wantJpeg.textContent;
		}
	}

	_updatePlayerFormatUI();

	/* element for black screen */

	var mElementPlayerBlackScreen = self.player.getElementsByClassName('cloudplayer-black-screen')[0];
	function _showBlackScreen(){
		if(CloudHelpers.isFireFox()){
			console.warn("in firefox not good solution for a hiding adobe flash player");
		}else{
			mElementPlayerBlackScreen.style.display = "block";
		}
	}

	function showPTZButton(button_element, state){
		button_element.style.display = state;
	}


	function _hideBlackScreen(){
		mElementPlayerBlackScreen.style.display = "";
	}

	_hideloading();

	self._showerror = function(err){
		console.error(err);
		self._setError(err);
		self.showErrorText(err.text);
		console.error(err.text);
		mCallbacks.executeCallbacks(CloudPlayerEvent.ERROR, err);
	}
	self._showConsoleError = function(err) {
		console.error(err);
		console.error(err.text);
	}

	/*
	 * Poling time Start/Stop
	 * */

	var _timeWaitStartStreamMax = 30;
	var _timeWaitStreamMax = 15; // if video stopped and wait for restart

	var _source_type = null;

	function _formatTimeMS(t){
		var t_ = t;
		var sec = t % 60;
		t = (t - sec)/60;
		var min = t % 60;
		// t = (t - min)/60;
		return ("00" + min).slice(-2) + ":" + ("00" + sec).slice(-2);
	}

	function _formatTimeLive(){


		var offset = 0;
//		if (self.mSrc.type == 'camera' && self.m.useTimezone) {
//			offset = CloudHelpers.getOffsetTimezone(self.m.useTimezone);
//		} else if(self.mSrc.type == 'camera'){
//			offset = CloudHelpers.getOffsetTimezone(self.mSrc.getTimezone());
//		}
		offset = - new Date().getTimezoneOffset()*60*1000;

		var now = new Date();

		var offset_time = now.getTime() + offset;
		if (offset_time < 0 || Number.isNaN(offset_time)) {
			return "";
		}

		now.setTime(offset_time);
		var hours = now.getUTCHours();
		var suffix = '';
		if (self.options['timelineampm']) {
			suffix = hours>=12 ? ' pm' : ' am';
			hours = hours==0 ? 12 : (hours>12 ? hours-12 : hours);
		}
		var res = ""
			+ " " + ("0000" + now.getUTCFullYear()).slice(-4)
			+ "-" + ("00" + (now.getUTCMonth() + 1)).slice(-2)
			+ "-" + ("00" + now.getUTCDate()).slice(-2)
			+ " " + ("00" + hours).slice(-2)
			+ ":" + ("00" + now.getUTCMinutes()).slice(-2)
			+ ":" + ("00" + now.getUTCSeconds()).slice(-2) + suffix;
		return res;
	}

	function _formatTimeCameraRecords(t){
		var offset = 0;
//		if (self.mSrc.type == 'camera' && self.m.useTimezone) {
//			offset = CloudHelpers.getOffsetTimezone(self.m.useTimezone);
//		} else if(self.mSrc.type == 'camera'){
//			offset = CloudHelpers.getOffsetTimezone(self.mSrc.getTimezone());
//		}
		offset = - new Date().getTimezoneOffset()*60*1000;

		var now = new Date();

		var offset_time = t + offset;
		if (offset_time < 0 || Number.isNaN(offset_time)) {
			return "";
		}

		now.setTime(offset_time);

		var hours = now.getUTCHours();
		var suffix = '';
		if (self.options['timelineampm']) {
			suffix = hours>=12 ? ' pm' : ' am';
			hours = hours==0 ? 12 : (hours>12 ? hours-12 : hours);
		}
		var res = ""
			+ " " + ("0000" + now.getUTCFullYear()).slice(-4)
			+ "-" + ("00" + (now.getUTCMonth() + 1)).slice(-2)
			+ "-" + ("00" + now.getUTCDate()).slice(-2)
			+ " " + ("00" + hours).slice(-2)
			+ ":" + ("00" + now.getUTCMinutes()).slice(-2)
			+ ":" + ("00" + now.getUTCSeconds()).slice(-2) + suffix;
		return res;
	}

	function _calculateTime(){
		if(mPosition != -1){
/*
			if (mEnablePlaybackNative) {
				return Math.floor(mCurrentPlayRecord.startUTC + mPlaybackPlayer1.currentTime()*1000);
			}
			return mCurrentPlayRecord.startUTC + self.vjs.currentTime()*1000;
*/
		}
		return Math.floor(self.vjs.currentTime());
	}

	function _checkAndFixVideoSize(){

		var h = self.vjs.videoHeight();
		var w = self.vjs.videoWidth();

		if(mVideoSizeLive.w != w || mVideoSizeLive.h != h){
			// console.log("_checkAndFixVideoSize");
			// console.log("video h = " + h + ", w = " + w);

			// fix resizing
			setTimeout(function(){
				var el = self.vjs.el();
				if (!el){
				    return;
				}
				var o = el.getElementsByTagName('object')[0];
				if(o){
					o.style['width'] = "calc(100% - 5px)";
					setTimeout(function(){
						o.style['width'] = "";
					},1000);
				}
			},1000);

			mVideoSizeLive.w = w;
			mVideoSizeLive.h = h;
		}
	}

	function _beforePlay() {
	    console.log('before play');
	    self._hideSnapshot(true);
	}


	function _stopPolingTime(){
		clearInterval(mCurrentTimeInterval);
		//el_player_time.innerHTML = "";
	}


	function _startPolingTime(){
		console.warn("[PLAYER] Start poling player time");
		clearInterval(mCurrentTimeInterval);

		mCurrentTimeInterval = setInterval(function(){
			if(mPlaying && !mStopped){
				var curr_time = 0;
				if(_source_type == 'camera_records') {
					if (mRecordMode === "timelapse") {
						curr_time = mTimelapsePlayer.getcurrtime();
					} else {
						//curr_time = mCurrentPlayRecord.startUTC + mCurrentRecord_vjs.currentTime()*1000;
						curr_time = Number(mVxgcloudplayer.currentUtcTime);
					}
				} else if(_source_type == 'camera_live') {
					// TODO webrtc
					if (mUsedPlayer == 'webrtc0' || mUsedPlayer == 'webrtc2') {
						curr_time = mWebRTC_el ? mWebRTC_el.currentTime : 0;
					} else if (mUsedPlayer == 'native-hls') {
						curr_time = mNativeHLS_el ? mNativeHLS_el.currentTime : 0;
					} else if (mUsedPlayer == 'jpeg') {
						curr_time = mJpegPlayer.getcurrtime();
					} else {
						try {
							curr_time = self.vjs.currentTime()*1000
						} catch (e) {
							console.error("Ignore: ", e);
						}
						try {
							_checkAndFixVideoSize();
						} catch(e) {
							// silent exception
						}
					}
				} else {
					try {
						curr_time = self.vjs.currentTime()*1000;
					} catch (e) {
						console.error("Ignore: ", e);
					}
				}
				if (curr_time == self.time) {
					_showloading( self.options.loaderTimeout || 0 );
					mTimeWaitStartStream++;
					if ( self.time == 0 && mTimeWaitStartStream > _timeWaitStartStreamMax) {
						self.stop("by_poling_time_1");
						// self.callOnStateChange(vxgcloudplayer.states.PLAYER_STOPPED);
						if (self.mPlayerFormat === 'webrtc') {
						    self.stop("by_setError");
						    self.play();
						} else {
						    self.count_ERROR_STREAM_UNREACHABLE = (self.count_ERROR_STREAM_UNREACHABLE|0)+1;
						    if (self.count_ERROR_STREAM_UNREACHABLE>3){
							    self._showerror(CloudReturnCode.ERROR_STREAM_UNREACHABLE);
								self.count_ERROR_STREAM_UNREACHABLE=0;
						    } else {
							    console.warn("[PLAYER] stream unreachable: restart count" + self.count_ERROR_STREAM_UNREACHABLE);
							    self.stop("by_setError");
							    self.play();
						    }
						}
					} else if((self.time != 0 && mTimeWaitStartStream > _timeWaitStreamMax)) {
						// restart player
						console.warn("Restart player");
						self.stop("by_poling_time_2");
						// fix if need start in current position
						if (mPosition != -1 && self.time > mPosition) {
							mPosition = Math.floor(self.time);
						}
						self.play();
					} else {
						if(_source_type == 'camera_records') {
						    if (mRecordMode === "timelapse"){
							if ( CloudHelpers.getCurrentTimeUTC() - curr_time < 180000) {
								mTimelapsePlayer.pause();
								setTimeout(function(){
									self.setPosition( CloudPlayer.POSITION_LIVE );
									self.play();
								}, 10);
							}
						    }
						} else {
							if (self.time == 0 || mPosition != -1) {
//								_showloading( self.options.loaderTimeout || 0 );
								_showloading();
							}
							if (mUsedPlayer == 'jpeg') {
							} else {
								console.warn("[PLAYER] Wait stream " + mTimeWaitStartStream);
							}
						}
					}
				} else {
					self.count_ERROR_STREAM_UNREACHABLE = 0;
					mTimeWaitStartStream = 0;
					self.mShowedBigPlayButton == false;
					mElBigPlayButton.style.display = "none";

					if (_source_type == 'camera_records') {
						self.time = curr_time;
						mPosition = self.time; // remember last success position
						if (mVxgcloudplayer.isPlaying()){
							el_player_time.innerHTML = _formatTimeCameraRecords(self.time);
							el_player_cliptime.innerHTML = el_player_time.innerHTML;
						}
					} else if (_source_type == 'camera_live') {
						self.time = curr_time;
						el_player_time.innerHTML = _formatTimeLive();
						if(self.isRange() && CloudHelpers.getCurrentTimeUTC() > mRangeMax){
							_stopPolingTime();
							self.stop("by_ended_timerange2");
							mCallbacks.executeCallbacks(CloudPlayerEvent.RANGE_ENDED, {});
						}
					} else {
						if(mPosition == -1){
							self.time = self.vjs.currentTime()*1000;
						}else{
							self.time = mCurrentPlayRecord.startUTC + self.vjs.currentTime()*1000;
						}
						el_player_time.innerHTML = _formatTimeLive();
						// self.callOnStateChange(vxgcloudplayer.states.PLAYER_PLAYING);
					}
					if (self.time != 0) {
						_hideloading();
					}
					_hideerror();
				}
				if(self.isRange() && self.time > mRangeMax){
					mPosition = mRangeMin;
					_stopPolingTime();
					self.stop("by_ended_timerange");
					mCallbacks.executeCallbacks(CloudPlayerEvent.RANGE_ENDED, {});
				}
				// el_player_time.innerHTML = _calculateTime();
			}else{
				_hideloading();
				// hide time when pause
				// el_player_time.innerHTML = "";
			}
		},1000);
	}

/*
	function _prepareNextCameraRecord(){
		if(mCurrentPlayRecord != null){
			var _currEnd = mCurrentPlayRecord.endUTC;
			var start = CloudHelpers.formatUTCTime(_currEnd - CloudHelpers.ONE_SECOND*5);
			mNextPlayRecord = null;
			if(self.isRange() && start > mRangeMax){
				return;
			}
			if (mConn._getAPI() == null) {
				return;
			}
			mConn._getAPI().storageRecordsFirst(self.mSrc.getID(), start, 3).done(function(r){
				if (r.meta.total_count == 0) {
					mNextPlayRecord = null;
				} else {
					// console.log(r.objects);
					var len = r.objects.length;
					for (var i = 0; i < len; i++) {
						var nextRec = r.objects[i];
						if (nextRec.size < 500) {
							console.error("mNextPlayRecord less than 500 bytes, skip ", nextRec)
							continue;
						}

						nextRec.startUTC = CloudHelpers.parseUTCTime(nextRec.start);
						nextRec.endUTC = CloudHelpers.parseUTCTime(nextRec.end);
						if (nextRec.endUTC > _currEnd && nextRec.startUTC < _currEnd) {
							console.warn("[CloudPlayer] found trashold segment in " + (nextRec.startUTC - _currEnd) + " ms, segment", nextRec);
						}

						if (nextRec.startUTC >= (_currEnd - mTrasholdPlayback) && mNextPlayRecord == null) {
							mNextPlayRecord = r.objects[i];
							// console.log("mNextPlayRecord: ", mNextPlayRecord);
							var _url = mNextPlayRecord.url;
							if (_url.indexOf('http://') == 0) {
								_url = _url.replace("http://", (location.protocol=="file:"?"http:":location.protocol) + "//");
							}
							mNextRecord_vjs.reset()
							mNextRecord_vjs.src([{src: _url, type: 'video/mp4'}])
							mNextRecord_vjs.off('loadeddata');
							mNextRecord_vjs.on('loadeddata', function(){
								mNextRecord_vjs.pause();
							});
							break;
						}
					}
				}
			});
		}else{
			mNextPlayRecord = null;
		}
	}
*/


	mVxgcloudplayer.addEventListener("playing", function(event) {
		console.log('mVxgcloudplayer callback status is playing');
	});

	mVxgcloudplayer.addEventListener("pause", function(event) {
		console.log('mVxgcloudplayer callback status is pause');
	});


	mVxgcloudplayer.addEventListener("statusupdate", function(event) {
		console.log('mVxgcloudplayer callback status is ' + event.status);
		if (event.status==='error') {
			if ($(mVxgcloudplayer).hasClass('camera_side_error')) self.showErrorText('Camera side error');
			if ($(mVxgcloudplayer).hasClass('sync_timeout_error')) self.showErrorText('Sync timeout');
			if ($(mVxgcloudplayer).hasClass('sync_error')) self.showErrorText('Syncronization error');
			else self.showErrorText('Error');
			self.pause();
		}
	});


	function _loadCameraRecords_vxg_cloud_player(_uniqPlay, event) {
		console.log("TODO: play records:" + event);
		setTimeout(function(){
		    _hideloading();
		},1000);

		_stopPolingTime();
		if (mVxgcloudplayer) {
			_source_type = 'camera_records';
			mVxgcloudplayer.parentElement.style.zIndex = -1;
			mVxgcloudplayer.parentElement.style.opacity = 1;

			mVxgcloudplayer.setTimePromise(mPosition).then(function(){
				_startPolingTime();
			}).catch(function(){
			});
			if (event === 'timepicker') {
				mPausing = false;
				self.pause();
			} else {
				mPausing = true;
				self.pause();
			}
/*
			_stopPolingTime();
			_startPolingTime();

			mVxgcloudplayer.currentTime = mPosition;
			mVxgcloudplayer.parentElement.style.zIndex = -1;

			if (event === 'timepicker') {
				mPausing = false;
				self.pause();
			} else {
				mPausing = true;
				self.pause();
			}
*/		}
	}

/*
	function _loadCameraRecords(_uniqPlay){
		if(self.mSrc.type != 'camera'){
			self._showerror(CloudReturnCode.ERROR_INVALID_SOURCE);
			return;
		}
		if(self.updateAudioCaps){
			self.updateAudioCaps(self.mSrc.getID());
		}
		_updatePlayerFormatUI();
		_source_type = 'camera_records';
		var pos = mPosition;
		var start = CloudHelpers.formatUTCTime(pos - CloudHelpers.ONE_MINUTE*2);
		var nLimit = 25;
		if (mConn._getAPI() == null) {
			return;
		}
		mConn._getAPI().storageRecordsFirst(self.mSrc.getID(), start, nLimit).done(function(r){
			if(_uniqPlay != mUniqPlay) {
				console.warn("_uniqPlay not current [[_loadCameraRecords fail]]");
				return;
			}
			// console.log(r);
			var len = r.objects.length;
			mCurrentPlayRecord = null;
			var firstRecordAfterT = null;
			// console.log("pos = " + pos);
			// console.log("start - 2 min = " + start);
			_hideBlackScreen();
			var nCountAfterT = 0;
			if (len == 0) {
				setTimeout( function() {
					self.setPosition(CloudPlayer.POSITION_LIVE);
					self.play();
					mCallbacks.executeCallbacks(CloudPlayerEvent.POSITION_JUMPED, { new_pos: CloudHelpers.getCurrentTimeUTC() });
				},10);
				return;
			}
			for(var i = 0; i < len; i++){
				rec = r.objects[i];
				if (rec.size < 500) {
					console.error("Record less than 500 bytes will be skip ", rec);
					continue;
				}

				rec.startUTC = CloudHelpers.parseUTCTime(rec.start);
				rec.endUTC = CloudHelpers.parseUTCTime(rec.end);
				// console.log("rec = ", rec);
				// console.log("pos = ", pos);
				// console.log("pos = ", pos);

				if (firstRecordAfterT == null && rec.startUTC > pos) {
					firstRecordAfterT = rec;
					console.log("firstRecordAfterT selected ", firstRecordAfterT);
				}

				if (rec.startUTC > pos) {
					nCountAfterT++;
				}
				if (pos > rec.endUTC || pos < rec.startUTC) {
					continue;
				}
				// console.log("rec2: ", rec);

				if(mCurrentPlayRecord == null && pos >= rec.startUTC && pos <= rec.endUTC){
					mCurrentPlayRecord = rec;
					// console.log("mCurrentPlayRecord selected ", mCurrentPlayRecord);
					break;
				}

				if (self.isRange()) {
					if (rec.startUTC > mRangeMax) {
						break;
					}
					// console.log("rec2: ", rec);
					if (mCurrentPlayRecord == null && pos < rec.startUTC && rec.startUTC < mRangeMax) {
						mCurrentPlayRecord = rec;
						pos = rec.startUTC;
						break;
					}
				}
			}

			// move to first close record
			var bSendEventPositionJumped = false;
			if(mCurrentPlayRecord == null && firstRecordAfterT != null){
				// need callback to timeline moveto
				if (!self.isRange() || (self.isRange() && firstRecordAfterT.startUTC < mRangeMax)) {
					mCurrentPlayRecord = firstRecordAfterT;
					pos = firstRecordAfterT.startUTC;
					bSendEventPositionJumped = true;
				}
			}

			// console.log("mCurrentPlayRecord selected2 ", mCurrentPlayRecord);

			//if(self.isRange() && mCurrentPlayRecord == null){
			//	for(var i = 0; i < len; i++){
			//		rec = r.objects[i];
			//		rec.startUTC = CloudHelpers.parseUTCTime(rec.start);
			//		rec.endUTC = CloudHelpers.parseUTCTime(rec.end);
			//		if (rec.startUTC > mRangeMax) {
			//			break;
			//		}
			//		// console.log("rec2: ", rec);
			//		if(mCurrentPlayRecord == null && pos < rec.startUTC && rec.startUTC < mRangeMax){
			//			mCurrentPlayRecord = rec;
			//			pos = rec.startUTC;
			//			break;
			//		}
			//	}
			//}

			// move to live if records not found
			if (!self.isRange() && mCurrentPlayRecord == null && nCountAfterT == 0) {
// [CNVR-1826]
//				setTimeout( function() {
//					self.setPosition(CloudPlayer.POSITION_LIVE);
//					self.play();
//					mCallbacks.executeCallbacks(CloudPlayerEvent.POSITION_JUMPED, { new_pos: CloudHelpers.getCurrentTimeUTC() });
//				},10);
//
				return;
			}

			if (mCurrentPlayRecord == null) {
				_hideloading();
				self._showerror(CloudReturnCode.ERROR_RECORDS_NOT_FOUND);
				_stopPolingTime();
				return;
			}

			if (_uniqPlay != mUniqPlay) {
				console.warn("_uniqPlay not current [[_loadCameraRecords fail]]");
				return;
			}

			if (self.isRange() && pos > mRangeMax) {
				_hideloading();
				_stopPolingTime();
				self.stop("by_ended_time_range_2");
				mCallbacks.executeCallbacks(CloudPlayerEvent.RANGE_ENDED, {});
				return;
			}

			if (bSendEventPositionJumped) {
				self.time = pos;
				mCallbacks.executeCallbacks(CloudPlayerEvent.POSITION_JUMPED, {new_pos: pos});
			}

			//

			mCurrentRecord_vjs = mPlaybackPlayer1;
			mNextRecord_vjs = mPlaybackPlayer2;

			if (mEnablePlaybackNative) {
				mCurrentRecord_vjs.el().style.display = "block";
				mNextRecord_vjs.el().style.display = "none";
				self.vjs.el().style.display = "none";
				mCurrentRecord_vjs.onAutoplayBlocked = self.playbackAutoplayBlocked;
			} else {
				mCurrentRecord_vjs.el().style.display = "";
				mNextRecord_vjs.el().style.display = "none";
			}

			// console.log("mCurrentPlayRecord: ", mCurrentPlayRecord);
			_prepareNextCameraRecord();

			mCurrentRecord_vjs.off('loadeddata');
			mCurrentRecord_vjs.ready(function() {
				var _url = mCurrentPlayRecord.url;
				if (_url.indexOf('http://') == 0) {
					_url = _url.replace("http://", (location.protocol=="file:"?"http:":location.protocol) + "//");
				}
				mCurrentRecord_vjs.src([{src: _url, type: 'video/mp4'}]);
				var stime =  pos - mCurrentPlayRecord.startUTC;
				var len_time = mCurrentPlayRecord.endUTC - mCurrentPlayRecord.startUTC;
				console.log(mCurrentPlayRecord);
				console.log("mCurrentRecord_vjs: " +  stime + " / " + len_time);
				mCurrentRecord_vjs.currentTime(Math.floor(stime/1000));
				mCurrentRecord_vjs.play();
			});

			// vxgcloudplayer.vjs_play(vcp);
			mCurrentRecord_vjs.off('ended');
			mNextRecord_vjs.off('ended');

			function swithPlayers() {
				console.warn("ended");
				// stop records
				if(self.isRange() && mNextPlayRecord == null){
					console.warn("stop player");
					_hideloading();
					_stopPolingTime();
					self.stop("by_ended_time_range_3");
					mCallbacks.executeCallbacks(CloudPlayerEvent.RANGE_ENDED, {});
					return;
				}

				if (mNextPlayRecord != null) {
					var t = mCurrentRecord_vjs;
					mCurrentRecord_vjs = mNextRecord_vjs;
					mNextRecord_vjs = t;

					if (mEnablePlaybackNative) {
						mCurrentRecord_vjs.el().style.display = "block";
						mNextRecord_vjs.el().style.display = "none";
						self.vjs.el().style.display = "none";
					} else {
						mCurrentRecord_vjs.el().style.display = "";
						mNextRecord_vjs.el().style.display = "none";
					}

					mCurrentPlayRecord = mNextPlayRecord;
					mNextPlayRecord = null;
					// console.warn("url: " + mCurrentPlayRecord.url);
					mCurrentRecord_vjs.ready(function(){
						mCurrentRecord_vjs.play();
					});
					_prepareNextCameraRecord();
				}
			}

			mCurrentRecord_vjs.on('ended', swithPlayers);
			mNextRecord_vjs.on('ended', swithPlayers);
			_startPolingTime();
		});
	}
*/

	function _loadRecords(_uniqPlay, event){
		if(!self.mSrc){
			self._showerror(CloudReturnCode.ERROR_SOURCE_NOT_CONFIGURED);
			return;
		}
		mTimeWaitStartStream = 0;
		if(self.mSrc.type == 'camera'){
//			_loadCameraRecords(_uniqPlay);
			_loadCameraRecords_vxg_cloud_player(_uniqPlay, event);
		}else{
			self._showerror(CloudReturnCode.ERROR_INVALID_SOURCE);
		}
	}

	function _loadTimelapse(_uniqPlay){
		if(!self.mSrc){
			self._showerror(CloudReturnCode.ERROR_SOURCE_NOT_CONFIGURED);
			return;
		}

		if(self.mSrc.type == 'camera'){
			_source_type = 'camera_records';
			mTimelapsePlayer_el.style.display = '';
			mTimelapsePlayer.play(300, mPosition);
			_startPolingTime();
		}else{
			self._showerror(CloudReturnCode.ERROR_INVALID_SOURCE);
		}
	}

	// function _loadCameraStatus(_uniqPlay){
	// }

	function _loadLiveUrl(_uniqPlay){
		if(_uniqPlay != mUniqPlay) {
			console.warn("_uniqPlay not current [cameraLiveUrls fail]");
			return;
		}

		if(!self.mSrc){
			console.error("[CloudPlayer] source not set");
			self.setError(100);
			return;
		}

		if(self.mSrc._origJson()['status'] != 'active'
		){
			if (self.m.waitSourceActivation == 0
			&& self.mSrc._origJson()['status'] != 'setsource'
			){
				self._showerror(CloudReturnCode.ERROR_CAMERA_OFFLINE);
				//self.player.querySelector(".cloudplayer-calendar-container").classList.add("offline");
				//self.player.querySelector(".cloudplayer-controls-container").classList.add("offline");
				mCallbacks.executeCallbacks(CloudPlayerEvent.CHANNEL_STATUS, {status: "offline"});
			}
			_startPolingCameraStatus(_uniqPlay);
			return;
		}

		mTimeWaitStartStream = 0;
		if(self.mSrc.type == 'camera'){
			// start
			_startPolingCameraStatus(_uniqPlay);
			self._polingLoadCameraLiveUrl(_uniqPlay);
		} else {
			console.error("[CloudPlayer] invalid source");
			self.setError(100);
		}
	}

	/*
	 * Public functions
	 * */
	self.showErrorText = function(text){
		_hideloading();
		mElError.style.display = "block";
		mElErrorText.style.display = "inline-block";
		mElErrorText.innerHTML = text;
		_hideBlackScreen();
	}

	self.getCalendarContent = function() {
		return mElementCalendar;
	}

	self.setAccessToken = function( accessToken) {
	    mAccessToken = accessToken;

	}

	self.checkTokenExpire = function() {
		var now		= CloudHelpers.getCurrentTimeUTC();
		var expire	= CloudHelpers.parseUTCTime(mAccessTokenExpire);

		var delta = expire - now;
		if (delta < 5*60*1000) {
			mCallbacks.executeCallbacks(CloudPlayerEvent.ACCESS_TOKEN_EXPIRED_IN_5MIN, delta);
		} else {
			setTimeout(function(){
				self.checkTokenExpire();
			}, 5000);
		}
	}

	self.setAccessTokenExpire = function( expire ) {
		mAccessTokenExpire = expire;
		if ((mAccessTokenExpire != null) && (mAccessTokenExpire !== undefined)) {
			setTimeout (function(){
				self.checkTokenExpire();
			}, 5000 );
		}
	}

	self.mPoster = null;
	self.setSource = function(src){
		_hideerror();
		clearInterval(mPolingCameraStatus);
		el_player_time.innerHTML = "";

		return new Promise (function(resolve, reject) {

			self.mSrc = src;
			if (self.mSrc == null) {
				mElementPlay.style.display = "none";
				mConn = null;
			} else {
				mElementPlay.style.display = "inline-block";
				mConn = src._getConn();
			}
			var origjs = self.mSrc._origJson();
			self.mSrc._origJson()['status'] = 'setsource';

			if(self.isRange()){
				var cur_time = CloudHelpers.getCurrentTimeUTC();
				if (mRangeMin < cur_time && cur_time < mRangeMax) {
					self.setPosition(CloudPlayer.POSITION_LIVE);
				} else {
					self.setPosition(mRangeMin);
				}
			}else{
				self.setPosition(CloudPlayer.POSITION_LIVE);
			}
			mCallbacks.executeCallbacks(CloudPlayerEvent.SOURCE_CHANGED);
			/*binary*/
			var el_player = self.player;//document.querySelector('.cloudplayer');
			if (!el_player) {
				return;
			}
			el_player.classList.remove('showing-ptz');

			var el_controls_ptz_switcher	= self.player.getElementsByClassName('cloudplayer-show-ptz')[0];
			var el_controls_get_clip	= self.player.getElementsByClassName('cloudplayer-get-clip')[0];
			var el_controls_sd_backup	= self.player.getElementsByClassName('cloudplayer-sd-backup')[0];
			var el_sdcardtogglebtn = self.player.getElementsByClassName('enable-disable-sdcard')[0];
			var el_controls_get_shot	= self.player.getElementsByClassName('cloudplayer-get-shot')[0];
			var el_controls_microphone	= self.player.getElementsByClassName('cloudplayer-microphone')[0];

			var el_settings_quality = self.player.getElementsByClassName('cloudplayer-info-player-quality')[0];

			if (self.mSrc && self.mSrc._origJson().access.indexOf('all') < 0 ) {
						el_controls_ptz_switcher.style.display = 'none';
						el_controls_get_clip.style.display = 'none';
			} else {
				//binary: ptz check abit later
				if (!self.options.disableGetClip || self.options.disableGetClip == false) {
				if (!CloudHelpers.isIE()) {
					el_controls_get_clip.style.display = 'block';
				}
				}
			}
			if (!self.options.disableGetShot || self.options.disableGetShot == false) {
				if (!CloudHelpers.isIE()) {
					el_controls_get_shot.style.display = 'block';
				}
			}

			if (self.options.disableSdCard === false) {
				if (!CloudHelpers.isIE()) {
					el_controls_sd_backup.style.display = 'block';
				}
			}

			if (mConn) {
				var camid = self.mSrc.getID();
				mConn._getAPI().getCamera2(camid).done(function(camInfo) {
					var toggleSync = self.player.getElementsByClassName('mem_rec_hide');
					if (!camInfo.memorycard_recording) {
						for (var i = 0; i < toggleSync.length; i ++) { toggleSync[i].style.display = "block" }
						el_sdcardtogglebtn.innerHTML = "Enable Sync from Timeline";
						el_sdcardtogglebtn.setAttribute("enabled", false);
					} else {
						for (var i = 0; i < toggleSync.length; i ++) { toggleSync[i].style.display = "none" }
						el_sdcardtogglebtn.innerHTML = "Enable SD Card Backup";
						el_sdcardtogglebtn.setAttribute("enabled", true);
					}
				});

				mTimelapsePlayer.setApi(mConn._getAPI());

				var el_controls_ptz_top = self.player.getElementsByClassName('ptz-top')[0];
				var el_controls_ptz_bottom = self.player.getElementsByClassName('ptz-bottom')[0];
				var el_controls_ptz_left = self.player.getElementsByClassName('ptz-left')[0];
				var el_controls_ptz_right = self.player.getElementsByClassName('ptz-right')[0];
				var el_controls_ptz_zoom_in = self.player.getElementsByClassName('ptz-zoom-plus')[0];
				var el_controls_ptz_zoom_out = self.player.getElementsByClassName('ptz-zoom-minus')[0];

				if (self.options.livePoster && self.options.livePoster == true) {
					mConn._getAPI().cameraPreview(self.mSrc.getID())
					.done(function(res){
					let cur_vtag = self.getCurrentVideoTag();
					var videotags = self.player.getElementsByClassName('allvideotags')[0];
					var vtags = videotags.getElementsByTagName('video');
					self.mPoster  = res.url;
					for (var i =0; i < vtags.length; i++) {
						vtags[i].setAttribute('poster', self.mPoster);
					}
					self.vjs.poster(self.mPoster);
					}).fail(function(err){
					});
				}

				mConn._getAPI().cameraPtz(self.mSrc.getID()).done(function(r){
				console.log(r);
				var actions = r.actions;
				self.mPTZActions = actions;
				if ((actions !== undefined) && (actions != null) && (actions.length > 0)){
					if (self.mPTZShow) {
					el_controls_ptz_switcher.style.display = 'block';
					}
					el_controls_ptz_top.style.display = actions.indexOf("top") > -1 ? 'block' : 'none';
					el_controls_ptz_bottom.style.display = actions.indexOf("bottom") > -1 ? 'block' : 'none';
					el_controls_ptz_left.style.display = actions.indexOf("left") > -1 ? 'block' : 'none';
					el_controls_ptz_right.style.display = actions.indexOf("right") > -1 ? 'block' : 'none';
					el_controls_ptz_zoom_in.style.display = actions.indexOf("zoom_in") > -1 ? 'block' : 'none';
					el_controls_ptz_zoom_out.style.display = actions.indexOf("zoom_out") > -1 ? 'block' : 'none';
				} else {
					el_controls_ptz_switcher.style.display = 'none';
					self.mPTZActions = null;
				}
				}).fail(function(r){
					console.log(r);
					el_controls_ptz_switcher.style.display = 'none';
					self.mPTZActions = null;
				});
				if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) { //check the ability capture audio
				if (self.options.disableBackwardAudio !== true) {
					mConn._getAPI().cameraAudio(self.mSrc.getID()).done( function(answer){
						console.log(answer);
						if (answer.caps !== undefined && answer.caps.backward_formats !== undefined && answer.caps.backward_formats.length > 0) {
							mBackwardAudioFormats = answer.caps.backward_formats;
							el_controls_microphone.classList.remove('disabled');
						} else {
							el_controls_microphone.classList.add('disabled');
						}
					}).fail(function(err){
						console.log('Backward channel request:' + err);
						el_controls_microphone.classList.add('disabled');
					});
				}
				} else {
				el_controls_microphone.classList.add('disabled');
				}
				if (mAccessToken && mVxgcloudplayer) {
				mVxgcloudplayer.setAttribute('src', mAccessToken);
				mVxgcloudplayer.pause().then(function(){
					console.log("vxgcloudplayer pause");
				}).catch(function(err){
					console.log("vxgcloudplayer catch:" + err);
				});

				mConn._getAPI().cameraMediaStreams(self.mSrc.getID()).done(function(media_streams) {
						mainResId = media_streams.rec_ms_id;
						liveResId = media_streams.live_ms_id;
						if  (media_streams.hasOwnProperty('mstreams_supported') )
							 {
								for (const obj of media_streams.mstreams_supported) {
									if  ( obj.vs_id.indexOf("JPEG") === -1 )
									{
										if (obj.id == mainResId )
											mainVsId = obj.vs_id;
										else if (obj.id == liveResId)
											liveVsId = obj.vs_id;
									}
								}
							 }
						if (mainResId == liveResId) el_settings_quality.style.display = "none";
						else {
							streamQuality = "main";
							$(".selected-quality").html("Main");
							$(".quality-main").addClass("selected");
							$(".quality-live").removeClass("selected");
							el_settings_quality.style.display = "flex";
						}
						resolve();
					}).fail(function(r){
						console.log(r);
					});
				}
			}
		})
		/*binary*/
	}

	self.getSource = function(){
		return self.mSrc
	}

	self.removeCallback = function(uniqname){
		mCallbacks.removeCallback(uniqname);
	}

	self.addCallback = function(uniqname, func){
		mCallbacks.addCallback(uniqname, func);
	}

	self.onTimelineEndUpdate = function () {
		if (mPosition == -1 && mStopped && _isShowedError()) {
			console.warn("TODO Restart live if some errors happends");
			self.play();
		}
	}

	self.playbackAutoplayBlocked = function() {
		if (mPosition == -1)  {
			console.warn("Skip error player already in live mode");
			return;
		}
/*
		_stopPolingTime();
		try {
		    mPlaybackPlayer1.pause();
		} catch(e) {
		    console.warn("_vjs_play: skip error", e);
		}
		mTimeWaitStartStream = 0;
		// TODO show PlayButton
		console.warn('_vjs_play. is mobile or autoplay not allowed. show big button');
		mShowedBigPlayButton = true;
		mElBigPlayButton.style.display = "block";
		mElBigPlayButton.onclick = function(event){
			mEvent = event;
			mElBigPlayButton.style.display = "none";
			var v = mCurrentRecord_vjs.el().getElementsByTagName('video')[0];
			if(v){
				v.setAttribute('webkit-playsinline', true);
				v.setAttribute('playsinline', true);
			}
			mShowedBigPlayButton = false;
			mTimeWaitStartStream = 0;
			mCurrentRecord_vjs.play();
			_stopPolingTime();
			_startPolingTime();
		}
*/
	}

	function _vjs_play_live() {
		console.log("[PLAYER] _vjs_play_live, mEvent: ", mEvent);
		// if(!mEvent && !CloudHelpers.autoPlayAllowed){
		mElBigPlayButton.style.display = "none";

		function startVideo() {
			var safari_and_hls = mSafariAndHlsNotStarted == 'pause'; // mUsedPlayer == 'hls' && CloudHelpers.isSafari();
			var is_mobile = CloudHelpers.isIOS() || CloudHelpers.isAndroid();
			var bFrameAndHLS = false;//CloudHelpers.isFrame() && CloudHelpers.useHls();
			var bChromeAndHLS = CloudHelpers.isChrome() && !CloudHelpers.autoPlayAllowed && self.mPlayerFormat == 'html5';
			// CloudHelpers.useHls();
			// console.warn('_vjs_play bFrameAndHLS', bFrameAndHLS);
			// console.warn('_vjs_play CloudHelpers.useHls()', CloudHelpers.useHls());
			// console.warn('_vjs_play CloudHelpers.isFrame()', CloudHelpers.isFrame());
			// console.warn('_vjs_play mEvent', mEvent);

			/*
			if (!mEvent && (is_mobile || safari_and_hls || bFrameAndHLS || bChromeAndHLS)) {
				_stopPolingTime();
				try {
				    self.vjs.pause();
				} catch(e) {
				    console.warn("_vjs_play_live: skip error", e);
				}
				mTimeWaitStartStream = 0;
				// TODO show PlayButton
				console.warn('_vjs_play. is mobile or autoplay not allowed. show big button');
				mShowedBigPlayButton = true;
				mElBigPlayButton.style.display = "block";
				mElBigPlayButton.onclick = function(event){
					mEvent = event;
					mElBigPlayButton.style.display = "none";
					if(document.getElementById('player1_vjs_Html5_api')){
						document.getElementById('player1_vjs_Html5_api').setAttribute('webkit-playsinline', true);
						document.getElementById('player1_vjs_Html5_api').setAttribute('playsinline', true);
					}
					mShowedBigPlayButton = false;
					mTimeWaitStartStream = 0;
					self.vjs.play();
					_stopPolingTime();
					_startPolingTime();
				}
				console.log('vjs_play ');
			} else {
			*/
				self.vjs.play();
				_stopPolingTime();
				_startPolingTime();
			/*}*/
		}

		if (CloudHelpers.isChrome() && !CloudHelpers.autoPlayAllowed && self.mPlayerFormat == 'html5') {
			// refresh status autoPlayAllowed
			CloudHelpers.checkAutoplay(startVideo);
		} else {
			startVideo();
		}
	}

	self.setPlayerFormat = function(sMode){
		sMode = sMode.toLowerCase();
		if(sMode != 'webrtc' && sMode != 'flash' && sMode != 'html5' && sMode != 'jpeg'){
			console.error("Player format expected 'webrtc' or 'flash' or 'html5'");
			return;
		}
		self.mPlayerFormat = sMode;
		try {
			localStorage.setItem("preferred_player_format", self.mPlayerFormat);
		}catch(e){
			console.error("[CloudPlayer] error save format: ", e)
		}
		_updatePlayerFormatUI();
	}

	self.getPlayerFormat = function(){
		return sMode;
	}

	var shareClipInterval = null;

	self._shareClipCallback = function( inProcess, description, clipinfo) {
	    var el_controls_get_clip	= self.player.getElementsByClassName('cloudplayer-get-clip')[0];
	    if (inProcess) {
		if(description === 'CloudShareClip in process..'){
		    alert('The video is being prepared ...');
		}
		el_controls_get_clip.classList.add('inprocess');
	    } else {
		if (shareClipInterval != null) {
			clearInterval(shareClipInterval);
			shareClipInterval = null;
		}
		el_controls_get_clip.classList.remove('step1');
		el_controls_get_clip.classList.remove('step2');
		el_controls_get_clip.classList.remove('step3');
		el_controls_get_clip.classList.remove('step4');
		el_controls_get_clip.classList.remove('inprocess');
	    }
	    if (clipinfo !== undefined) {
		console.log("ShareClipInfo: " + clipinfo.url);
		var downloadLink = document.createElement('a');
		downloadLink.setAttribute('href', clipinfo.url);
		downloadLink.click();
	    } else {
		console.log("ShareClipInfo: " + description);
	    }
	}

	self._getShareClip = function(b,a) {
	    var cloudcamera = self.mSrc;
	    var position = mPosition;
	    if (position == -1) {
		//while clipshare is possible for live mode, it can needs alot of time to prepare clip, so it's disabled for the moment
		alert("Select a position with the recorded video on the timeline");
		return;
		var now = new Date();
		position = now.getTime();
	    }
            position -= b*1000;
	    var shareclip = self.player.getElementsByClassName('cloudplayer-share-clip')[0];

	    if ((shareclip !== undefined )
	    &&  (cloudcamera !== undefined)
	    &&  (mAccessToken && (mAccessToken !== undefined))
	    ) {
		shareclip.createClip( cloudcamera, mAccessToken, self._shareClipCallback, position, (a+b)*1000 );
		shareClipInterval = setInterval( function(){
			var el_controls_get_clip = self.player.getElementsByClassName('cloudplayer-get-clip')[0];
			if (el_controls_get_clip.classList.contains('inprocess')) {
				if (el_controls_get_clip.classList.contains('step1')) {
					el_controls_get_clip.classList.remove('step1');
					el_controls_get_clip.classList.add('step2');
				} else if (el_controls_get_clip.classList.contains('step2')) {
					el_controls_get_clip.classList.remove('step2');
					el_controls_get_clip.classList.add('step3');
				} else if (el_controls_get_clip.classList.contains('step3')) {
					el_controls_get_clip.classList.remove('step3');
					el_controls_get_clip.classList.add('step4');
				} else if (el_controls_get_clip.classList.contains('step4')) {
					el_controls_get_clip.classList.remove('step4');
					el_controls_get_clip.classList.add('step1');
				} else {
					el_controls_get_clip.classList.add('step1');
				}
			} else {
				el_controls_get_clip.classList.remove('step1');
				el_controls_get_clip.classList.remove('step2');
				el_controls_get_clip.classList.remove('step3');
				el_controls_get_clip.classList.remove('step4');
			}
		}, 500);
	    }
	}

	self._getSdBackup = function(dur) {
	    var cloudcamera = self.mSrc;
	    var position = mPosition;
		var start, end;
	    if (position == -1) {
			// if it's live, it should start at live - dur
			end = new Date().getTime();
			start = end - (dur * 1000);
	    } else {
			start = position;
			end = position + (dur * 1000);
		}

		var start_dt = CloudHelpers.formatUTCTime(start);
		var end_dt = CloudHelpers.formatUTCTime(end);

		if ((cloudcamera !== undefined) && (mAccessToken && (mAccessToken !== undefined))) {
			var vcp = self.player.getElementsByTagName('vxg-cloud-player')[0];
			vcp.player.camera.get_v4_storage_records({start: start_dt, end: end_dt}).then(function(records) {
				var cloudRecords = records.objects;
				var sd_loading = self.player.getElementsByClassName("cloudplayer-sd-backup")[0];
				var rot = 0;
				var loading = setInterval(function() {
					rot = rot + 45 == 360 ? 0 : rot + 45;
					sd_loading.style.transform = `rotate(${rot}deg)`
				}, 500)
				var startBackup_el = self.player.getElementsByClassName("sdcardbackupbtn")[0];
				var toggleSync_el = self.player.getElementsByClassName("enable-disable-sdcard")[0];
				startBackup_el.classList.add("sd-backup-disable");
				toggleSync_el.classList.add("sd-backup-disable");
				var backup_result_el = self.player.querySelector(".cloudplayer-selectbackuptime .mem_rec_hide #backup_result")

				vcp.player.storage.sdStorageAndCheck(start_dt, end_dt).then(function(sdStorageData) {
					var syncCalls = vcp.player.storage.overlapArray(start_dt, end_dt, cloudRecords);
					if (syncCalls.length == 0) syncCalls.push({start: start_dt, end: end_dt});

					if (sdStorageData.length == 0) {
						startBackup_el.classList.remove("sd-backup-disable");
						toggleSync_el.classList.remove("sd-backup-disable");
						var noSd = $('<p id="no-sd-data" style="width: 100%; text-align: center;">No SD Card Data Found</p>')
						backup_result_el.append(noSd[0]);
						noSd = self.player.querySelector(".cloudplayer-selectbackuptime .mem_rec_hide #backup_result #no-sd-data")
						sd_loading.style.transform = `rotate(0deg)`
						clearInterval(loading);
						setTimeout(function() {noSd.remove();}, 5000);
						return;
					} else syncCalls = vcp.player.storage.gapsInSDCard(sdStorageData, syncCalls);

					var chunkedCalls = vcp.player.storage.chunkSyncCalls(syncCalls);
					var progress_el = $('<progress id="backup-progress" value="0" max="100" style="width: 100%; height: 15px;" ></progress>');
					backup_result_el.append(progress_el[0]);
					var progress_incr = 100 / chunkedCalls.length;
					progress_el = self.player.querySelector(".cloudplayer-selectbackuptime .mem_rec_hide #backup_result #backup-progress")

					const allCalls = chunkedCalls.reduce(
						(p, range) =>
							p.then(() => vcp.player.storage.syncAndCheck(range.start, range.end, progress_el, progress_incr)),
						Promise.resolve()
					);

					const final = Promise.resolve(allCalls).then(function() {
						startBackup_el.classList.remove("sd-backup-disable");
						toggleSync_el.classList.remove("sd-backup-disable");
						sd_loading.style.transform = `rotate(0deg)`
						clearInterval(loading);
						setTimeout(function() {
							progress_el.remove();
						}, 15000)
					}, function(err) {
						sd_loading.style.transform = `rotate(0deg)`
						clearInterval(loading);
						console.log(err.responseText)
					})
				})
			})
	    }
	}

	self._toggleSync = function(mem_rec) {
		var cloudcamera = self.mSrc;
		if ((cloudcamera !== undefined) && (mAccessToken && (mAccessToken !== undefined))) {
			cloudcamera.toggleMemRec(mem_rec, mAccessToken);
			var toggleSync = self.player.getElementsByClassName('mem_rec_hide');
			var el_sdcardtogglebtn = self.player.getElementsByClassName('enable-disable-sdcard')[0];
			if (!mem_rec) {
				for (var i = 0; i < toggleSync.length; i ++) { toggleSync[i].style.display = "block" }
				el_sdcardtogglebtn.innerHTML = "Enable Sync from Timeline";
				el_sdcardtogglebtn.setAttribute("enabled", false);
			}
			else {
				for (var i = 0; i < toggleSync.length; i ++) { toggleSync[i].style.display = "none" }
				el_sdcardtogglebtn.innerHTML = "Enable SD Card Backup";
				el_sdcardtogglebtn.setAttribute("enabled", true);
			}
	    }
	}

	self._onResize  = function() {
	    var element = self.player.getElementsByClassName('cloudplayer-snapshot')[0];
	    var allvideotags = self.player.getElementsByClassName('allvideotags')[0];

	    if (element !== undefined) {
		element.setAttribute('width', allvideotags.clientWidth);
		element.setAttribute('height', allvideotags.clientHeight);
	    }
	}
	self._onResize();

	window.addEventListener("resize", self._onResize);

	self._getSnapshot = function () {
	    if (self.player) {
		var stub = self.player.getElementsByClassName('cloudplayer-stub-snapshot')[0];
		var videotag = null;
		/*
		if (mUsedPlayer === "hls") {
		    videotag = self.player.getElementsByClassName('vjs-tech')[0];
		} else if (mUsedPlayer === "webrtc2") {
		    videotag = self.player.getElementsByClassName('cloudplayer-webrtc')[0];
		}
		*/

		var videotags = self.player.getElementsByClassName('allvideotags')[0];
		var vtags = videotags.getElementsByTagName('video');
		for (var i =0; i < vtags.length; i++) {
		    var el = vtags[i];
		    var isDisp = el.currentStyle ? el.currentStyle.display :  getComputedStyle(el, null).display;
		    var isParentDisp = el.parentElement.currentStyle ? el.parentElement.currentStyle.display :  getComputedStyle(el.parentElement, null).display;
		    if (el.classList.contains('vjs-tech')) {
			isDisp = isParentDisp;
		    }
		    if (isDisp === 'block' || isDisp === 'inline-block') {
			videotag = el;
			break;
		    }
		}
		if (videotag == null
		&& mPosition != CloudHelpers.POSITION_LIVE
		&& mVxgcloudplayer != null
		) {
			videotag = mVxgcloudplayer.getVideo();
			if (videotag.src == null || videotag.src == "" || videotag.readyState!=4) {
				if (videotag.poster != null && videotag.poster != "" ) {
					fetch(videotag.poster).then(function(resp){
						return resp.blob();
					})  .then(blob => {
						const url = window.URL.createObjectURL(blob);
						const a = document.createElement('a');
						a.style.display = 'none';
						a.href = url;
						a.download = 'snapshot.jpg';
						document.body.appendChild(a);
						a.click();
						window.URL.revokeObjectURL(url);
					}).catch(function(){});
				}
				return;
			}
		}

		if (videotag != null ) {
		    var width 	= videotag.videoWidth ;
		    var height	= videotag.videoHeight;
                    if (width==0) width = videotag.clientWidth;
                    if (height==0) height = videotag.clientHeight;
		    if ((width > 0) && (height > 0)) {
			stub.setAttribute('width', width);
			stub.setAttribute('height', height);
			context = stub.getContext('2d');
			if (context != null) {
			    context.fillRect(0, 0, width, height);
			    context.drawImage(videotag, 0, 0, width, height);
			    if (stub.msToBlob !== undefined) {
				try {
					var blob = stub.msToBlob();
					window.navigator.msSaveOrOpenBlob(blob, 'snapshot.png');
				} catch (e) {
					console.warn("Can't create snapshot due error: " + e.toString());
				}
			    } else {
				var downloadLink = document.createElement('a');
				downloadLink.setAttribute('download', 'snapshot.png');
				stub.toBlob(function(blob) {
				    var url = URL.createObjectURL(blob);
				    downloadLink.setAttribute('href', url);
				    downloadLink.click();
				});
			    }

			}
		    }
		}
	    }
	}

	self._hideSnapshot = function (isHidden) {
	    if (self.player) {
		var element = self.player.getElementsByClassName('cloudplayer-snapshot')[0];
		var videotag = null;
		if( isHidden) {
			$(element).addClass("hidden");
		} else {
			$(element).removeClass("hidden");
		}

		var vtags = self.player.getElementsByTagName('video');
		for (var i =0; i < vtags.length; i++) {
		    var el = vtags[i];
		    var isDisp = el.currentStyle ? el.currentStyle.display :  getComputedStyle(el, null).display;
		    var isParentDisp = el.parentElement.currentStyle ? el.parentElement.currentStyle.display :  getComputedStyle(el.parentElement, null).display;
		    if (el.classList.contains('vjs-tech')) {
			isDisp = isParentDisp;
		    }
		    if (isDisp === 'block' || isDisp === 'inline-block') {
			videotag = el;
			break;
		    }
		}

		if (videotag != null) {
		    var dx = 0, dy = 0;
		    var width, height;

		    var videow = width  = videotag.videoWidth;
		    var videoh = height = videotag.videoHeight;

		    var canvasw = element.getAttribute('width');
		    var canvash = element.getAttribute('height');

		    var ratio = videow / videoh;
		    if (ratio >= 1) {
			width = canvasw;
			height = width / ratio;
			dx = 0;
			dy = (canvash - height)/2;
		    } else {
			height = canvash;
			width = height * ratio;
			dy = 0;
			dx = (canvasw - width)/2;
		    }

		    //console.log("Snapshot resolution: " + width + "x" + height + " for:" + mUsedPlayer);

		    context = element.getContext('2d');
		    if (context != null) {
			context.fillRect(dx, dy, width, height);
			context.drawImage(videotag, dx, dy, width, height);
		    }
		}
	    }
	}

	var backwardPlayer = null;

	self.sendBackwardAudio = function() {
	    if (self.options.disableBackwardAudio === true) {
		console.warn("Backward audio is disabled by configuration");
		return -1;
	    }
	    if (mPosition != CloudHelpers.POSITION_LIVE)  {
		console.warn("Can't control backward audio while player isn't LIVE mode");
		return -2;
	    }
	    if (mBackwardAudioFormats === undefined) {
		console.warn("Camera doesn't supports backward audio");
		return -3;
	    }
	    self._sendBackwardAudio();
	    return 0;
	}

	self._sendBackwardAudio = function(isStarted) {
		var element		= self.player.getElementsByClassName('cloudplayer-microphone')[0];
		var pseudoplayer	= self.player.getElementsByClassName('cloudplayer-backward-webrtc')[0];
		if (self.isBackwardAudioStarted == true) {
			console.log('TODO: Stop bw_audio');
			element.classList.remove("prepare");
			element.classList.remove("onair");
			self.isBackwardAudioStarted = false;
			if (backwardPlayer != null) {
				backwardPlayer.stopWS();
				backwardPlayer = null;
			}
		} else {
			console.log('TODO: Start bw_audio');
			mConn._getAPI().cameraBackwardUrls(self.mSrc.getID()).done(function(live_urls){
				console.log(live_urls);
				if (live_urls.webrtc_backward !== undefined) {
					//element.classList.add("onair");
					element.classList.add("prepare");
					self.isBackwardAudioStarted = true;

					backwardPlayer = new CloudPlayerWebRTC2(
						pseudoplayer,
						live_urls.webrtc_backward.connection_url,
						live_urls.webrtc_backward.ice_servers, {send_video: false, send_audio: true}
					);
					backwardPlayer.onServerError = function(event){
						element.classList.remove("onair");
						self.isBackwardAudioStarted = false;
						console.error("[WebRTC] Event error ", event);
						backwardPlayer.stopWS();
					}
					backwardPlayer.onStartStreaming = function() {
						console.log('afterIce');
						element.classList.remove("prepare");
						element.classList.add("onair");
					}
					backwardPlayer.startWS();
				}
			}).fail(function(r){
				console.log(r);
			});
		}
	}

	self.setPosition = function(t){
		mPosition = t;

		showTimelapseControls(false);

		if(mPosition == -1){
			if (options.useOnlyPlayerFormat === undefined){
				self.enableModeSetting();
			}
			self.collapseMenu();

			mLiveModeAutoStart = true;
			el_controls_ptz_switcher.classList.remove('inactive');
			el_controls_microphone.classList.remove('inactive');
			if (self.mPTZActions != null && self.mPTZShow) {
				el_controls_ptz_switcher.style.display = 'block';
			}
			el_record_mode.style.display = "none";
		} else {
			self.disableModeSetting();
			self.collapseMenu();

			self.time = t;
			el_player_time.innerHTML = _formatTimeCameraRecords(self.time);

			self.player.classList.remove('showing-ptz');
			el_controls_ptz_switcher.classList.add('inactive');
			el_controls_microphone.classList.add('inactive');

			el_record_mode.classList.remove('mode-timelapse');
			el_record_mode.classList.add('mode-records');
			/*Binary timelapse debug mode*/
			if (self.options !== undefined && self.options.debugTimelapse !== undefined) {
				el_record_mode.style.display = '';
			}
			mRecordMode = "records";

			setTimeout(function(){
				if (self.isBackwardAudioStarted == true) {
					self._sendBackwardAudio();
				}
			}, 100);
		}
	}

	// apply option position
	if(options["position"] !== undefined){
		self.setPosition(mPosition);
	}

	var pause_time = 0;
	self.getPosition = function(){
		if (mPlaying) {
			if (mPosition == -1) {
				if ((mUsedPlayer == 'webrtc0' || mUsedPlayer == 'webrtc2')
					&& mWebRTC_el && mWebRTC_el.currentTime != 0){
					return CloudHelpers.getCurrentTimeUTC() + (mConn ? mConn.getServerTimeDiff() : 0);
				} else if(mUsedPlayer == 'native-hls' && mNativeHLS_el && mNativeHLS_el.currentTime != 0) {
					return CloudHelpers.getCurrentTimeUTC() + (mConn ? mConn.getServerTimeDiff() : 0);
				} else if(mUsedPlayer == 'jpeg' ) {
					return CloudHelpers.getCurrentTimeUTC() + (mConn ? mConn.getServerTimeDiff() : 0);
				} else if( (mUsedPlayer != 'webrtc0' && mUsedPlayer != 'webrtc2')
					&& self.vjs && self.vjs.currentTime() != 0){
					return CloudHelpers.getCurrentTimeUTC() + (mConn ? mConn.getServerTimeDiff() : 0);
				}
				return 0;
			} else if(self.time == 0) {
				return mPosition;
			}
			return Math.floor(self.time);
		} else if (mPausing ){
			return pause_time;
		}
		return 0;
	}

	self.isLive = function(){
		return mPosition == -1 && !mStopped;
	}

	self.play = function(event){
		if ( mPlaying ){
			self.stop("by_play");
		} else {
			self._reset_players();
		}

		if (self.mSrc.type != 'camera') {
			self._showerror(CloudReturnCode.ERROR_INVALID_SOURCE);
			return;
		}
		mUniqPlay = Math.random();
		mEvent = event;
		console.warn("[PLAYER] mUniqPlay: " + mUniqPlay);
		//el_stop.style.display = "inline-block";
		el_pause.classList.remove('hidden');
		el_pause.classList.remove('play');
		mElementPlay.style.display = "none";

		mStopped = false;
		mPlaying = true;
		mPausing = false;
		_stopPolingTime();
		//_startPolingTime();
		//self._reset_players();
		_hideerror();

		// reset position to start of range
		if (self.isRange() && mPosition == -1 && CloudHelpers.getCurrentTimeUTC() > mRangeMax) {
			mPosition = mRangeMin;
		}

		// reset position to start of range
		if (self.isRange() && mPosition > mRangeMax) {
			mPosition = mRangeMin;
		}

		mCallbacks.executeCallbacks(CloudPlayerEvent.PLAYED, event);

		if(mPosition == -1){
			_loadLiveUrl(mUniqPlay);
			mCallbacks.executeCallbacks(CloudPlayerEvent.POSITION_JUMPED, {new_pos: CloudHelpers.getCurrentTimeUTC()});
		}else{
			if (mRecordMode === "records") {
				console.warn("Try load records from " + CloudHelpers.formatUTCTime(mPosition));
				_loadRecords(mUniqPlay, event);
			} else {
				console.log('TODO: timelapse');
				_loadTimelapse(mUniqPlay);
			}
		}
//		_showloading();
		if (mRecordMode !== "records") { //vxgcloudplayer has it's own loader
			_showloading( self.options.loaderTimeout || 0 );
		}
	}

	self.pause = function(event) {
	    mStopped = false;

	    if (mPausing == false) {
		pause_time = self.getPosition();
		mPausing = true;
		mPlaying = false;
		el_pause.classList.add('play');
		if (mPosition == -1) {
		    if ( self.mPlayerFormat == 'webrtc'){
			if (mWebRTC0_Player != null) {
			    mWebRTC0_Player.pause();
			} else if (mWebRTC2_Player != null) {
			    mWebRTC2_Player.pause();
			}
		    } else if (self.mPlayerFormat == 'jpeg') {
			if (mJpegPlayer) {
			    mJpegPlayer.pause();
			}
		    } else {
			self.vjs.pause();
		    }
		} else {
//		    mPlaybackPlayer1.pause();
//		    mPlaybackPlayer2.pause();
		    mVxgcloudplayer.pause().then(function(result){
			console.log('pause: vxgcloudplayer pause ok');
		    }).catch(function(exception){
			console.log('pause: vxgcloudplayer pause cathc');
		    });
		}
	    } else {
		mPausing = false;
		mPlaying = true;
		el_pause.classList.remove('play');
		if (mPosition == -1) {
		    if ( self.mPlayerFormat == 'webrtc'){
			if (mWebRTC0_Player != null) {
			    mWebRTC0_Player.play();
			} else if (mWebRTC2_Player != null) {
			    mWebRTC2_Player.play();
			}
		    } else if (self.mPlayerFormat == 'jpeg') {
			if (mJpegPlayer) {
			    var redrawPeriod = self.options.jpegRedrawPeriod || 1000;
			    mJpegPlayer.play( mConn._getAPI(), self.mSrc, redrawPeriod );
			}
		    } else {
			self.vjs.play();
		    }
		} else {
//		    mPlaybackPlayer1.play();
//		    mPlaybackPlayer2.play();
		    mVxgcloudplayer.play().then(function(result){
			mPlaying = true;
			console.log('pause: vxgcloudplayer play ok');
		    }).catch(function(exception){
			console.log('pause: vxgcloudplayer play cathc');
		    });
		}
	    }
	}

	self.getImages = function() {
		if (mConn) {
			var options = {};
			var now = new Date();
			var time = now.getTime();
			var utctime = CloudHelpers.formatUTCTime(time);

			options.order_by = "-time";
			options.limit = 5;
			options.end = utctime;

			mConn._getAPI().cameraImages(options).done(function(result){
				console.log('done');
			}).fail( function( err ){
				console.log('error');
			});
		}
	}

	self.stop = function(who_call_stop){
		console.log("[PLAYER] stop called " + who_call_stop);
		mUniqPlay = null; // stop any async requests or ignore results
		mStopped = true;
		mPlaying = false;
		mPausing = false;
		mLiveModeAutoStart = false;

		clearInterval(mPolingCameraStatus);
		mCallbacks.executeCallbacks(CloudPlayerEvent.STOPED, who_call_stop);

		if ((	   (who_call_stop === 'by_webrtc2_error')
			|| (who_call_stop === 'by_webrtc0_error')
		    )
		    || (   (who_call_stop === 'by_setError')
			&& (self.mPlayerFormat === 'webrtc')
		    )
		) {
		    self.mPlayerFormat = 'html5';
		}

		console.log("[PLAYER] self.stop: somebody call");
		if (who_call_stop === 'by_plrsdk_3'){
			self.mPoster = null;
		}

		if (who_call_stop != 'by_destroy') {
			self._reset_players();
		}
/*
		if (mNativeVideo1_el != null) {
			mNativeVideo1_el.style.display = 'none';
		}

		if (mNativeVideo2_el != null) {
			mNativeVideo2_el.style.display = 'none';
		}
*/
		if (who_call_stop === 'by_plrsdk_1'){
			//self.mSrc = null;
			_hideerror();

			if (mVxgcloudplayer){
				mVxgcloudplayer.setAttribute('src','');
				mVxgcloudplayer.setTimePromise(Date.now());
			}
		}

		if(mWebRTC0_Player != null){
			mWebRTC0_Player.stopWS();
			mWebRTC_el.style.display = 'none';
		};

		if(mWebRTC2_Player != null){
			mWebRTC2_Player.stopWS();
			mWebRTC_el.style.display = 'none';
		};

		if (mNativeHLS_Player != null) {
			mNativeHLS_Player.stop();
			mNativeHLS_el.style.display = 'none';
		}
		if (mJpegPlayer != null) {
			mJpegPlayer.stop();
			mJpegPlayer_el.style.display = "none";
		}

		el_stop.style.display = "none";
		mElementPlay.style.display = "inline-block";
		el_pause.classList.add('hidden');
		_stopPolingTime();
		clearInterval(mExpireHLSTimeInterval);
		self._stopPolingMediaTicket();

		if (who_call_stop !== 'by_play') { //prevent loader's wink on reset-play
			_hideloading();
		}
		// vxgcloudplayer.stopPolingCameraLife();
		// self.stopPolingFlashStats();
		// self.currentRecordsList = undefined;
		// self.currentCamID = 0;
	}

	self.close = function(){
		self.stop("by_close");
		clearInterval(self.currentTime);
		clearInterval(mPolingCameraStatus);
		// TODO stop any context
	}

	self.destroy = function(){
		document.removeEventListener('click', self.onDocumentClick);
		self.stop("by_destroy");
		self.pano.stop();
		delete self.pano;

		clearInterval(self.currentTime);
		clearInterval(mPolingCameraStatus);
		self.vjs.dispose();
		//self.vjs2.dispose();
		delete window._cloudPlayers[self.elid];

		if (mVxgcloudplayer){
			mVxgcloudplayer.setAttribute('src','');
			//mVxgcloudplayer.invalidate();
		}

		self.player.onwebkitfullscreenchange = null;
		self.player.onmozfullscreenchange = null;
		self.player.onfullscreenchange = null;
		self.player.onfullscreenchange = null;

		if (self.f_callbackFullscreenFunc) {
		    self.f_callbackFullscreenFunc = null;
		}
	}


	self.error = function(){
		return self.mLastError || -1;
	}

	self.onError = function(callback){
		mCallback_onError = callback;
	}

	self.onChannelStatus = function(callback){
		mCallback_onChannelStatus = callback;
	}

	self._setError = function(error){
		setTimeout(function(){
			self.stop("by_setError");
			mElError.style.display = "block";
			mElErrorText.style.display = "inline-block";
		},10);
		self.mLastError = error;
		if(mCallback_onError){
			mCallbacks.executeCallbacks(CloudPlayerEvent.ERROR, error)
			setTimeout(function(){ mCallback_onError(self, error); },10);
		}
		// vxgcloudplayer.trigger('error', [self, error]);
	}

	self.setRange = function(startPos,endPos){
		console.warn("[PLAYER] setRange");
		mRangeMin = startPos;
		mRangeMax = endPos;
		// TODO check
	}

	// apply options
	if (options["range"] !== undefined) {
		var rangeMin = parseInt(options["range"]["min"], 10);
		var rangeMax = parseInt(options["range"]["max"], 10);
		self.setRange(rangeMin, rangeMax);
	}

	self.isRange = function(){
		return mRangeMin != -1 && mRangeMax != -1;
	}

	self.resetRange = function(){
		console.warn("[PLAYER] resetRange");
		mRangeMin = -1;
		mRangeMax = -1;
	}

	self._showZoomControl = function (isShow) {
		if (isShow) {
			el_controls_zoom_switcher.style.display = 'block';
			el_controls_zoom.style.display = 'block';
		} else {
			el_controls_zoom_switcher.style.display = 'none';
			el_controls_zoom.style.display = 'none';
		}
	}

	self.showPTZControl = function (isShow) {
		self.mPTZShow = isShow;
		if (isShow) {
			if ((self.mPTZActions !== undefined) && (self.mPTZActions != null) && (self.mPTZActions.length > 0)){
				el_controls_ptz_switcher.style.display = 'block';
			}
		}  else {
			el_controls_ptz_switcher.style.display = 'none';
		}
	}

	/* end public functions */
	function _applyFuncTo(arr, val, func) {
		//for (var i in arr) {
		for(var i = 0 ; i < arr.length; i++){
			func(arr[i], val);
		}
	}

	function _initZoomControls(){
		self.currentZoom = 0;

		var el_showzoom_button =  self.player.getElementsByClassName('cloudplayer-show-zoom')[0];
		var el_controls_zoom = self.player.getElementsByClassName('cloudplayer-controls-zoom')[0];
		var el_controls_zoom_position = self.player.getElementsByClassName('cloudplayer-controls-zoom-position')[0];
		var el_zoomUp = self.player.getElementsByClassName('cloudplayer-zoom-up')[0];
		var el_zoomDown = self.player.getElementsByClassName('cloudplayer-zoom-down')[0];
		var el_zoomProgress = self.player.getElementsByClassName('cloudplayer-zoom-progress')[0];
		var el_zoomPositionCursor = self.player.getElementsByClassName('cloudplayer-zoom-position-cursor')[0];

		var _players = [];
		_players.push(document.getElementById(elid + '_vjs'));
		//_players.push(document.getElementById(elid + '_vjs2'));
//		_players.push(mNativeVideo1_el);
//		_players.push(mNativeVideo2_el);
		_players.push(self.player.getElementsByClassName('cloudplayer-webrtc')[0]);
		_players.push(self.player.getElementsByClassName('cloudplayer-jpeg')[0]);
		_players.push(self.player.getElementsByClassName('cloudplayer-vxgcloudplayer')[0]);

		if(self.options.disableZoomControl && self.options.disableZoomControl == true){
			el_controls_zoom_switcher.style.display = 'none';
		}

		self.zoomCursorDownBool = false;
		self.zoomCursorX = 0;
		self.zoomCursorY = 0;
		self.zoomCursorWidth = 176;
		self.zoomCursorHeight = 160;
		self.zoomControlsWidth = 0;
		self.zoomControlsHeight = 0;

		self.setNewZoom = function(v) {
			if(v >= 30){ v = 30; }
			if(v <= 10){ v = 10; }

			if (self.currentZoom != v) {
				self.currentZoom = v;
				var _scale_transform = "scale(" + (self.currentZoom/10) + ")";
				_applyFuncTo(_players, _scale_transform, function(plr_el, val) {
					plr_el.style.transform = val;
				});
				el_zoomPositionCursor.style.transform = "scale(" + (10/self.currentZoom) + ")";
				el_zoomProgress.className = el_zoomProgress.className.replace(/zoom\d+x/g,'zoom' + Math.ceil(self.currentZoom) + 'x');
				el_controls_zoom_position.style.display = self.currentZoom == 10 ? "none" : "";
				el_zoomPositionCursor.style.left = '';
				el_zoomPositionCursor.style.top = '';

				_applyFuncTo(_players, '', function(plr_el, val) {
					plr_el.style.left = val;
					plr_el.style.top = val;
				});
			}
		}

		self.setNewZoom(10);

		self.zoomUp = function() {
			self.setNewZoom(self.currentZoom + 5)
		}
		self.zoomDown = function() {
			self.setNewZoom(self.currentZoom - 5);
		}
		self.zoomProgressDownBool = false;
		self.zoomProgressDown = function(e) {
			self.zoomProgressDownBool = true;
		}

		self.zoomProgressMove = function(e){
			if(self.zoomProgressDownBool == true){
				var y = e.pageY - CloudHelpers.getAbsolutePosition(e.currentTarget).y;
				var height = el_zoomProgress.offsetHeight;
				var steps = height/5;
				y = 10*(Math.floor((height-y)/steps)/2 + 1);
				self.setNewZoom(y);
			}
		}
		self.zoomProgressLeave = function(e){
			self.zoomProgressDownBool = false;
		}
		self.zoomProgressUp = function(e){
			if(self.zoomProgressDownBool == true){
				var y = e.pageY - CloudHelpers.getAbsolutePosition(e.currentTarget).y;
				var height = el_zoomProgress.offsetHeight;
				var steps = height/5;
				y = 10*(Math.floor((height-y)/steps)/2 + 1);
				self.setNewZoom(y);
			}
			self.zoomProgressDownBool = false;
		}

		self.zoomCursorDown = function(e){
			if (e.pageX === undefined) {
				e.pageX = e.touches[0].pageX;
			}
			if (e.pageY === undefined) {
				e.pageY = e.touches[0].pageY;
			}
			self.zoomCursorX = e.pageX;
			self.zoomCursorY = e.pageY;
			self.zoomCursorWidth = el_zoomPositionCursor.offsetWidth;
			self.zoomCursorHeight = el_zoomPositionCursor.offsetHeight;
			self.zoomControlsWidth = el_controls_zoom_position.offsetWidth;
			self.zoomControlsHeight = el_controls_zoom_position.offsetHeight;
			self.zoomCursorDownBool = true;
		}

		self.zoomCursorUp = function(e){
			console.log("zoomCursorUp");
			self.zoomCursorDownBool = false;
		}

		self.zoomCursorMove = function(e){
			if(self.zoomCursorDownBool == true){
				if (e.pageX === undefined) {
					e.pageX = e.touches[0].pageX;
				}
				if (e.pageY === undefined) {
					e.pageY = e.touches[0].pageY;
				}

				var diffX = self.zoomCursorX - e.pageX;
				var diffY = self.zoomCursorY - e.pageY;
				self.zoomCursorX = e.pageX;
				self.zoomCursorY = e.pageY;
				var newx = el_zoomPositionCursor.offsetLeft - diffX;
				var newy = el_zoomPositionCursor.offsetTop - diffY;
				var d2x = (self.zoomControlsWidth - self.zoomCursorWidth*(10/self.currentZoom));
				var d2y = (self.zoomControlsHeight - self.zoomCursorHeight*(10/self.currentZoom));
				var minX = -1*d2x/2;
				var maxX = d2x/2;
				var minY = -1*d2y/2;
				var maxY = d2y/2;
				if (newx < minX) newx = minX;
				if (newy < minY) newy = minY;
				if (newx >= maxX) newx = maxX;
				if (newy >= maxY) newy = maxY;
				el_zoomPositionCursor.style.left = newx + "px";
				el_zoomPositionCursor.style.top = newy + "px";


				var zoom = self.currentZoom/10 - 1;
				var left = Math.floor(-100*((newx/d2x)*zoom));
				var top = Math.floor(-100*((newy/d2y)*zoom));

				//console.log("<binary> top:" + top + "; left:" + left + ";");


				var h = self.vjs.videoHeight();
				var w = self.vjs.videoWidth();
				//var top_px = h*top/500;
				//var left_px = w*left/500;
				_applyFuncTo(_players, left + '%' , function(plr_el, val) {
					plr_el.style.left = val;
				});


				_applyFuncTo(_players, top  + '%', function(plr_el, val) {
					plr_el.style.top = val;
				});
			}
		}

		el_zoomUp.onclick = self.zoomUp;
		el_zoomDown.onclick = self.zoomDown;
		el_zoomPositionCursor.addEventListener('mousedown',self.zoomCursorDown,false);
		el_zoomPositionCursor.addEventListener('mousemove',self.zoomCursorMove,false);
		el_zoomPositionCursor.addEventListener('mouseleave',self.zoomCursorUp,false);
		el_zoomPositionCursor.addEventListener('mouseup',self.zoomCursorUp,false);
		el_zoomProgress.addEventListener('mousedown',self.zoomProgressDown,false);
		el_zoomProgress.addEventListener('mousemove',self.zoomProgressMove,false);
		el_zoomProgress.addEventListener('mouseleave',self.zoomProgressLeave,false);
		el_zoomProgress.addEventListener('mouseup',self.zoomProgressUp,false);
		el_zoomPositionCursor.addEventListener('touchstart',self.zoomCursorDown,false);
		el_zoomPositionCursor.addEventListener('touchmove',self.zoomCursorMove,false);
		el_zoomPositionCursor.addEventListener('touchend',self.zoomCursorUp,false);
	}
	_initZoomControls();

	/*
	 * check audio channels
	 * */

	self.isAudioChannelExists = function(){
		// console.log("self.mstreams.current = " + self.mstreams.current);
		// console.log("self.mstreams.audio_on = " + self.mstreams.audio_on);
		// return self.mstreams && self.mstreams.current == self.mstreams.audio_on;
		// TODO
		return true;
	}

	self.updateAudioStream = function(){
		el_info_audio_stream.style.display = "none";
		// console.log("api: ", mConn._getAPI());
		mConn._getAPI().cameraMediaStreams(self.currentCamID).done(function(r){
			// console.log("cameraMediaStreams: ", r);
			if(r.mstreams_supported && r.mstreams_supported.length > 1){
				el_info_audio_stream.style.display = "block";
				self.mstreams.audio_on = '';
				self.mstreams.audio_off = '';
				self.mstreams.current = r.live_ms_id;
				//for(var i in r.mstreams_supported){
				for(var i = 0 ; i < r.mstreams_supported.length; i++){
					if(r.mstreams_supported[i].as_id && r.mstreams_supported[i].vs_id){
						self.mstreams.audio_on = r.mstreams_supported[i].id;
					}else if(r.mstreams_supported[i].vs_id){
						self.mstreams.audio_off = r.mstreams_supported[i].id;
					}
				}
				if(self.mstreams.audio_on == self.mstreams.current){
					el_info_audio_stream_on.classList.add("selected");
				}else if(self.mstreams.audio_off == self.mstreams.current){
					el_info_audio_stream_off.classList.add("selected");
				}
			}else{
				el_info_audio_stream.style.display = "none";
			}

			if(!self.isAudioChannelExists()){

			}
		}).fail(function(r){
			console.error(r);
			el_info_audio_stream.style.display = "none";
		})
	}

	/*
	 * volume controls begin
	 * */

	function _initVolumeControls(){
		var el_volumeMute = self.player.getElementsByClassName('cloudplayer-volume-mute')[0];
		var el_volumeDown = self.player.getElementsByClassName('cloudplayer-volume-down')[0];
		var el_volumeProgress = self.player.getElementsByClassName('cloudplayer-volume-progress')[0];
		var el_volumeUp = self.player.getElementsByClassName('cloudplayer-volume-up')[0];
		var el_volumeContainer = self.player.getElementsByClassName('cloudplayer-volume-container')[0];
		var el_volumeSlider = self.player.getElementsByClassName('cloudplayer-volume')[0];

		self.m = self.m || {};
		self.m.volume = 1.0;

		el_volumeMute.style.display='inline-block';

		if (self.isMobile) {
			el_volumeContainer.style.display='none';
		}

		if (self.m.mute) {
			el_volumeContainer.style.display='none';
			el_volumeMute.classList.add("unmute");
		} else {
			if (!self.isMobile) {
				el_volumeContainer.style.display='flex';
			}
			el_volumeMute.classList.remove("unmute");
		}

		function applyVolumeToPlayers(v) {
		        var muted = (v == 0)? true : false;
			var player_native_hls	= document.getElementById(self.elid+"_native_hls");
			//var player_vjs2		= document.getElementById(self.elid+"_vjs2");
			var player_vjs              = document.getElementById(self.elid+"_vjs");
/*
			var player_nv1		= document.getElementById(self.elid+"_nv1");
			var player_nv2		= document.getElementById(self.elid+"_nv2");
*/
			var player_webrtc		= document.getElementById(self.elid+"_webrtc");


			if(player_native_hls != null && typeof player_native_hls !== "undefined") player_native_hls.muted = muted;
			//if(player_vjs2 != null && typeof player_vjs2       !== "undefined") player_vjs2.muted = muted;
			if(player_vjs != null && typeof player_vjs	     !== "undefined") player_vjs.muted = muted;
/*
			if(player_nv1 != null && typeof player_nv1	     !== "undefined") player_nv1.muted = muted;
			if(player_nv2 != null && typeof player_nv2	     !== "undefined") player_nv2.muted = muted;
*/
			self.vjs.muted(muted);
			//self.vjs2.muted(muted);
			self.vjs.volume(v);
			//self.vjs2.volume(v);

			mVxgcloudplayer.muted = muted;
			mVxgcloudplayer.volume = v;

//			mPlaybackPlayer1.volume(v);
//			mPlaybackPlayer2.volume(v);
			if (mWebRTC_el != null) {
				if(player_webrtc != null && typeof player_webrtc !== "undefined") player_webrtc.muted = muted;
				mWebRTC_el.volume = v;
			}
		}

		self.mute = function(){
			if (!self.isAudioChannelExists()) {
				return;
			}
			self.m.mute = !self.m.mute;
			if (self.m.mute ) {
				if (!self.isMobile) {
					el_volumeContainer.style.display='none';
				}
				el_volumeMute.classList.add("unmute");
			} else {
				if (!self.isMobile) {
					el_volumeContainer.style.display='flex';
				}
				el_volumeMute.classList.remove("unmute");
			}
			var v = self.m.mute? 0: '' + self.m.volume.toFixed(1);
			applyVolumeToPlayers(v);
		}

		self.volume = function(val){
			if (!self.isAudioChannelExists()) {
				return;
			}
			if (val != undefined) {
				val = val > 1 ? 1 : val;
				val = val < 0 ? 0 : val;
				self.m.volume = Math.ceil(val*10)/10;
				var v = self.m.mute ? 0 : self.m.volume.toFixed(1);
				applyVolumeToPlayers(v);
				el_volumeProgress.className = el_volumeProgress.className.replace(/vol\d+/g,'vol' + Math.ceil(self.m.volume*10));
			} else {
				return self.m.volume;
			}
		}

		self.volup = function(){
			if (!self.isAudioChannelExists()) {
				return;
			}

			if (Math.round(self.m.volume*10) < 10) {
				self.m.volume = self.m.volume + 0.1;
				var v = self.m.mute ? 0 : self.m.volume.toFixed(1);
				applyVolumeToPlayers(v);
				el_volumeProgress.className = el_volumeProgress.className.replace(/vol\d+/g,'vol' + Math.ceil(self.m.volume*10));
			}
		};

		self.voldown = function(){
			if (!self.isAudioChannelExists()) {
				return;
			}
			if (Math.round(self.m.volume*10) > 0) {
				self.m.volume = self.m.volume - 0.1;
				var v = self.m.mute ? 0 : self.m.volume.toFixed(1)
				applyVolumeToPlayers(v);
				el_volumeProgress.className = el_volumeProgress.className.replace(/vol\d+/g,'vol' + Math.floor(self.m.volume*10));
			}
		};

		el_volumeMute.onclick = self.mute;
		el_volumeDown.onclick = self.voldown;
		el_volumeUp.onclick = self.volup;
		el_volumeSlider.addEventListener('input', function(event){
			if (!self.player.getElementsByClassName('cloudplayer-volume')[0]) return;
			self.volume(event.target.value/100);
		});

		// init volume
		self.vjs.ready(function(){
			//self.vjs.currentTime(-1);
			//self.vjs.playbackRate(4);
			//setTimeout(function(){
			//	self.vjs.playbackRate(1);					
			//	},1000);
			
			if (!self.isAudioChannelExists()) {
				return
			}
			
			self.vjs.muted(true);
			self.volume(self.m.volume);
		});

		if (!self.isAudioChannelExists()) {
			el_volumeDown.style.display='none';
			el_volumeProgress.style.display='none';
			el_volumeUp.style.display='none';
			el_volumeMute.style.display='none';
		}

		if ( self.options.disableAudioControl && self.options.disableAudioControl == true) {
		    self.m.volume = 1;
		    self.m.mute = false;

		    el_volumeMute.style.display = 'none';
		    el_volumeDown.style.display = 'none';
		    el_volumeProgress.style.display = 'none';
		    el_volumeUp.style.display = 'none';
		    el_volumeContainer.style.display = 'none';
		    el_volumeSlider.style.display = 'none';

		    return;
		}

	}
	_initVolumeControls();

	// ---- volume controls end ----

	function _polingCameraHLSList(live_urls, _uniqPlay){
		if(_uniqPlay != mUniqPlay) {
			console.warn("_uniqPlay not current [_polingCameraHLSList]");
			return;
		}

		var xhr = new XMLHttpRequest();
		xhr.open('GET', live_urls.hls);
		// xhr.withCredentials = false;
		xhr.onload = function() {
			if(_uniqPlay != mUniqPlay) {
				console.warn("_uniqPlay not current [_polingCameraHLSList 2]");
				return;
			}
			if(xhr.status === 200){
				if(_uniqPlay != mUniqPlay) return;
				self._applyMediaTiket(live_urls.hls, live_urls.expire);
				// self._startPolingMediaTicket(_uniqPlay);
				// For debug
				// live_urls.hls = live_urls.hls.replace("/hls/", "/hls1/");

				// 
				if (self.vsFormat == null || self.vsFormat == "H264")
				{
					self.vjs.src([{
						src: live_urls.hls,
						type: 'application/x-mpegURL'
					}]);
				}
				else if ('dash' in live_urls)
				{
					self.vjs.src([{
						src: live_urls.dash,
						type: 'application/dash+xml'
					}]);

				}


				xhr = null;
			}else if(xhr.status === 404){
				if(_uniqPlay != mUniqPlay){
					console.warn("[VXGCLOUDPLAYER] polingHLSList, camid was changed stop poling hls list, currentCmaID=" + self.mSrc.getID());
					return;
				}
				mTimeWaitStartStream++;
				if(mTimeWaitStartStream > _timeWaitStartStreamMax){
					self.count_ERROR_STREAM_UNREACHABLE = (self.count_ERROR_STREAM_UNREACHABLE|0)+1;
					if (self.count_ERROR_STREAM_UNREACHABLE>3){
						self._showerror(CloudReturnCode.ERROR_STREAM_UNREACHABLE_HLS);
						self.count_ERROR_STREAM_UNREACHABLE=0;
					} else {
						self.stop();
						self.play();
					}
					return;
				}
				setTimeout(function(){
					console.warn("Wait one sec " + live_urls.hls);
					xhr = null;
					_polingCameraHLSList(live_urls, _uniqPlay);
				},1000);
			}else{
				console.error("Unhandled");
			}
		};
		xhr.send();
	}

	self.WebRTC0_autoplayBlocked = function() {
		_stopPolingTime();
		try {
		    mWebRTC0_Player.stopWS();
		} catch(e) {
		    console.warn("WebRTC0_autoplayBlocked: skip error", e);
		}
		mTimeWaitStartStream = 0;
		// TODO show PlayButton
		console.warn('_vjs_play. is mobile or autoplay not allowed. show big button');
		mShowedBigPlayButton = true;
		mElBigPlayButton.style.display = "block";
		mElBigPlayButton.onclick = function(event){
			mEvent = event;
			mElBigPlayButton.style.display = "none";
			mShowedBigPlayButton = false;
			mTimeWaitStartStream = 0;
			self.play();
		}
	}

	function _polingLoadCameraLiveUrl_WebRTC0(_uniqPlay, live_urls){
		if (!live_urls.rtc) {
			self._showerror(CloudReturnCode.NOT_SUPPORTED_FORMAT);
			return;
		}

		console.warn("webrtc0 - depracated");
		mUsedPlayer = 'webrtc0';
		// WebRTC
		mElPlrType.innerHTML = "Used player: WebRTC (v0)";
/*
		if(window.location.protocol.startsWith ("file")){
			self.player.showErrorText("Please open from browser");
			return;
		}
*/
		var ws_protocol = (location.protocol == "https:" ? "wss://" : "ws://");
		var ws_host = location.hostname;
		var ws_port = 8080;
		var svcp_url = mConn.ServiceProviderUrl;
		if(live_urls.rtc){
			var p_rtc = CloudHelpers.parseUri(live_urls.rtc);
			var prt = p_rtc.protocol;
			if(prt == 'http' || prt == 'ws') {
				ws_protocol = "ws://";
			}else if(prt == 'https' || prt == 'wss'){
				ws_protocol = "wss://";
			}else{
				console.warn("Unknown protocol in '" + live_urls + "'");
			}
			ws_host = CloudHelpers.parseUri(live_urls.rtc).host;
			ws_port = CloudHelpers.parseUri(live_urls.rtc).port;
		}
		var ws_srv = ws_protocol + ws_host + ':' + ws_port + '/';

		// TODO keep player element
		self.vjs.el().style.display = "none";
		//self.vjs2.el().style.display = "none";
		mJpegPlayer_el.style.display = "none";
		mNativeHLS_el.style.display = "none";
		mWebRTC_el.style.display = "block";

		if(!window['CloudPlayerWebRTC0']){
			console.error("Not found module CloudPlayerWebRTC0");
			return;
		}
		mWebRTC0_Player = new CloudPlayerWebRTC0(mWebRTC_el, ws_srv, live_urls.rtmp);
		mWebRTC0_Player.onAutoplayBlocked = self.WebRTC2_autoplayBlocked;
		mWebRTC0_Player.onServerError = function(event){
			console.error("[WebRTC0] Event error ", event);
			self._showerror(CloudReturnCode.ERROR_WEBRTC_SERVER_ERROR);
			self.stop("by_webrtc0_error");
		}
		mWebRTC0_Player.startWS();
		_startPolingTime();
	}

	self.WebRTC2_autoplayBlocked = function() {
		_stopPolingTime();
		try {
		    mWebRTC2_Player.stopWS();
		} catch(e) {
		    console.warn("WebRTC2_autoplayBlocked: skip error", e);
		}
		mTimeWaitStartStream = 0;
		// TODO show PlayButton
		console.warn('_vjs_play. is mobile or autoplay not allowed. show big button');
		mShowedBigPlayButton = true;
		mElBigPlayButton.style.display = "block";
		mElBigPlayButton.onclick = function(event){
			mEvent = event;
			mElBigPlayButton.style.display = "none";
			mShowedBigPlayButton = false;
			mTimeWaitStartStream = 0;
			self.play();
		}
	}

	function _polingLoadCameraLiveUrl_WebRTC2(_uniqPlay, live_urls){
		if (!live_urls.webrtc) {
			self._showerror(CloudReturnCode.NOT_SUPPORTED_FORMAT);
			return;
		}

		mUsedPlayer = 'webrtc2';
		// WebRTC
		mElPlrType.innerHTML = "Used player: WebRTC (v2)";
/*
		if(window.location.protocol.startsWith ("file")){
			self.player.showErrorText("Please open from browser");
			return;
		}
*/
		// TODO keep player element
		self.vjs.el().style.display = "none";
		//self.vjs2.el().style.display = "none";
		mNativeHLS_el.style.display = "none";
		mJpegPlayer_el.style.display = "none";
		mWebRTC_el.style.display = "block";


		if(!window['CloudPlayerWebRTC2']){ // webrtc2
			console.error("Not found module CloudPlayerWebRTC2");
			return;
		}

		var p = CloudHelpers.promise();
		if (CloudHelpers.compareVersions(CloudPlayerWebRTC2.version, live_urls.webrtc.version) > 0) {
			console.warn("Expected version webrtc.version (v" + live_urls.webrtc.version + ") "
			+ " mismatch with included CloudPlayerWebRTC (v" + CloudPlayerWebRTC2.version + ")");
			p = CloudHelpers.requestJS(live_urls.webrtc.scripts.player, function(r) {
				r = r.replace("CloudPlayerWebRTC =", "CloudPlayerWebRTC2 =");
				while (r.indexOf("CloudPlayerWebRTC.") !== -1) {
					r = r.replace("CloudPlayerWebRTC.", "CloudPlayerWebRTC2.");
				}
				return r;
			});
		} else {
			p.resolve();
		}

		p.done(function(){
			console.log("[PLAYER] ", live_urls.webrtc.connection_url)
			mWebRTC2_Player = new CloudPlayerWebRTC2(mWebRTC_el,
				live_urls.webrtc.connection_url,
				live_urls.webrtc.ice_servers, {
					send_video: false,
					send_audio: false,
				}
			);
			mWebRTC2_Player.onAutoplayBlocked = self.WebRTC2_autoplayBlocked;
			mWebRTC2_Player.onServerError = function(event){
				console.error("[WebRTC2] Event error ", event);
				self._showerror(CloudReturnCode.ERROR_WEBRTC_SERVER_ERROR);
				self.stop("by_webrtc2_error");
			}
			mWebRTC2_Player.startWS();
			_startPolingTime();
		})
	}

	function _polingLoadCameraLiveUrl_RTMP (_uniqPlay, live_urls){
		if (!live_urls.rtmp) {
			self._showerror(CloudReturnCode.NOT_SUPPORTED_FORMAT);
			return;
		}

		mElPlrType.innerHTML = "Used player: Flash";
		self.vjs.ready(function(){
			console.log("[PLAYER] Set url (rtmp): " + live_urls.rtmp);
			self.vjs.options().flash.swf = CloudSDK.flashswf || 'swf/video-js-by-vxg-buff200.swf';
			self.vjs.src([{src: live_urls.rtmp, type: 'rtmp/mp4'}]);
			_showBlackScreen();
		});

		// vxgcloudplayer.vjs_play(vcp);
		self.vjs.off('ended');
		self.vjs.on('ended', function() {
			self.stop("by_rtmp_ended");
		});
		var bLoadedData = false;
		self.vjs.off('loadeddata');
		self.vjs.on('loadeddata', function() {
			console.warn("loadeddata");
			bLoadedData = true;
			_hideBlackScreen();
			if(_uniqPlay != mUniqPlay) {
				console.warn("[PLAYER]  _uniqPlay not current [loadeddata]");
				return;
			}

			_hideloading();
			//_initZoomControls();
			_initVolumeControls();
			_vjs_play_live();
		});

		self.vjs.on('playing', function() {
			_beforePlay();
		});


		self.vjs.off('loadedmetadata');
		self.vjs.on('loadedmetadata', function() {
			console.warn("loadedmetadata");
		});

		// ad-hoc for network encoder
		setTimeout(function(){
			console.log("[PLAYER] Set url (rtmp) 2: " + live_urls.rtmp);
			if(!bLoadedData){
				self.vjs.src([{src: live_urls.rtmp, type: 'rtmp/mp4'}]);
			}
		},5000)

		_stopPolingTime();
		_startPolingTime();

		if (CloudHelpers.isChrome() && !CloudHelpers.autoPlayAllowed) {
			_vjs_play_live();
		} else {
			self.vjs.play();
		}
	}

	function _polingLoadCameraLiveUrl_NativeHLS(_uniqPlay, live_urls){
		if (!live_urls.hls) {
			self._showerror(CloudReturnCode.NOT_SUPPORTED_FORMAT);
			return;
		}

		mUsedPlayer = 'native-hls';
		// No work
		mElPlrType.innerHTML = "Used player: NativeHLS";
/*
		if(window.location.protocol.startsWith ("file")){
			self.player.showErrorText("Please open from browser");
			return;
		}
*/
		// TODO keep player element
		self.vjs.el().style.display = "none";
		//self.vjs2.el().style.display = "none";
		mWebRTC_el.style.display = "none";
		mJpegPlayer_el.style.display = "none";
		mNativeHLS_el.style.display = "block";

		if(!window['CloudPlayerNativeHLS']){
			console.error("[PLAYER]  Not found module CloudPlayerNativeHLS");
			return;
		}


		mNativeHLS_Player = new CloudPlayerNativeHLS(mNativeHLS_el, live_urls.hls);
		mNativeHLS_Player.play();
		_beforePlay();
		_startPolingTime();
	}

	function _polingLoadCameraLiveUrl_Jpeg(_uniqPlay, live_urls){
		if (!live_urls.hls) {
			self._showerror(CloudReturnCode.NOT_SUPPORTED_FORMAT);
			return;
		}

		mUsedPlayer = 'jpeg';
		mElPlrType.innerHTML = "Used player: Jpeg";

		self.vjs.el().style.display = "none";
		mWebRTC_el.style.display = "none";
		mNativeHLS_el.style.display = "none";
		mJpegPlayer_el.style.display = "block";

		if(!window['CloudPlayerJpegLive']){
			console.error("[PLAYER]  Not found module CloudPlayerJpegLive");
			return;
		}

		var redrawPeriod = self.options.jpegRedrawPeriod || 1000;
		mJpegPlayer.play( mConn._getAPI(), self.mSrc, redrawPeriod );
		//mNativeHLS_Player = new CloudPlayerNativeHLS(mNativeHLS_el, live_urls.hls);
		//mNativeHLS_Player.play();
		_beforePlay();
		_startPolingTime();
	}


	function _polingLoadCameraLiveUrl_HLS (_uniqPlay, live_urls){
		if (!live_urls.hls) {
			self._showerror(CloudReturnCode.NOT_SUPPORTED_FORMAT);
			return;
		}

		if (self.m.useNativeHLS) {
			_polingLoadCameraLiveUrl_NativeHLS(_uniqPlay, live_urls);
			return;
		}

		self.vjs.el().style.display = "block";
		//self.vjs2.el().style.display = "none";
		mWebRTC_el.style.display = "none";
		mJpegPlayer_el.style.display = "none";
		mNativeHLS_el.style.display = "none";


		mElPlrType.innerHTML = "Used player: HTML5 (hls)";
		mUsedPlayer = 'hls';

		console.log("[PLAYER] Set url (hls): " + live_urls.hls);

		clearInterval(mExpireHLSTimeInterval);
		/*if (live_urls.expire_hls) {
			var _expire_hls = live_urls.expire_hls;
			mExpireHLSTimeInterval = setInterval(function() {
				if(_source_type == 'camera_live' && mUsedPlayer == 'hls') {
					var nDiff = CloudHelpers.parseUTCTime(_expire_hls) - CloudHelpers.getCurrentTimeUTC();
					// console.warn("[PLAYER] hls, check the expire hls (at " + Math.floor(nDiff/1000) + " seconds)");
					if (nDiff < 0) {
						console.warn("[PLAYER] hls, reload new urls");
						self._polingLoadCameraLiveUrl(_uniqPlay);
					}
					// request again live urls
				}
			},10000);
		}*/
		_polingCameraHLSList(live_urls, _uniqPlay);

		self.vjs.off('ended');
		self.vjs.on('ended', function() {
			self.stop("by_hls_ended");
			self._showerror(CloudReturnCode.ERROR_HLS_ENDED);
		});
		mSafariAndHlsNotStarted = '';

		self.vjs.off('loadeddata');
		self.vjs.on('loadeddata', function() {
			console.warn("loadeddata");
			_hideBlackScreen();
			if(_uniqPlay != mUniqPlay) {
				console.warn("_uniqPlay not current [loadeddata]");
				return;
			}

			_hideloading();
			//_initZoomControls();
			_initVolumeControls();
			_vjs_play_live();

			if (CloudHelpers.isSafari()) {
				mSafariAndHlsNotStarted = 'loadeddata';
			}
		});

		self.vjs.off('loadedmetadata');
		self.vjs.on('loadedmetadata', function() {
			// console.warn("loadedmetadata");
		});

		self.vjs.off('playing');
		self.vjs.on('playing', function() {
			if (CloudHelpers.isSafari() && mSafariAndHlsNotStarted === 'loadeddata') {
				mSafariAndHlsNotStarted = 'playing';
			}
			_beforePlay();
		});

		self.vjs.off('pause');
		self.vjs.on('pause', function() {
			// console.warn("pause");
			if (CloudHelpers.isSafari() && mSafariAndHlsNotStarted === 'playing') {
				mSafariAndHlsNotStarted = 'pause';
				_vjs_play_live();
			}
		});

		_stopPolingTime();
		_startPolingTime();

		if (CloudHelpers.isChrome() && !CloudHelpers.autoPlayAllowed) {
			_vjs_play_live();
		} else {
			self.vjs.play();
		}
	}

	function _polingCameraStatus(_uniqPlay){
		if(mUniqPlay != null && _uniqPlay != mUniqPlay) {
			console.warn("[_polingCameraStatus] _uniqPlay not current 1");
			clearInterval(mPolingCameraStatus);
			return;
		}
		if(!self.mSrc){
			console.warn("[_polingCameraStatus] no source");
			clearInterval(mPolingCameraStatus);
			return;
		}
		if(self.mSrc.type != 'camera'){
			console.warn("[_polingCameraStatus] no type camera");
			clearInterval(mPolingCameraStatus);
			return;
		}
		var camId = self.mSrc.getID();
		var prev_status = self.mSrc._origJson()['status'];
		mConn._getAPI().getCamera2(camId, {}).done(function(r){
			// console.log("[_polingCameraStatus] ",r);
			var new_status = r['status'];
			if(mUniqPlay != null && _uniqPlay != mUniqPlay) {
				console.warn("[_polingCameraStatus] _uniqPlay not current (2) " + _uniqPlay + "!=" + mUniqPlay);
				clearInterval(mPolingCameraStatus);
				return;
			}

			if(new_status !== 'active'
				&& self.m.waitSourceActivation != 0
				&& mWaitSourceActivationCounter > self.m.waitSourceActivation) {
				//self.player.querySelector(".cloudplayer-calendar-container").classList.add("offline");
				//self.player.querySelector(".cloudplayer-controls-container").classList.add("offline");
				self._showerror(CloudReturnCode.ERROR_CAMERA_OFFLINE);
				mWaitSourceActivationCounter = 0;
			}

			if(prev_status != new_status){
				console.warn("switched camera status: from " + prev_status + " to " + new_status + ' mLiveModeAutoStart: ' + mLiveModeAutoStart);
				self.mSrc._origJson()['status'] = new_status;
				if(mLiveModeAutoStart){
					if(new_status == 'active'){
						//self.player.querySelector(".cloudplayer-calendar-container").classList.remove("offline");
						//self.player.querySelector(".cloudplayer-controls-container").classList.remove("offline");
						self.play();
					} else {
						self.stop("by_poling_camera_status");
						//self.player.querySelector(".cloudplayer-calendar-container").classList.add("offline");
						//self.player.querySelector(".cloudplayer-controls-container").classList.add("offline");
						self._showerror(CloudReturnCode.ERROR_CAMERA_OFFLINE);
						_startPolingCameraStatus(_uniqPlay);
					}
				}
				mCallbacks.executeCallbacks(CloudPlayerEvent.CHANNEL_STATUS, {status: new_status});
				if (mCallback_onChannelStatus) {
					setTimeout(function(){ mCallback_onChannelStatus(self, new_status); },10);
				}
			}
		}).fail(function(err){
			console.error("[_polingCameraStatus] ",err);
			self.mSrc._origJson()['status'] = 'error';
		});
		//
	}

	function _startPolingCameraStatus(_uniqPlay){
		setTimeout(function(){
			mLiveModeAutoStart = true;
			clearInterval(mPolingCameraStatus);
			_polingCameraStatus(_uniqPlay);
			mWaitSourceActivationCounter = 100;
			var timePolingStart = 3000;

			if (self.mSrc._origJson()['status'] == 'active'){
				timePolingStart = mTimePolingCameraStatus_active;
			}else{
				timePolingStart = mTimePolingCameraStatus_inactive;
			}

			mPolingCameraStatus = setInterval(function(){
				if (mWaitSourceActivationCounter > 0) {
					mWaitSourceActivationCounter += timePolingStart;
				}
				_polingCameraStatus(_uniqPlay);
			}, timePolingStart);
		},100); // if called self.stop()
	}

	self._polingLoadCameraLiveUrl = function(_uniqPlay){
		if(_uniqPlay != mUniqPlay) {
			console.warn("_uniqPlay not current [_polingLoadCameraLiveUrl]");
			return;
		}

		if(self.mSrc.type != 'camera'){
			self._showerror(CloudReturnCode.ERROR_INVALID_SOURCE);
			return;
		}

		if(self.updateAudioCaps){
			self.updateAudioCaps(self.mSrc.getID());
		}
		_source_type = 'camera_live';
		mUsedPlayer = '';

		var streamid = "";
		//if (hasMultipleStreams)
		{
			
			if (mainResId && liveResId) {
				streamid = streamQuality == "main" ? mainResId : liveResId;
				videoid = streamQuality == "main" ? mainVsId : liveVsId;
				console.log("changing stream quality to: " + streamQuality + " on id: " + streamid + " video_id: " +  videoid);

			    mConn._getAPI().getCameraVideoStream(self.mSrc.getID(),videoid).done(function(video_stream){

								if (video_stream)
									self.vsFormat = video_stream.format;

								mConn._getAPI().cameraLiveUrls(self.mSrc.getID(), streamid).done(function(live_urls){
									// Konst TODO
									//if(_uniqPlay != mUniqPlay) {
									//	console.warn("_uniqPlay not current [_polingLoadCameraLiveUrl.done]");
									//	return;
									//}

									_updatePlayerFormatUI(live_urls);

									var webrtc_major_version = 1;
									if (live_urls.webrtc) {
										webrtc_major_version = live_urls.webrtc.version.split(".")[0];
										webrtc_major_version = parseInt(webrtc_major_version, 10);
									}

									if (!live_urls.hls && !live_urls.rtmp) {
										mPlayerFormatForced = 'webrtc';
									}

									if (mPlayerFormatForced !== null) {
										if (mPlayerFormatForced === 'flash') {
											_polingLoadCameraLiveUrl_RTMP(_uniqPlay, live_urls);
										} else if (mPlayerFormatForced === 'html5') {
											_polingLoadCameraLiveUrl_HLS(_uniqPlay, live_urls);
										} else if (live_urls.rtc && mPlayerFormatForced === 'webrtc') {
											_polingLoadCameraLiveUrl_WebRTC0(_uniqPlay, live_urls);
										} else if (live_urls.webrtc && webrtc_major_version === 2 && mPlayerFormatForced === 'webrtc') {
											_polingLoadCameraLiveUrl_WebRTC2(_uniqPlay, live_urls);
										} else if ( mPlayerFormatForced === 'jpeg') {
											_polingLoadCameraLiveUrl_Jpeg(_uniqPlay, live_urls);
										} else {
											self._showerror(CloudReturnCode.NOT_SUPPORTED_FORMAT);
										}
										return;
									}

									if(self.mPlayerFormat == 'webrtc'){
										if(live_urls.rtc && CloudHelpers.supportWebRTC()){
											_polingLoadCameraLiveUrl_WebRTC0(_uniqPlay, live_urls);
										} else if (live_urls.webrtc && webrtc_major_version === 2 && CloudHelpers.supportWebRTC()){
											_polingLoadCameraLiveUrl_WebRTC2(_uniqPlay, live_urls);
										} else {
											_polingLoadCameraLiveUrl_HLS(_uniqPlay, live_urls);
										}
									}

									if(self.mPlayerFormat == 'flash'){
										if(!CloudHelpers.useHls()){
											_polingLoadCameraLiveUrl_RTMP(_uniqPlay, live_urls);
										}else{
											_polingLoadCameraLiveUrl_HLS(_uniqPlay, live_urls);
										}
									}

									if(self.mPlayerFormat == 'html5'){
										_polingLoadCameraLiveUrl_HLS(_uniqPlay, live_urls);
									}

									if(self.mPlayerFormat == 'jpeg'){
										_polingLoadCameraLiveUrl_Jpeg(_uniqPlay, live_urls);
									}
								}).fail(function(r){
									console.error(r);
									if(_uniqPlay != mUniqPlay) {
										console.warn("_uniqPlay not current [_polingLoadCameraLiveUrl.fail]");
										return;
									}
									if(r.status && r.status == 503){
										// try load urls
										mTimeWaitStartStream++;
										if(mTimeWaitStartStream < self.timePolingLiveUrls){
											setTimeout(function(){
												self._polingLoadCameraLiveUrl(_uniqPlay);
											}, 1000);
										}else{
											console.error(r);
										}
										return;
									}
									console.error(r);
								});
				}).fail(function(r){
					console.error("Can can get video stream:" +  r);
				});
			}	
			//});
		}

	}

	self._reset_players = function() {
		console.log("_reset_players");
		self.vjs.reset();
		if (self.mPoster) {
			self.vjs.poster(self.mPoster);
		}
		self.vjs.controls(false);
		self.vjs.muted(true);
		self.vjs.autoplay(true);
		self.vjs.volume(0);
		self.vjs.el().style.display = "none";

		//self.vjs2.reset();
		//self.vjs2.controls(false);
		//self.vjs2.muted(true);
		//self.vjs2.autoplay(true);
		//self.vjs2.volume(0);
		//self.vjs2.el().style.display = "none";

//		mPlaybackPlayer1.reset();
//		mPlaybackPlayer1.el().style.display = "none";

//		mPlaybackPlayer2.reset();
//		mPlaybackPlayer2.el().style.display = "none";

		mVxgcloudplayer.parentElement.style.zIndex = -2;
		mVxgcloudplayer.parentElement.style.opacity = 0;
		if (mPosition == CloudHelpers.POSITION_LIVE) {
			mVxgcloudplayer.pause().then(function(){
			}).catch(function(err){
			});
		}
		mJpegPlayer.reset();
		mJpegPlayer_el.style.display = "none";

		mTimelapsePlayer.reset();
		mTimelapsePlayer_el.style.display = "none";

		self.volume(self.m.volume);
		_stopPolingTime();
		self._stopPolingMediaTicket();
		// vxgcloudplayer.stopPolingCameraLife();
		// self.updatePlayerType("");
	}

	self.isPlaying = function(){
		return mPlaying;
	}

	self.set_controls_opacity = function(val){
		if (el_controls.style.opacity != val) {
			mCallbacks.executeCallbacks(CloudPlayerEvent.CHANGED_CONTROLS, {opacity: val});
		}
		el_controls.style.opacity = val;
		el_controls_zoom.style.opacity = val;
		el_controls_zoom_position.style.opacity = val;
		el_controls_container.style.opacity = val;
		el_info.style.opacity = val;
		mElementCalendar.style.opacity = val;
		el_controls_ptz_container.style.opacity = val;
		el_controls_zoom_container.style.opacity = val;
		el_calendar_container.style.opacity = val;
		el_live_container.style.opacity = val;
		var el_selectcliptime = self.player.getElementsByClassName('cloudplayer-selectcliptime')[0];
		if (!parseInt(val) && el_selectcliptime) el_selectcliptime.style.display = "none";
	}

	var mShouldHide = true;

	el_controls_container.addEventListener('mouseover', function(evt){
		mShouldHide = false;
	});
	el_controls_container.addEventListener('mouseout', function(evt){
		mShouldHide = true;
	});
	self.restartTimeout = function(){
		if(self.m.autohide < 0){
			self.set_controls_opacity("0");
			return;
		}
		if(self.m.autohide == 0){
			self.set_controls_opacity("1");
			return;
		}
		self.set_controls_opacity("1");
		clearTimeout(self.timeout);

		self.timeout = setTimeout(function(){
			if (mShouldHide) {
				self.set_controls_opacity("0");
			} else {
				self.restartTimeout();
			}
		},self.m.autohide);
	};

	self.restartTimeout();

	self.player.addEventListener('mousedown', self.restartTimeout, true);
	self.player.addEventListener('mousemove', self.restartTimeout, true);
	self.player.addEventListener('touchmove', self.restartTimeout, true);
	self.player.addEventListener('touchstart', self.restartTimeout, true);

	mElementPlay.onclick = function() {
	    self.play('by_button_click');
	}

	el_pause.onclick = function() {
	    self.pause('by_button_click');
	}

	el_stop.onclick = function() {
	    self.stop('by_button_click');
	}

	self.size = function(width, height){
		// redesign
		console.error("[CloudPlayer] size not support");
		/*if(width && height){
			if(Number.isInteger(width) && Number.isInteger(height)){
				var w = parseInt(width,10);
				var h = parseInt(height,10);
				self.playerWidth = self.playerWidth != w ? w : self.playerWidth;
				self.playerHeight = self.playerHeight != h ? h : self.playerHeight;
				self.player.style.width = width + 'px';
				self.player.style.height = height + 'px';
			}else{
				self.player.style.width = width;
				self.player.style.height = height;
			}
		}else{
			return  { width: self.playerWidth, height: self.playerHeight };
		}*/
	};

	self.setFullscreenCallback = function(func) {
		self.f_callbackFullscreenFunc = func;
	}

	self.setIOsFullscreenCallback = function(func) {
		self.f_callbackIOsFullscreenFunc = func;
	}

	self.getCurrentVideoTag = function (){
		var videotag = undefined;
		var videotags = self.player.getElementsByClassName('allvideotags')[0];
		var vtags = videotags.getElementsByTagName('video');
		for (var i =0; i < vtags.length; i++) {
		    var el = vtags[i];
		    var isDisp = el.currentStyle ? el.currentStyle.display :  getComputedStyle(el, null).display;
		    var isParentDisp = el.parentElement.currentStyle ? el.parentElement.currentStyle.display :  getComputedStyle(el.parentElement, null).display;
		    if (el.classList.contains('vjs-tech')) {
			isDisp = isParentDisp;
		    }
		    if (isDisp === 'block' || isDisp === 'inline-block') {
			videotag = el;
			break;
		    }
		}
		return videotag;
	}

	self.printDebug = function( what ) {
		var dbg = self.player.getElementsByClassName('cloudplayer-debug')[0];
		dbg.style.display = "block";
		var t = document.createTextNode(what + '\n');
		dbg.appendChild(t);
	}

	self.initFullscreenControls = function(){
		var el_fullscreen = self.player.getElementsByClassName('cloudplayer-fullscreen')[0];
		var _prevHeight, _prevWidth, _prevMaxW , _prevMaxH;
		self.changedFullscreen = function(){
			console.log('changedFullscreen: ' + document.webkitIsFullScreen);
			if (document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement ){
				_prevHeight = self.player.style.height;
				_prevWidth = self.player.style.width;
				_prevMaxH = self.player.style.maxHeight;
				_prevMaxW = self.player.style.maxWidth;

				self.player.style.height ='100%';
				self.player.style.width = '100%';
				self.player.style.maxHeight = '100%';
				self.player.style.maxWidth = '100%';
				// self.size('100%', '100%');
				console.log('changedFullscreen -> fullscreen');

				if (screen.orientation && screen.orientation.lock) {
					screen.orientation.lock('landscape');
				}

				if (self.f_callbackFullscreenFunc) {
				    self.f_callbackFullscreenFunc(true);
				}
			} else {
				//_prevHeight
				self.player.style.height = _prevHeight;
				self.player.style.width = _prevWidth;

				self.player.style.maxHeight =_prevMaxH;
				self.player.style.maxWidth = _prevMaxW;

				// self.size(self.playerWidth + 'px', self.playerHeight + 'px');
				console.log('changedFullscreen -> NOT fullscreen');

				if (self.f_callbackFullscreenFunc) {
				    self.f_callbackFullscreenFunc(false);
				}
			}
		};

		self.player.onwebkitfullscreenchange = self.changedFullscreen;
		self.player.onmozfullscreenchange = self.changedFullscreen;
		self.player.onfullscreenchange = self.changedFullscreen;

		self.fullscreen = function(){
			console.log("fullscreen: clicked");
			if(CloudHelpers.isIOS()){
				self.f_callbackIOsFullscreenFunc();
			}

			if(document.webkitIsFullScreen == true){
				document.webkitCancelFullScreen();
			} else if(document.mozFullScreen){
				document.mozCancelFullScreen();
			} else if(document.msFullscreenElement && document.msFullscreenElement != null){
				document.msExitFullscreen();
			} else {
				if(self.player.mozRequestFullScreen) {
					self.player.mozRequestFullScreen();
				} else if(self.player.requestFullscreen) {
					self.player.requestFullscreen();
				} else if(self.player.webkitRequestFullscreen) {
					self.player.webkitRequestFullscreen();
				} else if(self.player.msRequestFullscreen) {
					self.player.msRequestFullscreen();
				}
			}
		};
		el_fullscreen.onclick = self.fullscreen;
	}
	self.initFullscreenControls();

	self.initHLSMechanism = function(){

		self._applyMediaTiket = function(url_hls, expire){
			console.log("media-tiсket: old = " + self.hls_mediaticket_value);
			if(url_hls.indexOf('?') != -1){
				self.hls_mediaticket_value = '?' + url_hls.split('?')[1];
			}
			mHLSLinkExpire = Date.parse(expire + 'Z');
			console.log("media-tiсket: new = " + self.hls_mediaticket_value);
		}

		self._stopPolingMediaTicket = function(){
			clearInterval(self._polingMediaTicketInterval);
		}
	}
	self.initHLSMechanism();
	window._cloudPlayers[elid] = self;

	if (!CloudHelpers.isIE()){
		self.pano = new CloudPano( self.player.getElementsByClassName('allvideotags')[0] , self);
	} else {
		self.pano = null;
	}

	self.enableSpeedSetting = function () {
		mElSettings_speed_container.classList.add('enabled');
	};
	self.disableSpeedSetting = function () {
		mElSettings_speed_container.classList.remove('enabled');
	};
	self.enableModeSetting = function () {
		mElSettings_format_container.classList.add('enabled');
	};
	self.disableModeSetting = function () {
		mElSettings_format_container.classList.remove('enabled');
	}

	self.collapseMenu = function(){
		el_player.classList.remove('showing-format-selection');
		el_player.classList.remove('showing-dewarping-selection');
		el_player.classList.remove('showing-speed-selection');
		el_player.classList.remove('showing-quality-selection');
	}

	if (options.useOnlyPlayerFormat !== undefined)
		self.disableModeSetting();
	else
		self.enableModeSetting();

}

CloudPlayer.POSITION_LIVE = -1;
/*-------MODEL-------*/

var CloudShareClipModel = function CloudShareClipModel( controller) {
    this.controller = controller;
    this.camera = null;
    this.accessToken = null;
};

CloudShareClipModel.prototype.createClip = function ( cloudcamera, accessToken, clipname, start_time, end_time, delete_at ) {
    if(cloudcamera != null) {
	this.camera = cloudcamera;
	this.accessToken = accessToken;
	var self = this;

	this.camera.createClip (clipname, start_time, end_time, delete_at, this.accessToken)
	.done(function(r){
	    var clipid = r.id;
	    var status = r.status;

	    if (status === "pending") {
		setTimeout( function() { self.clipStatus(clipid) }, 3000 );
	    } else if (status === "done") {
		self.controller.processDone(status, r);
	    } else {
		self.controller.processDone(status);
	    }
	})
	.fail(function(r){
	    self.controller.processDone('error');
	});
    }
}

CloudShareClipModel.prototype.clipStatus = function ( clipid ) {
    var self = this;
    if (this.camera && this.camera !== undefined) {
	this.camera.getClip(clipid, this.accessToken)
	.done(function(r){
	    console.log('Clip Status OK:' + r.status);
	    var status = r.status;

	    if ((status === "") || (status === "pending")){
		setTimeout( function() { self.clipStatus(clipid) }, 3000 );
	    } else if (status === "done") {
		self.controller.processDone(status, r);
	    } else {
		self.controller.processDone(status);
	    }
	})
	.fail(function(r){
	    self.controller.processDone('error');
	});
    }
}

/*-------VIEW--------*/

var CloudShareClipView = function CloudShareClipView(element) {
    this.element = element;
};


CloudShareClipView.prototype.initDraw = function initDraw(controller) {
    this.element.innerHTML =
    	'<div class= "CloudShareClipContainer">'
    +	'</div>';
    var element = this.element;

    this.container = this.element.getElementsByClassName('CloudShareClipContainer')[0];

    this.render(controller);
}


CloudShareClipView.prototype.render = function render(controller) {
	var self	= this;
}

CloudShareClipView.prototype.showWait = function showWait(isWait) {
    var element = this.container;

    if (isWait) {
        $(element).addClass("waitdata");
    } else {
        $(element).removeClass("waitdata");
    }
};


/*------CONTROLLER--*/
var CloudShareClipController = function CloudShareClipController( element) {
    if (element === undefined) {
	return;
    }

    this.callback_func = null;

    this.inProcess = false;

    this.clModel	= new CloudShareClipModel(this);
    this.clView		= new CloudShareClipView(element);

    this.clView.element.createClip	= this.createClip.bind(this);

    this.clView.initDraw(this);
};

CloudShareClipController.prototype.processDone = function processDone ( description, clipinfo ) {
    this.inProcess = false;
    if (this.callback_func) {
	this.callback_func( this.inProcess ,description, clipinfo);
    }
}

CloudShareClipController.prototype.createClip = function createClip ( cloudcamera, accessToken, callback, start_time, clip_duration) {
    if (callback !== undefined) {
	this.callback_func = callback;
    }

    if (this.inProcess) {
	console.warn('CloudShareClip in process..');
	if (this.callback_func) {
	    this.callback_func( this.inProcess, 'CloudShareClip in process..');
	}
	return;
    }
    this.inProcess = true;

    if (this.callback_func) {
	this.callback_func( this.inProcess, 'CloudShareClip started');
    }

    if (clip_duration === undefined) {
	clip_duration = 20*1000; //ms
    }
    var end_time = start_time + clip_duration;
    var clipname = 'clip_' + start_time;
    var now = new Date();
    var delete_at = now.getTime() + 15*60*1000; //delete at 15min after create

    console.log('DEBUG create clip ' + cloudcamera.getName() + ' time:' +  start_time + ' dur:' + clip_duration);
    this.clModel.createClip( cloudcamera, accessToken, clipname, start_time, end_time, delete_at );
}

CloudShareClipController.prototype.showWait = function showWait (isWait) {
    console.log('DEBUG swhoWait '+ isWait);
    this.clView.showWait(isWait);
};

window.CloudPlayerNativeHLS = function(videoEl, hlsUrl){
	var mVideoEl = videoEl;
	var mHLSUrl = hlsUrl;
	var self = this;

	console.warn("[NativeHLS] canPlay: application/vnd.apple.mpegurl => ", mVideoEl.canPlayType('application/vnd.apple.mpegurl'))
	console.warn("[NativeHLS] canPlay: application/x-mpegURL => ", mVideoEl.canPlayType('application/x-mpegURL'))
	console.warn("[NativeHLS] canPlay: video/mp4 => ", mVideoEl.canPlayType('video/mp4'))

	self.play = function() {
		if (mVideoEl.children.length > 0) {
			mVideoEl.removeChild(mVideoEl.children[0]);
		}

		var source = document.createElement('source');
		source.src = mHLSUrl;
		source.type="video/mp4";

		mVideoEl.append(source);
		mVideoEl.load();
	}

	self.stop = function() {
		if (mVideoEl.children.length > 0) {
			mVideoEl.removeChild(mVideoEl.children[0]);
		}
	}


	mVideoEl.addEventListener("abort", function() {
		console.warn("[NativeHLS] abort");
	}, true);
	mVideoEl.addEventListener("canplay", function() {
		console.warn("[NativeHLS] canplay");
	}, true);
	mVideoEl.addEventListener("canplaythrough", function() {
		console.warn("[NativeHLS] canplaythrough");
	}, true);
	mVideoEl.addEventListener("durationchange", function() {
		console.warn("[NativeHLS] durationchange");
	}, true);
	mVideoEl.addEventListener("emptied", function() {
		console.warn("[NativeHLS] emptied");
	}, true);
	mVideoEl.addEventListener("encrypted", function() {
		console.warn("[NativeHLS] encrypted");
	}, true);
	mVideoEl.addEventListener("ended", function() {
		console.warn("[NativeHLS] ended");
	}, true);
	mVideoEl.addEventListener("error", function(err, err1) {
		console.error("[NativeHLS] error ", err);
		console.error("[NativeHLS] error ", err1);
	}, true);
	mVideoEl.addEventListener("interruptbegin", function() {
		console.warn("[NativeHLS] interruptbegin");
	}, true);
	mVideoEl.addEventListener("interruptend", function() {
		console.warn("[NativeHLS] interruptend");
	}, true);
	mVideoEl.addEventListener("loadeddata", function() {
		console.warn("[NativeHLS] loadeddata");
		mVideoEl.play();
	}, true);
	mVideoEl.addEventListener("loadedmetadata", function() {
		console.warn("[NativeHLS] loadedmetadata");
	}, true);
	mVideoEl.addEventListener("loadstart", function() {
		console.warn("[NativeHLS] loadstart");
	}, true);
	mVideoEl.addEventListener("mozaudioavailable", function() {
		console.warn("[NativeHLS] mozaudioavailable");
	}, true);
	mVideoEl.addEventListener("pause", function() {
		console.warn("[NativeHLS] pause");
	}, true);
	mVideoEl.addEventListener("play", function() {
		console.warn("[NativeHLS] play");
	}, true);
	mVideoEl.addEventListener("playing", function() {
		console.warn("[NativeHLS] playing");
	}, true);
	mVideoEl.addEventListener("progress", function() {
		console.warn("[NativeHLS] progress");
	}, true);
	mVideoEl.addEventListener("ratechange", function() {
		console.warn("[NativeHLS] ratechange");
	}, true);
	mVideoEl.addEventListener("seeked", function() {
		console.warn("[NativeHLS] seeked");
	}, true);
	mVideoEl.addEventListener("seeking", function() {
		console.warn("[NativeHLS] seeking");
	}, true);
	mVideoEl.addEventListener("stalled", function() {
		console.warn("[NativeHLS] stalled");
	}, true);
	mVideoEl.addEventListener("suspend", function() {
		console.warn("[NativeHLS] suspend");
	}, true);
	mVideoEl.addEventListener("timeupdate", function() {
		console.warn("[NativeHLS] timeupdate");
	}, true);
	mVideoEl.addEventListener("volumechange", function() {
		console.warn("[NativeHLS] volumechange");
	}, true);
	mVideoEl.addEventListener("waiting", function() {
		console.warn("[NativeHLS] waiting");
	}, true);

};



window.CloudPlayerNativeVideo = function(elId){
	var mVideoEl = document.getElementById(elId);
	var mSourceEl = null;
	var self = this;
	var _TAG = "[NativeVideo] ";
	var mAutoplayBlocked = null;
	var mResetCalled = false;
	var mCurrentTime = 0;
	var mCallbackError = null;

	function _checkAutoPlay(p) {
		var s = '';
		if (window['Promise']) {
			s = window['Promise'].toString();
		}

		if (s.indexOf('function Promise()') !== -1
			|| s.indexOf('function ZoneAwarePromise()') !== -1) {

			p.catch(function(error) {
				console.error(_TAG + "checkAutoplay, error:", error)
				// Check if it is the right error
				if(error.name == "NotAllowedError") {
					console.error(_TAG + "_checkAutoPlay: error.name:", "NotAllowedError")
					self.onAutoplayBlocked();
				} else if (error.name == "AbortError" && CloudHelpers.isSafari()) {
					console.error(_TAG + "_checkAutoPlay: AbortError (Safari)")
					self.onAutoplayBlocked();
				} else {
					console.error(error);
					console.error(_TAG + "checkAutoplay: happened something else");
					// throw error; // happened something else
				}
			}).then(function(){
				console.log(_TAG + "checkAutoplay: then");
				// Auto-play started
			});
		} else {
			console.error(_TAG + "checkAutoplay: could not work in your browser ", p);
		}
	}

	self.onAutoplayBlocked = function() {
		// nothing
	}

	self.on = function(event_t, func) {
		if (event_t == 'error') {
			mCallbackError = func;
			// mVideoEl.onerror = func;
		} else if (event_t == 'loadeddata') {
			mVideoEl.onloadeddata = func;
		} else if (event_t == 'ended') {
			mVideoEl.onended = func;
		} else if (event_t == 'autoplay_blocked') {
			mAutoplayBlocked = func;
		} else {
			console.error(_TAG + "ON Unknown " + event_t);
		}
	}

	self.off = function(event_t) {
		if (event_t == 'loadeddata') {
			mVideoEl.onloadeddata = null;
		} else if (event_t == 'ended') {
			mVideoEl.onended = null;
		} else {
			console.error(_TAG + "OFF Unknown " + event_t);
		}
	}

	self.ready = function(ready) {
		ready();
		console.log(_TAG + "TODO ready");
	}

	self.muted = function(b) {
		mVideoEl.muted = b;
		console.log(_TAG + "TODO muted");
	}

	self.volume = function(v) {
		if (v !== undefined) {
			mVideoEl.volume = v;
			return;
		}
		return mVideoEl.volume;
	}

	self.reset = function() {
		console.warn(_TAG, "reset");
		mResetCalled = true;
		mCurrentTime = 0;
		mVideoEl.pause();
		if (mSourceEl != null) {
			mSourceEl.removeAttribute('src');
		}
		mVideoEl.load();
	}

	self.controls = function(b) {
		console.log(_TAG + "TODO controls");
	}

	self.autoplay = function(b) {
		if (b == true) {
			console.error(_TAG + "Not supported autoplay");
		}
	}

	self.el = function() {
		return mVideoEl;
	}

	self.src = function(s) {
		// console.log(s);
		if (mSourceEl == null) {
			mSourceEl = document.createElement('source');
			mVideoEl.appendChild(mSourceEl);
		}
		mVideoEl.pause();
		if(!CloudHelpers.isIE()){
			mVideoEl.currentTime = 0;
		}
		mSourceEl.setAttribute('src', s[0].src);
		mVideoEl.load();
		// self.play();
		// mVideoEl.play();
	}

	self.currentTime = function(v) {
		if (v !== undefined) {
			mCurrentTime = v;
			if(!CloudHelpers.isIE()){
				mVideoEl.currentTime = v;
			}
			return;
		}
		return mVideoEl.currentTime || mCurrentTime;
	}

	self.play = function() {
		_checkAutoPlay(mVideoEl.play());
	}

	self.pause = function() {
		mVideoEl.pause();
	}

	mVideoEl.addEventListener("abort", function() {
		// console.warn(_TAG + "abort");
	}, true);
	mVideoEl.addEventListener("canplay", function() {
		// console.warn(_TAG + "canplay");
	}, true);
	mVideoEl.addEventListener("canplaythrough", function() {
		// console.warn(_TAG + "canplaythrough");
	}, true);
	mVideoEl.addEventListener("durationchange", function() {
		// console.warn(_TAG + "durationchange");
	}, true);
	mVideoEl.addEventListener("emptied", function() {
		// console.warn(_TAG + "emptied");
	}, true);
	mVideoEl.addEventListener("encrypted", function() {
		// console.warn(_TAG + "encrypted");
	}, true);
	mVideoEl.addEventListener("ended", function() {
		console.warn(_TAG + "ended");
	}, true);
	mVideoEl.addEventListener("error", function(err0, err1) {
		console.error(_TAG + "err0 ", err0);
		/*if (mResetCalled == true) {
			console.warn(_TAG + "Skip error after reset");
			mResetCalled = false;
			return;
		}*/
		if (mCallbackError != null) {
			mCallbackError(err0);
		}
		// console.error(_TAG + " err1 ", err1);
	}, true);
	mVideoEl.addEventListener("interruptbegin", function() {
		// console.warn(_TAG + "interruptbegin");
	}, true);
	mVideoEl.addEventListener("interruptend", function() {
		// console.warn(_TAG + "interruptend");
	}, true);
	mVideoEl.addEventListener("loadeddata", function() {
		// console.warn(_TAG + "loadeddata");
		mVideoEl.currentTime = mCurrentTime;
		// console.warn(_TAG + "currentTime = " + mCurrentTime);
	}, true);
	mVideoEl.addEventListener("loadedmetadata", function() {
		// console.warn(_TAG + "loadedmetadata");
	}, true);
	mVideoEl.addEventListener("loadstart", function() {
		// console.warn(_TAG + "loadstart");
	}, true);
	mVideoEl.addEventListener("mozaudioavailable", function() {
		// console.warn(_TAG + "mozaudioavailable");
	}, true);
	mVideoEl.addEventListener("pause", function() {
		// console.warn(_TAG + "pause");
	}, true);
	mVideoEl.addEventListener("play", function() {
		// console.warn(_TAG + "play");
	}, true);
	mVideoEl.addEventListener("playing", function() {
		// console.warn(_TAG + "playing");
	}, true);
	mVideoEl.addEventListener("progress", function() {
		// console.warn(_TAG + "progress");
	}, true);
	mVideoEl.addEventListener("ratechange", function() {
		// console.warn(_TAG + "ratechange");
	}, true);
	mVideoEl.addEventListener("seeked", function() {
		// console.warn(_TAG + "seeked");
	}, true);
	mVideoEl.addEventListener("seeking", function() {
		// console.warn(_TAG + "seeking");
	}, true);
	mVideoEl.addEventListener("stalled", function() {
		// console.warn(_TAG + "stalled");
	}, true);
	mVideoEl.addEventListener("suspend", function() {
		// console.warn(_TAG + "suspend");
	}, true);
	mVideoEl.addEventListener("timeupdate", function() {
		// console.warn(_TAG + "timeupdate");
	}, true);
	mVideoEl.addEventListener("volumechange", function() {
		// console.warn(_TAG + "volumechange");
	}, true);
	mVideoEl.addEventListener("waiting", function() {
		// console.warn(_TAG + "waiting");
	}, true);

};



window.CloudPlayerWebRTC0 = function(videoEl, srv, rtmpUrl){
	// for VXG Server
	var mVideoEl = videoEl;
	var mWSServer = srv;
	var mRtmpUrl = rtmpUrl;
	var peer_connection = null;
	var _TAG = "[WEBRTC0] ";
	/*var rtc_configuration = {iceServers: [{urls: "stun:stun.services.mozilla.com"},
										  {urls: "stun:stun.l.google.com:19302"}]};*/

	var rtc_configuration = {iceServers: [{
			urls: "stun:stun.l.google.com:19302"
		}, {
			"urls": ["turn:turn.vxg.io:3478?transport=udp"],
			"username": "vxgturn",
			"credential": "vxgturn"
		}
	]};

	var self = this;

	var ws_conn;
	var mPeerId = Math.floor(Math.random() * (9000 - 10) + 10).toString();
	self.onWsError = function(msg){
		console.error(msg);
	}

	self.onAutoplayBlocked = function() {
        // nothing
        console.error(_TAG + "onAutoplayBlocked");
    }

    function _checkAutoPlay(p) {
		var s = '';
		if (window['Promise']) {
			s = window['Promise'].toString();
		}

		if (s.indexOf('function Promise()') !== -1
			|| s.indexOf('function ZoneAwarePromise()') !== -1) {

			p.catch(function(error) {
				console.error(_TAG + "_checkAutoplay, error:", error)
				// Check if it is the right error
				if(error.name == "NotAllowedError") {
					console.error(_TAG + "_checkAutoPlay: error.name:", "NotAllowedError")
					self.onAutoplayBlocked();
				} else if (error.name == "AbortError" && CloudHelpers.isSafari()) {
					console.error(_TAG + "_checkAutoPlay: AbortError (Safari)")
					self.onAutoplayBlocked();
				} else {
					console.error(error);
					console.error(_TAG + "checkAutoplay: happened something else");
					// throw error; // happened something else
				}
			}).then(function(){
				console.log(_TAG + "checkAutoplay: then");
				// Auto-play started
			});
		} else {
			console.error(_TAG + "_checkAutoplay: could not work in your browser ", p);
		}
	}

	if (CloudHelpers.isSafari() ) {
        navigator.mediaDevices.getUserMedia({ "audio": false, "video": true}).then(function (stream) {
            console.log(_TAG + "Camera permission granted");
        }).catch(function(a1, a2){
			console.error(a1, a2)
		});
    }

	self.pause = function() {
	    if (mVideoEl && mVideoEl.src) {
		mVideoEl.pause();
	    }
	}

	self.play = function() {
	    if (mVideoEl && mVideoEl.src) {
		mVideoEl.play();
	    }
	}

	self.resetState = function() {
		// This will call onServerClose()
		ws_conn.close();
	}

	self.handleIncomingError = function(error) {
		console.error(_TAG + "IncomingError: ", error);
		resetState();
	}

	self.resetVideoElement = function() {
		mVideoEl.pause();
		mVideoEl.src = "";
		mVideoEl.load();
	}

	// SDP offer received from peer, set remote description and create an answer
	self.onIncomingSDP = function(sdp) {
		sdp.sdp = sdp.sdp.replace(/profile-level-id=[^;]+/, 'profile-level-id=42e01f');
		console.log(_TAG + 'Incoming SDP is ' + JSON.stringify(sdp));
		peer_connection.setRemoteDescription(sdp).then(function(){
			console.log("Remote SDP set");
			if (sdp.type != "offer")
				return;
			console.log(_TAG + "Got SDP offer, creating answer");
			peer_connection.createAnswer().then(self.onLocalDescription).catch(function(t){
				console.error('[WEBRTC0] createAnswer: ', t);
			});
		}).catch(function(t){
			console.error(_TAG + 'setRemoteDescription: ', t);
		});
	}

	// Local description was set, send it to peer
	self.onLocalDescription = function(desc) {
		console.log(_TAG + 'Got local description: ' + JSON.stringify(desc));
		peer_connection.setLocalDescription(desc).then(function() {
			console.log(_TAG + 'Sending SDP answer');
			sdp = {'sdp': peer_connection.localDescription}
			ws_conn.send(JSON.stringify(sdp));
			console.warn(_TAG + 'Streaming (1)');
			_checkAutoPlay(mVideoEl.play());
		});
	}

	// ICE candidate received from peer, add it to the peer connection
	self.onIncomingICE = function(ice) {
		console.log(_TAG + 'Incoming ICE: ' + JSON.stringify(ice));
		var candidate = new RTCIceCandidate(ice);
		peer_connection.addIceCandidate(candidate).catch(function(t){
			console.error(_TAG + 'addIceCandidate ', t);
		});
	}

	self.onServerMessage = function(event) {
		console.log(_TAG + "Received " + event.data);
		switch (event.data) {
			case "HELLO":
				console.log(_TAG + "Registered with server, waiting for stream");
				return;
			default:
				if (event.data.startsWith("ERROR")) {
					self.handleIncomingError(event.data);
					return;
				}
				// Handle incoming JSON SDP and ICE messages
				try {
					msg = JSON.parse(event.data);
				} catch (e) {
					if (e instanceof SyntaxError) {
						handleIncomingError("Error parsing incoming JSON: " + event.data);
					} else {
						handleIncomingError("Unknown error parsing response: " + event.data);
					}
					return;
				}

				// Incoming JSON signals the beginning of a call
				if (peer_connection == null)
					self.createCall(msg);

				if (msg.sdp != null) {
					self.onIncomingSDP(msg.sdp);
				} else if (msg.ice != null) {
					self.onIncomingICE(msg.ice);
				} else {
					self.handleIncomingError("Unknown incoming JSON: " + msg);
				}
		}
	}

	// window.onload = websocketServerConnect;

	self.stopWS = function(){
		ws_conn.close();
		// self.onServerClose();
		// delete self;
	}

	self.onServerClose = function(event) {
		self.resetVideoElement();

		if (peer_connection != null) {
			peer_connection.close();
			peer_connection = null;
		}

		// Reset after a second
		// window.setTimeout(websocketServerConnect, 1000);
	}

	self.onServerError = function(event) {
		console.error("[WEBRTC0] Unable to connect to server, did you add an exception for the certificate?")
	}

	self.onRemoteStreamAdded = function(event) {
		videoTracks = event.stream.getVideoTracks();
		audioTracks = event.stream.getAudioTracks();

		if (videoTracks.length > 0) {
			console.log('[WEBRTC0] Incoming stream: ' + videoTracks.length + ' video tracks and ' + audioTracks.length + ' audio tracks');
			mVideoEl.srcObject = event.stream;
		} else {
			self.handleIncomingError('[WEBRTC0] Stream with unknown tracks added, resetting');
		}
	}

	self.errorUserMediaHandler = function() {
		console.error("[WEBRTC0] Browser doesn't support getUserMedia!");
	}

	self.createCall = function(msg) {
		// Reset connection attempts because we connected successfully
		connect_attempts = 0;

		peer_connection = new RTCPeerConnection(rtc_configuration);
		peer_connection.onaddstream = self.onRemoteStreamAdded;
		/* Send our video/audio to the other peer */

		if (!msg.sdp) {
			console.log("[WEBRTC0] WARNING: First message wasn't an SDP message!?");
		}

        peer_connection.onicecandidate = function(event) {
			// We have a candidate, send it to the remote party with the
			// same uuid
			if (event.candidate == null) {
				console.error("[WEBRTC0] ICE Candidate was null, done"); // why log error ?
				return;
			}
			ws_conn.send(JSON.stringify({'ice': event.candidate}));
		};

		console.log("[WEBRTC0] Created peer connection for call, waiting for SDP");
	}

	self.startWS = function() {
		self.connect_attempts++;
		if (self.connect_attempts > 3) {
			console.error("[WEBRTC0] Too many connection attempts, aborting. Refresh page to try again");
			return;
		}
		console.log("[WEBRTC0] Connecting to server...");
		loc = null;

		ws_conn = new WebSocket(mWSServer);
		/* When connected, immediately register with the server */
		ws_conn.addEventListener('open', function(event) {
			ws_conn.send('HELLO ' + mPeerId);
			console.log(_TAG + "Registering with server");
			ws_conn.send('SPAWN ' + mRtmpUrl)
		});
		ws_conn.addEventListener('error', self.onServerError);
		ws_conn.addEventListener('message', self.onServerMessage);
		ws_conn.addEventListener('close', self.onServerClose);

		var constraints = {video: true, audio: true};
	}

};



window.CloudPlayerWebRTC2 = function(objVideoEl, strConnectionUrl, arrIceServers, options) {
    options = options || {};
    var self = this;
    var _TAG = "[WEBRTC2] ";

    console.log(_TAG, options);

    var m_objVideoEl = objVideoEl;
	var m_strPeerOnVideoEl = "";
	var m_strConnectionUrl = strConnectionUrl || "";
	var m_bSendVideo = options.send_video || false;
	var m_bSendAudio = options.send_audio || false;
	var m_mapPeers = {};
	var m_objRTCConfiguration = {iceServers: arrIceServers || []};
	var m_bIsPublisher = false;
	var m_objWS = null;
    // console.log("m_bSendVideo: ", m_bSendVideo);
    // console.log("m_bSendAudio: ", m_bSendAudio);
	self.onWsError = function(msg) {
		console.error("[WEBRTC2] onWsError, ", msg);
	}

	/*if (CloudHelpers.isSafari()) {
        navigator.mediaDevices.getUserMedia({ "audio": true, "video": true}).then(function (stream) {
            console.log("[WEBRTC2] Camera permission granted");
        }).catch(function(a1, a2){
            console.error("[WEBRTC2] error on getUserMedia (1) a1 = ", a1);
            console.error("[WEBRTC2] error on getUserMedia (1) a2 = ", a2);
		});
	}*/

	self.resetState = function() {
		m_objWS.close();    // It will call onServerClose()
	}

	self.handleIncomingError = function(error) {
		console.error("[WEBRTC2] ERROR: ", error);
		self.resetState();
	}

    self.pause = function() {
	if (m_objVideoEl && m_objVideoEl.srcObject) {
	    m_objVideoEl.pause();
	}
    }

    self.play = function() {
	if (m_objVideoEl && m_objVideoEl.srcObject) {
	    m_objVideoEl.play();
	}
    }

    self.reset = function() {
        if (m_objVideoEl && m_objVideoEl.srcObject) {
            m_objVideoEl.pause();
            m_objVideoEl.srcObject = null;
            m_strPeerOnVideoEl = "";
            m_objVideoEl.load();
            // m_objVideoEl.onl
	    }
    }

    self.el = function() {
		return m_objVideoEl;
    }

    self.onAutoplayBlocked = function() {
        // nothing
        console.error(_TAG + "onAutoplayBlocked");
    }

	function _checkAutoPlay(p) {
		var s = '';
		if (window['Promise']) {
			s = window['Promise'].toString();
		}

		if (s.indexOf('function Promise()') !== -1
			|| s.indexOf('function ZoneAwarePromise()') !== -1) {

			p.catch(function(error) {
				console.error(_TAG + "_checkAutoplay, error:", error)
				// Check if it is the right error
				if(error.name == "NotAllowedError") {
					console.error(_TAG + "_checkAutoPlay: error.name:", "NotAllowedError")
					self.onAutoplayBlocked();
				} else if (error.name == "AbortError" && CloudHelpers.isSafari()) {
					console.error(_TAG + "_checkAutoPlay: AbortError (Safari)")
					self.onAutoplayBlocked();
				} else {
					console.error(error);
					console.error(_TAG + "checkAutoplay: happened something else");
					// throw error; // happened something else
				}
			}).then(function(){
				console.log(_TAG + "checkAutoplay: then");
				// Auto-play started
			});
		} else {
			console.error(_TAG + "_checkAutoplay: could not work in your browser ", p);
		}
	}

	function _videoOnLoadedData() {
		console.warn(_TAG + "loadeddata");
		console.warn(_TAG + "currentTime = " + m_objVideoEl.currentTime);
	}

	self.initCalbacks = function () {
		if (m_objVideoEl) {
			m_objVideoEl.addEventListener("loadeddata", _videoOnLoadedData, true);
		}
	}

	self.removeCalbacks = function () {
		if (m_objVideoEl) {
			m_objVideoEl.removeEventListener("loadeddata", _videoOnLoadedData, true);
		}
	}

	self.createWatchingConnection = function(strSessionPartnerPeerUID) {
		// Reset connection attempts because we connected successfully
		connect_attempts = 0;
		console.assert( !(strSessionPartnerPeerUID in m_mapPeers) );
		objPeer = new RTCPeerConnection(m_objRTCConfiguration);
		objPeer.strPeerUID = strSessionPartnerPeerUID;
		m_mapPeers[strSessionPartnerPeerUID] = objPeer;
		objPeer.onaddstream = self.onRemoteStreamAdded;
		objPeer.onicecandidate = function(event) {
			if (event.candidate == null) {
				console.error("[WEBRTC2] ICE Candidate was null, done");
				return;
			}
			m_objWS.send(JSON.stringify({'to': strSessionPartnerPeerUID, 'ice': event.candidate}));
		};
		console.log("[WEBRTC2] Created peer connection for call, waiting for SDP");
	}

	self.getUserMediaConstraints = function() {
		var constraints = {};
		// this must be configurable
		constraints.audio = m_bSendAudio;
		constraints.video = m_bSendVideo;
		try {
			console.warn(_TAG + "getSupportedConstraints: ", navigator.mediaDevices.getSupportedConstraints());
		} catch(e) {
			console.error(_TAG + "error on getSupportedConstraints", e);
		}
		return constraints;
	}
	self.createPublishingConnection = function(strSessionPartnerPeerUID) {
		connect_attempts = 0;   // Reset connection attempts because we connected successfully
		console.assert( !(strSessionPartnerPeerUID in m_mapPeers) );
		m_bIsPublisher = true;
		if (!m_bSendAudio && !m_bSendVideo) {
			console.error("[WEBRTC2] Publisher must send audio or video stream");
			return;
		}
		navigator.mediaDevices.getUserMedia(self.getUserMediaConstraints()).then(function (objLocalStream) {
			console.log("[WEBRTC2] Local stream successfully received");
			var objPeer = new RTCPeerConnection(m_objRTCConfiguration);
			objPeer.strPeerUID = strSessionPartnerPeerUID;
			m_mapPeers[strSessionPartnerPeerUID] = objPeer;
			objPeer.onaddstream = self.onRemoteStreamAdded; // Required when a watcher is sending a stream
			objPeer.onicecandidate = function(event) {
				// We have a candidate, send it to the remote party with the same uuid
				if (event.candidate == null) {
					console.error("[WEBRTC2] ICE Candidate was null, done");
					return;
				}
				m_objWS.send(JSON.stringify({'to': strSessionPartnerPeerUID, 'ice': event.candidate}));
			};
			objPeer.onconnectionstatechange = function(event) {
				console.error("[WEBRTC2] Connection state changed " + objPeer.connectionState);
			};
			console.log("[WEBRTC2] Created peer connection for publishing");
			objPeer.addStream(objLocalStream);
			console.log("[WEBRTC2] Local SDP set");
			objPeer.createOffer().then(function(offer) {
				objPeer.setLocalDescription(offer)
				console.log("[WEBRTC2] Sending SDP offer");
				sdp = {'to': strSessionPartnerPeerUID, 'sdp': offer}
				m_objWS.send(JSON.stringify(sdp));
				console.warn("[WEBRTC2] Streaming (1)");
			}).catch(function(t){
				console.error('[WEBRTC2] error on createOffer ', t);
			});
		}).catch(function(a1, a2){
			console.error("[WEBRTC2] error on getUserMedia a1 = ", a1);
			console.error("[WEBRTC2] error on getUserMedia a2 = ", a2);
		});
	}

	// SDP received from peer, set remote description and create an answer when necessary
	self.onIncomingSDP = function(strSessionPartnerPeerUID, objSessionPartnerPeer, sdp) {
		sdp.sdp = sdp.sdp.replace(/profile-level-id=[^;]+/, 'profile-level-id=42e01f');
		console.log("[WEBRTC2] Incoming SDP from " + strSessionPartnerPeerUID + ": " + JSON.stringify(sdp));

		objSessionPartnerPeer.setRemoteDescription(sdp).then(function() {
			console.log("[WEBRTC2] Remote SDP set");
			if (m_bIsPublisher) {
				console.assert(sdp.type === "answer");
				console.log("[WEBRTC2] Got SDP answer from " + strSessionPartnerPeerUID);
			} else {
				console.assert(sdp.type === "offer");
				console.log("[WEBRTC2] Got SDP offer from " + strSessionPartnerPeerUID);
				// Local description was set, send it to peer
				onLocalDescription = function(desc) {
					console.log("[WEBRTC2] Got local description: " + JSON.stringify(desc));
					objSessionPartnerPeer.setLocalDescription(desc).then(function() {
						console.log("[WEBRTC2] Sending SDP answer to " + strSessionPartnerPeerUID);
						sdp = {'to': strSessionPartnerPeerUID, 'sdp': objSessionPartnerPeer.localDescription}
						m_objWS.send(JSON.stringify(sdp));
						console.warn("[WEBRTC2] Streaming (2)");
						self.onStartStreaming();
						_checkAutoPlay(m_objVideoEl.play());
					});
				}
				// Are watcher going to send its streams to publisher?
				if (m_bSendVideo || m_bSendAudio) {
					console.log("[WEBRTC2] Watcher is configured to send stream");
					navigator.mediaDevices.getUserMedia({audio: m_bSendAudio, video: m_bSendVideo}).then(function(objLocalStream) {
						objSessionPartnerPeer.addStream(objLocalStream);
						console.log("[WEBRTC2] Local SDP set, creating answer");
						objSessionPartnerPeer.createAnswer().then(onLocalDescription).catch(function(t){
							console.error('[WEBRTC2] error on createAnswer (1) ', t);
						});
					});
				} else {
					console.log("[WEBRTC2] Creating answer without stream sending");
					objSessionPartnerPeer.createAnswer().then(onLocalDescription).catch(function(t){
						console.error('[WEBRTC2] error on createAnswer (2) ', t);
					});
				}
			}
		}).catch(function(t){
			console.error('[WEBRTC2] error on setRemoteDescription ', t);
		});
	}

	// ICE candidate received from peer, add it to the peer connection
	self.onIncomingICE = function(strSessionPartnerPeerUID, objSessionPartnerPeer, ice) {
		console.log("[WEBRTC2] Incoming ICE from " + strSessionPartnerPeerUID + ": " + JSON.stringify(ice));
		var candidate = new RTCIceCandidate(ice);
		objSessionPartnerPeer.addIceCandidate(candidate).catch(function(t){
			console.error('[WEBRTC2] error on addIceCandidate ', t);
		});
	}

	self.onServerMessage = function(event) {
		console.log("[WEBRTC2] Received " + event.data);
		if (event.data.startsWith("HELLO")) {
			console.log("[WEBRTC2] Registered with server, waiting for stream");
			return;
		} else if (event.data.startsWith("SESSION_STARTED")) {
			var strSessionPartnerPeerUID = event.data.split(" ")[1];
			console.log("[WEBRTC2] Publisher " + strSessionPartnerPeerUID + " is going to start session");
			self.createWatchingConnection(strSessionPartnerPeerUID);
			return;
		} else if (event.data.startsWith("SESSION_STOPPED")) {
			var strSessionPartnerPeerUID = event.data.split(" ")[1];
			console.log("[WEBRTC2] Session of publisher " + strSessionPartnerPeerUID + " is terminated");
			if (strSessionPartnerPeerUID in m_mapPeers) {
				if (!!m_mapPeers[strSessionPartnerPeerUID]) {
					m_mapPeers[strSessionPartnerPeerUID].close();
					m_mapPeers[strSessionPartnerPeerUID] = null;
				}
				delete m_mapPeers[strSessionPartnerPeerUID];
				if (m_objVideoEl && m_strPeerOnVideoEl === strSessionPartnerPeerUID) {
					self.reset();
				}
			}
			return;
		} else if (event.data.startsWith("START_SESSION")) {
			var strSessionPartnerPeerUID = event.data.split(" ")[1];
			console.log("[WEBRTC2] Watcher " + strSessionPartnerPeerUID + " has come and awaiting for publishing");
			self.createPublishingConnection(strSessionPartnerPeerUID);
			return;
		} else if (event.data.startsWith("ERROR")) {
			self.handleIncomingError(event.data);
			return;
		} else {
			// Handle incoming JSON SDP and ICE messages
			var objMsg = null, strPeerUID = "", objPeer = null;
			try {
				objMsg = JSON.parse(event.data);
				strPeerUID = objMsg.from
				objPeer = m_mapPeers[strPeerUID]
			} catch (e) {
				if (e instanceof SyntaxError) {
					self.handleIncomingError("Error parsing incoming JSON: " + event.data);
				} else {
					self.handleIncomingError("Unknown error parsing response: " + event.data);
				}
				return;
			}
			if (objMsg.sdp != null) {
				self.onIncomingSDP(strPeerUID, objPeer, objMsg.sdp);
			} else if (objMsg.ice != null) {
				self.onIncomingICE(strPeerUID, objPeer, objMsg.ice);
			} else {
				self.handleIncomingError("Unknown incoming JSON: " + objMsg);
			}
		}
	}

	// window.onload = websocketServerConnect;

	self.stopWS = function(){
		m_objWS.close();
		self.removeCalbacks();
		// self.onServerClose();
		// delete self;
	}

	self.onServerClose = function(event) {
		console.error("[WEBRTC2] Closed WebRTC ", event);
		self.reset();
		for (strSessionPartnerPeerUID in m_mapPeers) {
			if (!!m_mapPeers[strSessionPartnerPeerUID]) {
				m_mapPeers[strSessionPartnerPeerUID].close();
				m_mapPeers[strSessionPartnerPeerUID] = null;
			}
		}
		m_mapPeers = {};
	}

	self.onServerError = function(event) {
		console.error("[WEBRTC2] Unable to connect to server, did you add an exception for the certificate?", event)
	}

	self.onStartStreaming = function() {
		//stub for event
	}

	self.onRemoteStreamAdded = function(event) {
		videoTracks = event.stream.getVideoTracks();
		audioTracks = event.stream.getAudioTracks();
		if (videoTracks.length > 0 || audioTracks.length > 0) {
			console.log('[WEBRTC2] Incoming stream: ' + videoTracks.length + ' video tracks and ' + audioTracks.length + ' audio tracks');
			if (m_objVideoEl && m_strPeerOnVideoEl === "") {
			    m_objVideoEl.srcObject = event.stream;
			    m_strPeerOnVideoEl = event.currentTarget.strPeerUID;
			}
		} else {
			self.handleIncomingError('[WEBRTC2] Stream with unknown tracks added, resetting');
		}
	}

	self.errorUserMediaHandler = function() {
		console.error("[WEBRTC2] Browser doesn't support getUserMedia!");
	}

	self.startWS = function() {
		self.connect_attempts++;
		if (self.connect_attempts > 3) {
			console.error("[WEBRTC2] Too many connection attempts, aborting. Refresh page to try again");
			return;
		}
		console.log("[WEBRTC2] Connecting to server...");

		m_objWS = new WebSocket(m_strConnectionUrl);

		/* When connected, immediately register with the server */
		m_objWS.addEventListener('open', function(event) {
			m_objWS.send('HELLO ' + window.CloudPlayerWebRTC2.version);
			console.log("[WEBRTC2] Registering with server");
		});
		m_objWS.addEventListener('error', self.onServerError);
		m_objWS.addEventListener('message', self.onServerMessage);
		m_objWS.addEventListener('close', self.onServerClose);

		var constraints = {video: true, audio: true};
	}
};

window.CloudPlayerWebRTC2.version = "2.0.3";
/*------SUPPORTS-----*/
var JpegPlayerQue = function JpegPlayerQue( limitSize ){
	this.limit = limitSize;
	this.array = [];
}

JpegPlayerQue.prototype.isEmpty = function() {
	return (this.array.length == 0);
}

JpegPlayerQue.prototype.push = function(dataelement) {
	if(this.array.length < this.limit){
		this.array.push(dataelement);
		return this.array.length;
	}
	return -1;
}

JpegPlayerQue.prototype.pop = function() {
	if(!this.isEmpty()){
		return this.array.shift();
	}
	return undefined;
}

JpegPlayerQue.prototype.peek = function() {
	if(!this.isEmpty()) {
		return this.array[0];
	}
	return undefined;
}

JpegPlayerQue.prototype.clear = function() {
	while (this.array.length > 0) {
		this.array.pop();
	}
}

JpegPlayerQue.prototype.size = function () {
	return this.array.length;
}

/*-------MODEL-------*/
var JpegPlayerModel = function JpegPlayerModel( quelimitsize ) {
	this.quelimit = quelimitsize || 100;
	this.queue = new JpegPlayerQue( quelimitsize );
	this.callback_lowdata = undefined;
	this.callback_time = undefined;
	this.lasttime = undefined;
	this.need_more_data = false;
	this.data_is_over = false;
};

JpegPlayerModel.prototype.stop = function () {
	this.data_is_over = false;
	this.need_more_data = false;

	this.queue.clear();
	this.lasttime = undefined;
	this.need_more_data = false;
}

JpegPlayerModel.prototype.pushImageInfo = function ( imageinfo) {
	if (imageinfo == null) {
		this.data_is_over = true;
		this.need_more_data = false;
	} else {
		this.queue.push(imageinfo);
		this.need_more_data = false;
		this.data_is_over = false;
		this.lasttime = imageinfo.utctime;
	}
}

JpegPlayerModel.prototype.getData = function getData( updateDataCBFunc ) {
	var data = {};

	var imageInfo = this.queue.pop();
	if ( imageInfo !== undefined ){
		try {
			data.url	= imageInfo.url;
			data.width	= imageInfo.width;
			data.height	= imageInfo.height;
			data.time	= imageInfo.time;
			data.utctime 	= imageInfo.utctime;
		} catch (e) {
			data.url = undefined;
		}
	} else {
		data.url = undefined;
	}

	if (this.queue.size() < this.quelimit/4) {
		if (this.callback_lowdata!= null && this.callback_lowdata !== undefined) {
			if (!this.need_more_data) {
				this.callback_lowdata(this.lasttime);
				this.need_more_data = true;
			}
		}
	}
	if (data.utctime) {
		if (this.callback_time != null && this.callback_time !== undefined) {
			this.callback_time( data.utctime);
		}
	}
	data.data_is_over = this.data_is_over;

	updateDataCBFunc( data);
}

/*-------VIEW--------*/

var JpegPlayerView = function JpegPlayerView(element, controller) {
	this.element = element;
	this.controller = controller;
	this.renderPeriod = 1000;
	this.startImageUpdateTime = -1;
	this.updateTO = null;
	this.isRunning = false;
	this.lastHeight = undefined;
	this.lastWidth = undefined;
	this.lastRenderTime = -1;
	this.currentImage = null;
};

JpegPlayerView.prototype.getCurrentImage = function() {
	return this.currentImage;
}

JpegPlayerView.prototype.needToUpdateData = function(){
	let self = this;

	if(!self.isRunning){
		return;
	}

	if (self.startImageUpdateTime > 0) {
		var currtime = new Date().getTime();
		var difftime = currtime - self.startImageUpdateTime;
		if (difftime > self.renderPeriod) {
			console.warn("Slowly imageload (more than " + self.renderPeriod +"ms): render speed is down ");
			self.updateTO = setTimeout(function(){
				self.controller.clModel.getData(self.controller.updateDataCB.bind(self.controller) );
			},0);
		} else {
			var delta = self.renderPeriod - difftime;
			//console.log("Get new data in " + delta  + " ms");
			self.updateTO = setTimeout(function(){
				self.controller.clModel.getData(self.controller.updateDataCB.bind(self.controller) );
			}, delta );
		}
	} else {
		console.warn('No image, try again');
		self.updateTO = setTimeout(function(){
			self.controller.clModel.getData(self.controller.updateDataCB.bind(self.controller) );
		}, self.renderPeriod);
	}
}

JpegPlayerView.prototype.initDraw = function initDraw(controller, cameraName, meta) {

	this.element.innerHTML =
	 '<div class= "JpegPlayerContainer" style="width:100%;height:100%;">'
	+'	<div class="JpegPlayerImages" style="position:relative;z-index:-1;width: 100%;height:100%;">'
	+'		<iframe class="JpegPlayerResizeCatcher" style="position:relative;z-index:-10; width:100%; height:100%; border:none;"></iframe>'
	+'		<img class="JpegPlayerImg0" style="position: absolute; display:none;"></img>'
	+'		<img class="JpegPlayerImg1" style="position: absolute;"></img>'
	+'	</div>'
	+'</div>';

	this.container = this.element.getElementsByClassName('JpegPlayerContainer')[0];
	this.images	= this.element.getElementsByClassName('JpegPlayerImages')[0];
	this.inv_img  = this.element.getElementsByClassName('JpegPlayerImg0')[0];
	this.vis_img  = this.element.getElementsByClassName('JpegPlayerImg1')[0];
	this.resizeCatcher = this.element.getElementsByClassName('JpegPlayerResizeCatcher')[0].contentWindow;
	this.curimg = 0;
	let self = this;

	this.resizeCatcher.addEventListener( "resize", function(event){
		var w = self.lastWidth || undefined;
		var h = self.lastHeight || undefined;
		self.fitToContainer( w, h );
	});

	this.inv_img.addEventListener("load", function(){
		self.currentImage = self.inv_img.src;
		self.vis_img.src = self.inv_img.src;
		self.vis_img.style.display = "";
		self.needToUpdateData();
	});
}

JpegPlayerView.prototype.fitToContainer = function fitToContainer( imgw, imgh){
	if (imgw === undefined && imgh === undefined){
//		this.inv_img.style.width = '100%';
//		this.inv_img.style.height= '100%';
//		this.vis_img.style.width = '100%';
//		this.vis_img.style.height= '100%';
	} else {
		var divh = this.images.clientHeight;
		var divw = this.images.clientWidth;

		var dar = divw/divh;
		var par = imgw/imgh;

		if (dar > par) {
			this.inv_img.style.height= '100%';
			this.vis_img.style.height= '100%';
			this.inv_img.style.width =  divh*par +'px';
			this.vis_img.style.width =  divh*par +'px';
			this.inv_img.style.right =  (divw - divh*par)/2 +'px';
			this.vis_img.style.right =  (divw - divh*par)/2 +'px';
			this.inv_img.style.top =  0;
			this.vis_img.style.top =  0;
		} else {
			this.inv_img.style.width= '100%';
			this.vis_img.style.width= '100%';
			this.inv_img.style.height =  divw/par +'px';
			this.vis_img.style.height =  divw/par +'px';
			this.inv_img.style.top =  (divh - divw/par)/2 +'px';
			this.vis_img.style.top =  (divh - divw/par)/2 +'px';
			this.inv_img.style.right =  0;
			this.vis_img.style.right =  0;
		}
	}
}

JpegPlayerView.prototype.render = function render(JpegPlayerdata) {
	var self = this;
	if (self.updateTO){
		clearTimeout(self.updateTO);
		self.updateTO = null;
	}
	if (JpegPlayerdata.url !== undefined) {
		self.startImageUpdateTime = new Date().getTime();
		self.lastRenderTime	= JpegPlayerdata.utctime;
		self.inv_img.src	= JpegPlayerdata.url;
	} else {
		self.startImageUpdateTime = -1;
		if (self.vis_img.src === ""){
			self.vis_img.style.display = "none";
		}
		if(!JpegPlayerdata.data_is_over) {
			self.needToUpdateData();
		} else {
			console.warn('[jpegplayer] data is over');
		}
	}

	var w = JpegPlayerdata.width || self.lastWidth || undefined;
	var h = JpegPlayerdata.height || self.lastHeight || undefined;

	self.lastHeight = h;
	self.lastWidth = w;

	self.fitToContainer( w, h );
}

JpegPlayerView.prototype.start = function(){
	if (this.updateTO){
		clearTimeout(this.updateTO);
		this.updateTO = null;
	}
	this.lastRenderTime = -1;
	this.isRunning = true;
}

JpegPlayerView.prototype.stop = function(){
	if (this.updateTO){
		clearTimeout(this.updateTO);
		this.updateTO = null;
	}
	this.lastRenderTime = -1;
	this.isRunning = false;
}

/*------CONTROLLER--*/
///init component func
///element - <div>-element to which VXGChart vill be connected
var JpegPlayerController = function JpegPlayerController(element, quesize ) {
	if (element === undefined) {
		return;
	}
	var qs = quesize || 100;

	this.clModel	= new JpegPlayerModel( qs );
	this.clView		= new JpegPlayerView (element, this);

	this.clView.element.run = this.run.bind(this);
	this.clView.element.stop = this.stop.bind(this);

	this.clView.element.getShot = this.getShot.bind(this);
	this.clView.element.pushImageInfo = this.pushImageInfo.bind(this);
	this.clView.element.setLowDataCB = this.setLowDataCB.bind(this);
	this.clView.element.setTimeCB    = this.setTimeCB.bind(this);

	this.clView.initDraw(this);
};

JpegPlayerController.prototype.pushImageInfo = function pushImageInfo( obj ) {
	this.clModel.pushImageInfo(obj);
}

JpegPlayerController.prototype.setLowDataCB = function ( func  ) {
	this.clModel.callback_lowdata = func.bind();
}

JpegPlayerController.prototype.setTimeCB = function ( func  ) {
	this.clModel.callback_time = func.bind();
}

JpegPlayerController.prototype.getShot = function () {
	let self = this;

	return self.clView.getCurrentImage();
}

JpegPlayerController.prototype.run = function run ( timeout , position ) {
	let self = this;

	if(self.clView.isRunning){
		return;
	}

	self.clView.renderPeriod = timeout || 1000;

	self.clView.start();
	self.clModel.lasttime = position || undefined;
	self.clModel.getData(self.updateDataCB.bind(self));
}

JpegPlayerController.prototype.stop = function stop() {
	let self = this;

	self.clView.stop();
	self.clModel.stop();
	console.log('stop');
}

///showCameraList - connect function beetwen chartModel and chartView
JpegPlayerController.prototype.updateDataCB = function updateCameraList(JpegPlayerdata) {
	this.clView.render(JpegPlayerdata);
};

window.CloudPlayerJpegLive = function(element, api, camera) {
	var mVideoEl = element;
	var self = this;
	var mController = null;
	var _TAG = "[JpegLive]";
	var mApi = api;
	var mCamera = camera;
	var mPreviewPeriod = 1000;//msec
	var mRedrawPeriod  = 1000;//msec
	var mPreviewTo = null;
	var mCurrtime = 0;
	var mPicTime = 0;
	var mUpdateTime = 0;
	var mForcedUpdatePeriod = -1;

	self.getcurrtime = function() {
		return mCurrtime;
	}

	self.updateList = function ( lasttime ) {
		mCurrtime += mPreviewPeriod;
		if ( mCamera !== undefined && mApi !== undefined){
			mApi.cameraPreview( mCamera.getID()).done( function( answer ){
				//console.warn(_TAG, answer);
				if (answer.url) {
					var obj = {};
					obj.url = answer.url;
					obj.width = answer.width;
					obj.height = answer.height;
					obj.time = answer.time;
					obj.utctime = CloudHelpers.parseUTCTime(obj.time);

					var isAmz = obj.url.indexOf('X-Amz-Algorithm');
//remove: cause bosch backend decline links with timestamp insertion
					if (isAmz < 0) {
						if (String(obj.url).indexOf('?') > 0) {
							obj.url = obj.url+'&'+obj.utctime;
						} else {
							obj.url = obj.url+'?'+obj.utctime;
						}
					}

					mVideoEl.pushImageInfo(obj);
				}
				var time = obj.utctime;
				var curtime = new Date().getTime();

				if (((mPicTime >= 0) && (mPicTime != time))
				|| ( (mForcedUpdatePeriod > 0) && ((curtime - mUpdateTime) > mForcedUpdatePeriod) ) //clo-888 workaround
				) {
					mUpdateTime = curtime;
					mApi.cameraUpdatePreview(mCamera.getID()
					).done(function(answer_upd){
						//console.log(_TAG, answer_upd);
						mPicTime = time;
					}).fail( function(err_upd){
						console.error(_TAG, err_upd);
						mPicTime = 0;
					});
					mPicTime = -1;
				}
			}).fail(function(err){
				console.error(_TAG, err);
			});
		}
	}
	self.play = function( api, camera, redrawPeriod ) {
		mPicTime = 0;
		mCurrtime = 0;

		if (redrawPeriod !== undefined) {
			mRedrawPeriod = redrawPeriod;
		}
		if ( api !== undefined) {
			mApi = api;
		}
		if (camera !== undefined) {
			mCamera = camera;
		}
		if (mController === undefined || mController == null){
			mController = new JpegPlayerController(mVideoEl);
			mVideoEl.setLowDataCB( self.updateList );
		}
		mVideoEl.run (mRedrawPeriod);
	}

	self.pause = function() {
		mPicTime = '';
		mVideoEl.stop();
	}

	self.stop = function() {
		mPicTime = 0;
		mCurrtime = 0;
		clearTimeout(mPreviewTo);
		mPreviewTo = null;

		if (mController) {
			mVideoEl.stop();
		}

		if (mVideoEl.children.length > 0) {
			mVideoEl.removeChild(mVideoEl.children[0]);
		}
		mController = null;
	}

	self.reset = function() {
		console.warn(_TAG, "reset");
		self.stop();
	}

	self.setForcedUpdatePeriod = function( period ) {
		mForcedUpdatePeriod = period || -1;
	}

	mVideoEl.addEventListener("abort", function() {
		console.warn(_TAG, "abort");
	}, true);
	mVideoEl.addEventListener("canplay", function() {
		console.warn( _TAG, "canplay");
	}, true);
	mVideoEl.addEventListener("canplaythrough", function() {
		console.warn(_TAG, "canplaythrough");
	}, true);
	mVideoEl.addEventListener("durationchange", function() {
		console.warn(_TAG, "durationchange");
	}, true);
	mVideoEl.addEventListener("emptied", function() {
		console.warn(_TAG, "emptied");
	}, true);
	mVideoEl.addEventListener("encrypted", function() {
		console.warn(_TAG, "encrypted");
	}, true);
	mVideoEl.addEventListener("ended", function() {
		console.warn(_TAG, "ended");
	}, true);
	mVideoEl.addEventListener("error", function(err, err1) {
		console.error(_TAG, "error ", err);
		console.error(_TAG, "error ", err1);
	}, true);
	mVideoEl.addEventListener("interruptbegin", function() {
		console.warn(_TAG, "interruptbegin");
	}, true);
	mVideoEl.addEventListener("interruptend", function() {
		console.warn(_TAG, "interruptend");
	}, true);
	mVideoEl.addEventListener("loadeddata", function() {
		console.warn(_TAG, "loadeddata");
		mVideoEl.play();
	}, true);
	mVideoEl.addEventListener("loadedmetadata", function() {
		console.warn(_TAG, "loadedmetadata");
	}, true);
	mVideoEl.addEventListener("loadstart", function() {
		console.warn(_TAG, "loadstart");
	}, true);
	mVideoEl.addEventListener("mozaudioavailable", function() {
		console.warn(_TAG, "mozaudioavailable");
	}, true);
	mVideoEl.addEventListener("pause", function() {
		console.warn(_TAG, "pause");
	}, true);
	mVideoEl.addEventListener("play", function() {
		console.warn(_TAG, "play");
	}, true);
	mVideoEl.addEventListener("playing", function() {
		console.warn(_TAG, "playing");
	}, true);
	mVideoEl.addEventListener("progress", function() {
		console.warn(_TAG, "progress");
	}, true);
	mVideoEl.addEventListener("ratechange", function() {
		console.warn(_TAG, "ratechange");
	}, true);
	mVideoEl.addEventListener("seeked", function() {
		console.warn(_TAG, "seeked");
	}, true);
	mVideoEl.addEventListener("seeking", function() {
		console.warn(_TAG, "seeking");
	}, true);
	mVideoEl.addEventListener("stalled", function() {
		console.warn(_TAG, "stalled");
	}, true);
	mVideoEl.addEventListener("suspend", function() {
		console.warn(_TAG, "suspend");
	}, true);
	mVideoEl.addEventListener("timeupdate", function() {
		console.warn(_TAG, "timeupdate");
	}, true);
	mVideoEl.addEventListener("volumechange", function() {
		console.warn(_TAG, "volumechange");
	}, true);
	mVideoEl.addEventListener("waiting", function() {
		console.warn(_TAG, "waiting");
	}, true);

};

window.CloudPlayerJpegTimelapse = function (element, api ) {
	var mVideoEl = element;
	var self = this;
	var mController = undefined;
	var _TAG = "[JpegTimelapse]";
	var mApi = api;
	var mRedrawPeriod  = 1000;//msec
	var mCurrtime = -1;
	var direction = "-time";
	var timeUpdateCallback = null;

	function updateTime (time) {
		mCurrtime = time;
		if (timeUpdateCallback) {
			timeUpdateCallback(time);
		}
	}

	function updateImages ( time ) {
		var utctime = "";
		if (time === undefined) {
			var now = new Date();
			var time = now.getTime();
			utctime = CloudHelpers.formatUTCTime(time);
		} else {
			utctime = CloudHelpers.formatUTCTime(time);
		}

		var obj = {};
		obj.order_by = direction;
		obj.limit = 75;
		if (direction === "-time"){
			obj.end = utctime;
		} else {
			obj.start = utctime;
		}
		obj.origin = "recording_thumbnail";

		if ( mApi) {
			mApi.cameraImages(obj).done(function( data) {
				console.log('done');
				if (mVideoEl) {
					if (data.objects.length > 0) {
						for( var i=0; i < data.objects.length; i++) {
							var imageInfo = data.objects[i];
							imageInfo.utctime = CloudHelpers.parseUTCTime(imageInfo.time);
							mVideoEl.pushImageInfo( imageInfo );
						}
					} else {
						mVideoEl.pushImageInfo( null );
					}
				}
			}).fail(function(err){
				console.log('err');
			});
		}
	}

	function restoreDefaults() {
		mCurrtime = -1;
		dirrection = "-time";
	}

	self.getcurrtime = function() {
		return mCurrtime;
	}

	self.play = function( redrawPeriod = 1000, start_position) {
		mRedrawPeriod = redrawPeriod;

		restoreDefaults();

		if ( api !== undefined) {
			mApi = api;
		}
		if (mController === undefined || mController == null){
			mController = new JpegPlayerController(mVideoEl);
			mVideoEl.setLowDataCB( updateImages );
			mVideoEl.setTimeCB( updateTime );
		}

		self.rewind(start_position);
	}

	self.setApi = function ( cloudapi ) {
		mApi = cloudapi;
	}

	self.pause = function() {
		mVideoEl.stop();
	}

	self.rewind = function(start_position) {
		if (!mApi || mApi === undefined) {
		    return;
		}

		direction = "-time";
		var position = undefined;
		if (start_position !== undefined){
			position = start_position;
		} else if (mCurrtime > 0) {
			position = mCurrtime;
		}
		mVideoEl.stop();
		mVideoEl.run (mRedrawPeriod, position);
	}

	self.fastforward = function(start_position) {
		if (!mApi || mApi === undefined) {
		    return;
		}

		direction = "time";

		var position = undefined;
		if (start_position !== undefined){
			position = start_position;
		} else	if (mCurrtime > 0) {
			position = mCurrtime;
		}
		mVideoEl.stop();
		mVideoEl.run (mRedrawPeriod, position);
	}

	self.stop = function() {
		restoreDefaults();

		if (mController) {
			mVideoEl.stop();
		}
		if (mVideoEl.children.length > 0) {
			mVideoEl.removeChild(mVideoEl.children[0]);
		}
		mController = null;
	}

	self.reset = function() {
		console.warn(_TAG, "reset");
		self.stop();
	}

	self.setTimeUpdateCallback = function ( func ) {
		timeUpdateCallback = func;
	}
};



window.CloudCameraTimelineMode = {};

CloudCameraTimelineMode.MINUTES_MODE = {
	name: 'MINUTES_MODE',
	code: 0,
};

CloudCameraTimelineMode.HOUR_MODE = {
	name: 'HOUR_MODE',
	code: 1,
};

CloudCameraTimelineMode.HOURS_12_MODE = {
	name: 'HOURS_12_MODE',
	code: 2,
};

window.CloudCameraTimelineView = function(viewid, options, parent){
	var self = this;
	options = self.options = options || {};
	var mSource = null;
	var mTimezoneOffset = 0;
	var mConn = null;

	// cache by every 3 hours
	var mCacheDurationGrid = 10800000;
	var mCacheRecords = {};
	var mCursorPosition = 0;
	var mTimelineDrawing = false;
	var mContainerWidth = 0;
	var mDistPx = 0;
	var mDistSec = 0;
	var mViewID = viewid;
	var mIntervalPolingData = null;
	var mPolingDataMax = 0;
	var mPlayer = null;
	var mRangeMin = -1;
	var mRangeMax = -1;
	var mNavArrowsHided = false;
	var mStartMove = false;
	var mFirstMoveX = 0;
	var mLastMoveX = 0;
	var mAnimationToProgress = false;
	var mLeftDataPadding = 0;
	var mRightDataPadding = 0;
	var mOptionCalendar = false;
	var mUseTimezone = null;
	var mRangePolingDataEveryInSec = null;
	var mPolingRangeDataInterval = null;
	var mCallbacks = CloudHelpers.createCallbacks();
	var el_timeline_container	= null;
	var el_calendar_container 	= null;
	var el_live_container		= null;
	var timeline_range_or_not	= null;

	if (options.useTimezone) {
		mUseTimezone = options.useTimezone;
		console.warn("[CloudTimeline] useTimezone: " + mUseTimezone);
	}

	if(options["calendar"] !== undefined){
		mOptionCalendar = options["calendar"] == true;
	}

	if(options["polingRangeDataEveryInSec"] !== undefined) {
		mRangePolingDataEveryInSec = parseInt(options["polingRangeDataEveryInSec"]);
	}

	function clone(obj) {
		if (null == obj || "object" != typeof obj) return obj;
		var copy = obj.constructor();
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
		}
		return copy;
	}

	var mModes = {};
	mModes["HOURS_12_MODE"] = {
		len_ms: 9*60*60*1000, // 9 hours
		step_short: 30*60*1000, // 30 minutes
		step_long: 150*60*1000 // 2 hours and 30 minutes
	};
	mModes["HOUR_MODE"] = {
		len_ms: 90*60*1000, // 1 hour and 30 minutes
		step_short: 5*60*1000, // 5 minutes
		step_long: 30*60*1000 // 30 minutes
	};
	mModes["MINUTES_MODE"] = {
		len_ms: 15*60*1000,  // 15 minutes
		step_short: 1*60*1000,  // 1 minute
		step_long: 5*60*1000  // 5 minutes
	};
	var mRangeLenModeMs = 3*60*60*1000 + 60*1000; // 3 hours

	var mDefaultMode = clone(mModes["MINUTES_MODE"]);

	var timeline_target = document.createElement("div");
	// default
	timeline_target.classList.add("cloudcameratimeline");
	timeline_target.classList.add("green");
	timeline_target.classList.add("black");

	if (parent && parent.player) {
	    el_timeline_container	= parent.player.getElementsByClassName('cloudplayer-timeline-container')[0];
	    el_calendar_container 	= parent.player.getElementsByClassName('cloudplayer-calendar-container')[0];
	    el_live_container	= parent.player.getElementsByClassName('cloudplayer-live-container')[0];
	} else {
	    el_timeline_container	= document.getElementsByClassName('cloudplayer-timeline-container')[0];
	    el_calendar_container 	= document.getElementsByClassName('cloudplayer-calendar-container')[0];
	    el_live_container	= document.getElementsByClassName('cloudplayer-live-container')[0];
	}

/*	timeline_target.innerHTML = ''
		+ '<div class="cloudcameratimeline-calendar" style="display: none"></div>'
		+ '<div class="cloudcameratimeline-shift shift-minus">-1h</div>'
		+ '<div class="cloudcameratimeline-left"></div>'
		+ '<div class="cloudcameratimeline-content">'
		+ '		<div class="cloudcameratimeline-scale"></div>'
		+ '		<div class="cloudcameratimeline-data"></div>'
		+ '		<div class="cloudcameratimeline-cursor"></div>'
		+ '</div>'
		+ '</div>'
		+ '<div class="cloudcameratimeline-right"></div>'
		+ '<div class="cloudcameratimeline-shift shift-plus">+1h</div>'
		+ '<div class="cloudcameratimeline-goto-live disabled">Live</div>'
		+ '';
*/

	self.left_border = Math.floor(CloudHelpers.getCurrentTimeUTC() - mDefaultMode.len_ms/2);
	self.right_border = Math.floor(self.left_border + mDefaultMode.len_ms);

	var mElementContent = timeline_target.getElementsByClassName('cloudcameratimeline-content')[0];
	var mElementData = timeline_target.getElementsByClassName('cloudcameratimeline-data')[0];
	var mElementCalendar = timeline_target.getElementsByClassName('cloudcameratimeline-calendar')[0];
	var mElementCursor = timeline_target.getElementsByClassName('cloudcameratimeline-cursor')[0];
	var mElementScale = timeline_target.getElementsByClassName('cloudcameratimeline-scale')[0];
	var mElementGotoLive = timeline_target.getElementsByClassName('cloudcameratimeline-goto-live')[0];
	var mLeftArrow = timeline_target.getElementsByClassName('cloudcameratimeline-left')[0];
	var mRightArrow = timeline_target.getElementsByClassName('cloudcameratimeline-right')[0];
	var mShiftMinus = timeline_target.getElementsByClassName('shift-minus')[0];
	var mShiftPlus = timeline_target.getElementsByClassName('shift-plus')[0];

	el_calendar_container.appendChild(mElementCalendar);
	el_live_container.appendChild(mElementGotoLive);

	self.elem = document.getElementById(viewid);
	if ((self.elem != null) && (self.elem.tagName === 'DIV')){
	    self.elem.appendChild(timeline_target);
	    timeline_range_or_not = self.elem;
	} else {
	    el_timeline_container.appendChild(timeline_target);
	    timeline_range_or_not = el_timeline_container;
	}


	
	self.elem = document.getElementById(viewid);

	if (self.elem == null){
		console.error("[CloudCameraTimeline] Not found element");
		return null;
	}

	if(self.elem.tagName != 'DIV'){
		console.error("[CloudCameraTimeline] Expected DIV tag but got " + self.elem.tagName);
		return null;
	}

	// default
	self.elem.classList.add("cloudcameratimeline");
	self.elem.classList.add("green");
	self.elem.classList.add("black");

	var el_timeline_container = document.getElementsByClassName('cloudplayer-timeline-container')[0];
	var el_calendar_container = document.getElementsByClassName('cloudplayer-calendar-container')[0];
	var el_live_container = document.getElementsByClassName('cloudplayer-live-container')[0];
	el_timeline_container.appendChild(self.elem);

	self.elem.innerHTML = ''
		+ '<div class="cloudcameratimeline-calendar" style="display: none"></div>'
		+ '<div class="cloudcameratimeline-shift shift-minus">-1h</div>'
		+ '<div class="cloudcameratimeline-left"></div>'
		+ '<div class="cloudcameratimeline-content">'
		+ '		<div class="cloudcameratimeline-scale"></div>'
		+ '		<div class="cloudcameratimeline-data"></div>'
		+ '		<div class="cloudcameratimeline-cursor"></div>'
		+ '</div>'
		+ '</div>'
		+ '<div class="cloudcameratimeline-right"></div>'
		+ '<div class="cloudcameratimeline-shift shift-plus">+1h</div>'
		+ '<div class="cloudcameratimeline-goto-live disabled">Live</div>'
		+ '';

	self.left_border = Math.floor(CloudHelpers.getCurrentTimeUTC() - mDefaultMode.len_ms/2);
	self.right_border = Math.floor(self.left_border + mDefaultMode.len_ms);
	var mElementContent = self.elem.getElementsByClassName('cloudcameratimeline-content')[0];
	var mElementData = self.elem.getElementsByClassName('cloudcameratimeline-data')[0];
	var mElementCalendar = self.elem.getElementsByClassName('cloudcameratimeline-calendar')[0];
	var mElementCursor = self.elem.getElementsByClassName('cloudcameratimeline-cursor')[0];
	var mElementScale = self.elem.getElementsByClassName('cloudcameratimeline-scale')[0];
	var mElementGotoLive = self.elem.getElementsByClassName('cloudcameratimeline-goto-live')[0];
	var mLeftArrow = self.elem.getElementsByClassName('cloudcameratimeline-left')[0];
	var mRightArrow = self.elem.getElementsByClassName('cloudcameratimeline-right')[0];
	var mShiftMinus = self.elem.getElementsByClassName('shift-minus')[0];
	var mShiftPlus = self.elem.getElementsByClassName('shift-plus')[0];
	el_calendar_container.appendChild(mElementCalendar);
	el_live_container.appendChild(mElementGotoLive);
	

	var mCalendar = null;

	function _initCalendar() {
		if (mPlayer == null) {
			console.error("[TIMELINE] player is null") ;
			return;
		}

		if (mOptionCalendar) {
			mCalendar = new CloudCameraCalendarView(mPlayer.getCalendarContent(), options);
			mCalendar.onChangeDate = function(t, e) {
				if (mPlayer == null) {
					console.error("[TIMELINE] player is null") ;
					return;
				}
				mPlayer.setPosition(t - mTimezoneOffset);
				self.moveToPosition(t - mTimezoneOffset);
				mPlayer.play(e);
			};
			self.calendar = mCalendar;
		}
	}

	mElementCalendar.onclick = function() {
		if (mCalendar != null) {
			console.log(mPlayer);
			mPlayer.player.classList.remove('showing-settings', 'showing-zoom');
			mCalendar.toggleCalendar(mElementCalendar);
		}
	}

	function _minusHour() {
		var t = mPlayer.getPosition();
		// Live video and position is not detected
		if (t == 0)
			t = CloudHelpers.getCurrentTimeUTC();
		if (t != 0)
		{
			mPlayer.stop("by_timeline_2");
			mPlayer.setPosition(t - 3600*1000);
			mPlayer.play();
		}
		else
			console.log("Invalid current position");
	}

	function _plusHour() {
		var isLive = mPlayer.isLive();
		if (isLive == true){
			return;
		}
		var t = mPlayer.getPosition();
		if (t == 0)
			t = CloudHelpers.getCurrentTimeUTC();
		if (t != 0)
		{
			mPlayer.stop("by_timeline_2");
			mPlayer.setPosition(t + 3600*1000);
			mPlayer.play();
		}
		else
			console.log("Invalid current position ");
	}

	mShiftPlus.onclick = _plusHour;
	mRightArrow.onclick = _plusHour;

	mShiftMinus.onclick = _minusHour;
	mLeftArrow.onclick = _minusHour;

	function _gotoLive(e){
		if(mPlayer != null && mPlayer.getSource() != null){
			var sClasses = mElementGotoLive.classList;
			if(sClasses.contains('now') == false && sClasses.contains('disabled') == false){
				mPlayer.setPosition(CloudPlayer.POSITION_LIVE);
				mPlayer.play(e);
				self.moveToPosition(CloudHelpers.getCurrentTimeUTC());
			}
			if(sClasses.contains('now') != false){
				self.moveToPosition(CloudHelpers.getCurrentTimeUTC());
			}
		}
	}
	mElementGotoLive.onclick = _gotoLive;

	function _updateScale(){
		if((mContainerWidth != mElementScale.offsetWidth) && (mElementScale.offsetWidth != 0)){
			mContainerWidth = mElementScale.offsetWidth
		}
		mDistPx = mContainerWidth / (self.right_border - self.left_border); // TODO on init mode or resize
		mDistSec = (self.right_border - self.left_border) / mContainerWidth; // TODO on init mode or resize
	}
	_updateScale();

	function _normalizeT(t){
		var tmp = t;
		tmp = tmp - tmp%1000;
		tmp = tmp - tmp % mCacheDurationGrid;
		return tmp;
	}

	function _stopPolingCursor(){
		clearInterval(self._polingCursor);
		mElementGotoLive.classList.remove("now");
		mElementGotoLive.classList.add("disabled");
	}

	function _polingUpdateData(){
		if(mSource != null && mSource.type == 'camera'){
			var camid = mSource.getID();
			var startDT = CloudHelpers.formatUTCTime(mPolingDataMax);
			if (mConn._getAPI() == null) {
				return;
			}
			mConn._getAPI().storageRecordsFirst(camid, startDT, 50).done(function(r){
				var bNeedExecuteCallback = false;
				//for (var i in r.objects) {
				for(var i = 0; i < r.objects.length; i++){
					var record = r.objects[i];
					var startUTCTime = CloudHelpers.parseUTCTime(record.start);
					var endUTCTime = CloudHelpers.parseUTCTime(record.end);

					var nsta = _normalizeT(startUTCTime);
					var nend = _normalizeT(endUTCTime);
					if (!mCacheRecords[nsta]) {
						mCacheRecords[nsta] = { status: 1, data: [] };
					}
					var nUpdated = 0;
					var maxVal = 0;
					var minVal = 0;
					//for(var pr in mCacheRecords[nsta].data){
					for(var pr = 0; pr < mCacheRecords[nsta].data.length; pr++){
						var period = mCacheRecords[nsta].data[pr];
						if (period.end > maxVal) {
							maxVal = period.end;
						}
						if (period.start < startUTCTime && startUTCTime - 2000 < period.end) {
							if (endUTCTime > period.end) {
								mCacheRecords[nsta].data[pr].end = endUTCTime;
								nUpdated = 1;
								// console.log("Updated end period2 ", mCacheRecords[nsta].data[pr]);
								self._eventRedrawTimeline();
								bNeedExecuteCallback = true;
							} else {
								nUpdated = 2;
								// console.log("Skip");
							}
						}
					}
					if (nUpdated == 0) {
						if (maxVal < endUTCTime) {
							var period = {start: startUTCTime, end: endUTCTime};
							mCacheRecords[nsta].data.push(period);
							// console.warn("Added period: ", period);
							self._eventRedrawTimeline();
							bNeedExecuteCallback = true;
						}
					}

					if(endUTCTime > mPolingDataMax){
						mPolingDataMax = endUTCTime + CloudHelpers.ONE_SECOND;
					}
				}
				if (bNeedExecuteCallback) {
					mCallbacks.executeCallbacks(CloudPlayerEvent.TIMELINE_END_UPDATED, {});
					if (mPlayer != null) {
						setTimeout(mPlayer.onTimelineEndUpdate, 1);
					}
				}
			});
		}
	}

	function _stopPolingData(){
		clearInterval(mIntervalPolingData);
		mIntervalPolingData = null;
	}

	function _startPolingData(){
		clearInterval(mIntervalPolingData);
		mPolingDataMax = CloudHelpers.getCurrentTimeUTC() - CloudHelpers.ONE_MINUTE;
		mIntervalPolingData = setInterval(_polingUpdateData, 30000); // every 30 sec
	}

	function _calcPosition(t){
		return Math.floor((t - self.left_border) * mDistPx);
	}

	self.removeCallback = function(uniqname){
		mCallbacks.removeCallback(uniqname);
	}

	self.addCallback = function(uniqname, func){
		mCallbacks.addCallback(uniqname, func);
	}

	function _updateCursorPosition(opt){
		opt = opt || {};
		// console.log("self.left_border: " + self.left_border);
		// console.log("mCursorPosition: " + mCursorPosition);
		if(mPlayer != null && mPlayer.getSource() != null){
			if(mPlayer.isLive()){
				mElementGotoLive.classList.remove("disabled");
				mElementGotoLive.classList.add("now");
			}else{
				mElementGotoLive.classList.remove("disabled");
				mElementGotoLive.classList.remove("now");
			}
		}else{
			mElementGotoLive.classList.remove("now");
			mElementGotoLive.classList.add("disabled");
		}

		if(mCursorPosition < (self.left_border - 1000) || mCursorPosition > (self.right_border + 1000)){
			if(mElementCursor.style.display != 'none'){
				mElementCursor.style.display = 'none'
			}
			return;
		}
		if(mElementCursor.style.display != 'inline-block'){
			mElementCursor.style.display = 'inline-block';
		}
		if(mCursorPosition != 0){
			var le = _calcPosition(mCursorPosition);
			var leftPositionAdjustment = -10;
			if(le > -5 && le < mContainerWidth){

				mElementCursor.style.left = (le + mLeftDataPadding + leftPositionAdjustment) + 'px';

				// automove if near to ritght border
				var diff = mContainerWidth - le;
				var ritgh_diff_procents = (diff*100/mContainerWidth);
				if(ritgh_diff_procents < 3){
					if(opt.sender == "poling" || opt.sender == "click"){
						if(!self.isRange() && !mStartMove && !mAnimationToProgress){
							console.log("[TIMELINE] Auto move if not user drag");
							setTimeout(function(){
								console.log("[TIMELINE] mCursorPosition: " + mCursorPosition);
								self.moveToPosition(mCursorPosition);
							},100);
						}
					}
				}
			}else{
				if(mElementCursor.style.display != 'none'){
					mElementCursor.style.display = 'none'
				}
			}
		}else{
			if(mElementCursor.style.display != 'none'){
				mElementCursor.style.display = 'none'
			}
		}
	}

	function _startPolingCursor(){
		_stopPolingCursor();
		self._polingCursor = setInterval(function(){
			if(mPlayer != null){
				var currPos = mPlayer.getPosition();
				if (currPos != 0) {
					mCursorPosition = mPlayer.getPosition();
				}
				// console.log("mCursorPosition1: " + mCursorPosition);
			}else{
				// console.log("mCursorPosition2: " + mCursorPosition);
				mCursorPosition = 0;
			}
			_updateCursorPosition({sender: "poling"});
		},1000);
	}

	function _isLoadedData(left,right){
		var start = _normalizeT(left);
		var end = _normalizeT(right) + mCacheDurationGrid;
		if(end < start){
			console.error("[ERROR] start must be more than end");
			return false;
		}
		var bLoaded = true;
		for(var i = start; i <= end; i = i + mCacheDurationGrid){
			if(!mCacheRecords[i]){
				bLoaded = false;
			}else if (mCacheRecords[i].status != 1){
				bLoaded = false;
			}
		}
		return bLoaded;
	}

	function _updatedRecords(){
		var calltime = new Date().getTime();
		// console.log("_updatedRecords() start ");
		// self.el_data.innerHTML = '';
		var start = _normalizeT(self.left_border);
		var end = _normalizeT(self.right_border) + mCacheDurationGrid;
		if(end < start){
			console.error("[ERROR] start must be more than end");
			return false;
		}
		if(self.isRange()){
			if(start < mRangeMin_Normalize){
				console.error("[ERROR] Going beyond the range (start)");
				return false;
			}

			if(end > mRangeMax_Normalize){
				console.error("[ERROR] Going beyond the range (end)");
				return false;
			}
		}

		// document.getElementsByClassName("cloudcameratimeline-data")[0].getElementsByClassName("crect")
		// var crectList = document.getElementsByClassName("cloudcameratimeline-data")[0].getElementsByTagName("crect");
		var crectList = mElementData.getElementsByTagName("crect");
		var crect_i = 0;
		// console.log("Before: " + crectList.length);
		for(var i = start; i <= end; i = i + mCacheDurationGrid){
			var c = mCacheRecords[i];
			if(c && c.status == 1){
				for(var di = 0; di < c.data.length; di++){
					if(c.data[di].end < self.left_border)
						continue;
					if(c.data[di].start > self.right_border)
						continue;
					var start_rec_px_ = _calcPosition(c.data[di].start);
					var end_rec_px_ = _calcPosition(c.data[di].end);
					var sLeft = start_rec_px_ + "px";
					var sWidth = (end_rec_px_ - start_rec_px_) + "px";
					if(crect_i < crectList.length){
						crectList[crect_i].style.display = "";
						crectList[crect_i].style.left = sLeft;
						crectList[crect_i].style.width = sWidth;
						crect_i++;
					}else{
						var el = '<crect style="left: ' + sLeft + '; width: ' + sWidth + '"></crect>';
						mElementData.innerHTML += el;
						crect_i++;
					}
				}
			}
		}
		// console.log("After: " + crectList.length);
		for(var i = crect_i; i < crectList.length; i++){
			if(crectList[i].style.display != "none"){
				crectList[i].style.display = "none";
			}
		}
		// console.log("_updatedRecords() end " + (new Date().getTime() - calltime) + " ms, count elements: " + mElementData.childElementCount);
	}

	function _loadRecordsPortion(i){
		// console.log("_loadRecordsPortion(" + i + ")");
		var p = CloudHelpers.promise();
		var ca = mCacheRecords[i];
		if(ca && ca.status == 1) {
			p.resolve();
			return p;
		}

		if(mSource != null){
			mCacheRecords[i] = {};
			mCacheRecords[i].status = 0;
			mCacheRecords[i].data = [];

			mSource.getTimeline(i, i + mCacheDurationGrid).done(function(timeline){
				// console.warn(timeline);
				if(mCacheRecords[i]){
					mCacheRecords[i].status = 1;
					mCacheRecords[i].data = timeline.periods;
				}
				_updatedRecords();
			}).fail(function(){
				if(mCacheRecords[i]){
					mCacheRecords[i].status = -1;
				}
				p.reject();
			})
		}else{
			p.reject();
		}
		return p;
	}

	function _loadData(left,right){
		// console.log("_loadData(" + left + "," + right + ")");
		var start = _normalizeT(left);
		var end = _normalizeT(right) + mCacheDurationGrid;
		if(end < start){
			console.error("[ERROR] start must be more than end");
			return false;
		}

		if(self.isRange()){
			if(left < mRangeMin_Normalize){
				console.error("[ERROR] Going beyond the range (left)");
				return false;
			}

			if(end > mRangeMax_Normalize){
				console.error("[ERROR] Going beyond the range (right)");
				return false;
			}
		}

		if (mSource != null) {
			// console.warn("TODO load data");
			for(var i = start; i <= end; i = i + mCacheDurationGrid){
				var c = mCacheRecords[i];
				if(!c || (c && c.status == -1)){
					_loadRecordsPortion(i);
				}
			}
		}
	}

	function _isDifferentTimelinePeriods(data1, data2) {
		if (data1.length == 0 && data2.length == 0) {
			return false;
		}
		// check the data
		for (var i1 = 0; i1 < data1.length; i1++) {
			var p1 = data1[i1];
			var bFound = false;
			for (var i2 = 0; i2 < data2.length; i2++) {
				var p2 = data2[i2];
				if (p1.start == p2.start && p1.end == p2.end) {
					bFound = true;
				}
			}
			if (!bFound) {
				return true;
			}
		}
		// check the data
		for (var i2 = 0; i2 < data2.length; i2++) {
			var p2 = data2[i2];
			var bFound = false;
			for (var i1 = 0; i1 < data1.length; i1++) {
				var p1 = data1[i1];
				if (p1.start == p2.start && p1.end == p2.end) {
					bFound = true;
				}
			}
			if (!bFound) {
				return true;
			}
		}
		return false;
	}

	function _reloadData(i) {
		mSource.getTimeline(i, i + mCacheDurationGrid).done(function(timeline){
			if (_isDifferentTimelinePeriods(mCacheRecords[i].data, timeline.periods)) {
				mCacheRecords[i].data = timeline.periods;
				_updatedRecords();
			}
		})
	}

	function _reloadRangeData() {
		console.log("_reloadRangeData");
		var start = _normalizeT(mRangeMin);
		var end = _normalizeT(mRangeMax) + mCacheDurationGrid;
		if (mSource != null) {
			for(var i = start; i <= end; i = i + mCacheDurationGrid){
				var c = mCacheRecords[i];
				if (c && c.status == 1) {
					_reloadData(i);
				}
			}
		}
	}

	function _stopPolingRangeData() {
		console.log("_stopPolingRangeData");
		clearInterval(mPolingRangeDataInterval);
	}

	function _startPolingRangeData() {
		_stopPolingRangeData();
		// console.log("_startPolingRangeData ", mRangePolingDataEveryInSec);
		if (mRangePolingDataEveryInSec != null && self.isRange()) {
			// console.log("_startPolingRangeData start");
			mPolingRangeDataInterval = setInterval(function () {
				if (mSource != null) {
					_reloadRangeData();
				}
			}, mRangePolingDataEveryInSec*1000);
		}
	}

	self.reloadRangeData = function() {
		_reloadRangeData();
	}

	function _disposeTimeline(){
		console.warn("_disposeTimeline");
		mPolingDataMax = 0;
		mCacheRecords = {};
		mElementData.innerHTML = "";
		_stopPolingCursor();
		_stopPolingData();
		_stopPolingRangeData();
		if (mCalendar != null) {
			mCalendar.dispose();
		}
	}

	function _changedSource(){
		console.warn("_changedSource");
		_disposeTimeline();
		if(mPlayer != null){
			mSource = mPlayer.getSource();
			if(mSource){
				if (mUseTimezone) {
					mTimezoneOffset = CloudHelpers.getOffsetTimezone(mUseTimezone);
				} else {
					mTimezoneOffset = CloudHelpers.getOffsetTimezone(mSource.getTimezone());
				}
				mConn = mSource._getConn();
				if (mCalendar != null) {
					mCalendar.setSource(mSource);
				}
				_startPolingCursor();
				_startPolingData();
				_startPolingRangeData();
			}else{
				mConn = null;
				mSource = null;
				mTimezoneOffset = 0;
			}
		}else{
			mSource = null;
		}
		self.redrawTimeline({sender: "changed_source"});
	}

	function _playerEvent(evnt, args){
		console.warn("_playerEvent ", evnt);
		if(evnt.name == "SOURCE_CHANGED"){
			_changedSource();
			// mCalendar./
		}else if(evnt.name == "POSITION_JUMPED"){
			console.warn("POSITION_JUMPED", mPlayer)
			mCursorPosition = args.new_pos;
			_updateCursorPosition({sender: "pos jumped"});
			self.moveToPosition(args.new_pos);

		} else if (evnt.name == 'STOPED' ){
			//console.log("Timeline catch event: Player stoped " + args );
			_stopPolingData();
		} else if (evnt.name == 'PLAYED') {
			console.log("Timeline catch event: Player played " + args);
			if (!mIntervalPolingData){
				_startPolingData();
			}
		}
	}

	function _recalculateDataPaddings(){
		mLeftDataPadding = 0;
		if(mLeftArrow.style.display != "none"){
			mLeftDataPadding += 80;
		}
		// if(mElementCalendar.style.display != "none"){
		// 	mLeftDataPadding += 40;
		// }
		mRightDataPadding = 0;
		if(mRightArrow.style.display != "none"){
			mRightDataPadding += 80;
		}
		// if(mElementGotoLive.style.display != "none"){
		// 	mRightDataPadding += 40;
		// }
		if(mLeftDataPadding == 0){
			mLeftDataPadding = 80
		}
		if(mRightDataPadding == 0){
			mRightDataPadding = 80;
		}

		mElementContent.style.width = "calc(100% - " + (mLeftDataPadding + mRightDataPadding) + "px)";
		mElementContent.style.left = mLeftDataPadding + "px";
		mElementData.style.width = "calc(100% - " + (mLeftDataPadding + mRightDataPadding) + "px)";
		mElementData.style.left = mLeftDataPadding + "px";
		mElementScale.style.width = "calc(100% - " + (mLeftDataPadding + mRightDataPadding) + "px)";
		mElementScale.style.left = mLeftDataPadding + "px";
	}

	self.hideCalendarButton = function(){
		if(mElementCalendar.style.display != "none"){
			mElementCalendar.style.display = "none";
		}
		_recalculateDataPaddings();
		self.redrawTimeline();
	}

	self.showCalendarButton = function(){
		if(mElementCalendar.style.display == "none"){
			mElementCalendar.style.display = "";
		}
		_recalculateDataPaddings();
		self.redrawTimeline();
	}

	self.hideArrowsButtons = function(){
		if(mLeftArrow.style.display != "none"){
			mLeftArrow.style.display = "none";
		}

		if(mRightArrow.style.display != "none"){
			mRightArrow.style.display = "none";
		}
		_recalculateDataPaddings();

		self.redrawTimeline();
	};

	self.showArrowsButtons = function(){
		if(mLeftArrow.style.display == "none"){
			mLeftArrow.style.display = "";
		}
		if(mRightArrow.style.display == "none"){
			mRightArrow.style.display = "";
		}
		_recalculateDataPaddings();
		self.redrawTimeline();
	}

	self.hideShiftButtons = function(){
		if(mShiftMinus.style.display != "none"){
			mShiftMinus.style.display = "none";
		}

		if(mShiftPlus.style.display != "none"){
			mShiftPlus.style.display = "none";
		}
		_recalculateDataPaddings();

		self.redrawTimeline();
	};

	self.showShiftButtons = function(){
		if(mShiftMinus.style.display == "none"){
			mShiftMinus.style.display = "";
		}
		if(mShiftPlus.style.display == "none"){
			mShiftPlus.style.display = "";
		}
		_recalculateDataPaddings();
		self.redrawTimeline();
	}

	self.hideGotoLiveButton = function(){
		if(mElementGotoLive.style.display != "none"){
			mElementGotoLive.style.display = "none";
		}
		_recalculateDataPaddings();
		self.redrawTimeline();
	}

	self.showGotoLiveButton = function(){
		if(mElementGotoLive.style.display == "none"){
			mElementGotoLive.style.display = "";
		}
		_recalculateDataPaddings();
		self.redrawTimeline();
	}

	self.setPlayer = function(player){
		_disposeTimeline();


		if (mPlayer) {
			mPlayer.removeCallback(mViewID);
		}
		if (player) {
			mPlayer = player;
			_initCalendar();
			_changedSource();
			mPlayer.addCallback(mViewID, _playerEvent);

			mPlayer.setFullscreenCallback (function(){
				console.warn("fullscreenCallback");
				self.redrawTimeline();
			});
		} else {
			mPlayer = null;
			_changedSource();
		}
	}

	self.setRange = function(startPos,endPos){
		console.warn("[TIMELINE] setRange todo");
		mRangeMin = startPos;
		mRangeMax = endPos;
		mRangeMin_Normalize = _normalizeT(startPos);
		mRangeMax_Normalize = _normalizeT(endPos) + mCacheDurationGrid;

		timeline_range_or_not.classList.add("range");
		//self.elem.classList.add("range");
		_updateScale();
		var range_len = mRangeMax - mRangeMin;
		var start_t = mRangeMin;
		var end_t = mRangeMax;

		if (range_len <= mRangeLenModeMs) {
			self.hideArrowsButtons();
			self.hideShiftButtons();
			mDefaultMode.len_ms = range_len;
			self.left_border = Math.floor(start_t);
			self.right_border = Math.floor(end_t);
		} else {
			end_t = mRangeMin + mRangeLenModeMs;
			mDefaultMode.len_ms = mRangeLenModeMs;

			// correct if current time
			var t = CloudHelpers.getCurrentTimeUTC();
			if(t < mRangeMax && t > mRangeMin){
				if(t > end_t){
					end_t = t + Math.floor(mRangeLenModeMs/2);
					if(end_t > mRangeMax){
						end_t = mRangeMax;
					}
					start_t = end_t - mRangeLenModeMs;
				}
			}
			self.left_border = Math.floor(start_t);
			self.right_border = Math.floor(end_t);
		}

		// self.animationTo(start_t, end_t, newmode);
		self.redrawTimeline({sender: "animation"});
	}

	self.isRange = function(){
		return mRangeMin != -1 && mRangeMax != -1;
	}

	self.resetRange = function(){
		console.warn("[TIMELINE] resetRange");
		mRangeMin = -1;
		mRangeMax = -1;
		timeline_range_or_not.classList.remove("range");
		//self.elem.classList.remove("range");
		self.showArrowsButtons();
		self.showShiftButtons();
		_updateScale();
	}

	self.months = ['Jan','Feb','Mar','Apr','May','Jun', 'Jul', 'Aug', 'Spt', 'Oct', 'Nov', 'Dec'];

	self.dateFormat = function(t, bMonth, bAmPm){
		var str = "";
		if(self.isRange()){
			var t = Math.floor((t - mRangeMin)/1000);
			var nSeconds = t % 60;
			t = (t - nSeconds) / 60;
			var nMinutes = t % 60;
			var nHours = (t - nMinutes) / 60;
			var str = ("00" + nHours).slice(-2) + ":"
				+ ("00" + nMinutes).slice(-2);
		}else{
			var d = new Date();
			d.setTime(t + mTimezoneOffset);
			var hours = d.getUTCHours()
			var suffix = '';
			if (bAmPm) {
				suffix = hours>=12 ? ' pm' : ' am';
				hours = hours==0 ? 12 : (hours>12 ? hours-12 : hours);
			}

			var str = ("00" + hours).slice(-2) + ":"
				+ ("00" + d.getUTCMinutes()).slice(-2);
			str += suffix;
			if(bMonth){
				str += " (" + d.getUTCDate() + " " + self.months[d.getUTCMonth()] + ")";
			}
		}
		return str;
	}

	self._eventRedrawTimeline = function(){
		setTimeout(self.redrawTimeline,10);
	}

	self.redrawTimeline = function(opt){
		// console.log("redrawTimeline");
		opt = opt || {};
		if(mTimelineDrawing) {
			console.warn("redrawTimeline busy");
			return;
		}
		mTimelineDrawing = true;
		_updateScale();

		var left_border_short = Math.floor(self.left_border / mDefaultMode.step_short);
		var right_border_short = Math.floor(self.right_border / mDefaultMode.step_short) + 1;

		// left and right arrows
		if(self.isRange()){
			if(self.left_border <= mRangeMin){
				mLeftArrow.classList.add("disabled");
			}else{
				mLeftArrow.classList.remove("disabled");
			}

			if(self.right_border >= mRangeMax){
				mRightArrow.classList.add("disabled");
			}else{
				mRightArrow.classList.remove("disabled");
			}
		}

		// mElementData.innerHTML = '';
		mElementScale.innerHTML = '<vtext id="texttimelinetest"><vtext>';
		var test_text = document.getElementById('texttimelinetest');
		if (!test_text) {
		    return;
		}
		test_text.innerHTML = self.dateFormat(self.left_border, false, self.options.timelineampm===true);
		var textWidth = test_text.clientWidth;
		test_text.innerHTML = self.dateFormat(self.left_border, true, self.options.timelineampm===true);
		var textWidthWithMonth = test_text.clientWidth;

		// correct step long (if text was biggest)
		var step_long = mDefaultMode.step_long;
		while((textWidth)*mDistSec > step_long){
			step_long += mDefaultMode.step_long;
		};

		var nTextWithMonth = step_long*2;

		mElementScale.innerHTML += '<hline></hline>';
		for(var i = left_border_short; i < right_border_short; i++){
			var t = i*mDefaultMode.step_short;
			var pos = _calcPosition(t);
			if(t % mDefaultMode.step_long == 0){
				var bTextWithMonth = t % nTextWithMonth == 0;
				var tw = (bTextWithMonth ? textWidthWithMonth : textWidth);
				var tpos = pos - tw/2;

				mElementScale.innerHTML += '<vline style="left: ' + pos + 'px"></vline>';

				if(t % step_long == 0){
					mElementScale.innerHTML += '<vtext style="left: ' + tpos + 'px">' + self.dateFormat(t,bTextWithMonth, self.options.timelineampm===true) + '</vtext>';
				}
			}else{
				mElementScale.innerHTML += '<vline style="left: ' + pos + 'px"></vline>';
			}
		}

		// mElementData.innerHTML = '';
		_updateCursorPosition(opt);
		if(mSource != null){
			if(_isLoadedData(self.left_border, self.right_border)){
				_updatedRecords();
			}else{

				if(self.isRange()){
					if(self.left_border < mRangeMin_Normalize || self.right_border > mRangeMax_Normalize){
						// console.log("skip");
						mTimelineDrawing = false;
						return;
					}
				}
				// console.log("don't skip");
				_loadData(self.left_border, self.right_border);
			}
		}
		mTimelineDrawing = false;
	}
	self.redrawTimeline();

	self.onTimeLineResize = function() {
//		console.warn("resize "  + document.webkitIsFullScreen);
		self.redrawTimeline();
	}

	window.addEventListener("resize", self.onTimeLineResize);

	self.animationTo = function(l,r, mode_new){
		// console.log("animationTo");
		mAnimationToProgress = true;
		mode_new = mode_new || mDefaultMode;
		// TODO lock timeline
		var steps = 25; // for ~1 sec
		var len_left = l - self.left_border;
		var len_right = r - self.right_border;
		if(len_left == 0 && len_right == 0){
			console.warn("Already in current position");
			self.redrawTimeline({sender: "animation"});
			mAnimationToProgress = false;
			return;
		}
		var len_step_short = mode_new.step_short - mDefaultMode.step_short;
		var len_step_long = mode_new.step_long - mDefaultMode.step_long;
		var bChangedSteps = (len_step_short != 0 && len_step_long != 0);
		var lb = self.left_border;
		var rb = self.right_border;
		var st = [];
		var p = 3.14/steps;
		var sum = 0;
		for(var i = 0; i < steps; i++){
			var k = Math.sin(i*p);
			sum += k;
			st.push({k: k});
		}
		var step_sl = len_left/sum;
		var step_sr = len_right/sum;
		var short_s = len_step_short/sum;
		var long_s = len_step_long/sum;

		// init first value
		var k0 = st[0].k;
		st[0].left = self.left_border + k0 * step_sl;
		st[0].right = self.right_border + k0 * step_sr;
		if(bChangedSteps){
			st[0].step_short = mDefaultMode.step_short + k0 * short_s;
			st[0].step_long = mDefaultMode.step_long + k0 * long_s;
		}

		for(var i = 1; i < steps; i++){
			var k = st[i].k;
			st[i].left = st[i-1].left + k*step_sl;
			st[i].right = st[i-1].right +  k*step_sr;
			if(bChangedSteps){
				st[i].step_short = st[i-1].step_short + k * short_s;
				st[i].step_long = st[i-1].step_short + k * long_s;
			}
		}
		// correction last value
		st[steps - 1].left = l;
		st[steps - 1].right = r;

		var counter = 0;
		function anumation_timeline_(){
			self.left_border = Math.floor(st[counter].left);
			self.right_border = Math.floor(st[counter].right);

			if(bChangedSteps){
				mDefaultMode.step_short = Math.floor(st[counter].step_short);
				mDefaultMode.step_long = Math.floor(st[counter].step_long);
			}
			// _updateScale();
			self.redrawTimeline({sender: "animation"});
			counter++;
			if(counter < steps){
				setTimeout(anumation_timeline_, 10);
			}else{
				if(bChangedSteps){
					mDefaultMode = clone(mode_new);
				}
				self.left_border = l;
				self.right_border = r;
				self.redrawTimeline({sender: "animation"});
				mAnimationToProgress = false;
			}
		}
		setTimeout(anumation_timeline_, 15);
	}

	self.fixBorderLimit = function(left_b,right_b){
		var res = {};
		res.left = left_b;
		res.right = right_b;

		if(self.isRange()){
			if(res.right > mRangeMax){
				res.right = mRangeMax;
				res.left = res.right - mDefaultMode.len_ms;
			}
			if(res.left < mRangeMin){
				res.left = mRangeMin;
				res.right = res.left + mDefaultMode.len_ms;
			}
		}else{
			var max = CloudHelpers.getCurrentTimeUTC() + mDefaultMode.len_ms/2;
			if(res.right > max){
				var d = res.right - max;
				res.left = res.left - d;
				res.right = res.right - d;
			}
		}
		return res;
	}

	self.moveToRight = function(){
		var diff = self.right_border - self.left_border;
		diff = Math.floor(0.75*diff);
		var l = self.left_border + diff;
		var r = self.right_border + diff;
		var f = self.fixBorderLimit(l,r);
		self.animationTo(f.left,f.right);
	}
	mRightArrow.onclick = self.moveToRight;

	self.moveToLeft = function(){
		var diff = self.right_border - self.left_border;
		diff = Math.floor(0.75*diff);
		var l = self.left_border - diff;
		var r = self.right_border - diff;
		var f = self.fixBorderLimit(l,r);
		self.animationTo(f.left,f.right);
	}
	mLeftArrow.onclick = self.moveToLeft;


	self.moveToPosition = function(t){
		console.log("moveToPosition");
		var diff2 = Math.floor((self.right_border - self.left_border)/2);
		var newLeft = t - diff2;
		var newRight = t + diff2;
		if(self.isRange()){
			if(newLeft < mRangeMin || newRight > mRangeMax){
				console.error("Can not move beyond range")
				return;
			}
		}
		self.animationTo(newLeft, newRight);
	}

	self.mousedown = function(event){
		if(!mStartMove){
			// console.log("mousedown", event);
			mFirstMoveX = event.offsetX;
			mLastMoveX =  event.offsetX;
			mStartMove = true;
			mElementContent.style.cursor = "move";
			try{
				if (window.getSelection) {
					window.getSelection().removeAllRanges();
				} else if (document.selection) {
					document.selection.empty();
				}
			}catch(e){
				console.error(e)
			}

		}
	}

	self.mousemove = function(event){
		if(mStartMove && !self.isRange()){
			// console.log("mousemove", event);
			var nDiff = event.offsetX - mLastMoveX;
			if(event.movementX !== undefined){ // not supported in safari & ie
				nDiff = event.movementX;
			}
			if(nDiff != 0){
				var diff_t = Math.floor(nDiff*mDistSec);
				mLastMoveX += nDiff;
				var f = self.fixBorderLimit(self.left_border - diff_t, self.right_border - diff_t);
				self.left_border = f.left;
				self.right_border = f.right;
				self.redrawTimeline({sender: "mousemove"});
			}
		}
	}

	self.mouseup = function(event){
		if(mStartMove){
			// console.log("mouseup", event);
			mElementContent.style.cursor = "default";
			mStartMove = false;
		}
	}

	self.mouseout = function(event){
		if(mStartMove){
			// console.log("mouseout", event);
			if(event.relatedTarget && event.relatedTarget.nodeName == "CRECT"
		      || event.target && event.target.nodeName == "CRECT"){
				return; // skip
			}

			if(event.relatedTarget && event.relatedTarget.className == "cloudcameratimeline-cursor"
				|| event.target && event.target.className == "cloudcameratimeline-cursor"){
				return; // skip
			}

			mElementContent.style.cursor = "default";
			mStartMove = false;
		}
	}

	mElementContent.addEventListener('mousedown', self.mousedown);
	mElementContent.addEventListener('mousemove', self.mousemove);
	mElementContent.addEventListener('mouseup', self.mouseup);
	mElementContent.addEventListener('mouseout', self.mouseout);

	function _clickOnData(event){
		if (mPlayer == null) {
			console.log("[CloudCameraTimeline] player is null");
			return;
		}

		if (mSource == null) {
			console.log("[CloudCameraTimeline] source is null");
			return;
		}

		if(mFirstMoveX == mLastMoveX){
			var rect = event.currentTarget.getBoundingClientRect();
			var offsetX = event.clientX - rect.left;
			var t = Math.floor(offsetX*mDistSec);
			t = t + self.left_border;
			if(t >= CloudHelpers.getCurrentTimeUTC() && mPlayer){
				mCursorPosition = CloudHelpers.getCurrentTimeUTC();
				_updateCursorPosition({sender: "click"});
				mPlayer.stop("by_timeline_1");
				mPlayer.setPosition(CloudPlayer.POSITION_LIVE);
				mPlayer.play();
				mCallbacks.executeCallbacks(CloudPlayerEvent.USER_CLICKED_ON_TIMELINE, {pos: CloudPlayer.POSITION_LIVE});
			} else if(t && mPlayer){
				mCursorPosition = t;
				_updateCursorPosition({sender: "click"});
				mPlayer.stop("by_timeline_2");
				mPlayer.setPosition(t);
				mPlayer.play();
				mCallbacks.executeCallbacks(CloudPlayerEvent.USER_CLICKED_ON_TIMELINE, {pos: t});
			}else{
				_updateCursorPosition({sender: "click"});
			}
		}
	}
	mElementData.onclick = _clickOnData;

	self.setMode = function(mode){
		var mode_new = null;
		if(mModes[mode.name]){
			mode_new = mModes[mode.name];
		}else{
			console.error('Unknown timeline mode')
			return -1;
		}
		var _center = (self.right_border - self.left_border)/2 + self.left_border;
		var mode_new_copy = clone(mode_new);
		var diff = mode_new.len_ms / 2;
		self.animationTo(_center - diff, _center + diff, mode_new_copy);
		return 0;
	}

	self.getMode = function(){
		return mDefaultMode;
	}

	self.destroy = function() {
            window.removeEventListener("resize", self.onTimeLineResize);
	    if(self.elem && (self.elem.tagName === 'DIV')) {
		while (self.elem.firstChild) {
			self.elem.removeChild(self.elem.firstChild);
		}
	    }
	    clearInterval(mIntervalPolingData);
	}

	// apply options
	if(options["arrows"] !== undefined){
		if(options["arrows"] == true){
			self.showArrowsButtons();
		}else{
			self.hideArrowsButtons();
		}
	}

	if(options["gotoLive"] !== undefined){
		if(options["gotoLive"] == true){
			self.showGotoLiveButton();
		}else{
			self.hideGotoLiveButton();
		}
	}

	if(options["range"] !== undefined){
		var rangeMin = options["range"]["min"];
		var rangeMax = options["range"]["max"];
		self.setRange(rangeMin, rangeMax);
	}

	if(mOptionCalendar){
		self.showCalendarButton();
	}else{
		self.hideCalendarButton();
	}
	console.log("options: ", options);
};

window.CloudCameraCalendarView = function(elem, options){
	var mElementContent = elem;
	options = options || {};
	var self = this;
	var mConn = null;
	var mActivity = {};
	var mCamID = null;
	var camIDsConns = [];
	var mLastUpdated = null;
	var mSelectedMonth = new Date().getMonth();
	var mSelectedYear = new Date().getFullYear();
	var mMinMonth = mSelectedYear * 100 + mSelectedMonth;
	var mMaxMonth = mSelectedYear * 100 + mSelectedMonth;
	var mTimezoneOffset = 0;

	function _generateMonthName(nYear, nMonth) {
		var name_month = ['January','February','March','April','May','June','July','August','September','October','November','December'];
		return name_month[nMonth%12] + ' ' + nYear;
	}

	function _formatId(nYear, nMonth, nDay) {
		return nYear + "-" + ("00" + (nMonth+1)).slice(-2) + "-" + ("00" + nDay).slice(-2);
	}

	function _generateMonthDays(nYear, nMonth) {
		var dt = new Date();
		var startDate = 1;
		dt.setFullYear(nYear);
		dt.setMonth(nMonth);
		dt.setDate(1);
		var startDay = dt.getDay();
		var prevMonth = (nMonth-1 + 12) % 12;
		var prevYear = nMonth == 0 ? nYear - 1 : nYear;
		var nextMonth = (nMonth+1 + 12) % 12;
		var nextYear = nMonth == 11 ? nYear + 1 : nYear;

		// 0 - Sunday, 1 - Moday, 2 - Thuesday...
		var lastDay = new Date(nextYear, nextMonth, 0);
		var endDate = lastDay.getDate();
		var endDay = lastDay.getDay();

		var prevEndDay = new Date(prevYear, prevMonth+1, 0).getDate();
		var name_days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
		var days = [];
		prevEndDay = prevEndDay - startDay + 1;
		for (var i = 0; i < startDay; i++) {
			days.push({d: prevEndDay, cl: 'disabled', dt: _formatId(nextYear, nextMonth, prevEndDay)});
			prevEndDay++;
		}

		for (var i = startDate; i <= endDate; i++) {
			days.push({d: i, cl: '', dt: _formatId(nYear, nMonth, i)});
		}
		var d = 0;
		for (var i = endDay+1; i < 7; i++) {
			d++;
			days.push({d: d, cl: 'disabled', dt: _formatId(nextYear, nextMonth, d)});
		}

		for (var i = 0; i < mActivity.length; i++) {
			var activeDay = mActivity[i];
			for (var dai = 0; dai < days.length; dai++) {
				if (days[dai].dt === activeDay) {
					days[dai].cl += "active-day";
				}
			}
		}

		var html = '<div class="cal-row week">';
		for (var i = 0; i < name_days.length; i++) {
			html += '<div class="cal-day name">' + name_days[i] + '</div>';
		}
		html += '</div>';
		html += '<div class="cal-row">';
		for (var i = 0; i < days.length; i++) {
			if (i % 7 == 0 && i > 0) {
				html += '</div><div class="cal-row">'
			}
			html += '<div class="cal-day ' + days[i].cl + '" dt="' + days[i].dt + '">' + days[i].d + '</div>';
		}
		html += '</div>';
		return html;
	}

	mElementContent.innerHTML = ''
		+ '	<div class="cloudcameracalendar-header">'
		+ '		<div class="cloudcameracalendar-prev-month"></div>'
		+ '		<div class="cloudcameracalendar-title">' + _generateMonthName(mSelectedYear, mSelectedMonth) + '</div>'
		+ '		<div class="cloudcameracalendar-next-month"></div>'
		// + '		<div class="cloudcameracalendar-close"></div>'
		+ "	</div>"
		+ "	<div class='cloudcameracalendar-table'>"
		+ _generateMonthDays(mSelectedYear, mSelectedMonth)
		+ "	</div>";

	var mElementClose = mElementContent.getElementsByClassName('cloudcameracalendar-close')[0];
	var mElementPrev = mElementContent.getElementsByClassName('cloudcameracalendar-prev-month')[0];
	var mElementNext = mElementContent.getElementsByClassName('cloudcameracalendar-next-month')[0];
	var mElementTable = mElementContent.getElementsByClassName('cloudcameracalendar-table')[0];
	var mElementTitle = mElementContent.getElementsByClassName('cloudcameracalendar-title')[0];

	// mElementClose.onclick = function(e){
	// 	// console.log("[CALENDAR] close ");
	// 	e.preventDefault();
	// 	e.stopPropagation();
	// 	mElementContent.style.display = "";
	// 	return true;
	// }

	self.renderContent = function() {
		// console.log("[CALENDAR] ", mActivity);
		var t = mActivity;
		mElementTitle.innerHTML = _generateMonthName(mSelectedYear, mSelectedMonth);
		mElementTable.innerHTML = _generateMonthDays(mSelectedYear, mSelectedMonth);

		var active_days = mElementContent.getElementsByClassName('active-day');
		for (var i = 0; i < active_days.length; i++) {
			active_days[i].onclick = function(ev){
				var _dt = new Date(this.getAttribute('dt').replace(/-/g, '\/'));
				_dt.setHours(8);
				if (self.onChangeDate) {
					self.onChangeDate(Date.parse(_dt), ev);
				}
			}
		}
		var _currMonth = mSelectedYear*100 + mSelectedMonth;
		if (_currMonth <= mMinMonth) {
			mElementPrev.style.display = 'none';
		} else {
			mElementPrev.style.display = '';
		}

		if (_currMonth >= mMaxMonth) {
			mElementNext.style.display = 'none';
		} else {
			mElementNext.style.display = '';
		}
	}
	self.renderContent();

	self.updateActivity = function() {
		if (mConn == null && camIDsConns.length == 0) {
			console.log("[CALENDAR] mConn is null");
			mActivity = [];
			self.renderContent();
			return;
		}

		if ((camIDsConns.length != 0)) {
			var bar = new Promise((resolve, reject) => {
				mActivity = [];
				for(var c = 0; c < camIDsConns.length; c++) {
					cApi = camIDsConns[c].conn._getAPI();
					cApi.storageActivity(camIDsConns[c].camID, true).done(function(r){
						mLastUpdated = new Date();
						for (var i = 0; i <r.objects.length; i++) {
							if (!mActivity.some(m => m == r.objects[i])) {
								mActivity.push(r.objects[i]);
								var s = r.objects[i].split("-");
								var _month = parseInt(s[1],10)-1;
								var val = parseInt(s[0],10)*100 + _month;
								if (i == 0) {
									mMinMonth = val;
									mMaxMonth = val;
								} else {
									mMinMonth = Math.min(val, mMinMonth);
									mMaxMonth = Math.max(val, mMaxMonth);
								}
							}
						}
					})
				}
				if (c == camIDsConns.length) resolve();
			});
			bar.then(() => { self.renderContent()});
		} else {
			mApi = mConn._getAPI();
			if (!mApi) {
				return;
			}
			mApi.storageActivity(mCamID, true).done(function(r){
				mLastUpdated = new Date();
				mActivity = r.objects;
				for (var i = 0; i < mActivity.length; i++) {
					var s = mActivity[i].split("-");
					var _month = parseInt(s[1],10)-1;
					var val = parseInt(s[0],10)*100 + _month;
					if (i == 0) {
						mMinMonth = val;
						mMaxMonth = val;
					} else {
						mMinMonth = Math.min(val, mMinMonth);
						mMaxMonth = Math.max(val, mMaxMonth);
					}
				}
				self.renderContent();
			})
		}		
	}

	self.setSource = function(mSource) {
		mSelectedMonth = new Date().getMonth();
		mSelectedYear = new Date().getFullYear();
		mLastUpdated = null;

		if (Array.isArray(mSource)) {
			mSource.forEach(s => {
				var source = s.player.getSource();
				if (source) {
					camIDsConns.push({"conn": source._getConn(), "camID": source.getID()});
					mTimezoneOffset = CloudHelpers.getOffsetTimezone(source.getTimezone());
				}
			})
			self.updateActivity();
		} else if (mSource != null) {
			mConn = mSource._getConn();
			mCamID = mSource.getID();
			// reset month and year
			mTimezoneOffset = CloudHelpers.getOffsetTimezone(mSource.getTimezone());
			self.updateActivity();
		} else {
			mConn = null;
			mTimezoneOffset = 0;
			mActivity = [];
			self.renderContent();
		}
	}

	self.dispose = function() {
		mConn = null;
	}

	mElementPrev.onclick = function() {
		mSelectedMonth = mSelectedMonth - 1;
		if (mSelectedMonth < 0) {
			mSelectedMonth = 11;
			mSelectedYear = mSelectedYear - 1;
		}
		self.renderContent();
	}

	mElementNext.onclick = function() {
		mSelectedMonth =  mSelectedMonth + 1;
		if (mSelectedMonth > 11) {
			mSelectedMonth = 0;
			mSelectedYear = mSelectedYear + 1;
		}
		self.renderContent();
	}

	self.isVisible = function() {
		return mElementContent.style.display !== '';
	}

	self.showCalendar = function() {
		console.log("[CALENDAR] show");
		mElementContent.style.display = "block";
		if (mConn == null) {
			self.renderContent();
			return;
		}
		if (mLastUpdated == null) {
			self.updateActivity();
			return;
		}
		var dt = new Date();
		dt.setUTCHours(24);
		dt.setUTCMinutes(0);
		dt.setUTCSeconds(0);

		if (new Date().getTime() > dt.getTime() && mLastUpdated.getTime() < dt.getTime()) {
			self.updateActivity();
		}
	}

	self.hideCalendar = function() {
		console.log("[CALENDAR] hide");
		mElementContent.style.display = '';
	}

	self.toggleCalendar = function(mElementCalendar) {
		console.log("[CALENDAR] toggle");
		if (self.isVisible()) {
			self.hideCalendar();
			mElementCalendar.classList.remove("shadowed");
		} else {
			self.showCalendar();
			mElementCalendar.classList.add("shadowed");
		}
	}
};
window.CloudSessionTimeline = function(viewid){
	var self = this;
	var mSource = null;
	var mModes = {};
	mModes["h12"] = { to: "min", len_ms: 9*60*60*1000, step_short: 30*60*1000, step_long: 150*60*1000 }; // 2,5 hr, step 30 min
	mModes["hr"] = { to: "h12", len_ms: 90*60*1000, step_short: 5*60*1000, step_long: 30*60*1000 }; // 30 min, step 5 min
	mModes["min"] = { to: "hr", len_ms: 15*60*1000, step_short: 1*60*1000, step_long: 5*60*1000 }; // 5 min, step 1 min

	function clone(obj) {
		if (null == obj || "object" != typeof obj) return obj;
		var copy = obj.constructor();
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
		}
		return copy;
	}

	var mDefaultMode = clone(mModes["min"]);

	self.elem = document.getElementById(viewid);

	if(self.elem == null){
		console.error("[CloudPlayerTimeline] Not found element");
		return null;
	}

	if(self.elem.tagName != 'DIV'){
		console.error("[CloudPlayerTimeline] Expected DIV tag but got " + self.elem.tagName);
		return null;
	}

	// default
	self.elem.classList.add("cloudplayertimeline");
	self.elem.classList.add("green");
	self.elem.classList.add("black");

	self.elem.innerHTML = ''
		+ '<div class="cloudplayertimeline-content">'
		+ '		<div class="cloudplayertimeline-scale session"></div>'
		+ '		<div class="cloudplayertimeline-data session"></div>'
		+ '		<div class="cloudplayertimeline-cursor"></div>'
		+ '</div>';

	self.left_border = CloudHelpers.getCurrentTimeUTC() - mDefaultMode.len_ms/2;
	self.right_border = self.left_border + mDefaultMode.len_ms;

	self.el_data = self.elem.getElementsByClassName('cloudplayertimeline-data')[0];
	var el_cursor = self.elem.getElementsByClassName('cloudplayertimeline-cursor')[0];
	self.el_scale = self.elem.getElementsByClassName('cloudplayertimeline-scale')[0];

	function _stopPolingCursor(){
		clearInterval(self._polingCursor);
	}

	function _startPolingCursor(){
		_stopPolingCursor();
		self._polingCursor = setInterval(function(){
			var t = self.plr.getPosition();
			if(t < self.left_border || t > self.right_border){
				if(el_cursor.style.display != 'none'){
					el_cursor.style.display = 'none'
				}
			}
			if(el_cursor.style.display != 'inline-block'){
				el_cursor.style.display = 'inline-block';
			}
			if(t != 0){
				var le = self.calcPosition(t) + 50 + 'px';
				el_cursor.style.left = le;
			}
		},1000);
	}

	self.setPlayer = function(player){
		_stopPolingCursor();
		self.plr = player;
		if(self.plr){
			_startPolingCursor();
		}
	}

	self.calcPosition = function(t){
		return Math.floor((t - self.left_border) * self.distPx);
	}

	self.months = ['Jan','Feb','Mar','Apr','May','Jun', 'Jul', 'Aug', 'Spt', 'Oct', 'Nov', 'Dec'];

	self.dateFormat = function(t, bMonth){
		var d = new Date();
		d.setTime(t);
		var str = ("00" + d.getUTCHours()).slice(-2) + ":"
			+ ("00" + d.getUTCMinutes()).slice(-2);
		if(bMonth)
			str += " (" + d.getUTCDate() + " " + self.months[d.getUTCMonth()] + ")";
		return str;
	}

	self.redrawTimeline = function(){
		if(self.plr != null){
			mSource = self.plr.getSource();
		}else{
			mSource = null;
		}
		if(mSource != null){
			self.left_border = mSource.getStartTime();
			self.right_border = mSource.getEndTime();
			mDefaultMode.step_short = (self.right_border - self.left_border)/20;
			// TODO
			// 120000
		}
		el_cursor.style.display = 'none'; // hide

		self.containerWidth = self.el_scale.offsetWidth;
		self.distPx = self.containerWidth / (self.right_border - self.left_border); // TODO on init mode
		self.distSec = (self.right_border - self.left_border) / self.containerWidth; // TODO on init mode

		var left_border_short = Math.floor(self.left_border / mDefaultMode.step_short);
		var right_border_short = Math.floor(self.right_border / mDefaultMode.step_short) + 1;

		self.el_data.innerHTML = '';
		self.el_scale.innerHTML = '<vtext id="texttimelinetest"><vtext>';
		var test_text = document.getElementById('texttimelinetest');
		test_text.innerHTML = self.dateFormat(self.left_border, false);
		var textWidth = test_text.clientWidth;
		test_text.innerHTML = self.dateFormat(self.left_border, true);
		var textWidthWithMonth = test_text.clientWidth;

		// correct step long (if text was biggest)
		var step_long = mDefaultMode.step_long;
		while((textWidth)*self.distSec > step_long){
			step_long += mDefaultMode.step_long;
		};

		var nTextWithMonth = step_long*2;

		self.el_scale.innerHTML += '<hline></hline>';
		for(var i = left_border_short; i < right_border_short; i++){
			var t = i*mDefaultMode.step_short;
			var pos = self.calcPosition(t);
			if(t % mDefaultMode.step_long == 0){
				var bTextWithMonth = t % nTextWithMonth == 0;
				var tw = (bTextWithMonth ? textWidthWithMonth : textWidth);
				var tpos = pos - tw/2;

				self.el_scale.innerHTML += '<vline style="left: ' + pos + 'px"></vline>';

				if(t % step_long == 0){
					self.el_scale.innerHTML += '<vtext style="left: ' + tpos + 'px">' + self.dateFormat(t,bTextWithMonth) + '</vtext>';
				}
			}else{
				self.el_scale.innerHTML += '<vline style="left: ' + pos + 'px"></vline>';
			}
		}

		self.el_data.innerHTML = '';
			if(mSource != null){

				// mSource._getAPI().getCamsessRecords();

				mSource.getTimeline(self.left_border, self.right_border).done(function(timeline){

				var per = timeline.periods;
				self.el_data.innerHTML = '';
				for(var i = 0; i < per.length; i++){
					var start = self.calcPosition(per[i].start);
					var end = self.calcPosition(per[i].end);
					var el = '<crect style="left: ' + start + 'px; width: ' + (end - start) + 'px"></crect>';
					self.el_data.innerHTML += el;
				}
			}).fail(function(err){
				console.error(err);
			});
		}
	}
	self.redrawTimeline();

	window.addEventListener("resize", self.redrawTimeline);

	self.animationTo = function(l,r, mode_new){
		mode_new = mode_new || mDefaultMode;
		// TODO lock timeline
		var steps = 25; // for ~1 sec
		var len_left = l - self.left_border;
		var len_right = r - self.right_border;
		var len_step_short = mode_new.step_short - mDefaultMode.step_short;
		var len_step_long = mode_new.step_long - mDefaultMode.step_long;
		var bChangedSteps = (len_step_short != 0 && len_step_long != 0);
		var steps_left = [];
		var steps_right = [];
		var steps_step_short = [];
		var steps_step_long = [];
		var p = 3.14/steps;
		var sum = 0;
		for(var i = 0; i < steps; i++){
			var k = Math.sin(i*p);
			sum += k;
		}

		for(var i = 0; i < steps; i++){
			var k = Math.sin(i*(3.14/steps));
			steps_left.push(k*(len_left/sum));
			steps_right.push(k*(len_right/sum));
			if(bChangedSteps){
				steps_step_short.push(k*(len_step_short/sum));
				steps_step_long.push(k*(len_step_long/sum));
			}
		}

		var counter = 0;
		function anumation_timeline_(){
			self.left_border += steps_left[counter];
			self.right_border += steps_right[counter];

			if(bChangedSteps){
				mDefaultMode.step_short += steps_step_short[counter];
				mDefaultMode.step_long += steps_step_long[counter];
			}

			self.redrawTimeline();
			counter++;
			if(counter < steps){
				setTimeout(anumation_timeline_, 10);
			}else{
				if(bChangedSteps){
					mDefaultMode = clone(mode_new);
				}
				self.redrawTimeline();
			}
		}
		setTimeout(anumation_timeline_, 15);
	}

	self.fixBorderLimit = function(left_b,right_b){
		var res = {};
		res.left = left_b;
		res.right = right_b;
		var max = CloudHelpers.getCurrentTimeUTC() + mDefaultMode.len_ms/2;
		if(res.right > max){
			var d = res.right - max;
			res.left = res.left - d;
			res.right = res.right - d;
		}
		return res;
	}

	self._clickOnData = function(e){
		if(self.plr == null){
			console.log("[CloudCameraTimeline] player is null");
			return;
		}

		if(mSource == null){
			console.log("[CloudCameraTimeline] source is null");
			return;
		}

		var t = Math.floor(e.offsetX*self.distSec);
		t = t + self.left_border;
		if(t && self.plr){
			self.plr.stop("by_session_timeline_1");
			self.plr.setPosition(t);
			self.plr.play();
		}
	}
	self.el_data.onclick = self._clickOnData;

	self._startMove = false;
	self._lastMoveX = 0;

	self.mousedown = function(event){
		// console.log("down", event);
		self._lastMoveX =  event.offsetX;
		self._startMove = true;
		self.el_data.style.cursor = "move";

		// console.log("down", self._lastMoveX);
	}

	self.mousemove = function(event){
		if(self._startMove){
			// console.log("move", event);
			var diff = event.offsetX - self._lastMoveX;
			// console.log("move " + diff);
			if(diff != 0){
				var diff_t = Math.floor(diff*self.distSec);
				self._lastMoveX = event.offsetX;
				var f = self.fixBorderLimit(self.left_border - diff_t, self.right_border - diff_t);
				self.left_border = f.left;
				self.right_border = f.right;
				self.redrawTimeline();
			}
		}
	}

	self.mouseup = function(event){
		// console.log("up", event);
		// console.log("up/out " + self._lastMoveX + " , new: " + event.offsetX);
		self._startMove = false;
		self.el_data.style.cursor = "default";
	}

	self.el_data.addEventListener('mousedown', self.mousedown);
	self.el_data.addEventListener('mousemove', self.mousemove);
	self.el_data.addEventListener('mouseup', self.mouseup);
	self.el_data.addEventListener('mouseout', self.mouseup);
};

window.VXGCloudPlayerTimelineView = function( viewid, options, parent){
	var self = this;
	options = self.options = options || {};
	var mSource = null;
	var mTimezoneOffset = 0;
	var mConn = null;

	// cache by every 3 hours
	var mCacheDurationGrid = 10800000;
	var mCacheRecords = {};
	var mCursorPosition = 0;
	var mTimelineDrawing = false;
	var mContainerWidth = 0;
	var mDistPx = 0;
	var mDistSec = 0;
	var mViewID = viewid;
	var mIntervalPolingData = null;
	var mPolingDataMax = 0;
	var mPlayer = null;
	var mRangeMin = -1;
	var mRangeMax = -1;
	var mNavArrowsHided = false;
	var mStartMove = false;
	var mFirstMoveX = 0;
	var mLastMoveX = 0;
	var mAnimationToProgress = false;
	var mLeftDataPadding = 0;
	var mRightDataPadding = 0;
	var mOptionCalendar = false;
	var mUseTimezone = null;
	var mRangePolingDataEveryInSec = null;
	var mPolingRangeDataInterval = null;
	var mCallbacks = CloudHelpers.createCallbacks();
	var el_timeline_container	= null;
	var el_calendar_container 	= null;
	var el_live_container		= null;
	var el_vxgcloudplayer 		= null;
	var el_timelinepicker		= null;
	var timeline_range_or_not	= null;
	var mNoUpdateTimeline		= false;

	if (options.useTimezone) {
		mUseTimezone = options.useTimezone;
		console.warn("[CloudTimeline] useTimezone: " + mUseTimezone);
	}

	if(options["calendar"] !== undefined){
		mOptionCalendar = options["calendar"] == true;
	}

	if(options["polingRangeDataEveryInSec"] !== undefined) {
		mRangePolingDataEveryInSec = parseInt(options["polingRangeDataEveryInSec"]);
	}

	function clone(obj) {
		if (null == obj || "object" != typeof obj) return obj;
		var copy = obj.constructor();
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
		}
		return copy;
	}

	var mModes = {};
	mModes["HOURS_12_MODE"] = {
		len_ms: 9*60*60*1000, // 9 hours
		step_short: 30*60*1000, // 30 minutes
		step_long: 150*60*1000 // 2 hours and 30 minutes
	};
	mModes["HOUR_MODE"] = {
		len_ms: 90*60*1000, // 1 hour and 30 minutes
		step_short: 5*60*1000, // 5 minutes
		step_long: 30*60*1000 // 30 minutes
	};
	mModes["MINUTES_MODE"] = {
		len_ms: 15*60*1000,  // 15 minutes
		step_short: 1*60*1000,  // 1 minute
		step_long: 5*60*1000  // 5 minutes
	};
	var mRangeLenModeMs = 3*60*60*1000 + 60*1000; // 3 hours

	var mDefaultMode = clone(mModes["MINUTES_MODE"]);

	if (parent && parent.player) {
	    el_timeline_container	= parent.player.getElementsByClassName('cloudplayer-timeline-container')[0];
	    el_calendar_container 	= parent.player.getElementsByClassName('cloudplayer-calendar-container')[0];
	    el_live_container		= parent.player.getElementsByClassName('cloudplayer-live-container')[0];
	    el_vxgcloudplayer		= parent.player.getElementsByClassName('cloudplayer-vxgcloudplayer')[0];
	} else {
	    el_timeline_container	= document.getElementsByClassName('cloudplayer-timeline-container')[0];
	    el_calendar_container 	= document.getElementsByClassName('cloudplayer-calendar-container')[0];
	    el_live_container		= document.getElementsByClassName('cloudplayer-live-container')[0];
	    el_vxgcloudplayer		= document.getElementsByClassName('cloudplayer-vxgcloudplayer')[0];
	}

	var timeline_target = document.createElement("div");
	timeline_target.classList.add("cloudcameratimeline");
	timeline_target.classList.add("green");
	timeline_target.classList.add("black");
	timeline_target.classList.add("row");
	timeline_target.classList.add("no-gutters");

	/*
	timeline_target.innerHTML = ''
		+ '<div id="' + viewid +'_timeline" class="ktimepicker-container" style="color:white;background:rgba(0,0,0,0);width:100%;height:36px;position:absolute;bottom:0;"></div>'
                + '<div class="cloudcameratimeline-calendar" style="display: none"></div>'
		+ '<div class="cloudcameratimeline-goto-live disabled" style="position:absolute;right:0;top:0;">Live</div>'
*/

	timeline_target.innerHTML = ''
	+ '<div class="cloudcameratimeline-calendar" style="display: none"></div>'
	+ '<div class="cloudcameratimeline-goto-live disabled">Live</div>'
	+ '<div class="cloudcameratimeline-shift shift-minus col-1">-1h</div>'
	+ '<div class="cloudcameratimeline-left col-1"></div>'
	+ '<div id="' + viewid +'_timeline" class="ktimepicker-container" style="color:white;background:rgba(0,0,0,0);height:36px;max-width:80%!important;flex: 0 0 80%;margin-top: 8px;"></div>'
//		+ '<div class="cloudcameratimeline-calendar" style="display: none"></div>'
	+ '</div>'
	+ '<div class="cloudcameratimeline-right col-1"></div>'
	+ '<div class="cloudcameratimeline-shift shift-plus col-1">+1h</div>'
//		+ '<div class="cloudcameratimeline-goto-live disabled">Live</div>'
	+ '';

	var mElementContent = timeline_target.getElementsByClassName('cloudcameratimeline-content')[0];
	var mElementData = timeline_target.getElementsByClassName('cloudcameratimeline-data')[0];
	var mElementCalendar = timeline_target.getElementsByClassName('cloudcameratimeline-calendar')[0];
	var mElementCursor = timeline_target.getElementsByClassName('cloudcameratimeline-cursor')[0];
	var mElementScale = timeline_target.getElementsByClassName('cloudcameratimeline-scale')[0];
	var mElementGotoLive = timeline_target.getElementsByClassName('cloudcameratimeline-goto-live')[0];
	var mLeftArrow = timeline_target.getElementsByClassName('cloudcameratimeline-left')[0];
	var mRightArrow = timeline_target.getElementsByClassName('cloudcameratimeline-right')[0];
	var mShiftMinus = timeline_target.getElementsByClassName('shift-minus')[0];
	var mShiftPlus = timeline_target.getElementsByClassName('shift-plus')[0];

	el_calendar_container.appendChild(mElementCalendar);
	el_live_container.appendChild(mElementGotoLive);

//	self.elem = document.getElementById(viewid);
//	if ((self.elem != null) && (self.elem.tagName === 'DIV')){
//	    self.elem.appendChild(timeline_target);
//	    timeline_range_or_not = self.elem;
//	} else {
	    el_timeline_container.appendChild(timeline_target);
//	    timeline_range_or_not = el_timeline_container;
//	}
	el_vxgcloudplayer.setAttribute('timelineselector', '#' + viewid +'_timeline');

	var obs  = null;
	var targetNode = el_timeline_container.getElementsByClassName("ktimepicker-container")[0];
	var observe_config = { childList: true };
	var observe_callback = function(mutationsList) {
	    for(var mutation of mutationsList) {
		if (mutation.type == 'childList') {
			console.log('A child node has been added or removed.');
			el_timelinepicker = el_timeline_container.getElementsByTagName('k-timeline-picker')[0];
			if (el_timelinepicker) {
				el_timelinepicker.addEventListener("change", function(event){
					//console.log("el_timelinePicker change");
					if (parent.mSrc === undefined || parent.mSrc == null) {
						return;
					}
					mNoUpdateTimeline = true;
					var  centertime = Number(el_timelinepicker.getAttribute('centerutctime'));

					var player_position = parent.getPosition();
					if (centertime > Date.now()) {
						var isLive = parent.isLive();
						if (!isLive) {
							parent.setPosition(CloudHelpers.POSITION_LIVE);
							parent.play('timepicker');
						}
					} else {
						if (player_position != centertime) {
							parent.setPosition(centertime);
							parent.play('timepicker');
						}
					}
					mNoUpdateTimeline = false;
				});
				obs.disconnect();
			}
		}
	    }
	};
	var observer = new MutationObserver(observe_callback);
	obs = observer;
	observer.observe(targetNode, observe_config);

	var mCalendar = null;


	function _initCalendar() {
		if (mPlayer == null) {
			console.error("[TIMELINE] player is null") ;
			return;
		}

		if (mOptionCalendar) {
			mCalendar = new CloudCameraCalendarView(mPlayer.getCalendarContent(), options);
			mCalendar.onChangeDate = function(t, e) {
				if (mPlayer == null) {
					console.error("[TIMELINE] player is null") ;
					return;
				}
				mPlayer.setPosition(t);
				//self.moveToPosition(t - mTimezoneOffset);
				mPlayer.play(e);
			};
			self.calendar = mCalendar;
		}
	}

	mElementCalendar.onclick = function() {
		if (mCalendar != null) {
			console.log(mPlayer);
			mPlayer.player.classList.remove('showing-settings', 'showing-zoom');
			mCalendar.toggleCalendar(mElementCalendar);
		}
	}

	function _minusHour() {
		var t = mPlayer.getPosition();
		// Live video and position is not detected
		if (t == 0)
			t = CloudHelpers.getCurrentTimeUTC();
		if (t != 0)
		{
			mPlayer.stop("by_timeline_2");
			mPlayer.setPosition(t - 3600*1000);
			mPlayer.play();
		}
		else
			console.log("Invalid current position");
	}

	function _plusHour() {
		var isLive = mPlayer.isLive();
		if (isLive == true){
			return;
		}
		var t = mPlayer.getPosition();
		if (t == 0)
			t = CloudHelpers.getCurrentTimeUTC();
		if (t != 0)
		{
			mPlayer.stop("by_timeline_2");
			mPlayer.setPosition(t + 3600*1000);
			mPlayer.play();
		}
		else
			console.log("Invalid current position ");
	}

	mShiftPlus.onclick = _plusHour;
	mRightArrow.onclick = _plusHour;

	mShiftMinus.onclick = _minusHour;
	mLeftArrow.onclick = _minusHour;

	function _gotoLive(e){
		if (parent.mSrc === undefined || parent.mSrc == null) {
			return;
		}
		if(parent != null && parent.getSource() != null){
			var sClasses = mElementGotoLive.classList;
			if(sClasses.contains('now') == false && sClasses.contains('disabled') == false){
				parent.setPosition(CloudPlayer.POSITION_LIVE);
				parent.play();
				//self.moveToPosition(CloudHelpers.getCurrentTimeUTC());
			}
			if(sClasses.contains('now') != false){
				//self.moveToPosition(CloudHelpers.getCurrentTimeUTC());
			}
		}
	}
	mElementGotoLive.onclick = _gotoLive;

/*
	function _updateScale(){
		if((mContainerWidth != mElementScale.offsetWidth) && (mElementScale.offsetWidth != 0)){
			mContainerWidth = mElementScale.offsetWidth
		}
		mDistPx = mContainerWidth / (self.right_border - self.left_border); // TODO on init mode or resize
		mDistSec = (self.right_border - self.left_border) / mContainerWidth; // TODO on init mode or resize
	}
	_updateScale();
*/
/*
	function _normalizeT(t){
		var tmp = t;
		tmp = tmp - tmp%1000;
		tmp = tmp - tmp % mCacheDurationGrid;
		return tmp;
	}
*/
	function _stopPolingCursor(){
		clearInterval(self._polingCursor);
		mElementGotoLive.classList.remove("now");
		mElementGotoLive.classList.add("disabled");
	}
/*
	function _polingUpdateData(){
		if(mSource != null && mSource.type == 'camera'){
			var camid = mSource.getID();
			var startDT = CloudHelpers.formatUTCTime(mPolingDataMax);
			if (mConn._getAPI() == null) {
				return;
			}
			mConn._getAPI().storageRecordsFirst(camid, startDT, 50).done(function(r){
				var bNeedExecuteCallback = false;
				//for (var i in r.objects) {
				for(var i = 0; i < r.objects.length; i++){
					var record = r.objects[i];
					var startUTCTime = CloudHelpers.parseUTCTime(record.start);
					var endUTCTime = CloudHelpers.parseUTCTime(record.end);

					var nsta = _normalizeT(startUTCTime);
					var nend = _normalizeT(endUTCTime);
					if (!mCacheRecords[nsta]) {
						mCacheRecords[nsta] = { status: 1, data: [] };
					}
					var nUpdated = 0;
					var maxVal = 0;
					var minVal = 0;
					//for(var pr in mCacheRecords[nsta].data){
					for(var pr = 0; pr < mCacheRecords[nsta].data.length; pr++){
						var period = mCacheRecords[nsta].data[pr];
						if (period.end > maxVal) {
							maxVal = period.end;
						}
						if (period.start < startUTCTime && startUTCTime - 2000 < period.end) {
							if (endUTCTime > period.end) {
								mCacheRecords[nsta].data[pr].end = endUTCTime;
								nUpdated = 1;
								// console.log("Updated end period2 ", mCacheRecords[nsta].data[pr]);
								self._eventRedrawTimeline();
								bNeedExecuteCallback = true;
							} else {
								nUpdated = 2;
								// console.log("Skip");
							}
						}
					}
					if (nUpdated == 0) {
						if (maxVal < endUTCTime) {
							var period = {start: startUTCTime, end: endUTCTime};
							mCacheRecords[nsta].data.push(period);
							// console.warn("Added period: ", period);
							self._eventRedrawTimeline();
							bNeedExecuteCallback = true;
						}
					}

					if(endUTCTime > mPolingDataMax){
						mPolingDataMax = endUTCTime + CloudHelpers.ONE_SECOND;
					}
				}
				if (bNeedExecuteCallback) {
					mCallbacks.executeCallbacks(CloudPlayerEvent.TIMELINE_END_UPDATED, {});
					if (mPlayer != null) {
						setTimeout(mPlayer.onTimelineEndUpdate, 1);
					}
				}
			});
		}
	}
*/
/*
	function _stopPolingData(){
		clearInterval(mIntervalPolingData);
		mIntervalPolingData = null;
	}
*/
/*
	function _startPolingData(){
		clearInterval(mIntervalPolingData);
		mPolingDataMax = CloudHelpers.getCurrentTimeUTC() - CloudHelpers.ONE_MINUTE;
		mIntervalPolingData = setInterval(_polingUpdateData, 30000); // every 30 sec
	}
*/
/*
	function _calcPosition(t){
		return Math.floor((t - self.left_border) * mDistPx);
	}
*/
/*
	self.removeCallback = function(uniqname){
		mCallbacks.removeCallback(uniqname);
	}
*/
/*
	self.addCallback = function(uniqname, func){
		mCallbacks.addCallback(uniqname, func);
	}
*/


	function _updateCursorPosition(opt){
		opt = opt || {};

		if (parent.mSrc === undefined || parent.mSrc == null) {
			mElementGotoLive.classList.remove("now");
			mElementGotoLive.classList.add("disabled");
		} else {
			if(parent.isLive()){
				mElementGotoLive.classList.remove("disabled");
				mElementGotoLive.classList.add("now");
			}else{
				mElementGotoLive.classList.remove("disabled");
				mElementGotoLive.classList.remove("now");
			}
		}

		el_timelinepicker = el_timeline_container.getElementsByTagName('k-timeline-picker')[0];

		if (el_timelinepicker && mCursorPosition!=0 && !mNoUpdateTimeline ) {
			if (parent.isLive()) {
				var vcp = parent.player.getElementsByTagName('vxg-cloud-player')[0];
				vcp.setTimePromise( mCursorPosition ).then(function(res){
				}).catch(function(exc){
				});
				//el_timelinepicker.setAttribute('centerutctime', mCursorPosition);
			}
		}

/*
		if(mCursorPosition < (self.left_border - 1000) || mCursorPosition > (self.right_border + 1000)){
			if(mElementCursor.style.display != 'none'){
				mElementCursor.style.display = 'none'
			}
			return;
		}
		if(mElementCursor.style.display != 'inline-block'){
			mElementCursor.style.display = 'inline-block';
		}
		if(mCursorPosition != 0){
			var le = _calcPosition(mCursorPosition);
			var leftPositionAdjustment = -10;
			if(le > -5 && le < mContainerWidth){

				mElementCursor.style.left = (le + mLeftDataPadding + leftPositionAdjustment) + 'px';

				// automove if near to ritght border
				var diff = mContainerWidth - le;
				var ritgh_diff_procents = (diff*100/mContainerWidth);
				if(ritgh_diff_procents < 3){
					if(opt.sender == "poling" || opt.sender == "click"){
						if(!self.isRange() && !mStartMove && !mAnimationToProgress){
							console.log("[TIMELINE] Auto move if not user drag");
							setTimeout(function(){
								console.log("[TIMELINE] mCursorPosition: " + mCursorPosition);
								self.moveToPosition(mCursorPosition);
							},100);
						}
					}
				}
			}else{
				if(mElementCursor.style.display != 'none'){
					mElementCursor.style.display = 'none'
				}
			}
		}else{
			if(mElementCursor.style.display != 'none'){
				mElementCursor.style.display = 'none'
			}
		}
*/
	}

	function _startPolingCursor(){
		_stopPolingCursor();
		self._polingCursor = setInterval(function(){
			if(parent != null){
				var currPos = parent.getPosition();
				if (currPos != 0) {
					mCursorPosition = parent.getPosition();
				}
			}else{
				mCursorPosition = 0;
			}
			//console.log("mCursorPosition: " + mCursorPosition);
			_updateCursorPosition({sender: "poling"});
		},1000);
	}

/*
	function _isLoadedData(left,right){
		var start = _normalizeT(left);
		var end = _normalizeT(right) + mCacheDurationGrid;
		if(end < start){
			console.error("[ERROR] start must be more than end");
			return false;
		}
		var bLoaded = true;
		for(var i = start; i <= end; i = i + mCacheDurationGrid){
			if(!mCacheRecords[i]){
				bLoaded = false;
			}else if (mCacheRecords[i].status != 1){
				bLoaded = false;
			}
		}
		return bLoaded;
	}
*/
/*
	function _updatedRecords(){
		var calltime = new Date().getTime();
		// console.log("_updatedRecords() start ");
		// self.el_data.innerHTML = '';
		var start = _normalizeT(self.left_border);
		var end = _normalizeT(self.right_border) + mCacheDurationGrid;
		if(end < start){
			console.error("[ERROR] start must be more than end");
			return false;
		}
		if(self.isRange()){
			if(start < mRangeMin_Normalize){
				console.error("[ERROR] Going beyond the range (start)");
				return false;
			}

			if(end > mRangeMax_Normalize){
				console.error("[ERROR] Going beyond the range (end)");
				return false;
			}
		}

		// document.getElementsByClassName("cloudcameratimeline-data")[0].getElementsByClassName("crect")
		// var crectList = document.getElementsByClassName("cloudcameratimeline-data")[0].getElementsByTagName("crect");
		var crectList = mElementData.getElementsByTagName("crect");
		var crect_i = 0;
		// console.log("Before: " + crectList.length);
		for(var i = start; i <= end; i = i + mCacheDurationGrid){
			var c = mCacheRecords[i];
			if(c && c.status == 1){
				for(var di = 0; di < c.data.length; di++){
					if(c.data[di].end < self.left_border)
						continue;
					if(c.data[di].start > self.right_border)
						continue;
					var start_rec_px_ = _calcPosition(c.data[di].start);
					var end_rec_px_ = _calcPosition(c.data[di].end);
					var sLeft = start_rec_px_ + "px";
					var sWidth = (end_rec_px_ - start_rec_px_) + "px";
					if(crect_i < crectList.length){
						crectList[crect_i].style.display = "";
						crectList[crect_i].style.left = sLeft;
						crectList[crect_i].style.width = sWidth;
						crect_i++;
					}else{
						var el = '<crect style="left: ' + sLeft + '; width: ' + sWidth + '"></crect>';
						mElementData.innerHTML += el;
						crect_i++;
					}
				}
			}
		}
		// console.log("After: " + crectList.length);
		for(var i = crect_i; i < crectList.length; i++){
			if(crectList[i].style.display != "none"){
				crectList[i].style.display = "none";
			}
		}
		// console.log("_updatedRecords() end " + (new Date().getTime() - calltime) + " ms, count elements: " + mElementData.childElementCount);
	}
*/
/*
	function _loadRecordsPortion(i){
		// console.log("_loadRecordsPortion(" + i + ")");
		var p = CloudHelpers.promise();
		var ca = mCacheRecords[i];
		if(ca && ca.status == 1) {
			p.resolve();
			return p;
		}

		if(mSource != null){
			mCacheRecords[i] = {};
			mCacheRecords[i].status = 0;
			mCacheRecords[i].data = [];

			mSource.getTimeline(i, i + mCacheDurationGrid).done(function(timeline){
				// console.warn(timeline);
				if(mCacheRecords[i]){
					mCacheRecords[i].status = 1;
					mCacheRecords[i].data = timeline.periods;
				}
				_updatedRecords();
			}).fail(function(){
				if(mCacheRecords[i]){
					mCacheRecords[i].status = -1;
				}
				p.reject();
			})
		}else{
			p.reject();
		}
		return p;
	}
*/
/*
	function _loadData(left,right){
		// console.log("_loadData(" + left + "," + right + ")");
		var start = _normalizeT(left);
		var end = _normalizeT(right) + mCacheDurationGrid;
		if(end < start){
			console.error("[ERROR] start must be more than end");
			return false;
		}

		if(self.isRange()){
			if(left < mRangeMin_Normalize){
				console.error("[ERROR] Going beyond the range (left)");
				return false;
			}

			if(end > mRangeMax_Normalize){
				console.error("[ERROR] Going beyond the range (right)");
				return false;
			}
		}

		if (mSource != null) {
			// console.warn("TODO load data");
			for(var i = start; i <= end; i = i + mCacheDurationGrid){
				var c = mCacheRecords[i];
				if(!c || (c && c.status == -1)){
					_loadRecordsPortion(i);
				}
			}
		}
	}
*/
/*
	function _isDifferentTimelinePeriods(data1, data2) {
		if (data1.length == 0 && data2.length == 0) {
			return false;
		}
		// check the data
		for (var i1 = 0; i1 < data1.length; i1++) {
			var p1 = data1[i1];
			var bFound = false;
			for (var i2 = 0; i2 < data2.length; i2++) {
				var p2 = data2[i2];
				if (p1.start == p2.start && p1.end == p2.end) {
					bFound = true;
				}
			}
			if (!bFound) {
				return true;
			}
		}
		// check the data
		for (var i2 = 0; i2 < data2.length; i2++) {
			var p2 = data2[i2];
			var bFound = false;
			for (var i1 = 0; i1 < data1.length; i1++) {
				var p1 = data1[i1];
				if (p1.start == p2.start && p1.end == p2.end) {
					bFound = true;
				}
			}
			if (!bFound) {
				return true;
			}
		}
		return false;
	}
*/
/*
	function _reloadData(i) {
		mSource.getTimeline(i, i + mCacheDurationGrid).done(function(timeline){
			if (_isDifferentTimelinePeriods(mCacheRecords[i].data, timeline.periods)) {
				mCacheRecords[i].data = timeline.periods;
				_updatedRecords();
			}
		})
	}
*/
/*
	function _reloadRangeData() {
		console.log("_reloadRangeData");
		var start = _normalizeT(mRangeMin);
		var end = _normalizeT(mRangeMax) + mCacheDurationGrid;
		if (mSource != null) {
			for(var i = start; i <= end; i = i + mCacheDurationGrid){
				var c = mCacheRecords[i];
				if (c && c.status == 1) {
					_reloadData(i);
				}
			}
		}
	}
*/
/*
	function _stopPolingRangeData() {
		console.log("_stopPolingRangeData");
		clearInterval(mPolingRangeDataInterval);
	}
*/
/*
	function _startPolingRangeData() {
		_stopPolingRangeData();
		// console.log("_startPolingRangeData ", mRangePolingDataEveryInSec);
		if (mRangePolingDataEveryInSec != null && self.isRange()) {
			// console.log("_startPolingRangeData start");
			mPolingRangeDataInterval = setInterval(function () {
				if (mSource != null) {
					_reloadRangeData();
				}
			}, mRangePolingDataEveryInSec*1000);
		}
	}
*/
/*
	self.reloadRangeData = function() {
		_reloadRangeData();
	}
*/
/*
	function _disposeTimeline(){
		console.warn("_disposeTimeline");
		mPolingDataMax = 0;
		mCacheRecords = {};
		mElementData.innerHTML = "";
		_stopPolingCursor();
		_stopPolingData();
		_stopPolingRangeData();
		if (mCalendar != null) {
			mCalendar.dispose();
		}
	}
*/

	function _changedSource(){
		console.warn("_changedSource");

		if(mPlayer != null){
			mSource = mPlayer.getSource();
			if(mSource){
				if (mUseTimezone) {
					mTimezoneOffset = CloudHelpers.getOffsetTimezone(mUseTimezone);
				} else {
					mTimezoneOffset = CloudHelpers.getOffsetTimezone(mSource.getTimezone());
				}				
				
				if (mCalendar != null) {
					mCalendar.setSource(mSource);
				}
			}
		}

		if(parent != null){
			_startPolingCursor();
		}
	}

	function _playerEvent(evnt, args){
		console.warn("_playerEvent ", evnt);
		if(evnt.name == "SOURCE_CHANGED"){
			_changedSource();
		}else if(evnt.name == "POSITION_JUMPED"){
			console.warn("POSITION_JUMPED", mPlayer)
			mCursorPosition = args.new_pos;
			//_updateCursorPosition({sender: "pos jumped"});
			//self.moveToPosition(args.new_pos);

		} else if (evnt.name == 'STOPED' ){
			console.log("Timeline catch event: Player stoped " + args );
			//_stopPolingData();
		} else if (evnt.name == 'PLAYED') {
			console.log("Timeline catch event: Player played " + args);
			//if (!mIntervalPolingData){
			//	_startPolingData();
			//}
		}
	}

/*
	function _recalculateDataPaddings(){
		mLeftDataPadding = 0;
		if(mLeftArrow.style.display != "none"){
			mLeftDataPadding += 80;
		}
		// if(mElementCalendar.style.display != "none"){
		// 	mLeftDataPadding += 40;
		// }
		mRightDataPadding = 0;
		if(mRightArrow.style.display != "none"){
			mRightDataPadding += 80;
		}
		// if(mElementGotoLive.style.display != "none"){
		// 	mRightDataPadding += 40;
		// }
		if(mLeftDataPadding == 0){
			mLeftDataPadding = 80
		}
		if(mRightDataPadding == 0){
			mRightDataPadding = 80;
		}

		mElementContent.style.width = "calc(100% - " + (mLeftDataPadding + mRightDataPadding) + "px)";
		mElementContent.style.left = mLeftDataPadding + "px";
		mElementData.style.width = "calc(100% - " + (mLeftDataPadding + mRightDataPadding) + "px)";
		mElementData.style.left = mLeftDataPadding + "px";
		mElementScale.style.width = "calc(100% - " + (mLeftDataPadding + mRightDataPadding) + "px)";
		mElementScale.style.left = mLeftDataPadding + "px";
	}
*/

	self.hideCalendarButton = function(){
		if(mElementCalendar.style.display != "none"){
			mElementCalendar.style.display = "none";
		}
//		_recalculateDataPaddings();
//		self.redrawTimeline();
	}


	self.showCalendarButton = function(){
		if(mElementCalendar.style.display == "none"){
			mElementCalendar.style.display = "";
		}
//		_recalculateDataPaddings();
//		self.redrawTimeline();
	}

/*
	self.hideArrowsButtons = function(){
		if(mLeftArrow.style.display != "none"){
			mLeftArrow.style.display = "none";
		}

		if(mRightArrow.style.display != "none"){
			mRightArrow.style.display = "none";
		}
		_recalculateDataPaddings();

		self.redrawTimeline();
	};
*/
/*
	self.showArrowsButtons = function(){
		if(mLeftArrow.style.display == "none"){
			mLeftArrow.style.display = "";
		}
		if(mRightArrow.style.display == "none"){
			mRightArrow.style.display = "";
		}
		_recalculateDataPaddings();
		self.redrawTimeline();
	}
*/
/*
	self.hideShiftButtons = function(){
		if(mShiftMinus.style.display != "none"){
			mShiftMinus.style.display = "none";
		}

		if(mShiftPlus.style.display != "none"){
			mShiftPlus.style.display = "none";
		}
		_recalculateDataPaddings();

		self.redrawTimeline();
	};
*/
/*
	self.showShiftButtons = function(){
		if(mShiftMinus.style.display == "none"){
			mShiftMinus.style.display = "";
		}
		if(mShiftPlus.style.display == "none"){
			mShiftPlus.style.display = "";
		}
		_recalculateDataPaddings();
		self.redrawTimeline();
	}
*/
	self.hideGotoLiveButton = function(){
		if(mElementGotoLive.style.display != "none"){
			mElementGotoLive.style.display = "none";
		}
		//_recalculateDataPaddings();
		//self.redrawTimeline();
	}

	self.showGotoLiveButton = function(){
		if(mElementGotoLive.style.display == "none"){
			mElementGotoLive.style.display = "";
		}
		//_recalculateDataPaddings();
		//self.redrawTimeline();
	}

	self.setPlayer = function(player){
		//_disposeTimeline();

		if (mPlayer) {
			mPlayer.removeCallback(mViewID);
		}
		if (player) {
			mPlayer = player;
			_initCalendar();
			//_changedSource();
			mPlayer.addCallback(mViewID, _playerEvent);

			mPlayer.setFullscreenCallback (function(){
				console.warn("fullscreenCallback");
			//	self.redrawTimeline();
			});
		} else {
			mPlayer = null;
			//_changedSource();
		}
	}
/*
	self.setRange = function(startPos,endPos){
		console.warn("[TIMELINE] setRange todo");
		mRangeMin = startPos;
		mRangeMax = endPos;
		mRangeMin_Normalize = _normalizeT(startPos);
		mRangeMax_Normalize = _normalizeT(endPos) + mCacheDurationGrid;

		timeline_range_or_not.classList.add("range");
		//self.elem.classList.add("range");
		_updateScale();
		var range_len = mRangeMax - mRangeMin;
		var start_t = mRangeMin;
		var end_t = mRangeMax;

		if (range_len <= mRangeLenModeMs) {
			self.hideArrowsButtons();
			self.hideShiftButtons();
			mDefaultMode.len_ms = range_len;
			self.left_border = Math.floor(start_t);
			self.right_border = Math.floor(end_t);
		} else {
			end_t = mRangeMin + mRangeLenModeMs;
			mDefaultMode.len_ms = mRangeLenModeMs;

			// correct if current time
			var t = CloudHelpers.getCurrentTimeUTC();
			if(t < mRangeMax && t > mRangeMin){
				if(t > end_t){
					end_t = t + Math.floor(mRangeLenModeMs/2);
					if(end_t > mRangeMax){
						end_t = mRangeMax;
					}
					start_t = end_t - mRangeLenModeMs;
				}
			}
			self.left_border = Math.floor(start_t);
			self.right_border = Math.floor(end_t);
		}

		// self.animationTo(start_t, end_t, newmode);
		self.redrawTimeline({sender: "animation"});
	}
*/
/*
	self.isRange = function(){
		return mRangeMin != -1 && mRangeMax != -1;
	}
*/
/*
	self.resetRange = function(){
		console.warn("[TIMELINE] resetRange");
		mRangeMin = -1;
		mRangeMax = -1;
		timeline_range_or_not.classList.remove("range");
		//self.elem.classList.remove("range");
		self.showArrowsButtons();
		self.showShiftButtons();
		_updateScale();
	}
*/
/*
	self.months = ['Jan','Feb','Mar','Apr','May','Jun', 'Jul', 'Aug', 'Spt', 'Oct', 'Nov', 'Dec'];
	self.dateFormat = function(t, bMonth, bAmPm){
		var str = "";
		if(self.isRange()){
			var t = Math.floor((t - mRangeMin)/1000);
			var nSeconds = t % 60;
			t = (t - nSeconds) / 60;
			var nMinutes = t % 60;
			var nHours = (t - nMinutes) / 60;
			var str = ("00" + nHours).slice(-2) + ":"
				+ ("00" + nMinutes).slice(-2);
		}else{
			var d = new Date();
			d.setTime(t + mTimezoneOffset);
			var hours = d.getUTCHours()
			var suffix = '';
			if (bAmPm) {
				suffix = hours>=12 ? ' pm' : ' am';
				hours = hours==0 ? 12 : (hours>12 ? hours-12 : hours);
			}

			var str = ("00" + hours).slice(-2) + ":"
				+ ("00" + d.getUTCMinutes()).slice(-2);
			str += suffix;
			if(bMonth){
				str += " (" + d.getUTCDate() + " " + self.months[d.getUTCMonth()] + ")";
			}
		}
		return str;
	}
*/
/*
	self._eventRedrawTimeline = function(){
		setTimeout(self.redrawTimeline,10);
	}
	self.redrawTimeline = function(opt){
		// console.log("redrawTimeline");
		opt = opt || {};
		if(mTimelineDrawing) {
			console.warn("redrawTimeline busy");
			return;
		}
		mTimelineDrawing = true;
		_updateScale();

		var left_border_short = Math.floor(self.left_border / mDefaultMode.step_short);
		var right_border_short = Math.floor(self.right_border / mDefaultMode.step_short) + 1;

		// left and right arrows
		if(self.isRange()){
			if(self.left_border <= mRangeMin){
				mLeftArrow.classList.add("disabled");
			}else{
				mLeftArrow.classList.remove("disabled");
			}

			if(self.right_border >= mRangeMax){
				mRightArrow.classList.add("disabled");
			}else{
				mRightArrow.classList.remove("disabled");
			}
		}

		// mElementData.innerHTML = '';
		mElementScale.innerHTML = '<vtext id="texttimelinetest"><vtext>';
		var test_text = document.getElementById('texttimelinetest');
		if (!test_text) {
		    return;
		}
		test_text.innerHTML = self.dateFormat(self.left_border, false, self.options.timelineampm===true);
		var textWidth = test_text.clientWidth;
		test_text.innerHTML = self.dateFormat(self.left_border, true, self.options.timelineampm===true);
		var textWidthWithMonth = test_text.clientWidth;

		// correct step long (if text was biggest)
		var step_long = mDefaultMode.step_long;
		while((textWidth)*mDistSec > step_long){
			step_long += mDefaultMode.step_long;
		};

		var nTextWithMonth = step_long*2;

		mElementScale.innerHTML += '<hline></hline>';
		for(var i = left_border_short; i < right_border_short; i++){
			var t = i*mDefaultMode.step_short;
			var pos = _calcPosition(t);
			if(t % mDefaultMode.step_long == 0){
				var bTextWithMonth = t % nTextWithMonth == 0;
				var tw = (bTextWithMonth ? textWidthWithMonth : textWidth);
				var tpos = pos - tw/2;

				mElementScale.innerHTML += '<vline style="left: ' + pos + 'px"></vline>';

				if(t % step_long == 0){
					mElementScale.innerHTML += '<vtext style="left: ' + tpos + 'px">' + self.dateFormat(t,bTextWithMonth, self.options.timelineampm===true) + '</vtext>';
				}
			}else{
				mElementScale.innerHTML += '<vline style="left: ' + pos + 'px"></vline>';
			}
		}

		// mElementData.innerHTML = '';
		_updateCursorPosition(opt);
		if(mSource != null){
			if(_isLoadedData(self.left_border, self.right_border)){
				_updatedRecords();
			}else{

				if(self.isRange()){
					if(self.left_border < mRangeMin_Normalize || self.right_border > mRangeMax_Normalize){
						// console.log("skip");
						mTimelineDrawing = false;
						return;
					}
				}
				// console.log("don't skip");
				_loadData(self.left_border, self.right_border);
			}
		}
		mTimelineDrawing = false;
	}
	self.redrawTimeline();
*/
/*
	self.onTimeLineResize = function() {
//		console.warn("resize "  + document.webkitIsFullScreen);
		self.redrawTimeline();
	}

	window.addEventListener("resize", self.onTimeLineResize);
*/
/*
	self.animationTo = function(l,r, mode_new){
		// console.log("animationTo");
		mAnimationToProgress = true;
		mode_new = mode_new || mDefaultMode;
		// TODO lock timeline
		var steps = 25; // for ~1 sec
		var len_left = l - self.left_border;
		var len_right = r - self.right_border;
		if(len_left == 0 && len_right == 0){
			console.warn("Already in current position");
			self.redrawTimeline({sender: "animation"});
			mAnimationToProgress = false;
			return;
		}
		var len_step_short = mode_new.step_short - mDefaultMode.step_short;
		var len_step_long = mode_new.step_long - mDefaultMode.step_long;
		var bChangedSteps = (len_step_short != 0 && len_step_long != 0);
		var lb = self.left_border;
		var rb = self.right_border;
		var st = [];
		var p = 3.14/steps;
		var sum = 0;
		for(var i = 0; i < steps; i++){
			var k = Math.sin(i*p);
			sum += k;
			st.push({k: k});
		}
		var step_sl = len_left/sum;
		var step_sr = len_right/sum;
		var short_s = len_step_short/sum;
		var long_s = len_step_long/sum;

		// init first value
		var k0 = st[0].k;
		st[0].left = self.left_border + k0 * step_sl;
		st[0].right = self.right_border + k0 * step_sr;
		if(bChangedSteps){
			st[0].step_short = mDefaultMode.step_short + k0 * short_s;
			st[0].step_long = mDefaultMode.step_long + k0 * long_s;
		}

		for(var i = 1; i < steps; i++){
			var k = st[i].k;
			st[i].left = st[i-1].left + k*step_sl;
			st[i].right = st[i-1].right +  k*step_sr;
			if(bChangedSteps){
				st[i].step_short = st[i-1].step_short + k * short_s;
				st[i].step_long = st[i-1].step_short + k * long_s;
			}
		}
		// correction last value
		st[steps - 1].left = l;
		st[steps - 1].right = r;

		var counter = 0;
		function anumation_timeline_(){
			self.left_border = Math.floor(st[counter].left);
			self.right_border = Math.floor(st[counter].right);

			if(bChangedSteps){
				mDefaultMode.step_short = Math.floor(st[counter].step_short);
				mDefaultMode.step_long = Math.floor(st[counter].step_long);
			}
			// _updateScale();
			self.redrawTimeline({sender: "animation"});
			counter++;
			if(counter < steps){
				setTimeout(anumation_timeline_, 10);
			}else{
				if(bChangedSteps){
					mDefaultMode = clone(mode_new);
				}
				self.left_border = l;
				self.right_border = r;
				self.redrawTimeline({sender: "animation"});
				mAnimationToProgress = false;
			}
		}
		setTimeout(anumation_timeline_, 15);
	}
*/
/*
	self.fixBorderLimit = function(left_b,right_b){
		var res = {};
		res.left = left_b;
		res.right = right_b;

		if(self.isRange()){
			if(res.right > mRangeMax){
				res.right = mRangeMax;
				res.left = res.right - mDefaultMode.len_ms;
			}
			if(res.left < mRangeMin){
				res.left = mRangeMin;
				res.right = res.left + mDefaultMode.len_ms;
			}
		}else{
			var max = CloudHelpers.getCurrentTimeUTC() + mDefaultMode.len_ms/2;
			if(res.right > max){
				var d = res.right - max;
				res.left = res.left - d;
				res.right = res.right - d;
			}
		}
		return res;
	}
*/
/*
	self.moveToRight = function(){
		var diff = self.right_border - self.left_border;
		diff = Math.floor(0.75*diff);
		var l = self.left_border + diff;
		var r = self.right_border + diff;
		var f = self.fixBorderLimit(l,r);
		self.animationTo(f.left,f.right);
	}
	mRightArrow.onclick = self.moveToRight;
*/
/*
	self.moveToLeft = function(){
		var diff = self.right_border - self.left_border;
		diff = Math.floor(0.75*diff);
		var l = self.left_border - diff;
		var r = self.right_border - diff;
		var f = self.fixBorderLimit(l,r);
		self.animationTo(f.left,f.right);
	}
	mLeftArrow.onclick = self.moveToLeft;
*/
/*
	self.moveToPosition = function(t){
		console.log("moveToPosition");
		var diff2 = Math.floor((self.right_border - self.left_border)/2);
		var newLeft = t - diff2;
		var newRight = t + diff2;
		if(self.isRange()){
			if(newLeft < mRangeMin || newRight > mRangeMax){
				console.error("Can not move beyond range")
				return;
			}
		}
		self.animationTo(newLeft, newRight);
	}
*/
/*
	self.mousedown = function(event){
		if(!mStartMove){
			// console.log("mousedown", event);
			mFirstMoveX = event.offsetX;
			mLastMoveX =  event.offsetX;
			mStartMove = true;
			mElementContent.style.cursor = "move";
			try{
				if (window.getSelection) {
					window.getSelection().removeAllRanges();
				} else if (document.selection) {
					document.selection.empty();
				}
			}catch(e){
				console.error(e)
			}

		}
	}
*/
/*
	self.mousemove = function(event){
		if(mStartMove && !self.isRange()){
			// console.log("mousemove", event);
			var nDiff = event.offsetX - mLastMoveX;
			if(event.movementX !== undefined){ // not supported in safari & ie
				nDiff = event.movementX;
			}
			if(nDiff != 0){
				var diff_t = Math.floor(nDiff*mDistSec);
				mLastMoveX += nDiff;
				var f = self.fixBorderLimit(self.left_border - diff_t, self.right_border - diff_t);
				self.left_border = f.left;
				self.right_border = f.right;
				self.redrawTimeline({sender: "mousemove"});
			}
		}
	}
*/
/*
	self.mouseup = function(event){
		if(mStartMove){
			// console.log("mouseup", event);
			mElementContent.style.cursor = "default";
			mStartMove = false;
		}
	}
*/
/*
	self.mouseout = function(event){
		if(mStartMove){
			// console.log("mouseout", event);
			if(event.relatedTarget && event.relatedTarget.nodeName == "CRECT"
		      || event.target && event.target.nodeName == "CRECT"){
				return; // skip
			}

			if(event.relatedTarget && event.relatedTarget.className == "cloudcameratimeline-cursor"
				|| event.target && event.target.className == "cloudcameratimeline-cursor"){
				return; // skip
			}

			mElementContent.style.cursor = "default";
			mStartMove = false;
		}
	}
*/
/*
	mElementContent.addEventListener('mousedown', self.mousedown);
	mElementContent.addEventListener('mousemove', self.mousemove);
	mElementContent.addEventListener('mouseup', self.mouseup);
	mElementContent.addEventListener('mouseout', self.mouseout);
*/
/*
	function _clickOnData(event){
		if (mPlayer == null) {
			console.log("[CloudCameraTimeline] player is null");
			return;
		}

		if (mSource == null) {
			console.log("[CloudCameraTimeline] source is null");
			return;
		}

		if(mFirstMoveX == mLastMoveX){
			var rect = event.currentTarget.getBoundingClientRect();
			var offsetX = event.clientX - rect.left;
			var t = Math.floor(offsetX*mDistSec);
			t = t + self.left_border;
			if(t >= CloudHelpers.getCurrentTimeUTC() && mPlayer){
				mCursorPosition = CloudHelpers.getCurrentTimeUTC();
				_updateCursorPosition({sender: "click"});
				mPlayer.stop("by_timeline_1");
				mPlayer.setPosition(CloudPlayer.POSITION_LIVE);
				mPlayer.play();
				mCallbacks.executeCallbacks(CloudPlayerEvent.USER_CLICKED_ON_TIMELINE, {pos: CloudPlayer.POSITION_LIVE});
			} else if(t && mPlayer){
				mCursorPosition = t;
				_updateCursorPosition({sender: "click"});
				mPlayer.stop("by_timeline_2");
				mPlayer.setPosition(t);
				mPlayer.play();
				mCallbacks.executeCallbacks(CloudPlayerEvent.USER_CLICKED_ON_TIMELINE, {pos: t});
			}else{
				_updateCursorPosition({sender: "click"});
			}
		}
	}
	mElementData.onclick = _clickOnData;
*/
/*
	self.setMode = function(mode){
		var mode_new = null;
		if(mModes[mode.name]){
			mode_new = mModes[mode.name];
		}else{
			console.error('Unknown timeline mode')
			return -1;
		}
		var _center = (self.right_border - self.left_border)/2 + self.left_border;
		var mode_new_copy = clone(mode_new);
		var diff = mode_new.len_ms / 2;
		self.animationTo(_center - diff, _center + diff, mode_new_copy);
		return 0;
	}
*/
/*
	self.getMode = function(){
		return mDefaultMode;
	}
*/
/*
	self.destroy = function() {
            window.removeEventListener("resize", self.onTimeLineResize);
	    if(self.elem && (self.elem.tagName === 'DIV')) {
		while (self.elem.firstChild) {
			self.elem.removeChild(self.elem.firstChild);
		}
	    }
	    clearInterval(mIntervalPolingData);
	}
*/

	// apply options
/*
	if(options["arrows"] !== undefined){
		if(options["arrows"] == true){
			self.showArrowsButtons();
		}else{
			self.hideArrowsButtons();
		}
	}
*/
	if(options["gotoLive"] !== undefined){
		if(options["gotoLive"] == true){
			self.showGotoLiveButton();
		}else{
			self.hideGotoLiveButton();
		}
	}
/*
	if(options["range"] !== undefined){
		var rangeMin = options["range"]["min"];
		var rangeMax = options["range"]["max"];
		self.setRange(rangeMin, rangeMax);
	}
*/

	if(mOptionCalendar){
		self.showCalendarButton();
	}else{
		self.hideCalendarButton();
	}

	console.log("options: ", options);
};

// init base options of sdk
window.CloudSDK = window.CloudSDK || {};

// Automaticlly generated
CloudSDK.version = '3.3.19';
CloudSDK.datebuild = '240226';
console.log('CloudSDK.version='+CloudSDK.version + '_' + CloudSDK.datebuild);

window.CloudPlayerList = function(timelineId, o) {
	var self = this;
	self.playerList = null;
	self.options = o || {};
	self.timeline = null;
	self.fullPlayer = null;
	self.killSync = false;
	
	self.synchronize = function(prevStopArr = [], first = true) {
		var stopArr = [];
		if (first && self.playerList) self.joinedTimeline();
		var playing = self.playerList.filter(p => p.mCameraID != null);
		if (playing) {
			var allTimes = playing.map(t => ({"id": t.playerElementID, "time": t.getPosition()}));
			var ts = allTimes.map(t => t.time);
			var timeDiff = Math.max(...ts) - Math.min(...ts) <= 1500 ? false : true;
			if (timeDiff) {
				var minTime = Math.min(...ts);
				playing.forEach(p => {
					var timeObj = allTimes.find(t => t.id == p.playerElementID);
					var currTime = timeObj.time;
					if(currTime - minTime > 1500) {
						if (!prevStopArr.some(s => s.playerElementID == p.playerElementID)) {
							if (self.killSync) return;
							var i = self.playerList.indexOf(p);
							self.playerList[i].pause();
						}
						stopArr.push(p); 
					} else {
						if (prevStopArr.some(s => s.playerElementID == p.playerElementID)) {
							if (self.killSync) return;
							var i = self.playerList.indexOf(p);
							self.playerList[i].play();
						}
					}
				})
			} else {
				if (self.killSync) return;
				prevStopArr.forEach(p => {
					p.play();
				})
			}
			setTimeout(function() {if (!self.killSync) return self.synchronize(stopArr, false)}, 500);
			
		} else {
			setTimeout(function() {if (!self.killSync) return self.synchronize([], true)}, 500);
		} 
	}

	self.joinedTimeline = function() {
		if (self.playerList.find(p => p.player.elid == self.fullPlayer.elid).mCameraID == null) {
			var anyPlaying = self.playerList.filter(p => p.mCameraID != null);
			if (anyPlaying) {
				self.fullPlayer = anyPlaying[0].player;
				self.timeline.assignNewPrimary(anyPlaying[0], self.playerList);
			}
		}
		self.timeline.setPlayer(self.fullPlayer, self.playerList);
		self.fullPlayer.calendar = self.timeline.calendar;
		self.timeline._initTimeline(self.playerList);
	}

	self.addPlayerToList = function(newPlayer) {
		if(self.timeline == null && self.options.timeline){
			self.options.joinedTimeline = true;
			self.timeline = new JoinedTimelineView(timelineId, newPlayer, self.options);
			self.fullPlayer = newPlayer.player;
		}
				
		if (self.playerList == null) {
			self.playerList = [newPlayer];
		} else if (!self.playerList.some(p => p.playerElementID == newPlayer.playerElementID)) {
			self.playerList.push(newPlayer);
		} else if (self.playerList.find(p => p.player.elid == self.fullPlayer.elid).mCameraID == null) {
			self.fullPlayer = newPlayer.player;
			self.timeline.assignNewPrimary(newPlayer, self.playerList);
		}

		return self.playerList;
	}

	self.removePlayerFromList = function(player) {
		var index = self.playerList.indexOf(player);
		if (index != -1) {
			self.playerList.splice(index, 1);
		} 
		var playing = self.playerList.filter(p => p.mCameraID != null);
		if (player.player.elid == self.fullPlayer.elid && playing.length != 0) {
			self.fullPlayer = playing[0].player;
			self.timeline.assignNewPrimary(playing[0], self.playerList);
		}
	}

	self.updatePlayerCamera = function(updatedPlayer) {
		var oldPlayer = self.playerList.findIndex(p => p.playerElementID == updatedPlayer.playerElementID);
		if (oldPlayer != -1) {
			self.playerList[oldPlayer].mCameraID = updatedPlayer.mCameraID;
		}
	}

	self.getPlayerList = function() {
		return self.playerList;
	}

	self.killSyncPromise = function(kill) {
		return new Promise((resolve, reject) => { self.killSync = kill; return resolve(true); });
	}
}
window.JoinedTimelineView = function (viewid, playersdk, options) {
	var self = this;
	options = self.options = options || {};
	var playerList = null;
	var primaryPlayer = null;
	var primaryPlayerSDK = playersdk;
	var mViewID = viewid;

	var mSource = null;
	var mTimezoneOffset = 0;
	var mConn = null;

	// cache by every 3 hours
	var mCacheDurationGrid = 10800000;
	var mCacheRecords = {};
	var mCursorPosition = 0;
	var mTimelineDrawing = false;
	var mContainerWidth = 0;
	var mDistPx = 0;
	var mDistSec = 0;
	var mIntervalPolingData = null;
	var mPolingDataMax = 0;
	var mRangeMin = -1;
	var mRangeMax = -1;
	var mNavArrowsHided = false;
	var mStartMove = false;
	var mFirstMoveX = 0;
	var mLastMoveX = 0;
	var mAnimationToProgress = false;
	var mLeftDataPadding = 0;
	var mRightDataPadding = 0;
	var mOptionCalendar = false;
	var mUseTimezone = null;
	var mRangePolingDataEveryInSec = null;
	var mPolingRangeDataInterval = null;
	var mCallbacks = CloudHelpers.createCallbacks();
	var el_timeline_container	= null;
	var el_calendar_container 	= null;
	var el_live_container		= null;
	var el_vxgcloudplayer 		= null;
	var el_timelinepicker		= null;
	var timeline_range_or_not	= null;
	var mNoUpdateTimeline		= false;

	if (options.useTimezone) {
		mUseTimezone = options.useTimezone;
		console.warn("[CloudTimeline] useTimezone: " + mUseTimezone);
	}

	if(options.calendar !== undefined){
		mOptionCalendar = options.calendar == true;
	}

	if(options["polingRangeDataEveryInSec"] !== undefined) {
		mRangePolingDataEveryInSec = parseInt(options["polingRangeDataEveryInSec"]);
	}

	function clone(obj) {
		if (null == obj || "object" != typeof obj) return obj;
		var copy = obj.constructor();
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
		}
		return copy;
	}

	var mModes = {};
	mModes["HOURS_12_MODE"] = {
		len_ms: 9*60*60*1000, // 9 hours
		step_short: 30*60*1000, // 30 minutes
		step_long: 150*60*1000 // 2 hours and 30 minutes
	};
	mModes["HOUR_MODE"] = {
		len_ms: 90*60*1000, // 1 hour and 30 minutes
		step_short: 5*60*1000, // 5 minutes
		step_long: 30*60*1000 // 30 minutes
	};
	mModes["MINUTES_MODE"] = {
		len_ms: 15*60*1000,  // 15 minutes
		step_short: 1*60*1000,  // 1 minute
		step_long: 5*60*1000  // 5 minutes
	};
	var mRangeLenModeMs = 3*60*60*1000 + 60*1000; // 3 hours

	var mDefaultMode = clone(mModes["MINUTES_MODE"]);


//	el_timeline_container	= document.getElementsByClassName('cloudplayer-timeline-container')[0];
//	el_calendar_container 	= document.getElementsByClassName('cloudplayer-calendar-container')[0];
//	el_live_container		= document.getElementsByClassName('cloudplayer-live-container')[0];
//	el_vxgcloudplayer		= document.getElementsByClassName('cloudplayer-vxgcloudplayer')[0];

	el_timeline_container	= document.getElementById(mViewID).getElementsByClassName('cloudplayer-timeline-container')[0];
	el_calendar_container 	= document.getElementById(mViewID).getElementsByClassName('cloudplayer-calendar-container')[0];
	el_live_container		= document.getElementById(mViewID).getElementsByClassName('cloudplayer-live-container')[0];
	el_vxgcloudplayer		= primaryPlayerSDK.element.getElementsByClassName('cloudplayer-vxgcloudplayer')[0];


	var timeline_target = document.createElement("div");
	timeline_target.classList.add("cloudcameratimeline");
	timeline_target.classList.add("green");
	timeline_target.classList.add("black");

	timeline_target.innerHTML = ''
	+ '<div class="cloudcameratimeline-calendar single-timeline" style="display: none" id="single-timeline-calendar-toggle"></div>'
	+ '<div class="cloudplayer-pause single-timeline"></div>'
	+ '<div class="cloudcameratimeline-goto-live single-timeline disabled">Live</div>'
	+ '<div class="cloudcameratimeline-shift shift-minus">-1h</div>'
	+ '<div class="cloudcameratimeline-left"></div>'
	+ '<div class="timeline-container" style="width:85%;height:35px;">'
	+ '<div id="' + viewid +'_timeline" class="ktimepicker-container" style="color:white;background:rgba(0,0,0,0);width:100%;height:36px;bottom:5px;left:75px;"></div>'
	+ '</div>'
	+ '<div class="cloudcameratimeline-right single-timeline"></div>'
	+ '<div class="cloudcameratimeline-shift shift-plus single-timeline">+1h</div>'
	+ '';

	var mElementContent = timeline_target.getElementsByClassName('cloudcameratimeline-content')[0];
	var mElementData = timeline_target.getElementsByClassName('cloudcameratimeline-data')[0];
	var mElementPlayPause = timeline_target.getElementsByClassName('cloudplayer-pause')[0];
	var mElementCalendar = timeline_target.getElementsByClassName('cloudcameratimeline-calendar')[0];
	var mElementCursor = timeline_target.getElementsByClassName('cloudcameratimeline-cursor')[0];
	var mElementScale = timeline_target.getElementsByClassName('cloudcameratimeline-scale')[0];
	var mElementGotoLive = timeline_target.getElementsByClassName('cloudcameratimeline-goto-live')[0];
	var mLeftArrow = timeline_target.getElementsByClassName('cloudcameratimeline-left')[0];
	var mRightArrow = timeline_target.getElementsByClassName('cloudcameratimeline-right')[0];
	var mShiftMinus = timeline_target.getElementsByClassName('shift-minus')[0];
	var mShiftPlus = timeline_target.getElementsByClassName('shift-plus')[0];

	el_calendar_container.appendChild(mElementCalendar);
	el_calendar_container.appendChild(mElementPlayPause);
	el_calendar_container.appendChild(mElementGotoLive);

    el_timeline_container.appendChild(timeline_target);

	el_vxgcloudplayer.setAttribute('timelineselector', '#' + viewid +'_timeline');

	var mCalendar = null;

	var obs  = null;
	var targetNode = el_timeline_container.getElementsByClassName("ktimepicker-container")[0];
	var observe_config = { childList: true };
	var observe_callback = function(mutationsList) {
		console.log("observe_callback");
		for(var mutation of mutationsList) {
		if (mutation.type == 'childList') {
			console.log('A child node has been added or removed.');
			el_timelinepicker = el_timeline_container.getElementsByTagName('k-timeline-picker')[0];
			if (el_timelinepicker) {
				el_timelinepicker.addEventListener("change", function(event){
					if (primaryPlayer === undefined || primaryPlayer == null) {
						return;
					}
					mNoUpdateTimeline = true;
					var  centertime = Number(el_timelinepicker.getAttribute('centerutctime'));

					var player_position = primaryPlayer.getPosition();
					// TODO_el: setPosition for all the sources 
					if (centertime > Date.now()) {
						var isLive = primaryPlayer.isLive();
						if (!isLive) {
							playerList.forEach(p => {
								p.setPosition(CloudHelpers.POSITION_LIVE);
								p.play('timepicker');
							})
						}
					} else {
						if (player_position != centertime) {
							playerList.forEach(p => {
								if (p.player.mSrc) {
									p.player.setPosition(centertime);
									p.player.play('timepicker');
								}
							})
							mElementPlayPause.classList.add('play');
						}
					}
					mNoUpdateTimeline = false;
				});
				obs.disconnect();
			}
		}
		}
	};
	var observer = new MutationObserver(observe_callback);
	obs = observer;
	observer.observe(targetNode, observe_config);

	self._initTimeline = function(players) {
		playerList = players;
		_changedSource();
	}

	self.assignNewPrimary = function(playerSDK, playerList) {
		var prev_primary = primaryPlayerSDK;
		var prev_vxgcloudplayer = prev_primary.element.getElementsByClassName('cloudplayer-vxgcloudplayer')[0];
		prev_vxgcloudplayer.setAttribute('timelineselector', '#');

		primaryPlayerSDK = playerSDK;
		el_vxgcloudplayer = primaryPlayerSDK.element.getElementsByClassName('cloudplayer-vxgcloudplayer')[0];
		el_vxgcloudplayer.setAttribute('timelineselector', '#' + mViewID +'_timeline');
		var ktimepicker = el_vxgcloudplayer.shadowRoot.querySelector("k-control-timepicker").shadowRoot.querySelector("k-timeline-picker");
		if (ktimepicker) ktimepicker.remove();

		var prev_picker = el_vxgcloudplayer.shadowRoot.querySelector("k-control-timepicker");
		var kpicker = document.getElementById(mViewID + "_timeline").querySelector("k-timeline-picker");

		prev_picker.picker = kpicker;

		prev_picker.picker.addEventListener("moving", function(e){
			prev_picker.early_playing = prev_picker.player.isPlaying();
			prev_picker.player.pause().catch(function(){});
		},{once:false});

		prev_picker.player.addEventListener("timeupdate", function(e){
			if (prev_picker.skip_next_timeupdate){
				delete prev_picker.skip_next_timeupdate;
				return;
			}
			if (!e.detail.currentUtcTime) return;
			if (e.detail.currentUtcTime < new Date('Jan 1 2000 0:00:00').getTime()){
				debugger;
				return;
			}
			prev_picker.picker.setAttribute('centerutctime',e.detail.currentUtcTime);
		},{once:false});
		prev_picker.picker.addEventListener("change", function(e){
			clearTimeout(prev_picker.change_time_timer);
			prev_picker.change_time_timer = setTimeout(function(){
				let time = parseInt(prev_picker.picker.getAttribute('centerutctime'));
				prev_picker.player.pause();
				prev_picker.player.currentUtcTime = time;
				prev_picker.skip_next_timeupdate=true;
				prev_picker.player.sendTimeUpdate();

				let step = parseInt(prev_picker.picker.getAttribute('step'));
				if (!isNaN(step))
					prev_picker.player.player.storage.posters_cache.autoPreload(time, step);
			},10);
		},{once:false});

		prev_picker.picker.addEventListener("getrange", function(e){
			prev_picker.range = prev_picker.player.player.rangeRequest(e.detail.time_from, e.detail.time_to, e.detail.from_out?5000:0);
			e.detail.ranges = prev_picker.range!==undefined ? prev_picker.range : {times:[],durations:[]};
		});

		self.setPlayer(playerSDK.player, playerList);
		self._initTimeline(playerList)
	}

	function _initCalendar() {
		if (primaryPlayer == null) {
			console.error("[TIMELINE] player is null") ;
			return;
		}

		if (mOptionCalendar) {
			var timelineCalendar = document.getElementById("single-timeline-calendar");
			mCalendar = new CloudCameraCalendarView(timelineCalendar, options);
			mCalendar.onChangeDate = function(t, e) {
				if (primaryPlayer == null) {
					console.error("[TIMELINE] player is null") ;
					return;
				}
				playerList.forEach(p => {
					p.setPosition(t);
					p.play(e);
				})
			};
			self.calendar = mCalendar;
		}
	}

	mElementCalendar.onclick = function() {
		if (mCalendar != null) {
			console.log(primaryPlayer);
			primaryPlayer.player.classList.remove('showing-settings', 'showing-zoom');
			mCalendar.toggleCalendar(mElementCalendar);
		}
	}

	function _pausePlayAll() {
		if (primaryPlayer) {
			if(primaryPlayer.isPlaying()) {
				playerList.forEach(p => {
					if (p.player.mSrc) p.player.pause();
				});
				mElementPlayPause.classList.add('play')
			} else {
				playerList.forEach(p => {
					if (p.player.mSrc) p.player.play();
				})
				mElementPlayPause.classList.remove('play')
			}
		}
	}

	mElementPlayPause.onclick = _pausePlayAll;

	function _minusHour() {
		var t = primaryPlayer.getPosition();
		if (t == 0)
			t = CloudHelpers.getCurrentTimeUTC();
		if (t != 0) {
			playerList.forEach(p => {
				p.setPosition(t - 3600*1000);
				p.play();
			});
		}
		else
			console.log("Invalid current position");
	}

	function _plusHour() {
		var isLive = primaryPlayer.isLive();
		if (isLive == true){
			return;
		}
		var t = primaryPlayer.getPosition();
		if (t == 0)
			t = CloudHelpers.getCurrentTimeUTC();

		if (t != 0) {
			if (t + 3600*1000 > CloudHelpers.getCurrentTimeUTC()) {
				playerList.forEach(p => {
					p.setPosition(CloudHelpers.POSITION_LIVE);
					p.play();
				})
			} else {
				playerList.forEach(p => {
					p.setPosition(t + 3600*1000);
					p.play();
				})
			}
		}
		else
			console.log("Invalid current position ");
	}

	mShiftPlus.onclick = _plusHour;
	mRightArrow.onclick = _plusHour;

	mShiftMinus.onclick = _minusHour;
	mLeftArrow.onclick = _minusHour;

	function _gotoLive(e){
		if (primaryPlayer.mSrc === undefined || primaryPlayer.mSrc == null) {
			return;
		}
		if(primaryPlayer != null && primaryPlayer.getSource() != null){
			var sClasses = mElementGotoLive.classList;
			if(sClasses.contains('now') == false && sClasses.contains('disabled') == false){
				playerList.forEach(p => {
					p.setPosition(CloudPlayer.POSITION_LIVE);
					p.play();
				})
			}
		}
	}
	mElementGotoLive.onclick = _gotoLive;

	function _stopPolingCursor(){
		clearInterval(self._polingCursor);
		mElementGotoLive.classList.remove("now");
		mElementGotoLive.classList.add("disabled");
	}

	function _updateCursorPosition(opt){
		opt = opt || {};

		if (primaryPlayer.mSrc === undefined || primaryPlayer.mSrc == null) {
			mElementGotoLive.classList.remove("now");
			mElementGotoLive.classList.add("disabled");
		} else {
			if(primaryPlayer.isLive()){
				mElementGotoLive.classList.remove("disabled");
				mElementGotoLive.classList.add("now");
			}else{
				mElementGotoLive.classList.remove("disabled");
				mElementGotoLive.classList.remove("now");
			}
		}

		el_timelinepicker = el_timeline_container.getElementsByTagName('k-timeline-picker')[0];

		if (el_timelinepicker && mCursorPosition!=0 && !mNoUpdateTimeline ) {
			if (primaryPlayer.isLive()) {
				var vcp = primaryPlayer.player.getElementsByTagName('vxg-cloud-player')[0];
				vcp.setTimePromise( mCursorPosition ).then(function(res){
				}).catch(function(exc){
				});
			}
		}
	}

	function _startPolingCursor(){
		_stopPolingCursor();
		self._polingCursor = setInterval(function(){
			if(primaryPlayer != null){
				var currPos = primaryPlayer.getPosition();
				if (currPos != 0) {
					mCursorPosition = primaryPlayer.getPosition();
				}
			}else{
				mCursorPosition = 0;
			}
			_updateCursorPosition({sender: "poling"});
		},1000);
	}

	function _changedSource(){
		console.warn("_changedSource");
		playerSources = [];
		if(playerList) {
			playerList.forEach(p => {
				if(!playerSources.some(ps => ps == p.getSource())) playerSources.push(p.getSource());
			})
		}

		if(primaryPlayer != null){
			mSource = primaryPlayer.getSource();
			if(mSource){
				if (mUseTimezone) {
					mTimezoneOffset = CloudHelpers.getOffsetTimezone(mUseTimezone);
				} else {
					mTimezoneOffset = CloudHelpers.getOffsetTimezone(mSource.getTimezone());
				}				
				
				if (mCalendar != null) {
					if (playerSources) {
						mCalendar.setSource(playerList);
					} else {
						mCalendar.setSource(mSource);
					}
				}
			}
		}

		if(primaryPlayer != null){
			_startPolingCursor();
		}
	}

	function _playerEvent(evnt, args){
		console.warn("_playerEvent ", evnt);
		if(evnt.name == "SOURCE_CHANGED"){
			_changedSource();
		}else if(evnt.name == "POSITION_JUMPED"){
			console.warn("POSITION_JUMPED", primaryPlayer)
			mCursorPosition = args.new_pos;
		} else if (evnt.name == 'STOPED' ){
			console.log("Timeline catch event: Player stoped " + args );
		} else if (evnt.name == 'PLAYED') {
			console.log("Timeline catch event: Player played " + args);
		}
	}

	self.hideCalendarButton = function(){
		if(mElementCalendar.style.display != "none"){
			mElementCalendar.style.display = "none";
		}
	}

	self.showCalendarButton = function(){
		if(mElementCalendar.style.display == "none"){
			mElementCalendar.style.display = "";
		}
	}

	self.hideGotoLiveButton = function(){
		if(mElementGotoLive.style.display != "none"){
			mElementGotoLive.style.display = "none";
		}
	}

	self.showGotoLiveButton = function(){
		if(mElementGotoLive.style.display == "none"){
			mElementGotoLive.style.display = "";
		}
	}

	self.setPlayer = function(player, players){
		if (primaryPlayer) {
			primaryPlayer.removeCallback(mViewID);
		}
		if (players) {
			playerList = players;
		}
		if (player) {
			primaryPlayer = player;
			_initCalendar();
			primaryPlayer.addCallback(mViewID, _playerEvent);
		} else {
			primaryPlayer = null;
		}
	}

	if(options["gotoLive"] !== undefined){
		if(options["gotoLive"] == true){
			self.showGotoLiveButton();
		}else{
			self.hideGotoLiveButton();
		}
	}

	if(mOptionCalendar){
		self.showCalendarButton();
	}else{
		self.hideCalendarButton();
	}
}
// Wrapper for VXGCloudPlayer & CloudSDK

window.CloudPlayerSDK = function(playerElementID, o) {
	console.log(o);

    var self = this;
    self.options = o || {};
    self.player = null;
    self.conn = null;
    self.filter = null;
    self.cm = null;
    self.mCameraID = null;
    var mPosition = CloudPlayer.POSITION_LIVE;
    self.camera = null;
    self.svcp_url = null;
    self.sharedKey = null;
    self.playerElementID = null;
    self.tokenExpire = null;
    var isLocalPlayer = false;

    window['_CloudPlayerSDK'] = window['_CloudPlayerSDK'] || {};

    if (!playerElementID || playerElementID === '') throw 'Player container element ID is required.';
    self.playerElementID = playerElementID;
    if (self.playerElementID.indexOf('%') === -1)
        self.playerElementID = encodeURIComponent(self.playerElementID);

    self.conn = new CloudShareConnection(self.options);

    if (window['_CloudPlayerSDK'][playerElementID]){
        throw 'Oops! CloudPlayerSDK instance with player element ID: ' + playerElementID + ' already exist. Try use another ID.';
	}


    window['_CloudPlayerSDK'][playerElementID] = {};

    self.element = document.getElementById(playerElementID);
    self.element.classList.add("cloudplayersdk");
    self.element.classList.add("cloudplayer");
    self.element.classList.add("green");
    self.element.classList.add("black");

    self.element.innerHTML = ''
    + '<div class="cplayer" id="'+playerElementID+'_cplayer"></div>'
    + '<div class="lplayer" id="'+playerElementID+'_lplayer" style="display: none;"></div>';

    self.local_player = new vxgplayer(playerElementID+'_lplayer', self.options);
    self.player = new CloudPlayer(playerElementID+'_cplayer', self.options);

    console.log("self.options: ", self.options);

/*
    if((self.options.timeline != null)&&(self.options.timeline != false)){
	self.timeline = new CloudCameraTimelineView(self.options.timeline, self.options, self.player);
	self.timeline.setPlayer(self.player);
        self.player.player.classList.add('with-timeline');
        self.player.calendar = self.timeline.calendar;
        console.log(self.player);
    }
*/
	if((self.options.timeline != null)&&(self.options.timeline != false)){
		self.timeline = new VXGCloudPlayerTimelineView(playerElementID, self.options, self.player);
		self.timeline.setPlayer(self.player);
		self.player.player.classList.add('with-timeline');
        	self.player.calendar = self.timeline.calendar;
		console.log(self.player);
	}


    self.setSource = function (key) {
	var p = CloudHelpers.promise();

	if (!key || key === '') {
//		var msg = 'Access token is required';
//		console.error(msg);
		self.player._showerror(CloudReturnCode.ERROR_ACCESS_TOKEN_REQUIRED);
//		self.player._setError(msg);
//		self.player.showErrorText(msg);
		return CloudReturnCode.ERROR_ACCESS_TOKEN_REQUIRED;
	}

	var isUri = (key.url && CloudHelpers.parseUri(key.url).host)? true : false;
	if (key.url && !isUri) {
		if (key.options) {
			Object.assign(self.options, key.options);
		}
		key = key.url;
	}


	if ( key !== undefined
	&& key.url !== undefined
	&& isUri
	) {
		isLocalPlayer = true;
		//self.player.close();
		self.svcp_url = '';
		self.mCameraID = '';
		var cplayer = self.element.getElementsByClassName('cplayer')[0];
		cplayer.style.display = "none";
		var lplayer = self.element.getElementsByClassName('lplayer')[0];
		lplayer.style.display = "";
		self.local_player.setSource(key);
	} 
        else 
        {
		isLocalPlayer = false;
        	self.local_player.stop();
		var cplayer = self.element.getElementsByClassName('cplayer')[0];
		cplayer.style.display = "";
		var lplayer = self.element.getElementsByClassName('lplayer')[0];
		lplayer.style.display = "none";

	var camid = 0;
	var same_svcp = false;
	var same_camid = false;
	try {
		var obj = atob(key);
		obj = JSON.parse(obj);
		console.log("[CloudPlayerSDK] access_token: ", obj);
		self.tokenExpire = null;
		if (obj.expires) {
			self.tokenExpire = obj.expires;
			var expire	= CloudHelpers.parseUTCTime(self.tokenExpire);
			var dtime	= new Date();
			var now 	= dtime.getTime();

			if ((expire - now) < 0) {
				self.player._showerror(CloudReturnCode.ERROR_ACCESS_TOKEN_EXPIRED);
				return CloudReturnCode.ERROR_ACCESS_TOKEN_EXPIRED;
			}
		}
		if (obj.token && obj.camid && obj.access && obj.token !== '' && obj.camid !== '' && obj.access !== ''){
			self.sharedKey = obj.token;
			if (self.mCameraID == obj.camid) {
				same_camid = true;
			}
			self.mCameraID = obj.camid;
		}
		if(obj.svcp && obj.svcp != ''){
			if (self.svcp_url == obj.svcp) {
				same_svcp = true;
			}
			self.svcp_url = obj.svcp;
		}
//		obj.api = obj.api || "web.skyvr.videoexpertsgroup.com";
//		TODO move to CloudHelpers function and create tests
		if(obj.api && obj.api != ''){
			var l_svcp_url = '';
			l_svcp_url = (location.protocol=="file:"?"http:":location.protocol) + "//" + obj.api;
			if(location.protocol == "http:" || location.protocol == "file:"){
				l_svcp_url += (obj.api_p ? ":" + obj.api_p : "");
			} else if(location.protocol == "https:"){
				l_svcp_url += (obj.api_sp ? ":" + obj.api_sp : "");
			}
			l_svcp_url += "/";
			if (obj.path && obj.path != '') {
				l_svcp_url += obj.path;
				l_svcp_url += "/";
			}
			if (self.svcp_url == l_svcp_url) {
				same_svcp = true;
			}
			self.svcp_url = l_svcp_url;
		}
	} catch (err) {
//		var msg = 'Invalid access token format';
//		console.error(msg);
		self.player._showerror(CloudReturnCode.ERROR_INVALID_ACCESS_TOKEN_FORMAT);
//		self.player.showErrorText(msg);
	}
	if (same_camid && same_svcp) {
		console.log("DEBUG: Same camid and svcp for newly token");
		self.conn.updateToken(self.sharedKey);
		self.player.setAccessToken(key);
		self.player.setAccessTokenExpire(self.tokenExpire);
	} else {
		self.player.stop("by_plrsdk_3");
		if(self.svcp_url != null){ // if server is custom
			self.conn.ServiceProviderUrl = self.svcp_url.replace('file://','https://');
		}
		self.conn.open(self.sharedKey).done(function (cam) {
			if (self.conn) {
				self.cm = new CloudCameraList(self.conn);
				self.cm.getCamera(self.mCameraID).done (function (cam) {
						self.camera = cam;
					self.player.setAccessToken(key);
					self.player.setAccessTokenExpire(self.tokenExpire);
					self.player.setSource(self.camera).then(function() {
						console.log(self.camera)
						console.log(self.camera._origJson())
						self.player.setPosition(mPosition);
						self.player.play();
					});
/*
					if (self.timeline && mPosition != -1) {
						self.timeline.moveToPosition(mPosition);
					}
*/
				}).fail(function (err) {
					console.log(err); if (!self.player) return;
					self.player._showerror(CloudReturnCode.ERROR_CHANNEL_NOT_FOUND);
//					self.player._setError("Channel is not found");
//					self.player.showErrorText("Channel is not found");
//					TODO callback error
				});
//				return CloudReturnCode.OK;
			}
		}).fail(function (err) {
			self.player._showerror(CloudReturnCode.ERROR_NETWORK_ERROR);
//			self.player._setError("Network error");
//			self.player.showErrorText("Network error");
		});
		//self.player.showErrorText("Access token invalid");
		//return CloudReturnCode.ERROR_NO_CLOUD_CONNECTION;
	  }
       }
    };

	self.getSource = function () {
		if (!self.sharedKey)
			return CloudReturnCode.ERROR_SOURCE_NOT_CONFIGURED;
		return self.sharedKey;
	};

	self.play = function(){
		if (isLocalPlayer) {
			self.local_player.play();
		} else {
        if (!self.camera)
            return CloudReturnCode.ERROR_SOURCE_NOT_CONFIGURED;
        self.player.play();
		}
	};

	self.stop = function(){
		self.mCameraID = null;

		if (isLocalPlayer) {
			self.local_player.stop();
		} else {
			if (!self.camera)
				return CloudReturnCode.ERROR_SOURCE_NOT_CONFIGURED;
			self.player.stop("by_plrsdk_1");
			//self.player.setSource(null);
		}
	};

    self.pause = function(){
		if(isLocalPlayer) {
			self.local_player.pause();
		} else {
        if (!self.camera)
            return CloudReturnCode.ERROR_SOURCE_NOT_CONFIGURED;
        // TODO: what to do here ...
			self.player.pause();
		}
    };

	self.close = function(){
		self.local_player.stop();
		self.local_player.dispose();

        self.player.stop("by_plrsdk_2");
        self.player.close();
        self.player.player.innerHTML = '';
        self.conn.close();
        if(window['_CloudPlayerSDK'][playerElementID]){
			delete window['_CloudPlayerSDK'][playerElementID];
		}
    };

    self.sendBackwardAudio = function() {
	return self.player.sendBackwardAudio();
    }

    self.destroy = function(){
        self.player.destroy();
        self.conn.close();
/*
        if (self.timeline) {
            self.timeline.destroy();
        }
*/
	self.player.player.innerHTML = '';
	self.player = null;

	self.local_player.dispose();
	self.local_player = null;

	self.element.remove();
	self.element = null;

        if(window['_CloudPlayerSDK'][self.playerElementID]){
		delete window['_CloudPlayerSDK'][self.playerElementID];
	}
    }

    self.isPlaying = function(){
        if (!self.camera)
            return CloudReturnCode.ERROR_SOURCE_NOT_CONFIGURED;
        return self.player.isPlaying();
    };

    self.setPosition = function(time){
        mPosition = parseInt(time);
        if (!self.camera) {
            return CloudReturnCode.ERROR_SOURCE_NOT_CONFIGURED;
        }
        self.player.stop("by_plrsdk_2");
        self.player.setPosition(time);
/*
        if (self.timeline) {
	    var timelinepos = 0;
	    if (time > 0){
		timelinepos = time;
	    } else {
		timelinepos = CloudHelpers.getCurrentTimeUTC();
	    }
	    self.timeline.moveToPosition(timelinepos);
        }
*/
        self.player.play();
    };

    self.getPosition = function(){
        if (!self.camera)
            return CloudReturnCode.ERROR_SOURCE_NOT_CONFIGURED;
        return self.player.getPosition();
    };

    self.showTimeline = function(show){

        if (!self.camera) {
            console.error(CloudReturnCode.ERROR_SOURCE_NOT_CONFIGURED.text);
            return null;
        }
        if(!self.timeline){
            console.error(CloudReturnCode.ERROR_NOT_CONFIGURED.text);
            return null;
        }
        // I did not test with many players on one page
        document.getElementById("tagsplayer_timeline").style.display = show ? '' : 'none';

        return true;
    };

    self.showCalendarControl = function(show){
	if(!self.timeline){
		console.error(CloudReturnCode.ERROR_NOT_CONFIGURED.text);
		return null;
	}
	if (show) {
		self.timeline.showCalendarButton();
	} else {
		self.timeline.hideCalendarButton();
	}
    }

    self.getChannelName = function () {
        if (!self.camera)
            return CloudReturnCode.ERROR_SOURCE_NOT_CONFIGURED;
        return self.camera.getName();
    };

    self.setRange = function(startPos,endPos){
        self.player.setRange(startPos,endPos);
/*
		if(self.timeline){
			self.timeline.setRange(startPos,endPos);
		}
*/
	}

	self.resetRange = function(){
		self.player.resetRange();
/*
		if(self.timeline){
			self.timeline.resetRange();
		}
*/
    }

    self.showZoomControl = function(isShow) {
	if (self.player) {
		self.player._showZoomControl(isShow);
	}
    }

    self.showPTZControl = function(isShow) {
	if (self.player) {
		self.player.showPTZControl(isShow);
	}
    }

    self.mOnError_callback = null;
    self.onError = function(callback) {
        if (!callback) {
            self.player.onError(null);
            return;
        }
        self.mOnError_callback = callback;
		self.player.onError(function(plr, error) {
            self.mOnError_callback(self, error);
        });
    }
    self.mOnChannelStatus_callback = null;
    self.onChannelStatus = function(callback) {
        if(!callback) {
            self.mOnChannelStatus_callback = null;
            self.player.onChannelStatus(null);
            return;
        }
        self.mOnChannelStatus_callback = callback;
	self.player.onChannelStatus(function(plr, status){
            self.mOnChannelStatus_callback(self, status);
        });
    }

    self.setIOsFullscreenCallback = function (func) {
	self.player.setIOsFullscreenCallback(func)
    }

    self.addCallback = function(uniqname, func) {
        self.player.addCallback(uniqname, func);
/*
        if (self.timeline) {
            self.timeline.addCallback(uniqname, func);
        }
*/
    }

    self.removeCallback = function(uniqname) {
        self.player.removeCallback(uniqname);
/*
        if (self.timeline) {
            self.timeline.removeCallback(uniqname, func);
        }
*/
    }

    self.getImages = function() {
	self.player.getImages();
    }

   self.sendBackwardAudio = function() {
	return self.player.sendBackwardAudio();
    }

};

// video_container_selector - DOM-element with video-elements.
// First non-hidden video-element will be showed in canvas

var ptzconfig = {
    xRot : -48.6, // Rotate the camera vertically
    zRot : 145, // Camera rotation along the vertical axis
    xScale : 1, // Texture scale in X
    yScale : 1, // Texture scale in Y
    xShift : 0, // Texture X offset
    yShift : 0, // Texture Y offset
    zCamShift : .2, // Camera Z offset
    zZoom : -.6, // Zoom in / out camera
    xLens : 1, // Lens Correction Factor X
    zLens : 1.0, // Convexity Correction Factor
    divider: 4 // The number of lines that will make up the circles around the sphere. Exponentially affects the number of triangles
}

var jsscript = document.getElementsByTagName("script");
for (var i = 0; i < jsscript.length; i++) {
      var pattern = /CloudSDK/i;
      if ( pattern.test( jsscript[i].getAttribute("src") ) )
         ptzconfig.src = jsscript[i].getAttribute("src").replace(/(\/[^\/]+)$/,'\/');
 }

function changepztconfig(v,c){
ptzconfig[c]=v;
}
function testplay(){
$('#player1_vjs_html5_api').attr('src','/video.mp4');
player1_vjs_html5_api.play();
}
function testplay2(){
$('#player1_vjs_html5_api').attr('src','/fisheye.mp4');
player1_vjs_html5_api.play();
}

window.CloudPano = function(video_container, cloudplayer){
    var self = {};
    
    self.container = video_container;

    self.pano_player = cloudplayer;
    self.ptzconfig = Object.assign({}, ptzconfig);

    self.beMouseDown = false;
    self.bezRot = self.bexRot = 0;
    self.beX = self.beY = 0;
    self.model = {vertex :[], indices :[], texture : []};


    self.load_model = function(){
        if (self.textureBuffer)
            return;
        var xhr;

        try { xhr = new ActiveXObject('Msxml2.XMLHTTP'); }
        catch(e)
        {
            try { xhr = new ActiveXObject('Microsoft.XMLHTTP'); }
            catch(e2)
            {
                try { xhr = new XMLHttpRequest(); }
                catch(e3) { xhr = false; }
            }
        }

        xhr.onreadystatechange = function()
        {
            if (self.textureBuffer)
                return;
            if(xhr.readyState == 4)
            {
                if((xhr.status == 200 || xhr.status == 0) && xhr.response){
                    self.model = JSON.parse(xhr.response);
                    self.model.indices=[];c=0;
                    for (i=0;i<self.model.vertex.length;i+=3){
                        self.model.indices.push(c++);
                    }
                    self.vertexBuffer = self.gl.createBuffer();
                    self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.vertexBuffer);
                    self.gl.bufferData(self.gl.ARRAY_BUFFER, new Float32Array(self.model.vertex), self.gl.STATIC_DRAW);
                    self.gl.bindBuffer(self.gl.ARRAY_BUFFER, null);

                    self.indexBuffer = self.gl.createBuffer();
                    self.gl.bindBuffer(self.gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);
                    self.gl.bufferData(self.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(self.model.indices), self.gl.STATIC_DRAW);
                    self.gl.bindBuffer(self.gl.ELEMENT_ARRAY_BUFFER, null);

                    self.textureBuffer = self.gl.createBuffer();
                    self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.textureBuffer);
                    self.gl.bufferData(self.gl.ARRAY_BUFFER, new Float32Array(self.model.texture), self.gl.STATIC_DRAW);
                    self.gl.bindBuffer(self.gl.ARRAY_BUFFER, null);
                    console.log("[CloudPlayer] vehicles count is " + self.model.vertex.length/3);
                }
            }
        };

        if (self.pano_player.options && self.pano_player.options.model3d)
            xhr.open('GET', self.pano_player.options.model3d, true);
        else
            xhr.open('GET', self.ptzconfig.src+'model.json', true);

        xhr.send(null);
        // return xhr;
    }


    self.mouseMoveHandler = function(e) {
        var x = e.clientX;
        var y = e.clientY;

        if (!self.beMouseDown && e.buttons==1) {
            self.bezRot = self.ptzconfig.zRot;
            self.bexRot = self.ptzconfig.xRot;
            self.beMouseDown=true;
            self.beX = x;
            self.beY = y;
        }
        if (e.buttons==0) {
            self.beMouseDown=false;
        }
        if (!self.beMouseDown) return;
        self.ptzconfig.zRot = self.bezRot + (self.beX-x)/5.0;
        self.ptzconfig.xRot = self.bexRot + (self.beY-y)/5.0;
        if (self.ptzconfig.xRot>0) self.ptzconfig.xRot=0;
        if (self.ptzconfig.xRot<-65.2) self.ptzconfig.xRot=-65.2;
    }
    
    self.mouseWheelHandler = function(e) {
        e = e || window.event;
        var delta = e.deltaY || e.detail || e.wheelDelta;
        self.ptzconfig.zZoom-= delta/1000;
        if (self.ptzconfig.zZoom>0.6) self.ptzconfig.zZoom=0.6;
        if (self.ptzconfig.zZoom<-0.6) self.ptzconfig.zZoom=-0.6;
        e.preventDefault();
    }


    self.createGLContext = function(){
        var sliders = document.createElement("div");
        sliders.style.top="90px";
        sliders.style.position="absolute";
        sliders.style.color="black";
        sliders.style.fontSize="12px";
        sliders.innerHTML = '\
            <span style="background:rgba(255,255,255,.7);padding:0 5px">Vertical camera move</span><br/>               <input style="width:250px" id="zCamShift" type="range" min="-1" max="2" step=".01" value="'+self.ptzconfig.zCamShift+'" onchange="changepztconfig(this.value,\'zCamShift\')"><br/>\
            <span for="zZoom" style="background:rgba(255,255,255,.7);padding:0 5px">Zooming</span><br/>                    <input style="width:250px" id="zZoom" type="range" min="-5" max="2" step=".1" value="'+self.ptzconfig.zZoom+'" onchange="changepztconfig(this.value,\'zZoom\')"><br/>\
            <span for="xRot" style="background:rgba(255,255,255,.7);padding:0 5px">Down camera</span><br/>              <input style="width:250px" id="xRot" type="range" min="-120" max="0" step="5" value="'+self.ptzconfig.xRot+'" onchange="changepztconfig(this.value,\'xRot\')"><br/>\
            <span for="xScale" style="background:rgba(255,255,255,.7);padding:0 5px">Zoom texture by X</span><br/> <input style="width:250px" id="xScale" type="range" min="-2.5" max="2.5" step=".01" value="'+self.ptzconfig.xScale+'" onchange="changepztconfig(this.value,\'xScale\')"><br/>\
            <span for="yScale" style="background:rgba(255,255,255,.7);padding:0 5px">Zoom texture by Y</span><br/> <input style="width:250px" id="yScale" type="range" min="-2.5" max="2.5" step=".01" value="'+self.ptzconfig.yScale+'" onchange="changepztconfig(this.value,\'yScale\')"><br/>\
            <span for="xShift" style="background:rgba(255,255,255,.7);padding:0 5px">Shift texture by X</span><br/>        <input style="width:250px" id="xShift" type="range" min="-2.5" max="2.5" step=".01" value="'+self.ptzconfig.xShift+'" onchange="changepztconfig(this.value,\'xShift\')"><br/>\
            <span for="yShift" style="background:rgba(255,255,255,.7);padding:0 5px">Shift texture by Y</span><br/>        <input style="width:250px" id="yShift" type="range" min="-2.5" max="2.5" step=".01" value="'+self.ptzconfig.yShift+'" onchange="changepztconfig(this.value,\'yShift\')"><br/>\
            <span for="zLens" style="background:rgba(255,255,255,.7);padding:0 5px">lens convexity correction </span><br/>     <input style="width:250px" id="yShift" type="range" min="-2.5" max="2.5" step=".01" value="'+self.ptzconfig.zLens+'" onchange="changepztconfig(this.value,\'zLens\')"><br/>\
            <span for="xLens" style="background:rgba(255,255,255,.7);padding:0 5px">lens zoom correction by X</span><br/>     <input style="width:250px" id="xLens" type="range" min=".5" max="2" step=".01" value="'+self.ptzconfig.xLens+'" onchange="changepztconfig(this.value,\'xLens\')"><br/>\
            <button onclick="testplay()">Play test sample</button>&nbsp;<button onclick="testplay2()">Play second sample</button>\
        ';
//        video_container.parentElement.insertBefore(sliders,video_container);


        self.canvas = document.createElement("canvas");
        self.canvas.style.width = "100%";
        self.canvas.style.height = "100%";
        self.canvas.style.display = "none";

        self.container.parentElement.insertBefore(self.canvas,self.container);
        self.canvas.setAttribute('width', self.container.parentElement.offsetWidth)
        self.canvas.setAttribute('height', self.container.parentElement.offsetHeight)

	self.image = document.createElement("img");
	self.image.style.opacity = "0";
	self.image.style.width = "100%";
	self.image.style.height = "100%";
        self.image.style.position = "absolute";
        self.image.style.zIndex = "-5";
        self.image.style.display = "block";

	self.container.parentElement.insertBefore( self.image, self.canvas);

        self.canvas.addEventListener("mousemove", self.mouseMoveHandler);
        self.canvas.addEventListener("wheel", self.mouseWheelHandler);

        var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
        for (var i = 0; i < names.length; ++i) {
            var gl;
            try {
                gl = self.canvas.getContext(names[i]);
            } catch(e) {
                continue;
            }
            if (gl) return gl;
        }

        throw new Error("WebGL is not supported!");
    }
    self.compileShader = function(gl, vertexSrc, fragmentSrc){
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSrc);
        gl.compileShader(vertexShader);

        _checkCompile(vertexShader);

        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSrc);
        gl.compileShader(fragmentShader);

        _checkCompile(fragmentShader);

        var program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        gl.linkProgram(program);

        return program;

        function _checkCompile(shader){
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw new Error(gl.getShaderInfoLog(shader));
            }
        }
    }
    self.run = function(onframe){
        var f = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

        if(f){
            f(on);
        } else {
            throw new Error("do not support 'requestAnimationFram'");
        }

        var current = null;
        function on(t){
            if(!current) current = t;
            var dt = t - current;
            current = t;
            onframe(dt);
            f(on);
        }
    }

    function initTexture(gl) {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        var level = 0;
        var internalFormat = gl.RGBA;
        var width = 1;
        var height = 1;
        var border = 0;
        var srcFormat = gl.RGBA;
        var srcType = gl.UNSIGNED_BYTE;
        var pixel = new Uint8Array([0, 0, 0, 255]);  // opaque blue
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,width, height, border, srcFormat, srcType,pixel);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        return texture;
    }

    function updateTexture(gl, texture, video) {
        var level = 0;
        var internalFormat = gl.RGBA;
        var srcFormat = gl.RGBA;
        var srcType = gl.UNSIGNED_BYTE;
        try {
    	    gl.bindTexture(gl.TEXTURE_2D, texture);
    	    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, video);
    	} catch (e) {
    	    console.warn('CloudPano.updateTexture: ' + e.message);
    	}
    }

    self.ptz_enabled = false;

    self.start = function(){
        self.load_model();
        self.ptz_enabled = true;
        self.canvas.style.display = "block";
        self.container.style.visibility="hidden";
        self.container.style.position="fixed";
        self.container.style.top="0";
        self.container.style.height="1px";
        self.container.style.width="1px";
        self.container.style.zIndex="-1";
    }
    self.stop = function(){
        self.ptz_enabled = false;
        self.canvas.style.display = "none";
        self.container.style.visibility="";
        self.container.style.position="";
        self.container.style.top="";
        self.container.style.height="100%";
        self.container.style.width="100%";
        self.container.style.zIndex="";
    }


    function create_model(model){
/*
        var di=0;
        const pi = 3.1415926535897932;
        var a=b=0,vx=is=0;
        model.vertex=[];
        model.indices=[];
        model.texture=[];
        while(1){
            var v1 = get_point_from_angles(a,b);
            var v2 = get_point_from_angles(a+2*pi/ptzconfig.divider,b);
            var v3 = get_point_from_angles(a+pi/ptzconfig.divider,b+2*pi/ptzconfig.divider);
            var v4 = get_point_from_angles(a+2*pi/ptzconfig.divider+pi/ptzconfig.divider,b+2*pi/ptzconfig.divider);
            a += 2*pi/ptzconfig.divider;
            if (di>=ptzconfig.divider) {
                di=0;
                a = a + 2*pi/ptzconfig.divider/2;
                b += 2*pi/ptzconfig.divider;
            } else
                di++;
            if (a>2*pi) a -= 2*pi;
            model.indices = model.indices.concat([vx,vx+1,vx+2]);
            model.vertex[vx++]=v1[0];model.vertex[vx++]=v1[1];model.vertex[vx++]=v1[2];
            model.indices = model.indices.concat([vx,vx+1,vx+2]);
            model.vertex[vx++]=v2[0];model.vertex[vx++]=v2[1];model.vertex[vx++]=v2[2];
            model.indices = model.indices.concat([vx,vx+1,vx+2]);
            model.vertex[vx++]=v3[0];model.vertex[vx++]=v3[1];model.vertex[vx++]=v3[2];

            model.texture.push((v1[0]+1.0)/2.0);
            model.texture.push((v1[1]+1.0)/2.0);
            model.texture.push((v2[0]+1.0)/2.0);
            model.texture.push((v2[1]+1.0)/2.0);
            model.texture.push((v3[0]+1.0)/2.0);
            model.texture.push((v3[1]+1.0)/2.0);


            model.indices = model.indices.concat([vx,vx+1,vx+2]);
            model.vertex[vx++]=v2[0];model.vertex[vx++]=v2[1];model.vertex[vx++]=v2[2];
            model.indices = model.indices.concat([vx,vx+1,vx+2]);
            model.vertex[vx++]=v3[0];model.vertex[vx++]=v3[1];model.vertex[vx++]=v3[2];
            model.indices = model.indices.concat([vx,vx+1,vx+2]);
            model.vertex[vx++]=v4[0];model.vertex[vx++]=v4[1];model.vertex[vx++]=v4[2];

            model.texture.push((v2[0]+1.0)/2.0);
            model.texture.push((v2[1]+1.0)/2.0);
            model.texture.push((v3[0]+1.0)/2.0);
            model.texture.push((v3[1]+1.0)/2.0);
            model.texture.push((v4[0]+1.0)/2.0);
            model.texture.push((v4[1]+1.0)/2.0);

            if (b>pi/2)
                break;
        }

        function get_point_from_angles(a,b){
            if (b>pi/2) b=pi/2;
            if (b<0) b=0;
            while (a>=2*pi) a-=2*pi;
            var x = Math.cos(a)*Math.cos(b);
            var y = Math.sin(a)*Math.cos(b);
            var z = -Math.sin(b);
            return [x,y,z];
        }
*/

    }

    create_model(self.model);

    self.gl = self.createGLContext();

    var vertexSrc = "\
        attribute vec3 aVertexPosition;\n\
        attribute vec2 aTextureCoord;\n\
        uniform mat4 uMVMatrix;\n\
        uniform mat4 uPMatrix;\n\
        uniform float fCamShift;\n\
        uniform float zLens;\n\
        varying vec2 vTextureCoord;\n\
        void main(void) {\n\
            gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition.x, aVertexPosition.y, aVertexPosition.z*zLens+fCamShift, 1.0);\n\
            vTextureCoord = aTextureCoord;\n\
        }";
    var fragmentSrc = "\
        precision mediump float;\n\
        varying vec2 vTextureCoord;\n\
        uniform sampler2D uSampler;\n\
        uniform vec4 uScale;\n\
        void main(void) {\n\
            gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.x / uScale.x + uScale.z, vTextureCoord.y / uScale.y + uScale.w));\n\
        }";

    var program = self.compileShader(self.gl, vertexSrc, fragmentSrc);
    self.gl.useProgram(program);

    self.aVertexPosition = self.gl.getAttribLocation(program, "aVertexPosition");
    self.aTextureCoord = self.gl.getAttribLocation(program, "aTextureCoord");
    self.uSampler = self.gl.getUniformLocation(program, "uSampler");
    self.uScale = self.gl.getUniformLocation(program, "uScale");
    self.pMatrixUniform = self.gl.getUniformLocation(program, "uPMatrix");
    self.mvMatrixUniform = self.gl.getUniformLocation(program, "uMVMatrix");
    self.fCamShift= self.gl.getUniformLocation(program, "fCamShift");
    self.zLens= self.gl.getUniformLocation(program, "zLens");

    self.texture = initTexture(self.gl);
    self.mvMatrix = glMatrix.mat4.create();
    self.pMatrix = glMatrix.mat4.create();

    self.run(function(dt){
        if (!self.ptz_enabled) return;
        if (!self.textureBuffer || !self.indexBuffer) return;
        var videos = self.container.querySelectorAll('video');
        var video = null;
        // search active video container
        for (var i = 0; i < videos.length; ++i)
            if (getComputedStyle(videos[i],null).display!="none" && getComputedStyle(videos[i].parentElement,null).display!="none") {
                video = videos[i];
                break;
            }
        if (video == null) {
    	    var vcp = self.container.getElementsByTagName('vxg-cloud-player')[0];
    	    video = vcp.getVideo();
    	    if(video !== null) {
    		var poster_url = video.getAttribute('poster');
    		if (poster_url != null) {
			self.image.src = poster_url;
		}
    	    }
        }
        self.canvas.setAttribute('width', self.container.parentElement.offsetWidth);
        self.canvas.setAttribute('height', self.container.parentElement.offsetHeight);

	if (video == null) {
		return;
	}

	if (!self.pano_player.isPlaying() ) {
		//return;
		updateTexture(self.gl, self.texture, self.image);
	} else {
		updateTexture(self.gl, self.texture, video);
	}

        updateTexture(self.gl, self.texture, video);

        self.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        self.gl.enable(self.gl.DEPTH_TEST);
        self.gl.clear(self.gl.COLOR_BUFFER_BIT | self.gl.DEPTH_BUFFER_BIT);

        self.gl.viewport(0, 0, self.canvas.width , self.canvas.height);

        glMatrix.mat4.perspective(self.pMatrix, 45, self.canvas.width / self.canvas.height, 0.1, 100.0 );

        glMatrix.mat4.identity(self.mvMatrix);

        glMatrix.mat4.translate(self.mvMatrix, self.mvMatrix, [0.0, 0.0, self.ptzconfig.zZoom]);

        glMatrix.mat4.rotate(self.mvMatrix, self.mvMatrix, degToRad(self.ptzconfig.xRot), [1, 0, 0]);
        glMatrix.mat4.rotate(self.mvMatrix, self.mvMatrix, degToRad(self.ptzconfig.zRot), [0, 0, 1]);

        self.gl.enableVertexAttribArray(self.aVertexPosition);

        self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.vertexBuffer);
        self.gl.vertexAttribPointer(self.aVertexPosition, 3, self.gl.FLOAT, false, 0, 0);

        self.gl.enableVertexAttribArray(self.aTextureCoord);

        self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.textureBuffer);
        self.gl.vertexAttribPointer(self.aTextureCoord, 2, self.gl.FLOAT, false, 0, 0);

        self.gl.activeTexture(self.gl.TEXTURE0);
        self.gl.bindTexture(self.gl.TEXTURE_2D, self.texture);
        self.gl.pixelStorei(self.gl.UNPACK_FLIP_Y_WEBGL, true);
        self.gl.uniform1i(self.uSampler, 0);
        self.gl.uniform4f(self.uScale, self.ptzconfig.xScale, self.ptzconfig.yScale, self.ptzconfig.xShift, self.ptzconfig.yShift);

        self.gl.bindBuffer(self.gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);
        self.gl.uniformMatrix4fv(self.pMatrixUniform, false, self.pMatrix);
        self.gl.uniformMatrix4fv(self.mvMatrixUniform, false, self.mvMatrix);
        self.gl.uniform1f(self.fCamShift, self.ptzconfig.zCamShift);
        self.gl.uniform1f(self.zLens, self.ptzconfig.zLens);
        self.gl.drawElements(self.gl.TRIANGLES, self.model.vertex.length/3, self.gl.UNSIGNED_SHORT, self.model.indices);
    });

    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    return self;
}

!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define("rangeSlider",[],e):"object"==typeof exports?exports.rangeSlider=e():t.rangeSlider=e()}(window,function(){return function(i){var n={};function s(t){if(n[t])return n[t].exports;var e=n[t]={i:t,l:!1,exports:{}};return i[t].call(e.exports,e,e.exports,s),e.l=!0,e.exports}return s.m=i,s.c=n,s.d=function(t,e,i){s.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:i})},s.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},s.t=function(e,t){if(1&t&&(e=s(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var i=Object.create(null);if(s.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)s.d(i,n,function(t){return e[t]}.bind(null,n));return i},s.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return s.d(e,"a",e),e},s.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},s.p="",s(s.s=1)}([function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0});e.uuid=function(){var t=function(){return Math.floor(65536*(1+Math.random())).toString(16).substring(1)};return t()+t()+"-"+t()+"-"+t()+"-"+t()+"-"+t()+t()+t()},e.delay=function(t,e){for(var i=arguments.length,n=Array(2<i?i-2:0),s=2;s<i;s++)n[s-2]=arguments[s];return setTimeout(function(){return t.apply(null,n)},e)},e.debounce=function(n){var s=1<arguments.length&&void 0!==arguments[1]?arguments[1]:100;return function(){for(var t=arguments.length,e=Array(t),i=0;i<t;i++)e[i]=arguments[i];return n.debouncing||(n.lastReturnVal=n.apply(window,e),n.debouncing=!0),clearTimeout(n.debounceTimeout),n.debounceTimeout=setTimeout(function(){n.debouncing=!1},s),n.lastReturnVal}};var n=e.isString=function(t){return t===""+t},r=(e.isArray=function(t){return"[object Array]"===Object.prototype.toString.call(t)},e.isNumberLike=function(t){return null!=t&&(n(t)&&isFinite(parseFloat(t))||isFinite(t))});e.getFirsNumberLike=function(){for(var t=arguments.length,e=Array(t),i=0;i<t;i++)e[i]=arguments[i];if(!e.length)return null;for(var n=0,s=e.length;n<s;n++)if(r(e[n]))return e[n];return null},e.isObject=function(t){return"[object Object]"===Object.prototype.toString.call(t)},e.simpleExtend=function(t,e){var i={};for(var n in t)i[n]=t[n];for(var s in e)i[s]=e[s];return i},e.between=function(t,e,i){return t<e?e:i<t?i:t}},function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var n=function(){function n(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(t,e,i){return e&&n(t.prototype,e),i&&n(t,i),t}}(),l=s(i(2)),h=s(i(0));function s(t){if(t&&t.__esModule)return t;var e={};if(null!=t)for(var i in t)Object.prototype.hasOwnProperty.call(t,i)&&(e[i]=t[i]);return e.default=t,e}i(3);var o=new RegExp("/[\\n\\t]/","g"),u="rangeSlider",d=l.supportsRange(),f={polyfill:!0,root:document,rangeClass:"rangeSlider",disabledClass:"rangeSlider--disabled",fillClass:"rangeSlider__fill",bufferClass:"rangeSlider__buffer",handleClass:"rangeSlider__handle",startEvent:["mousedown","touchstart","pointerdown"],moveEvent:["mousemove","touchmove","pointermove"],endEvent:["mouseup","touchend","pointerup"],min:null,max:null,step:null,value:null,buffer:null,stick:null,borderRadius:10,vertical:!1},r=function(){function a(t,e){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,a);var i=void 0,n=void 0,s=void 0;if(this.element=t,this.options=h.simpleExtend(f,e),this.polyfill=this.options.polyfill,this.vertical=this.options.vertical,this.onInit=this.options.onInit,this.onSlide=this.options.onSlide,this.onSlideStart=this.options.onSlideStart,this.onSlideEnd=this.options.onSlideEnd,this.onSlideEventsCount=-1,this.isInteractsNow=!1,this.needTriggerEvents=!1,this.polyfill||!d){this.options.buffer=this.options.buffer||parseFloat(this.element.getAttribute("data-buffer")),this.identifier="js-"+u+"-"+h.uuid(),this.min=h.getFirsNumberLike(this.options.min,parseFloat(this.element.getAttribute("min")),0),this.max=h.getFirsNumberLike(this.options.max,parseFloat(this.element.getAttribute("max")),100),this.value=h.getFirsNumberLike(this.options.value,this.element.value,parseFloat(this.element.value||this.min+(this.max-this.min)/2)),this.step=h.getFirsNumberLike(this.options.step,parseFloat(this.element.getAttribute("step"))||(i=1)),this.percent=null,h.isArray(this.options.stick)&&1<=this.options.stick.length?this.stick=this.options.stick:(n=this.element.getAttribute("stick"))&&1<=(s=n.split(" ")).length&&(this.stick=s.map(parseFloat)),this.stick&&1===this.stick.length&&this.stick.push(1.5*this.step),this._updatePercentFromValue(),this.toFixed=this._toFixed(this.step);var r=void 0;this.container=document.createElement("div"),l.addClass(this.container,this.options.fillClass),r=this.vertical?this.options.fillClass+"__vertical":this.options.fillClass+"__horizontal",l.addClass(this.container,r),this.handle=document.createElement("div"),l.addClass(this.handle,this.options.handleClass),r=this.vertical?this.options.handleClass+"__vertical":this.options.handleClass+"__horizontal",l.addClass(this.handle,r),this.range=document.createElement("div"),l.addClass(this.range,this.options.rangeClass),this.range.id=this.identifier;var o=t.getAttribute("title");o&&0<o.length&&this.range.setAttribute("title",o),this.options.bufferClass&&(this.buffer=document.createElement("div"),l.addClass(this.buffer,this.options.bufferClass),this.range.appendChild(this.buffer),r=this.vertical?this.options.bufferClass+"__vertical":this.options.bufferClass+"__horizontal",l.addClass(this.buffer,r)),this.range.appendChild(this.container),this.range.appendChild(this.handle),r=this.vertical?this.options.rangeClass+"__vertical":this.options.rangeClass+"__horizontal",l.addClass(this.range,r),h.isNumberLike(this.options.value)&&(this._setValue(this.options.value,!0),this.element.value=this.options.value),h.isNumberLike(this.options.buffer)&&this.element.setAttribute("data-buffer",this.options.buffer),h.isNumberLike(this.options.min)&&this.element.setAttribute("min",""+this.min),h.isNumberLike(this.options.max),this.element.setAttribute("max",""+this.max),(h.isNumberLike(this.options.step)||i)&&this.element.setAttribute("step",""+this.step),l.insertAfter(this.element,this.range),l.setCss(this.element,{position:"absolute",width:"1px",height:"1px",overflow:"hidden",opacity:"0"}),this._handleDown=this._handleDown.bind(this),this._handleMove=this._handleMove.bind(this),this._handleEnd=this._handleEnd.bind(this),this._startEventListener=this._startEventListener.bind(this),this._changeEventListener=this._changeEventListener.bind(this),this._handleResize=this._handleResize.bind(this),this._init(),window.addEventListener("resize",this._handleResize,!1),l.addEventListeners(this.options.root,this.options.startEvent,this._startEventListener),this.element.addEventListener("change",this._changeEventListener,!1)}}return n(a,[{key:"update",value:function(t,e){return e&&(this.needTriggerEvents=!0),h.isObject(t)&&(h.isNumberLike(t.min)&&(this.element.setAttribute("min",""+t.min),this.min=t.min),h.isNumberLike(t.max)&&(this.element.setAttribute("max",""+t.max),this.max=t.max),h.isNumberLike(t.step)&&(this.element.setAttribute("step",""+t.step),this.step=t.step,this.toFixed=this._toFixed(t.step)),h.isNumberLike(t.buffer)&&this._setBufferPosition(t.buffer),h.isNumberLike(t.value)&&this._setValue(t.value)),this._update(),this.onSlideEventsCount=0,this.needTriggerEvents=!1,this}},{key:"destroy",value:function(){l.removeAllListenersFromEl(this,this.options.root),window.removeEventListener("resize",this._handleResize,!1),this.element.removeEventListener("change",this._changeEventListener,!1),this.element.style.cssText="",delete this.element[u],this.range&&this.range.parentNode.removeChild(this.range)}},{key:"_toFixed",value:function(t){return(t+"").replace(".","").length-1}},{key:"_init",value:function(){this.onInit&&"function"==typeof this.onInit&&this.onInit(),this._update(!1)}},{key:"_updatePercentFromValue",value:function(){this.percent=(this.value-this.min)/(this.max-this.min)}},{key:"_startEventListener",value:function(t,e){var i=this,n=t.target,s=!1;(1===t.which||"touches"in t)&&(l.forEachAncestors(n,function(t){return s=t.id===i.identifier&&!l.hasClass(t,i.options.disabledClass)},!0),s&&this._handleDown(t,e))}},{key:"_changeEventListener",value:function(t,e){if(!e||e.origin!==this.identifier){var i=t.target.value,n=this._getPositionFromValue(i);this._setPosition(n)}}},{key:"_update",value:function(t){var e=this.vertical?"offsetHeight":"offsetWidth";this.handleSize=l.getDimension(this.handle,e),this.rangeSize=l.getDimension(this.range,e),this.maxHandleX=this.rangeSize-this.handleSize,this.grabX=this.handleSize/2,this.position=this._getPositionFromValue(this.value),this.element.disabled?l.addClass(this.range,this.options.disabledClass):l.removeClass(this.range,this.options.disabledClass),this._setPosition(this.position),this.options.bufferClass&&this.options.buffer&&this._setBufferPosition(this.options.buffer),this._updatePercentFromValue(),!1!==t&&l.triggerEvent(this.element,"change",{origin:this.identifier})}},{key:"_handleResize",value:function(){var t=this;return h.debounce(function(){h.delay(function(){t._update()},300)},50)()}},{key:"_handleDown",value:function(t){if(this.isInteractsNow=!0,t.preventDefault(),l.addEventListeners(this.options.root,this.options.moveEvent,this._handleMove),l.addEventListeners(this.options.root,this.options.endEvent,this._handleEnd),!(-1<(" "+t.target.className+" ").replace(o," ").indexOf(this.options.handleClass))){var e=this.range.getBoundingClientRect(),i=this._getRelativePosition(t),n=this.vertical?e.bottom:e.left,s=this._getPositionFromNode(this.handle)-n,r=i-this.grabX;this._setPosition(r),s<=i&&i<s+2*this.options.borderRadius&&(this.grabX=i-s),this._updatePercentFromValue()}}},{key:"_handleMove",value:function(t){var e=this._getRelativePosition(t);this.isInteractsNow=!0,t.preventDefault(),this._setPosition(e-this.grabX)}},{key:"_handleEnd",value:function(t){t.preventDefault(),l.removeEventListeners(this.options.root,this.options.moveEvent,this._handleMove),l.removeEventListeners(this.options.root,this.options.endEvent,this._handleEnd),l.triggerEvent(this.element,"change",{origin:this.identifier}),(this.isInteractsNow||this.needTriggerEvents)&&this.onSlideEnd&&"function"==typeof this.onSlideEnd&&this.onSlideEnd(this.value,this.percent,this.position),this.onSlideEventsCount=0,this.isInteractsNow=!1}},{key:"_setPosition",value:function(t){var e,i=void 0,n=void 0,s=void 0,r=this._getValueFromPosition(h.between(t,0,this.maxHandleX));this.stick&&((n=r%(s=this.stick[0]))<(i=this.stick[1]||.1)?r-=n:Math.abs(s-n)<i&&(r=r-n+s)),e=this._getPositionFromValue(r),this.vertical?(this.container.style.height=e+this.grabX+"px",this.handle.style.webkitTransform="translateY(-"+e+"px)",this.handle.style.msTransform="translateY(-"+e+"px)",this.handle.style.transform="translateY(-"+e+"px)"):(this.container.style.width=e+this.grabX+"px",this.handle.style.webkitTransform="translateX("+e+"px)",this.handle.style.msTransform="translateX("+e+"px)",this.handle.style.transform="translateX("+e+"px)"),this._setValue(r),this.position=e,this.value=r,this._updatePercentFromValue(),(this.isInteractsNow||this.needTriggerEvents)&&(this.onSlideStart&&"function"==typeof this.onSlideStart&&0===this.onSlideEventsCount&&this.onSlideStart(this.value,this.percent,this.position),this.onSlide&&"function"==typeof this.onSlide&&this.onSlide(this.value,this.percent,this.position)),this.onSlideEventsCount++}},{key:"_setBufferPosition",value:function(t){var e=!0;if(isFinite(t))t=parseFloat(t);else{if(!h.isString(t))return void console.warn("New position must be XXpx or XX%");0<t.indexOf("px")&&(e=!1),t=parseFloat(t)}if(isNaN(t))console.warn("New position is NaN");else if(this.options.bufferClass){var i=e?t:t/this.rangeSize*100;i<0&&(i=0),100<i&&(i=100),this.options.buffer=i;var n=this.options.borderRadius/this.rangeSize*100,s=i-n;s<0&&(s=0),this.vertical?(this.buffer.style.height=s+"%",this.buffer.style.bottom=.5*n+"%"):(this.buffer.style.width=s+"%",this.buffer.style.left=.5*n+"%"),this.element.setAttribute("data-buffer",i)}else console.warn("You disabled buffer, it's className is empty")}},{key:"_getPositionFromNode",value:function(t){for(var e=this.vertical?this.maxHandleX:0;null!==t;)e+=this.vertical?t.offsetTop:t.offsetLeft,t=t.offsetParent;return e}},{key:"_getRelativePosition",value:function(t){var e=this.range.getBoundingClientRect(),i=this.vertical?e.bottom:e.left,n=0,s=this.vertical?"pageY":"pageX";return void 0!==t[s]?n=t.touches&&t.touches.length?t.touches[0][s]:t[s]:void 0!==t.originalEvent?void 0!==t.originalEvent[s]?n=t.originalEvent[s]:t.originalEvent.touches&&t.originalEvent.touches[0]&&void 0!==t.originalEvent.touches[0][s]&&(n=t.originalEvent.touches[0][s]):t.touches&&t.touches[0]&&void 0!==t.touches[0][s]?n=t.touches[0][s]:!t.currentPoint||void 0===t.currentPoint.x&&void 0===t.currentPoint.y||(n=this.vertical?t.currentPoint.y:t.currentPoint.x),this.vertical&&(n-=window.pageYOffset),this.vertical?i-n:n-i}},{key:"_getPositionFromValue",value:function(t){var e=(t-this.min)/(this.max-this.min)*this.maxHandleX;return isNaN(e)?0:e}},{key:"_getValueFromPosition",value:function(t){var e=t/(this.maxHandleX||1),i=this.step*Math.round(e*(this.max-this.min)/this.step)+this.min;return Number(i.toFixed(this.toFixed))}},{key:"_setValue",value:function(t,e){(t!==this.value||e)&&(this.element.value=t,this.value=t,l.triggerEvent(this.element,"input",{origin:this.identifier}))}}],[{key:"create",value:function(t,i){var e=function(t){var e=t[u];e||(e=new a(t,i),t[u]=e)};t.length?Array.prototype.slice.call(t).forEach(function(t){e(t)}):e(t)}}]),a}();(e.default=r).version="0.4.10",r.dom=l,r.functions=h,t.exports=e.default},function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.supportsRange=e.removeAllListenersFromEl=e.removeEventListeners=e.addEventListeners=e.insertAfter=e.triggerEvent=e.forEachAncestors=e.removeClass=e.addClass=e.hasClass=e.setCss=e.getDimension=e.getHiddenParentNodes=e.isHidden=e.detectIE=void 0;var s=function(t){{if(t&&t.__esModule)return t;var e={};if(null!=t)for(var i in t)Object.prototype.hasOwnProperty.call(t,i)&&(e[i]=t[i]);return e.default=t,e}}(i(0));var r="eventListenerList",n=(e.detectIE=function(){var t=window.navigator.userAgent,e=t.indexOf("MSIE ");if(0<e)return parseInt(t.substring(e+5,t.indexOf(".",e)),10);if(0<t.indexOf("Trident/")){var i=t.indexOf("rv:");return parseInt(t.substring(i+3,t.indexOf(".",i)),10)}var n=t.indexOf("Edge/");return 0<n&&parseInt(t.substring(n+5,t.indexOf(".",n)),10)})(),o=!(!window.PointerEvent||n)&&{passive:!1},a=e.isHidden=function(t){return 0===t.offsetWidth||0===t.offsetHeight||!1===t.open},h=e.getHiddenParentNodes=function(t){for(var e=[],i=t.parentNode;i&&a(i);)e.push(i),i=i.parentNode;return e},l=(e.getDimension=function(t,e){var i=h(t),n=i.length,s=[],r=t[e],o=function(t){void 0!==t.open&&(t.open=!t.open)};if(n){for(var a=0;a<n;a++)s.push({display:i[a].style.display,height:i[a].style.height,overflow:i[a].style.overflow,visibility:i[a].style.visibility}),i[a].style.display="block",i[a].style.height="0",i[a].style.overflow="hidden",i[a].style.visibility="hidden",o(i[a]);r=t[e];for(var l=0;l<n;l++)o(i[l]),i[l].style.display=s[l].display,i[l].style.height=s[l].height,i[l].style.overflow=s[l].overflow,i[l].style.visibility=s[l].visibility}return r},e.setCss=function(t,e){for(var i in e)t.style[i]=e[i];return t.style},e.hasClass=function(t,e){return new RegExp(" "+e+" ").test(" "+t.className+" ")});e.addClass=function(t,e){l(t,e)||(t.className+=" "+e)},e.removeClass=function(t,e){var i=" "+t.className.replace(/[\t\r\n]/g," ")+" ";if(l(t,e)){for(;0<=i.indexOf(" "+e+" ");)i=i.replace(" "+e+" "," ");t.className=i.replace(/^\s+|\s+$/g,"")}},e.forEachAncestors=function(t,e,i){for(i&&e(t);t.parentNode&&!e(t);)t=t.parentNode;return t},e.triggerEvent=function(t,e,i){if(!s.isString(e))throw new TypeError("event name must be String");if(!(t instanceof HTMLElement))throw new TypeError("element must be HTMLElement");e=e.trim();var n=document.createEvent("CustomEvent");n.initCustomEvent(e,!1,!1,i),t.dispatchEvent(n)},e.insertAfter=function(t,e){return t.parentNode.insertBefore(e,t.nextSibling)},e.addEventListeners=function(e,t,i){t.forEach(function(t){e[r]||(e[r]={}),e[r][t]||(e[r][t]=[]),e.addEventListener(t,i,o),e[r][t].indexOf(i)<0&&e[r][t].push(i)})},e.removeEventListeners=function(i,t,n){t.forEach(function(t){var e=void 0;i.removeEventListener(t,n,!1),i[r]&&i[r][t]&&-1<(e=i[r][t].indexOf(n))&&i[r][t].splice(e,1)})},e.removeAllListenersFromEl=function(e,t){if(t[r]){for(var i in t[r])t[r][i].forEach(n,{eventName:i,el:t});t[r]={}}function n(t){t===e._startEventListener&&this.el.removeEventListener(this.eventName,t,!1)}},e.supportsRange=function(){var t=document.createElement("input");return t.setAttribute("type","range"),"text"!==t.type}},function(t,e,i){}])});
//# sourceMappingURL=range-slider.min.js.map
/*!
@fileoverview gl-matrix - High performance matrix and vector operations
@author Brandon Jones
@author Colin MacKenzie IV
@version 3.3.0

Copyright (c) 2015-2020, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
!function(t,n){"object"==typeof exports&&"undefined"!=typeof module?n(exports):"function"==typeof define&&define.amd?define(["exports"],n):n((t=t||self).glMatrix={})}(this,(function(t){"use strict";var n="undefined"!=typeof Float32Array?Float32Array:Array,a=Math.random;var r=Math.PI/180;Math.hypot||(Math.hypot=function(){for(var t=0,n=arguments.length;n--;)t+=arguments[n]*arguments[n];return Math.sqrt(t)});var e=Object.freeze({__proto__:null,EPSILON:1e-6,get ARRAY_TYPE(){return n},RANDOM:a,setMatrixArrayType:function(t){n=t},toRadian:function(t){return t*r},equals:function(t,n){return Math.abs(t-n)<=1e-6*Math.max(1,Math.abs(t),Math.abs(n))}});function u(t,n,a){var r=n[0],e=n[1],u=n[2],o=n[3],i=a[0],h=a[1],c=a[2],s=a[3];return t[0]=r*i+u*h,t[1]=e*i+o*h,t[2]=r*c+u*s,t[3]=e*c+o*s,t}function o(t,n,a){return t[0]=n[0]-a[0],t[1]=n[1]-a[1],t[2]=n[2]-a[2],t[3]=n[3]-a[3],t}var i=u,h=o,c=Object.freeze({__proto__:null,create:function(){var t=new n(4);return n!=Float32Array&&(t[1]=0,t[2]=0),t[0]=1,t[3]=1,t},clone:function(t){var a=new n(4);return a[0]=t[0],a[1]=t[1],a[2]=t[2],a[3]=t[3],a},copy:function(t,n){return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t},identity:function(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=1,t},fromValues:function(t,a,r,e){var u=new n(4);return u[0]=t,u[1]=a,u[2]=r,u[3]=e,u},set:function(t,n,a,r,e){return t[0]=n,t[1]=a,t[2]=r,t[3]=e,t},transpose:function(t,n){if(t===n){var a=n[1];t[1]=n[2],t[2]=a}else t[0]=n[0],t[1]=n[2],t[2]=n[1],t[3]=n[3];return t},invert:function(t,n){var a=n[0],r=n[1],e=n[2],u=n[3],o=a*u-e*r;return o?(o=1/o,t[0]=u*o,t[1]=-r*o,t[2]=-e*o,t[3]=a*o,t):null},adjoint:function(t,n){var a=n[0];return t[0]=n[3],t[1]=-n[1],t[2]=-n[2],t[3]=a,t},determinant:function(t){return t[0]*t[3]-t[2]*t[1]},multiply:u,rotate:function(t,n,a){var r=n[0],e=n[1],u=n[2],o=n[3],i=Math.sin(a),h=Math.cos(a);return t[0]=r*h+u*i,t[1]=e*h+o*i,t[2]=r*-i+u*h,t[3]=e*-i+o*h,t},scale:function(t,n,a){var r=n[0],e=n[1],u=n[2],o=n[3],i=a[0],h=a[1];return t[0]=r*i,t[1]=e*i,t[2]=u*h,t[3]=o*h,t},fromRotation:function(t,n){var a=Math.sin(n),r=Math.cos(n);return t[0]=r,t[1]=a,t[2]=-a,t[3]=r,t},fromScaling:function(t,n){return t[0]=n[0],t[1]=0,t[2]=0,t[3]=n[1],t},str:function(t){return"mat2("+t[0]+", "+t[1]+", "+t[2]+", "+t[3]+")"},frob:function(t){return Math.hypot(t[0],t[1],t[2],t[3])},LDU:function(t,n,a,r){return t[2]=r[2]/r[0],a[0]=r[0],a[1]=r[1],a[3]=r[3]-t[2]*a[1],[t,n,a]},add:function(t,n,a){return t[0]=n[0]+a[0],t[1]=n[1]+a[1],t[2]=n[2]+a[2],t[3]=n[3]+a[3],t},subtract:o,exactEquals:function(t,n){return t[0]===n[0]&&t[1]===n[1]&&t[2]===n[2]&&t[3]===n[3]},equals:function(t,n){var a=t[0],r=t[1],e=t[2],u=t[3],o=n[0],i=n[1],h=n[2],c=n[3];return Math.abs(a-o)<=1e-6*Math.max(1,Math.abs(a),Math.abs(o))&&Math.abs(r-i)<=1e-6*Math.max(1,Math.abs(r),Math.abs(i))&&Math.abs(e-h)<=1e-6*Math.max(1,Math.abs(e),Math.abs(h))&&Math.abs(u-c)<=1e-6*Math.max(1,Math.abs(u),Math.abs(c))},multiplyScalar:function(t,n,a){return t[0]=n[0]*a,t[1]=n[1]*a,t[2]=n[2]*a,t[3]=n[3]*a,t},multiplyScalarAndAdd:function(t,n,a,r){return t[0]=n[0]+a[0]*r,t[1]=n[1]+a[1]*r,t[2]=n[2]+a[2]*r,t[3]=n[3]+a[3]*r,t},mul:i,sub:h});function s(t,n,a){var r=n[0],e=n[1],u=n[2],o=n[3],i=n[4],h=n[5],c=a[0],s=a[1],M=a[2],f=a[3],l=a[4],v=a[5];return t[0]=r*c+u*s,t[1]=e*c+o*s,t[2]=r*M+u*f,t[3]=e*M+o*f,t[4]=r*l+u*v+i,t[5]=e*l+o*v+h,t}function M(t,n,a){return t[0]=n[0]-a[0],t[1]=n[1]-a[1],t[2]=n[2]-a[2],t[3]=n[3]-a[3],t[4]=n[4]-a[4],t[5]=n[5]-a[5],t}var f=s,l=M,v=Object.freeze({__proto__:null,create:function(){var t=new n(6);return n!=Float32Array&&(t[1]=0,t[2]=0,t[4]=0,t[5]=0),t[0]=1,t[3]=1,t},clone:function(t){var a=new n(6);return a[0]=t[0],a[1]=t[1],a[2]=t[2],a[3]=t[3],a[4]=t[4],a[5]=t[5],a},copy:function(t,n){return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t},identity:function(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=1,t[4]=0,t[5]=0,t},fromValues:function(t,a,r,e,u,o){var i=new n(6);return i[0]=t,i[1]=a,i[2]=r,i[3]=e,i[4]=u,i[5]=o,i},set:function(t,n,a,r,e,u,o){return t[0]=n,t[1]=a,t[2]=r,t[3]=e,t[4]=u,t[5]=o,t},invert:function(t,n){var a=n[0],r=n[1],e=n[2],u=n[3],o=n[4],i=n[5],h=a*u-r*e;return h?(h=1/h,t[0]=u*h,t[1]=-r*h,t[2]=-e*h,t[3]=a*h,t[4]=(e*i-u*o)*h,t[5]=(r*o-a*i)*h,t):null},determinant:function(t){return t[0]*t[3]-t[1]*t[2]},multiply:s,rotate:function(t,n,a){var r=n[0],e=n[1],u=n[2],o=n[3],i=n[4],h=n[5],c=Math.sin(a),s=Math.cos(a);return t[0]=r*s+u*c,t[1]=e*s+o*c,t[2]=r*-c+u*s,t[3]=e*-c+o*s,t[4]=i,t[5]=h,t},scale:function(t,n,a){var r=n[0],e=n[1],u=n[2],o=n[3],i=n[4],h=n[5],c=a[0],s=a[1];return t[0]=r*c,t[1]=e*c,t[2]=u*s,t[3]=o*s,t[4]=i,t[5]=h,t},translate:function(t,n,a){var r=n[0],e=n[1],u=n[2],o=n[3],i=n[4],h=n[5],c=a[0],s=a[1];return t[0]=r,t[1]=e,t[2]=u,t[3]=o,t[4]=r*c+u*s+i,t[5]=e*c+o*s+h,t},fromRotation:function(t,n){var a=Math.sin(n),r=Math.cos(n);return t[0]=r,t[1]=a,t[2]=-a,t[3]=r,t[4]=0,t[5]=0,t},fromScaling:function(t,n){return t[0]=n[0],t[1]=0,t[2]=0,t[3]=n[1],t[4]=0,t[5]=0,t},fromTranslation:function(t,n){return t[0]=1,t[1]=0,t[2]=0,t[3]=1,t[4]=n[0],t[5]=n[1],t},str:function(t){return"mat2d("+t[0]+", "+t[1]+", "+t[2]+", "+t[3]+", "+t[4]+", "+t[5]+")"},frob:function(t){return Math.hypot(t[0],t[1],t[2],t[3],t[4],t[5],1)},add:function(t,n,a){return t[0]=n[0]+a[0],t[1]=n[1]+a[1],t[2]=n[2]+a[2],t[3]=n[3]+a[3],t[4]=n[4]+a[4],t[5]=n[5]+a[5],t},subtract:M,multiplyScalar:function(t,n,a){return t[0]=n[0]*a,t[1]=n[1]*a,t[2]=n[2]*a,t[3]=n[3]*a,t[4]=n[4]*a,t[5]=n[5]*a,t},multiplyScalarAndAdd:function(t,n,a,r){return t[0]=n[0]+a[0]*r,t[1]=n[1]+a[1]*r,t[2]=n[2]+a[2]*r,t[3]=n[3]+a[3]*r,t[4]=n[4]+a[4]*r,t[5]=n[5]+a[5]*r,t},exactEquals:function(t,n){return t[0]===n[0]&&t[1]===n[1]&&t[2]===n[2]&&t[3]===n[3]&&t[4]===n[4]&&t[5]===n[5]},equals:function(t,n){var a=t[0],r=t[1],e=t[2],u=t[3],o=t[4],i=t[5],h=n[0],c=n[1],s=n[2],M=n[3],f=n[4],l=n[5];return Math.abs(a-h)<=1e-6*Math.max(1,Math.abs(a),Math.abs(h))&&Math.abs(r-c)<=1e-6*Math.max(1,Math.abs(r),Math.abs(c))&&Math.abs(e-s)<=1e-6*Math.max(1,Math.abs(e),Math.abs(s))&&Math.abs(u-M)<=1e-6*Math.max(1,Math.abs(u),Math.abs(M))&&Math.abs(o-f)<=1e-6*Math.max(1,Math.abs(o),Math.abs(f))&&Math.abs(i-l)<=1e-6*Math.max(1,Math.abs(i),Math.abs(l))},mul:f,sub:l});function b(){var t=new n(9);return n!=Float32Array&&(t[1]=0,t[2]=0,t[3]=0,t[5]=0,t[6]=0,t[7]=0),t[0]=1,t[4]=1,t[8]=1,t}function m(t,n,a){var r=n[0],e=n[1],u=n[2],o=n[3],i=n[4],h=n[5],c=n[6],s=n[7],M=n[8],f=a[0],l=a[1],v=a[2],b=a[3],m=a[4],d=a[5],p=a[6],x=a[7],y=a[8];return t[0]=f*r+l*o+v*c,t[1]=f*e+l*i+v*s,t[2]=f*u+l*h+v*M,t[3]=b*r+m*o+d*c,t[4]=b*e+m*i+d*s,t[5]=b*u+m*h+d*M,t[6]=p*r+x*o+y*c,t[7]=p*e+x*i+y*s,t[8]=p*u+x*h+y*M,t}function d(t,n,a){return t[0]=n[0]-a[0],t[1]=n[1]-a[1],t[2]=n[2]-a[2],t[3]=n[3]-a[3],t[4]=n[4]-a[4],t[5]=n[5]-a[5],t[6]=n[6]-a[6],t[7]=n[7]-a[7],t[8]=n[8]-a[8],t}var p=m,x=d,y=Object.freeze({__proto__:null,create:b,fromMat4:function(t,n){return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[4],t[4]=n[5],t[5]=n[6],t[6]=n[8],t[7]=n[9],t[8]=n[10],t},clone:function(t){var a=new n(9);return a[0]=t[0],a[1]=t[1],a[2]=t[2],a[3]=t[3],a[4]=t[4],a[5]=t[5],a[6]=t[6],a[7]=t[7],a[8]=t[8],a},copy:function(t,n){return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t},fromValues:function(t,a,r,e,u,o,i,h,c){var s=new n(9);return s[0]=t,s[1]=a,s[2]=r,s[3]=e,s[4]=u,s[5]=o,s[6]=i,s[7]=h,s[8]=c,s},set:function(t,n,a,r,e,u,o,i,h,c){return t[0]=n,t[1]=a,t[2]=r,t[3]=e,t[4]=u,t[5]=o,t[6]=i,t[7]=h,t[8]=c,t},identity:function(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=1,t[5]=0,t[6]=0,t[7]=0,t[8]=1,t},transpose:function(t,n){if(t===n){var a=n[1],r=n[2],e=n[5];t[1]=n[3],t[2]=n[6],t[3]=a,t[5]=n[7],t[6]=r,t[7]=e}else t[0]=n[0],t[1]=n[3],t[2]=n[6],t[3]=n[1],t[4]=n[4],t[5]=n[7],t[6]=n[2],t[7]=n[5],t[8]=n[8];return t},invert:function(t,n){var a=n[0],r=n[1],e=n[2],u=n[3],o=n[4],i=n[5],h=n[6],c=n[7],s=n[8],M=s*o-i*c,f=-s*u+i*h,l=c*u-o*h,v=a*M+r*f+e*l;return v?(v=1/v,t[0]=M*v,t[1]=(-s*r+e*c)*v,t[2]=(i*r-e*o)*v,t[3]=f*v,t[4]=(s*a-e*h)*v,t[5]=(-i*a+e*u)*v,t[6]=l*v,t[7]=(-c*a+r*h)*v,t[8]=(o*a-r*u)*v,t):null},adjoint:function(t,n){var a=n[0],r=n[1],e=n[2],u=n[3],o=n[4],i=n[5],h=n[6],c=n[7],s=n[8];return t[0]=o*s-i*c,t[1]=e*c-r*s,t[2]=r*i-e*o,t[3]=i*h-u*s,t[4]=a*s-e*h,t[5]=e*u-a*i,t[6]=u*c-o*h,t[7]=r*h-a*c,t[8]=a*o-r*u,t},determinant:function(t){var n=t[0],a=t[1],r=t[2],e=t[3],u=t[4],o=t[5],i=t[6],h=t[7],c=t[8];return n*(c*u-o*h)+a*(-c*e+o*i)+r*(h*e-u*i)},multiply:m,translate:function(t,n,a){var r=n[0],e=n[1],u=n[2],o=n[3],i=n[4],h=n[5],c=n[6],s=n[7],M=n[8],f=a[0],l=a[1];return t[0]=r,t[1]=e,t[2]=u,t[3]=o,t[4]=i,t[5]=h,t[6]=f*r+l*o+c,t[7]=f*e+l*i+s,t[8]=f*u+l*h+M,t},rotate:function(t,n,a){var r=n[0],e=n[1],u=n[2],o=n[3],i=n[4],h=n[5],c=n[6],s=n[7],M=n[8],f=Math.sin(a),l=Math.cos(a);return t[0]=l*r+f*o,t[1]=l*e+f*i,t[2]=l*u+f*h,t[3]=l*o-f*r,t[4]=l*i-f*e,t[5]=l*h-f*u,t[6]=c,t[7]=s,t[8]=M,t},scale:function(t,n,a){var r=a[0],e=a[1];return t[0]=r*n[0],t[1]=r*n[1],t[2]=r*n[2],t[3]=e*n[3],t[4]=e*n[4],t[5]=e*n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t},fromTranslation:function(t,n){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=1,t[5]=0,t[6]=n[0],t[7]=n[1],t[8]=1,t},fromRotation:function(t,n){var a=Math.sin(n),r=Math.cos(n);return t[0]=r,t[1]=a,t[2]=0,t[3]=-a,t[4]=r,t[5]=0,t[6]=0,t[7]=0,t[8]=1,t},fromScaling:function(t,n){return t[0]=n[0],t[1]=0,t[2]=0,t[3]=0,t[4]=n[1],t[5]=0,t[6]=0,t[7]=0,t[8]=1,t},fromMat2d:function(t,n){return t[0]=n[0],t[1]=n[1],t[2]=0,t[3]=n[2],t[4]=n[3],t[5]=0,t[6]=n[4],t[7]=n[5],t[8]=1,t},fromQuat:function(t,n){var a=n[0],r=n[1],e=n[2],u=n[3],o=a+a,i=r+r,h=e+e,c=a*o,s=r*o,M=r*i,f=e*o,l=e*i,v=e*h,b=u*o,m=u*i,d=u*h;return t[0]=1-M-v,t[3]=s-d,t[6]=f+m,t[1]=s+d,t[4]=1-c-v,t[7]=l-b,t[2]=f-m,t[5]=l+b,t[8]=1-c-M,t},normalFromMat4:function(t,n){var a=n[0],r=n[1],e=n[2],u=n[3],o=n[4],i=n[5],h=n[6],c=n[7],s=n[8],M=n[9],f=n[10],l=n[11],v=n[12],b=n[13],m=n[14],d=n[15],p=a*i-r*o,x=a*h-e*o,y=a*c-u*o,q=r*h-e*i,g=r*c-u*i,_=e*c-u*h,A=s*b-M*v,w=s*m-f*v,R=s*d-l*v,z=M*m-f*b,j=M*d-l*b,P=f*d-l*m,S=p*P-x*j+y*z+q*R-g*w+_*A;return S?(S=1/S,t[0]=(i*P-h*j+c*z)*S,t[1]=(h*R-o*P-c*w)*S,t[2]=(o*j-i*R+c*A)*S,t[3]=(e*j-r*P-u*z)*S,t[4]=(a*P-e*R+u*w)*S,t[5]=(r*R-a*j-u*A)*S,t[6]=(b*_-m*g+d*q)*S,t[7]=(m*y-v*_-d*x)*S,t[8]=(v*g-b*y+d*p)*S,t):null},projection:function(t,n,a){return t[0]=2/n,t[1]=0,t[2]=0,t[3]=0,t[4]=-2/a,t[5]=0,t[6]=-1,t[7]=1,t[8]=1,t},str:function(t){return"mat3("+t[0]+", "+t[1]+", "+t[2]+", "+t[3]+", "+t[4]+", "+t[5]+", "+t[6]+", "+t[7]+", "+t[8]+")"},frob:function(t){return Math.hypot(t[0],t[1],t[2],t[3],t[4],t[5],t[6],t[7],t[8])},add:function(t,n,a){return t[0]=n[0]+a[0],t[1]=n[1]+a[1],t[2]=n[2]+a[2],t[3]=n[3]+a[3],t[4]=n[4]+a[4],t[5]=n[5]+a[5],t[6]=n[6]+a[6],t[7]=n[7]+a[7],t[8]=n[8]+a[8],t},subtract:d,multiplyScalar:function(t,n,a){return t[0]=n[0]*a,t[1]=n[1]*a,t[2]=n[2]*a,t[3]=n[3]*a,t[4]=n[4]*a,t[5]=n[5]*a,t[6]=n[6]*a,t[7]=n[7]*a,t[8]=n[8]*a,t},multiplyScalarAndAdd:function(t,n,a,r){return t[0]=n[0]+a[0]*r,t[1]=n[1]+a[1]*r,t[2]=n[2]+a[2]*r,t[3]=n[3]+a[3]*r,t[4]=n[4]+a[4]*r,t[5]=n[5]+a[5]*r,t[6]=n[6]+a[6]*r,t[7]=n[7]+a[7]*r,t[8]=n[8]+a[8]*r,t},exactEquals:function(t,n){return t[0]===n[0]&&t[1]===n[1]&&t[2]===n[2]&&t[3]===n[3]&&t[4]===n[4]&&t[5]===n[5]&&t[6]===n[6]&&t[7]===n[7]&&t[8]===n[8]},equals:function(t,n){var a=t[0],r=t[1],e=t[2],u=t[3],o=t[4],i=t[5],h=t[6],c=t[7],s=t[8],M=n[0],f=n[1],l=n[2],v=n[3],b=n[4],m=n[5],d=n[6],p=n[7],x=n[8];return Math.abs(a-M)<=1e-6*Math.max(1,Math.abs(a),Math.abs(M))&&Math.abs(r-f)<=1e-6*Math.max(1,Math.abs(r),Math.abs(f))&&Math.abs(e-l)<=1e-6*Math.max(1,Math.abs(e),Math.abs(l))&&Math.abs(u-v)<=1e-6*Math.max(1,Math.abs(u),Math.abs(v))&&Math.abs(o-b)<=1e-6*Math.max(1,Math.abs(o),Math.abs(b))&&Math.abs(i-m)<=1e-6*Math.max(1,Math.abs(i),Math.abs(m))&&Math.abs(h-d)<=1e-6*Math.max(1,Math.abs(h),Math.abs(d))&&Math.abs(c-p)<=1e-6*Math.max(1,Math.abs(c),Math.abs(p))&&Math.abs(s-x)<=1e-6*Math.max(1,Math.abs(s),Math.abs(x))},mul:p,sub:x});function q(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function g(t,n,a){var r=n[0],e=n[1],u=n[2],o=n[3],i=n[4],h=n[5],c=n[6],s=n[7],M=n[8],f=n[9],l=n[10],v=n[11],b=n[12],m=n[13],d=n[14],p=n[15],x=a[0],y=a[1],q=a[2],g=a[3];return t[0]=x*r+y*i+q*M+g*b,t[1]=x*e+y*h+q*f+g*m,t[2]=x*u+y*c+q*l+g*d,t[3]=x*o+y*s+q*v+g*p,x=a[4],y=a[5],q=a[6],g=a[7],t[4]=x*r+y*i+q*M+g*b,t[5]=x*e+y*h+q*f+g*m,t[6]=x*u+y*c+q*l+g*d,t[7]=x*o+y*s+q*v+g*p,x=a[8],y=a[9],q=a[10],g=a[11],t[8]=x*r+y*i+q*M+g*b,t[9]=x*e+y*h+q*f+g*m,t[10]=x*u+y*c+q*l+g*d,t[11]=x*o+y*s+q*v+g*p,x=a[12],y=a[13],q=a[14],g=a[15],t[12]=x*r+y*i+q*M+g*b,t[13]=x*e+y*h+q*f+g*m,t[14]=x*u+y*c+q*l+g*d,t[15]=x*o+y*s+q*v+g*p,t}function _(t,n,a){var r=n[0],e=n[1],u=n[2],o=n[3],i=r+r,h=e+e,c=u+u,s=r*i,M=r*h,f=r*c,l=e*h,v=e*c,b=u*c,m=o*i,d=o*h,p=o*c;return t[0]=1-(l+b),t[1]=M+p,t[2]=f-d,t[3]=0,t[4]=M-p,t[5]=1-(s+b),t[6]=v+m,t[7]=0,t[8]=f+d,t[9]=v-m,t[10]=1-(s+l),t[11]=0,t[12]=a[0],t[13]=a[1],t[14]=a[2],t[15]=1,t}function A(t,n){return t[0]=n[12],t[1]=n[13],t[2]=n[14],t}function w(t,n){var a=n[0],r=n[1],e=n[2],u=n[4],o=n[5],i=n[6],h=n[8],c=n[9],s=n[10];return t[0]=Math.hypot(a,r,e),t[1]=Math.hypot(u,o,i),t[2]=Math.hypot(h,c,s),t}function R(t,a){var r=new n(3);w(r,a);var e=1/r[0],u=1/r[1],o=1/r[2],i=a[0]*e,h=a[1]*u,c=a[2]*o,s=a[4]*e,M=a[5]*u,f=a[6]*o,l=a[8]*e,v=a[9]*u,b=a[10]*o,m=i+M+b,d=0;return m>0?(d=2*Math.sqrt(m+1),t[3]=.25*d,t[0]=(f-v)/d,t[1]=(l-c)/d,t[2]=(h-s)/d):i>M&&i>b?(d=2*Math.sqrt(1+i-M-b),t[3]=(f-v)/d,t[0]=.25*d,t[1]=(h+s)/d,t[2]=(l+c)/d):M>b?(d=2*Math.sqrt(1+M-i-b),t[3]=(l-c)/d,t[0]=(h+s)/d,t[1]=.25*d,t[2]=(f+v)/d):(d=2*Math.sqrt(1+b-i-M),t[3]=(h-s)/d,t[0]=(l+c)/d,t[1]=(f+v)/d,t[2]=.25*d),t}function z(t,n,a){return t[0]=n[0]-a[0],t[1]=n[1]-a[1],t[2]=n[2]-a[2],t[3]=n[3]-a[3],t[4]=n[4]-a[4],t[5]=n[5]-a[5],t[6]=n[6]-a[6],t[7]=n[7]-a[7],t[8]=n[8]-a[8],t[9]=n[9]-a[9],t[10]=n[10]-a[10],t[11]=n[11]-a[11],t[12]=n[12]-a[12],t[13]=n[13]-a[13],t[14]=n[14]-a[14],t[15]=n[15]-a[15],t}var j=g,P=z,S=Object.freeze({__proto__:null,create:function(){var t=new n(16);return n!=Float32Array&&(t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0),t[0]=1,t[5]=1,t[10]=1,t[15]=1,t},clone:function(t){var a=new n(16);return a[0]=t[0],a[1]=t[1],a[2]=t[2],a[3]=t[3],a[4]=t[4],a[5]=t[5],a[6]=t[6],a[7]=t[7],a[8]=t[8],a[9]=t[9],a[10]=t[10],a[11]=t[11],a[12]=t[12],a[13]=t[13],a[14]=t[14],a[15]=t[15],a},copy:function(t,n){return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],t},fromValues:function(t,a,r,e,u,o,i,h,c,s,M,f,l,v,b,m){var d=new n(16);return d[0]=t,d[1]=a,d[2]=r,d[3]=e,d[4]=u,d[5]=o,d[6]=i,d[7]=h,d[8]=c,d[9]=s,d[10]=M,d[11]=f,d[12]=l,d[13]=v,d[14]=b,d[15]=m,d},set:function(t,n,a,r,e,u,o,i,h,c,s,M,f,l,v,b,m){return t[0]=n,t[1]=a,t[2]=r,t[3]=e,t[4]=u,t[5]=o,t[6]=i,t[7]=h,t[8]=c,t[9]=s,t[10]=M,t[11]=f,t[12]=l,t[13]=v,t[14]=b,t[15]=m,t},identity:q,transpose:function(t,n){if(t===n){var a=n[1],r=n[2],e=n[3],u=n[6],o=n[7],i=n[11];t[1]=n[4],t[2]=n[8],t[3]=n[12],t[4]=a,t[6]=n[9],t[7]=n[13],t[8]=r,t[9]=u,t[11]=n[14],t[12]=e,t[13]=o,t[14]=i}else t[0]=n[0],t[1]=n[4],t[2]=n[8],t[3]=n[12],t[4]=n[1],t[5]=n[5],t[6]=n[9],t[7]=n[13],t[8]=n[2],t[9]=n[6],t[10]=n[10],t[11]=n[14],t[12]=n[3],t[13]=n[7],t[14]=n[11],t[15]=n[15];return t},invert:function(t,n){var a=n[0],r=n[1],e=n[2],u=n[3],o=n[4],i=n[5],h=n[6],c=n[7],s=n[8],M=n[9],f=n[10],l=n[11],v=n[12],b=n[13],m=n[14],d=n[15],p=a*i-r*o,x=a*h-e*o,y=a*c-u*o,q=r*h-e*i,g=r*c-u*i,_=e*c-u*h,A=s*b-M*v,w=s*m-f*v,R=s*d-l*v,z=M*m-f*b,j=M*d-l*b,P=f*d-l*m,S=p*P-x*j+y*z+q*R-g*w+_*A;return S?(S=1/S,t[0]=(i*P-h*j+c*z)*S,t[1]=(e*j-r*P-u*z)*S,t[2]=(b*_-m*g+d*q)*S,t[3]=(f*g-M*_-l*q)*S,t[4]=(h*R-o*P-c*w)*S,t[5]=(a*P-e*R+u*w)*S,t[6]=(m*y-v*_-d*x)*S,t[7]=(s*_-f*y+l*x)*S,t[8]=(o*j-i*R+c*A)*S,t[9]=(r*R-a*j-u*A)*S,t[10]=(v*g-b*y+d*p)*S,t[11]=(M*y-s*g-l*p)*S,t[12]=(i*w-o*z-h*A)*S,t[13]=(a*z-r*w+e*A)*S,t[14]=(b*x-v*q-m*p)*S,t[15]=(s*q-M*x+f*p)*S,t):null},adjoint:function(t,n){var a=n[0],r=n[1],e=n[2],u=n[3],o=n[4],i=n[5],h=n[6],c=n[7],s=n[8],M=n[9],f=n[10],l=n[11],v=n[12],b=n[13],m=n[14],d=n[15];return t[0]=i*(f*d-l*m)-M*(h*d-c*m)+b*(h*l-c*f),t[1]=-(r*(f*d-l*m)-M*(e*d-u*m)+b*(e*l-u*f)),t[2]=r*(h*d-c*m)-i*(e*d-u*m)+b*(e*c-u*h),t[3]=-(r*(h*l-c*f)-i*(e*l-u*f)+M*(e*c-u*h)),t[4]=-(o*(f*d-l*m)-s*(h*d-c*m)+v*(h*l-c*f)),t[5]=a*(f*d-l*m)-s*(e*d-u*m)+v*(e*l-u*f),t[6]=-(a*(h*d-c*m)-o*(e*d-u*m)+v*(e*c-u*h)),t[7]=a*(h*l-c*f)-o*(e*l-u*f)+s*(e*c-u*h),t[8]=o*(M*d-l*b)-s*(i*d-c*b)+v*(i*l-c*M),t[9]=-(a*(M*d-l*b)-s*(r*d-u*b)+v*(r*l-u*M)),t[10]=a*(i*d-c*b)-o*(r*d-u*b)+v*(r*c-u*i),t[11]=-(a*(i*l-c*M)-o*(r*l-u*M)+s*(r*c-u*i)),t[12]=-(o*(M*m-f*b)-s*(i*m-h*b)+v*(i*f-h*M)),t[13]=a*(M*m-f*b)-s*(r*m-e*b)+v*(r*f-e*M),t[14]=-(a*(i*m-h*b)-o*(r*m-e*b)+v*(r*h-e*i)),t[15]=a*(i*f-h*M)-o*(r*f-e*M)+s*(r*h-e*i),t},determinant:function(t){var n=t[0],a=t[1],r=t[2],e=t[3],u=t[4],o=t[5],i=t[6],h=t[7],c=t[8],s=t[9],M=t[10],f=t[11],l=t[12],v=t[13],b=t[14],m=t[15];return(n*o-a*u)*(M*m-f*b)-(n*i-r*u)*(s*m-f*v)+(n*h-e*u)*(s*b-M*v)+(a*i-r*o)*(c*m-f*l)-(a*h-e*o)*(c*b-M*l)+(r*h-e*i)*(c*v-s*l)},multiply:g,translate:function(t,n,a){var r,e,u,o,i,h,c,s,M,f,l,v,b=a[0],m=a[1],d=a[2];return n===t?(t[12]=n[0]*b+n[4]*m+n[8]*d+n[12],t[13]=n[1]*b+n[5]*m+n[9]*d+n[13],t[14]=n[2]*b+n[6]*m+n[10]*d+n[14],t[15]=n[3]*b+n[7]*m+n[11]*d+n[15]):(r=n[0],e=n[1],u=n[2],o=n[3],i=n[4],h=n[5],c=n[6],s=n[7],M=n[8],f=n[9],l=n[10],v=n[11],t[0]=r,t[1]=e,t[2]=u,t[3]=o,t[4]=i,t[5]=h,t[6]=c,t[7]=s,t[8]=M,t[9]=f,t[10]=l,t[11]=v,t[12]=r*b+i*m+M*d+n[12],t[13]=e*b+h*m+f*d+n[13],t[14]=u*b+c*m+l*d+n[14],t[15]=o*b+s*m+v*d+n[15]),t},scale:function(t,n,a){var r=a[0],e=a[1],u=a[2];return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=n[3]*r,t[4]=n[4]*e,t[5]=n[5]*e,t[6]=n[6]*e,t[7]=n[7]*e,t[8]=n[8]*u,t[9]=n[9]*u,t[10]=n[10]*u,t[11]=n[11]*u,t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],t},rotate:function(t,n,a,r){var e,u,o,i,h,c,s,M,f,l,v,b,m,d,p,x,y,q,g,_,A,w,R,z,j=r[0],P=r[1],S=r[2],E=Math.hypot(j,P,S);return E<1e-6?null:(j*=E=1/E,P*=E,S*=E,e=Math.sin(a),o=1-(u=Math.cos(a)),i=n[0],h=n[1],c=n[2],s=n[3],M=n[4],f=n[5],l=n[6],v=n[7],b=n[8],m=n[9],d=n[10],p=n[11],x=j*j*o+u,y=P*j*o+S*e,q=S*j*o-P*e,g=j*P*o-S*e,_=P*P*o+u,A=S*P*o+j*e,w=j*S*o+P*e,R=P*S*o-j*e,z=S*S*o+u,t[0]=i*x+M*y+b*q,t[1]=h*x+f*y+m*q,t[2]=c*x+l*y+d*q,t[3]=s*x+v*y+p*q,t[4]=i*g+M*_+b*A,t[5]=h*g+f*_+m*A,t[6]=c*g+l*_+d*A,t[7]=s*g+v*_+p*A,t[8]=i*w+M*R+b*z,t[9]=h*w+f*R+m*z,t[10]=c*w+l*R+d*z,t[11]=s*w+v*R+p*z,n!==t&&(t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15]),t)},rotateX:function(t,n,a){var r=Math.sin(a),e=Math.cos(a),u=n[4],o=n[5],i=n[6],h=n[7],c=n[8],s=n[9],M=n[10],f=n[11];return n!==t&&(t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15]),t[4]=u*e+c*r,t[5]=o*e+s*r,t[6]=i*e+M*r,t[7]=h*e+f*r,t[8]=c*e-u*r,t[9]=s*e-o*r,t[10]=M*e-i*r,t[11]=f*e-h*r,t},rotateY:function(t,n,a){var r=Math.sin(a),e=Math.cos(a),u=n[0],o=n[1],i=n[2],h=n[3],c=n[8],s=n[9],M=n[10],f=n[11];return n!==t&&(t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15]),t[0]=u*e-c*r,t[1]=o*e-s*r,t[2]=i*e-M*r,t[3]=h*e-f*r,t[8]=u*r+c*e,t[9]=o*r+s*e,t[10]=i*r+M*e,t[11]=h*r+f*e,t},rotateZ:function(t,n,a){var r=Math.sin(a),e=Math.cos(a),u=n[0],o=n[1],i=n[2],h=n[3],c=n[4],s=n[5],M=n[6],f=n[7];return n!==t&&(t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15]),t[0]=u*e+c*r,t[1]=o*e+s*r,t[2]=i*e+M*r,t[3]=h*e+f*r,t[4]=c*e-u*r,t[5]=s*e-o*r,t[6]=M*e-i*r,t[7]=f*e-h*r,t},fromTranslation:function(t,n){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=n[0],t[13]=n[1],t[14]=n[2],t[15]=1,t},fromScaling:function(t,n){return t[0]=n[0],t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=n[1],t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=n[2],t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t},fromRotation:function(t,n,a){var r,e,u,o=a[0],i=a[1],h=a[2],c=Math.hypot(o,i,h);return c<1e-6?null:(o*=c=1/c,i*=c,h*=c,r=Math.sin(n),u=1-(e=Math.cos(n)),t[0]=o*o*u+e,t[1]=i*o*u+h*r,t[2]=h*o*u-i*r,t[3]=0,t[4]=o*i*u-h*r,t[5]=i*i*u+e,t[6]=h*i*u+o*r,t[7]=0,t[8]=o*h*u+i*r,t[9]=i*h*u-o*r,t[10]=h*h*u+e,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t)},fromXRotation:function(t,n){var a=Math.sin(n),r=Math.cos(n);return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=r,t[6]=a,t[7]=0,t[8]=0,t[9]=-a,t[10]=r,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t},fromYRotation:function(t,n){var a=Math.sin(n),r=Math.cos(n);return t[0]=r,t[1]=0,t[2]=-a,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=a,t[9]=0,t[10]=r,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t},fromZRotation:function(t,n){var a=Math.sin(n),r=Math.cos(n);return t[0]=r,t[1]=a,t[2]=0,t[3]=0,t[4]=-a,t[5]=r,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t},fromRotationTranslation:_,fromQuat2:function(t,a){var r=new n(3),e=-a[0],u=-a[1],o=-a[2],i=a[3],h=a[4],c=a[5],s=a[6],M=a[7],f=e*e+u*u+o*o+i*i;return f>0?(r[0]=2*(h*i+M*e+c*o-s*u)/f,r[1]=2*(c*i+M*u+s*e-h*o)/f,r[2]=2*(s*i+M*o+h*u-c*e)/f):(r[0]=2*(h*i+M*e+c*o-s*u),r[1]=2*(c*i+M*u+s*e-h*o),r[2]=2*(s*i+M*o+h*u-c*e)),_(t,a,r),t},getTranslation:A,getScaling:w,getRotation:R,fromRotationTranslationScale:function(t,n,a,r){var e=n[0],u=n[1],o=n[2],i=n[3],h=e+e,c=u+u,s=o+o,M=e*h,f=e*c,l=e*s,v=u*c,b=u*s,m=o*s,d=i*h,p=i*c,x=i*s,y=r[0],q=r[1],g=r[2];return t[0]=(1-(v+m))*y,t[1]=(f+x)*y,t[2]=(l-p)*y,t[3]=0,t[4]=(f-x)*q,t[5]=(1-(M+m))*q,t[6]=(b+d)*q,t[7]=0,t[8]=(l+p)*g,t[9]=(b-d)*g,t[10]=(1-(M+v))*g,t[11]=0,t[12]=a[0],t[13]=a[1],t[14]=a[2],t[15]=1,t},fromRotationTranslationScaleOrigin:function(t,n,a,r,e){var u=n[0],o=n[1],i=n[2],h=n[3],c=u+u,s=o+o,M=i+i,f=u*c,l=u*s,v=u*M,b=o*s,m=o*M,d=i*M,p=h*c,x=h*s,y=h*M,q=r[0],g=r[1],_=r[2],A=e[0],w=e[1],R=e[2],z=(1-(b+d))*q,j=(l+y)*q,P=(v-x)*q,S=(l-y)*g,E=(1-(f+d))*g,O=(m+p)*g,T=(v+x)*_,D=(m-p)*_,F=(1-(f+b))*_;return t[0]=z,t[1]=j,t[2]=P,t[3]=0,t[4]=S,t[5]=E,t[6]=O,t[7]=0,t[8]=T,t[9]=D,t[10]=F,t[11]=0,t[12]=a[0]+A-(z*A+S*w+T*R),t[13]=a[1]+w-(j*A+E*w+D*R),t[14]=a[2]+R-(P*A+O*w+F*R),t[15]=1,t},fromQuat:function(t,n){var a=n[0],r=n[1],e=n[2],u=n[3],o=a+a,i=r+r,h=e+e,c=a*o,s=r*o,M=r*i,f=e*o,l=e*i,v=e*h,b=u*o,m=u*i,d=u*h;return t[0]=1-M-v,t[1]=s+d,t[2]=f-m,t[3]=0,t[4]=s-d,t[5]=1-c-v,t[6]=l+b,t[7]=0,t[8]=f+m,t[9]=l-b,t[10]=1-c-M,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t},frustum:function(t,n,a,r,e,u,o){var i=1/(a-n),h=1/(e-r),c=1/(u-o);return t[0]=2*u*i,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=2*u*h,t[6]=0,t[7]=0,t[8]=(a+n)*i,t[9]=(e+r)*h,t[10]=(o+u)*c,t[11]=-1,t[12]=0,t[13]=0,t[14]=o*u*2*c,t[15]=0,t},perspective:function(t,n,a,r,e){var u,o=1/Math.tan(n/2);return t[0]=o/a,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=o,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=-1,t[12]=0,t[13]=0,t[15]=0,null!=e&&e!==1/0?(u=1/(r-e),t[10]=(e+r)*u,t[14]=2*e*r*u):(t[10]=-1,t[14]=-2*r),t},perspectiveFromFieldOfView:function(t,n,a,r){var e=Math.tan(n.upDegrees*Math.PI/180),u=Math.tan(n.downDegrees*Math.PI/180),o=Math.tan(n.leftDegrees*Math.PI/180),i=Math.tan(n.rightDegrees*Math.PI/180),h=2/(o+i),c=2/(e+u);return t[0]=h,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=c,t[6]=0,t[7]=0,t[8]=-(o-i)*h*.5,t[9]=(e-u)*c*.5,t[10]=r/(a-r),t[11]=-1,t[12]=0,t[13]=0,t[14]=r*a/(a-r),t[15]=0,t},ortho:function(t,n,a,r,e,u,o){var i=1/(n-a),h=1/(r-e),c=1/(u-o);return t[0]=-2*i,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=-2*h,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=2*c,t[11]=0,t[12]=(n+a)*i,t[13]=(e+r)*h,t[14]=(o+u)*c,t[15]=1,t},lookAt:function(t,n,a,r){var e,u,o,i,h,c,s,M,f,l,v=n[0],b=n[1],m=n[2],d=r[0],p=r[1],x=r[2],y=a[0],g=a[1],_=a[2];return Math.abs(v-y)<1e-6&&Math.abs(b-g)<1e-6&&Math.abs(m-_)<1e-6?q(t):(s=v-y,M=b-g,f=m-_,e=p*(f*=l=1/Math.hypot(s,M,f))-x*(M*=l),u=x*(s*=l)-d*f,o=d*M-p*s,(l=Math.hypot(e,u,o))?(e*=l=1/l,u*=l,o*=l):(e=0,u=0,o=0),i=M*o-f*u,h=f*e-s*o,c=s*u-M*e,(l=Math.hypot(i,h,c))?(i*=l=1/l,h*=l,c*=l):(i=0,h=0,c=0),t[0]=e,t[1]=i,t[2]=s,t[3]=0,t[4]=u,t[5]=h,t[6]=M,t[7]=0,t[8]=o,t[9]=c,t[10]=f,t[11]=0,t[12]=-(e*v+u*b+o*m),t[13]=-(i*v+h*b+c*m),t[14]=-(s*v+M*b+f*m),t[15]=1,t)},targetTo:function(t,n,a,r){var e=n[0],u=n[1],o=n[2],i=r[0],h=r[1],c=r[2],s=e-a[0],M=u-a[1],f=o-a[2],l=s*s+M*M+f*f;l>0&&(s*=l=1/Math.sqrt(l),M*=l,f*=l);var v=h*f-c*M,b=c*s-i*f,m=i*M-h*s;return(l=v*v+b*b+m*m)>0&&(v*=l=1/Math.sqrt(l),b*=l,m*=l),t[0]=v,t[1]=b,t[2]=m,t[3]=0,t[4]=M*m-f*b,t[5]=f*v-s*m,t[6]=s*b-M*v,t[7]=0,t[8]=s,t[9]=M,t[10]=f,t[11]=0,t[12]=e,t[13]=u,t[14]=o,t[15]=1,t},str:function(t){return"mat4("+t[0]+", "+t[1]+", "+t[2]+", "+t[3]+", "+t[4]+", "+t[5]+", "+t[6]+", "+t[7]+", "+t[8]+", "+t[9]+", "+t[10]+", "+t[11]+", "+t[12]+", "+t[13]+", "+t[14]+", "+t[15]+")"},frob:function(t){return Math.hypot(t[0],t[1],t[2],t[3],t[4],t[5],t[6],t[7],t[8],t[9],t[10],t[11],t[12],t[13],t[14],t[15])},add:function(t,n,a){return t[0]=n[0]+a[0],t[1]=n[1]+a[1],t[2]=n[2]+a[2],t[3]=n[3]+a[3],t[4]=n[4]+a[4],t[5]=n[5]+a[5],t[6]=n[6]+a[6],t[7]=n[7]+a[7],t[8]=n[8]+a[8],t[9]=n[9]+a[9],t[10]=n[10]+a[10],t[11]=n[11]+a[11],t[12]=n[12]+a[12],t[13]=n[13]+a[13],t[14]=n[14]+a[14],t[15]=n[15]+a[15],t},subtract:z,multiplyScalar:function(t,n,a){return t[0]=n[0]*a,t[1]=n[1]*a,t[2]=n[2]*a,t[3]=n[3]*a,t[4]=n[4]*a,t[5]=n[5]*a,t[6]=n[6]*a,t[7]=n[7]*a,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=n[11]*a,t[12]=n[12]*a,t[13]=n[13]*a,t[14]=n[14]*a,t[15]=n[15]*a,t},multiplyScalarAndAdd:function(t,n,a,r){return t[0]=n[0]+a[0]*r,t[1]=n[1]+a[1]*r,t[2]=n[2]+a[2]*r,t[3]=n[3]+a[3]*r,t[4]=n[4]+a[4]*r,t[5]=n[5]+a[5]*r,t[6]=n[6]+a[6]*r,t[7]=n[7]+a[7]*r,t[8]=n[8]+a[8]*r,t[9]=n[9]+a[9]*r,t[10]=n[10]+a[10]*r,t[11]=n[11]+a[11]*r,t[12]=n[12]+a[12]*r,t[13]=n[13]+a[13]*r,t[14]=n[14]+a[14]*r,t[15]=n[15]+a[15]*r,t},exactEquals:function(t,n){return t[0]===n[0]&&t[1]===n[1]&&t[2]===n[2]&&t[3]===n[3]&&t[4]===n[4]&&t[5]===n[5]&&t[6]===n[6]&&t[7]===n[7]&&t[8]===n[8]&&t[9]===n[9]&&t[10]===n[10]&&t[11]===n[11]&&t[12]===n[12]&&t[13]===n[13]&&t[14]===n[14]&&t[15]===n[15]},equals:function(t,n){var a=t[0],r=t[1],e=t[2],u=t[3],o=t[4],i=t[5],h=t[6],c=t[7],s=t[8],M=t[9],f=t[10],l=t[11],v=t[12],b=t[13],m=t[14],d=t[15],p=n[0],x=n[1],y=n[2],q=n[3],g=n[4],_=n[5],A=n[6],w=n[7],R=n[8],z=n[9],j=n[10],P=n[11],S=n[12],E=n[13],O=n[14],T=n[15];return Math.abs(a-p)<=1e-6*Math.max(1,Math.abs(a),Math.abs(p))&&Math.abs(r-x)<=1e-6*Math.max(1,Math.abs(r),Math.abs(x))&&Math.abs(e-y)<=1e-6*Math.max(1,Math.abs(e),Math.abs(y))&&Math.abs(u-q)<=1e-6*Math.max(1,Math.abs(u),Math.abs(q))&&Math.abs(o-g)<=1e-6*Math.max(1,Math.abs(o),Math.abs(g))&&Math.abs(i-_)<=1e-6*Math.max(1,Math.abs(i),Math.abs(_))&&Math.abs(h-A)<=1e-6*Math.max(1,Math.abs(h),Math.abs(A))&&Math.abs(c-w)<=1e-6*Math.max(1,Math.abs(c),Math.abs(w))&&Math.abs(s-R)<=1e-6*Math.max(1,Math.abs(s),Math.abs(R))&&Math.abs(M-z)<=1e-6*Math.max(1,Math.abs(M),Math.abs(z))&&Math.abs(f-j)<=1e-6*Math.max(1,Math.abs(f),Math.abs(j))&&Math.abs(l-P)<=1e-6*Math.max(1,Math.abs(l),Math.abs(P))&&Math.abs(v-S)<=1e-6*Math.max(1,Math.abs(v),Math.abs(S))&&Math.abs(b-E)<=1e-6*Math.max(1,Math.abs(b),Math.abs(E))&&Math.abs(m-O)<=1e-6*Math.max(1,Math.abs(m),Math.abs(O))&&Math.abs(d-T)<=1e-6*Math.max(1,Math.abs(d),Math.abs(T))},mul:j,sub:P});function E(){var t=new n(3);return n!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0),t}function O(t){var n=t[0],a=t[1],r=t[2];return Math.hypot(n,a,r)}function T(t,a,r){var e=new n(3);return e[0]=t,e[1]=a,e[2]=r,e}function D(t,n,a){return t[0]=n[0]-a[0],t[1]=n[1]-a[1],t[2]=n[2]-a[2],t}function F(t,n,a){return t[0]=n[0]*a[0],t[1]=n[1]*a[1],t[2]=n[2]*a[2],t}function I(t,n,a){return t[0]=n[0]/a[0],t[1]=n[1]/a[1],t[2]=n[2]/a[2],t}function L(t,n){var a=n[0]-t[0],r=n[1]-t[1],e=n[2]-t[2];return Math.hypot(a,r,e)}function V(t,n){var a=n[0]-t[0],r=n[1]-t[1],e=n[2]-t[2];return a*a+r*r+e*e}function Q(t){var n=t[0],a=t[1],r=t[2];return n*n+a*a+r*r}function Y(t,n){var a=n[0],r=n[1],e=n[2],u=a*a+r*r+e*e;return u>0&&(u=1/Math.sqrt(u)),t[0]=n[0]*u,t[1]=n[1]*u,t[2]=n[2]*u,t}function X(t,n){return t[0]*n[0]+t[1]*n[1]+t[2]*n[2]}function Z(t,n,a){var r=n[0],e=n[1],u=n[2],o=a[0],i=a[1],h=a[2];return t[0]=e*h-u*i,t[1]=u*o-r*h,t[2]=r*i-e*o,t}var B,N=D,k=F,U=I,W=L,C=V,G=O,H=Q,J=(B=E(),function(t,n,a,r,e,u){var o,i;for(n||(n=3),a||(a=0),i=r?Math.min(r*n+a,t.length):t.length,o=a;o<i;o+=n)B[0]=t[o],B[1]=t[o+1],B[2]=t[o+2],e(B,B,u),t[o]=B[0],t[o+1]=B[1],t[o+2]=B[2];return t}),K=Object.freeze({__proto__:null,create:E,clone:function(t){var a=new n(3);return a[0]=t[0],a[1]=t[1],a[2]=t[2],a},length:O,fromValues:T,copy:function(t,n){return t[0]=n[0],t[1]=n[1],t[2]=n[2],t},set:function(t,n,a,r){return t[0]=n,t[1]=a,t[2]=r,t},add:function(t,n,a){return t[0]=n[0]+a[0],t[1]=n[1]+a[1],t[2]=n[2]+a[2],t},subtract:D,multiply:F,divide:I,ceil:function(t,n){return t[0]=Math.ceil(n[0]),t[1]=Math.ceil(n[1]),t[2]=Math.ceil(n[2]),t},floor:function(t,n){return t[0]=Math.floor(n[0]),t[1]=Math.floor(n[1]),t[2]=Math.floor(n[2]),t},min:function(t,n,a){return t[0]=Math.min(n[0],a[0]),t[1]=Math.min(n[1],a[1]),t[2]=Math.min(n[2],a[2]),t},max:function(t,n,a){return t[0]=Math.max(n[0],a[0]),t[1]=Math.max(n[1],a[1]),t[2]=Math.max(n[2],a[2]),t},round:function(t,n){return t[0]=Math.round(n[0]),t[1]=Math.round(n[1]),t[2]=Math.round(n[2]),t},scale:function(t,n,a){return t[0]=n[0]*a,t[1]=n[1]*a,t[2]=n[2]*a,t},scaleAndAdd:function(t,n,a,r){return t[0]=n[0]+a[0]*r,t[1]=n[1]+a[1]*r,t[2]=n[2]+a[2]*r,t},distance:L,squaredDistance:V,squaredLength:Q,negate:function(t,n){return t[0]=-n[0],t[1]=-n[1],t[2]=-n[2],t},inverse:function(t,n){return t[0]=1/n[0],t[1]=1/n[1],t[2]=1/n[2],t},normalize:Y,dot:X,cross:Z,lerp:function(t,n,a,r){var e=n[0],u=n[1],o=n[2];return t[0]=e+r*(a[0]-e),t[1]=u+r*(a[1]-u),t[2]=o+r*(a[2]-o),t},hermite:function(t,n,a,r,e,u){var o=u*u,i=o*(2*u-3)+1,h=o*(u-2)+u,c=o*(u-1),s=o*(3-2*u);return t[0]=n[0]*i+a[0]*h+r[0]*c+e[0]*s,t[1]=n[1]*i+a[1]*h+r[1]*c+e[1]*s,t[2]=n[2]*i+a[2]*h+r[2]*c+e[2]*s,t},bezier:function(t,n,a,r,e,u){var o=1-u,i=o*o,h=u*u,c=i*o,s=3*u*i,M=3*h*o,f=h*u;return t[0]=n[0]*c+a[0]*s+r[0]*M+e[0]*f,t[1]=n[1]*c+a[1]*s+r[1]*M+e[1]*f,t[2]=n[2]*c+a[2]*s+r[2]*M+e[2]*f,t},random:function(t,n){n=n||1;var r=2*a()*Math.PI,e=2*a()-1,u=Math.sqrt(1-e*e)*n;return t[0]=Math.cos(r)*u,t[1]=Math.sin(r)*u,t[2]=e*n,t},transformMat4:function(t,n,a){var r=n[0],e=n[1],u=n[2],o=a[3]*r+a[7]*e+a[11]*u+a[15];return o=o||1,t[0]=(a[0]*r+a[4]*e+a[8]*u+a[12])/o,t[1]=(a[1]*r+a[5]*e+a[9]*u+a[13])/o,t[2]=(a[2]*r+a[6]*e+a[10]*u+a[14])/o,t},transformMat3:function(t,n,a){var r=n[0],e=n[1],u=n[2];return t[0]=r*a[0]+e*a[3]+u*a[6],t[1]=r*a[1]+e*a[4]+u*a[7],t[2]=r*a[2]+e*a[5]+u*a[8],t},transformQuat:function(t,n,a){var r=a[0],e=a[1],u=a[2],o=a[3],i=n[0],h=n[1],c=n[2],s=e*c-u*h,M=u*i-r*c,f=r*h-e*i,l=e*f-u*M,v=u*s-r*f,b=r*M-e*s,m=2*o;return s*=m,M*=m,f*=m,l*=2,v*=2,b*=2,t[0]=i+s+l,t[1]=h+M+v,t[2]=c+f+b,t},rotateX:function(t,n,a,r){var e=[],u=[];return e[0]=n[0]-a[0],e[1]=n[1]-a[1],e[2]=n[2]-a[2],u[0]=e[0],u[1]=e[1]*Math.cos(r)-e[2]*Math.sin(r),u[2]=e[1]*Math.sin(r)+e[2]*Math.cos(r),t[0]=u[0]+a[0],t[1]=u[1]+a[1],t[2]=u[2]+a[2],t},rotateY:function(t,n,a,r){var e=[],u=[];return e[0]=n[0]-a[0],e[1]=n[1]-a[1],e[2]=n[2]-a[2],u[0]=e[2]*Math.sin(r)+e[0]*Math.cos(r),u[1]=e[1],u[2]=e[2]*Math.cos(r)-e[0]*Math.sin(r),t[0]=u[0]+a[0],t[1]=u[1]+a[1],t[2]=u[2]+a[2],t},rotateZ:function(t,n,a,r){var e=[],u=[];return e[0]=n[0]-a[0],e[1]=n[1]-a[1],e[2]=n[2]-a[2],u[0]=e[0]*Math.cos(r)-e[1]*Math.sin(r),u[1]=e[0]*Math.sin(r)+e[1]*Math.cos(r),u[2]=e[2],t[0]=u[0]+a[0],t[1]=u[1]+a[1],t[2]=u[2]+a[2],t},angle:function(t,n){var a=t[0],r=t[1],e=t[2],u=n[0],o=n[1],i=n[2],h=Math.sqrt(a*a+r*r+e*e)*Math.sqrt(u*u+o*o+i*i),c=h&&X(t,n)/h;return Math.acos(Math.min(Math.max(c,-1),1))},zero:function(t){return t[0]=0,t[1]=0,t[2]=0,t},str:function(t){return"vec3("+t[0]+", "+t[1]+", "+t[2]+")"},exactEquals:function(t,n){return t[0]===n[0]&&t[1]===n[1]&&t[2]===n[2]},equals:function(t,n){var a=t[0],r=t[1],e=t[2],u=n[0],o=n[1],i=n[2];return Math.abs(a-u)<=1e-6*Math.max(1,Math.abs(a),Math.abs(u))&&Math.abs(r-o)<=1e-6*Math.max(1,Math.abs(r),Math.abs(o))&&Math.abs(e-i)<=1e-6*Math.max(1,Math.abs(e),Math.abs(i))},sub:N,mul:k,div:U,dist:W,sqrDist:C,len:G,sqrLen:H,forEach:J});function $(){var t=new n(4);return n!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0,t[3]=0),t}function tt(t){var a=new n(4);return a[0]=t[0],a[1]=t[1],a[2]=t[2],a[3]=t[3],a}function nt(t,a,r,e){var u=new n(4);return u[0]=t,u[1]=a,u[2]=r,u[3]=e,u}function at(t,n){return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t}function rt(t,n,a,r,e){return t[0]=n,t[1]=a,t[2]=r,t[3]=e,t}function et(t,n,a){return t[0]=n[0]+a[0],t[1]=n[1]+a[1],t[2]=n[2]+a[2],t[3]=n[3]+a[3],t}function ut(t,n,a){return t[0]=n[0]-a[0],t[1]=n[1]-a[1],t[2]=n[2]-a[2],t[3]=n[3]-a[3],t}function ot(t,n,a){return t[0]=n[0]*a[0],t[1]=n[1]*a[1],t[2]=n[2]*a[2],t[3]=n[3]*a[3],t}function it(t,n,a){return t[0]=n[0]/a[0],t[1]=n[1]/a[1],t[2]=n[2]/a[2],t[3]=n[3]/a[3],t}function ht(t,n,a){return t[0]=n[0]*a,t[1]=n[1]*a,t[2]=n[2]*a,t[3]=n[3]*a,t}function ct(t,n){var a=n[0]-t[0],r=n[1]-t[1],e=n[2]-t[2],u=n[3]-t[3];return Math.hypot(a,r,e,u)}function st(t,n){var a=n[0]-t[0],r=n[1]-t[1],e=n[2]-t[2],u=n[3]-t[3];return a*a+r*r+e*e+u*u}function Mt(t){var n=t[0],a=t[1],r=t[2],e=t[3];return Math.hypot(n,a,r,e)}function ft(t){var n=t[0],a=t[1],r=t[2],e=t[3];return n*n+a*a+r*r+e*e}function lt(t,n){var a=n[0],r=n[1],e=n[2],u=n[3],o=a*a+r*r+e*e+u*u;return o>0&&(o=1/Math.sqrt(o)),t[0]=a*o,t[1]=r*o,t[2]=e*o,t[3]=u*o,t}function vt(t,n){return t[0]*n[0]+t[1]*n[1]+t[2]*n[2]+t[3]*n[3]}function bt(t,n,a,r){var e=n[0],u=n[1],o=n[2],i=n[3];return t[0]=e+r*(a[0]-e),t[1]=u+r*(a[1]-u),t[2]=o+r*(a[2]-o),t[3]=i+r*(a[3]-i),t}function mt(t,n){return t[0]===n[0]&&t[1]===n[1]&&t[2]===n[2]&&t[3]===n[3]}function dt(t,n){var a=t[0],r=t[1],e=t[2],u=t[3],o=n[0],i=n[1],h=n[2],c=n[3];return Math.abs(a-o)<=1e-6*Math.max(1,Math.abs(a),Math.abs(o))&&Math.abs(r-i)<=1e-6*Math.max(1,Math.abs(r),Math.abs(i))&&Math.abs(e-h)<=1e-6*Math.max(1,Math.abs(e),Math.abs(h))&&Math.abs(u-c)<=1e-6*Math.max(1,Math.abs(u),Math.abs(c))}var pt=ut,xt=ot,yt=it,qt=ct,gt=st,_t=Mt,At=ft,wt=function(){var t=$();return function(n,a,r,e,u,o){var i,h;for(a||(a=4),r||(r=0),h=e?Math.min(e*a+r,n.length):n.length,i=r;i<h;i+=a)t[0]=n[i],t[1]=n[i+1],t[2]=n[i+2],t[3]=n[i+3],u(t,t,o),n[i]=t[0],n[i+1]=t[1],n[i+2]=t[2],n[i+3]=t[3];return n}}(),Rt=Object.freeze({__proto__:null,create:$,clone:tt,fromValues:nt,copy:at,set:rt,add:et,subtract:ut,multiply:ot,divide:it,ceil:function(t,n){return t[0]=Math.ceil(n[0]),t[1]=Math.ceil(n[1]),t[2]=Math.ceil(n[2]),t[3]=Math.ceil(n[3]),t},floor:function(t,n){return t[0]=Math.floor(n[0]),t[1]=Math.floor(n[1]),t[2]=Math.floor(n[2]),t[3]=Math.floor(n[3]),t},min:function(t,n,a){return t[0]=Math.min(n[0],a[0]),t[1]=Math.min(n[1],a[1]),t[2]=Math.min(n[2],a[2]),t[3]=Math.min(n[3],a[3]),t},max:function(t,n,a){return t[0]=Math.max(n[0],a[0]),t[1]=Math.max(n[1],a[1]),t[2]=Math.max(n[2],a[2]),t[3]=Math.max(n[3],a[3]),t},round:function(t,n){return t[0]=Math.round(n[0]),t[1]=Math.round(n[1]),t[2]=Math.round(n[2]),t[3]=Math.round(n[3]),t},scale:ht,scaleAndAdd:function(t,n,a,r){return t[0]=n[0]+a[0]*r,t[1]=n[1]+a[1]*r,t[2]=n[2]+a[2]*r,t[3]=n[3]+a[3]*r,t},distance:ct,squaredDistance:st,length:Mt,squaredLength:ft,negate:function(t,n){return t[0]=-n[0],t[1]=-n[1],t[2]=-n[2],t[3]=-n[3],t},inverse:function(t,n){return t[0]=1/n[0],t[1]=1/n[1],t[2]=1/n[2],t[3]=1/n[3],t},normalize:lt,dot:vt,cross:function(t,n,a,r){var e=a[0]*r[1]-a[1]*r[0],u=a[0]*r[2]-a[2]*r[0],o=a[0]*r[3]-a[3]*r[0],i=a[1]*r[2]-a[2]*r[1],h=a[1]*r[3]-a[3]*r[1],c=a[2]*r[3]-a[3]*r[2],s=n[0],M=n[1],f=n[2],l=n[3];return t[0]=M*c-f*h+l*i,t[1]=-s*c+f*o-l*u,t[2]=s*h-M*o+l*e,t[3]=-s*i+M*u-f*e,t},lerp:bt,random:function(t,n){var r,e,u,o,i,h;n=n||1;do{i=(r=2*a()-1)*r+(e=2*a()-1)*e}while(i>=1);do{h=(u=2*a()-1)*u+(o=2*a()-1)*o}while(h>=1);var c=Math.sqrt((1-i)/h);return t[0]=n*r,t[1]=n*e,t[2]=n*u*c,t[3]=n*o*c,t},transformMat4:function(t,n,a){var r=n[0],e=n[1],u=n[2],o=n[3];return t[0]=a[0]*r+a[4]*e+a[8]*u+a[12]*o,t[1]=a[1]*r+a[5]*e+a[9]*u+a[13]*o,t[2]=a[2]*r+a[6]*e+a[10]*u+a[14]*o,t[3]=a[3]*r+a[7]*e+a[11]*u+a[15]*o,t},transformQuat:function(t,n,a){var r=n[0],e=n[1],u=n[2],o=a[0],i=a[1],h=a[2],c=a[3],s=c*r+i*u-h*e,M=c*e+h*r-o*u,f=c*u+o*e-i*r,l=-o*r-i*e-h*u;return t[0]=s*c+l*-o+M*-h-f*-i,t[1]=M*c+l*-i+f*-o-s*-h,t[2]=f*c+l*-h+s*-i-M*-o,t[3]=n[3],t},zero:function(t){return t[0]=0,t[1]=0,t[2]=0,t[3]=0,t},str:function(t){return"vec4("+t[0]+", "+t[1]+", "+t[2]+", "+t[3]+")"},exactEquals:mt,equals:dt,sub:pt,mul:xt,div:yt,dist:qt,sqrDist:gt,len:_t,sqrLen:At,forEach:wt});function zt(){var t=new n(4);return n!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0),t[3]=1,t}function jt(t,n,a){a*=.5;var r=Math.sin(a);return t[0]=r*n[0],t[1]=r*n[1],t[2]=r*n[2],t[3]=Math.cos(a),t}function Pt(t,n,a){var r=n[0],e=n[1],u=n[2],o=n[3],i=a[0],h=a[1],c=a[2],s=a[3];return t[0]=r*s+o*i+e*c-u*h,t[1]=e*s+o*h+u*i-r*c,t[2]=u*s+o*c+r*h-e*i,t[3]=o*s-r*i-e*h-u*c,t}function St(t,n,a){a*=.5;var r=n[0],e=n[1],u=n[2],o=n[3],i=Math.sin(a),h=Math.cos(a);return t[0]=r*h+o*i,t[1]=e*h+u*i,t[2]=u*h-e*i,t[3]=o*h-r*i,t}function Et(t,n,a){a*=.5;var r=n[0],e=n[1],u=n[2],o=n[3],i=Math.sin(a),h=Math.cos(a);return t[0]=r*h-u*i,t[1]=e*h+o*i,t[2]=u*h+r*i,t[3]=o*h-e*i,t}function Ot(t,n,a){a*=.5;var r=n[0],e=n[1],u=n[2],o=n[3],i=Math.sin(a),h=Math.cos(a);return t[0]=r*h+e*i,t[1]=e*h-r*i,t[2]=u*h+o*i,t[3]=o*h-u*i,t}function Tt(t,n){var a=n[0],r=n[1],e=n[2],u=n[3],o=Math.sqrt(a*a+r*r+e*e),i=Math.exp(u),h=o>0?i*Math.sin(o)/o:0;return t[0]=a*h,t[1]=r*h,t[2]=e*h,t[3]=i*Math.cos(o),t}function Dt(t,n){var a=n[0],r=n[1],e=n[2],u=n[3],o=Math.sqrt(a*a+r*r+e*e),i=o>0?Math.atan2(o,u)/o:0;return t[0]=a*i,t[1]=r*i,t[2]=e*i,t[3]=.5*Math.log(a*a+r*r+e*e+u*u),t}function Ft(t,n,a,r){var e,u,o,i,h,c=n[0],s=n[1],M=n[2],f=n[3],l=a[0],v=a[1],b=a[2],m=a[3];return(u=c*l+s*v+M*b+f*m)<0&&(u=-u,l=-l,v=-v,b=-b,m=-m),1-u>1e-6?(e=Math.acos(u),o=Math.sin(e),i=Math.sin((1-r)*e)/o,h=Math.sin(r*e)/o):(i=1-r,h=r),t[0]=i*c+h*l,t[1]=i*s+h*v,t[2]=i*M+h*b,t[3]=i*f+h*m,t}function It(t,n){var a,r=n[0]+n[4]+n[8];if(r>0)a=Math.sqrt(r+1),t[3]=.5*a,a=.5/a,t[0]=(n[5]-n[7])*a,t[1]=(n[6]-n[2])*a,t[2]=(n[1]-n[3])*a;else{var e=0;n[4]>n[0]&&(e=1),n[8]>n[3*e+e]&&(e=2);var u=(e+1)%3,o=(e+2)%3;a=Math.sqrt(n[3*e+e]-n[3*u+u]-n[3*o+o]+1),t[e]=.5*a,a=.5/a,t[3]=(n[3*u+o]-n[3*o+u])*a,t[u]=(n[3*u+e]+n[3*e+u])*a,t[o]=(n[3*o+e]+n[3*e+o])*a}return t}var Lt,Vt,Qt,Yt,Xt,Zt,Bt=tt,Nt=nt,kt=at,Ut=rt,Wt=et,Ct=Pt,Gt=ht,Ht=vt,Jt=bt,Kt=Mt,$t=Kt,tn=ft,nn=tn,an=lt,rn=mt,en=dt,un=(Lt=E(),Vt=T(1,0,0),Qt=T(0,1,0),function(t,n,a){var r=X(n,a);return r<-.999999?(Z(Lt,Vt,n),G(Lt)<1e-6&&Z(Lt,Qt,n),Y(Lt,Lt),jt(t,Lt,Math.PI),t):r>.999999?(t[0]=0,t[1]=0,t[2]=0,t[3]=1,t):(Z(Lt,n,a),t[0]=Lt[0],t[1]=Lt[1],t[2]=Lt[2],t[3]=1+r,an(t,t))}),on=(Yt=zt(),Xt=zt(),function(t,n,a,r,e,u){return Ft(Yt,n,e,u),Ft(Xt,a,r,u),Ft(t,Yt,Xt,2*u*(1-u)),t}),hn=(Zt=b(),function(t,n,a,r){return Zt[0]=a[0],Zt[3]=a[1],Zt[6]=a[2],Zt[1]=r[0],Zt[4]=r[1],Zt[7]=r[2],Zt[2]=-n[0],Zt[5]=-n[1],Zt[8]=-n[2],an(t,It(t,Zt))}),cn=Object.freeze({__proto__:null,create:zt,identity:function(t){return t[0]=0,t[1]=0,t[2]=0,t[3]=1,t},setAxisAngle:jt,getAxisAngle:function(t,n){var a=2*Math.acos(n[3]),r=Math.sin(a/2);return r>1e-6?(t[0]=n[0]/r,t[1]=n[1]/r,t[2]=n[2]/r):(t[0]=1,t[1]=0,t[2]=0),a},getAngle:function(t,n){var a=Ht(t,n);return Math.acos(2*a*a-1)},multiply:Pt,rotateX:St,rotateY:Et,rotateZ:Ot,calculateW:function(t,n){var a=n[0],r=n[1],e=n[2];return t[0]=a,t[1]=r,t[2]=e,t[3]=Math.sqrt(Math.abs(1-a*a-r*r-e*e)),t},exp:Tt,ln:Dt,pow:function(t,n,a){return Dt(t,n),Gt(t,t,a),Tt(t,t),t},slerp:Ft,random:function(t){var n=a(),r=a(),e=a(),u=Math.sqrt(1-n),o=Math.sqrt(n);return t[0]=u*Math.sin(2*Math.PI*r),t[1]=u*Math.cos(2*Math.PI*r),t[2]=o*Math.sin(2*Math.PI*e),t[3]=o*Math.cos(2*Math.PI*e),t},invert:function(t,n){var a=n[0],r=n[1],e=n[2],u=n[3],o=a*a+r*r+e*e+u*u,i=o?1/o:0;return t[0]=-a*i,t[1]=-r*i,t[2]=-e*i,t[3]=u*i,t},conjugate:function(t,n){return t[0]=-n[0],t[1]=-n[1],t[2]=-n[2],t[3]=n[3],t},fromMat3:It,fromEuler:function(t,n,a,r){var e=.5*Math.PI/180;n*=e,a*=e,r*=e;var u=Math.sin(n),o=Math.cos(n),i=Math.sin(a),h=Math.cos(a),c=Math.sin(r),s=Math.cos(r);return t[0]=u*h*s-o*i*c,t[1]=o*i*s+u*h*c,t[2]=o*h*c-u*i*s,t[3]=o*h*s+u*i*c,t},str:function(t){return"quat("+t[0]+", "+t[1]+", "+t[2]+", "+t[3]+")"},clone:Bt,fromValues:Nt,copy:kt,set:Ut,add:Wt,mul:Ct,scale:Gt,dot:Ht,lerp:Jt,length:Kt,len:$t,squaredLength:tn,sqrLen:nn,normalize:an,exactEquals:rn,equals:en,rotationTo:un,sqlerp:on,setAxes:hn});function sn(t,n,a){var r=.5*a[0],e=.5*a[1],u=.5*a[2],o=n[0],i=n[1],h=n[2],c=n[3];return t[0]=o,t[1]=i,t[2]=h,t[3]=c,t[4]=r*c+e*h-u*i,t[5]=e*c+u*o-r*h,t[6]=u*c+r*i-e*o,t[7]=-r*o-e*i-u*h,t}function Mn(t,n){return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t}var fn=kt;var ln=kt;function vn(t,n,a){var r=n[0],e=n[1],u=n[2],o=n[3],i=a[4],h=a[5],c=a[6],s=a[7],M=n[4],f=n[5],l=n[6],v=n[7],b=a[0],m=a[1],d=a[2],p=a[3];return t[0]=r*p+o*b+e*d-u*m,t[1]=e*p+o*m+u*b-r*d,t[2]=u*p+o*d+r*m-e*b,t[3]=o*p-r*b-e*m-u*d,t[4]=r*s+o*i+e*c-u*h+M*p+v*b+f*d-l*m,t[5]=e*s+o*h+u*i-r*c+f*p+v*m+l*b-M*d,t[6]=u*s+o*c+r*h-e*i+l*p+v*d+M*m-f*b,t[7]=o*s-r*i-e*h-u*c+v*p-M*b-f*m-l*d,t}var bn=vn;var mn=Ht;var dn=Kt,pn=dn,xn=tn,yn=xn;var qn=Object.freeze({__proto__:null,create:function(){var t=new n(8);return n!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0,t[4]=0,t[5]=0,t[6]=0,t[7]=0),t[3]=1,t},clone:function(t){var a=new n(8);return a[0]=t[0],a[1]=t[1],a[2]=t[2],a[3]=t[3],a[4]=t[4],a[5]=t[5],a[6]=t[6],a[7]=t[7],a},fromValues:function(t,a,r,e,u,o,i,h){var c=new n(8);return c[0]=t,c[1]=a,c[2]=r,c[3]=e,c[4]=u,c[5]=o,c[6]=i,c[7]=h,c},fromRotationTranslationValues:function(t,a,r,e,u,o,i){var h=new n(8);h[0]=t,h[1]=a,h[2]=r,h[3]=e;var c=.5*u,s=.5*o,M=.5*i;return h[4]=c*e+s*r-M*a,h[5]=s*e+M*t-c*r,h[6]=M*e+c*a-s*t,h[7]=-c*t-s*a-M*r,h},fromRotationTranslation:sn,fromTranslation:function(t,n){return t[0]=0,t[1]=0,t[2]=0,t[3]=1,t[4]=.5*n[0],t[5]=.5*n[1],t[6]=.5*n[2],t[7]=0,t},fromRotation:function(t,n){return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=0,t[5]=0,t[6]=0,t[7]=0,t},fromMat4:function(t,a){var r=zt();R(r,a);var e=new n(3);return A(e,a),sn(t,r,e),t},copy:Mn,identity:function(t){return t[0]=0,t[1]=0,t[2]=0,t[3]=1,t[4]=0,t[5]=0,t[6]=0,t[7]=0,t},set:function(t,n,a,r,e,u,o,i,h){return t[0]=n,t[1]=a,t[2]=r,t[3]=e,t[4]=u,t[5]=o,t[6]=i,t[7]=h,t},getReal:fn,getDual:function(t,n){return t[0]=n[4],t[1]=n[5],t[2]=n[6],t[3]=n[7],t},setReal:ln,setDual:function(t,n){return t[4]=n[0],t[5]=n[1],t[6]=n[2],t[7]=n[3],t},getTranslation:function(t,n){var a=n[4],r=n[5],e=n[6],u=n[7],o=-n[0],i=-n[1],h=-n[2],c=n[3];return t[0]=2*(a*c+u*o+r*h-e*i),t[1]=2*(r*c+u*i+e*o-a*h),t[2]=2*(e*c+u*h+a*i-r*o),t},translate:function(t,n,a){var r=n[0],e=n[1],u=n[2],o=n[3],i=.5*a[0],h=.5*a[1],c=.5*a[2],s=n[4],M=n[5],f=n[6],l=n[7];return t[0]=r,t[1]=e,t[2]=u,t[3]=o,t[4]=o*i+e*c-u*h+s,t[5]=o*h+u*i-r*c+M,t[6]=o*c+r*h-e*i+f,t[7]=-r*i-e*h-u*c+l,t},rotateX:function(t,n,a){var r=-n[0],e=-n[1],u=-n[2],o=n[3],i=n[4],h=n[5],c=n[6],s=n[7],M=i*o+s*r+h*u-c*e,f=h*o+s*e+c*r-i*u,l=c*o+s*u+i*e-h*r,v=s*o-i*r-h*e-c*u;return St(t,n,a),r=t[0],e=t[1],u=t[2],o=t[3],t[4]=M*o+v*r+f*u-l*e,t[5]=f*o+v*e+l*r-M*u,t[6]=l*o+v*u+M*e-f*r,t[7]=v*o-M*r-f*e-l*u,t},rotateY:function(t,n,a){var r=-n[0],e=-n[1],u=-n[2],o=n[3],i=n[4],h=n[5],c=n[6],s=n[7],M=i*o+s*r+h*u-c*e,f=h*o+s*e+c*r-i*u,l=c*o+s*u+i*e-h*r,v=s*o-i*r-h*e-c*u;return Et(t,n,a),r=t[0],e=t[1],u=t[2],o=t[3],t[4]=M*o+v*r+f*u-l*e,t[5]=f*o+v*e+l*r-M*u,t[6]=l*o+v*u+M*e-f*r,t[7]=v*o-M*r-f*e-l*u,t},rotateZ:function(t,n,a){var r=-n[0],e=-n[1],u=-n[2],o=n[3],i=n[4],h=n[5],c=n[6],s=n[7],M=i*o+s*r+h*u-c*e,f=h*o+s*e+c*r-i*u,l=c*o+s*u+i*e-h*r,v=s*o-i*r-h*e-c*u;return Ot(t,n,a),r=t[0],e=t[1],u=t[2],o=t[3],t[4]=M*o+v*r+f*u-l*e,t[5]=f*o+v*e+l*r-M*u,t[6]=l*o+v*u+M*e-f*r,t[7]=v*o-M*r-f*e-l*u,t},rotateByQuatAppend:function(t,n,a){var r=a[0],e=a[1],u=a[2],o=a[3],i=n[0],h=n[1],c=n[2],s=n[3];return t[0]=i*o+s*r+h*u-c*e,t[1]=h*o+s*e+c*r-i*u,t[2]=c*o+s*u+i*e-h*r,t[3]=s*o-i*r-h*e-c*u,i=n[4],h=n[5],c=n[6],s=n[7],t[4]=i*o+s*r+h*u-c*e,t[5]=h*o+s*e+c*r-i*u,t[6]=c*o+s*u+i*e-h*r,t[7]=s*o-i*r-h*e-c*u,t},rotateByQuatPrepend:function(t,n,a){var r=n[0],e=n[1],u=n[2],o=n[3],i=a[0],h=a[1],c=a[2],s=a[3];return t[0]=r*s+o*i+e*c-u*h,t[1]=e*s+o*h+u*i-r*c,t[2]=u*s+o*c+r*h-e*i,t[3]=o*s-r*i-e*h-u*c,i=a[4],h=a[5],c=a[6],s=a[7],t[4]=r*s+o*i+e*c-u*h,t[5]=e*s+o*h+u*i-r*c,t[6]=u*s+o*c+r*h-e*i,t[7]=o*s-r*i-e*h-u*c,t},rotateAroundAxis:function(t,n,a,r){if(Math.abs(r)<1e-6)return Mn(t,n);var e=Math.hypot(a[0],a[1],a[2]);r*=.5;var u=Math.sin(r),o=u*a[0]/e,i=u*a[1]/e,h=u*a[2]/e,c=Math.cos(r),s=n[0],M=n[1],f=n[2],l=n[3];t[0]=s*c+l*o+M*h-f*i,t[1]=M*c+l*i+f*o-s*h,t[2]=f*c+l*h+s*i-M*o,t[3]=l*c-s*o-M*i-f*h;var v=n[4],b=n[5],m=n[6],d=n[7];return t[4]=v*c+d*o+b*h-m*i,t[5]=b*c+d*i+m*o-v*h,t[6]=m*c+d*h+v*i-b*o,t[7]=d*c-v*o-b*i-m*h,t},add:function(t,n,a){return t[0]=n[0]+a[0],t[1]=n[1]+a[1],t[2]=n[2]+a[2],t[3]=n[3]+a[3],t[4]=n[4]+a[4],t[5]=n[5]+a[5],t[6]=n[6]+a[6],t[7]=n[7]+a[7],t},multiply:vn,mul:bn,scale:function(t,n,a){return t[0]=n[0]*a,t[1]=n[1]*a,t[2]=n[2]*a,t[3]=n[3]*a,t[4]=n[4]*a,t[5]=n[5]*a,t[6]=n[6]*a,t[7]=n[7]*a,t},dot:mn,lerp:function(t,n,a,r){var e=1-r;return mn(n,a)<0&&(r=-r),t[0]=n[0]*e+a[0]*r,t[1]=n[1]*e+a[1]*r,t[2]=n[2]*e+a[2]*r,t[3]=n[3]*e+a[3]*r,t[4]=n[4]*e+a[4]*r,t[5]=n[5]*e+a[5]*r,t[6]=n[6]*e+a[6]*r,t[7]=n[7]*e+a[7]*r,t},invert:function(t,n){var a=xn(n);return t[0]=-n[0]/a,t[1]=-n[1]/a,t[2]=-n[2]/a,t[3]=n[3]/a,t[4]=-n[4]/a,t[5]=-n[5]/a,t[6]=-n[6]/a,t[7]=n[7]/a,t},conjugate:function(t,n){return t[0]=-n[0],t[1]=-n[1],t[2]=-n[2],t[3]=n[3],t[4]=-n[4],t[5]=-n[5],t[6]=-n[6],t[7]=n[7],t},length:dn,len:pn,squaredLength:xn,sqrLen:yn,normalize:function(t,n){var a=xn(n);if(a>0){a=Math.sqrt(a);var r=n[0]/a,e=n[1]/a,u=n[2]/a,o=n[3]/a,i=n[4],h=n[5],c=n[6],s=n[7],M=r*i+e*h+u*c+o*s;t[0]=r,t[1]=e,t[2]=u,t[3]=o,t[4]=(i-r*M)/a,t[5]=(h-e*M)/a,t[6]=(c-u*M)/a,t[7]=(s-o*M)/a}return t},str:function(t){return"quat2("+t[0]+", "+t[1]+", "+t[2]+", "+t[3]+", "+t[4]+", "+t[5]+", "+t[6]+", "+t[7]+")"},exactEquals:function(t,n){return t[0]===n[0]&&t[1]===n[1]&&t[2]===n[2]&&t[3]===n[3]&&t[4]===n[4]&&t[5]===n[5]&&t[6]===n[6]&&t[7]===n[7]},equals:function(t,n){var a=t[0],r=t[1],e=t[2],u=t[3],o=t[4],i=t[5],h=t[6],c=t[7],s=n[0],M=n[1],f=n[2],l=n[3],v=n[4],b=n[5],m=n[6],d=n[7];return Math.abs(a-s)<=1e-6*Math.max(1,Math.abs(a),Math.abs(s))&&Math.abs(r-M)<=1e-6*Math.max(1,Math.abs(r),Math.abs(M))&&Math.abs(e-f)<=1e-6*Math.max(1,Math.abs(e),Math.abs(f))&&Math.abs(u-l)<=1e-6*Math.max(1,Math.abs(u),Math.abs(l))&&Math.abs(o-v)<=1e-6*Math.max(1,Math.abs(o),Math.abs(v))&&Math.abs(i-b)<=1e-6*Math.max(1,Math.abs(i),Math.abs(b))&&Math.abs(h-m)<=1e-6*Math.max(1,Math.abs(h),Math.abs(m))&&Math.abs(c-d)<=1e-6*Math.max(1,Math.abs(c),Math.abs(d))}});function gn(){var t=new n(2);return n!=Float32Array&&(t[0]=0,t[1]=0),t}function _n(t,n,a){return t[0]=n[0]-a[0],t[1]=n[1]-a[1],t}function An(t,n,a){return t[0]=n[0]*a[0],t[1]=n[1]*a[1],t}function wn(t,n,a){return t[0]=n[0]/a[0],t[1]=n[1]/a[1],t}function Rn(t,n){var a=n[0]-t[0],r=n[1]-t[1];return Math.hypot(a,r)}function zn(t,n){var a=n[0]-t[0],r=n[1]-t[1];return a*a+r*r}function jn(t){var n=t[0],a=t[1];return Math.hypot(n,a)}function Pn(t){var n=t[0],a=t[1];return n*n+a*a}var Sn=jn,En=_n,On=An,Tn=wn,Dn=Rn,Fn=zn,In=Pn,Ln=function(){var t=gn();return function(n,a,r,e,u,o){var i,h;for(a||(a=2),r||(r=0),h=e?Math.min(e*a+r,n.length):n.length,i=r;i<h;i+=a)t[0]=n[i],t[1]=n[i+1],u(t,t,o),n[i]=t[0],n[i+1]=t[1];return n}}(),Vn=Object.freeze({__proto__:null,create:gn,clone:function(t){var a=new n(2);return a[0]=t[0],a[1]=t[1],a},fromValues:function(t,a){var r=new n(2);return r[0]=t,r[1]=a,r},copy:function(t,n){return t[0]=n[0],t[1]=n[1],t},set:function(t,n,a){return t[0]=n,t[1]=a,t},add:function(t,n,a){return t[0]=n[0]+a[0],t[1]=n[1]+a[1],t},subtract:_n,multiply:An,divide:wn,ceil:function(t,n){return t[0]=Math.ceil(n[0]),t[1]=Math.ceil(n[1]),t},floor:function(t,n){return t[0]=Math.floor(n[0]),t[1]=Math.floor(n[1]),t},min:function(t,n,a){return t[0]=Math.min(n[0],a[0]),t[1]=Math.min(n[1],a[1]),t},max:function(t,n,a){return t[0]=Math.max(n[0],a[0]),t[1]=Math.max(n[1],a[1]),t},round:function(t,n){return t[0]=Math.round(n[0]),t[1]=Math.round(n[1]),t},scale:function(t,n,a){return t[0]=n[0]*a,t[1]=n[1]*a,t},scaleAndAdd:function(t,n,a,r){return t[0]=n[0]+a[0]*r,t[1]=n[1]+a[1]*r,t},distance:Rn,squaredDistance:zn,length:jn,squaredLength:Pn,negate:function(t,n){return t[0]=-n[0],t[1]=-n[1],t},inverse:function(t,n){return t[0]=1/n[0],t[1]=1/n[1],t},normalize:function(t,n){var a=n[0],r=n[1],e=a*a+r*r;return e>0&&(e=1/Math.sqrt(e)),t[0]=n[0]*e,t[1]=n[1]*e,t},dot:function(t,n){return t[0]*n[0]+t[1]*n[1]},cross:function(t,n,a){var r=n[0]*a[1]-n[1]*a[0];return t[0]=t[1]=0,t[2]=r,t},lerp:function(t,n,a,r){var e=n[0],u=n[1];return t[0]=e+r*(a[0]-e),t[1]=u+r*(a[1]-u),t},random:function(t,n){n=n||1;var r=2*a()*Math.PI;return t[0]=Math.cos(r)*n,t[1]=Math.sin(r)*n,t},transformMat2:function(t,n,a){var r=n[0],e=n[1];return t[0]=a[0]*r+a[2]*e,t[1]=a[1]*r+a[3]*e,t},transformMat2d:function(t,n,a){var r=n[0],e=n[1];return t[0]=a[0]*r+a[2]*e+a[4],t[1]=a[1]*r+a[3]*e+a[5],t},transformMat3:function(t,n,a){var r=n[0],e=n[1];return t[0]=a[0]*r+a[3]*e+a[6],t[1]=a[1]*r+a[4]*e+a[7],t},transformMat4:function(t,n,a){var r=n[0],e=n[1];return t[0]=a[0]*r+a[4]*e+a[12],t[1]=a[1]*r+a[5]*e+a[13],t},rotate:function(t,n,a,r){var e=n[0]-a[0],u=n[1]-a[1],o=Math.sin(r),i=Math.cos(r);return t[0]=e*i-u*o+a[0],t[1]=e*o+u*i+a[1],t},angle:function(t,n){var a=t[0],r=t[1],e=n[0],u=n[1],o=Math.sqrt(a*a+r*r)*Math.sqrt(e*e+u*u),i=o&&(a*e+r*u)/o;return Math.acos(Math.min(Math.max(i,-1),1))},zero:function(t){return t[0]=0,t[1]=0,t},str:function(t){return"vec2("+t[0]+", "+t[1]+")"},exactEquals:function(t,n){return t[0]===n[0]&&t[1]===n[1]},equals:function(t,n){var a=t[0],r=t[1],e=n[0],u=n[1];return Math.abs(a-e)<=1e-6*Math.max(1,Math.abs(a),Math.abs(e))&&Math.abs(r-u)<=1e-6*Math.max(1,Math.abs(r),Math.abs(u))},len:Sn,sub:En,mul:On,div:Tn,dist:Dn,sqrDist:Fn,sqrLen:In,forEach:Ln});t.glMatrix=e,t.mat2=c,t.mat2d=v,t.mat3=y,t.mat4=S,t.quat=cn,t.quat2=qn,t.vec2=Vn,t.vec3=K,t.vec4=Rt,Object.defineProperty(t,"__esModule",{value:!0})}));

// Wrapper for VXGCloudPlayer & CloudSDK

window.CloudStreamerSDK = function(elid, o) {
	console.log(o);

    var self = this;
    self.options = o || {};
    self.conn = null;
    self.cm = null;
    self.mCameraID = null;
    self.camera = null;
    self.sharedKey = null;
    self.mAccessToken = null;
    self.streamer = document.getElementById(elid);
	self.m = {};
	self.conn = new CloudShareConnection(self.options);
	self.config = {};
	self.config.ws_port = 8888;
	self.config.wss_port = 8883;
	self.config.host = "cam.skyvr.videoexpertsgroup.com";
	self.api_host = self.options.cloud_domain ? self.options.cloud_domain : 'web.skyvr.videoexpertsgroup.com';
	self.api_port = null;
	self.api_security_port = null;
	var mWebRTC_Streamer = null;

	self.streamer.classList.add("cloudstreamer");
	self.streamer.classList.add("green");
	self.streamer.classList.add("black");

	self.streamer.innerHTML = ''
		+ '<div class="cloudstreamer-loader" style="display: none"></div>'
		+ '<div class="cloudstreamer-error" style="display: none">'
		+ '	<div class="cloudstreamer-error-text" style="display: none"></div>'
		+ '</div>'
		+ '<div class="cloudstreamer-watermark">'
		+ '</div>'
		+ '<div class="cloudstreamer-sdkversion">SDK ' + CloudSDK.version + '</div>'
		+ '<div class="cloudstreamer-black-screen" style="display: none">'
		+ '		<div class="cloudstreamer-watermark"></div>'
		+ '		<div class="cloudstreamer-sdkversion">SDK ' + CloudSDK.version + '</div>'
		+ '</div>'
		+ '<div class="cloudplayer-controls">'
		+ '	<div class="cloudplayer-stop" style="display: none"></div>'
		+ '	<div class="cloudplayer-play" style="display: none"></div>'
		+ '	<div class="cloudplayer-time"></div>'
		+ '	<div class="cloudplayer-fullscreen"></div>'
		+ '</div>'
		+ '<video class="cloudstreamer-webcam-video" autoplay="true">'
		+ '</video>'
	;
	var el_loader = self.streamer.getElementsByClassName('cloudstreamer-loader')[0];
	var el_error = self.streamer.getElementsByClassName('cloudstreamer-error')[0];
	var el_error_text = self.streamer.getElementsByClassName('cloudstreamer-error-text')[0];
	var mElVideo = self.streamer.getElementsByClassName('cloudstreamer-webcam-video')[0];
	var mElStop = self.streamer.getElementsByClassName('cloudplayer-stop')[0];
	var mElPlay = self.streamer.getElementsByClassName('cloudplayer-play')[0];

	var mShowedLoading = false;

	function _hideerror(){
		el_error.style.display = "none";
		el_error_text.style.display = "none";
	}

	function _showloading(){
		if(self.mShowedBigPlayButton == true){
			_hideloading();
		} else if(!mShowedLoading){
			el_loader.style.display = "inline-block";
			mShowedLoading = true;
		}
	}

	function _hideloading(){
		if(mShowedLoading){
			el_loader.style.display = "none";
			mShowedLoading = false;
		}
	}

	self._setError = function(error){
		setTimeout(self.stop,10);
		self.mLastError = error;
		if(self.mCallback_onError){
			self.mCallback_onError(self, error);
		}
	}

	function _showerror(err){
		console.error(err);
		self._setError(err);
		self.showErrorText(err.text);
		console.error(err.text);
	}

	/*
	 * Public functions
	 * */
	self.showErrorText = function(text){
		_hideloading();
		el_error.style.display = "inline-block";
		el_error_text.style.display = "inline-block";
		el_error_text.innerHTML = text;
		mElStop.style.display = 'none';
		mElPlay.style.display = 'none';
		mElVideo.srcObject = null;

		// _hideBlackScreen();
	}

    self.setSource = function (key) {
		_hideerror();
		mElPlay.style.display = 'none';

        if (!key || key === '') {
            var msg = 'Access token is required';
            console.error(msg);
            self.showErrorText(msg);
            return CloudReturnCode.ERROR_INVALID_SOURCE;
		}

		if (location.protocol != 'https:') {
			self.showErrorText("Streamer is only available with HTTPS connection");
			return;
		}

		var camid = 0;
        try {
            var obj = atob(key);
            obj = JSON.parse(obj);
            console.log(obj);
            if (obj.token && obj.camid && obj.access && obj.token !== '' && obj.camid !== '' && obj.access !== ''){
                self.sharedKey = obj.token;
                self.mCameraID = obj.camid;
			}

			if (obj.api) {
				self.api_host = obj.api;
				console.log('self.api_host: ', self.api_host);
			}

			if (obj.api_p) {
				self.api_port = obj.api_p;
				console.log('self.api_port: ', self.api_port);
			}

			if (obj.api_security_port) {
				self.api_security_port = obj.api_security_port;
				console.log('self.api_security_port: ', self.api_security_port);
			}

        } catch (err) {
            var msg = 'Invalid access token format';
            console.error(msg);
            return CloudReturnCode.ERROR_INVALID_SOURCE;
		}

		var base_url = self.api_host;

		if (self.api_host == (self.options.cloud_domain ? self.options.cloud_domain : 'web.skyvr.videoexpertsgroup.com')) {
			base_url = 'https://' + self.api_host;
		} else if (location.protocol === 'https:') {
			base_url = 'https://' + self.api_host;
			if (self.api_secutiry_port != null) {
				base_url += ':' + self.api_secutiry_port;
			}
		} else if (location.protocol === 'http:' || location.protocol === 'file:') {
			base_url = 'http://' + self.api_host;
			if (self.api_secutiry_port != null) {
				base_url += ':' + self.api_secutiry_port;
			}
		}

		self.conn.ServiceProviderUrl = base_url + '/';
		self.conn.open(self.sharedKey);
		self.mAccessToken = key;
		mElPlay.style.display = '';

		/*if(CloudHelpers.isMobile()){
			self.showErrorText("Mobile streamer is not available yet");
			return;
		}

		if(CloudHelpers.isChrome()){
			self.showErrorText("Streamer is not available yet for Chrome. But you can open this page in Edge or Firefox to start streaming from your web camera.");
			return;
		}

		if(!CloudHelpers.supportFlash() && CloudHelpers.isFireFox()){
			self.showErrorText("In Firefox Streamer available using by flash now.<br>"
				+ "Please install flash <a href='https://get.adobe.com/flashplayer' target='_blank'>https://get.adobe.com/flashplayer</a><br>"
				+ " or maybe enable Plugin 'Shockwave Flash' in your browser <a href='about:addons' target='_blank'>about:addons</a>.");
			return;
		}
		*/
    };

    self.getSource = function () {
        if (!self.mAccessToken)
            return CloudReturnCode.ERROR_SOURCE_NOT_CONFIGURED;
        return self.mAccessToken;
    };

	self.start = function(){
        if (!self.sharedKey){
            return CloudReturnCode.ERROR_SOURCE_NOT_CONFIGURED;
		}
		console.warn("[CloudStreamerSDK] Start");

		self.stop("by_strm_sdk_1");
		if (navigator.mediaDevices.getUserMedia) {
			navigator.mediaDevices.getUserMedia({video: true}).then(function(stream) {
				mElVideo.srcObject = stream;

				if (self.conn) {
					// self.cm = new CloudCameraList(self.conn);
					self.conn._getAPI().cameraStreamUrls_webrtc(self.mCameraID).done(function (stream_urls) {
						console.log("stream_urls: ", stream_urls);
						if (!stream_urls.webrtc) {
							self.showErrorText("Channel does not support WebRTC streamer");
							return;
						}

						var p = CloudHelpers.promise();

						if (CloudHelpers.compareVersions(CloudPlayerWebRTC2.version, stream_urls.webrtc.version) > 0) {
							console.warn("Expected version webrtc.version (v" + stream_urls.webrtc.version + ") "
							+ " mismatch with included CloudPlayerWebRTC (v" + CloudPlayerWebRTC2.version + ")");
							p = CloudHelpers.requestJS(stream_urls.webrtc.scripts.player, function(r) {
								r = r.replace("CloudPlayerWebRTC =", "CloudPlayerWebRTC2 =");
								while (r.indexOf("CloudPlayerWebRTC.") !== -1) {
									r = r.replace("CloudPlayerWebRTC.", "CloudPlayerWebRTC2.");
								}
								return r;
							});
						} else {
							p.resolve();
						}
						p.done(function(){
							// self.mCamera = ;
							mWebRTC_Streamer = new CloudPlayerWebRTC2(null,
								stream_urls.webrtc.connection_url,
								stream_urls.webrtc.ice_servers, {
									send_video: true,
									send_audio: true,
								}
							);

							mWebRTC_Streamer.startWS();
							mElStop.style.display = '';
							mElPlay.style.display = 'none';
						}).fail(function(err){
							console.error("err: ", err);
							self.showErrorText("Problem with streaming protocol");
						})
						// self.start();
					}).fail(function (err) {
						console.error("err: ", err);
						self.showErrorText("Channel for streaming is not found");
						return;
					});
				}
			}).catch(function(err) {
				self.sharedKey = null;
				console.error(err);
				console.error("Something went wrong! ", err);
				if (("" + err).indexOf("Requested device is not found") != -1) {
					self.showErrorText("Camera is not found");
				}
			});
		}
        // self.player.play();
	};

	mElPlay.onclick = self.start;

	self.stop = function(){
		mElStop.style.display = 'none';
		mElPlay.style.display = self.mAccessToken ? '' : 'none';
		mElVideo.srcObject = null;

		if (!self.sharedKey)
            return CloudReturnCode.ERROR_SOURCE_NOT_CONFIGURED;

		try{ if (mWebRTC_Streamer) { mWebRTC_Streamer.stopWS(); } }catch(err){console.error(err)};
	};

	mElStop.onclick = self.stop;

	self.initFullscreenControls = function(){
		var el_fullscreen = self.streamer.getElementsByClassName('cloudplayer-fullscreen')[0];
		var _prevHeight, _prevWidth;
		self.changedFullscreen = function(){
			console.log('changedFullscreen');
			if (document.webkitIsFullScreen){
				_prevHeight = self.player.style.height;
				_prevWidth = self.player.style.width;
				self.streamer.style.height = '100%';
				self.streamer.style.width = '100%';
				// self.size('100%', '100%');
				console.log('changedFullscreen -> fullscreen');
			}else{
				_prevHeight
				self.streamer.style.height = _prevHeight;
				self.streamer.style.width = _prevWidth;
				// self.size(self.playerWidth + 'px', self.playerHeight + 'px');
				console.log('changedFullscreen -> NOT fullscreen');
			}
		};

		if (document.addEventListener){
			document.addEventListener('webkitfullscreenchange', self.changedFullscreen, false);
			document.addEventListener('mozfullscreenchange', self.changedFullscreen, false);
			document.addEventListener('fullscreenchange', self.changedFullscreen, false);
			document.addEventListener('MSFullscreenChange', self.changedFullscreen, false);
		}

		self.fullscreen = function(){
			console.log("fullscreen: clicked");
			if(document.webkitIsFullScreen == true){
				document.webkitCancelFullScreen();
			} else if(document.mozFullScreen){
				document.mozCancelFullScreen();
			} else if(document.msFullscreenElement && document.msFullscreenElement != null){
				document.msExitFullscreen();
			}else{
				if(self.streamer.mozRequestFullScreen) {
					self.streamer.mozRequestFullScreen();
				} else if(self.streamer.requestFullscreen) {
					self.streamer.requestFullscreen();
				} else if(self.streamer.webkitRequestFullscreen) {
					self.streamer.webkitRequestFullscreen();
				} else if(self.streamer.msRequestFullscreen) {
					self.streamer.msRequestFullscreen();
				}
			}
		};

		el_fullscreen.onclick = self.fullscreen;
	}
	self.initFullscreenControls();
};
