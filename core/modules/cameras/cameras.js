window.screens = window.screens || {};
var path = window.core.getPath('cameras.js');

function camGrid(size /* 2,3,4 */){
    let el = $('.screens .cameras .camgrid2')
    el.removeClass('grid3').removeClass('grid4');
    if (size==3) el.addClass('grid3');
    if (size==4) el.addClass('grid4');
    let td = $('.screens .cameras .camgrid2 > div');
    let state = window.screens['cameras'].getState();
    if (!window.screens['cameras'].playerList) {
        try {
            window.screens['cameras'].playerList = new CloudPlayerList("single-timeline", {timeline: true, calendar: true});
        } catch(e) {
            window.screens['cameras'].playerList = null;
        }
    }
    var preferredPlayerFormat = (window.skin.grid && window.skin.grid.preferredPlayerFormat)?(' preferredPlayerFormat="' + window.skin.grid.preferredPlayerFormat + '" ' ):('') ;
    
    for (let i=0; i<td.length; i++){
        let access_token = state.cams['player'+i] ? ' access_token="'+state.cams['player'+i]+'"' : '';
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

    let p = $('.screens .cameras .camgrid2 player').off('dblclick').on('dblclick',function(){
        if (!$(this).attr('access_token')) return;
        let the = this;
        dialogs['mdialog'].activate('<p>Do you want to remove this camera from the grid?</p><p><button name="cancel" class="vxgbutton">No</button>&nbsp;&nbsp;&nbsp;&nbsp;<button name="delete" class="vxgbutton">Yes</button></p>').then(function(r){
            if (r.button!='delete') return;
            $(the).attr('access_token','');
            $(the)[0].on_access_token_change('');
            let id = $(the).attr('id');
            let state = window.screens['cameras'].getState();
            state.cams = state.cams || {};
            delete state.cams[id];
            window.screens['cameras'].setState(state);
        });

    });
    $('.screens .cameras .camgrid2 player').each(function(){
        this.on_access_token_change = function(){
            let access_token = $(this).attr('access_token');
            let id = $(this).attr('id');
            let state = window.screens['cameras'].getState();
            state.cams = state.cams || {};
            state.cams[id]=access_token;
            window.screens['cameras'].setState(state);

            if (window.screens['cameras'].playerList) {
                let cloudPlayerId = this.newid;
                var cloudPlayerObj = window.controls['player'].players['player'+cloudPlayerId];
                if (access_token == '') {
                    window.screens['cameras'].playerList.removePlayerFromList(cloudPlayerObj)
                }
                window.screens['cameras'].playerList.killSyncPromise(true).then(() => {
                    setTimeout(() => {
                        window.screens['cameras'].playerList.killSyncPromise(false).then(() => {
                            window.screens['cameras'].playerList.synchronize([], true)
                        })
                    }, 1500);
                })
            }           
        };        
    });
    onCameraScreenResize();
}

(function( $ ){

  $.fn.simpleMenuPlugin = function(e) {

    //this.click(function(e){
        var self = this;
        let access_token = $(this).attr("access_token");
        let channelID = $(this).attr("cam_id");

        var menu =  $(`
        <div class="simplemenu">
        <div class="listmenu-item mcamera" onclick_toscreen="tagsview" channelID='${channelID}'><i class="fa fa-video-camera" aria-hidden="true"></i> <span class="listitem-name"> Timeline </span> </div>
        <div class="listmenu-item msetting" ifscreen="camerasettings" onclick_toscreen="camerasettings"><i class="fa fa-cog" aria-hidden="true"></i> <span class="listitem-name"> Stream Settings </span></div>
        <div class="listmenu-item mchart" ifscreen="camerameta" onclick_toscreen="camerameta"><i class="fa fa-bar-chart" aria-hidden="true"></i> <span class="listitem-name"> Metadata </span></div>
        <a class="listmenu-item mwebui" id="ui-link" href="" target="_blank" style="display: none"><i class="fa fa-window-restore" aria-hidden="true"></i> <span class="listitem-name"> Camera UI </span></a>
        <div class="listmenu-item mconfigure" ifscreen="addcamera" onclick_toscreen="addcamera"><i class="fa fa-wrench" aria-hidden="true"></i> <span class="listitem-name"> Config </span></div>
        <div class="listmenu-item mtrash" onclick="onCameraDelete('${channelID}')"><i class="fa fa-trash-o" aria-hidden="true"></i> <span class="listitem-name"> Remove </span></div>
        </div>`);
        
        var cameraUrlsStr = sessionStorage.getItem("cameraUrls");
        var cameraUrls = cameraUrlsStr ? JSON.parse(cameraUrlsStr) : [];
        var savedCam = cameraUrls.length != 0 ? cameraUrls.find(x => x.id == channelID) : "";

        if (savedCam && savedCam.url && savedCam.url != "nourl") {
            $(menu).find("#ui-link").attr("href", savedCam.url);
            $(menu).find(".mwebui").css("display", "block");
        }

        if (!savedCam) {
            vxg.api.cloud.getCameraConfig(channelID, access_token).then(function(config) {
                var link;
                if (config.url && config.url.includes("onvif")) {
                    var s = config.url.replace("onvif://", "");
                    link = s.replace("/onvif/device_service", "");
                    
                    cameraUrls.push({id: config.id, url: 'http://' + link});
                    sessionStorage.setItem("cameraUrls", JSON.stringify(cameraUrls));

                    $(menu).find("#ui-link").attr("href", link);
                    $(menu).find(".mwebui").css("display", "block");
                    addSimpleMenu(menu, self, e);
                } else if (config.url && config.url.includes('/uplink_camera/')) {
                    core.elements['global-loader'].show();
                    return vxg.api.cloud.getUplinkUrl(config.id, config.url).then(function(urlinfo) {
                        if (!urlinfo.id && !urlinfo.url) {
                            cameraUrls.push({id: config.id, url: "nourl"});
                            sessionStorage.setItem("cameraUrls", JSON.stringify(cameraUrls));
                        } else {
                            cameraUrls.push({id: urlinfo.id, url: urlinfo.url});
                            sessionStorage.setItem("cameraUrls", JSON.stringify(cameraUrls));  
                            $(menu).find("#ui-link").attr("href", urlinfo.url);
                            $(menu).find(".mwebui").css("display", "block");
                        }
                        core.elements['global-loader'].hide();
                        addSimpleMenu(menu, self, e);
                    });
                } else {
                    cameraUrls.push({id: config.id, url: "nourl"});
                    sessionStorage.setItem("cameraUrls", JSON.stringify(cameraUrls));

                    addSimpleMenu(menu, self, e);
                }
            });
        } else {
            addSimpleMenu(menu, self, e);
        }
    //});
  };
})( jQuery );

function addSimpleMenu(_menu, settingsEle, e) {
    var menu = _menu.html();
    $('.simplemenu').remove();
    let self = settingsEle;
    let el = $(settingsEle).find('.simplemenu');
    if (!el.length) {
        $(settingsEle).append('<div class="simplemenu"> ' + menu + '</div>');
        el = $(settingsEle).find('.simplemenu');
    }
    el.mouseleave(function(){
        self.remove_timer = setTimeout(function(){
            el.remove();
        },300);
    });
    el.mouseenter(function(){
        if (self.remove_timer) clearTimeout(self.remove_timer);
        delete self.remove_timer;
    });
    let w = el.width();
    let h = el.height();
    let ww = $(window).width();
    let hh = $(window).height();

    if (e.clientX+w<=ww)
        el.css('left',e.clientX-10);
    else
        el.css('right',ww-e.clientX-10);
    if (e.clientY+h<=hh)
        el.css('top',e.clientY-10);
    else
        el.css('bottom',hh-e.clientY-10);
}

function onEventsSet(e){
    let t = $(e).getNearParentAtribute('access_token');
    setTimeout(function(){$('.simplemenu').remove();},10);
    core.elements['global-loader'].show();
    vxg.cameras.getCameraByIDPromise(t).then(function(camera){
        return camera.getEventTypes().then(function(r){
            core.elements['global-loader'].hide();
            let event_types = r.event_types?r.event_types:[];
            let types = {'motion':'Motion','post_object_and_scene_detection':'Scene detection'};
            let text='';
            for (let i in types)
                text += (text?'<br/>':'') + '<label><input class="svgbtnbefore" type="checkbox" name="'+i+'" '+(event_types.indexOf(i)!=-1?'checked':'')+'><span>'+types[i]+'</span></label>';
            dialogs['mdialog'].activate('<h7>Select event types</h7><p></p>'+text+'<br/><p><br/><button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;<button name="set" class="vxgbutton">Set</button></p>').then(function(r){
                if (r.button!='set') return;
                core.elements['global-loader'].show();
                let data = [];
                for (let i in r.form) if (r.form[i]=='on') data.push(i);
                camera.setEventTypes(data).finally(function(r){
                    core.elements['global-loader'].hide();
                });
            });
        });
    }).catch(function(){
        core.elements['global-loader'].hide();
    });;
}

function onCameraDelete(channel_id){
    setTimeout(function(){$('.simplemenu').remove();},10);

    vxg.cameras.getCameraByIDPromise(channel_id).then(function(camera){

        dialogs['mdialog'].activate('<h7>Do you want to delete camera '+camera.src.name+'?</h7><p>It can\'t be cancelled </p><p><button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;<button name="delete" class="vxgbutton">Delete</button></p>').then(function(r){
            if (r.button!='delete') return;
            core.elements['global-loader'].show();
            var oldsubid = camera.src.meta ? camera.src.meta.subid : -1;
            if (camera) camera.deleteCameraPromise().then(function(){
                var planIndex = vxg.user.src.plans.findIndex(p => p.id == oldsubid);
                if (planIndex > -1) vxg.user.src.plans[planIndex].used--;
                
                var aiCams_string = sessionStorage.getItem("aiCams");
                if (aiCams_string) {
                    var aiCams_array = aiCams_string.split(",").filter(e => e);
                    if (aiCams_array.includes(camera.camera_id.toString())) {
                        var newAiCams = aiCams_string.replace("," + camera.camera_id, "");
                        sessionStorage.setItem("aiCams", newAiCams); 
                    }
                }

                var cameraList = localStorage.cameraList ? JSON.parse(localStorage.cameraList) : null;
                if (cameraList) {
                    cameraList.objects = cameraList.objects.filter(c => c.id != camera.camera_id);
                    var total = parseInt(cameraList.meta.total_count);
                    cameraList.meta.total_count = total - 1;
                    localStorage.cameraList = JSON.stringify(cameraList);
                }


                localStorage.removeItem(camera.camera_id);
                var backToCam = sessionStorage.getItem("backToCam");
                if (backToCam == camera.camera_id) sessionStorage.removeItem("backToCam");
                var cameraUrlsStr = sessionStorage.getItem("cameraUrls");
                var cameraUrls = cameraUrlsStr ? JSON.parse(cameraUrlsStr) : "";
                if (cameraUrls) {
                    var removeCurrent = cameraUrls.filter(cam => cam.id != camera.camera_id);
                    sessionStorage.setItem("cameraUrls", JSON.stringify(removeCurrent));
                }

                core.elements['global-loader'].hide();
                return screens['cameras'].on_show();
            }, function(r){
                core.elements['global-loader'].hide();
                let err_text = 'Failed to delete camera';
                if (r && r.responseJSON && r.responseJSON.errorDetail) err_text = r.responseJSON.errorDetail;
                dialogs['mdialog'].activate('<h7>Error</h7><p>'+err_text+'</p><p><button name="cancel" class="vxgbutton">Ok</button></p>');
            });

        });
    })

}

function onCameraScreenResize(){
    let el = $('.screens .cameras');
    let w = el.width();
    let h = el.height();
    if (w/7*5<h)
        $('.screens .cameras').addClass('gridtop');
    else
        $('.screens .cameras').removeClass('gridtop');
}


				  function buttons () {
    return {
      btnUsersAdd: {
        text: 'Highlight Users',
        icon: 'bi-arrow-clockwise',
        event: function () {
          alert('Do some stuff to e.g. search all users which has logged in the last week')
        },
        attributes: {
          title: 'Search all users which has logged in the last week'
        }
      },
    }
  }



  $(function() {
  })

window.screens['cameras'] = {
    'menu_weight':30,
    'menu_name':'Cameras',
    'get_args':function(){
    },
//  TODO:
//    'menu_toggle':true,
//    'menu_disabled':true,
    'menu_icon': '<i class="fa fa-video-camera" aria-hidden="true"></i>',
    'html': path+'cameras.html',
    'css':[path+'cameras.css'],
    'js':[path.substr(0,path.length-16)+'webcontrols/camera_map.js'],
    'stablecss':[path+'scameras.css'],
    'playerList': null,
    'on_search':function(text){
        if (!text)
            delete this.search_text;
        else
            this.search_text = text;
        window.screens['cameras'].activate();
    },
    'on_show':function(filterarray){
        setTimeout(function(){onCameraScreenResize();},100);

        if (core.elements['header-search']) core.elements['header-search'].find('input').val(this.search_text ? this.search_text : '');
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
            if ($(p[i]).attr('access_token')) {
                p[i].play();
            }
        }

        setTimeout(() => {
            if (self.playerList && self.playerList.getPlayerList()) {
                self.playerList.synchronize();
            }
        }, 1500)

        return this.loadCameras(filterarray, true)
    },
    playChannels: function(resolve) {
        if (this.camera_list_promise) return this.camera_list_promise;
        return this.camera_list_promise;
    },
    loadCameras: function(filterarray, firstsearch, loadedCams = ""){
        if (this.camera_list_promise) return this.camera_list_promise;

        let self = this;
        let el = this.wrapper.find('.camlist');
		
        el.find('.wmore').remove();
        self.wrapper.addClass('loader');
        if (filterarray) {
            this.last_filterarray = filterarray;
            this.last_offset = 0;
        } else filterarray = this.last_filterarray;
        
        this.camera_list_promise = vxg.cameras.getFullCameraList(500,this.last_offset).then(function(list){
            self.camera_list_promise=undefined;
            let h = loadedCams == "" ? "" : loadedCams;
            self.last_offset += list.length;
            let count = 1;
            var channelIdList = []; 
            var camGroups = sessionStorage.getItem("camGroups") ? JSON.parse(sessionStorage.getItem("camGroups")) : [];

            var tableData = [];
            for (let i in list){
                if (list[i].src.name.substr(0,11)=="#StorageFor" && !isNaN(parseInt(list[i].src.name.substr(11)))) continue;
                if (list[i].src && list[i].src.meta && list[i].src.meta.isstorage) continue;
                if (!list[i].src || list[i].src.status===undefined) continue;
                let captured = list[i].src && list[i].src.meta && list[i].src.meta.capture_id && vxg.user.src.capture_id == list[i].src.meta.capture_id ? ' captured' : '';
                let statusBlock = '<div class="caminfo tablecaminfo '+list[i].src.status+' '+(list[i].src.status=='active'?' online':'')+'">'+ (list[i].src.status=='active'?'Online':'Offline')+'</div>';
                var channelID = list[i].getChannelID();
                channelIdList.push(channelID.toString());
                var camGroup = "";
                camGroups.forEach(group => {
                    if (group.cams.indexOf(channelID.toString()) != -1) {
                        camGroup = group.name;
                    }
                });

                tableData.push({
                    camId: channelID,
                    order: count,
                    state: `<label class="filter-label custom-checkbox" style="margin-left: 25%;">
                    <input type="checkbox" class="groupCamCheck" cam_name="${list[i].src.name}" cam_id="${channelID}" cam_order="${count}">
                    <span class="checkmark"></span>	
                </label>`,
                    id: `<div class="camerablock${captured}" access_token="${channelID}" id="scrollto${channelID}">
                    <campreview onclick_toscreen="tagsview"></campreview>`,
                    status: statusBlock,
                    recording: list[i].src.recording?'yes':'no',
                    name: list[i].src.name,
                    location: list[i].getLocation(),
                    group: list[i].getGroup(),
                    action: `<div class="settings" access_token="${list[i].token}" cam_id="${channelID}">
                    <svg class="inline-svg-icon icon-action"><use xlink:href="#action"></use></svg>
                </div>`
                })

                count++;
            }

            if ($('#table').children().length == 0) {
                var columns = [
                    {
                        field: "order",
                        sortable: true,
                        cardVisible: false
                    },
                    {
                        field: "state",
                        cardVisible: false
                    },
                    {
                        field: "id",
                        width: "140",
                        title: "Camera",
                    },
                    {
                        field: "status",
                        title: "Status",
                        filterControl: "select",
                        sortable: true,
                        cardVisible: false
                    },
                    {
                        field: "recording",
                        title: "Recording",
                        filterControl: "select",
                        sortable: true,
                        cardVisible: false
                    },
                    {
                        field: "name",
                        title: "Name",
                        filterControl: "input",
                        sortable: true,
                    },
                    {
                        field: "location",
                        title: "Location",
                        filterControl: "select",
                        sortable: true,
                        cardVisible: false
                    },
                    {
                        field: "group",
                        title: "Group",
                        filterControl: "select",
                        sortable: true,
                        cardVisible: false
                    },
                    {
                        field: "action",
                        title: "Action"
                    },
                ]
                $('#table').bootstrapTable({
                    pagination: true,
                    showToggle: true, 
                    showSearchClearButton: true,
                    useRowAttrFunc: true,
                    filterControl: true,
                    reorderableRows: true,
                    toolbar: ".toolbar",
                    uniqueId: "order",
                    columns: columns,
                    onColumnSearch: function (arg1, arg2) {
                    if (arg1 == 'status')
                        localStorage.camera_status = arg2;
                    if (arg1 == 'recording')
                        localStorage.camera_recording = arg2;
                    if (arg1 == 'location')
                        localStorage.camera_location = arg2;
                    if (arg1 == 'group')
                        localStorage.camera_group = arg2;
                    }
                });

                $(document).on('click', '#groupingButton', function(event){
                    event.preventDefault();
                    var camIdList = [];
                    var camNameList = "";
                    var camOrder= [];
                    $(".groupCamCheck").each(function(i, ele) {
                        if ($(ele).hasClass("checked")) {
                            camOrder.push($(ele).attr("cam_order"));
                            camIdList.push($(ele).attr("cam_id"));
                            camNameList += camNameList == "" ? $(ele).attr("cam_name") : ", " + $(ele).attr("cam_name");
                        }
                    })
    
                    if (camIdList.length == 0) {
                        alert("Please select at least one camera from the list to group.");
                        return;
                    }
    
                    //var groupsList = sessionStorage.getItem("camGroups") ? JSON.parse(sessionStorage.getItem("camGroups")) : [];
                    vxg.cameras.getGroupsList().then(function(groupsList) {
                        var groupItems = "";
                        groupsList.forEach(group => {
                            let item = `
                            <li>    
                                <label class="filter-label custom-checkbox">
                                    <span>${group}</span>
                                    <input class="groupCheck" type="radio" name="groupRadio" value="${group}">
                                    <span class="checkmark"></span>	
                                </label>
                            </li>`
                            groupItems += item;
                        })
                        
                        dialogs['mdialog'].activate(`
                            <h7>Select group</h7>
                            <div>
                                <p>${camNameList}</p>
                                <ul class="groupslist">						
                                <li>    
                                    <label class="filter-label custom-checkbox">
                                        <span> Remove From Group</span>
                                        <input class="groupCheck" type="radio" name="groupRadio" value="noGroup">
                                        <span class="checkmark"></span>	
                                    </label>
                                </li>
                                ${groupItems}
                                <li style="display:flex;">    
                                    <label class="filter-label custom-checkbox" >
                                        <input class="form-check-input" type="radio" name="groupRadio">
                                        <span class="checkmark"></span>
                                        <input class="" type="text" name="newGroupName" id="newGroupName">            
                                    </label>
                                </li>  
                                </ul>  
                                <button name="apply" class="vxgbutton-transparent" style="width:192px">Set</button>
                            </div>`).then(function(r){
                                if (r.button!='apply') return;
                                var groupName = r.form.newGroupName != '' ? r.form.newGroupName : $('input[name=groupRadio]:checked').val() == "noGroup" ? "" : $('input[name=groupRadio]:checked').val();
                                let currentGroupInfo;
    
                                let promiseChain = Promise.resolve();
                                for (let i = 0; i < camIdList.length; i++) { 
                                    currentGroupInfo = camIdList[i];
    
                                    const makeNextPromise = (currentGroupInfo) => () => {
                                        return vxg.api.cloudone.camera.setGroup(currentGroupInfo, groupName)
                                            .then((r) => {
                                                return true;
                                            });
                                    }
                                    promiseChain = promiseChain.then(makeNextPromise(currentGroupInfo))
                                }
    
                                camOrder.forEach(i => {
                                    $('#table').bootstrapTable('updateByUniqueId', {id: i, row: {group: groupName}})
                                })
                        });	
                    })			
                    })
	                
                $(document).on('click', '.groupCamCheck', function(event){
                    $(this).toggleClass("checked");
                });

                
                $(document).on('click', '.settings', function(event){
                    $(this).simpleMenuPlugin(event)
                });

                $(document).on('mouseup', '[name="toggle"]', function(event) {
                    setTimeout(function () {
                        if (localStorage.camera_status != null) 
                            $('.bootstrap-table-filter-control-status').val(localStorage.camera_status);
                        if (localStorage.camera_recording != null) 
                            $('.bootstrap-table-filter-control-recording').val(localStorage.camera_recording);
                        if (localStorage.camera_location != null) 
                            $('.bootstrap-table-filter-control-location').val(localStorage.camera_location);
                        if (localStorage.camera_group != null) 
                            $('.bootstrap-table-filter-control-group').val(localStorage.camera_group);
                    }, 300);
                });
            }

            $('#table').bootstrapTable('load', tableData);

            // this is assuming table ordering has already been completed
            var pageSize = $('#table').bootstrapTable('getOptions').pageSize;
            var loadPrevCam = sessionStorage.getItem("backToCam");
            var camRow = loadPrevCam ? tableData.find(d => d.camId == loadPrevCam) : "";
            var camPage = 1;
            if (camRow) {
                var camIndex = camRow.order - 1;
                camPage = Math.ceil(camIndex / pageSize);
                if (camPage > 1) {
                    setTimeout(function() {
                        // not the best solution, but unsure why it keeps going to page 1 by default
                        $('#table').bootstrapTable('selectPage', camPage);
                        sessionStorage.removeItem('backToCam');
                    }, 500);
                }
            }

            $('#table').removeClass("table-bordered");

            for (let i in list){
                let cid = list[i].getChannelID();
                list[i].getName().then(function(name){
                    self.wrapper.find('.name'+cid).text(name);
                });
            }

            self.wrapper.removeClass('loader');

        },function(){
            self.camera_list_promise=undefined;
            self.wrapper.addClass('nocameras');
            el.html('Failed to load list of cameras');
            self.wrapper.removeClass('loader');
        });

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

        this.wrapper.find('.camlist')[0].addEventListener('scroll', function() {
            if (this.scrollHeight - this.scrollTop <= this.clientHeight+20)
                self.wrapper.find('.camlist').addClass('nobloor');
            else
                self.wrapper.find('.camlist').removeClass('nobloor');
        });
       
        if (this.getState().grid>0){
            camGrid(this.getState().grid);
            self.wrapper.addClass('grid');
            setTimeout(function(){onCameraScreenResize();},100);
            self.wrapper.find('.cambd').show();self.wrapper.find('.cammap').hide();
        }
        if (this.getState().grid==0){
            self.wrapper.find('.cambd').show();self.wrapper.find('.cammap').hide();
        }
        if (this.getState().grid<0){
            self.wrapper.find('.cambd').hide();self.wrapper.find('.cammap').show();
        }

        core.elements['header-right'].prepend('<div class="camerafilterContainer"><div class="transparent-button camerafilter"><span id="filterbtn">Filter</span></div></div>');
        core.elements['header-right'].find('.camerafilterContainer').append(
            `<div class="locationContainer" style="display:none;">
                <div class="locHeader">Select Locations</div>
                <div class="locList">
                    <label class="filter-label custom-checkbox" id="locctrl">
                        <span>Select/deselect all</span>
                        <input type="checkbox">
                        <span class="checkmark"></span>	
                    </label>
                    <ul>
                        <li class="no-locations">No locations</li>
                    </ul>
                </div>
                <div class="locFooter">
                    <button id="setLocations" class="vxgbutton">Set</button>
                </div>
            </div>`);
        core.elements['header-right'].find('.camerafilterContainer').on('mouseleave', function (){
            $(this).find('.locationContainer').hide();
        });

        self.fillLocations()

        core.elements['header-right'].find('.camerafilter').click(function(e){
            core.elements['global-loader'].show();
            self.fillLocations().then(function(locs){
                core.elements['global-loader'].hide();
                dialogs['mdialog'].activate(`
                    <h7>Select locations</h7>
                    <div>
                        ${locs.html}
                        <button name="apply" class="vxgbutton-transparent" style="width:192px">Set</button>
                    </div>`).then(function(r){
                if (r.button!='apply') return;
                    let filterarray = [];
                    for (let i in r.form){
                        if (i=='nolocation') filterarray.push('');
                        else filterarray.push(i);
                    }

                    if (filterarray.length == locs.count) {
                        $("#filterbtn").removeClass("filterset");
                    } else {
                        $("#filterbtn").addClass("filterset");
                    }

                    if(filterarray.length==0)
                        filterarray.push('###########');

                    var filterKey = "filter-" + vxg.user.src.email;
                    localStorage.setItem(filterKey, JSON.stringify(filterarray));

                    window.screens['cameras'].activate(filterarray);
                });
            },function(){
                core.elements['global-loader'].hide();
            });
        });
    },
    fillLocations: function(){
        let self = this;
        var userFilters = localStorage.getItem("filter-" + vxg.user.src.email);
        let savedLocations = userFilters ? JSON.parse(userFilters) : [];

        return vxg.cameras.getLocations(50,0).then(function(locations){
            self.all_locations = locations;
            let ret='';
            let counter = 0;
            let checkedCount = 0;
            $.each(locations, function (name, hash) {
                let locationShowName = name ? name :'No location';
                let checked = (savedLocations.includes(hash) || savedLocations.length == 0)? 'checked': '';
                if (checked) checkedCount++;
                let item = `
                <li>    
                    <label class="filter-label custom-checkbox">
                        <span>${locationShowName}</span>
                        <input class="locationCheckbox" type="checkbox" ${checked} name="${(hash?hash:'nolocation')}">
                        <span class="checkmark"></span>	
                    </label>
                </li>
                `;
                ret+=item;
                counter++;
            });
            let filterset = checkedCount == counter ? "" : "filterset";
            $("#filterbtn").addClass(filterset);

            var htmlret = `
            <label class="filter-label custom-checkbox allloc">
                <span>Select/deselect all</span>
                <input type="checkbox" id="locctrl" ${(!filterset ? "checked" : "")} onchange="toggleAllLoc()">
                <span class="checkmark"></span>	
            </label>
            <ul class="locationlist">${ret}</ul>`

//            ret+='<li class="no-locations"><input type="checkbox" name="nolocation" class="svgbtnbefore"><span>No location</span></label></li>';
            return new Promise(function(resolve, reject){setTimeout(function(){resolve({html:htmlret,count:counter});}, 0);});
      });
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
        if (!state || state.cams===undefined || state.grid===undefined) return {cams:{},grid:0};
        return state;
    },
    'on_init':function(){
        let self=this;
        let statesArray = [];
        statesArray[0] = '&nbspList&nbsp';
        statesArray[2] = '2&nbspx&nbsp2';
        statesArray[3] = '3&nbspx&nbsp3';
        statesArray[4] = '4&nbspx&nbsp4';
        statesArray[-1] = 'Map';

        let curState = self.getState();
        core.elements['header-right'].prepend('<div tabindex="0" class="gridmenu hide transparent-button"><span>'+statesArray[curState.grid]+'</span><i class="fa fa-angle-down" aria-hidden="true"></i>' +
            '    <ul class="menu-dropdown">' +
            '        <li class="nogrid"><a href="javascript:;">&nbspList&nbsp</a></li>' +
            '        <li class="grid22"><a href="javascript:;">2&nbspx&nbsp2</a></li>' +
            '        <li class="grid33"><a href="javascript:;">3&nbspx&nbsp3</a></li>' +
            '        <li class="grid44"><a href="javascript:;">4&nbspx&nbsp4</a></li>' +
            '        <li class="gridmap"><a href="javascript:;">Map</a></li>' +
            '    </ul>' +
            '</div><div class="transparent-button active addcamera" ifscreen="newcamera" onclick_toscreen="newcamera"><span class="add-icon">+</span><span>Add camera</span></div>');

        core.elements['header-right'].find('.nogrid').click(function(){
            self.wrapper.removeClass('grid');
            self.wrapper.find('.cambd').show();self.wrapper.find('.cammap').hide();
            let state = self.getState(); state.grid=0; state.list=true; self.setState(state);
            camGrid(0);
            core.elements['header-right'].find('.gridmenu span').text($(this).text());
        });
        core.elements['header-right'].find('.grid22').click(function(){
            let state = self.getState(); state.grid=2; self.setState(state);
            if (state.list && self.playerList) {
                state.list = false; self.setState(state)
                location.reload();
            } else {
                self.wrapper.addClass('grid');
                self.wrapper.find('.cambd').show();self.wrapper.find('.cammap').hide();
                camGrid(2);
                core.elements['header-right'].find('.gridmenu span').text($(this).text());
            }
        });
        core.elements['header-right'].find('.grid33').click(function(){
            let state = self.getState(); state.grid=3; self.setState(state);
            if (state.list && self.playerList) {
                state.list = false; self.setState(state)
                location.reload();
            } else {
                self.wrapper.addClass('grid');
                self.wrapper.find('.cambd').show();self.wrapper.find('.cammap').hide();
                camGrid(3);
                core.elements['header-right'].find('.gridmenu span').text($(this).text());
            }
        });
        core.elements['header-right'].find('.grid44').click(function(){
            let state = self.getState(); state.grid=4; self.setState(state);
            if (state.list && self.playerList) {
                state.list = false; self.setState(state)
                location.reload();
            } else {
                self.wrapper.addClass('grid');
                self.wrapper.find('.cambd').show();self.wrapper.find('.cammap').hide();
                camGrid(4);
                core.elements['header-right'].find('.gridmenu span').text($(this).text());
            }
        });
        core.elements['header-right'].find('.gridmap').click(function(){
            camGrid(0);
            self.wrapper.find('.cambd').hide();self.wrapper.find('.cammap').show();
            self.wrapper.addClass('grid');
            let state = self.getState(); state.grid=-1; self.setState(state);
            core.elements['header-right'].find('.gridmenu span').text($(this).text());
        });

        $( window ).resize(onCameraScreenResize);

        return defaultPromise();
    }
};

function toggleAllLoc() {
    var ele = document.getElementById("locctrl");
    if (ele.checked) $(".locationCheckbox").prop("checked", true);
    else $(".locationCheckbox").prop("checked", false);
}
