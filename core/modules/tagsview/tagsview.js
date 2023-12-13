window.screens = window.screens || {};
window.controls = window.controls || {};
window.dialogs = window.dialogs || {};
var path = window.core.getPath('tagsview.js');

window.screens['tagsview'] = {
    'header_name': 'Notes',
    'html': path+'tagsview.html',
    'css': [path+'tagsview.css',
	path+'../../common/VXGActivity/VXGActivityList.css',
	path+'../../common/VXGActivity/VXGActivityListWithMore.css',
    ],
    'js': [
        path+'eventslist.js',
//        path+'../../webcontrols/kplayer.js',
    ],
    'stablecss':[path+'stagsview.css'],
    'commoncss':[
	'sdk/vxgwebsdk/bootstrap.min.css',
	'inspinia/css/plugins/clockpicker/clockpicker.css',
	'inspinia/css/plugins/datepicker/datepicker3.css',
	'VXGActivity/VXGActivity.css'
    ],
    'commonjs':[
	'sdk/vxgwebsdk/popper.min.js',
	'sdk/vxgwebsdk/bootstrap.min.js',
	'inspinia/js/plugins/clockpicker/clockpicker.js',
	'inspinia/js/plugins/datepicker/bootstrap-datepicker.js',
	'VXGActivity/VXGActivity.js'
    ],
    'on_before_show':function(access_token, timestamp){
        core.elements['header-center'].text('Camera');
        if (!access_token) access_token = $(this.src).getNearParentAtribute('access_token');
        this.access_token = access_token;
        let self=this;
        $('.cloudplayer-sd-backup').attr('id', 'sd-disabled');
        return vxg.cameras.getCameraFrom(self.access_token).then(function(camera){
            self.access_token = camera.token;
            if (!self.camera) self.camera = camera;
        });
    },
    'on_show':function(access_token, timestamp){
        let self =this;
        if (self.player.element) {
            self.player.element.querySelector(".cloudplayer-calendar-container").classList.remove("offline");
            self.player.element.querySelector(".cloudplayer-controls-container").classList.remove("offline");
        } else {
            self.player.player.player.querySelector(".cloudplayer-calendar-container").classList.remove("offline");
            self.player.player.player.querySelector(".cloudplayer-controls-container").classList.remove("offline");
        }

        self.timestamp = undefined;
	self.set_mode('showevents');
        if ($('body').hasClass('mobile')) $(self.wrapper).find('.tagslistwrapper .sharebnts').hide();
        $(self.wrapper).find('.tagslistwrapper .shareinfo').hide();
        if (access_token) this.access_token = access_token;
        if (sessionStorage.getItem('use_new_player_version'))
            $('.playerwrapper').addClass('activenewver');
        else
            $('.playerwrapper').removeClass('activenewver');

        $('.headerBlock .header-center').text('Camera');
        if (this.access_token) return vxg.cameras.getCameraFrom(this.access_token).then(function(camera){
            camera.getName().then(function(name){
                $('.headerBlock .header-center').text(name);
            });
            self.camera = camera;

            // Meta data "dvr"="" is set for every channel that belonds to any DVR
            $("#enable-dvr-input").prop('checked', false);
            if (self.camera.src && "meta" in self.camera.src && ("dvr" in self.camera.src.meta || "dvr_name" in self.camera.src.meta || "dvr_camera" in self.camera.src.meta))
                $("#backup-ctrl").show();
            else
                $("#backup-ctrl").hide();

            /*
            vxg.api.cloud.getCameraConfig(self.camera.camera_id, self.camera.token).then(function(cam) {
                var camUrl = cam.url;
                if (camUrl && camUrl.includes("dvr_camera")) {
                   // $(".dvr-label-text").removeClass("disabled");
                    $("#enable-dvr-input").prop('checked', true);
                    $("#backup-ctrl").show();
                } else {
                  //  $(".dvr-label-text").addClass("disabled");
                    $("#enable-dvr-input").prop('checked', false);
                    $("#backup-ctrl").hide();
                }
            });
            */

            if (self.player.player.sdCardCompatible) {
                var localStorage_sdCard = localStorage.getItem(self.camera.camera_id);
                var sdCardEnabled = (typeof localStorage_sdCard === "string" && localStorage_sdCard.toLowerCase() === "true");
                if (sdCardEnabled) {
                    $("#backup-ctrl").show();
                /*
                    $('.cloudplayer-sd-backup').attr('id', 'sd-enabled');
                    $("#enable-sd-input").prop('checked', true);
                }
                else {
                    $('.cloudplayer-sd-backup').attr('id', 'sd-disabled');
                    $("#enable-sd-input").prop('checked', false);
                */
                }
                /*self.camera.getCameraType().then(function(type) {
                    // 1 - SD Card, 0 - Cloud
                    if (type == 1) $('.cloudplayer-sd-backup').attr('id', 'sd-enabled');
                    else $('.cloudplayer-sd-backup').attr('id', 'sd-disabled');
                }, function(err) {
                    console.log(err.responseText);
                })*/
            }

            $(self.wrapper).find('events-list').attr('access_token',camera.token);
            try {
                var inc = new Date().getTime() / 1000;
                self.camera.createClip(inc - 10000, inc + 10000, "testingClip").then(function(clip){
                    clip.setMeta("testingMeta", "", "", inc).then(function(readyclip){
                        console.log("meta is working, delete clip and camera just made");
                        self.metaEnabled = true;
                    },function(){
                        self.metaEnabled = false;
                        $(".clipcase").addClass("disabled clipdis");
                        $(".edittag").addClass("disabled")
                        $(".clip textarea").addClass("disabled clipdis")
                        $(".shownotes").addClass("disabled");
                    });
                    vxg.api.cloud.deleteClipV2(clip.token, clip.src.id).then(function(r){ /* testing clip deleted */}, function(err) {console.log(err)})
                },function(){
                    console.log("Test clip isn't working, something bad has happened");
                });
            } catch(err) {
                console.log(err);
                self.metaEnabled = false;
            }
            function tryStart( position) {
                if (self.player.camera != null) {
                        self.player.setPosition(position);
                        self.player.play();
                } else {
                    setTimeout(function() {
                        tryStart(position);
                    }, 100);
                }
            }

            if (sessionStorage.getItem('use_new_player_version')){
                self.camera.getToken().then(function(token){
                    $('.mainkplayer').attr('src',token);
                });
            } else {
                self.access_token = camera.token;
                self.player.setSource(self.access_token);
                self.timestamp = timestamp;
                if (timestamp!==undefined && timestamp>0)
                    tryStart(timestamp);
                else
                    tryStart(-1);
            }

            self.update_meta_list();

            self.updateActivity( self.access_token);

        }, function(){
            alert('Fail load camera');
        });
        return defaultPromise();
    },
    'on_hide':function(){
        $("#backup-ctrl").hide();
        this.player.stop();
        return defaultPromise();
    },
    'on_ready':function(){
        return defaultPromise();
    },
    somethingWrong: function( err ) {
	console.warn('Something wrong' + err);
    },
    listActivityCB: function ( operation,  obj ) {
	let camid = obj['camid'];
	let time  = obj['time'];
	let timestamp = (new Date(time)).getTime();
	let self = window.screens['tagsview'];

	console.warn('<DEBUG> operation:' + operation);

	if (operation === "event") {
        if (self.player.element) {
            self.player.element.querySelector(".cloudplayer-calendar-container").classList.remove("offline");
            self.player.element.querySelector(".cloudplayer-controls-container").classList.remove("offline");
        } else {
            self.player.player.player.querySelector(".cloudplayer-calendar-container").classList.remove("offline");
            self.player.player.player.querySelector(".cloudplayer-controls-container").classList.remove("offline");
        }
		self.player.setPosition(timestamp);
	} else if (operation === "meta") {
		self.player.setPosition(timestamp);
	} else if (operation === "filterChanged") {
	}
    },
    updateActivity: function ( access_token ) {
	let self = this;

	var targetElement	= self.wrapper.find('.eventslist')[0];
	let apiGetActivityFunc	= vxg.api.cloud.getEventslist;
	let somethingWrongFunc	= self.somethingWrong;
	let controlCbFunc	= self.listActivityCB;

	targetElement.showActivityList( access_token, access_token, apiGetActivityFunc.bind(this) , somethingWrong.bind(this), controlCbFunc.bind(this) );
    },
    minTwoDigits: function(n) {
	return (n < 10 ? '0' : '') + n;
    },
    modes() {
        return ['showedittag','shownotes','showevents','showcreateclip','showsnapshot','showshare','showfilterclip'];
    },
    get_mode(){
        let wrapper = $(this.wrapper);
        for (let i=0;i<this.modes().length;i++)
            if (wrapper.hasClass(this.modes()[i]))
                return this.modes()[i];
        return false;
    },
    set_mode(mode){
        if (this.modes().indexOf(mode)==-1) return;
        let self = this;
        let wrapper = $(this.wrapper);
        for (let i=0;i<this.modes().length;i++)
            wrapper.removeClass(this.modes()[i]);
        wrapper.addClass(mode);

	if (mode === 'showevents') {
		if (self.wrapper.currentFilter == null || self.wrapper.currentFilter === undefined) {
			self.updateActivity( self.access_token);
		}
	} else if ( mode === 'shownotes') {
		self.update_meta_list();
	}
    },
    dateToUserTimeString: function(date){
        if (date===undefined) date = new Date();
        return new Date(date).toLocaleString('en-CA', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }).replace(/[,|.]/g,'').replace(' 24',' 00');
    },
    'on_init':function(){
        let self = this;
        if (vxg.user.src.role=='user')
            core.elements['header-right'].prepend('<div class="ncssbuttons"><div class="transparent-button makesnapshot"><i class="fa fa-camera" aria-hidden="true"></i><span> Snapshot</span></div></div>');
        else
            core.elements['header-right'].prepend(`<div class="ncssbuttons">
                <div class="transparent-button makeclip"><i class="fa fa-play-circle-o" aria-hidden="true"></i><span> Clip</span></div>
                <div class="transparent-button makesnapshot"><i class="fa fa-camera" aria-hidden="true"></i><span> Snapshot</div></span>
                <div class="transparent-button makeshare"><i class="fa fa-share-alt" aria-hidden="true"></i><span> Share</span></div>
                <div class="transparent-button active edittag"><span class="add-icon">+</span><span> Add note</span></div></div>`);
        /*if (vxg.user.src.role=='user')
           core.elements['header-right'].prepend('<div class="ncssbuttons"><div class="transparent-button makesnapshot"><img class="svgbtn" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuNzI0NDUgNC4zNTQ5Nkg1LjA0MzIzTDUuMTE0MzYgNC4wNDQyMkw1LjE3MTIzIDMuNzk1NzhDNS4xNzEzIDMuNzk1NDYgNS4xNzEzOCAzLjc5NTE1IDUuMTcxNDUgMy43OTQ4M0M1LjM2NDc2IDIuOTcxNSA2LjA4NzIzIDIuNCA2LjkyOTgyIDIuNEg5LjA2ODgxQzkuOTE1MTYgMi40IDEwLjYzNjggMi45NzIxNCAxMC44MjcxIDMuNzk0M0MxMC44MjcxIDMuNzk0NDIgMTAuODI3MSAzLjc5NDU1IDEwLjgyNzEgMy43OTQ2N0wxMC44ODQzIDQuMDQ0MjJMMTAuOTU1NCA0LjM1NDk2SDExLjI3NDJIMTMuNjc1NkMxNC40MDIgNC4zNTQ5NiAxNC45OTIzIDQuOTQ1MTkgMTQuOTkyMyA1LjY3MTU5VjEyLjE5NDJDMTQuOTkyMyAxMi45Njg4IDE0LjM2MjggMTMuNTk4MyAxMy41ODgyIDEzLjU5ODNIMi40MTM0OUMxLjYzODgyIDEzLjU5ODMgMS4wMDkzOCAxMi45Njg4IDEuMDA5MzggMTIuMTk0MlY1LjY3MTU5QzEuMDA5MzggNC45NDc3NSAxLjYwMDA2IDQuMzU0OTYgMi4zMjYgNC4zNTQ5Nkg0LjcyNDQ1WiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjgiLz4KPHBhdGggZD0iTTMuMTEwMDEgNi43NjY4OUMzLjM4MzI3IDYuNzY2ODkgMy42MDQ3OCA2LjU0NTM3IDMuNjA0NzggNi4yNzIxMkMzLjYwNDc4IDUuOTk4ODYgMy4zODMyNyA1Ljc3NzM0IDMuMTEwMDEgNS43NzczNEMyLjgzNjc1IDUuNzc3MzQgMi42MTUyMyA1Ljk5ODg2IDIuNjE1MjMgNi4yNzIxMkMyLjYxNTIzIDYuNTQ1MzcgMi44MzY3NSA2Ljc2Njg5IDMuMTEwMDEgNi43NjY4OVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMC43MDUzIDguOTk2NUMxMC43MDUzIDEwLjQ4NjIgOS40OTA1NyAxMS43MDA5IDguMDAwODkgMTEuNzAwOUM2LjUxMDk2IDExLjcwMDkgNS4yOTY0OCAxMC40ODg5IDUuMjk2NDggOC45OTY1QzUuMjk2NDggNy41MDQwNiA2LjUxMDk2IDYuMjkyMDkgOC4wMDA4OSA2LjI5MjA5QzkuNDkwNTcgNi4yOTIwOSAxMC43MDUzIDcuNTA2ODIgMTAuNzA1MyA4Ljk5NjVaIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjAuOCIvPgo8L3N2Zz4K"><span>&nbsp;&nbsp;Snapshot</span></div></div>');
        else
           core.elements['header-right'].prepend(`<div class="ncssbuttons">
<div class="transparent-button makeclip"><img class="svgbtn" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDE2IDE2IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTcuMTMyODEgNS4wNTY4OEwxMS40MDYxIDcuOTA1NzRMNy4xMzI4MSAxMC43NTQ2VjUuMDU2ODhaIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjAuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMi42NDY0NyA1Ljg2MjYyTDQuMzA2MTggNS4yNDAyMkM0LjUxMzAzIDUuMTYyNjUgNC43NDM2IDUuMjY3NDYgNC44MjExNiA1LjQ3NDNDNC44OTg3MyA1LjY4MTE1IDQuNzkzOTMgNS45MTE3MiA0LjU4NzA4IDUuOTg5MjhMMS45MjU0MSA2Ljk4NzQxQzEuNzE4NTYgNy4wNjQ5OCAxLjQ4Nzk5IDYuOTYwMTggMS40MTA0MiA2Ljc1MzMzTDAuNDEyMjk2IDQuMDkxNjZDMC4zMzQ3MjcgMy44ODQ4MSAwLjQzOTUzIDMuNjU0MjQgMC42NDYzNzggMy41NzY2N0MwLjg1MzIyNiAzLjQ5OTExIDEuMDgzNzkgMy42MDM5MSAxLjE2MTM2IDMuODEwNzZMMS44NjMwNiA1LjY4MTk2QzMuMDI5MTEgMi4xNjEzMiA2Ljc1NTA0IDAuMTE5OTg0IDEwLjM4MzUgMS4wOTIyMUMxNC4xNDY2IDIuMTAwNTUgMTYuMzc5OSA1Ljk2ODYzIDE1LjM3MTUgOS43MzE4QzE0LjM2MzIgMTMuNDk1IDEwLjQ5NTEgMTUuNzI4MiA2LjczMTkzIDE0LjcxOTlDNi41MTg1NSAxNC42NjI3IDYuMzkxOTIgMTQuNDQzNCA2LjQ0OTA5IDE0LjIzQzYuNTA2MjcgMTQuMDE2NiA2LjcyNTYgMTMuODg5OSA2LjkzODk5IDEzLjk0NzFDMTAuMjc1NCAxNC44NDExIDEzLjcwNDggMTIuODYxMSAxNC41OTg4IDkuNTI0NzRDMTUuNDkyOCA2LjE4ODM0IDEzLjUxMjggMi43NTg5NCAxMC4xNzY0IDEuODY0OTVDNi45ODQxNCAxLjAwOTU5IDMuNzA2NzUgMi43ODUyMiAyLjY0NjQ3IDUuODYyNjJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4="><span>&nbsp;&nbsp;Clip</span></div>
<div class="transparent-button makesnapshot"><img class="svgbtn" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDE2IDE2IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTQuNzI0NDUgNC4zNTQ5Nkg1LjA0MzIzTDUuMTE0MzYgNC4wNDQyMkw1LjE3MTIzIDMuNzk1NzhDNS4xNzEzIDMuNzk1NDYgNS4xNzEzOCAzLjc5NTE1IDUuMTcxNDUgMy43OTQ4M0M1LjM2NDc2IDIuOTcxNSA2LjA4NzIzIDIuNCA2LjkyOTgyIDIuNEg5LjA2ODgxQzkuOTE1MTYgMi40IDEwLjYzNjggMi45NzIxNCAxMC44MjcxIDMuNzk0M0MxMC44MjcxIDMuNzk0NDIgMTAuODI3MSAzLjc5NDU1IDEwLjgyNzEgMy43OTQ2N0wxMC44ODQzIDQuMDQ0MjJMMTAuOTU1NCA0LjM1NDk2SDExLjI3NDJIMTMuNjc1NkMxNC40MDIgNC4zNTQ5NiAxNC45OTIzIDQuOTQ1MTkgMTQuOTkyMyA1LjY3MTU5VjEyLjE5NDJDMTQuOTkyMyAxMi45Njg4IDE0LjM2MjggMTMuNTk4MyAxMy41ODgyIDEzLjU5ODNIMi40MTM0OUMxLjYzODgyIDEzLjU5ODMgMS4wMDkzOCAxMi45Njg4IDEuMDA5MzggMTIuMTk0MlY1LjY3MTU5QzEuMDA5MzggNC45NDc3NSAxLjYwMDA2IDQuMzU0OTYgMi4zMjYgNC4zNTQ5Nkg0LjcyNDQ1WiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjgiLz4KPHBhdGggZD0iTTMuMTEwMDEgNi43NjY4OUMzLjM4MzI3IDYuNzY2ODkgMy42MDQ3OCA2LjU0NTM3IDMuNjA0NzggNi4yNzIxMkMzLjYwNDc4IDUuOTk4ODYgMy4zODMyNyA1Ljc3NzM0IDMuMTEwMDEgNS43NzczNEMyLjgzNjc1IDUuNzc3MzQgMi42MTUyMyA1Ljk5ODg2IDIuNjE1MjMgNi4yNzIxMkMyLjYxNTIzIDYuNTQ1MzcgMi44MzY3NSA2Ljc2Njg5IDMuMTEwMDEgNi43NjY4OVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMC43MDUzIDguOTk2NUMxMC43MDUzIDEwLjQ4NjIgOS40OTA1NyAxMS43MDA5IDguMDAwODkgMTEuNzAwOUM2LjUxMDk2IDExLjcwMDkgNS4yOTY0OCAxMC40ODg5IDUuMjk2NDggOC45OTY1QzUuMjk2NDggNy41MDQwNiA2LjUxMDk2IDYuMjkyMDkgOC4wMDA4OSA2LjI5MjA5QzkuNDkwNTcgNi4yOTIwOSAxMC43MDUzIDcuNTA2ODIgMTAuNzA1MyA4Ljk5NjVaIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjAuOCIvPgo8L3N2Zz4="><span>&nbsp;&nbsp;Snapshot</div></span>
<div class="transparent-button makeshare"><img class="svgbtn" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDE2IDE2IiBmaWxsPSJub25lIj4KPGNpcmNsZSBjeD0iMyIgY3k9IjguMzAyNDkiIHI9IjIiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMi44NzEwOSA4LjQwMTIyQzMuMDA5MTYgOC42NDAzNiAzLjMxNDk2IDguNzIyMyAzLjU1NDExIDguNTg0MjNMMTIuMjE0NCAzLjU4NDIzQzEyLjQ1MzUgMy40NDYxNiAxMi41MzU0IDMuMTQwMzYgMTIuMzk3NCAyLjkwMTIyQzEyLjI1OTMgMi42NjIwNyAxMS45NTM1IDIuNTgwMTMgMTEuNzE0NCAyLjcxODJMMy4wNTQxMSA3LjcxODJDMi44MTQ5NiA3Ljg1NjI3IDIuNzMzMDIgOC4xNjIwNyAyLjg3MTA5IDguNDAxMjJaIiBmaWxsPSJ3aGl0ZSIvPgo8Y2lyY2xlIGN4PSIxMi4yNjk1IiBjeT0iMyIgcj0iMiIgdHJhbnNmb3JtPSJyb3RhdGUoLTE4MCAxMi4yNjk1IDMpIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEyLjM5ODQgMi45MDEyN0MxMi4yNjA0IDIuNjYyMTMgMTEuOTU0NiAyLjU4MDE5IDExLjcxNTQgMi43MTgyNkwzLjA1NTE3IDcuNzE4MjZDMi44MTYwMiA3Ljg1NjMzIDIuNzM0MDkgOC4xNjIxMyAyLjg3MjE2IDguNDAxMjdDMy4wMTAyMyA4LjY0MDQyIDMuMzE2MDIgOC43MjIzNiAzLjU1NTE3IDguNTg0MjlMMTIuMjE1NCAzLjU4NDI5QzEyLjQ1NDYgMy40NDYyMiAxMi41MzY1IDMuMTQwNDIgMTIuMzk4NCAyLjkwMTI3WiIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSByPSIyIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSAxMi4yNjk1IDEzLjMwNDQpIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEyLjM5ODQgMTMuNDAzMkMxMi4yNjA0IDEzLjY0MjMgMTEuOTU0NiAxMy43MjQzIDExLjcxNTQgMTMuNTg2MkwzLjA1NTE3IDguNTg2MThDMi44MTYwMiA4LjQ0ODExIDIuNzM0MDkgOC4xNDIzMiAyLjg3MjE2IDcuOTAzMTdDMy4wMTAyMyA3LjY2NDAyIDMuMzE2MDIgNy41ODIwOSAzLjU1NTE3IDcuNzIwMTZMMTIuMjE1NCAxMi43MjAyQzEyLjQ1NDYgMTIuODU4MiAxMi41MzY1IDEzLjE2NCAxMi4zOTg0IDEzLjQwMzJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4="><span>&nbsp;&nbsp;Share</span></div>
<div class="transparent-button active edittag"><img class="svgbtn" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDE2IDE2IiBmaWxsPSJub25lIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04IDEzLjVDNy43MjM4NiAxMy41IDcuNSAxMy4yNzYxIDcuNSAxM1YzQzcuNSAyLjcyMzg2IDcuNzIzODYgMi41IDggMi41QzguMjc2MTQgMi41IDguNSAyLjcyMzg2IDguNSAzVjEzQzguNSAxMy4yNzYxIDguMjc2MTQgMTMuNSA4IDEzLjVaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIuNSA4QzIuNSA3LjcyMzg2IDIuNzIzODYgNy41IDMgNy41TDEzIDcuNUMxMy4yNzYxIDcuNSAxMy41IDcuNzIzODYgMTMuNSA4QzEzLjUgOC4yNzYxNCAxMy4yNzYxIDguNSAxMyA4LjVMMyA4LjVDMi43MjM4NiA4LjUgMi41IDguMjc2MTQgMi41IDhaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4="><span>&nbsp;&nbsp;Add note</span></div></div>`);
*/
        if ($('.screens > .tagsview .shownotes:visible').length>0)
            $(self.wrapper).addClass('shownotes');
        else
            $(self.wrapper).addClass('showevents');
        let d = $.Deferred();
        let f = false;
        core.elements['global-loader'].show();

        var playerOptions = {timeline: true, timelineampm: true, mute: true, alt_protocol_names:true, calendar: true/*, cloud_domain: vs_api.options['cloud_domain'], useOnlyPlayerFormat: 'html5'*/};
        if (window.core.isMobile()){
            playerOptions.disableAudioControl = true;
            playerOptions.disableZoomControl = true;
            playerOptions.disableGetShot = true;
            playerOptions.disableGetClip = true;
        }
        playerOptions.livePoster = true;
        var localStorage_sdCard = localStorage.getItem(self.camera.camera_id);
        var sdCardEnabled = (typeof localStorage_sdCard === "string" && localStorage_sdCard.toLowerCase() === "true");
        playerOptions.disableSdCard = sdCardEnabled ? false : true;

        self.player = new CloudPlayerSDK('tagsplayer', playerOptions);

        if (self.player.player.sdCardCompatible) {
            if (sdCardEnabled) {
                $('.cloudplayer-sd-backup').attr('id', 'sd-enabled');
                $("#enable-sd-input").prop('checked', true);
            }
            else $('.cloudplayer-sd-backup').attr('id', 'sd-disabled');
        } else {
            $('.cloudplayer-sd-backup').attr('id', 'sd-disabled');
            $('.sd-wrapper').remove();
        }


        $('.enable-sd-label').change(function() {
            var sdEnabled = $("#enable-sd-input").is(':checked') ? true : false;
            localStorage.setItem(self.camera.camera_id, sdEnabled);
            localStorage.setItem("from_tagsview", self.access_token);
            //if (!sdEnabled) self.player.player._toggleSync(true);
            location.reload();
        });

        $('.enable-dvr-label').change(function() {
            var dvrEnabled = $("#enable-dvr-input").is(':checked') ? true : false;
            dvrEnabled ? $("#backup-ctrl").show() : $("#backup-ctrl").hide();
        });

        $('.tonewver').click(function(){
            $('.mainkplayer')[0].pause();
            self.player.pause();
            let u = sessionStorage.getItem('use_new_player_version');
            if (u===null || u==='0'){
                sessionStorage.setItem('use_new_player_version','1');
                $(this).parent().addClass('activenewver');
                self.camera.getToken().then(function(token){
                    self.access_token = token;
                    $('.mainkplayer').attr('src',token);
                });
            } else {
                sessionStorage.removeItem('use_new_player_version');
                $(this).parent().removeClass('activenewver');
                self.camera.getToken().then(function(token){
                    self.access_token = token;
                    self.player.setSource(self.access_token);
               });
            }
        });


        $("#start-backup").click(function() {
            var startTime = $("#startTime").val();
            var endTime = $("#endTime").val();
            var speed = Number($("#speed").val());
            var overwrite = $("#overwrite").is(':checked') ? true : false;
            $(".backup-status").html('Backup <span id="error-message"> </span>');

            var now = new Date();

            if (new Date(endTime).getTime() < new Date(startTime).getTime()) {
                $(".backup-status").html('Backup <span id="error-message"> Error: Start time should be after end time. </span>');
                return;
            }

            if (new Date(startTime).getTime() > now.getTime() || new Date(endTime).getTime() > now.getTime()) {
                $(".backup-status").html('Backup <span id="error-message">  Error: Currently unable to schedule future backups. Please enter a past time. </span>');
                return;
            }

            utc_start_time = new Date(startTime).toISOString().replace("Z","");
            utc_stop_time = new Date(endTime).toISOString().replace("Z","");
            existing_data_ = "error";
            if (overwrite) existing_data_ = "delete";
                else existing_data_ = "error"
            var data = {
                start:  utc_start_time,
                end: utc_stop_time,
                existing_data: existing_data_,
                speed: speed
            }

            // It is better to change button on the cancel
            // so user can interrupt it
            $("#start-backup").attr('disabled','disabled');
            // Start local loader here
            self.camera.backupRecordedVideo(data).then(function(r) {

            var rid = r.id;
            setTimeout(step, 1000);
            var counter = 0;
            function loader()
            {
                progress = ".";
                $(".backup-status").html('Backup <span id="error-message">'+ '*'.repeat(counter)  +'</span>');
                counter++;
                if (counter == 10) counter=1;
            }



            function step() {
                    self.camera.backupRecordedVideoStatus(rid).then(function(r) {
                        //console.log(".backupRecordedVideoStatus status:" +  r.status);
                        if (r.status == "pending")
                        {
                            loader();
                            setTimeout(step, 1000);
                        }
                        else
                        {
                            if (r.status != "error")
                            {
                                $(".backup-status").html('Backup <span id="error-message">' + "Error can not handle the your request:" + r.error_code  + '</span>');
                                console.log("Error on getting status  backupRecordedVideo Error" + r.error_code );
                            }

                            $(".backup-status").html('Backup <span id="error-message"></span>');
                            $("#start-backup").removeAttr('disabled');
                            // stop local loader here
                        }

                    },function(r){
                        $("#start-backup").removeAttr('disabled');
                        // stop local loader here
                        $(".backup-status").html('Backup <span id="error-message">' + "Error can not handle the your request:" + r.responseText  + '</span>');
                        console.log("Error on getting status  backupRecordedVideo Error" + r.responseText );
                    });
                }

            },function(r){
                $("#start-backup").removeAttr('disabled');
                error_message = r.responseText;
                if (r.status == 409)  //CONFLICT
                    error_message = "There is data for the requested period";

                 // stop local loader here
                $(".backup-status").html('Backup <span id="error-message">' + "Error can not handle the your request:" + error_message  + '</span>');
                console.log("Can not create backup recorded video from " + startTime +  " to " + endTime +  " ERROR" + error_message);
            }
            )

        });

        setTimeout(function(){
            if (!f) core.elements['global-loader'].hide();
            f = true;
            d.resolve();
        },100);

        var targetElement = self.wrapper.find('.eventslist')[0];
	var activity_controller = new VXGActivityController(targetElement);


	var el_datepicker = $(this.wrapper).find('.calendarStartDate');
        el_datepicker.datepicker({
            todayBtn: "linked",
            forceParse: false,
            calendarWeeks: true,
            autoclose: true,
            format: "yyyy/mm/dd"
        });

        var el_clockpicker = $(this.wrapper).find('.calendarStartTime');
        el_clockpicker.clockpicker({
	    autoclose: true,
	    twelvehour: false,
	    default: '00:00',
	});
/*
        $(this.wrapper).find('time-line-picker').on('change',function(){
            let time = parseInt($(this).attr('centerutctime'));
            let date = new Date(time);
            date = date.toLocaleString('en-CA', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }).replace(/[,|.]/g,'').replace(' 24',' 00');
            if ($(this).hasClass('clipstarttime')){
                let scale = $(this).attr('scale');
                if (scale != $(self.wrapper).find('.clipendtime').attr('scale'))
                    $(self.wrapper).find('.clipendtime').attr('scale',scale);
                let time2 = parseInt($(self.wrapper).find('.clipendtime').attr('centerutctime'));
                $(self.wrapper).find('span.starttime').text(date);
                if (time2>time+3600000)
                    setTimeout(function(){
                        $(self.wrapper).find('.clipendtime').attr('centerutctime',time+3600000);
                    },0);
                if (time2<time+10000)
                    setTimeout(function(){
                        $(self.wrapper).find('.clipendtime').attr('centerutctime',time+10000);
                    },0);
                if (time2-time>=10000 && time2-time<=3600000)
                     $(self.wrapper).find('span.cliplength').text(parseInt((time2-time)/1000));
            }
            if ($(this).hasClass('clipendtime')){
                let scale = $(this).attr('scale');
                if (scale != $(self.wrapper).find('.clipstarttime').attr('scale'))
                    $(self.wrapper).find('.clipstarttime').attr('scale',scale);
                let time2 = parseInt($(self.wrapper).find('.clipstarttime').attr('centerutctime'));
                $(self.wrapper).find('span.endtime').text(date);
                if (time>time2+3600000)
                    setTimeout(function(){
                        $(self.wrapper).find('.clipstarttime').attr('centerutctime',time-3600000);
                    },0);
                if (time<time2+10000)
                    setTimeout(function(){
                        $(self.wrapper).find('.clipstarttime').attr('centerutctime',time-10000);
                    },0);
                if (time-time2>=10000 && time-time2<=3600000)
                    $(self.wrapper).find('span.cliplength').text(parseInt((time-time2)/1000));
            }
            if ($(this).hasClass('snapshottime')) {
                $(self.wrapper).find('span.snapshottime').text(date);
                if (self.update_snapshottime_timer) clearTimeout(self.update_snapshottime_timer);
                self.update_snapshottime_timer = setTimeout(function(){
                    let pos = self.player.getPosition();
                    if (pos!=time)
                        self.player.setPosition(time);
                    delete self.update_snapshottime_timer;
                },1000);
            }
        });
*/

        core.elements['header-right'].find('.ncssbuttons .filterclip').click(function(){
            let mode = self.get_mode(); if (mode=='shownotes' || mode=='showevents') self.modebeforeedit = mode;
            let el_datepicker = $(self.wrapper).find('.calendarStartDate')[0];
	    let el_clockpicker = $(self.wrapper).find('.calendarStartTime')[0];

            if (el_datepicker.value === '' && el_clockpicker.value === '') {
		let now = new Date();
		el_datepicker.value = now.getFullYear() + '/' + minTwoDigits(now.getMonth()+1) + '/'+ minTwoDigits(now.getDate());
		el_clockpicker.value = minTwoDigits(now.getHours())+':'+minTwoDigits(now.getMinutes());
	    }
            self.set_mode('showfilterclip');
        });

        $(this.wrapper).find('.clearfilterbtn').click(function(){
		self.wrapper.currentFilter = null;
		core.elements['header-right'].find('.ncssbuttons .filterclip')[0].classList.remove('vxgbutton-rounded');
		self.set_mode('showevents');
        });
        $(this.wrapper).find('.setfilterbtn').click(function(){
    		let date	= $(self.wrapper).find('.tagsviewfilter .calendarStartDate').val();
    		let time	= $(self.wrapper).find('.tagsviewfilter .calendarStartTime').val();
    		let period	= $(self.wrapper).find('.tagsviewfilter .calendarPeriod').val();

    		var startDate = new Date( date + ' ' + time );
    		var startSec  = startDate.getTime();
    		var endSec = startSec - Number(period)*60*60*1000;
    		var endDate = new Date(endSec);

    		console.log('<Debug> ' + endSec + '~' + startSec);

    		if (!Number.isInteger(endSec) || !Number.isInteger(startSec)) {
    			return;
    		}

    		var starttime_str = endDate.getUTCFullYear()
		+ "-" + minTwoDigits(Number(endDate.getUTCMonth()) + 1)
		+ "-" + minTwoDigits(endDate.getUTCDate())
		+ "T" + minTwoDigits(endDate.getUTCHours())
		+ ":" + minTwoDigits(endDate.getUTCMinutes())
		+ ":" + minTwoDigits(endDate.getUTCSeconds());

		var endtime_str = startDate.getUTCFullYear()
		+ "-" + minTwoDigits(Number(startDate.getUTCMonth()) + 1)
		+ "-" + minTwoDigits(startDate.getUTCDate())
		+ "T" + minTwoDigits(startDate.getUTCHours())
		+ ":" + minTwoDigits(startDate.getUTCMinutes())
		+ ":" + minTwoDigits(startDate.getUTCSeconds());

    		var targetElement = self.wrapper.find('.eventslist')[0];

    		let filter = {};
    		filter.start = starttime_str;
    		filter.end = endtime_str;
    		filter.motion = true;

    		self.wrapper.currentFilter = filter;
    		core.elements['header-right'].find('.ncssbuttons .filterclip')[0].classList.add('vxgbutton-rounded');

    		targetElement.acceptVXGFilter(filter);
    		self.set_mode('showevents');
        });

        core.elements['header-right'].find('.ncssbuttons .makeclip').click(function(){
            let pos = self.player.getPosition();
            if (self.player.player.isLive() || typeof pos !== "number" || pos === 0){
                alert('Select position firstly');
                return;
            }

            let mode = self.get_mode(); if (mode=='shownotes' || mode=='showevents') self.modebeforeedit = mode;
            $(self.wrapper).find('.clipinctime').attr('time',pos).html(self.dateToUserTimeString(new Date(pos)));
            $(self.wrapper).find('.cliptitle').val(self.dateToUserTimeString(new Date(pos)));
            self.set_mode('showcreateclip');
        });
        $(this.wrapper).find('.createclipbtn').click(function(){
            let before = parseInt($(self.wrapper).find('.clip .clipbefore').val());
            let after = parseInt($(self.wrapper).find('.clip .clipafter').val());
            let time = parseInt($(self.wrapper).find('.clip .clipinctime').attr('time'));
            let title = $(self.wrapper).find('.clip .cliptitle').val().trim();
            let notes = $(self.wrapper).find('.clip textarea').val();
            let clipcase = $(self.wrapper).find('.clip  .clipcase').val().trim();

            $(self.wrapper).find('.clip').addClass('spinner').find('button').attr('disabled','');
            self.camera.createClip(time - before*1000,time + after*1000, title).then(function(clip){
                if (self.metaEnabled) {
                    return clip.setMeta(title, notes, clipcase, time).then(function(readyclip){
                        dialogs['idialog'].activate('The clip<br/>successfully created',3000);

                        $(self.wrapper).find('.clip').removeClass('spinner').find('button').removeAttr('disabled');
                        $(self.wrapper).find('.clip .cancel:visible').click();
    /*
                        let downloadLink = document.createElement('a');
                        downloadLink.setAttribute('href', readyclip.src.url);
                        downloadLink.click();
    */
                    },function(){
                        $(self.wrapper).find('.clip').removeClass('spinner').find('button').removeAttr('disabled');
                        alert('Error on set clip meta');
                    });
                } else {
                    dialogs['idialog'].activate('The clip<br/>successfully created',3000);
                    $(self.wrapper).find('.clip').removeClass('spinner').find('button').removeAttr('disabled');
                    $(self.wrapper).find('.clip .cancel:visible').click();
                }

            },function(){
                $(self.wrapper).find('.clip').removeClass('spinner').find('button').removeAttr('disabled');
                alert('Error on create clip');
            });
        });

        core.elements['header-right'].find('.ncssbuttons .makesnapshot').click(function(){
            $(self.wrapper).find('.cloudplayer-get-shot').click()
/*
            let mode = self.get_mode(); if (mode=='shownotes' || mode=='showevents') self.modebeforeedit = mode;
            $(self.wrapper).find('.snapshottime').attr('centerutctime',self.editpos);
            self.set_mode('showsnapshot');
*/
        });
        core.elements['header-right'].find('.ncssbuttons .makeshare').click(function(){
            let mode = self.get_mode(); if (mode=='shownotes' || mode=='showevents') self.modebeforeedit = mode;
            $(self.wrapper).find('.tagslistwrapper .sharebnts').show();
            $(self.wrapper).find('.tagslistwrapper .shareinfo').hide();
            self.set_mode('showshare');
        });
        $(this.wrapper).find('.share1,.share2,.share3').click(function(){
            let time=30*60;
            if ($(this).hasClass('share2')) time = 60*60;
            if ($(this).hasClass('share3')) time = 24*60*60;
            let shareinfo = $(self.wrapper).find('.tagslistwrapper .shareinfo');
            shareinfo.addClass('spinner').show().find('.shareurl').html('');
            shareinfo.find('>*').hide();
            if ($('body').hasClass('mobile')) $(self.wrapper).find('.tagslistwrapper .sharebnts').hide();
            self.camera.shareCamera(time).then(function(r){
                shareinfo.find('>*').show();
                let pos = self.player.getPosition();
                pos = !self.player.player.isLive() && pos ? 'time='+pos+'&' : '';
                shareinfo.removeClass('spinner').find('.shareurl').html(window.location.origin+'/sharedcamera.html?'+pos+'token='+r['token']);
                shareinfo.find('.shareexpire').html(self.dateToUserTimeString(new Date(r['expire']*1000)));
                shareinfo.find('.sharecreated').html(self.dateToUserTimeString(new Date(r['created']*1000)));
            },function(){
                shareinfo.removeClass('spinner');
            });
        });
        $(this.wrapper).find('.toclipboard').click(function(){
            self.copyToClipboard($(self.wrapper).find('.shareurl').val());
            dialogs['idialog'].activate('The link<br/>successfully copied');
        });
        core.elements['header-right'].find('.ncssbuttons .edittag').click(function(){
            let pos = self.player.getPosition();
            if (!self.editmeta && (self.player.player.isLive() || typeof pos !== "number" || pos === 0)){
                alert('Select position firstly');
                return;
            }
            if (self.editmeta){
                pos = new Date(self.editmeta.timestamp+'Z').getTime();
                $(self.wrapper).find('.deltag').show();
            } else
                $(self.wrapper).find('.deltag').hide();

            $(self.wrapper).find('.inctime').attr('time',pos).html(self.dateToUserTimeString(new Date(pos)));

            let mode = self.get_mode(); if (mode=='shownotes' || mode=='showevents') self.modebeforeedit = mode;

            self.set_mode('showedittag');
            $(self.wrapper).find('.tagsedit textarea').val(!self.editmeta ? '' : self.editmeta.string.description);
            $(self.wrapper).find('.tagsedit .tagcase').val(!self.editmeta ? '' : self.editmeta.string.case);
            $(self.wrapper).find('.tagsedit .camname').html(self.camera.src.name);
        });
        $(this.wrapper).find('.deltag').click(function(){
            self.camera.deleteUserMeta(self.editmeta.id).then(function(){
                $(self.wrapper).find('button,textarea').removeAttr('disabled');
                $(self.wrapper).find('textarea').removeClass('spinner');
                $(self.wrapper).removeClass('showedittag');
                if (self.modebeforeedit) $(self.wrapper).addClass(self.modebeforeedit);
                self.update_meta_list();
                delete self.editmeta;
            },function(){
                $(self.wrapper).find('button,textarea').removeAttr('disabled');
                alert('Error on delete meta');
            });
        });
        $(this.wrapper).find('.btnarea .shownotes').click(function(){
            self.set_mode('shownotes');
        });
        $(this.wrapper).find('.btnarea .showevents').click(function(){
            self.set_mode('showevents');
        });
        $(this.wrapper).find('.cancel,.closebtn').click(function(){
            self.set_mode(self.modebeforeedit);
            delete self.editmeta;
        });
        $(this.wrapper).find('.savetag').click(function(){
            $(self.wrapper).find('button,textarea').attr('disabled','disabled');
            $(self.wrapper).find('textarea').addClass('spinner');
            let desc = $(self.wrapper).find('.tagdesc').val().trim();
            let cas = $(self.wrapper).find('.tagcase').val().trim();
            if (!desc) {
                alert('No description');
                $(self.wrapper).find('button,textarea').removeAttr('disabled');
                $(self.wrapper).find('textarea').removeClass('spinner');
                return;
            }
            let time = new Date(parseInt($(self.wrapper).find('.inctime').attr('time')));
            let date = new Date(time).toISOString().replace('Z','');
            let req = {"timestamp": date, "long": {"usermeta": 1},"string": {"type":"note", "case":cas, "description": desc}};
            if (self.editmeta) req['id'] = self.editmeta.id;
            self.camera.saveUserMeta([req]).then(function(){
                $(self.wrapper).find('button,textarea').removeAttr('disabled');
                $(self.wrapper).find('textarea').removeClass('spinner');
                $(self.wrapper).removeClass('showedittag');
                if (self.modebeforeedit) $(self.wrapper).addClass(self.modebeforeedit);
                self.update_meta_list();
                delete self.editmeta;
            },function(){
                $(self.wrapper).find('button,textarea').removeAttr('disabled');
                alert('Error on save meta');
            });
//            $(self.wrapper).removeClass('edittag');
        });

        return d;
    },
    "update_meta_list": function(){
         let self = this;
         $(self.wrapper).find('.tagslist').addClass('spinner').empty();
//         $(self.wrapper).find('button').attr('disabled','disabled');
//         core.elements['header-right'].find('.ncssbuttons .vxgbutton').attr('disabled','disabled');

         $(self.wrapper).find('.tagslist .onetag').remove();
         setTimeout(function(){
             self.camera.getUserMetaBeforeTime().then(function(r){
                 self.meta = r.objects;
                 let html = '';
                 if (r.objects.length>0) for(let i=0; i<r.objects.length; i++){
                      if (!r.objects[i]['string']['description']) continue;
                      let timestamp = new Date(r.objects[i]['timestamp']+'Z').getTime();
                      date = new Date(r.objects[i]['timestamp']+'Z');
                      date = date.toLocaleString('en-CA', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }).replace(/[,|.]/g,'').replace(' 24',' 00');
                      html += '<div class="onetag" timestamp="'+timestamp+'">';
                      if (vxg.user.src.role!='user') html += '<div class="edtag" meta="'+i+'"></div>';
                      html += '<div class="datetime">'+date+'</div><div class="case">'+(r.objects[i]['string']['case']?r.objects[i]['string']['case']:'')+'</div><div class="desc">'+(r.objects[i]['string']['description']?r.objects[i]['string']['description']:'')+'</div></div>';
                 }
                 let tagslist = $(self.wrapper).find('.tagslist');
                 tagslist.find('.onetag').remove();
                 if (r.objects.length>0)
                     tagslist.append(html);
                 else
                     tagslist.append('<div class="noevents">No notes. <a href="javascript:void(0)" onclick="$(\'.tagsview .edittag\').click()">Add note</a></div>');
                 tagslist.find('.onetag').click(function(){
                     let timestamp = $(this).attr('timestamp');
                     self.player.setPosition(timestamp);
                 });
                 tagslist.find('.edtag').click(function(){
                     let i = parseInt($(this).attr('meta'));
                     self.editmeta = self.meta[i];
                     core.elements['header-right'].find('.ncssbuttons .edittag').click();
                     return false;
                 });
                 $(self.wrapper).find('.tagslist').removeClass('spinner');
//                 core.elements['header-right'].find('.ncssbuttons .vxgbutton').removeAttr('disabled');
                 $(self.wrapper).find('button').removeAttr('disabled');
             },function(){
                 $(self.wrapper).find('.tagslist').removeClass('spinner');
//                 core.elements['header-right'].find('.ncssbuttons .vxgbutton').removeAttr('disabled');
                 $(self.wrapper).find('button').removeAttr('disabled');
             });
         },2000);
    },
    copyToClipboard: function (text) {
        var $temp = $("<input>");
        $("body").append($temp);
        $temp.val(text).select();
        document.execCommand("copy");
        $temp.remove();
    }
};

window.dialogs['createclip'] = {
    'html': path+'createclip.html',
    'css':[],
    'js':[],
    'on_show':function(){
        return defaultPromise();
    },
    'on_hide':function(){
        return defaultPromise();
    }
}

window.dialogs['makesnapshot'] = {
    'html': path+'makesnapshot.html',
    'css':[],
    'js':[],
    'on_show':function(){
        return defaultPromise();
    },
    'on_hide':function(){
        return defaultPromise();
    }
}

window.dialogs['share'] = {
    'html': path+'share.html',
    'css':[],
    'js':[],
    'on_show':function(){
        return defaultPromise();
    },
    'on_hide':function(){
        return defaultPromise();
    }
}