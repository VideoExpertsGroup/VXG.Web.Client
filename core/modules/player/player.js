window.screens = window.screens || {};
window.controls = window.controls || {};
var path = window.core.getPath('player.js');

window.screens['player'] = {
    'header_name': $.t('common.player'),
    'html': path+'player.html',
    'css': [],
    'stablecss':[path+'player.css'],
    'commoncss':['sdk/vxgwebsdk/video-js.min.css', 'sdk/vxgwebsdk/CloudSDK.min.css'],
    'commonjs':[/*'sdk/moment.min.js','sdk/moment-timezone-with-data-2012-2022.min.js',*'sdk/vxgwebsdk/popper.min.js'*/,'sdk/vxgwebsdk/video.min.js'/*,'sdk/videojs-http-streaming.js','sdk/videojs-contrib-hls.js'*/,'sdk/vxgwebsdk/webrtc-adapter-latest.js','sdk/vxgwebsdk/CloudSDK.debug.js','sdk/vxgwebsdk/vxg_cloud_player.js'],
/*
    'get_args':function(){
        if (this.start_camtoken){
            if (this.start_timestamp)
                return [this.start_camtoken, this.start_timestamp];
            return [this.start_camtoken];
        }
        return [];
    },
*/
    'on_before_show':function(camtoken, timestamp){
        core.elements['header-center'].text($.t('common.camera'));
        this.start_camtoken = camtoken;
        this.start_timestamp = parseInt(timestamp);
        let self=this;
        if (camtoken){
            if (parseInt(camtoken)>0)
                return window.vxg.cameras.getCameraByIDPromise(parseInt(camtoken)).then(function(camera){
                    self.camera = camera;
                    return camera.getToken().then(function(token){
                        self.start_camtoken = token;
                    });
                });
            else return defaultPromise();
        }

        let camname = $(this.src).getNearParentAtribute('camera_name');

        return getCameraFromElement(this.src).then(function(camera){
            if (!camera){
                delete self.camera;
                delete self.start_camtoken;
                return;
            }
            self.camera = camera;
            if (camname) {
                self.camera.src = self.camera.src || {};
                self.camera.src.name = camname;
            }
            return camera.getToken().then(function(token){
                self.start_camtoken = token;
            });
        });
    },
    'on_show':function(camtoken, timestamp){
        this.start_timestamp = parseInt(timestamp);
        let self = this;
        if (camtoken && isNaN(parseInt(camtoken))){
            if (this.camera && this.camera.src && this.camera.src.name) {
                core.elements['header-center'].text($.t('common.camera') + ': '+ this.camera.src.name);
            }
            this.player.setSource(camtoken);
            if (timestamp>0) setTimeout(function(){self.player.setPosition(self.start_timestamp)},100);
            else setTimeout(function(){self.player.setPosition(-1)},100);
            return defaultPromise();
        } else if (this.camera){
            this.camera.getName().then(function(name){
                core.elements['header-center'].text($.t('common.camera') + ': '+ name);
            });
        }

        if (this.start_camtoken)
            this.player.setSource(this.start_camtoken);
        if (timestamp>0) setTimeout(function(){self.player.setPosition(self.start_timestamp)},100);
        else setTimeout(function(){self.player.setPosition(-1)},100);
        if (this.camera)
            return this.camera.getName().then(function(name){
                core.elements['header-center'].text($.t('common.camera') + ': '+name);
            });
        return defaultPromise();
    },
    'on_hide':function(){
        this.player.stop();
    },
    'on_ready':function(){
        return defaultPromise();
    },
    'on_init':function(){
         let d = $.Deferred();
         let f = false;
         core.elements['global-loader'].show();
         var playerOptions = {timeline: true, timelineampm: true, mute: true, alt_protocol_names:true, calendar: true/*, cloud_domain: vs_api.options['cloud_domain']*/}
         if (window.core.isMobile()){
        	playerOptions.disableAudioControl = true;
        	playerOptions.disableZoomControl = true;
        	playerOptions.disableGetShot = true;
        	playerOptions.disableGetClip = true;
         }
         playerOptions.livePoster = true;
         
         this.player  = new CloudPlayerSDK('mainplayer', playerOptions);
         this.player.addCallback('maincallback', function(evnt, args){ 
             //CloudPlayerEvent.CONNECTING
//             if (!f) core.elements['global-loader'].hide();
//             f = true;
//             d.resolve();
         });
         setTimeout(function(){
             if (!f) core.elements['global-loader'].hide();
             f = true;
             d.resolve();
         },100);

         return d;
    }
};

function getCameraFromElement(element){
    let access_token = $(element).getNearParentAtribute('access_token');
/*
    let access_token = $(element).attr('access_token');
    if (access_token===undefined)
        access_token = $($(element).parents('[access_token]')[0]).attr('access_token');
*/
    if (!access_token) return defaultPromise();

    if (access_token[0]=='+'){
        let limit = parseInt(access_token.substr(1));
        return window.vxg.cameras.getCameraListPromise(limit+1,0).then(function(list){
            let l=0;
            for(let i in list){
                if (l==limit){
                    return list[i];
                }
                l++;
            }
        });
    } else if (parseInt(access_token)>0)
        return window.vxg.cameras.getCameraByIDPromise(parseInt(access_token));
    else if (typeof access_token ==="string")
        return window.vxg.cameras.getCameraByTokenPromise(access_token);
    else return defaultPromise();
}

window.controls['campreview'] = {
    'js':[],
    'css':[],
    'observedAttributes':function(){
        return ['access_token'];
    },
    'on_init':function(){
        let el = this;
//        $(el).addClass('spinner');
        $(el).attr('draggable','true');

        this.dragend = function(e) {
            el.dragged=false;
        }
        this.dragstart = function(e) {
            el.dragged=true;
        }
        this.drop = function(e) {
            if (!el.dragged) return;
            e.preventDefault();
            let pl = $(document.elementFromPoint(e.clientX, e.clientY)).parents('player');
            if (!pl.length) return;
            pl.attr('access_token',el.channeltoken);
            if (typeof pl[0].on_access_token_change === "function") pl[0].on_access_token_change(el.channeltoken);
            setTimeout(function() {
                pl[0].play();
            }, 200)
        }

        $(el).on('dragstart',function(event){
            // event.preventDefault();
            this.dragstart();
        });
        $(el).on('dragend',function(event){
            // event.preventDefault();
            this.dragend();
        });
        // el.addEventListener('dragstart', this.dragstart);
        // el.addEventListener('dragend', this.dragend);
        document.addEventListener('drop', this.drop);

        return getCameraFromElement(this).then(function(camera){
            if (!camera) return defaultPromise();

            if($(el).attr('notetime')) el.notetime = $(el).attr('notetime');
            
            el.channelID = camera.camera_id;
            el.channeltoken = camera.src&&camera.src.roToken ? camera.src.roToken : camera.token;
            return camera.getPreview().then(function(url){
//if (camera.camera_id==248528) url = '/skins/Hanva.png';
                if (url){
                    $(el).css('background','url('+url+') no-repeat center center');
                    $(el).css('background-size','cover');
                }
/*
                el.children[0].onload=function(){
                    $(el).removeClass('spinner');
                };
                el.children[0].onerror=function(){
                    $(el).empty().removeClass('spinner');
                };
*/
            },function(){
                $(el).removeClass('spinner');
            });
        });
    },
    'disconnectedCallback':function(){
        this.removeEventListener('dragstart', this.dragstart);
        this.removeEventListener('dragend', this.dragend);
        document.removeEventListener('drop', this.drop);
    },
    'attributeChangedCallback':function(name, value){
        $(this).empty().addClass('spinner');
        let el = this;
        return getCameraFromElement(this).then(function(camera){
            if (!camera) {
                $(el).empty().removeClass('spinner');
                return;
            }
            return camera.getPreview().then(function(url){
                $(el).html('<img src="'+url+'"/>');
                $(el).removeClass('spinner');
            },function(){
                $(el).empty().removeClass('spinner');
            });
        }, function() {
            $(el).empty().removeClass('spinner');
        });
    }
}

window.controls['camfield'] = {
    'js':[],
    'css':[],
    'observedAttributes':function(){
        return ['access_token','field'];
    },
    'on_init':function(){

        let camfield = $(this).attr('field');
        if (typeof camfield !== "string") return defaultPromise();

        let el = this;
        $(el).attr('draggable','true');

        this.dragend = function(e) {
            el.dragged=false;
        }
        this.dragstart = function(e) {
            el.dragged=true;
        }
        this.drop = function(e) {
            if (!el.dragged) return;
            e.preventDefault();
            let pl = $(document.elementFromPoint(e.clientX, e.clientY));
            if (!pl.hasClass('player')) {
                pl = pl.parents('player, .player');
            }
            if (!pl.length) return;
            pl.attr('access_token', el.channeltoken);
            pl.attr('src', el.channeltoken);
            if (typeof pl[0].on_access_token_change === "function") pl[0].on_access_token_change(el.channeltoken);
            setTimeout(function() {
                pl[0].play();
            }, 200)
        }

        $(el).on('dragstart',function(event){
            // event.preventDefault();
            this.dragstart();
        });
        $(el).on('dragend',function(event){
            // event.preventDefault();
            this.dragend();
        });
        // el.addEventListener('dragstart', this.dragstart);
        // el.addEventListener('dragend', this.dragend);
        document.addEventListener('drop', this.drop);
        return getCameraFromElement(this).then(function(camera){
            var onlineClass; var recordingEle; var field;
            if (camera && camera.src && camera.src[camfield]) {
                onlineClass = camera.src.status == 'active' ? 'online' : 'offline';
                recordingEle = camera.src.recording ? "<div class='isRecording'></div>" : "";
                el.channeltoken = camera.src&&camera.src.roToken ? camera.src.roToken : camera.token;
                field = camera.src[camfield];
            } else if (camera && camera.bsrc) {
                if (localStorage.cameraList) {
                    var cams = JSON.parse(localStorage.camearaList).objects;
                    var cam = cams.find(c => c.id == camera.camera_id);
                    onlineClass = cam.status == 'active' ? 'online' : 'offline';
                } else {
                    var onlineClass = 'online';
                }

                recordingEle = camera.bsrc.isRecording ? "<div class='isRecording'></div>" : "";
                el.channeltoken = camera.token;
                field = camera.bsrc[camfield];
            }
            $(el).html('<i class="fa fa-video-camera mon-camera ' + onlineClass + '" aria-hidden="true"></i> <span>' + field + '</span>' + recordingEle);
        });
    },
    'attributeChangedCallback':function(name, value){
        $(this).empty();

        let camfield = $(this).attr('field');
        if (typeof camfield !== "string") return defaultPromise();

        let el = this;
        return getCameraFromElement(this).then(function(camera){
            if (camera && camera.src && camera.src[camfield])
                $(el).html('<i class="fa fa-video-camera mon-camera" aria-hidden="true"></i> <span>' + camera.src[camfield] + '</span>');
        });
    }
}
