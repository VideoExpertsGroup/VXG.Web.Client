window.screens = window.screens || {};
window.controls = window.controls || {};
var path = window.core.getPath('playercontrol.js');


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

window.controls['player'] = {
    'js':[],
    'css':[],
    'commoncss':['sdk/vxgwebsdk/video-js.min.css', 'sdk/vxgwebsdk/CloudSDK.min.css'],
    'commonjs':[/*'sdk/moment.min.js','sdk/moment-timezone-with-data-2012-2022.min.js','sdk/vxgwebsdk/popper.min.js'*/,'sdk/vxgwebsdk/video.min.js'/*,'sdk/videojs-http-streaming.js'*,'sdk/videojs-contrib-hls.js'*/,'sdk/vxgwebsdk/webrtc-adapter-latest.js','sdk/vxgwebsdk/CloudSDK.debug.js','sdk/vxgwebsdk/LocalPlayer.js'],
    'observedAttributes':function(){
        return ['access_token'];
    },
    'on_init':function(){

        let access_token = $(this).attr('access_token');
        let el = this;
        let self = this;
        this.newid = Math.floor(Math.random() * Math.floor(1000000000));
        this.play = function(){
            if (window.controls['player'].players['player'+this.newid]!==undefined) window.controls['player'].players['player'+this.newid].play();
        };
        this.stop = function(){
            if (window.controls['player'].players['player'+this.newid]!==undefined) window.controls['player'].players['player'+this.newid].stop();
        };
        $(this).html('<div id="player'+this.newid+'"></div>');
        window.controls['player'].players = window.controls['player'].players || {};
        
        var playerOptions = { timeline: ($(this).attr('timeline')!==undefined), timelineampm: true, mute: true, alt_protocol_names:true, calendar: false, autohide:($(this).attr('autohide')===undefined?-1:3000)};

        let loader_timeout = $(this).attr('loader_timeout');
        if (loader_timeout !== undefined) {
		playerOptions.loaderTimeout = loader_timeout;
        }
        
        let preferredPlayerFormat = $(this).attr('preferredPlayerFormat');
        if (preferredPlayerFormat !== undefined) {
    		playerOptions.preferredPlayerFormat = preferredPlayerFormat;
    		playerOptions.jpegRedrawPeriod = 1000;
    		playerOptions.jpegForcedUpdatePeriod = 5000;
        }
        
        
        if (window.core.isMobile()){
        	playerOptions.disableAudioControl = true;
        	playerOptions.disableZoomControl = true;
        	playerOptions.disableGetShot = true;
        	playerOptions.disableGetClip = true;
        }
	playerOptions.livePoster = true;

        window.controls['player'].players['player'+this.newid]  = new CloudPlayerSDK('player'+this.newid, playerOptions);
        if (window.screens['cameras'].playerList) window.screens['cameras'].playerList.addPlayerToList(window.controls['player'].players['player'+this.newid]);
        window.controls['player'].players['player'+this.newid].addCallback('callback'+this.newid, function(evnt, args){
            if (evnt.name=='SOURCE_CHANGED')
                setTimeout(function(){
                    window.controls['player'].players['player'+self.newid].play();
                },10);
        });

        if (parseInt(access_token)>0)
            return getCameraFromElement(this).then(function(camera){
                return camera.getToken().then(function(token){
                    window.controls['player'].players[self.newid].setSource(camera.token);
                },function(){
                    window.controls['player'].players[self.newid].stop();
                });
            });
        if (typeof access_token === "string")
             window.controls['player'].players['player'+this.newid].setSource(access_token);

        $(this).parent().find('player, player>div').off('dragover').on('dragover',function(e) {
            e.preventDefault();
        });

	self.onwebkitfullscreenchange = self.onmozfullscreenchange = self.onfullscreenchange = function() {
		if (document.webkitIsFullScreen) {
		    window.controls['player'].players['player'+this.newid].showZoomControl(true);
		} else {
		    if (window.core.isMobile()){
			window.controls['player'].players['player'+this.newid].showZoomControl(false);
		    }
		}
	}

        return defaultPromise();
    },
    'attributeChangedCallback':function(name, value){
        let id = this.newid;
        let access_token = $(this).getNearParentAtribute('access_token');
        return vxg.cameras.getCameraFrom(access_token).then(function(camera){
            if (!camera){
                window.controls['player'].players['player'+id].stop();
                return;
            }
            return camera.getToken().then(function(token){
                window.controls['player'].players['player'+id].setSource(token);
                if (window.screens['cameras'].playerList) window.screens['cameras'].playerList.addPlayerToList(window.controls['player'].players['player'+id]);
            },function(){
                window.controls['player'].players['player'+id].stop();
            });
        });
    },
    'disconnectedCallback':function(){
        let id = $(this.children[0]).attr('id');
        window.controls['player'].players[id].destroy();
        delete window.controls['player'].players[id];
        return defaultPromise();
    },
}
