window.screens = window.screens || {};
window.controls = window.controls || {};
var path = window.core.getPath('cameraedit.js');

window.controls['cameraedit'] = {
    'js':[],
    'css':[path+'cameraedit.css'],
    'commoncss':[],
    'commonjs':[/*'sdk/moment.min.js','sdk/moment-timezone-with-data-2012-2022.min.js'*/],
    'observedAttributes':function(){
        return ['access_token'];
    },
    'on_init':function(element){
        CameraEditControl.apply(element,[]);
        return this.connectedCallback();
    },
    'attributeChangedCallback':function(name, value){
        this.attributeChangedCallback(name,value);
    },
    'disconnectedCallback':function(){
        this.disconnectedCallback();
    },
}

CameraEditControl = function(){
    this.defferedDispatchEvent = function(event){
        let self = this; let ev = event;
        setTimeout(function(){self.dispatchEvent(ev);},0);
    }
    this.connectedCallback = function(){
        this.submited_event = new Event('submited',{cancelable: false, bubbles: false, defaultPrevented: true});
        this.error_event = new Event('error',{cancelable: false, bubbles: true});
        this.loaded_event = new Event('loaded',{cancelable: false, bubbles: false, defaultPrevented: true});
        let self = this;
        access_token = $(this).getNearParentAtribute('access_token');
        let camera_finder_link = $(this).html();
        $(this).html(`
<form class="none">
<div class="form-group camera_finder_link">
`+camera_finder_link+`
</div>
<div class="form-group">
    <label>Name</label>
    <input autofocus="autofocus" class="name" name="name" >
</div>
<div class="form-group">
    <label>Location</label>
    <input name="location" list="locationsList">
    <datalist id="locationsList"> </datalist>
</div>
<div class="form-group">
    <label>Group</label>
    <input name="group" list="groupslist">
    <datalist id="groupslist"> </datalist>
</div>
<!--
<div class="form-group" style="display:none">
    <label>Recording</label>
    <select name="recording" >
        <option value="1">On</option>
        <option value="0">Off</option>
    </select>
</div>
-->
<div class="form-group type">
    <label>Type</label> 
    <select class="url_protocol">
        <option value="onvif" selected>ONVIF camera</option>
        <option value="rtsp">Video URL</option>
    </select>
</div>
<div class="form-group rtspOnly notincloud notinuplink">
    <label>URL</label>
    <input name="url" class="anccsUrl">
</div>

<div class="form-group rtspOnly notincloud setting-dropdown opt-dropdown notinuplink">
    <div class="anccsUrlOptions">OPTIONS</div>
</div>

<div class="form-group rtspOnly options notincloud notinuplink">
    <label for="url_prot">Protocol&nbsp;</label>
    <input type="text" class="url_prot form-control input500" value="">
</div>
<div class="form-group options notincloud notinuplink">
    <label for="url_ip">IP address or domain name&nbsp;</label>
    <input type="text" class="url_ip form-control input500" value="">
    <div class="iperror">Invalid domain name or ip address</div>
</div>
<div class="form-group options notincloud notinuplink">
    <label for="url_http_port" class="onvifOnly">HTTP port&nbsp;</label>
    <label for="url_http_port" class="rtspOnly">Port&nbsp;</label>
    <input type="number" class="url_http_port form-control input500" value="">
</div>
<div class="form-group options notincloud notinuplink">
    <label class="onvifOnly" for="url_rtsp_port">RTSP port&nbsp;</label>
    <input type="number" class="onvifOnly url_rtsp_port form-control input500" name="onvif_rtsp_port_fwd">
    <i class="onvifOnly"></i>
</div>
<div class="form-group options notincloud">
  <label for="deviceLogin">Username&nbsp;</label>
  <input type="text" class="form-control input500 url_user_name" name="username" >
</div>
<div class="form-group options notincloud" style="position: relative">
  <label for="devicePassword">Password&nbsp;</label>
  <input type="password" class="password form-control input500 url_password" autocomplete="new-password" name="password"><i class="showhidepass show-password"></i>
</div>
<div class="form-group options notincloud notinuplink">
    <label class="" for="url_path">Path&nbsp;</label>
    <input type="text" class="url_path form-control input500" value="">
</div>

<div class="form-group">
    <label>Timezone</label>
    <select name="tz">
    </select>
</div>

<div class="form-group subscription">
    <label>Subscription: </label>
    <div class="subscription-group">
        <input type="text" disabled class="subscription-info show-name" name="showname" value="">
        <input type="hidden" class="subscription-info" name="subname" value="">
        <input type="hidden" class="subscription-info" name="subid" value="">
    </div>
</div>

<div class="form-group setting-dropdown loc-dropdown bottom-options">
    <div class="anccsUrlLocation">GEOLOCATION</div>
    <span class="carrot-icon closed"><</span>
</div>

<div class="form-group loca hidesett">
    <label>Latitude</label>
    <input name="lat" value="">
</div>
<div class="form-group loca hidesett">
    <label>Longitude</label>
    <input name="lon" value="">
</div>

<div class="form-group" style="display:none">
    <label>Description</label>
    <textarea name="desc" rows="5"></textarea>
</div>
<div class="form-group setting-dropdown rete-dropdown bottom-options custom-plan" style="display: none">
    <div class="anccsUrlRetentiontime">RECORDING</div>
    <span class="carrot-icon closed"><</span>
</div>
<div class="form-group rete hidesett">
    <label>Cloud recording</label>&nbsp;&nbsp;&nbsp;<label class="rectypeinfo" style="display:none;font-weight: lighter;">(recording type "By Event" is not supported for RTSP cameras)</label>
    <select name="rete_recmode" class="rete_recmode">
        <option value="off" selected>Off</option>
        <option value="on">Continuous</option>
        <option value="by_event">By Event</option>
    </select>
</div>
<div class="form-group rete_time rete rete_off hidesett">
    <label>Retention time (hours)</label>
    <input name="rete_time" value="72">
</div>
<div class="form-group rete reten rete_sd hidesett">
    <label class="sd-label custom-checkbox">
        <span>This camera has SD Card Recording</span>
        <input type="checkbox" name="rete_sd">
        <span class="checkmark"></span>	
    </label>
</div>
<div class="form-group setting-dropdown ai-dropdown bottom-options custom-plan" style="display: none">
    <div class="anccsUrlAIConfig">OBJECT DETECTION (AI)</div>
    <span class="carrot-icon closed"><</span>
</div>
<div class="form-group ai_type hidesett" >
    <label>AI Object Detection</label>
    <select name="ai_type" class="ai_type_select">
        <option value="off">Off</option>
        <option value="continuous">Continuous</option>
        <option value="by_event">By Event</option>
    </select>
</div>
</form>
<div class="sbt"><br/><br/>
<div class="wait"><span>Wait</span>&nbsp;&nbsp;<div class="spinner"></div></div>
            `+
            ($(self).attr('hidesubmit')!==undefined ? '' : '<button class="apply vxgbutton">Apply</button>') +
            '</div>');

        $(this).find('.apply').click(function(e){
            e.preventDefault();
            self.submit_event = new Event('submit',{cancelable: true, bubbles: false, defaultPrevented: true});
            if (!self.dispatchEvent(self.submit_event)) return;
            self.submit();
        });

        $(this).addClass('onvif');
        $(this).find('.iperror').hide();
        $(this).find('.anccsUrlOptions').click(function(){ $(self).toggleClass('options'); });

        $(".setting-dropdown").off().on('click',function() {
            if ($(this).find(".carrot-icon").hasClass("closed")) {
                $(this).find(".carrot-icon").css("transform", "rotate(-90deg)");
                $(this).find(".carrot-icon").removeClass("closed");
            } else {
                $(this).find(".carrot-icon").css("transform", "rotate(0deg)");
                $(this).find(".carrot-icon").addClass("closed");
            }

            if ($(this).hasClass("loc-dropdown")) $(".loca").toggle();
            if ($(this).hasClass("rete-dropdown")) $(".rete").toggle();
            if ($(this).hasClass("ai-dropdown")) $('.ai_type').toggle();
        });

        $(this).find('.rete_recmode').change(function(){
            let type = $(this).val();
            let url = ($(self).find('.anccsUrl').val()||'').trim();
            if (type=='off') {
                $(self).find('.rete_time').addClass("rete_off"); 
                $(self).find('.rete_time [name="rete_time"]').val(0);
            }
            else $(self).find('.rete_time').removeClass("rete_off").show();

            if (type=='on' || type=='by_event') $(self).find('.rete_time [name="rete_time"]').val(72);

            if (url.substr(0,5)=='rtsp:' && type=='by_event')
                $(self).find('.rectypeinfo').show();
            else
                $(self).find('.rectypeinfo').hide();
        });
        
        $(this).find('.type select').change(function(){
            let type = $(this).val();
            if (type=='onvif') $(self).removeClass('options');
            $(self).removeClass('rtsp').removeClass('cloud').removeClass('onvif').addClass(type);
            self.onUrlPartChange();
        });
        $(this).find('.anccsUrl').on('input',function(){self.onUrlChange()});

        $(this).find('.url_protocol').on('change', function(){self.onUrlProtocolChange()});
        $(this).find('.url_http_port, .url_path, .url_prot').on('input', function(){self.onUrlPartChange()});
        $(this).find('.url_ip').on('input', function(){self.onIpChange()});
        $(this).find('.anccsUrl').on('input', function(){self.onIpUrlChange()});

        $(this).find('.showhidepass').click(function(){
            if ($(this).hasClass('show-password')){
                $(this).removeClass('show-password').addClass('hide-password');
                $(self).find('input.password').attr('type','text');
            } else {
                $(this).addClass('show-password').removeClass('hide-password');
                $(self).find('input.password').attr('type','password');
            }
        });

        this.reset();
        if (vxg.user.src.plans && vxg.user.src.plans.length > 0 && ($(this).attr("id") != "uplink-camera" || $(this).attr("id") != "cloud-camera")) {
            this.selectPlan(this);
        } else {
            $('.subscription').hide();
        }

        return this.attributeChangedCallback('access_token', access_token);
    }
    this.attributeChangedCallback = function(name, access_token){
        let self = this;
        $(this).removeClass('newcamera');
        $(this).find('.showhidepass').addClass('show-password').removeClass('hide-password');
        $(this).find('input.password').attr('type','password');
        $(this).find('.camera_finder_link').hide();
        if (name!='access_token') {
            return defaultPromise();
        }
        if (!(parseInt(access_token)>0 || typeof access_token ==="string")) return defaultPromise();
        delete this.camera;
        this.reset();
        $(this).removeClass('newcamera');
        if (parseInt(access_token)>0){
            $(this).addClass('nodata').removeClass('ready');
            this.showwait('Loading');
            return window.vxg.cameras.getCameraByIDPromise(parseInt(access_token)).then(function(camera){self.onCameraLoaded(camera);}, function(){self.onCameraLoadedFail();});
        }
        if (access_token) {
            $(this).addClass('nodata').removeClass('ready');
            this.showwait('Loading');
            return window.vxg.cameras.getCameraByTokenPromise(access_token).then(function(camera){self.onCameraLoaded(camera);}, function(){self.onCameraLoadedFail();});
        }
        //$(this).find('.sdrecinfo').text('(supported only for Cloud cameras)');
        $(this).removeClass('nodata');
        $(this).addClass('ready').addClass('newcamera');
        $(this).find('.camera_finder_link').show();
        return defaultPromise();
    }
    this.disconnectedCallback = function(){
        let self = this;
        delete this.camera;
        return defaultPromise();
    }
    this.extractHostname = function(url) {
        let ret = (url.indexOf("//") > -1 ? url.split('/')[2] : url.split('/')[0]).split(':')[0].split('?')[0];
        if (!this.checkDomainName(ret)) return '';
        return ret;
    }
    this.submit = function(){
        let self = this;
        let isOptions = $(this).hasClass('options');
        let isCloud = $(this).hasClass('cloud');
        let isOnvif = $(this).hasClass('onvif');
        let data = $(this).find('form').serializeObject();
        for (let i in data) if (typeof data[i] === 'string') data[i]=data[i].trim();
        if ($(this).hasClass('rtsp')) delete data['onvif_rtsp_port_fwd'];
        if (!data.name){
            core.flashInputBackgroundColor($(this).find('.name'));
            this.defferedDispatchEvent(this.error_event);
            return false;
        }
        if (data.password && !(/^[a-zA-Z0-9_.\-~%!$&\'()*+,;=]{0,64}$/.test(data.password))){
            core.flashInputBackgroundColor($(this).find('.password'));
            this.defferedDispatchEvent(this.error_event);
            return false;
        }
        if (data.lat && (isNaN(parseFloat(data.lat)) || parseFloat(data.lat)<-90 || parseFloat(data.lat)>90)){
            core.flashInputBackgroundColor($(this).find('[name=lat]'));
            this.defferedDispatchEvent(this.error_event);
            return false;
        }
        if (data.lon && (isNaN(parseFloat(data.lon)) || parseFloat(data.lon)<-180 || parseFloat(data.lon)>180)){
            core.flashInputBackgroundColor($(this).find('[name=lon]'));
            this.defferedDispatchEvent(this.error_event);
            return false;
        }
        if (0 && !isOnvif && !data.url){
            core.flashInputBackgroundColor($(this).find('.anccsUrl'));
            this.defferedDispatchEvent(this.error_event);
            return false;
        }
        if (data.url!==undefined && data.url){
            var purl = this.parseUrl(data.url);
        
            if (!this.checkDomainName(purl.host)){
                if (isOnvif)
                    core.flashInputBackgroundColor($(this).find('.url_ip'));
                else {
                    if (isOptions)
                        core.flashInputBackgroundColor($(this).find('.url_ip'));
                    else
                        core.flashInputBackgroundColor($(this).find('.anccsUrl'));
                }
                this.defferedDispatchEvent(this.error_event);
                return false;
            }
      
            if (['rtmp', 'rtsp', 'http', 'https', 'onvif'].indexOf(purl.protocol) === -1){
                if (isOptions)
                    core.flashInputBackgroundColor($(this).find('.url_prot'));
                else
                    core.flashInputBackgroundColor($(this).find('.anccsUrl'));
                this.defferedDispatchEvent(this.error_event);
                return false;
            }
            if (purl.port!='' && (parseInt(purl.port)<1 || parseInt(purl.port)>65535)){
                if (isOnvif || isOptions)
                    core.flashInputBackgroundColor($(this).element.find('.url_http_port'));
                else
                    core.flashInputBackgroundColor($(this).find('.anccsUrl'));
                this.defferedDispatchEvent(this.error_event);
                return false;
            }

        }
        if (isCloud) data.url='';
        let p;
        if (data.url && purl.host && (!data.lat || !data.lon))
            p = this.ipToLocation(purl.host);
        else
            p =  new Promise(function(resolve, reject){resolve({lat:data.lat,lon:data.lon});});

        this.showwait('Saving');
        if (!this.camera){
            p.then(function(r){
                data.lat = r.lat ? r.lat : null;
                data.lon = r.lon ? r.lon : null;
                vxg.cameras.createCameraPromise(data).then(function(r){
					var custProm =  new Promise(function(resolve, reject){resolve({lat:data.lat,lon:data.lon});});

					if (data.subid == "CUST") { 
						custProm = vxg.api.cloudone.camera.setAIConfig(r.id, {'channel_id': r.id, 'type': data.ai_type }).then(function() {
							vxg.api.cloudone.camera.setRetention(r.id, {recording: false, time: data.rete_time, type: data.rete_recmode})
						});
					}

					custProm.then(function() {
						vxg.api.cloud.getCameraInfo(r.id).then(function(newCam) {
							var subid = data.subid ? data.subid : "NOPLAN";
							var subname = data.subname ? data.subname : "No Plan";
							var subInfo = {
								"subid": subid,
								"subname": subname
							};
			
							var newMeta = {
								...subInfo,
								...newCam.meta
								};
							
							obj = {
								"id": r.id,
								"meta": newMeta
							}

							newCam.meta = newMeta;
	
							vxg.api.cloudone.camera.setPlans(obj).then(function (ret) {
								var aiType = data.subid == "CUST" ? data.ai_type : ret['planInfo'] ? ret['planInfo'].object_detection : null;
								var aiCams_string = sessionStorage.getItem("aiCams");
								if (aiCams_string) {
									var aiCams_array = aiCams_string.split(",").filter(e => e);
									if (aiType && aiType != "off") {
										if (!aiCams_array.includes(r.id.toString())) {
											aiCams_string += "," + r.id;
											sessionStorage.setItem("aiCams", aiCams_string); 
										}
									} else {
										if (aiCams_array.includes(r.id.toString())) {
											var newAiCams = aiCams_string.replace("," + r.id, "");
											sessionStorage.setItem("aiCams", newAiCams); 
										}
									}
								}
								sessionStorage.setItem(r.id, "true");
								self.hidewait();
								$(self).attr('access_token','');
								self.reset();
								self.dispatchEvent(self.submited_event);
								return screens['cameras'].on_show();
							},function(r){
								self.hidewait();
								if (r && r.responseJSON && r.responseJSON.errorDetail)
									alert(r.responseJSON.errorDetail);
								else
									alert('Falied to delete setting');
								self.dispatchEvent(self.submited_event);
							});       

							var cameraList = localStorage.cameraList ? JSON.parse(localStorage.cameraList) : null;
							if (cameraList) {                                
								cameraList.objects.push(newCam);
								var total = parseInt(cameraList.meta.total_count);
								cameraList.meta.total_count = total + 1;
								localStorage.cameraList = JSON.stringify(cameraList);
							}

						}, function(err) {
							self.hidewait();
							if (r && r.responseJSON && r.responseJSON.errorDetail)
								alert(r.responseJSON.errorDetail);
							else
								alert('Falied to find created camera');
						})
					}, function(r) {
						self.hidewait();
						if (r && r.responseJSON && r.responseJSON.errorDetail)
							self.showerror(r.responseJSON.errorDetail);
						else 
							alert('Falied to set retention or ai');

					})
                    /*} else {
                        self.hidewait();
                        self.dispatchEvent(self.submited_event);
                        alert("Can't find camera list");
                    } */               
                },function(r){
                    self.hidewait();
                    if (r && r.responseJSON && r.responseJSON.errorDetail)
                        self.showerror(r.responseJSON.errorDetail);
                    else
                        self.showerror('<a target="_blank" href="'+vxg.links.error+'">Error #2</a>');
                    setTimeout(function(){self.hidewait();},2000);
                    self.defferedDispatchEvent(self.error_event);
                });
            });
            return;
        }
        p.then(function(r){
            data.lat = r.lat ? r.lat : null;
            data.lon = r.lon ? r.lon : null;
            if (data.subid && data.subid == "NOPLAN") {
                data.rete_recmode = "off";
                data.rete_time = 0;
            }
            self.camera.updateCameraPromise(data).then(function(r){
				var oldsubid = self.camera.src.meta && self.camera.src.meta.subid ? self.camera.src.meta.subid : "customParameters";
				
				var custProm =  new Promise(function(resolve, reject){resolve({lat:data.lat,lon:data.lon});});

				if ((oldsubid == "customParameters" && !data.subid) || data.subid == "CUST" || oldsubid == "CUST"){
					if (!self.camera.bsrc.url && data.rete_recmode=='off')
						data.rete_time = -1;	
					
					custProm = vxg.api.cloudone.camera.setAIConfig(self.camera.camera_id, {'channel_id': self.camera.camera_id, 'type': data.ai_type }).then(function() {
						vxg.api.cloudone.camera.setRetention(self.camera.camera_id, {recording: false, time: data.rete_time, type: data.rete_recmode})
					});
				}

				custProm.then(function() {
					vxg.api.cloud.getCameraInfo(self.camera.camera_id).then(function(updatedCam) {
						if (data.subid && data.subname) {
							var subInfo = {
								"subid": data.subid,
								"subname": data.subname
							};

							if (self.camera.src.meta && self.camera.src.meta.subid) {
								delete self.camera.src.meta.subid;
								delete self.camera.src.meta.subname;
							}
			
							var newMeta = {
								...subInfo,
								...self.camera.src.meta
							};

							updatedCam.meta = newMeta;
							
							obj = {
								"id": self.camera.camera_id,
								"old_sub": oldsubid,
								"meta": newMeta
							}
			
							vxg.api.cloudone.camera.setPlans(obj).then(function (ret) {
								var aiType = data.subid == "CUST" ? data.ai_type : ret['planInfo'] ? ret['planInfo'].object_detection : null;
								var aiCams_string = sessionStorage.getItem("aiCams");
								if (aiCams_string) {
									var aiCams_array = aiCams_string.split(",").filter(e => e);
									if (aiType && aiType != "off") {
										if (!aiCams_array.includes(self.camera.camera_id.toString())) {
											aiCams_string += "," + self.camera.camera_id;
											sessionStorage.setItem("aiCams", aiCams_string); 
										}
									} else {
										if (aiCams_array.includes(self.camera.camera_id.toString())) {
											var newAiCams = aiCams_string.replace("," + self.camera.camera_id, "");
											sessionStorage.setItem("aiCams", newAiCams); 
										}
									}
								}

								$(self).attr('access_token','');
								self.reset();
								//self.dispatchEvent(self.submited_event);
								self.dispatchEvent(self.submited_event);
								return screens['cameras'].on_show();
							},function(r){
								if (r && r.responseJSON && r.responseJSON.errorDetail)
									alert(r.responseJSON.errorDetail);
								else
									alert('Falied to delete setting');
								self.hidewait();
							});
						} else {
							$(self).attr('access_token','');
							self.reset();
							self.dispatchEvent(self.submited_event);
						}

						var cameraList = localStorage.cameraList ? JSON.parse(localStorage.cameraList) : null;
						if (cameraList) {
							var oldCamIndex = cameraList.objects.findIndex(c => c.id == updatedCam.id);
							cameraList.objects[oldCamIndex] = updatedCam;
							localStorage.cameraList = JSON.stringify(cameraList);
						}
						return screens['cameras'].on_show();
					})
				})
            },function(r){
                self.hidewait();
                if (r && r.responseJSON && r.responseJSON.errorDetail)
                    self.showerror(r.responseJSON.errorDetail);
                else
                    self.showerror('<a target="_blank" href="'+vxg.links.error+'">Error #2</a>');
                setTimeout(function(){self.hidewait();},2000);
                self.defferedDispatchEvent(self.error_event);
            });
        });
        return true;
    },
    this.onCameraLoadedFail = function(r){
        $(this).addClass('nodata');
        this.showerror('<a target="_blank" href="'+vxg.links.error+'">Error #3</a>');
        this.defferedDispatchEvent(this.error_event);
        return r;
    }
    this.onCameraLoaded = function(camera){
        let self = this;
        if (!camera) return this.onCameraLoadedFail();
        $(this).removeClass('nodata');
        this.camera = camera;

        this.showwait('Loading');
        this.camera.getConfig().then(function(bsrc){            
            self.selectPlan(self, camera);

            if (!bsrc){
                self.showerror('<a target="_blank" href="'+vxg.links.error+'">Error #3</a>');
                self.defferedDispatchEvent(self.error_event);
                return;
            }
            if (!bsrc.url) {
                bsrc.url='';
                $(self).find('.url_protocol').attr('disabled','disabled');
            }

            if (bsrc.url && bsrc.url.includes("/uplink_camera/")) {
                $(self).find('.url_protocol').attr('disabled','disabled');
                $(self).find('.url_protocol').append('<option value="uplink">Uplink Camera'); 
            }
            //else
                //$(self).find('.rete_sd input').attr('disabled','disabled').prop('checked','');

            $(self).removeClass('rtsp').removeClass('onvif').removeClass('cloud');

            if (!bsrc.url && !$(self).find('.url_protocol [value="cloud"]').length) {
                $(self).find('.url_protocol').append('<option value="cloud">Cloud camera'); 
            }
                
            if (bsrc.url.substr(0,5)=='onvif') {
                $(self).find('.url_protocol').val('onvif');
                $(self).addClass('onvif');
            } else if (bsrc.url.includes("/uplink_camera/")) {
                $(self).find('.url_protocol').val('uplink');
                $(self).addClass('uplink');
            } else {
                if (bsrc.url){
                    $(self).find('.url_protocol').val('rtsp');
                    $(self).addClass('rtsp');
                } else {
                    $(self).find('.url_protocol').val('cloud');
                    $(self).addClass('cloud');
                }
            }

            $(self).find('[name="url"]').val(bsrc.url && !bsrc.url.includes("/uplink_camera/")? bsrc.url : '');
            self.onUrlChange();

            self.createTimezonesList($(self).find('[name="tz"]'),bsrc.tz);

            $(self).find('[name="name"]').val(bsrc.name);
            $(self).find('[name="location"]').val('');
            $(self).find('[name="location"]').val(self.camera.getLocation());
            $(self).find('[name="lat"]').val(bsrc.lat&&bsrc.lat!='0'?bsrc.lat:'');
            $(self).find('[name="lon"]').val(bsrc.lon&&bsrc.lon!='0'?bsrc.lon:'');
            $(self).find('[name="desc"]').val(bsrc.desc ? bsrc.desc : '');
            $(self).find('[name="username"]').val(bsrc.username ? bsrc.username : '');
            $(self).find('[name="password"]').val(bsrc.password ? bsrc.password : '');
            $(self).find('[name="onvif_rtsp_port_fwd"]').val(bsrc.onvifRtspPort ? bsrc.onvifRtspPort : '');

            var subId = camera.src.meta && camera.src.meta.subid ? camera.src.meta.subid : "customParameters";
            if (subId == "CUST" || subId == "customParameters") {
                $(".custom-plan").show();
                $(self).find('[name="recording"]').val(bsrc.isRecording ? 1 : 0);
                self.camera.getRetention().then(function(rt){
                    if (rt){
                        if (rt.type!==undefined)
                            $(self).find('[name="rete_recmode"]').val(rt.type);
    
                        if (rt.type=='off') $(self).find('.rete_time').addClass("rete_off");
                        else $(self).find('.rete_time').removeClass("rete_off");
        
                        if (rt.time!==undefined)
                            $(self).find('[name="rete_time"]').val(rt.time);
                    }
    
                    let p = self.camera.getAIConfig ? self.camera.getAIConfig(self.camera.camera_id) : new Promise(function(resolve, reject){ resolve() });
                    return p.then(function(aiInfo) {
                        if (aiInfo) $(self).find('[name="ai_type"]').val(aiInfo.ai_type)
    
                        $(self).addClass('ready');
                        self.hidewait();
                        self.defferedDispatchEvent(self.loaded_event);
                    }, function(err) {
                        var t = err;
                        self.showerror('<a target="_blank" href="'+vxg.links.error+'">Error #3</a>');
                        self.defferedDispatchEvent(self.error_event);
                    });
                });
            } else {
                $(".custom-plan").hide();
            }

            $(self).addClass('ready');
            self.hidewait();
            self.defferedDispatchEvent(self.loaded_event);
        }, function(){
            self.showerror('<a target="_blank" href="'+vxg.links.error+'">Error #3</a>');
            self.defferedDispatchEvent(self.error_event);
        });

    }
    this.selectPlan = function(self, camera) {
        if (camera) {
            var subId = camera.src.meta && camera.src.meta.subid ? camera.src.meta.subid : "customParameters";
            var subName = camera.src.meta && camera.src.meta.subname ? camera.src.meta.subname : "customParameters";
            var showName = subId == "customParameters" ? "Custom Parameters" : subId == "NOPLAN" ? "No Subscription Assigned" : subName;
            $(self).find('[name="showname"]').val(showName);
        }

        var subbtnEle;
        if ($(self).hasClass("wait") || $(self).hasClass("ready")) {
            $(self).find(".subbtngen").remove();
            $(self).find('.subscription-group').append($('<span class="vxgbutton subbtn subbtngen" id="subbtn-edit">Subscriptions</span>'));
            subbtnEle = $(self).find("#subbtn-edit");
        } else {
            $(".subbtngen").remove();
            $('.subscription-group').append($('<span class="vxgbutton subbtn subbtngen" id="subbtn-new">Subscriptions</span>'));
            subbtnEle = $("#subbtn-new");
        }

        subbtnEle.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var camName = camera ? camera.src.name : "new camera";
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
                            <input type="hidden" id="name_${plan.id}" value="${plan.name}">
                        </td>
                    </tr>
                    `;
                }
            });

            planTable += `
            <tr class="plan" onclick="checkPlan('NOPLAN')">
                <td class="plan-desc" planid="NOPLAN"> No Plan </td>
                <td class="plan-count"></td>
                <td class="used-count" ></td>
                <td class="checkbox choose-sub">
                    <input id="plan_NOPLAN" class="plans-check" type="radio" name="subid" value="NOPLAN">
                    <input type="hidden" id="name_NOPLAN" value="No Plan">
                </td>
            </tr>
            `;

            var plansDialog = `
                <h1 id="plans-title">Assign Subscription to ${camName}</h1>
                <span class="currentPlan">Current Plan: ${showName}</span>
                <table class="plansTable">
                    ${planTable}
                </table>
                <button name="select" class="vxgbutton assign-btn">Select</button>
            `;
            dialogs['mdialog'].activate(plansDialog).then(function(r){
                if (r.button!='select') return;
                if (r.button=='select' && r.form.subid === undefined) return;
                var name = showName = $("#name_" + r.form.subid).val();
                if (r.form.subid == "CUST") {
                    if (camera) {
                        core.elements['global-loader'].show();
                        $(self).find('[name="recording"]').val(camera.bsrc.isRecording ? 1 : 0);
                        camera.getRetention().then(function(rt){
                            if (rt){
                                if (rt.type!==undefined)
                                    $(self).find('[name="rete_recmode"]').val(rt.type);
            
                                if (rt.type=='off') $(self).find('.rete_time').addClass("rete_off");
                                else $(self).find('.rete_time').removeClass("rete_off");
                
                                if (rt.time!==undefined)
                                    $(self).find('[name="rete_time"]').val(rt.time);
                            }
            
                            let p = camera.getAIConfig ? camera.getAIConfig(camera.camera_id) : new Promise(function(resolve, reject){ resolve() });
                            return p.then(function(aiInfo) {
                                if (aiInfo) $(self).find('[name="ai_type"]').val(aiInfo.ai_type);
                                
                                $(".custom-plan").show();
                                core.elements['global-loader'].hide();
                            })
                        });
                    } else {
                        $(".custom-plan").show();
                    }
                }
                else {
                    $(".custom-plan").hide();
                    $('.hidesett').hide();
                } 

                if ($(self).hasClass("wait")) { 
                    $(self).find('[name="showname"]').val(showName);
                    $(self).find('[name="subname"]').val(name);
                    $(self).find('[name="subid"]').val(r.form.subid);
                } else {
                    $('[name="showname"]').val(showName);
                    $('[name="subname"]').val(name);
                    $('[name="subid"]').val(r.form.subid);
                }
                return;
            });		
        });            
    }
    this.reset = function(){
        $(this).addClass('newcamera');
        $(this).find('.url_protocol [value="cloud"]').remove();
        $(this).find('.iperror').hide();
        $(this).find('[name="name"], [name="location"], [name="lat"], [name="lon"], [name="desc"], [name="url"], [name="username"], [name="password"], .url_ip, .url_http_port, .url_rtsp_port').val('');
        $(this).find('.url_path').val('onvif/device_service');
        $(this).find('.url_protocol').val('onvif');
        //$(this).find('.rete_sd input').attr('disabled','disabled').prop('checked','');
        $(this).find('.url_protocol').removeAttr('disabled');
        $(this).removeClass('options').removeClass('location').removeClass('rtsp').removeClass('cloud').addClass('onvif');
        $(this).find('.subscription-info').val('');
        $(this).find('.show-name').val('No Subscription Assigned');
        $('.custom-plan').hide();
        $('.hidesett').hide();

        $(this).find('[name="rete_recmode"]').val("off");
        $(this).find('[name="rete_time"]').val(0);
        $(this).find('[name="ai_type"]').val("off");

        this.createTimezonesList($(this).find('[name="tz"]'),moment.tz.guess());
        $(this).find('.sdrecinfo').text('');

        vxg.cameras.getLocationsList().then(function(locs) {
            var datalist = "";
            locs.forEach(loc => {
                datalist += `<option value="${loc}">`
            })

            $("#locationsList").html(datalist);
        });

        vxg.cameras.getGroupsList().then(function(groups) {
            var datalist = "";
            groups.forEach(group => {
                datalist += `<option value="${group}">`
            })

            $("#groupsList").html(datalist);
        });

        vxg.api.cloudone.user.getPlans().then(function(r) {
            vxg.user.src.plans = JSON.parse(r.plans);
        })
    }
    this.createTimezonesList = function(selector, selected) {
        selector.empty();
        if (!window['moment']) {
            selector.html('ERROR: Required moment.js.');
            return;
        }
        var tzs = moment.tz.names();
        var selectedIndex = -1;
        for(var i in tzs) {
            var tz = tzs[i];
            if (selected && tz.indexOf(selected) === 0 && selectedIndex < 0)
                selectedIndex = parseInt(i);
            var o = $('<option>').val(tz);
            if (tz !== 'UTC')
                tz += ' (UTC' + moment.tz(tzs[i]).format("Z") + ')';
            selector.append(o.html(tz));
        }
        if (selectedIndex < 0)
            selector.prepend($('<option selected>').html('Select a Timezone').val(''));
        else
            selector[0].selectedIndex = selectedIndex;
    }
    this.hidewait = function(text){
        $(this).removeClass('wait');
    }
    this.showerror = function(text){
        $(this).find('.wait span').html(text);
        $(this).find('.wait .spinner').hide();
        $(this).addClass('wait');
    }
    this.showwait = function(text){
        $(this).addClass('wait');
        if ($(this).attr('notshowwait')!==undefined) {
            $(this).find('.wait span').html('');
            $(this).find('.wait .spinner').hide();
            return;
        }
        $(this).find('.wait span').html(text);
        $(this).find('.wait .spinner').show();
    }
    this.checkDomainName = function(v){
        if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9-](?:\.[a-zA-Z0-9-]{2,})+$/.test(v)) return true;
        if (/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(v)) {
            var r = v.split('.');
            if (!window.no_check_local_addresses){
                if (r[0]=='127' || r[0]=='10' || !r[0]) return false;
                if (r[0]=='172' && r[1]=='16' || r[0]=='192' && r[1]=='168' || r[0]=='169' && r[1]=='254') return false;
            }
            if (parseInt(r[0])<1 || parseInt(r[0])>255) return false;
            if (parseInt(r[1])<0 || parseInt(r[1])>255) return false;
            if (parseInt(r[2])<0 || parseInt(r[2])>255) return false;
            if (parseInt(r[3])<1 || parseInt(r[3])>255) return false;
            return true;
        }
        return false;
    }
    this.checkDomainOrIP = function(str){
        if (str.match(new RegExp(/^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/))!==null) return true;
        if (str.match(new RegExp(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}?$/))!==null) return true;
        return false;
    }
    this.parseUrl = function(url){
        var ret = {protocol:'',host:'',port:'',user:'',password:'',path:''};
        if ((p = url.indexOf('://'))>=0){
            ret.protocol = url.substr(0,p);
            url = url.substr(p+3);
        }
        if (url.indexOf(':')>=0 && url.indexOf('@')>=0){
            p = url.indexOf(':');
            ret.user = url.substr(0,p);
            url = url.substr(p+1);
            p = url.indexOf('@');
            ret.password = url.substr(0,p);
            url = url.substr(p+1);
        }
        if ((p = url.search(/[^\d^\.^a-z^-]/))>=0){
            ret.host = url.substr(0,p);
            url = url.substr(p);
        } else {
            if (url.search(/[^\.^\d^a-z&-]/)==-1){
                ret.host = url; url='';
            }
        }
        if (url[0]==':'){
            url = url.substr(1);
            p = url.search(/[^\d]/);
            if (p>=0){
                ret.port = url.substr(0,p);
                url = url.substr(p);
            } else {
                ret.port = url;
                url = '';
            } 
        }
        if (url[0]=='/') ret.path = url.substr(1);
        else ret.path=url;
        return ret;
    }
    this.onUrlChange = function(first_start=false){ 
        var url = ($(this).find('.anccsUrl').val()||'').trim();
        var purl = this.parseUrl(url);

        $(this).find('.url_ip').val(purl.host);
        $(this).find('.url_http_port').val(purl.port);
        $(this).find('.url_user_name').val(purl.user);
        $(this).find('.url_password').val(purl.password);
        $(this).find('.url_path').val(purl.path);
        if (purl.protocol!='onvif') $(this).find('.url_prot').val(purl.protocol);
    }
    this.onUrlProtocolChange = function(){
        $(this).find('.anccsUrlOptions').removeClass('active');
        var prot = $(this).find('.url_protocol').children("option:selected").val();
        var url = $(this).find('.anccsUrl').val();
        if (prot=='onvif') {
            var path = $(this).find('.url_path').val();
            if (!path){
                $(this).find('.url_path').val('onvif/device_service');
                this.onUrlPartChange();
            }
        }
        if (prot=='rtsp') {
            var path = $(this).find('.url_path').val();
            if (path=='onvif/device_service'){
                $(this).find('.url_path').val('');
            }
            this.onUrlPartChange();
        }
    }
    this.onUrlPartChange = function(){
        var url = '';
        var prot = $(this).find('.url_protocol').children("option:selected").val();
        if (prot=='onvif')
            url='onvif://';
        else {
            var val = $(this).find('.url_prot').val().trim();
            if (val) url=val+'://';
        }
        url+=$(this).find('.url_ip').val().trim();
        var port = $(this).find('.url_http_port').val().trim();
        if (port) url+=':'+port.trim();
        var path = $(this).find('.url_path').val().trim();
        if (path) url+='/'+path;
        $(this).find('.anccsUrl').val(url);
    }
    this.onIpUrlChange = function(){
        let ip = $(this).find('.anccsUrl').val();
//        this.ipToLocation(ip);
    }
    this.onIpChange = function(){
        let ip = $(this).find('.url_ip').val();
//        this.ipToLocation(ip);
        if (ip=="" || this.checkDomainOrIP(ip)){
            this.onUrlPartChange();
            $(this).find('.iperror').hide();


//            $('.url_protocol').removeAttr('disabled');
            return;
        }
//        $('.url_protocol').attr('disabled','disabled');
        $(this).find('.iperror').show();
    }
    this.ipToLocation = function(ip){
        clearTimeout(this.location_timer);
        $(this).find('.lat,.lon').val('');
        let host = this.extractHostname(ip);
        if (!host || !window.ipworld_api_key)             
            return new Promise(function(resolve, reject){resolve({lat:'',lon:''});});
        let self = this;
        return fetch("https://app.ipworld.info/api/iplocation?apikey="+window.ipworld_api_key+"&ip="+host).then(function(r){
            return r.json();
        }).then(function(r){
            return {lat:r.latitude,lon:r.longitude};
        }).catch(function(){
            return {lat:'',lon:''};
        });

    }
}
