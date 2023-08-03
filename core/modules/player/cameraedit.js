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
<div class="form-group">
    <label>Name</label>
    <input autofocus="autofocus" class="name" name="name" >
</div>
<div class="form-group">
    <label>Location</label>
    <input name="location" >
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
    <label>Type</label>&nbsp;&nbsp;&nbsp;<a target="_blank" rel="noopener noreferrer" href="`+vxg.links.error+`">How to add a camera?</a> 
    <select class="url_protocol">
        <option value="onvif" selected>ONVIF camera</option>
        <option value="rtsp">Video URL</option>
    </select>
</div>
<div class="form-group rtspOnly notincloud">
    <label>URL</label>
    <input name="url" class="anccsUrl">
</div>

<div class="form-group rtspOnly notincloud setting-dropdown opt-dropdown">
    <div class="anccsUrlOptions">OPTIONS</div>
</div>

<div class="form-group rtspOnly options notincloud">
    <label for="url_prot">Protocol&nbsp;</label>
    <input type="text" class="url_prot form-control input500" value="">
</div>
<div class="form-group options notincloud">
    <label for="url_ip">IP address or domain name&nbsp;</label>
    <input type="text" class="url_ip form-control input500" value="">
    <div class="iperror">Invalid domain name or ip address</div>
</div>
<div class="form-group options notincloud">
    <label for="url_http_port" class="onvifOnly">HTTP port&nbsp;</label>
    <label for="url_http_port" class="rtspOnly">Port&nbsp;</label>
    <input type="number" class="url_http_port form-control input500" value="">
</div>
<div class="form-group options notincloud">
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
<div class="form-group options notincloud">
    <label class="" for="url_path">Path&nbsp;</label>
    <input type="text" class="url_path form-control input500" value="">
</div>

<div class="form-group">
    <label>Timezone</label>
    <select name="tz">
    </select>
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
` + (vxg.api.cloudone.camera.setRetention!==undefined ? `
<div class="form-group setting-dropdown rete-dropdown bottom-options">
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
    <label><input type="checkbox" class="svgbtnbefore" name="rete_sd">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SD recording</label>
</div>
`:'') + `
` + (vxg.api.cloudone.camera.setAIConfig!==undefined ? `
<div class="form-group setting-dropdown ai-dropdown bottom-options">
    <div class="anccsUrlAIConfig">OBJECT DETECTION (AI)</div>
    <span class="carrot-icon closed"><</span>
</div>
<div class="form-group ai_type hidesett">
    <label>AI Object Detection</label>
    <select name="ai_type" class="ai_type_select">
        <option value="off">Off</option>
        <option value="continuous">Continuous</option>
        <option value="by_event">By Event</option>
    </select>
</div>`:"") + `
</form>
<div class="sbt"><br/><br/>
<div class="wait"><span>Wait</span>&nbsp;&nbsp;<div class="spinner"></div></div>
            `+
            ($(self).attr('hidesubmit')!==undefined ? '' : '<button class="apply vxgbutton">Apply</button>') +
            '</div>');

        $(this).find('.apply').click(function(){
            self.submit_event = new Event('submit',{cancelable: true, bubbles: true});
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
            if (type=='off') $(self).find('.rete_time').addClass("rete_off");
            else $(self).find('.rete_time').removeClass("rete_off").show();

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
                    var aiCams_string = sessionStorage.getItem("aiCams");
                    if (aiCams_string) {
                        var aiCams_array = aiCams_string.split(",").filter(e => e);
                        if (data.ai_type != "off") {
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
                },function(r){
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
            self.camera.updateCameraPromise(data).then(function(r){
                if (!self.camera.bsrc.url && data.rete_recmode=='off')
                    data.rete_time = -1;
                let p =  self.camera.setRetention ? 
                    self.camera.setRetention({recording: data.rete_sd=='on', time: data.rete_time, type: data.rete_recmode}) :
                    new Promise(function(resolve, reject){resolve();}); 

                p.then(function(){

                    let p = self.camera.setAIConfig ? self.camera.setAIConfig({'channel_id': self.camera.camera_id, 'type': data.ai_type }) :
                                new Promise(function(resolve, reject){resolve();});                    
                    
                    return p.then(function () {
                        var aiCams_string = sessionStorage.getItem("aiCams");
                        if (aiCams_string) {
                            var aiCams_array = aiCams_string.split(",").filter(e => e);
                            if (data.ai_type != "off") {
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
                        self.dispatchEvent(self.submited_event);
                        if (data.rete_sd == 'on') localStorage.setItem(self.camera.camera_id, 'true')
                        else localStorage.setItem(self.camera.camera_id, 'false');
                        self.hidewait();
                        location.reload();
                    })

                });
            },function(r){
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
            if (!bsrc){
                self.showerror('<a target="_blank" href="'+vxg.links.error+'">Error #3</a>');
                self.defferedDispatchEvent(self.error_event);
                return;
            }
            if (!bsrc.url) {bsrc.url='';$(self).find('.url_protocol').attr('disabled','disabled');}
            //else
                //$(self).find('.rete_sd input').attr('disabled','disabled').prop('checked','');

            $(self).removeClass('rtsp').removeClass('onvif').removeClass('cloud');

            if (!bsrc.url && !$(self).find('.url_protocol [value="cloud"]').length)
                $(self).find('.url_protocol').append('<option value="cloud">Cloud camera'); 

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
            $(self).find('[name="lat"]').val(bsrc.lat&&bsrc.lat!='0'?bsrc.lat:'');
            $(self).find('[name="lon"]').val(bsrc.lon&&bsrc.lon!='0'?bsrc.lon:'');
            $(self).find('[name="desc"]').val(bsrc.desc ? bsrc.desc : '');
            $(self).find('[name="username"]').val(bsrc.username ? bsrc.username : '');
            $(self).find('[name="password"]').val(bsrc.password ? bsrc.password : '');
            $(self).find('[name="onvif_rtsp_port_fwd"]').val(bsrc.onvifRtspPort ? bsrc.onvifRtspPort : '');
            $(self).find('[name="recording"]').val(bsrc.isRecording ? 1 : 0);

            let p =  self.camera.getRetention ? self.camera.getRetention() : new Promise(function(resolve, reject){resolve();}); 
            p.then(function(rt){
                if (rt){
                    var localStorage_sdCard = localStorage.getItem(self.camera.camera_id);
                    var sdCardEnabled = (typeof localStorage_sdCard === "string" && localStorage_sdCard.toLowerCase() === "true");
                    
                    if (rt.type!==undefined)
                        $(self).find('[name="rete_recmode"]').val(rt.type);
                    //if (self.camera.bsrc.url || rt.type=='on') $(self).find('.rete_sd input').attr('disabled','disabled').prop('checked','');
                    //else $(self).find('.rete_sd input').removeAttr('disabled');

                    if (rt.type=='off') $(self).find('.rete_time').addClass("rete_off");
                    else $(self).find('.rete_time').removeClass("rete_off");
    
                    if (rt.time!==undefined)
                        $(self).find('[name="rete_time"]').val(rt.time);
                    if (rt.recording!==undefined)
                        $(self).find('[name="rete_sd"]').prop('checked', sdCardEnabled);
                    /*if (self.camera.bsrc.url) 
                        $(self).find('.sdrecinfo').text('(supported only for Cloud cameras)');
                    else if (rt.type=='on')
                        $(self).find('.sdrecinfo').text('(supported only at "Off" and "By Event" cloud recording types)');*/
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
        }, function(){
            self.showerror('<a target="_blank" href="'+vxg.links.error+'">Error #3</a>');
            self.defferedDispatchEvent(self.error_event);
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
        this.createTimezonesList($(this).find('[name="tz"]'),moment.tz.guess());
        $(this).find('.sdrecinfo').text('');
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
        if (url.substr(0,5)=='rtsp:' && $(this).find('.rete_recmode').val()=='by_event')
            $(this).find('.rectypeinfo').show();
        else
            $(this).find('.rectypeinfo').hide();
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
