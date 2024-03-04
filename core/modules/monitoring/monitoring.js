window.screens = window.screens || {};
var path = window.core.getPath('monitoring.js');
//const locTypes = ["Province", "City", "Zone", "Circuit", "Subcircuit"];

function camGrid(size, /* 2,3,4 */ telconet = false){
    let el = $('.screens .monitoring .camgrid2')
    el.removeClass('grid3').removeClass('grid4');
    if (size==3) el.addClass('grid3');
    if (size==4) el.addClass('grid4');
    let td = $('.screens .monitoring .camgrid2 > div');
    let state = window.screens['monitoring'].getState();
    if (!window.screens['monitoring'].playerList) {
        try {
            //window.screens['cameras'].playerList = new CloudPlayerList("single-timeline", {timeline: true, calendar: true});
        } catch(e) {
            window.screens['monitoring'].playerList = null;
        }
    }
    var preferredPlayerFormat = (window.skin.grid && window.skin.grid.preferredPlayerFormat)?(' preferredPlayerFormat="' + window.skin.grid.preferredPlayerFormat + '" ' ):('') ;
    
    for (let i=0; i<td.length; i++){
        let access_token = state.cams['player'+i] && !telconet ? ' access_token="'+state.cams['player'+i]+'"' : '';
        if ($(td[i]).hasClass('grid3')){
            if (size>=3 && td[i].innerHTML=='')
                $(td[i]).html('<player class="grid-multiplayer" id="player'+i+'"'+access_token+' loader_timeout=-1 '+preferredPlayerFormat+'>player</player>');
            if (size<=2)
                $(td[i]).empty();
        } else if ($(td[i]).hasClass('grid4')){
            if (size>=4 && td[i].innerHTML=='')
                $(td[i]).html('<player class="grid-multiplayer" id="player'+i+'"'+access_token+' loader_timeout=-1 '+preferredPlayerFormat+'>player</player>');
            if (size<=3)
                $(td[i]).empty();
        } else {
            if (size<2)
                $(td[i]).empty();
            else if (td[i].innerHTML=='')
               $(td[i]).html('<player class="grid-multiplayer" id="player'+i+'"'+access_token+' loader_timeout=-1 '+preferredPlayerFormat+'>player</player>');
        }
    }

    let p = $('.screens .monitoring .camgrid2 player').off('dblclick').on('dblclick',function(){
        if (!$(this).attr('access_token')) return;
        let the = this;
        dialogs['mdialog'].activate(`<p>${$.t('monitoring.deleteConfirm.title')}</p><p><button name="cancel" class="vxgbutton">${$.t('action.no')}</button>&nbsp;&nbsp;&nbsp;&nbsp;<button name="delete" class="vxgbutton">${$.t('action.yes')}</button></p>`).then(function(r){
            if (r.button!='delete') return;
            $(the).attr('access_token','');
            $(the)[0].on_access_token_change('');
            let id = $(the).attr('id');
            let state = window.screens['monitoring'].getState();
            state.cams = state.cams || {};
            delete state.cams[id];
            window.screens['monitoring'].setState(state);
        });

    });
    $('.screens .monitoring .camgrid2 player').each(function(){
        this.on_access_token_change = function(token, telconet = false){
            let access_token = $(this).attr('access_token');
            let id = $(this).attr('id');
            let state = window.screens['monitoring'].getState();
            if (telconet) {
                let cloudPlayerId = this.newid;
                var cloudPlayerObj = window.controls['player'].players['player'+cloudPlayerId];
                return;
            }

            state.cams = state.cams || {};
            state.cams[id]=access_token;
            window.screens['monitoring'].setState(state);

            if (window.screens['monitoring'].playerList) {
                let cloudPlayerId = this.newid;
                var cloudPlayerObj = window.controls['player'].players['player'+cloudPlayerId];
                if (access_token == '') {
                    window.screens['monitoring'].playerList.removePlayerFromList(cloudPlayerObj)
                }
                window.screens['monitoring'].playerList.killSyncPromise(true).then(() => {
                    setTimeout(() => {
                        window.screens['monitoring'].playerList.killSyncPromise(false).then(() => {
                            window.screens['monitoring'].playerList.synchronize([], true)
                        })
                    }, 1500);
                })
            }           
        };        
    });
    onCameraScreenResize();
}

window.screens['monitoring'] = {
    'menu_weight':31,
    'menu_name': $.t('monitoring.title'),
    'get_args':function(){
        var hash = window.location.hash;
        var queryStr = hash.substring(hash.indexOf("?")+1);
        var camerasIdsStr = queryStr.includes('camera_id') ? queryStr.split('=')[1] : '';
        var cameraIds = camerasIdsStr.split(',');
        return cameraIds;
    },
//  TODO:
//    'menu_toggle':true,
//    'menu_disabled':true,
    'menu_icon': '<i class="fa fa-th-large" aria-hidden="true"></i>',
    'html': path+'monitoring.html',
    'css':[path+'monitoring.css'],
    'js':[path.substr(0,path.length-16)+'webcontrols/camera_map.js'],
    'stablecss':[path+'monitoring.css'],
    'playerList': null,
    'on_search':function(text){
        if (!text)
            delete this.search_text;
        else
            this.search_text = text;
        window.screens['monitoring'].activate();
    },
    'on_show':function(filterarray){
        setTimeout(function(){onCameraScreenResize();},100);

        core.elements['header-search'].hide();
        //if (core.elements['header-search']) core.elements['header-search'].find('input').val(this.search_text ? this.search_text : '');
        if (!filterarray) {
            var userFilters = localStorage.getItem("filter-"+vxg.user.src.email)
            if (!userFilters) {
                filterarray = []
            } else {
                filterarray = JSON.parse(userFilters);
            }
        }

        let self = this;
        let p = this.wrapper.find('player');
        for (i=0; i<p.length; i++) {
            var t = $(p[i]).attr('access_token')
            if ($(p[i]).attr('access_token')) {
                p[i].play();
            }
        }
        var hash = window.location.hash;
        var queryStr = hash.replaceAll("%22", "").substring(hash.indexOf("=")+1);
        if (queryStr.length > 0) { 
            $('.hidecameras').attr('disabled', true);
        } else {
            $('.hidecameras').attr('disabled', false);
        }

        $('.hidecameras').removeClass('closed');
        $('.hidecameras').addClass('open');
        $('.hidecameras').html('<i class="fa fa-angle-left" aria-hidden="true"></i>&nbsp;&nbsp;Hide Cameras');
        $('#cameras-list').show();
        $('.headerBlock').show();

        setTimeout(() => {
            if (self.playerList && self.playerList.getPlayerList()) {
                self.playerList.synchronize();
            }
        }, 1500)

        return vxg.api.cloud.getAllNotes(vxg.user.src.allCamsToken).then(ret => {
            var notesList = ret.objects;
            if (notesList.length > 0) {
                $('.nonotes').hide();
                var notesEle = '';
                notesList.forEach(note => {
                    let timestamp = new Date(note['timestamp']+'Z').getTime();
                    date = new Date(note['timestamp']+'Z');
                    date = date.toLocaleString('en-CA', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }).replace(/[,|.]/g,'').replace(' 24',' 00');
                    notesEle += '<div class="onetag" timestamp="'+timestamp+'">';
                    if (vxg.user.src.role!='user') notesEle += '<div class="edtag" meta="'+i+'"></div>';
                    notesEle += '<div class="datetime">'+date+'</div><div class="case">'+(note['string']['case']?note['string']['case']:'')+'</div><div class="desc">'+(note['string']['description']?note['string']['description']:'')+'</div></div>';
                })
                $('.monitoring-noteslist').html(notesEle);
                $('.monitoring-noteslist').show();
            }
            return self.loadCameras(filterarray, true)
        }, function(err) {
            console.log(err.responseText);
            return self.loadCameras(filterarray, true)
        });
    },
    playChannels: function(resolve) {
        if (this.camera_list_promise) return this.camera_list_promise;
        return this.camera_list_promise;
    },
    loadCameras: function(filterarray, firstsearch, loadedCams = "", forLocation = null){
        if (this.camera_list_promise) return this.camera_list_promise;

        let self = this;
        let el = this.wrapper.find('.camlist-monitoring');
		
        el.find('.wmore').remove();
        self.wrapper.addClass('loader');
        if (filterarray) {
            this.last_filterarray = filterarray;
            this.last_offset = 0;
        } else filterarray = this.last_filterarray;
        var cameraListCall = forLocation ? window.vxg.cameras.getCameraListPromise(500,0,forLocation,"isstorage",undefined) :  vxg.cameras.getFullCameraList(500,this.last_offset);
        cameraListCall.then(function(fullList) {
            //var gatewaysList = fullList.filter(cam => {return cam.src.meta && cam.src.meta.gateway});
            var cameras = fullList.filter(cam => {if (cam.src.meta) return cam.src.meta.gateway == undefined; else return cam;});
            var camNodes = {};
            var noNodes = {"noNode": []};
            cameras.forEach(cam => {
                if (cam.src.meta && cam.src.meta.location) {
                    var loc = cam.src.meta.location.replaceAll(" ", "_SP_").replaceAll(":", "_COL_");
                    if (loc in camNodes) 
                        camNodes[loc].push(cam);
                    else 
                        camNodes[loc] = [cam];
                } else {
                    noNodes['noNode'].push(cam);
                }
            });

            var allCamNodes = {...camNodes, ...noNodes};
    
            var camNodes_Ele = '';
            var count = 0;
            for (var nodeName in allCamNodes) { 
                if (nodeName != "noNode") {
                    camNodes_Ele += `<div class="node-dropdown draggable" draggable="true" id="node${count}" nodeName="${nodeName}"><span class="node-name">${nodeName.replaceAll("_SP_", " ").replaceAll("_COL_", ":")}</span></div>`;
                    allCamNodes[nodeName].forEach(cam => {
                        let captured = cam.src && cam.src.meta && cam.src.meta.capture_id && vxg.user.src.capture_id == cam.src.meta.capture_id ? ' captured' : '';
                        count++;
                        camNodes_Ele += `<div class="node-cam camerafield-block${captured} ${nodeName}-cam" id="cam${count}" access_token="${cam.camera_id}" channel_token="${cam.token}" style="display: none">
                                    <camfield field="name" onclick_toscreen="tagsview" access_token="${cam.camera_id}"></camfield>
                                    </div>`
                    });
                } else {
                    allCamNodes[nodeName].forEach(cam => {
                        let captured = cam.src && cam.src.meta && cam.src.meta.capture_id && vxg.user.src.capture_id == cam.src.meta.capture_id ? ' captured' : '';
                        count++;
                        camNodes_Ele += `<div class="camerafield-block${captured} parent-cam" id="cam${count}" access_token="${cam.camera_id}">
                                    <camfield field="name" onclick_toscreen="tagsview" access_token="${cam.camera_id}"></camfield>
                                    </div>`
                    });
                }
            }
            $("#cameras-list").html(camNodes_Ele);
            if ($('.hidecameras').hasClass('open')) $('#cameras-list').show();
            self.wrapper.removeClass('loader');

            $('.node-dropdown').on('click', function(){
                var nodeName = $(this).attr('nodeName');
                $("." + nodeName + "-cam").toggle();
            })

            $('.draggable, .camgrid2').on("dragstart", function(e) {
                e.originalEvent.dataTransfer.setData('text', e.currentTarget.id)         
            });

            $('.draggable, .camgrid2').on('drop dragdrop',function(event){
                var id = event.originalEvent.dataTransfer.getData('text');
                if (!id.includes('node')) return;
                var nodeName = $("#"+id).attr("nodeName");
                let pl = $(document.elementFromPoint(event.clientX, event.clientY)).parents('player');
                if (!pl.length) return;
                var gridNum = $(pl).parent().attr("playernumber");
                $('.node-cam.'+nodeName+'-cam').each(function(i, cam_el) {
                    var pl = $('[playernumber='+gridNum+']').find('player');
                    var channelToken = $(cam_el).attr("channel_token");
                    pl.attr('access_token',channelToken);
                    if (typeof pl[0].on_access_token_change === "function") pl[0].on_access_token_change(channelToken);
                    pl[0].play();
                    gridNum++;
                })
            });

            $('.draggable, .camgrid2').on('dragover',function(event){
                event.preventDefault();
                return false;
            })
            $('.draggable, .camgrid2').on('dragenter',function(event){
                event.preventDefault();
            })
            $('.draggable, .camgrid2').on('dragleave',function(event){
                event.preventDefault();
            })
        })

        return this.camera_list_promise;
    },
    selectCamForGroup: function(e) {
        var groupCamsList = $("#groupingCams").val();
        var channelId = $(this).attr("channelid");
        if (!groupCamsList || groupCamsList.indexOf(channelId) == -1) {
            groupCamsList += "," + channelId;
            $("#groupingCams").val(groupCamsList);
            $("#groupingButton").show();
        } else {
            // if channelId is in groupCamsList remove it,
            groupCamsList.replace("," + channelId, "");
            $("#groupingCams").val(groupCamsList);
            if (!groupCamsList) $("#groupingButton").hide();
        }
    },
    'on_hide':function(){
        core.elements['global-loader'].show();
        let p = this.wrapper.find('player');
        for (i=0; i<p.length; i++) p[i].stop();
        core.elements['global-loader'].hide();
    },
    'on_ready':function(){
        let self = this;

        this.wrapper.find('.camlist-monitoring')[0].addEventListener('scroll', function() {
            if (this.scrollHeight - this.scrollTop <= this.clientHeight+20)
                self.wrapper.find('.camlist-monitoring').addClass('nobloor');
            else
                self.wrapper.find('.camlist-monitoring').removeClass('nobloor');
        });
        var hash = window.location.hash;
        var queryStr = hash.replaceAll("%22", "").substring(hash.indexOf("=")+1);
        var isTelconet = queryStr.length > 0 ? true : false;

        camGrid(this.getState().grid, isTelconet);
        self.wrapper.addClass('grid');
        setTimeout(function(){onCameraScreenResize();},100);
        self.wrapper.find('.cambd').show();self.wrapper.find('.cammap').hide();
        
        var hash = window.location.hash;
        var telconetIdStr = hash.replaceAll("%22", "").substring(hash.indexOf("=")+1);
        if (telconetIdStr.length > 0) {
            var telconetIdArr = telconetIdStr.split(",");

            var gridType = 3;
            if (telconetIdArr.length <= 4) gridType = 2;
            if (telconetIdArr.length > 9) gridType = 4
            let state = self.getState(); state.grid=gridType; self.setState(state);
            var playerNumber = 1;
            return vxg.cameras.getCameraListPromise(telconetIdArr.length, 0, telconetIdStr, undefined, undefined).then((cameras) => {
                if (camera.length == 0) return;

                cameras.forEach(cam => {
                    var pl = $('[playernumber='+playerNumber+']').find('player');
                    if (!pl.length) return;
                    pl.attr('access_token',cam.token);
                    if (typeof pl[0].on_access_token_change === "function") pl[0].on_access_token_change(cam.token, true);
                    pl[0].play();
                    playerNumber++;
                })
                $('.hidecameras').trigger( "click" );
                $('.hidecameras').attr('disabled', true);
                $('.close-menu').trigger( "click" );

                return true;
            })
        }
    },
    setState: function(state){
        let newstate = localStorage['vxggrid'] ? JSON.parse(localStorage['vxggrid']) : [];
        if (newstate.cams!==undefined) newstate = [];
        newstate[vxg.user.src.uid] = state;
        localStorage['vxggrid'] = JSON.stringify(newstate);
    },
    getState: function(){
        let state = localStorage['vxggrid'] ? JSON.parse(localStorage['vxggrid']) : [];
        if (state.cams!==undefined) state = [];
        state = state[vxg.user.src.uid];
        if (!state || state.cams===undefined || state.grid===undefined) return {cams:{},grid:2};
        return state;
    },
    'on_init':function(){
        let self=this;

        $('.hidenotes').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if ($(this).hasClass('open')) {
                $(this).removeClass('open');
                $(this).addClass('closed');
                $(this).html('<i class="fa fa-angle-left" aria-hidden="true"></i>');
                $('.notes-list-cont').hide();
                //$('.noteslist').hide();
            } else {
                $(this).removeClass('closed');
                $(this).addClass('open');
                $(this).html('<i class="fa fa-angle-right" aria-hidden="true"></i>&nbsp;Hide Notes');
                $('.notes-list-cont').show();
                //$('.noteslist').show();
            }
        });

        $('.hidecameras').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if ($(this).hasClass('open')) {
                $(this).removeClass('open');
                $(this).addClass('closed');
                $(this).html('<i class="fa fa-angle-right" aria-hidden="true"></i>');
                $('#cameras-list').hide();
                $('.headerBlock').hide();

            } else {
                $(this).removeClass('closed');
                $(this).addClass('open');
                $(this).html('<i class="fa fa-angle-left" aria-hidden="true"></i>&nbsp;&nbsp;Hide Cameras');
                $('#cameras-list').show();
                $('.headerBlock').show();
            }
        })

        let gridStateArray = [];
        gridStateArray[2] = '2 x 2';
        gridStateArray[3] = '3 x 3';
        gridStateArray[4] = '4 x 4';

        let curState = self.getState();
        core.elements['header-right'].prepend(`
            <div class="transparent-button active addnote">
                <span class="add-icon">+</span><span data-i18n="monitoring.createNote">${$.t('monitoring.createNote')}</span>
            </div>
            <div tabindex="0" class="gridmenu hide transparent-button">
                <span>${gridStateArray[curState.grid]}</span><i class="fa fa-angle-down" aria-hidden="true"></i>
                <ul class="menu-dropdown gridmenu-dropdown">
                    <li class="cam-dropdown-item grid22"><a href="javascript:;">2 x 2</a></li>
                    <li class="cam-dropdown-item grid33"><a href="javascript:;">3 x 3</a></li>
                    <li class="cam-dropdown-item grid44"><a href="javascript:;">4 x 4</a></li>
                </ul>
            </div>`);
        
        var notesMode = sessionStorage.notesMode;
        if (notesMode) {
            if (notesMode == "disabled") $(".addnote").addClass("disabled");
        } else {
            try {
                var inc = new Date().getTime() / 1000;
                self.camera.createClip(inc - 10000, inc + 10000, "testingClip").then(function(clip){
                    clip.setMeta("testingMeta", "", "", inc).then(function(readyclip){
                        console.log("meta is working, delete clip and camera just made");
                        sessionStorage.setItem("notesMode", "enabled");
                    },function(){
                        sessionStorage.setItem("notesMode", "disabled");
                        $(".addnote").addClass("disabled");
                    });
                    vxg.api.cloud.deleteClipV2(clip.token, clip.src.id).then(function(r){ /* testing clip deleted */}, function(err) {console.log(err)})
                },function(){
                    console.log("Test clip isn't working, something bad has happened");
                });
            } catch(err) {
                console.log(err);
            }
        }

        $('.grid-player').removeAttr('playerNumber');
        var playerCount = 1;
        $('.grid-player').each(function(i, el) {
            if ($(el).children().length > 0) {
                $(el).attr('playerNumber', playerCount);
                playerCount++;
            }
        })

        core.elements['header-right'].find('.grid22').click(function(){
            $('.grid-player').removeAttr('playerNumber');
            var playerCount = 1;
            $('.grid2').each(function(i, el) {
                $(el).attr('playerNumber', playerCount);
                playerCount++;
            })
            
            if ($('.hidecameras').hasClass('open')) $('#cameras-list').show();
            let state = self.getState(); state.grid=2; self.setState(state);
            if (state.list && self.playerList) {
                state.list = false; self.setState(state)
                //location.reload();
            } else {
                self.wrapper.find('.cambd').show();self.wrapper.find('.cammap').hide();
                camGrid(2);
                core.elements['header-right'].find('.gridmenu span').text($(this).text());
            }
        });
        core.elements['header-right'].find('.grid33').click(function(){
            $('.grid-player').removeAttr('playerNumber');
            var playerCount = 1;
            $('.grid-player').each(function(i, el) {
                if ($(el).hasClass('grid2') || $(el).hasClass('grid3')) {
                    $(el).attr('playerNumber', playerCount);
                    playerCount++;
                }
            })

            if ($('.hidecameras').hasClass('open')) $('#cameras-list').show();
            let state = self.getState(); state.grid=3; self.setState(state);
            if (state.list && self.playerList) {
                state.list = false; self.setState(state)
                //location.reload();
            } else {
                self.wrapper.find('.cambd').show();self.wrapper.find('.cammap').hide();
                camGrid(3);
                core.elements['header-right'].find('.gridmenu span').text($(this).text());
            }
        });
        core.elements['header-right'].find('.grid44').click(function(){
            if (self.getState().grid == 1) location.reload();

            $('.grid-player').removeAttr('playerNumber');
            var playerCount = 1;
            $('.grid-player').each(function(i, el) {
                $(el).attr('playerNumber', playerCount);
                playerCount++;
            })

            if ($('.hidecameras').hasClass('open')) $('#cameras-list').show();
            let state = self.getState(); state.grid=4; self.setState(state);
            if (state.list && self.playerList) {
                state.list = false; self.setState(state)
               // location.reload();
            } else {
                self.wrapper.find('.cambd').show();self.wrapper.find('.cammap').hide();
                camGrid(4);
                core.elements['header-right'].find('.gridmenu span').text($(this).text());
            }
        });

        $(".addnote").click(function() {
            dialogs['mdialog'].activate(`
            <h7 data-i18n="monitoring.createNote">${$.t('monitoring.createNote')}</h7>
            <span class="error-text" style="display:none"></span>
            <div class="note-input-cont">
                <table border=0>
                    <tr><td class="time-label" data-i18n="monitoring.inctime">${$.t('monitoring.inctime')}:</td><td class="inctime"><input type="datetime-local" name="inctime"></input></td></tr>
                    <tr><td class="title-label" data-i18n="monitoring.case">${$.t('monitoring.case')}:</td><td></td></tr>
                    <tr><td colspan=2 class="case"><input class="tagcase" type="text" name="case"/></td></tr>
                </table>
                <textarea class="tagdesc" name="desc" rows="5"></textarea>
            </div>
            <button name="apply" class="vxgbutton-transparent savetag" data-i18n="monitoring.savebtn">${$.t('monitoring.savebtn')}</button></div>  
        `).then(function(r) {
                if (!r || r.button!='apply') return;
                if (!r.form.inctime || !r.form.case || !r.form.desc) {
                    $(".error-text").text($.t('monitoring.errorText.missingfield'));
                } else {
                    core.elements['global-loader'].show();
                    let date = new Date(r.form.inctime).toISOString().replace('Z','');
                    let req = {"timestamp": date, "long": {"usermeta": 1},"string": {"type":"note", "case":r.form.case, "description": r.form.desc}};

                    var firstGridCamToken = null;
                    var gridcameras = $('[playernumber]');
                    for (var i = 0; i < gridcameras.length; i++) {
                        var token = $(gridcameras[i]).find('player').attr('access_token');
                        if (token) {
                            firstGridCamToken = token;
                            break;
                        }
                    }

                    if (!firstGridCamToken) {
                        core.elements['global-loader'].hide();
                        alert($.t('monitoring.errorText.nogridcams'));
                        return;
                    }

                    core.elements['global-loader'].show();

                    vxg.api.cloud.saveUserMeta(firstGridCamToken, [req]).then(function(){
                        core.elements['global-loader'].hide();
                        location.reload();
                        return;
                    },function(err){
                        core.elements['global-loader'].hide();
                        console.log(err.responseText);
                        alert($.t('monitoring.errorText.saveerror'));
                    });
                }

            })
        })

        $( window ).resize(onCameraScreenResize);

        return defaultPromise();
    }
};

function toggleAllLoc() {
    var ele = document.getElementById("locctrl");
    if (ele.checked) $(".locationCheckbox").prop("checked", true);
    else $(".locationCheckbox").prop("checked", false);
}
