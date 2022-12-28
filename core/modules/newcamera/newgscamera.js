window.screens = window.screens || {};
window.controls = window.controls || {};
var path = window.core.getPath('newgscamera.js');

window.controls['newgscamera'] = {
    'js':[],
    'css':[path+'newgscamera.css'],
    'commoncss':[],
    'commonjs':[/*'sdk/moment.min.js','sdk/moment-timezone-with-data-2012-2022.min.js'*/],
    'observedAttributes':function(){
        return ['access_token'];
    },
    'on_init':function(element){
        CameraGsEditControl.apply(element,[]);
        return this.connectedCallback();
    },
    'attributeChangedCallback':function(name, value){
        this.attributeChangedCallback(name,value);
    },
    'disconnectedCallback':function(){
        this.disconnectedCallback();
    },
}

CameraGsEditControl = function(){
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
<div class="form-group type" style="display:none">
    <label>Type</label>&nbsp;&nbsp;&nbsp;<a target="_blank" rel="noopener noreferrer" href="`+vxg.links.error+`">How to add a camera?</a> 
    <select class="url_protocol">
        <option value="onvif" selected>ONVIF camera</option>
        <option value="rtsp">Video URL</option>
    </select>
</div>
<div class="form-group rtspOnly notincloud" style="display:none">
    <label>URL</label>
    <input name="url" class="anccsUrl">
</div>

<div class="form-group rtspOnly notincloud" style="display:none">
    <div class="anccsUrlOptions">OPTIONS</div>
</div>

<div class="form-group rtspOnly options notincloud" style="display:none">
    <label for="url_prot">Protocol&nbsp;</label>
    <input type="text" class="url_prot form-control input500" value="">
</div>
<div class="form-group options notincloud" style="display:none">
    <label for="url_ip">IP address or domain name&nbsp;</label>
    <input type="text" class="url_ip form-control input500" value="">
    <div class="iperror">Invalid domain name or ip address</div>
</div>
<div class="form-group options notincloud" style="display:none">
    <label for="url_http_port" class="onvifOnly">HTTP port&nbsp;</label>
    <label for="url_http_port" class="rtspOnly">Port&nbsp;</label>
    <input type="number" class="url_http_port form-control input500" value="">
</div>
<div class="form-group options notincloud" style="display:none">
    <label class="onvifOnly" for="url_rtsp_port">RTSP port&nbsp;</label>
    <input type="number" class="onvifOnly url_rtsp_port form-control input500" name="onvif_rtsp_port_fwd">
    <i class="onvifOnly"></i>
</div>
<div class="form-group options notincloud" style="display:none">
  <label for="deviceLogin">Username&nbsp;</label>
  <input type="text" class="form-control input500 url_user_name" name="username" >
</div>
<div class="form-group options notincloud" style="position: relative;display:none">
  <label for="devicePassword">Password&nbsp;</label>
  <input type="password" class="password form-control input500 url_password" autocomplete="new-password" name="password"><i class="showhidepass show-password"></i>
</div>
<div class="form-group options notincloud" style="display:none">
    <label class="" for="url_path">Path&nbsp;</label>
    <input type="text" class="url_path form-control input500" value="">
</div>

<div class="form-group">
    <label>Timezone</label>
    <select name="tz">
    </select>
</div>
<div class="form-group" style="display:none">
    <label>Latitude</label>
    <input name="lat" value="0">
</div>
<div class="form-group" style="display:none">
    <label>Longitude</label>
    <input name="lon" value="0">
</div>

<div class="form-group" style="display:none">
    <label>Description</label>
    <textarea name="desc" rows="5"></textarea>
</div>
<div class="form-group">
    <label>Serial number</label>
    <input autofocus="autofocus" class="serialnumber" name="serialnumber">
</div>
<div class="form-group">
    <label>Password</label>
    <input type="password" autofocus="autofocus" class="gspassword" name="gspassword">
</div>

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
        $(this).find('.anccsUrlOptions').click(function(){
            $(self).toggleClass('options');
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
        let data = $(this).find('form').serializeObject();
        for (let i in data) data[i]=data[i].trim();
        if ($(this).hasClass('rtsp')) delete data['onvif_rtsp_port_fwd'];
        if (!data.name){
            core.flashInputBackgroundColor($(this).find('.name'));
            this.defferedDispatchEvent(this.error_event);
            return false;
        }
        if (!data.serialnumber){
            core.flashInputBackgroundColor($(this).find('.serialnumber'));
            this.defferedDispatchEvent(this.error_event);
            return false;
        }
        if (!data.gspassword){
            core.flashInputBackgroundColor($(this).find('.gspassword'));
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
        this.showwait('Saving');
        let res;
        if (!this.camera)
            res = vxg.cameras.createCameraPromise(data);
        else
            res = this.camera.updateCameraPromise(data);
        res.then(function(r){
            if (r['allCamsToken']) 
                vxg.user.src.allCamsToken = r['allCamsToken'];

            $(self).attr('access_token','');
            self.hidewait();
            self.dispatchEvent(self.submited_event);
            self.reset();
        },function(r){
            if (r && r.responseJSON && r.responseJSON.errorDetail)
                self.showerror(r.responseJSON.errorDetail);
            else
                self.showerror('<a target="_blank" href="'+vxg.links.error+'">Error #2</a>');
            setTimeout(function(){self.hidewait();},2000);
            self.defferedDispatchEvent(self.error_event);
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
            if (!bsrc.url) bsrc.url='';
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
            self.showerror('<a target="_blank" href="'+vxg.links.error+'">Error #3</a>');
            self.defferedDispatchEvent(self.error_event);
        });

    }
    this.reset = function(){
        $(this).addClass('newcamera');
        $(this).find('.url_protocol [value="cloud"]').remove();
        $(this).find('.iperror').hide();
        $(this).find('[name="serialnumber"], [name="gspassword"], [name="name"], [name="location"], [name="lat"], [name="lon"], [name="desc"], [name="url"], [name="username"], [name="password"], .url_ip, .url_http_port, .url_rtsp_port').val('');
        $(this).find('.url_path').val('onvif/device_service');
        $(this).find('.url_protocol').val('onvif');
        $(this).removeClass('options').removeClass('rtsp').removeClass('cloud').addClass('onvif');
        this.createTimezonesList($(this).find('[name="tz"]'),moment.tz.guess());
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

}
