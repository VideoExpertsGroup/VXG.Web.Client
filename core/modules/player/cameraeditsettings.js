window.screens = window.screens || {};
window.controls = window.controls || {};
var path = window.core.getPath('cameraeditsettings.js');

window.controls['cameraeditsettings'] = {
    'js':[],
    'css':[path+'cameraeditsettings.css'],
    'commoncss':[],
    'commonjs':[],
    'observedAttributes':function(){
        return ['access_token'];
    },
    'on_init':function(element){
        CameraeditsettingsControl.apply(element,[]);
        return this.connectedCallback();
    },
    'attributeChangedCallback':function(name, value){
        this.attributeChangedCallback(name,value);
    },
    'disconnectedCallback':function(){
        this.disconnectedCallback();
    },
}

CameraeditsettingsControl = function(){
    this.connectedCallback = function(){
        this.submited_event = new Event('submited',{cancelable: false, bubbles: true});
        this.error_event = new Event('error',{cancelable: false, bubbles: true});
        this.nosubmit_event = new Event('nosubmit',{cancelable: false, bubbles: true});
        this.submitenable_event = new Event('submitenable',{cancelable: false, bubbles: true});
        let self = this;
        access_token = $(this).getNearParentAtribute('access_token');
        $(this).html('<div id="profileeditingform"></div><form></form><div class="wait"><span></span>&nbsp;&nbsp;<div class="spinner"></div></div>'+
            ($(self).attr('hidesubmit')!==undefined ? '' : `<button class="apply vxgbutton">${$.t('action.apply')}</button>`) );

        $(this).find('.apply').click(function(){
            self.submit_event = new Event('submit',{cancelable: true, bubbles: true});
            if (!self.dispatchEvent(self.submit_event)) return;
            self.submit();
        });

        return this.attributeChangedCallback('access_token', access_token);
    }
    this.attributeChangedCallback = function(name, access_token){
        $(this).find('form').empty();
        let self = this;
        if (name!='access_token') return defaultPromise();
        if (!(parseInt(access_token)>0 || typeof access_token ==="string")) {
            $(this).addClass('nodata');
            this.showerror(`<a target="_blank" href="${vxg.links.error}">${$.t('common.error')} #1</a>`);
            return defaultPromise();
        }
        delete this.camera;
//        this.reset();
        if (parseInt(access_token)>0){
            $(this).addClass('nodata');
            this.showwait($.t('common.loading'));
            return window.vxg.cameras.getCameraByIDPromise(parseInt(access_token)).then(function(camera){self.onCameraLoaded(camera);}, function(){self.onCameraLoadedFail();});
        }
        if (access_token) {
            $(this).addClass('nodata');
            this.showwait($.t('common.loading'));
            return window.vxg.cameras.getCameraByTokenPromise(access_token).then(function(camera){self.onCameraLoaded(camera);}, function(){self.onCameraLoadedFail();});
        }
        this.showerror(`<a target="_blank" href="${vxg.links.error}">${$.t('common.error')} #1</a>`);
        $(this).addClass('nodata');
        return defaultPromise();
    }
    this.disconnectedCallback = function(){
        let self = this;
        delete this.camera;
        return defaultPromise();
    }
    this.submit = function(){
        let self = this;

        let data = {};
        $(this).find('form').serializeArray().forEach(function(v,i){data[v.name] = v.value;});

        let profiles = {};
        var live_profile = $("#live_profile_select").val();
        var rec_profile = $("#rec_profile_select").val();

        if (self.live_profile != live_profile) profiles.live_ms_id = live_profile;
        if (self.rec_profile != rec_profile) profiles.rec_ms_id = rec_profile;

        if (data.resolution){
            data.resolution = data.resolution.split('x');
            data.resolution[0] = parseInt(data.resolution[0]);
            data.resolution[1] = parseInt(data.resolution[1]);
        }
        if (data.fps) data.fps = parseInt(data.fps);
        if (data.cbr_bitrate) data.cbr_bitrate = parseInt(data.cbr_bitrate);
        if (data.vbr_quality) data.vbr_quality = parseInt(data.vbr_quality);

        if (data.cbr_bitrate && this.source_data['caps'] && this.source_data['caps'][0] && this.source_data['caps'][0]['vbr_supported']){
            data.vbr_bitrate = parseInt(data.cbr_bitrate);
            delete data.cbr_bitrate;
        }

        data = Object.assign(this.source_data,data);
        this.showwait($.t('common.saving'));

        if (data['caps']) delete data['caps'];
        if (data['httpcode']) delete data['httpcode'];
        if (data['cbr_bitrate']!==undefined) data['cbr_bitrate'] = parseInt(data['cbr_bitrate']);
        if (data['fps']!==undefined) data['fps'] = parseInt(data['fps']);
        if (data['gop']!==undefined) data['gop'] = parseInt(data['gop']);
        if (data['vbr_quality']!==undefined) data['vbr_quality'] = parseInt(data['vbr_quality']);

        data.id = $('#editing_profile_select').find(':selected').data('vsid');

        this.camera.setCameraSettings(data).then(function(){
            if (JSON.stringify(profiles) != "{}") {
                self.camera.setCameraStreams(profiles).then(function() {
                    self.dispatchEvent(self.submited_event);
                    self.hidewait();
                }, function(err) {
                    if (r && r.responseJSON && r.responseJSON.errorDetail)
                    self.showerror(r.responseJSON.errorDetail);
                    else
                        self.showerror(`<a target="_blank" href="${vxg.links.error}">${$.t('common.error')} #2</a>`);
                    setTimeout(function(){self.hidewait();},2000);
                    self.dispatchEvent(self.error_event);
                });
            } else {
                self.dispatchEvent(self.submited_event);
                self.hidewait();
            }

        },function(r){
            if (r && r.responseJSON && r.responseJSON.errorDetail)
                self.showerror(r.responseJSON.errorDetail);
            else
                self.showerror(`<a target="_blank" href="${vxg.links.error}">${$.t('common.error')} #2</a>`);
            setTimeout(function(){self.hidewait();},2000);
            self.dispatchEvent(self.error_event);
        });
    }
    this.onCameraLoadedFail = function(r){
        $(this).addClass('nodata');
        this.showerror(`<a target="_blank" href="${vxg.links.error}">${$.t('common.error')} #3</a>`);
        this.dispatchEvent(this.nosubmit_event);
        return r;
    }
    this.onCameraLoaded = function(camera){
        let self = this;
        if (!camera) return this.onCameraLoadedFail();
        this.camera = camera;
        $("#profileeditingform").html("");

        this.showwait($.t('common.loading'));
        return this.camera.getToken().then(function(token){
            return vxg.api.cloud.getCameraSettings(self.camera.camera_id, token).then(function(data){
                if (!data){
                    self.showerror($.t('toast.videoSettingsNovAvailableForCamera'));
                    self.dispatchEvent(self.nosubmit_event);
                    return;
                }

                return vxg.api.cloud.getNonJpegStreams(self.camera.camera_id, token).then(function(validStreams) {
                    $(this).removeClass('nodata');

                    if (data.live_ms_id && data.rec_ms_id && data.mstreams_supported) {
                        self.live_profile = data.live_ms_id;
                        self.rec_profile = data.rec_ms_id;
    
                        var topForm = '';
                        var live_ele = '';
                        var rec_ele = '';

                        var streamCount = 1;
                        data.mstreams_supported.forEach(stream => {
                            if (validStreams.includes(stream.vs_id)) {
                                live_ele+=`<option value="${stream.id}" data-vsid="${stream.vs_id}" ${stream.id == data.live_ms_id? 'selected' : ''}>${$.t('common.profileTitle')} #${streamCount}</option>`;
                                rec_ele+=`<option value="${stream.id}" data-vsid="${stream.vs_id}" ${stream.id == data.rec_ms_id? 'selected' : ''}>${$.t('common.profileTitle')} #${streamCount}</option>`;
                                streamCount++;
                            }
                        });
            
                        topForm += `
                            <div class="form-container">
                                <div class="form-group profile-form" style="padding-right: 10px;">
                                    <label>${$.t('common.mainStream')}</label>
                                    <select class="form-control" name="rec_profile" id="rec_profile_select" value="${data.rec_ms_id}">
                                        ${rec_ele}
                                    </select>
                                </div>
                                <div class="form-group profile-form">
                                    <label>${$.t('common.liveStream')}</label>
                                    <select class="form-control" name="live_profile" id="live_profile_select" value="${data.live_ms_id}">
                                        ${live_ele}
                                    </select>
                                </div>
                            </div>

                            <div class="form-label">
                                <p class="streamedit-title">${$.t('cameras.editStreamSettings')}</p>
                            </div>
            
                            <div class="form-group header-form">
                                <label>${$.t('common.stream')}</label>
                                <select class="form-control" name="editing_profile" id="editing_profile_select" value="${data.rec_ms_id}">
                                    ${rec_ele}
                                </select>
                            </div>
                        `;
            
                        $("#profileeditingform").html(topForm);
            
                        $("#editing_profile_select").on("change", function() {
                            var channel_id = self.camera.camera_id;
                            var vs_id = $(this).find(':selected').data('vsid');
                            return vxg.api.cloud.getVideoStreamSettings(channel_id, vs_id, token).then(function(newdata) {
                                self.source_data = newdata;
                                return self.onDataLoaded(newdata);
                            });
                        });
                    }
    
                    self.source_data = data;
                    return self.onDataLoaded(data);
                }, function(err) {
                    self.showerror(`${$.t('toast.gettingVideoStreamError')}: ${err.message}`);
                    self.dispatchEvent(self.nosubmit_event);
                })
       
            },function(){
                self.showerror($.t('toast.videoSettingsNovAvailableForCamera'));
                self.dispatchEvent(self.nosubmit_event);
            });
        });
    }
    this.onDataLoaded = function(){
        let self=this;
        let allDisabled=true, is_data = false;
        var html = '';

        if (!isNaN(parseFloat(this.source_data['cbr_bitrate'])) && isFinite(this.source_data['cbr_bitrate'])){
            let val = parseInt(this.source_data['cbr_bitrate']);
            let arr = [val];
            let min=val;
            let max=val;
            let step = 1;
            while (this.source_data['caps'] && this.source_data['caps'][0]){
                if (this.source_data['caps'][0]['vbr_supported']){
                    val = this.source_data['vbr_bitrate']!==undefined ? parseInt(this.source_data['vbr_bitrate']) : 0;
                    arr = [val];
                    if (this.source_data['caps'][0]['vbr_bitrate'] && !isNaN(parseFloat(this.source_data['caps'][0]['vbr_bitrate'][0])) && isFinite(this.source_data['caps'][0]['vbr_bitrate'][0]))
                        min = parseInt(this.source_data['caps'][0]['vbr_bitrate'][0]);
                    if (this.source_data['caps'][0]['vbr_bitrate'] && !isNaN(parseFloat(this.source_data['caps'][0]['vbr_bitrate'][1])) && isFinite(this.source_data['caps'][0]['vbr_bitrate'][1]))
                        max = parseInt(this.source_data['caps'][0]['vbr_bitrate'][1]);
                    break;
                }

                if (this.source_data['caps'][0]['cbr_bitrate'] && !isNaN(parseFloat(this.source_data['caps'][0]['cbr_bitrate'][0])) && isFinite(this.source_data['caps'][0]['cbr_bitrate'][0]))
                    min = parseInt(this.source_data['caps'][0]['cbr_bitrate'][0]);
                if (this.source_data['caps'][0]['cbr_bitrate'] && !isNaN(parseFloat(this.source_data['caps'][0]['cbr_bitrate'][1])) && isFinite(this.source_data['caps'][0]['cbr_bitrate'][1]))
                    max = parseInt(this.source_data['caps'][0]['cbr_bitrate'][1]);
                break;
            }

            if (max>=min) {
                is_data = true;
                html+='  <div class="form-group">';
                html+=`    <label>${$.t('common.maxBitrate')}&nbsp;(${min}-${max} Kbps)</label>`
                html+='    <input type="number" class="form-control input500" autofocus="autofocus" name="cbr_bitrate" value="'+val+'" min="'+min+'" max="'+max+'" '+(min==max?'disabled="disabled"	':'')+'>' 
                html+='  </div>';
                if (min<max) allDisabled=false;
            }
        }
        if (!isNaN(parseFloat(this.source_data['vbr_quality'])) && isFinite(this.source_data['vbr_quality'])){
            let val = parseInt(this.source_data['vbr_quality']);
            let arr = [val];
            let min=val;
            let max=val;
            if (this.source_data['caps'] && this.source_data['caps'][0] && this.source_data['caps'][0]['vbr_quality'] && !isNaN(parseFloat(this.source_data['caps'][0]['vbr_quality'][0])) && isFinite(this.source_data['caps'][0]['vbr_quality'][0]))
                min = parseInt(this.source_data['caps'][0]['vbr_quality'][0]);
            if (this.source_data['caps'] && this.source_data['caps'][0] && this.source_data['caps'][0]['vbr_quality'] && !isNaN(parseFloat(this.source_data['caps'][0]['vbr_quality'][1])) && isFinite(this.source_data['caps'][0]['vbr_quality'][1]))
                max = parseInt(this.source_data['caps'][0]['vbr_quality'][1]);
            if (max>=min) 
                for(let i=min;i<=max;i++) 
                    if (arr.indexOf(i)==-1) arr.push(i);
            arr = arr.sort();
            html+='  <div class="form-group">'
                + `    <label for="deviceUrl">${$.t('common.vbrQuality')}</label>`
                + '    <select class="vbr_quality form-control input500" name="vbr_quality" '+(arr.length<2?'disabled="disabled"':'')+'>';
            for (i=0;i<arr.length;i++)
                html+='<option value="'+arr[i]+'" '+(arr[i]==val?'selected':'')+'>'+arr[i]+'</option>';
            html+='  </select></div>';
            if (arr.length>1) allDisabled=false;
            is_data = true;
        }
        if (!isNaN(parseFloat(this.source_data['fps'])) && isFinite(this.source_data['fps'])){
            let val = parseInt(this.source_data['fps']);
            let arr = [val];
            if (this.source_data['caps'] && this.source_data['caps'][0] && this.source_data['caps'][0]['fps'] && this.source_data['caps'][0]['fps'] instanceof Array)
                for(let i=0;i<this.source_data['caps'][0]['fps'].length;i++) 
                    if (arr.indexOf(parseInt(this.source_data['caps'][0]['fps'][i]))==-1) arr.push(parseInt(this.source_data['caps'][0]['fps'][i]));
            arr = arr.sort();
            html+='  <div class="form-group">'
                + '    <label for="deviceUrl">Frame rate</label>'
                + '    <select class="fps form-control input500" name="fps" '+(arr.length<2?'disabled="disabled"':'')+'>';
            for (i=0;i<arr.length;i++)
                html+='<option value="'+arr[i]+'" '+(arr[i]==val?'selected':'')+'>'+arr[i]+'</option>';
            html+='  </select></div>';
            if (arr.length>1) allDisabled=false;
            is_data = true;
        }
        if (this.source_data['resolution'] && !isNaN(parseFloat(this.source_data['resolution'][0])) && isFinite(this.source_data['resolution'][0]) && !isNaN(parseFloat(this.source_data['resolution'][1])) && isFinite(this.source_data['resolution'][1])){
            let val = parseInt(this.source_data['resolution'][0]) + 'x' + parseInt(this.source_data['resolution'][1]);
            let arr = [val];
            if (this.source_data['caps'][0]['resolutions'] instanceof Array) for (i=0;i<this.source_data['caps'][0]['resolutions'].length;i++){
                let w = this.source_data['caps'][0]['resolutions'][i][0];
                let h = this.source_data['caps'][0]['resolutions'][i][1];
                if (!isNaN(parseFloat(w)) && isFinite(w) && !isNaN(parseFloat(h)) && isFinite(h)){
                    let v = parseInt(w) + 'x' + parseInt(h);
                    if (arr.indexOf(v)==-1) arr.push(v);
                }
            }
            arr = arr.sort();
            html+='  <div class="form-group">'
                + `    <label for="deviceUrl">${$.t('common.resolution')}</label>`
                + '    <select class="resolution form-control input500" name="resolution" '+(arr.length<2?'disabled="disabled"':'')+'>';
            for (i=0;i<arr.length;i++)
                html+='<option value="'+arr[i]+'" '+(arr[i]==val?'selected':'')+'>'+arr[i]+'</option>';
            html+='  </select></div>';
            if (arr.length>1) allDisabled=false;
            is_data = true;

            const videoEcondingMap = {'h264': 'H.264', 'h265': 'H.265', 'hevc': 'H.265'};
            const videoEncoding = videoEcondingMap[this.source_data.format.toLowerCase()];
            if (typeof videoEncoding !== 'undefined') {
                html += `<div class="form-group">
                            <label>${$.t('common.videoEncoding')}</label>
                            <input type="text" class="video_encoding form-control input500" name="video_encoding" value="${videoEncoding}" disabled>
                        </div>`;
            }
        }
//            html+='  <br/><button class="vxgbutton" onclick_toscreen="back">Back</button>&nbsp;&nbsp;&nbsp;';
        if (!allDisabled) {
            $(this).find('.notavailable.apply').show();
            setTimeout(function(){self.dispatchEvent(self.submitenable_event);},0);

        } else {
            $(this).find('.notavailable.apply').hide();
            self.dispatchEvent(self.nosubmit_event);
        }

        $(this).find('form').html(html);

        if (allDisabled) 
            $(this).find('.apply').hide();
        else
            $(this).find('.apply').show();
        this.hidewait();
        if (!is_data)
            this.showerror($.t('toast.videoSettingsNovAvailableForCamera'));
        return defaultPromise();
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
}
