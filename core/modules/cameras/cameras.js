window.screens = window.screens || {};
var path = window.core.getPath('cameras.js');
(function( $ ){

  $.fn.simpleMenuPlugin = function(e) {

    //this.click(function(e){
        var self = this;
        let access_token = $(this).attr("access_token");
        let channelID = $(this).attr("cam_id");

        let gatewayId = $(this).attr("gateway_id") == "null" ? "" : $(this).attr("gateway_id");
        let gatewayToken = $(this).attr("gateway_token") == "null" ? "" : $(this).attr("gateway_token");

        let camOrder = $(this).attr("cam_order");

        sessionStorage.setItem("backToCam", channelID);

        var menu =  $(`
        <div class="simplemenu">
        <div class="listmenu-item cam-menu mcamera dvrcam" onclick_toscreen="tagsview" channelID='${channelID}'><i class="fa fa-video-camera" aria-hidden="true"></i> <span class="listitem-name font-md"> ${$.t('common.timeline')} </span> </div>
        <div class="listmenu-item cam-menu msetting subuser-hide" ifscreen="camerasettings" onclick_toscreen="camerasettings"><i class="fa fa-cog" aria-hidden="true"></i> <span class="listitem-name font-md"> ${$.t('common.streamSettings')} </span></div>
        <div class="listmenu-item cam-menu mchart dvrcam" ifscreen="camerameta" onclick_toscreen="camerameta"><i class="fa fa-bar-chart" aria-hidden="true"></i> <span class="listitem-name font-md"> ${$.t('common.metadata')} </span></div>
        <a class="listmenu-item cam-menu mwebui subuser-hide" id="ui-link" href="" target="_blank" style="display: none"><i class="fa fa-window-restore" aria-hidden="true"></i> <span class="listitem-name font-md"> ${$.t('common.cameraUI')} </span></a>
        <div class="listmenu-item cam-menu mconfigure dvrcam subuser-hide" ifscreen="addcamera" onclick_toscreen="addcamera"><i class="fa fa-wrench" aria-hidden="true"></i> <span class="listitem-name font-md"> ${$.t('common.config')} </span></div>
        <div class="listmenu-item cam-menu mtrash subuser-hide" onclick="onCameraDelete('${channelID}', '${gatewayId}', '${gatewayToken}', '${camOrder}')"><i class="fa fa-trash-o" aria-hidden="true"></i> <span class="listitem-name font-md"> ${$.t('action.remove')} </span></div>
        </div>`);
        
        var userType = vxg.user.src.role;
        if (userType == "user") {
            addSimpleMenu(menu, self, e, true);
            return;
        }

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
                } else if (config.url && config.url.includes("dvr_camera")) {
                    $(menu).find(".cam-menu:not(.dvrcam)").css("display", "none");
                    addSimpleMenu(menu, self, e);
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

function addSimpleMenu(_menu, settingsEle, e, isSubuser = false) {
    var menu = _menu.html();
    $('.simplemenu').remove();
    let self = settingsEle;
    let el = $(settingsEle).find('.simplemenu');
    if (!el.length) {
        $(settingsEle).append('<div class="simplemenu"> ' + menu + '</div>');
        el = $(settingsEle).find('.simplemenu');
        if (isSubuser) {
            $(".subuser-hide").hide();
        }
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

function onCameraDelete(channel_id, gatewayId = null, gatewayToken = null, camOrder = null){
    setTimeout(function(){$('.simplemenu').remove();},10);

    vxg.cameras.getCameraByIDPromise(channel_id).then(function(camera){

        dialogs['mdialog'].activate(`<h7>${$.t('cameras.deleteConfirm.shortTitle')} ${camera.src.name}?</h7><p>${$.t('cameras.deleteConfirm.content')} </p><p><button name="cancel" class="vxgbutton">${$.t('action.cancel')}</button>&nbsp;&nbsp;&nbsp;&nbsp;<button name="delete" class="vxgbutton">${$.t('action.delete')}</button></p>`).then(function(r){
            if (r.button!='delete') return;
            core.elements['global-loader'].show();
            var oldsubid = camera.src.meta ? camera.src.meta.subid : -1;

            var gatewayUrl = "";
            if (gatewayId && gatewayToken) {
                var cameraUrlsStr = sessionStorage.getItem("cameraUrls");
                var cameraUrls = cameraUrlsStr ? JSON.parse(cameraUrlsStr) : [];
                var savedCam = cameraUrls.length != 0 ? cameraUrls.find(x => x.id == gatewayId) : "";
        
                if (savedCam && savedCam.url && savedCam.url != "nourl") {
                    gatewayUrl = savedCam.url;
                    return doCameraDelete(camera, oldsubid, camOrder, gatewayUrl);
                } else if (!savedCam) {
                    vxg.api.cloud.getCameraConfig(gatewayId, gatewayToken).then(function(config) {
                        return vxg.api.cloud.getUplinkUrl(config.id, config.url).then(function(urlinfo) {
                            if (!urlinfo.id && !urlinfo.url) {
                                alert($.t('toast.findRemovingCameraUrlFailed'));
                                return;
                            } else {
                                cameraUrls.push({id: urlinfo.id, url: urlinfo.url});
                                sessionStorage.setItem("cameraUrls", JSON.stringify(cameraUrls));  
                                gatewayUrl = urlinfo.url;
                                return doCameraDelete(camera, oldsubid, camOrder, gatewayUrl);
                            }
                            
                        });
                    })
                }
            } else {
                return doCameraDelete(camera, oldsubid, camOrder);
            }
        });
    })
}

function doCameraDelete(camera, oldsubid, camOrder, gatewayUrl = null) {
    if (camera) camera.deleteCameraPromise(gatewayUrl).then(function(){
        var planIndex = vxg.user.src.plans ? vxg.user.src.plans.findIndex(p => p.id == oldsubid) : -1;
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
        var total = 0;
        if (cameraList) {
            var newCamList = cameraList.objects.filter(c => c.id != camera.camera_id);
            cameraList.objects = newCamList;
            total = parseInt(cameraList.meta.total_count);
            cameraList.meta.total_count = total - 1;
            localStorage.cameraList = JSON.stringify(cameraList);
        }

        var noLoc = localStorage.noLocCams ? JSON.parse(localStorage.noLocCams) : null;
        if (camera.src.meta.location == undefined && noLoc) {
            var removeCam = noLoc.filter(cam => { return cam.camera_id != camera.camera_id});
            if (removeCam.length == 0) localStorage.removeItem(noLocCams)
            else localStorage.noLocCams = JSON.stringify(removeCam);
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

        if (gatewayUrl) updateBootstrapTable("#gatewaycams-table", camera.camera_id)

        updateBootstrapTable("#table", camera.camera_id);

        // remove from locationHierarchyCams
        var locationHierarchy = localStorage.locationHierarchyCams ? JSON.parse(localStorage.locationHierarchyCams) : null;
        if (locationHierarchy) {
            var locArr = window.core.locationHierarchy.createLocationArray(camera.src.meta);
            var locHierarchy = window.core.locationHierarchy.removeCamFromHierarchy(locationHierarchy, locArr, camera); 
            localStorage.locationHierarchyCams = JSON.stringify(locHierarchy);
        }       

        core.elements['global-loader'].hide();
        return screens['cameras'].on_show();
    }, function(r){
        core.elements['global-loader'].hide();
        let err_text = $.t('toast.deleteCameraFailed');
        if (r && r.responseJSON && r.responseJSON.errorDetail) err_text = r.responseJSON.errorDetail;
        dialogs['mdialog'].activate(`<h7>${$.t('common.error')}</h7><p>${err_text}</p><p><button name="cancel" class="vxgbutton">${$.t('action.ok')}</button></p>`);
    });
}

function updateBootstrapTable(tableId, cameraId) {
    var tableData = $(tableId).bootstrapTable("getData");

    var camToRemove = tableData.filter(t => t.camId == cameraId); 
    if (camToRemove.length == 0) return;
    var camOrder = camToRemove[0].order;

    if (camOrder) $(tableId).bootstrapTable('removeByUniqueId', camOrder);

    while (camOrder < tableData.length) {
        $(tableId).bootstrapTable('updateCell', {index: camOrder-1, field: 'order', value: camOrder.toString()});
        var camIdCurr = tableData[camOrder-1].camId;
        $("input.groupCamCheck[cam_id='"+camIdCurr+"']").attr("cam_order", camOrder);
        $("div.settings[cam_id='"+camIdCurr+"']").attr("cam_order", camOrder);
        camOrder++;
    }
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
        text: $.t('users.highlightUsers.title'),
        icon: 'bi-arrow-clockwise',
        event: function () {
          alert($.t('users.highlightUsers.alert'))
        },
        attributes: {
          title: $.t('users.highlightUsers.description')
        }
      },
    }
  }


  $(function() {
  })

window.screens['cameras'] = {
    'menu_weight':30,
    'menu_name': $.t('cameras.title'),
    'get_args':function(){
    },
//  TODO:
//    'menu_toggle':true,
//    'menu_disabled':true,
    'menu_icon': '<i class="fa fa-video-camera" aria-hidden="true"></i>',
    'html': path+'cameras.html',
    'css':[path+'cameras.css'],
    'js':["core/webcontrols/camera_map.js"],
    'stablecss':[path+'scameras.css'],
    'playerList': null,
    'provincesLoaded': false,
    'allCamerasLoaded': false,
    'on_search':function(text){
        if (!text)
            delete this.search_text;
        else
            this.search_text = text;
        window.screens['cameras'].activate();
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
            if ($(p[i]).attr('access_token')) {
                p[i].play();
            }
        }

        setTimeout(() => {
            if (self.playerList && self.playerList.getPlayerList()) {
                self.playerList.synchronize();
            }
        }, 1500)
        if (this.getState().grid == 1) {
            if (localStorage.locationHierarchy == undefined)
                return window.core.locationHierarchy.createLocationHierarchy(self);
            else {
                return self.onLocationHierarchyLoaded(JSON.parse(localStorage.locationHierarchy), self);
            }
        }
        else if (this.getState().grid < 0) $('.cammap').show()
        else return self.loadCameras(filterarray, true);
    },
    playChannels: function(resolve) {
        if (this.camera_list_promise) return this.camera_list_promise;
        return this.camera_list_promise;
    },
    loadCameras: function(filterarray, firstsearch, loadedCams = "", forLocation = null){
        if (this.camera_list_promise) return this.camera_list_promise;

        let self = this;
        let el = this.wrapper.find('.camlist');

        if (self.allCamerasLoaded && !forLocation) {
            $('.camlist').show();
            $('.loc-cont').hide();
            $('.cammap').hide();

            return vxg.api.cloud.getCameraStatusChange().then(function(changedCams) {
                // updateCell, index, fieldName
                var tableData = $("#table").bootstrapTable('getData');
                for (var i = 0; i < changedCams.length; i++) {
                    var rowIndex = tableData.findIndex((cam) => cam.camId == changedCams[i].id);
                    var statusBlock ='<div class="font-md caminfo tablecaminfo '+changedCams[i].status+' '+(changedCams[i].status=='active'?' online':'')+'">'+ (changedCams[i].status=='active'?$.t('common.online'):$.t('common.offline'))+'</div>';
                    $("#table").bootstrapTable('updateCell', {
                        index: rowIndex,
                        field: "status",
                        value: statusBlock
                    });
                }
            })
        } else {
            $('.loc-cont').hide();
            $('.cammap').hide();
            if (forLocation) self.allCamerasLoaded = false;
            else self.allCamerasLoaded = true;
        }
		
        el.find('.wmore').remove();
        self.wrapper.addClass('loader');
        if (filterarray) {
            this.last_filterarray = filterarray;
            this.last_offset = 0;
        } else filterarray = this.last_filterarray;
        var cameraListCall = forLocation ? window.vxg.cameras.getCameraListPromise(500,0,forLocation,undefined,undefined) :  vxg.cameras.getFullCameraList(500,this.last_offset);
        this.camera_list_promise = cameraListCall.then(function(fullList){
            if (fullList.length === 0) {
                $("#nocameras").empty().append(`<h5 class="font-md">${$.t('cameras.noCameras')}. <a href="javascript:void(0)" ifscreen="newcamera" onclick_toscreen="newcamera">${$.t('cameras.addCamera')}</a></h5>`);
            }
            self.camera_list_promise=undefined;
            var gatewaysList = fullList.filter(cam => {return cam.src.meta && cam.src.meta.gateway});
            var list = fullList.filter(cam => {if (cam.src.meta) return cam.src.meta.gateway == undefined; else return cam;});
            if (forLocation) {
                var locPathArr = localStorage.locPath.split(":");
                // filtering out any cameras that have the same name for the current level but is in a different place in the hierarchy
                // ie province_Ontario:city_Windsor and province_Nova_Scotia:city_Windsor
                list = list.filter(cam => {
                    for (var i = 0; i < locPathArr.length; i++) {
                        var locType = locTypes[i];
                        if (cam.src.meta && cam.src.meta[locType] != locPathArr[i]) break;
                        else return cam;
                    }   
                });
            }
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
                let statusBlock = '<div class="font-md caminfo tablecaminfo '+list[i].src.status+' '+(list[i].src.status=='active'?' online':'')+'">'+ (list[i].src.status=='active'?$.t('common.online'):$.t('common.offline'))+'</div>';
                var channelID = list[i].getChannelID();
                channelIdList.push(channelID.toString());
                var camGroup = "";
                camGroups.forEach(group => {
                    if (group.cams.indexOf(channelID.toString()) != -1) {
                        camGroup = group.name;
                    }
                });

                var gatewayId = null;
                var gatewayToken = null;
                if (list[i].src.meta && list[i].src.meta.gateway_cam) {
                    gatewaysList.forEach(gateway => {
                        if (gateway.src.meta && gateway.src.meta.gateway_id == list[i].src.meta.gateway_id) {
                            gatewayId = gateway.camera_id;
                            gatewayToken = gateway.token;
                        }
                    })
                }

                var tableGroup = list[i].src.meta && list[i].src.meta.group ? list[i].src.meta.group : "";
                if (tableGroup.toLocaleLowerCase() == "favorite" || tableGroup.toLocaleLowerCase() == "favourite") {
                    tableGroup = $.t('common.favourite');
                }

                tableData.push({
                    camId: channelID,
                    order: count,
                    state: `<label class="filter-label custom-checkbox" style="margin-left: 25%;">
                    <input type="checkbox" class="groupCamCheck" cam_name="${list[i].src.name}" cam_id="${channelID}" cam_order="${count}">
                    <span class="checkmark"></span>	
                </label>`,
                    id: `<div class="camerablock${captured}" access_token="${channelID}" id="scrollto${channelID}">
                    <campreview onclick_toscreen="tagsview" style="cursor: pointer;"></campreview>`,
                    status: statusBlock,
                    recording: list[i].src.recording ? $.t('action.yes') : $.t('action.no'),
                    name: list[i].src.name + `${list[i]?.src?.meta?.subid == 'NOPLAN' ? ' (' + $.t('common.noSubscription') + ')' : ''}`,
                    location: list[i].src.meta && list[i].src.meta.location ? list[i].src.meta.location : "",
                    group: tableGroup,
                    action: `<div class="settings" access_token="${list[i].token}" cam_order="${count}" cam_id="${channelID}" gateway_id="${gatewayId}" gateway_token="${gatewayToken}">
                    <svg class="inline-svg-icon icon-action"><use xlink:href="#action"></use></svg>
                </div>`,
                    hide: 1
                })

                count++;
            }

            if (localStorage.tableOrder == 'desc') {
                tableData.sort(function (a, b) {
                    return b.order - a.order;
                });
            }

            if ($('#table').children().length == 0) {
                var columns = [
                    {
                        field: "order",
                        sortable: true,
                        cardVisible: false,
                        class: "ordering",
                        width: "40"
                    },
                    {
                        field: "state",
                        cardVisible: false,
                        width: "40"
                    },
                    {
                        field: "id",
                        width: "140",
                        title: $.t('common.camera'),
                    },
                    {
                        field: "status",
                        title: $.t('common.status'),
                        filterControl: "select",
                        sortable: true,
                        cardVisible: false,
                        width: "140"
                    },
                    {
                        field: "recording",
                        title: $.t('common.recording'),
                        filterControl: "select",
                        sortable: true,
                        cardVisible: false,
                        width: "80"
                    },
                    {
                        field: "name",
                        title: $.t('common.name'),
                        filterControl: "input",
                        sortable: true,
                    },
                    {
                        field: "location",
                        title: $.t('common.location'),
                        filterControl: "select",
                        sortable: true,
                        cardVisible: false,
                        width: "180"
                    },
                    {
                        field: "group",
                        title: $.t('common.group'),
                        filterControl: "select",
                        sortable: true,
                        cardVisible: false,
                        width: "150"
                    },
                    {
                        field: "action",
                        title: $.t('common.actionTitle'),
                        width: "140"
                    },
                    {
                        field: "hide",
                        title: "hide",
                        filterControl: "input",
                    }
                ]

                var isGridView = self.getState().grid>1 ? true : false;

                $('#table').bootstrapTable({
                    pagination: true,
                    // showToggle: true, 
                    showSearchClearButton: true,
                    useRowAttrFunc: true,
                    filterControl: true,
                    reorderableRows: !isGridView,
                    toolbar: ".toolbar",
                    uniqueId: "order",
                    columns: columns,
                    sortName: 'order',
                    sortOrder: localStorage.tableOrder,
                    cardView: isGridView,
                    formatRecordsPerPage (pageNumber) {
                        return `${pageNumber} ${$.t('bootstrapTable.camerasPerPage')}`
                    },
                    formatShowingRows (pageFrom, pageTo, totalRows, totalNotFiltered) {
                        const plural = totalRows > 1 ? 's' : ''
                    
                        if (totalNotFiltered !== undefined && totalNotFiltered > 0 && totalNotFiltered > totalRows) {
                            return `${$.t('bootstrapTable.showing')} ${pageFrom} ${$.t('bootstrapTable.to')} ${pageTo} ${$.t('bootstrapTable.of')} ${totalRows} ${$.t('common.camera')}${plural} (${$.t('bootstrapTable.filteredTotal')}  ${totalNotFiltered} ${$.t('common.camera')}${plural})`
                        }
                        
                        return `${$.t('bootstrapTable.showing')} ${pageFrom} ${$.t('bootstrapTable.to')} ${pageTo} ${$.t('bootstrapTable.of')} ${totalRows} ${$.t('common.camera')}${plural}`
                    },
                    formatClearSearch () {
                        return $.t('bootstrapTable.clearFilters')
                    },
                    formatNoMatches () {
                        return $.t('bootstrapTable.noMatches')
                    },
                    formatToggleOn () {
                        return $.t('bootstrapTable.cardViewOn')
                    },
                    formatToggleOff () {
                        return $.t('bootstrapTable.cardViewOff')
                    },
                    onColumnSearch: function (arg1, arg2) {
                    var userId = vxg.user.src.uid;
                    if (arg1 == 'status')
                        localStorage.setItem("camera_status" + userId, arg2);
                    if (arg1 == 'recording')
                        localStorage.setItem("camera_recording" + userId, arg2);
                    if (arg1 == 'location')
                        localStorage.setItem("camera_location" + userId, arg2);
                    if (arg1 == 'group')
                        localStorage.setItem("camera_group" + userId, arg2);
                    if (arg1 == 'name')
                        localStorage.setItem("camera_name" + userId, arg2);
                }
                });

                $("#table").hide();

                $(document).on('click', '.ordering .th-inner.sortable.both', function(event) {
                    if ($(this).hasClass('asc')) localStorage.setItem("tableOrder", "asc");
                    else if ($(this).hasClass('desc')) localStorage.setItem("tableOrder", "desc");
                })

                setTimeout(function() {
                    var userId = vxg.user.src.uid;
		    // Can we move this code to the onPreBody or other Event of the BootstapTable  	
		    // onPreBody	pre-body.bs.table	data	Fires before the table body is rendered
	            // https://bootstrap-table-docs3.wenzhixin.net.cn/documentation/
		    //  		 
		    var inputs = document.querySelectorAll('.bootstrap-table-filter-control-name');
		    inputs.forEach(function (c_input) {
		      c_input.setAttribute('autocomplete', 'off');
		    });

                    $('.bootstrap-table-filter-control-status').val(localStorage.getItem("camera_status" + userId));
                    $('.bootstrap-table-filter-control-recording').val(localStorage.getItem("camera_recording" + userId));
                    $('.bootstrap-table-filter-control-location').val(localStorage.getItem("camera_location" + userId));
                    $('.bootstrap-table-filter-control-group').val(localStorage.getItem("camera_group" + userId));
                    $('.bootstrap-table-filter-control-name').val(localStorage.getItem("camera_name" + userId));
                    $('.bootstrap-table-filter-control-hide').val('1');
                    if (self.getState().grid == 0 || forLocation) {
                        $("#table").show();
                        $('.camlist').show();
                    } 
                }, 500);

                if (isGridView) $('.fixed-table-toolbar').hide();

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
                        alert($.t('toast.selectAtLeastOneCamera'));
                        return;
                    }
    
                    //var groupsList = sessionStorage.getItem("camGroups") ? JSON.parse(sessionStorage.getItem("camGroups")) : [];
                    vxg.cameras.getGroupsList().then(function(groupsList) {
                        var groupItems = "";
                        groupsList.forEach(group => {
                            if (group && group.toLocaleLowerCase() != "favorite" && group.toLocaleLowerCase() != "favourite") {
                                let item = `
                                <li>    
                                    <label class="filter-label custom-checkbox">
                                        <span>${group}</span>
                                        <input class="groupCheck" type="radio" name="groupRadio" value="${group}">
                                        <span class="checkmark"></span>	
                                    </label>
                                </li>`
                                groupItems += item;
                            }
                        })
                        
                        dialogs['mdialog'].activate(`
                            <h7>${$.t('action.selectGroup')}</h7>
                            <div>
                                <p>${camNameList}</p>
                                <ul class="groupslist">						
                                <li>    
                                    <label class="filter-label custom-checkbox">
                                        <span> ${$.t('action.removeFromGroup')}</span>
                                        <input class="groupCheck" type="radio" name="groupRadio" value="noGroup">
                                        <span class="checkmark"></span>	
                                    </label>
                                </li>
                                <li>    
                                    <label class="filter-label custom-checkbox">
                                        <span> ${$.t('common.favourite')} </span>
                                        <input class="groupCheck" type="radio" name="groupRadio" value="Favorite">
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
                                <button name="apply" class="vxgbutton-transparent" style="width:100%">${$.t('action.set')}</button>
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
                        var userId = vxg.user.src.uid;
                        if (localStorage.getItem("camera_status" + userId) != null) 
                            $('.bootstrap-table-filter-control-status').val(localStorage.getItem("camera_status" + userId));
                        if (localStorage.getItem("camera_recording" + userId) != null) 
                            $('.bootstrap-table-filter-control-recording').val(localStorage.getItem("camera_recording" + userId));
                        if (localStorage.getItem("camera_location" + userId) != null) 
                            $('.bootstrap-table-filter-control-location').val(localStorage.getItem("camera_location" + userId));
                        if (localStorage.getItem("camera_group" + userId) != null) 
                            $('.bootstrap-table-filter-control-group').val(localStorage.getItem("camera_group" + userId));
                    }, 300);
                });

                $(document).on('click', '.backToLocations', function(event) {
                    //$(".backToLocations").on("click", function(e) {
                    event.preventDefault();
                    $(".location-tools").hide();
                    $(".camlist").hide();
    
                    $('#table').bootstrapTable('removeAll');

                    if (localStorage.locationHierarchy == undefined)
                        window.core.locationHierarchy.createLocationHierarchy(self);
                    else {
                        self.onLocationHierarchyLoaded(JSON.parse(localStorage.locationHierarchy), self);
                    }
                });

            } else {
                if (self.getState().grid == 0 || forLocation) { 
                    $(".camlist").show();
                    $("#table").show();
                }
                else  $(".camlist").hide();
            }

            $('#table').bootstrapTable('load', tableData);

            var pageSize = $('#table').bootstrapTable('getOptions').pageSize;
            var loadPrevCam = sessionStorage.getItem("backToCam");
            var camRow = loadPrevCam ? tableData.find(d => d.camId == loadPrevCam) : "";
            var camPage = 1;
            if (camRow) {
                camPage = Math.ceil(camRow.order / pageSize);
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

            if (forLocation) {
                $(".locpath").empty();
                $(".locpath").html(localStorage.locPath);
                $(".location-tools").show();
            }

        },function(){
            self.camera_list_promise=undefined;
            self.wrapper.addClass('nocameras');
            el.html($.t('toast.loadCamerasFailed'));
            self.wrapper.removeClass('loader');
        });
		
        self.wrapper.removeClass('loader');
        return this.camera_list_promise;
    },
    onLocationHierarchyLoaded: function(locationHierarchy) {
        var self = this;
        $('.camlist').hide();
        $('.cammap').hide();
        $('.loc-cont').show();

        var dropdownTreeStr;
        locationHierarchy = window.core.locationHierarchy.sortLocations(locationHierarchy);
        if ( Object.keys(locationHierarchy).length == 0) {
            dropdownTreeStr = "<p class='nolocs font-md'>No locations have been set for this account. Add a location below</p>"
        } else {
            var dropdownTree = this.createLocationList(locationHierarchy)
            dropdownTreeStr = $(dropdownTree).prop('outerHTML');
        }

        $('.loclist').empty();
        $('.loclist').append(dropdownTreeStr);

        $('.loc-name').on("click", function() {
            var metaFilter = $(this).attr('loadCamerasFor')
            localStorage.locPath = self.getLocPath(this, []);
            self.loadCameras(undefined, undefined, "", metaFilter);
        });
    },
    getLocPath: function(locClicked, locPath) {
        var self = this;
        var currentLoc = $(locClicked).parent().parent().attr("locName");
        locPath.push(currentLoc.substring(currentLoc.indexOf("_") + 1).replaceAll("_", " "));

        if ($(locClicked).parent().parent().attr("locType") !== "province") {
            return self.getLocPath($(locClicked).parent().parent(), locPath);
        } else {
            var locStr = locPath.reverse().join(":");
            return locStr; 
        }

    },
    createLocationList: function(locationHierarchy) {
        var self = this;
        if (locationHierarchy instanceof Object && !(locationHierarchy instanceof String)) {
            var firstObj = Object.keys(locationHierarchy)[0];
            var locType = firstObj ? firstObj.split("_")[0] : "EMPTY";
            var ul = $(`<ul class="location-hierarchy locations-page ${locType}-ul" ${(locType != "province" ? `style="display:none"` : "")}></ul>`);
            for (var child in locationHierarchy) {
                var childName = child.substring(child.indexOf("_") + 1).replaceAll("_", " ");
                var li_ele = $(`
                        <li class="loc-dropdown ${child}-dropdown" locName=${child} locType="${locType}">
                            <div class="location-btn-cont">
                                <span class="loc-name" loadCamerasFor="${child}" locType="${locType}">
                                    <i class="fa fa-video-camera camera-view" aria-hidden="true"></i>
                                    ${childName}
                                </span>
                                <i class="location-arrow fa fa-caret-up" onclick="showNextTier(event, this, '${locType}')" aria-hidden="true"></i>
                            </div>    
                        </li>`);
                li_ele.append(this.createLocationList(locationHierarchy[child]));
                ul.append(li_ele);
            }
            return ul;
        }
    },
    /*loadProvinces: function(fromShow = false) {
        var self = this;
        if (localStorage.locPath && localStorage.locPath != "undefined" && fromShow) return;
        if (self.provincesLoaded && fromShow) {
            $('.camlist').hide();
            $('.cammap').hide();
            $('.loc-cont').show();
            return;
        } else {
            $('.cammap').hide();
            self.provincesLoaded = true;
        }
        
        if (localStorage.locPath) localStorage.removeItem('locPath');
        $('.loclist').empty();
        $(".location-title").empty().html("<h4> Location " + $.t("locationsPage.locationTier.one") + " </h4>").show();
        return vxg.api.cloud.getMetaTag(vxg.user.src.allCamsToken, "Province").then(function(locations) {
            var location_eles = "";
            for (const loc in locations) {
                location_eles += `
                        <div class="card" style="width: 18rem;">
                            <div class="card-img-top location-img"></div>
                            <div class="card-body location-body">
                                <span class="card-text">${loc}</span>
                                <div class="card-buttons">
                                    <i class="fa fa-video-camera camera-view" locName="${loc}" aria-hidden="true"></i>
                                    <i class="fa fa-level-down sub-location" locName="${loc}" aria-hidden="true"></i>
                                </div>
                            </div>
                        </div>
                `;
            }
            if (!location_eles) location_eles = `<h4 class="nocamsloc">${$.t("locationsPage.noLocations")}</h4>`
            $('.loclist').append(location_eles);
            $('.sub-location').on("click", function() {
                self.loadLocationHierarchy(1, $(this).attr('locName'));
            });
            $('.camera-view').on("click", function() {
                localStorage.locPath = $(this).attr('locName'); 
                $('.loc-cont').hide();
                var metaFilter = "province_" + $(this).attr('locName').replaceAll(" ", "_");
                self.loadCameras(undefined, undefined, "", metaFilter);
            });
            $('.loc-cont').show();
        });
    },
    loadLocationHierarchy: function(locLevel, prevLocation) {
        var self = this;
        var currentLocPath = localStorage.locPath;
        if (!currentLocPath || (currentLocPath && !currentLocPath.includes(prevLocation))) {
            localStorage.locPath = currentLocPath ? currentLocPath + ":" + prevLocation : prevLocation == undefined ? "" : prevLocation; 
        }
        var currLocType = locTypes[locLevel];
        var genLoc = self.getGenLocName(locLevel);
        $('.loclist').empty();
        $(".location-title").empty().html("<h4> Location "+genLoc+"</h4>").show();
        return vxg.api.cloud.getMetaTag(vxg.user.src.allCamsToken, currLocType).then(function(locations) {
            var limit = 0;
            // locations has how many times locations occur. Use this to create an upper limit to 500 
            for (const loc in locations) {
                if (limit + locations[loc] > 500) break;
                limit += locations[loc];
            }
            var metaFilter = locTypes[locLevel-1].toLocaleLowerCase() + "_" + prevLocation.replaceAll(" ", "_");
            self.loadLocationCameras(limit, metaFilter).then(function(cameras) {
                var locPathArr = localStorage.locPath.split(":");
                // filtering out any cameras that have the same name for the current level but is in a different place in the hierarchy
                // ie province_Ontario:city_Windsor and province_Nova_Scotia:city_Windsor
                var camerasFiltered = cameras.filter(cam => {
                    for (var i = 0; i < locPathArr.length; i++) {
                        var locType = locTypes[i];
                        if (cam.src.meta && cam.src.meta[locType] != locPathArr[i]) break;
                        else return cam;
                    }   
                });

                var locationTokenList = [];
                camerasFiltered.forEach(cam => {
                    if (cam.src.meta && cam.src.meta[currLocType] && !locationTokenList.some(e => e.loc === cam.src.meta[currLocType])){
                        locationTokenList.push({"loc": cam.src.meta[currLocType], "token": cam.token})
                    }
                });
                var location_eles = "";
                if (locationTokenList.length == 0) {
                    location_eles = `<h4 class="nocamsloc">${$.t('locationsPage.noCams', { genLoc: genLoc, prevLoc: prevLocation })}.
                        <span class="super-location">${$.t('locationsPage.goBack')} <i class="fa fa-level-up" aria-hidden="true"></i> </span>
                    </h4>`
                } else { 
                    localStorage.currentAvailable = "";
                    locationTokenList.forEach(locToken => {
                        localStorage.currentAvailable += !localStorage.currentAvailable ? locToken.loc : ":" + locToken.loc;
                        location_eles += `
                                <div class="card" style="width: 18rem;">
                                <div class="camerablock" access_token="${locToken.token}" id="scrollto${locToken.token}">
                                <campreview class="location-prev"></campreview></div>
                                <div class="card-body location-body">
                                        <span class="card-text">${locToken.loc}</span>
                                        <div class="card-buttons">
                                            <i class="fa fa-video-camera camera-view" locName="${locToken.loc}" aria-hidden="true"></i>
                                            ${(locLevel == 4 ? `` : `<i class="fa fa-level-down sub-location" locName="${locToken.loc}" aria-hidden="true"></i>`)}
                                            <i class="fa fa-level-up super-location" locName="${locToken.loc}" aria-hidden="true"></i>
                                        </div>
                                    </div>
                                </div>
                        `;
                    });
                }
                $('.loclist').append(location_eles);
                $('.sub-location').on("click", function() {
                    self.loadLocationHierarchy(locLevel+1, $(this).attr('locName'));
                });
                $('.super-location').on("click", function() {
                    if (locLevel == 1) self.loadProvinces();
                    var locPathArr = localStorage.locPath ? localStorage.locPath.split(":") : [];
                    var backToLoc =  locPathArr[locLevel-2];
                    locPathArr.splice(-2);
                    localStorage.locPath = locPathArr.join(":");
                    self.loadLocationHierarchy(locLevel-1, backToLoc);
                });
                $('.camera-view').on("click", function() {
                    localStorage.locPath = localStorage.locPath + ":" + $(this).attr('locName'); 
                    $('.loc-cont').hide();
                    var metaFilter = currLocType.toLocaleLowerCase() + "_" + $(this).attr('locName').replaceAll(" ", "_");
                    self.loadCameras(undefined, undefined, "", metaFilter);
                });
                $('.loc-cont').show();
            });
        });
    },
    loadLocationCameras: function(limit, metaFilter) {
        return window.vxg.cameras.getCameraListPromise(limit,0,metaFilter,undefined,undefined);
    },*/
    getGenLocName: function(locLevel) {
        switch (locLevel) {
            case 0:
                return $.t("locationsPage.locationTier.one");
            case 1:
                return $.t("locationsPage.locationTier.two");
            case 2:
                return $.t("locationsPage.locationTier.three");
            case 3:
                return $.t("locationsPage.locationTier.four");
            case 4:
                return $.t("locationsPage.locationTier.five");
            default:
                return "";
        }
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
       
        if (this.getState().grid<0){
            self.wrapper.find('.camlist').hide();self.wrapper.find('.cammap').show();
        } else if (this.getState().grid==0){
            self.wrapper.find('.camlist').show();self.wrapper.find('.cammap').hide();
        } else if (this.getState().grid>0) {
            self.wrapper.find('.camlist').hide();self.wrapper.find('.cammap').hide();
        }

        //core.elements['header-right'].prepend('<div class="camerafilterContainer"><div class="transparent-button camerafilter"><span id="filterbtn">Filter</span></div></div>');
        /*core.elements['header-right'].find('.camerafilterContainer').append(
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
        });*/
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
                let locationShowName = name ? name : $.t('cameras.noLocation');
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
                <span>${$.t('action.selectDeselectAll')}</span>
                <input type="checkbox" id="locctrl" ${(!filterset ? "checked" : "")} onchange="toggleAllLoc()">
                <span class="checkmark"></span>	
            </label>
            <ul class="locationlist">${ret}</ul>`

//            ret+='<li class="no-locations"><input type="checkbox" name="nolocation" class="svgbtnbefore"><span>No location</span></label></li>';
            return new Promise(function(resolve, reject){setTimeout(function(){resolve({html:htmlret,count:counter});}, 0);});
      });
    },
    setState: function(state){
        let newstate = localStorage['vxglist'] ? JSON.parse(localStorage['vxglist']) : [];
        if (newstate.cams!==undefined) newstate = [];
        newstate[vxg.user.src.uid] = state;
        localStorage['vxglist'] = JSON.stringify(newstate);
    },
    getState: function(){
        let state = localStorage['vxglist'] ? JSON.parse(localStorage['vxglist']) : [];
        if (state.cams!==undefined) state = [];
        state = state[vxg.user.src.uid];
        if (!state || state.cams===undefined || state.grid===undefined) return {cams:{},grid:0};
        return state;
    },
    'on_init':function(){
        let self=this;
        let statesArray = [];
        statesArray[0] = $.t('common.list');
        statesArray[1] = $.t('common.locations');
        // statesArray[2] = '2 x 2';
        // statesArray[3] = '3 x 3';
        // statesArray[4] = '4 x 4';
        statesArray[-1] = $.t('common.map');

        let firstState = self.getState();
        core.elements['header-right'].prepend('<div tabindex="0" class="listmenu hide transparent-button"><span>'+statesArray[firstState.grid]+'</span><i class="fa fa-angle-down" aria-hidden="true"></i>' +
            '    <ul class="menu-dropdown">' +
            '        <li class="cam-dropdown-item nogrid"><a href="javascript:;"> ' + $.t('common.list') + ' </a></li>' +
            '        <li class="cam-dropdown-item location"><a href="javascript:;"> ' + $.t('common.locations') + ' </a></li>' +
            // '        <li class="cam-dropdown-item grid22"><a href="javascript:;">2 x 2</a></li>' +
            // '        <li class="cam-dropdown-item grid33"><a href="javascript:;">3 x 3</a></li>' +
            // '        <li class="cam-dropdown-item grid44"><a href="javascript:;">4 x 4</a></li>' +
            '        <li class="cam-dropdown-item gridmap"><a href="javascript:;">' + $.t('common.map') + '</a></li>' +
            '    </ul>' +
            `</div><div class="transparent-button active addcamera" ifscreen="newcamera" onclick_toscreen="newcamera"><span class="add-icon">+</span><span>${$.t('cameras.addCamera')}</span></div>`);
        
        core.elements['header-right'].find('.nogrid').click(function(){
            //if (self.getState().grid == 1 || firstState.grid == 1) location.reload();
            $('.fixed-table-toolbar').show();
            $('#table').show();
            $(".fixed-table-pagination").show();
            
            $("#table").bootstrapTable("refreshOptions", {
                pagination: true,
                // showToggle: true, 
                showSearchClearButton: true,
                useRowAttrFunc: true,
                filterControl: true,
                cardView: false,
                reorderableRows: true,
            });
            $('#table').bootstrapTable('filterBy', {});
            $('#table').removeClass("table-bordered");

            self.wrapper.removeClass('grid');
            let state = self.getState(); state.grid=0; state.list=true; self.setState(state);
            core.elements['header-right'].find('.listmenu span').text($(this).text());
            self.wrapper.find('.location-tools').hide();

            if (self.allCamerasLoaded) {
                $('.loc-cont').hide();
                $('.camlist').show();
                $('.cammap').hide();
            } else {
                self.loadCameras([], true);
            }
        });

        core.elements['header-right'].find('.location').click(function(){
            $('#table').hide();
            $(".fixed-table-pagination").hide();
            self.wrapper.removeClass('grid');
            let state = self.getState(); state.grid=1; self.setState(state);
            core.elements['header-right'].find('.listmenu span').text($(this).text());
            if (localStorage.locationHierarchy == undefined)
                window.core.locationHierarchy.createLocationHierarchy(self)
            else {
                self.onLocationHierarchyLoaded(JSON.parse(localStorage.locationHierarchy), self);
            }

            $('.loc-cont').show();
            $('.camlist').hide();
            $('.cammap').hide();
        });

        core.elements['header-right'].find('.gridmap').click(function(){
            //if (self.getState().grid == 1) location.reload();
            $('.camlist').hide();
            $('.loc-cont').hide();
            $('.cammap').show();
            self.wrapper.addClass('grid');
            let state = self.getState(); state.grid=-1; self.setState(state);
            core.elements['header-right'].find('.listmenu span').text($(this).text());
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
