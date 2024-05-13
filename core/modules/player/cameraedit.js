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

function showNextTier(event, clicked, currentLocType) {
    event.stopPropagation();
    var locType = currentLocType.charAt(0).toUpperCase() + currentLocType.slice(1)
    var nextLocLevel = locTypes.indexOf(locType) + 1;
    if (nextLocLevel < 5) 
        $(clicked).parent().parent().find("." + locTypes[nextLocLevel].toLocaleLowerCase() + "-ul").toggle();
    
    $(clicked).parent().parent().find(".EMPTYLOC-ul.camslist").toggle();

    if ($(clicked).hasClass("fa-caret-up")) {
        $(clicked).removeClass('fa-caret-up');
        $(clicked).addClass('fa-caret-down');
    } else {
        $(clicked).addClass('fa-caret-up');
        $(clicked).removeClass('fa-caret-down');
    }
}

function chooseLocation(currentLocEle) {
    var showLocationArr = [];
    var locationArr = [];
    var foundAllLocs = false;
    while(!foundAllLocs) {
        currentLocEle = $(currentLocEle).parent().parent();
        var locName = $(currentLocEle).attr("locName");
        if (locName == undefined) foundAllLocs = true;
        else {
            var showName = locName.substring(locName.indexOf("_") + 1).replaceAll("_", " ");
            showLocationArr.push(showName);
            locationArr.push(locName);
        }
    }
    locationArr.reverse();
    showLocationArr.reverse();
    $('[name="show_existing_loc"]').val(showLocationArr.join(", "));
    $('[name="existing_loc"]').val(locationArr.join(":"));
}

function clearLocationChoice() {
    $('[name="show_existing_loc"]').val("");
    $('[name="existing_loc"]').val("");
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
    <label>${$.t('common.name')}</label>
    <input autofocus="autofocus" class="name" name="name" >
</div>
<div class="form-group location">
    <label>${$.t('common.location')}</label>
    <div class="dialog-group location-group">
        <input type="text" disabled class="dialog-info location-info show-location" name="shownlocation" value="">
        <input type="hidden" class="location-info" name="location_str" value="">
        <input type="hidden" class="location-info" name="new_location_str" value="">
        <span class="vxgbutton locbtn dialogbtn" id="locbtn">Locations</span>
    </div>
</div>
<div class="form-group notindvr">
    <label>${$.t('common.group')}</label>
    <input name="group" list="groupslist">
    <datalist id="groupslist"> </datalist>
</div>
<!--
<div class="form-group" style="display:none">
    <label>${$.t('common.recording')}</label>
    <select name="recording" >
        <option value="1">${$.t('common.on')}</option>
        <option value="0">${$.t('common.off')}</option>
    </select>
</div>
-->
<div class="form-group type notindvr">
    <label>${$.t('common.type')}</label> 
    <select class="url_protocol">
        <option value="onvif" selected>${$.t('common.onvifCamera')}</option>
        <option value="rtsp">${$.t('common.videoUrl')}</option>
    </select>
</div>
<div class="form-group rtspOnly notincloud notinuplink notindvr">
    <label>${$.t('common.url')}</label>
    <input name="url" class="anccsUrl">
</div>

<div class="form-group rtspOnly notincloud setting-dropdown opt-dropdown notinuplink notindvr">
    <div class="anccsUrlOptions">${$.t('common.options').toUpperCase()}</div>
</div>

<div class="form-group rtspOnly options notincloud notinuplink notindvr">
    <label for="url_prot">${$.t('common.protocol')}&nbsp;</label>
    <input type="text" class="url_prot form-control input500" value="">
</div>
<div class="form-group options notincloud notinuplink notindvr">
    <label for="url_ip">${$.t('common.ipAddressOrDomainName')}&nbsp;</label>
    <input type="text" class="url_ip form-control input500" value="">
    <div class="iperror">${$.t('newCamera.invalidDomainOrIpAddress')}</div>
</div>
<div class="form-group options notincloud notinuplink notindvr">
    <label for="url_http_port" class="onvifOnly">${$.t('common.httpPort')}&nbsp;</label>
    <label for="url_http_port" class="rtspOnly">${$.t('common.port')}&nbsp;</label>
    <input type="number" class="url_http_port form-control input500" value="">
</div>
<div class="form-group options notincloud notinuplink notindvr">
    <label class="onvifOnly" for="url_rtsp_port">${$.t('common.rtspPort')}&nbsp;</label>
    <input type="number" class="onvifOnly url_rtsp_port form-control input500" name="onvif_rtsp_port_fwd">
    <i class="onvifOnly"></i>
</div>
<div class="form-group options notincloud notindvr">
  <label for="deviceLogin">${$.t('common.username')}&nbsp;</label>
  <input type="text" class="form-control input500 url_user_name" name="username" >
</div>
<div class="form-group options notincloud notindvr" style="position: relative">
  <label for="devicePassword">${$.t('common.password')}&nbsp;</label>
  <input type="password" class="password form-control input500 url_password" autocomplete="new-password" name="password"><i class="showhidepass show-password"></i>
</div>
<div class="form-group options notincloud notindvr">
    <label class="" for="url_path">${$.t('common.path')}&nbsp;</label>
    <input type="text" class="url_path " name="url_path" value="">
</div>

<div class="form-group notindvr">
    <label>${$.t('common.timezone')}</label>
    <select name="tz">
    </select>
</div>

<div class="form-group subscription">
    <label>${$.t('common.subscription')}: </label>
    <div class="dialog-group subscription-group">
        <input type="text" disabled class="dialog-info subscription-info show-name" name="showname" value="">
        <input type="hidden" class="subscription-info" name="subname" value="">
        <input type="hidden" class="subscription-info" name="subid" value="">
    </div>
</div>

<div class="form-group setting-dropdown loc-dropdown bottom-options notindvr">
    <div class="anccsUrlLocation font-md">${$.t('common.geolocation').toUpperCase()}</div>
    <span class="carrot-icon closed"><</span>
</div>

<div class="form-group loca hidesett">
    <label>${$.t('common.latitude')}</label>
    <input name="lat" value="">
</div>
<div class="form-group loca hidesett">
    <label>${$.t('common.longitude')}</label>
    <input name="lon" value="">
</div>

<div class="form-group" style="display:none">
    <label>${$.t('common.description')}</label>
    <textarea name="desc" rows="5"></textarea>
</div>
<div class="form-group setting-dropdown rete-dropdown bottom-options custom-plan" style="display: none">
    <div class="anccsUrlRetentiontime">${$.t('common.recording').toUpperCase()}</div>
    <span class="carrot-icon closed"><</span>
</div>
<div class="form-group rete hidesett">
    <label>${$.t('common.cloudRecording')}</label>&nbsp;&nbsp;&nbsp;<label class="rectypeinfo" style="display:none;font-weight: lighter;">(${$.t('newCamera.cloudRecordingLabel')})</label>
    <select name="rete_recmode" class="rete_recmode">
        <option value="off" selected>${$.t('common.off')}</option>
        <option value="on">${$.t('common.continuous')}</option>
        <option class="dvr-disabled" value="by_event">${$.t('common.byEvent')}</option>
    </select>
</div>
<div class="form-group rete_time rete rete_off hidesett">
    <label>${$.t('newCamera.retentionTimeLabel')}</label>
    <input name="rete_time" value="72">
</div>
<div class="form-group rete reten rete_sd hidesett">
    <label class="sd-label custom-checkbox">
        <span>${$.t('newCamera.hasSdCardRecordingLabel')}</span>
        <input type="checkbox" name="rete_sd">
        <span class="checkmark"></span>	
    </label>
</div>
<div class="form-group setting-dropdown ai-dropdown bottom-options custom-plan" style="display: none">
    <div class="anccsUrlAIConfig">${$.t('newCamera.objectDetection')}</div>
    <span class="carrot-icon closed"><</span>
</div>
<div class="form-group ai_type hidesett" >
    <label>${$.t('newCamera.aiObjectDetection')}</label>
    <select name="ai_type" class="ai_type_select">
        <option value="off">${$.t('common.off')}</option>
        <option value="continuous">${$.t('common.continuous')}</option>
        <option class="dvr-disabled" value="by_event">${$.t('common.byEvent')}</option>
    </select>
</div>
</form>
<div class="sbt"><br/><br/>
<div class="wait"><span>${$.t('common.wait')}</span>&nbsp;&nbsp;<div class="spinner"></div></div>
            `+
            ($(self).attr('hidesubmit')!==undefined ? '' : `<button class="apply vxgbutton">${$.t('action.apply')}</button>`) +
            '</div>');


        /**
         * province
         * city
         * zone
         * circuit
         * subcircuit
         * 
         * dropdown with locations as options
         * option - NEW
         * on new, text input appears
         * all subsequant will be new 
         */
        $(this).find('.apply').click(function(e){
            e.preventDefault();
            self.submit_event = new Event('submit',{cancelable: true, bubbles: false, defaultPrevented: true});
            if (!self.dispatchEvent(self.submit_event)) return;
            self.submit();
        });

        $(this).addClass('onvif');
        $(this).find('.iperror').hide();
        $(this).find('.anccsUrlOptions').click(function(){ $(self).toggleClass('options'); });

        $(this).find("#locbtn").click(function(e) {
            e.preventDefault();
            if (localStorage.locationHierarchy == undefined)
                window.core.locationHierarchy.createLocationHierarchy(self);
            else {
                var editingLoc = $(self).find('[name="location_str"]').val();
                self.onLocationHierarchyLoaded(JSON.parse(localStorage.locationHierarchy), editingLoc, self);
            }
        })

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
            this.showwait($.t('common.loading'));
            return window.vxg.cameras.getCameraByIDPromise(parseInt(access_token)).then(function(camera){self.onCameraLoaded(camera);}, function(){self.onCameraLoadedFail();});
        }
        if (access_token) {
            $(this).addClass('nodata').removeClass('ready');
            this.showwait($.t('common.loading'));
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
            
            dialogs['mdialog'].activate(`        
            <h6 class="locations-title" class="font-bg">Error</h6>
            <p class="password-error-info"> 
                ${$.t('newCamera.passwordError')}
               <a href="https://datatracker.ietf.org/doc/html/rfc3986#section-3.2.1">RFC3989</a>
            </p>
            <button name="select" class="vxgbutton assign-btn">Close</button>`).then(function(r){
                return;
            })
            
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
        else if (this.isUplinkCamera(this.url))
        {
            // Change path name in the URL if it is changed
            var urlObject = new URL(this.url);
            data.url = this.url;
            data.url = data.url.replace(urlObject.pathname,"/uplink_camera/" + data.url_path)
            //data.remove('path');
            // ----------------------------------------------
        }

        if (isCloud) data.url='';
        let p;
        //if (data.url && purl && purl.host && (!data.lat || !data.lon))
        //    p = this.ipToLocation(purl.host);
        //else
            p =  new Promise(function(resolve, reject){resolve({lat:data.lat,lon:data.lon});});

        var newLocation = data.new_location_str;
        delete data.new_location_str;

        this.showwait($.t('common.saving'));
        if (!this.camera){
            p.then(function(r){
                data.lat = r.lat ? r.lat : null;
                data.lon = r.lon ? r.lon : null;
                vxg.cameras.createCameraPromise(data).then(function(r){
                    var locationStr = data.location_str;
                    if (newLocation) {
                        var locationHierarchy = localStorage.locationHierarchy ? JSON.parse(localStorage.locationHierarchy) : {};
                        var locationHierarchyCams = localStorage.locationHierarchyCams ? JSON.parse(localStorage.locationHierarchyCams) : null;
                        var newLocArr = newLocation.split(":");
                        if (newLocArr.length == 1) {
                            window.core.locationHierarchy.updateObjProp(locationHierarchy, {}, locationStr.replaceAll(":", "."))
                            if (locationHierarchyCams) {
                                window.core.locationHierarchy.updateObjProp(locationHierarchyCams, {}, locationStr.replaceAll(":", "."))
                                window.core.locationHierarchy.updateObjProp(locationHierarchyCams, [], locationStr.replaceAll(":", ".") + ".cams")
                            }
                        } 
                        else {
                            var province = newLocArr[0];
                            newLocArr.shift();
                            var locObj = {}, l = locObj;
                            var camsObj = {}, c = camsObj;
                            var groupArray = null;
                            if (window.isTelconet && data.group && newLocArr.length == 2) {
                                groupArray = newLocArr;
                                groupArray.push(data.group);
                                for(var i = 0; i < groupArray.length; i++) {
                                    c = c[newLocArr[i]] = {cams: []}
                                }
                            }

                            for(var i = 0; i < newLocArr.length; i++) {
                                l = l[newLocArr[i]] = {};
                                if (!groupArray) c = c[newLocArr[i]] = {cams: []}
                            }

                            if (locationStr == newLocation || !locationStr) {
                                locationHierarchy[province] = locObj;
                                if (locationHierarchyCams) {
                                    locationHierarchyCams[province] = camsObj;
                                    locationHierarchyCams[province].cams = [];
                                }
                            } else {
                                var fullLocArr = locationStr.split(":").filter(loc => {
                                    if (!newLocArr.includes(loc)) return loc;
                                });
                                
                                window.core.locationHierarchy.updateObjProp(locationHierarchy, locObj, fullLocArr.join("."))
                                if (locationHierarchyCams) {
                                    var camsField = {cams: []};
                                    var fullObj = {...camsField, ...camsObj}
                                    window.core.locationHierarchy.updateObjProp(locationHierarchyCams, fullObj, fullLocArr.join("."))
                                } 

                            }
                        }

                        localStorage.locationHierarchy = JSON.stringify(locationHierarchy);
                        if (locationHierarchyCams) localStorage.locationHierarchyCams = JSON.stringify(locationHierarchyCams);
                    }

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
								return;
                                //return screens['cameras'].on_show();
							},function(r){
								self.hidewait();
								if (r && r.responseJSON && r.responseJSON.errorDetail)
									alert(r.responseJSON.errorDetail);
								else
									alert($.t('toast.deleteSettingFailed'));
								self.dispatchEvent(self.submited_event);
							});

							var noLocsCams = localStorage.noLocCams ? JSON.parse(localStorage.noLocCams) : null;
                            if (noLocsCams && data.location_str == "") {
                                var formattedCam = new vxg.cameras.objects.Camera(newCam.token ? newCam.token : newCam.id);
                                formattedCam.src = newCam;
                                noLocsCams.push(formattedCam);
                                localStorage.noLocCams = JSON.stringify(noLocsCams);
                            }

							var cameraList = localStorage.cameraList ? JSON.parse(localStorage.cameraList) : null;
							if (cameraList) {                                
								cameraList.objects.push(newCam);
								var total = parseInt(cameraList.meta.total_count);
								cameraList.meta.total_count = total + 1;
								localStorage.cameraList = JSON.stringify(cameraList);
							}

                            var locationHierarchyCams = localStorage.locationHierarchyCams ? JSON.parse(localStorage.locationHierarchyCams) : {};
                            var formattedCam = new vxg.cameras.objects.Camera(newCam.token ? newCam.token : newCam.id);
                            formattedCam.src = newCam;
                            var locArr = locationStr.split(":");
                            if (window.isTelconet) {
                                var camGroup = newCam.meta.group;
                                if (camGroup && locationStr.split(":").length == 3) {
                                    locArr.push(camGroup);
                                    locArr.push("cams");
                                    window.core.locationHierarchy.addCamToHierarchy(locationHierarchyCams, locArr, formattedCam);
                                } else {
                                    locArr.push("cams");
                                    window.core.locationHierarchy.addCamToHierarchy(locationHierarchyCams, locArr, formattedCam);
                                }
                            } else {
                                locArr.push("cams");
                                window.core.locationHierarchy.addCamToHierarchy(locationHierarchyCams, locArr, formattedCam);
                            }

                            localStorage.locationHierarchyCams = JSON.stringify(locationHierarchyCams);

                            
                            var tableData = $("#table").bootstrapTable('getData');
                            var insertIndex = tableData.length;
                            var order = insertIndex + 1;
                            let captured = newCam && newCam.meta && newCam.meta.capture_id && vxg.user.src.capture_id == newCam.meta.capture_id ? ' captured' : '';
                            let statusBlock = '<div class="caminfo tablecaminfo '+newCam.status+' '+(newCam.status=='active'?' online':'')+'">'+ (newCam.status=='active'?$.t('common.online'):$.t('common.offline'))+'</div>';
                            var tableGroup = newCam.meta && newCam.meta.group ? newCam.meta.group : "";
                            if (tableGroup.toLocaleLowerCase() == "favorite" || tableGroup.toLocaleLowerCase() == "favourite") {
                                tableGroup = $.t('common.favourite');
                            }
                            $("#table").bootstrapTable('insertRow', {
                                index: insertIndex,
                                row: {
                                    camId: newCam.id,
                                    order: order,
                                    state: `<label class="filter-label custom-checkbox" style="margin-left: 25%;">
                                    <input type="checkbox" class="groupCamCheck" cam_name="${newCam.name}" cam_id="${newCam.id}" cam_order="${order}">
                                    <span class="checkmark"></span>	
                                </label>`,
                                    id: `<div class="camerablock${captured}" access_token="${newCam.id}" id="scrollto${newCam.id}">
                                    <campreview onclick_toscreen="tagsview" style="cursor: pointer;"></campreview>`,
                                    status: statusBlock,
                                    recording: newCam.recording ? $.t('action.yes') : $.t('action.no'),
                                    name: newCam.name,
                                    location: newCam.meta && newCam.meta.location ? newCam.meta.location : "",
                                    group: tableGroup,
                                    action: `<div class="settings" access_token="${newCam.token}" cam_order="${order}" cam_id="${newCam.id}" gateway_id="${null}" gateway_token="${null}">
                                    <svg class="inline-svg-icon icon-action"><use xlink:href="#action"></use></svg>
                                </div>`,
                                    hide: 1
                                }
                            })


						}, function(err) {
							self.hidewait();
							if (r && r.responseJSON && r.responseJSON.errorDetail)
								alert(r.responseJSON.errorDetail);
							else
								alert($.t('toast.findingCreatedCameraFailed'));
						})
					}, function(r) {
						self.hidewait();
						if (r && r.responseJSON && r.responseJSON.errorDetail)
							self.showerror(r.responseJSON.errorDetail);
						else 
							alert($.t('toast.settingRetentionAiFailed'));

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
                        self.showerror(`<a target="_blank" href="${vxg.links.error}">${$.t('common.error')} #2</a>`);
                    setTimeout(function(){self.hidewait();},2000);
                    self.defferedDispatchEvent(self.error_event);
                });
            });
            return;
        }

        var oldLocArr = this.camera ? window.core.locationHierarchy.createLocationArray(this.camera.src.meta) : [];
        p.then(function(r){
            data.lat = r.lat ? r.lat : null;
            data.lon = r.lon ? r.lon : null;
            if (data.subid && data.subid == "NOPLAN") {
                data.rete_recmode = "off";
                data.rete_time = 0;
            }
            self.camera.updateCameraPromise(data).then(function(r){
                var locationStr = data.location_str;
                if (newLocation) {
                    var locationHierarchy = localStorage.locationHierarchy ? JSON.parse(localStorage.locationHierarchy) : {};
                    var locationHierarchyCams = localStorage.locationHierarchyCams ? JSON.parse(localStorage.locationHierarchyCams) : null;
                    var newLocArr = newLocation.split(":");
                    if (newLocArr.length == 1) {
                        window.core.locationHierarchy.updateObjProp(locationHierarchy, {}, locationStr.replaceAll(":", "."))
                        if (locationHierarchyCams) {
                            window.core.locationHierarchy.updateObjProp(locationHierarchyCams, {}, locationStr.replaceAll(":", "."))
                            window.core.locationHierarchy.updateObjProp(locationHierarchyCams, [], locationStr.replaceAll(":", ".") + ".cams")
                        }
                    } 
                    else {
                        var province = newLocArr[0];
                        newLocArr.shift();
                        var locObj = {}, l = locObj;
                        var camsObj = {}, c = camsObj;
                        var groupArray = null;
                        if (window.isTelconet && data.group && newLocArr.length == 2) {
                            groupArray = newLocArr;
                            groupArray.push(data.group);
                            for(var i = 0; i < groupArray.length; i++) {
                                c = c[newLocArr[i]] = {cams: []}
                            }
                        }

                        for(var i = 0; i < newLocArr.length; i++) {
                            l = l[newLocArr[i]] = {};
                            if (!groupArray) c = c[newLocArr[i]] = {cams: []}
                        }

                        if (locationStr == newLocation || !locationStr) {
                            locationHierarchy[province] = locObj;
                            if (locationHierarchyCams) {
                                locationHierarchyCams[province] = camsObj;
                                locationHierarchyCams[province].cams = [];
                            }
                        } else {
                            var fullLocArr = locationStr.split(":").filter(loc => {
                                if (!newLocArr.includes(loc)) return loc;
                            });
                            
                            window.core.locationHierarchy.updateObjProp(locationHierarchy, locObj, fullLocArr.join("."))
                            if (locationHierarchyCams) {
                                var camsField = {cams: []};
                                var fullObj = {...camsField, ...camsObj}
                                window.core.locationHierarchy.updateObjProp(locationHierarchyCams, fullObj, fullLocArr.join("."))
                            } 

                        }
                    }

                    localStorage.locationHierarchy = JSON.stringify(locationHierarchy);
                    if (locationHierarchyCams) localStorage.locationHierarchyCams = JSON.stringify(locationHierarchyCams);
                }

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
									alert($.t('toast.deleteSettingFailed'));
								self.hidewait();
							});
						} else {
							$(self).attr('access_token','');
							self.reset();
							self.dispatchEvent(self.submited_event);
						}
                        
                        var noLocsCams = localStorage.noLocCams ? JSON.parse(localStorage.noLocCams) : null;
                        var camExistsInArr = noLocsCams && noLocsCams.some(cam => cam.camera_id == updatedCam.id)
                        if (!camExistsInArr && data.location_str == "") {
                            var formattedCam = new vxg.cameras.objects.Camera(updatedCam.token ? updatedCam.token : updatedCam.id);
                            formattedCam.src = updatedCam;
                            noLocsCams.push(formattedCam);
                            localStorage.noLocCams = JSON.stringify(noLocsCams);
                        } else if (camExistsInArr && data.location_str != "") {
                            var removeCam = noLocsCams.filter(cam => { return cam.camera_id != updatedCam.id});
                            if (removeCam.length == 0) localStorage.removeItem(noLocCams)
                            else localStorage.noLocCams = JSON.stringify(removeCam);
                        }

						var cameraList = localStorage.cameraList ? JSON.parse(localStorage.cameraList) : null;
						if (cameraList) {
							var oldCamIndex = cameraList.objects.findIndex(c => c.id == updatedCam.id);
							cameraList.objects[oldCamIndex] = updatedCam;
							localStorage.cameraList = JSON.stringify(cameraList);
						}

                        var locationHierarchyCams = localStorage.locationHierarchyCams ? JSON.parse(localStorage.locationHierarchyCams) : {};
                        var formattedCam = new vxg.cameras.objects.Camera(updatedCam.token ? updatedCam.token : updatedCam.id);
                        formattedCam.src = updatedCam;
                        window.core.locationHierarchy.updateCamInHierarchy(locationHierarchyCams, oldLocArr, formattedCam);
                        localStorage.locationHierarchyCams = JSON.stringify(locationHierarchyCams);
                        

						return screens['cameras'].on_show();
					})
				})
            },function(r){
                self.hidewait();
                if (r && r.responseJSON && r.responseJSON.errorDetail)
                    self.showerror(r.responseJSON.errorDetail);
                else
                    self.showerror(`<a target="_blank" href="${vxg.links.error}">${$.t('common.error')} #2</a>`);
                setTimeout(function(){self.hidewait();},2000);
                self.defferedDispatchEvent(self.error_event);
            });
        });
        return true;
    },
    this.onCameraLoadedFail = function(r){
        $(this).addClass('nodata');
        this.showerror(`<a target="_blank" href="${vxg.links.error}">${$.t('common.error')} #3</a>`);
        this.defferedDispatchEvent(this.error_event);
        return r;
    }
    this.isUplinkCamera = function(url){
        // We may extend this function in the future
        return url && url.includes("/uplink_camera/")
    }
    this.onCameraLoaded = function(camera){
        let self = this;
        if (!camera) return this.onCameraLoadedFail();
        $(this).removeClass('nodata');
        this.camera = camera;

        this.showwait($.t('common.loading'));
        this.camera.getConfig().then(function(bsrc){            
            self.selectPlan(self, camera);

            if (!bsrc){
                self.showerror(`<a target="_blank" href="${vxg.links.error}">${$.t('common.error')} #3</a>`);
                self.defferedDispatchEvent(self.error_event);
                return;
            }
            if (!bsrc.url) {
                bsrc.url='';
                $(self).find('.url_protocol').attr('disabled','disabled');
            }

            if ( self.isUplinkCamera(bsrc.url) ) {
                $(self).find('.url_protocol').attr('disabled','disabled');
                $(self).find('.url_protocol').append(`<option value="uplink">${$.t('common.uplinkCamera')}`);
            }

            if (!bsrc.url && !$(self).find('.url_protocol [value="cloud"]').length) {
                $(self).find('.url_protocol').append(`<option value="cloud">${$.t('common.cloudCamera')}`);
            }
            //else
                //$(self).find('.rete_sd input').attr('disabled','disabled').prop('checked','');

            $(self).removeClass('rtsp').removeClass('onvif').removeClass('cloud').removeClass('dvr');

            if (!bsrc.url && !$(self).find('.url_protocol [value="cloud"]').length) {
                $(self).find('.url_protocol').append(`<option value="cloud">${$.t('common.cloudCamera')}`);
            }
                
            if (bsrc.url.substr(0,5)=='onvif') {
                $(self).find('.url_protocol').val('onvif');
                $(self).addClass('onvif');
            } else if (self.isUplinkCamera(bsrc.url)) {
                $(self).find('.url_protocol').val('uplink');
                $(self).addClass('uplink');
            } else if (bsrc.url.includes("/dvr_camera/")) {
                $(self).addClass('dvr');
                $(self).find('.dvr-disabled').attr('disabled', true);
            } else {
                if (bsrc.url){
                    $(self).find('.url_protocol').val('rtsp');
                    $(self).addClass('rtsp');
                } else {
                    $(self).find('.url_protocol').val('cloud');
                    $(self).addClass('cloud');
                }
            }

            var url = bsrc.url
            if (self.isUplinkCamera(bsrc.url))
            {
                url = ''; self.url = bsrc.url;

                var url1 = new URL(bsrc.url);
                if (url1)
                {
                    var modifiedUrl = url1.pathname.replace(new RegExp("^" + "/uplink_camera/"), "");
                    $(self).find('[name="url_path"]').val(modifiedUrl);
                }
                $(self).find('[name="url"]').val(url);
            }
            else // Other cameras
            {
                $(self).find('[name="url"]').val(url);
            self.onUrlChange();
            }


            self.createTimezonesList($(self).find('[name="tz"]'),bsrc.tz);

            $(self).find('[name="name"]').val(bsrc.name);
            $(self).find('[name="location"]').val('');
            //$(self).find('[name="location"]').val(self.camera.src.meta && self.camera.src.meta.location ? self.camera.src.meta.location : '' );
            $(self).find('[name="group"]').val(self.camera.src.meta && self.camera.src.meta.group ? self.camera.src.meta.group : '' );
            $(self).find('[name="lat"]').val(bsrc.lat&&bsrc.lat!='0'?bsrc.lat:'');
            $(self).find('[name="lon"]').val(bsrc.lon&&bsrc.lon!='0'?bsrc.lon:'');
            $(self).find('[name="desc"]').val(bsrc.desc ? bsrc.desc : '');
            $(self).find('[name="username"]').val(bsrc.username ? bsrc.username : '');
            $(self).find('[name="password"]').val(bsrc.password ? bsrc.password : '');
            $(self).find('[name="onvif_rtsp_port_fwd"]').val(bsrc.onvifRtspPort ? bsrc.onvifRtspPort : '');
            if (camera.src.meta) {
                var showLocation = [];
                var locationStr = [];
                locTypes.forEach(loc => {
                    if (camera.src.meta[loc]) {
                        showLocation.push(camera.src.meta[loc])
                        locationStr.push(loc.toLocaleLowerCase() + "_" + camera.src.meta[loc].replaceAll(" ", "_"));
                    }
                })
                $(self).find('.show-location').val(showLocation.join((", ")))
                $(self).find('[name="location_str"]').val(locationStr.join(":"))
            }


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
                        self.showerror(`<a target="_blank" href="${vxg.links.error}">${$.t('common.error')} #3</a>`);
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
            self.showerror(`<a target="_blank" href="${vxg.links.error}">${$.t('common.error')} #3</a>`);
            self.defferedDispatchEvent(self.error_event);
        });

    }
    this.onLocationHierarchyLoaded = function(locationHierarchy, editingLoc = '', self = null) {
        var dropdownTreeStr;
        locationHierarchy = window.core.locationHierarchy.sortLocations(locationHierarchy);
        if ( Object.keys(locationHierarchy).length == 0) {
            dropdownTreeStr = "<p class='nolocs font-md'>No locations have been set for this account. Add a location below</p>"
        } else {
            var dropdownTree = this.createLocationList(locationHierarchy)
            dropdownTreeStr = $(dropdownTree).prop('outerHTML');
        }

        var showValue = editingLoc ? $(self).find(".show-location").val() : "";
        var existingValue = editingLoc ? editingLoc : "";

        var locationDialog = `
            <h4 class="locations-title" class="font-bg">Locations</h4>
            ${dropdownTreeStr}
            <p class="location-info"> 
                To add a new location under an existing location, choose the existing location from the list above. 
                Then add the name or list of names seperated by commas you want to add under that chosen location.
            </p>
            <div class="existing-loc-cont">
                <label for="show_existing_loc">Existing Location:</label>
                <div class="existing-input-cont">
                    <input name="show_existing_loc" class="disabled choosen-location" type="text" value="${showValue}"></input>
                    <input name="existing_loc" class="choosen-location" type="hidden" value="${existingValue}"></input>
                    <span class="clear-location vxgbutton" onclick="clearLocationChoice()">Remove</span>
                </div>
            </div>
            <div class="new-loc-cont">
                <label for="new_loc" title="Location will be added to the existing location choosen. Separate any sublevel locations you want to add by commas">Add New Location:</label>
                <input name="new_loc" title="Location will be added to the existing location choosen. Separate any sublevel locations you want to add by commas" class="new-location" type="text"></input>
            </div>
            <button name="select" class="vxgbutton assign-btn">Select</button>
        `
        dialogs['mdialog'].activate(locationDialog).then(function(r){
            if (r.button!='select') return;
            var showLoc = r.form.show_existing_loc ? r.form.show_existing_loc : "";
            var existing_loc = r.form.existing_loc ? r.form.existing_loc.split(":") : [];
            var locArr = r.form.existing_loc ? r.form.existing_loc.split(":") : [];
            if (locArr.length == locTypes.length) {
                alert("Cannot add a new location to a "+ locTypes[locTypes.length - 1] +".");
            }
            
            var newLocArr = r.form.new_loc ? r.form.new_loc.split(",") : [];
            var newLocStr = [];
            for (var i = 0; i < newLocArr.length; i++) {
                var newLocName = newLocArr[i].trim();
                if (existing_loc.length + i > 4) break;
                var newLoc = locTypes[existing_loc.length + i].toLocaleLowerCase() + "_" + newLocName.replaceAll(" ", "_");
                locArr.push(newLoc)
                newLocStr.push(newLoc);
            }
            $('[name="new_location_str"]').val(newLocStr.length > 0 ? newLocStr.join(":") : "");
            showLoc += showLoc ? ", " + r.form.new_loc : r.form.new_loc;

            $('[name="shownlocation"]').val(showLoc);
            $('[name="location_str"]').val(locArr.join(":"));
        });		
    }
    this.createLocationList = function(locationHierarchy) {
        if (locationHierarchy instanceof Object && !(locationHierarchy instanceof String)) {
            var firstObj = Object.keys(locationHierarchy)[0];
            var locType = firstObj ? firstObj.split("_")[0] : "EMPTY";
            var ul = $(`<ul class="location-hierarchy ${locType}-ul" ${(locType != "province" ? `style="display:none"` : "")}></ul>`);
            for (var child in locationHierarchy) {
                var childName = child.substring(child.indexOf("_") + 1).replaceAll("_", " ");
                var li_ele = $(`
                        <li class="loc-dropdown ${child}-dropdown" locName=${child}>
                            <div class="location-btn-cont">
                                <span class="loc-name" onclick="chooseLocation(this)">${childName}</span>
                                <i class="location-arrow fa fa-caret-down" onclick="showNextTier(event, this, '${locType}')" aria-hidden="true"></i>
                            </div>    
                        </li>`);
                li_ele.append(this.createLocationList(locationHierarchy[child]));
                ul.append(li_ele);
            }
            return ul;
        }
    }
    this.selectPlan = function(self, camera) {
        if (camera) {
            var subId = camera.src.meta && camera.src.meta.subid ? camera.src.meta.subid : "customParameters";
            var subName = camera.src.meta && camera.src.meta.subname ? camera.src.meta.subname : "customParameters";
            var showName = subId == "customParameters" ? $.t('common.customParameters') : subId == "NOPLAN" ? $.t('newCamera.noSubscriptionAssigned') : subName;
            $(self).find('[name="showname"]').val(showName);
        }

        var subbtnEle;
        if ($(self).hasClass("wait") || $(self).hasClass("ready")) {
            $(self).find(".subbtngen").remove();
            $(self).find('.subscription-group').append($(`<span class="vxgbutton dialogbtn subbtn subbtngen" id="subbtn-edit">${$.t('common.subscriptions')}</span>`));
            subbtnEle = $(self).find("#subbtn-edit");
        } else {
            $(".subbtngen").remove();
            $('.subscription-group').append($(`<span class="vxgbutton dialogbtn subbtn subbtngen" id="subbtn-new">${$.t('common.subscriptions')}</span>`));
            subbtnEle = $("#subbtn-new");
        }

        subbtnEle.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var camName = camera ? camera.src.name : "new camera";
            planTable = `
                <tr class="plan-header">
                    <th>${$.t('common.plan')}</th>
                    <th>${$.t('common.count')}</th>
                    <th>${$.t('common.used')}</th>
                    <th></th>
                </tr>
            `;
            vxg.user.src.plans.forEach(plan => {
                if (plan.count != 0) {
                    var enabled = plan.count == plan.used || (camera && camera.bsrc.url.includes('dvr_camera') && plan.name.includes("Event")) ? '' : `onclick="checkPlan('${plan.id}')`;
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
                <td class="plan-desc" planid="NOPLAN"> ${$.t('newCamera.noPlan')} </td>
                <td class="plan-count"></td>
                <td class="used-count" ></td>
                <td class="checkbox choose-sub">
                    <input id="plan_NOPLAN" class="plans-check" type="radio" name="subid" value="NOPLAN">
                    <input type="hidden" id="name_NOPLAN" value="No Plan">
                </td>
            </tr>
            `;

            var plansDialog = `
                <h1 id="plans-title">${$.t('newCamera.assignSubscriptionTo')} ${camName}</h1>
                <span class="currentPlan">${$.t('common.currentPlan')}: ${showName}</span>
                <table class="plansTable">
                    ${planTable}
                </table>
                <button name="select" class="vxgbutton assign-btn">${$.t('action.select')}</button>
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
        $(this).find('.location-dropdown-item').hide();
        $(this).find('.location-dropdown-input').val('');
        $(this).find('.location-group').removeClass("location-border");
        $(this).find('.url_protocol [value="cloud"]').remove();
        $(this).find('.iperror').hide();
        $(this).find('[name="name"], [name="location"], [name="shownlocation"], [name="new_location_str"], [name="location_str"], [name="group"], [name="lat"], [name="lon"], [name="desc"], [name="url"], [name="username"], [name="gatewayId"], [name="gatewayUrl"], .url_ip, .url_http_port, .url_rtsp_port').val('');
        $(this).find('.url_path').val('onvif/device_service');
        $(this).find('.url_protocol').val('onvif');
        //$(this).find('.rete_sd input').attr('disabled','disabled').prop('checked','');
        $(this).find('.url_protocol').removeAttr('disabled');
        $(this).removeClass('options').removeClass('location').removeClass('rtsp').removeClass('cloud').addClass('onvif').removeClass('uplink');
        $(this).find('.subscription-info').val('');
        $(this).find('.show-name').val($.t('newCamera.noSubscriptionAssigned'));
        $('.custom-plan').hide();
        $('.hidesett').hide();
        $('.loc-dropdown').show();

        $('[name="location"]').removeClass("disabled");
        $('[name="group"]').removeClass("disabled");

        $(this).find('[name="rete_recmode"]').val("off");
        $(this).find('[name="rete_time"]').val(0);
        $(this).find('[name="ai_type"]').val("off");

        this.createTimezonesList($(this).find('[name="tz"]'),moment.tz.guess());
        $(this).find('.sdrecinfo').text('');

        $(this).find('.dvr-disabled').attr('disabled', false);

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

        if ($('.url_protocol option[value="uplink"]'))  $('.url_protocol option[value="uplink"]').remove();
        if ($('.url_protocol option[value="cloud"]'))  $('.url_protocol option[value="cloud"]').remove();


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
            selector.prepend($('<option selected>').html($.t('newCamera.selectTimezonePlaceholder')).val(''));
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

        if (this.isUplinkCamera(this.url))
            return ;

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
