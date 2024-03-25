window.screens = window.screens || {};
window.controls = window.controls || {};
var path = window.core.getPath('newcloudcamera.js');

window.controls['newcloudcamera'] = {
    'js':[],
    'css':[path+'newcloudcamera.css'],
    'commoncss':[],
    'commonjs':[/*'sdk/moment.min.js','sdk/moment-timezone-with-data-2012-2022.min.js'*/],
    'observedAttributes':function(){
        return ['access_token'];
    },
    'on_init':function(element){
        CameraCloudEditControl.apply(element,[]);
        return this.connectedCallback();
    },
    'attributeChangedCallback':function(name, value){
        this.attributeChangedCallback(name,value);
    },
    'disconnectedCallback':function(){
        this.disconnectedCallback();
    },
}

CameraCloudEditControl = function(){
    this.defferedDispatchEvent = function(event){
        let self = this; let ev = event;
        setTimeout(function(){self.dispatchEvent(ev);},0);
    }
    this.connectedCallback = function(){
        this.submited_event = new Event('submited',{cancelable: false, bubbles: true});
        this.error_event = new Event('error',{cancelable: false, bubbles: true});
        this.loaded_event = new Event('loaded',{cancelable: false, bubbles: true});
        let self = this;
        access_token = $(this).getNearParentAtribute('access_token');
        let camera_finder_link = $(this).html();
        $(this).html(`
<form class="none">
<div class="form-group camera_finder_link">
`+camera_finder_link+`
</div>
<input type="hidden" name="gatewayId">
<input type="hidden" name="gatewayUrl">
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
        <span class="vxgbutton locbtn dialogbtn" id="locbtn-cloud">${$.t('common.locations')}</span>
    </div>
</div>
<div class="form-group">
    <label>${$.t('common.group')}</label>
    <input name="group" list="groupslist">
    <datalist id="groupslist"> </datalist>
</div>
<!--
<div class="form-group" style="display:none">
    <label>${$.t('common.recording')}</label>
    <select name="recording" >
        <option value="1">On</option>
        <option value="0">Off</option>
    </select>
</div>
-->
<div class="form-group type" style="display:none">
    <label>${$.t('common.type')}</label>&nbsp;&nbsp;&nbsp;<a target="_blank" rel="noopener noreferrer" href="`+vxg.links.error+`">${$.t('cameras.howtoAddACamera')}</a> 
    <select class="url_protocol">
        <option value="onvif" selected>${$.t('common.onvifCamera')}</option>
        <option value="rtsp">${$.t('common.videoUrl')}</option>
    </select>
</div>
<div class="form-group rtspOnly notincloud" style="display:none">
    <label>${$.t('common.url')}</label>
    <input name="url" class="anccsUrl">
</div>

<div class="form-group rtspOnly notincloud" style="display:none">
    <div class="anccsUrlOptions">${$.t('common.options').toUpperCase()}</div>
</div>

<div class="form-group rtspOnly options notincloud" style="display:none">
    <label for="url_prot">${$.t('common.protocol')}&nbsp;</label>
    <input type="text" class="url_prot form-control input500" value="">
</div>
<div class="form-group options notincloud gatewayinput" style="display:none">
    <label class="gateway_ip_label" for="url_ip">${$.t('newCamera.cameraIpLabel')}</label>
    <input type="text" name="url_ip" class="url_ip form-control input500" value="">
    <div class="iperror">${$.t('newCamera.invalidDomainOrIpAddress')}</div>
</div>
<div class="form-group options notincloud gatewayinput" style="display:none">
    <label for="url_http_port" class="onvifOnly">${$.t('common.httpPort')}&nbsp;</label>
    <label for="url_http_port" class="rtspOnly">${$.t('common.port')}&nbsp;</label>
    <input type="number" name="url_http_port" class="url_http_port form-control input500" value="">
</div>
<div class="form-group options notincloud gatewayinput" style="display:none">
    <label class="onvifOnly" for="url_rtsp_port">${$.t('common.rtspPort')}&nbsp;</label>
    <input type="number" class="onvifOnly url_rtsp_port form-control input500" name="onvif_rtsp_port_fwd">
    <i class="onvifOnly"></i>
</div>
<div class="form-group options notincloud" style="display:none">
  <label for="deviceLogin">${$.t('common.username')}&nbsp;</label>
  <input type="text" class="form-control input500 url_user_name" name="username" >
</div>
<div class="form-group options notincloud" style="position: relative;display:none">
  <label for="devicePassword">${$.t('common.password')}&nbsp;</label>
  <input type="password" class="password form-control input500 url_password" autocomplete="new-password" name="password"><i class="showhidepass show-password"></i>
</div>
<div class="form-group options notincloud notindvr" style="display:none">
    <label class="" for="url_path">${$.t('common.path')}&nbsp;</label>
    <input type="text" class="url_path form-control input500" value="">
</div>

<div class="form-group">
    <label>${$.t('common.timezone')}</label>
    <select name="tz">
    </select>
</div>
<div class="form-group" style="display:none">
    <label>${$.t('common.latitude')}</label>
    <input name="lat" value="0">
</div>
<div class="form-group" style="display:none">
    <label>${$.t('common.longitude')}</label>
    <input name="lon" value="0">
</div>

<div class="form-group" style="display:none">
    <label>${$.t('common.description')}</label>
    <textarea name="desc" rows="5"></textarea>
</div>
<div class="form-group" style="display:none">
    <label>${$.t('common.serialNumber')}</label>
    <input autofocus="autofocus" class="serialnumber" name="serialnumber">
</div>
<div class="form-group" style="display:none">
    <label>${$.t('common.password')}</label>
    <input type="password" autofocus="autofocus" class="gspassword" name="gspassword">
</div>
<div class="form-group subscription">
    <label>${$.t('common.subscription')}: </label>
    <div class="subscription-group-cloud">
        <input type="text" disabled class="subscription-info show-name" name="showname" value="">
        <span class="vxgbutton subbtn" id="subbtn-cloud">${$.t('common.subscriptions')}</span>
        <input type="hidden" class="subscription-info" name="subname" value="">
        <input type="hidden" class="subscription-info" name="subid" value="">
    </div>
</div>
</form>
<div class="sbt">
<div class="wait"><span>${$.t('common.wait')}</span>&nbsp;&nbsp;<div class="spinner"></div></div>
            `+
            '</div>');
        var dropdownOpts = `<div class="form-group setting-dropdown loc-dropdown bottom-options">
        <div class="anccsUrlLocation">${$.t('common.geolocation').toUpperCase()}</div>
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
    <div class="form-group setting-dropdown rete-dropdown bottom-options custom-plan" style="display: none">
            <div class="anccsUrlRetentiontime">${$.t('common.recording').toUpperCase()}</div>
            <span class="carrot-icon closed"><</span>
        </div>
        <div class="form-group rete hidesett">
            <label>${$.t('common.cloudRecording')}</label>&nbsp;&nbsp;&nbsp;<label class="rectypeinfo" style="display:none;font-weight: lighter;">(${$.t('newCamera.cloudRecordingLabel')})</label>
            <select name="rete_recmode" class="rete_recmode" id="recmode_cloud">
                <option value="off" selected>${$.t('common.off')}</option>
                <option value="on">${$.t('common.continuous')}</option>
                <option value="by_event">${$.t('common.byEvent')}</option>
            </select>
        </div>
        <div class="form-group rete_time rete rete_off hidesett" id="retetime_cloud">
            <label>${$.t('newCamera.retentionTimeLabel')}</label>
            <input name="rete_time" value="72">
        </div>
        <div class="form-group rete reten rete_sd hidesett">
            <label class="sd-label custom-checkbox" id="locctrl">
                <span>${$.t('newCamera.hasSdCardRecordingLabel')}</span>
                <input type="checkbox" name="rete_sd">
                <span class="checkmark"></span>	
            </label>
        </div>
        <div class="form-group setting-dropdown ai-dropdown bottom-options custom-plan" style="display: none">
        <div class="anccsUrlAIConfig">${$.t('newCamera.objectDetection')}</div>
        <span class="carrot-icon closed"><</span>
    </div>
    <div class="form-group ai_type hidesett">
        <label>${$.t('newCamera.aiObjectDetection')}</label>
        <select name="ai_type" class="ai_type_select">
            <option value="off">${$.t('common.off')}</option>
            <option value="continuous">${$.t('common.continuous')}</option>
            <option value="by_event">${$.t('common.byEvent')}</option>
        </select>
    </div>`;

        $('#dropdown-options').html(dropdownOpts);
        $('#plugin-dropdown-options').html(dropdownOpts);

        $(this).find('.cloudapply').click(function(){
            self.submit_event = new Event('submit',{cancelable: true, bubbles: true});
            if (!self.dispatchEvent(self.submit_event)) return;
            self.submit();
        });

        $(this).addClass('onvif');
        $(this).find('.iperror').hide();
        $(this).find('.anccsUrlOptions').click(function(){
            $(self).toggleClass('options');
        });

        $(this).find("#locbtn-cloud").click(function(e) {
            e.preventDefault();
            if (localStorage.locationHierarchy == undefined)
                self.createLocationHierarchy();
            else {
                var editingLoc = $(self).find('[name="location_str"]').val();
                self.onLocationHierarchyLoaded(JSON.parse(localStorage.locationHierarchy), editingLoc, self);
            }
        })
        
        $('#dropdown-options .rete .rete_recmode').change(function(){
            let type = $(this).val();
            let url = ($('.anccsUrl').val()||'').trim();
            if (type=='off') $('#dropdown-options .rete_time').addClass("rete_off");
            else $('#dropdown-options .rete_time').removeClass("rete_off").show();

            if (url.substr(0,5)=='rtsp:' && type=='by_event')
                $('.rectypeinfo').show();
            else
                $('.rectypeinfo').hide();
        });

        $('#plugin-dropdown-options .rete .rete_recmode').change(function(){
            let type = $(this).val();
            let url = ($('.anccsUrl').val()||'').trim();
            if (type=='off') $('#plugin-dropdown-options .rete_time').addClass("rete_off");
            else $('#plugin-dropdown-options .rete_time').removeClass("rete_off").show();

            if (url.substr(0,5)=='rtsp:' && type=='by_event')
                $('.rectypeinfo').show();
            else
                $('.rectypeinfo').hide();
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
        if (vxg.user.src.plans && vxg.user.src.plans.length > 0) {
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
    this.submit = function(){
        let self = this;
        let isOptions = $(this).hasClass('options');
        let isCloud = $(this).hasClass('cloud');
        let isOnvif = $(this).hasClass('onvif');
        let serverSerial = $(".serial-number-input").val();
        let macAddress = $(".mac-address-input").val();
        var rtspOnly = $("#rtsp-only-input").is(':checked');
        var pass = $(".password-input").val();
        var username = $(".username-input").val();
        var path = $(".path-input").val();
        let data = $(this).find('form').serializeObject();
        let hiddenOpts = (self.id == "plugin-camera") ? $('#plugin-dropdown-options').serializeObject() : $('#dropdown-options').serializeObject();
        data = {...data, ...hiddenOpts};
        for (let i in data) if (typeof data[i] === 'string') data[i]=data[i].trim();
        if ($(this).hasClass('rtsp')) delete data['onvif_rtsp_port_fwd'];
        if ($(".newcameratabs").hasClass("add5")) {
            // class for uplink tabs
            data.password = pass;
            data.username = username;
            data.uplink = true;
	    data.path = path;	
        }
        if (!data.name){
            core.flashInputBackgroundColor($(this).find('.name'));
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
        
            if (!this.checkDomainName(purl.host) & !this.checkDomainOrIP(purl.host)) {
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

        if (macAddress && serverSerial) {
            data.serialnumber = String(serverSerial).toUpperCase();
            data.macAddress = String(macAddress).toUpperCase();
        }

        if (rtspOnly) {
            data.rtspOnly = true;
        }

        if (isCloud) data.url='';
        if (!serverSerial) this.showwait($.t('common.saving'));
        else {
            $(".server-status").html($.t('common.saving'))
            $(".server-status").show();
        }

        data.gatewayCam = data.gatewayId ? true : false;
        var newLocation = data.new_location_str;
        delete data.new_location_str;

        let res;
        if (!this.camera)
            res = vxg.cameras.createCameraPromise(data);
        else
            res = this.camera.updateCameraPromise(data);
        res.then(function(r){
            if (newLocation) {
                var locationStr = data.location_str;
                var locationHierarchy = localStorage.locationHierarchy ? JSON.parse(localStorage.locationHierarchy) : {};
                var newLocArr = newLocation.split(":");
                if (newLocArr.length == 1) self.updateObjProp(locationHierarchy, {}, locationStr.replaceAll(":", "."))
                else {
                    var currPath = locationStr == newLocation || !locationStr ? "" : locationStr.replace(":" + newLocation, "");
                    if (!currPath) {
                        var province = newLocArr[0];
                        newLocArr.shift();
                        var object = {}, o = object;
                        for(var i = 0; i < newLocArr.length; i++) {
                            o = o[newLocArr[i]] = {};
                        }
                        locationHierarchy[province] = object;
                    } else {
                        var province = newLocArr[0];
                        newLocArr.shift();
                        var object = {}, o = object;
                        for(var i = 0; i < newLocArr.length; i++) {
                            o = o[newLocArr[i]] = {};
                        }

                        if (locationStr == newLocation || !locationStr) {
                            locationHierarchy[province] = object;
                        } else {
                            var fullLocArr = locationStr.split(":").filter(loc => {
                                if (!newLocArr.includes(loc)) return loc;
                            });
                            
                            self.updateObjProp(locationHierarchy, object, fullLocArr.join("."))
                        }
                    }
                }

                localStorage.locationHierarchy = JSON.stringify(locationHierarchy);
            }
                    if (r['allCamsToken']) 
                        vxg.user.src.allCamsToken = r['allCamsToken'];
                    
                    var custProm =  new Promise(function(resolve, reject){resolve({lat:data.lat,lon:data.lon});});

                    if (data.subid == "CUST") { 
                        custProm = vxg.api.cloudone.camera.setRetention(r.id, {recording: false, time: data.rete_time, type: data.rete_recmode}).then(function() {
                            vxg.api.cloudone.camera.setAIConfig(r.id, {'channel_id': r.id, 'type': data.ai_type });
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
    
                                if (!data.gatewayCam && macAddress && serverSerial) dialogs['mdialog'].activate(`<h7>${$.t('common.success')}!</h7><p>${$.t('toast.installCameraPluginSuccess')}</p><p><button name="cancel" class="vxgbutton">${$.t('action.ok')}</button></p>`);
                                else if (!data.gatewayCam) dialogs['mdialog'].activate(`<h7>${$.t('common.accessToken')}</h7><p>${$.t('toast.copyAndSaveAccessTokenBeforeClosingWindow')}</p><textarea rows="5" style="min-width:200px">${r.access_tokens.all}</textarea><p><button name="cancel" class="vxgbutton">${$.t('action.ok')}</button></p>`);
                                
                                $(".serial-number-input").val("");
                                $(".mac-address-input").val("");
                                $(".password-input").val("");
                                $(".username-input").val("");
    
                                $(self).attr('access_token','');
                                //self.hidewait();
                                $(".server-status").hide()
                                //self.dispatchEvent(self.submited_event);
                                self.reset();
                                return;
                                //return screens['cameras'].on_show();
                            },function(r){
                                self.hidewait();
                                if (r && r.responseJSON && r.responseJSON.errorDetail)
                                    alert(r.responseJSON.errorDetail);
                                else
                                    alert($.t('toast.deleteSettingFailed'));
                            });
                            var cameraList = localStorage.cameraList ? JSON.parse(localStorage.cameraList) : null;
                            if (cameraList) {
                                cameraList.objects.push(newCam);
                                var total = parseInt(cameraList.meta.total_count);
                                cameraList.meta.total_count = total + 1;
                                localStorage.cameraList = JSON.stringify(cameraList);
                            }

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
                                    <campreview onclick_toscreen="tagsview"></campreview>`,
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

                            self.hidewait();
                            $(".server-status").hide()
                            self.dispatchEvent(self.submited_event);
                            self.reset();
                            return;
                            //screens['cameras'].on_show();
        
                    },function(r){
                        if (r && r.responseJSON && r.responseJSON.errorDetail) {
                            if (macAddress && serverSerial) $('.server-status').html(r.responseJSON.errorDetail);
                            else self.showerror(r.responseJSON.errorDetail);
                        }
    
                        else {
                            if (macAddress && serverSerial) $('.server-status').html(`<a target="_blank" href="${vxg.links.error}">${$.t('common.error')} #2</a>`);
                            else self.showerror(`<a target="_blank" href="${vxg.links.error}">${$.t('common.error')} #2</a>`);
                        }
                        
                        setTimeout(function(){self.hidewait();},10000);
                        setTimeout(function() {$('.server-status').hide();}, 10000)
                        self.defferedDispatchEvent(self.error_event);
                    });         
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
    this.onCameraLoaded = function(camera){
        let self = this;
        if (!camera) return this.onCameraLoadedFail();
        $(this).removeClass('nodata');
        this.camera = camera;

        this.showwait($.t('common.loading'));
        this.camera.getConfig().then(function(bsrc){
            if (!bsrc){
                self.showerror(`<a target="_blank" href="${vxg.links.error}">${$.t('common.error')} #3</a>`);
                self.defferedDispatchEvent(self.error_event);
                return;
            }
            if (!bsrc.url) bsrc.url='';
            $(self).removeClass('rtsp').removeClass('onvif').removeClass('cloud');

            if (!bsrc.url && !$(self).find('.url_protocol [value="cloud"]').length)
                $(self).find('.url_protocol').append(`<option value="cloud">${$.t('common.cloudCamera')}`);

            if (bsrc.url.substr(0,5)=='onvif') {
                $(self).find('.url_protocol').val('onvif');
                $(self).addClass('onvif');
            } else {
                if (bsrc.url){
                    $(self).find('.url_protocol').val('rtsp');
                    $(self).addClass('rtsp');
                } else {
                    $(self).find('.url_protocol').val('cloud');
                    $(self).addClass('cloud');
                }
            }

            $(self).find('[name="url"]').val(bsrc.url ? bsrc.url : '');
            self.onUrlChange();

            self.createTimezonesList($(self).find('[name="tz"]'),bsrc.tz);


            $(self).find('[name="name"]').val(bsrc.name);
            $(self).find('[name="location"]').val('');
            $(self).find('[name="location"]').val(self.camera.getLocation());
            $(self).find('[name="lat"]').val(bsrc.lat);
            $(self).find('[name="lon"]').val(bsrc.lon);
            $(self).find('[name="desc"]').val(bsrc.desc ? bsrc.desc : '');
            $(self).find('[name="username"]').val(bsrc.username ? bsrc.username : '');
            $(self).find('[name="password"]').val(bsrc.password ? bsrc.password : '');
            $(self).find('[name="onvif_rtsp_port_fwd"]').val(bsrc.onvifRtspPort ? bsrc.onvifRtspPort : '');
            $(self).find('[name="recording"]').val(bsrc.isRecording ? 1 : 0);
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
        if ( Object.keys(locationHierarchy).length == 0) {
            dropdownTreeStr = "<p class='nolocs'>No locations have been set for this account. Add a location below</p>"
        } else {
            var dropdownTree = this.createLocationList(locationHierarchy)
            dropdownTreeStr = $(dropdownTree).prop('outerHTML');
        }

        var showValue = editingLoc ? $(self).find(".show-location").val() : "";
        var existingValue = editingLoc ? editingLoc : "";

        var locationDialog = `
            <h4 class="locations-title">Locations</h4>
            ${dropdownTreeStr}
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
    this.createLocationHierarchy = function() {
        var self = this;
        var locationHierarchy = localStorage.locationHierarchy ?  JSON.parse(localStorage.locationHierarchy) : {};
        if (!Object.keys(locationHierarchy).length) {
            return vxg.api.cloud.getMetaTag(vxg.user.src.allCamsToken, "Province").then(function(locations) {
                for (const loc in locations) {
                    var firstLoc = "province_" + loc.replaceAll(" ", "_");
                    locationHierarchy[firstLoc] = {}
                }

                let currentProvince;
                var locationsArr = Object.keys(locationHierarchy);
                if (locationsArr.length == 0) {
                    self.onLocationHierarchyLoaded({});
                };
                let promiseChain = Promise.resolve();
                for (let i = 0; i < locationsArr.length; i++) { 
                    currentProvince = locationsArr[i];

                    const makeNextPromise = (currentProvince) => () => {
                        return window.vxg.cameras.getCameraListPromise(500,0,currentProvince,undefined,undefined) 
                            .then((cameras) => {
                                self.getSubLocations(locationHierarchy, 1, cameras, [currentProvince]);
                                if (i == locationsArr.length - 1) {
                                    localStorage.locationHierarchy = JSON.stringify(locationHierarchy);
                                    self.onLocationHierarchyLoaded(locationHierarchy);
                                }
                                return true;
                            });
                    }
                    promiseChain = promiseChain.then(makeNextPromise(currentProvince))
                }
            })
        }
    }
    this.getSubLocations = function(locationHierarchy, locLevel, cameras, prevLocs) {
        var self = this;
        if (locLevel == 4) return {};
        else {
            // get rid of any cameras that don't have the previous filter
            var camsFiltered = cameras.filter(cam => {
                var inCurrentLoc = true;
                if (cam.src.meta[locTypes[locLevel]] == undefined) inCurrentLoc = false;
                prevLocs.forEach(prevLoc => {
                    if (cam.src.meta && cam.src.meta[prevLoc] == undefined) {inCurrentLoc = false}
                })
                if (inCurrentLoc) return cam;
            });
            
            if (camsFiltered.length == 0) { return {} }

            camsFiltered.forEach(cam => {
                // checking if current location is in the hierarchy
                var currLocName = locTypes[locLevel].toLowerCase() + "_" + cam.src.meta[locTypes[locLevel]].replaceAll(" ", "_");
                var currentLocPath = prevLocs.concat(currLocName)
                const currentLoc = currentLocPath.reduce((object, key) => {
                    return (object || {})[key];
                }, locationHierarchy);
                
                if (currentLoc == undefined) { 
                    self.updateObjProp(locationHierarchy, {}, currentLocPath.join("."));
                    return self.getSubLocations(locationHierarchy, locLevel + 1, cameras, currentLocPath);
                }
            });
        }
    }
    this.updateObjProp = function(obj, value, propPath) {
        const [head, ...rest] = propPath.split('.');
    
        !rest.length
            ? obj[head] = value
            : this.updateObjProp(obj[head], value, rest.join('.'));
    }
    this.selectPlan = function(self, camera) {
        if (camera) {
            var subId = camera.src.meta && camera.src.meta.subid ? camera.src.meta.subid : "customParameters";
            var subName = camera.src.meta && camera.src.meta.subname ? camera.src.meta.subname : "customParameters";
            var showName = subId == "customParameters" ? $.t('common.customParameters') : subId == "NOPLAN" ? $.t('newCamera.noSubscriptionAssigned') : subName;
            $(self).find('[name="showname"]').val(showName);
        }
        $(self).find("#subbtn-cloud").on('click', function(e) {
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
                <table class="plansTable">
                    ${planTable}
                </table>
                <button name="select" class="vxgbutton assign-btn">${$.t('action.select')}</button>
            `;
            dialogs['mdialog'].activate(plansDialog).then(function(r){
                if (r.button!='select') return;
                if (r.button=='select' && r.form.subid === undefined) return;
                var name = showName = $("#name_" + r.form.subid).val();
                if (r.form.subid == "CUST") $(".custom-plan").show();
                else $(".custom-plan").hide();

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
        $(this).find('[name="serialnumber"], [name="gspassword"], [name="name"], [name="location"], [name="shownlocation"], [name="new_location_str"], [name="location_str"], [name="group"], [name="lat"], [name="lon"], [name="desc"], [name="url"], [name="username"], [name="password"], .url_ip, .url_http_port, .url_rtsp_port').val('');
        $(this).find('.url_path').val('onvif/device_service');
        $(this).find('.subscription-info').val('');
        $(this).find('.show-name').val($.t('newCamera.noSubscriptionAssigned'));
        $(this).removeClass('options').removeClass('rtsp').removeClass('cloud').addClass('onvif');
        this.createTimezonesList($(this).find('[name="tz"]'),moment.tz.guess());
        $(this).find('.custom-plan').hide();
        $(this).find('.hidesett').hide();
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
            if (r[0]=='127' || r[0]=='10' || !r[0]) return false;
            if (r[0]=='172' && r[1]=='16' || r[0]=='192' && r[1]=='168' || r[0]=='169' && r[1]=='254') return false;
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
    this.onIpChange = function(){
        let ip = $(this).find('.url_ip').val();
        if (ip=="" || this.checkDomainOrIP(ip)){
            this.onUrlPartChange();
            $(this).find('.iperror').hide();
//            $('.url_protocol').removeAttr('disabled');
            return;
        }
//        $('.url_protocol').attr('disabled','disabled');
        $(this).find('.iperror').show();
    }
    this.getCookie = function(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
}
