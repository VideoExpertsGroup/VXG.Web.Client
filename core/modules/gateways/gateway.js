window.screens = window.screens || {};
window.controls = window.controls || {};
window.dialogs = window.dialogs || {};
var path = window.core.getPath('gateway.js');
window.screens['gateway'] = {
    'menu_weight': 22,
    'menu_name': $.t('gateways.title'),
    'get_args':function(){
    },
    'menu_icon': '<i class="fa fa-upload" aria-hidden="true"></i>',
    'html': path+'gateway.html',
    'css':[path+'gateway.css'],
    'js':[],
    'on_before_show':function(r){
        return defaultPromise();
    },
    'on_show':function(r){
        setTimeout(function(){onCameraScreenResize();},100);
        core.elements['header-search'].hide();
        if (core.elements['header-search']) core.elements['header-search'].find('input').val(this.search_text ? this.search_text : '');
        return this.loadGateways()
    },
    'on_hide':function(){
    },
    'on_ready':function(){
    },
    'on_init':function(){
        let self = this;
        core.elements['header-right'].prepend(`
                                        <div class="transparent-button active addgateway" ifscreen="add_gateway" onclick_toscreen="add_gateway">
                                            <span class="add-icon">+</span>
                                            <span>${$.t('gateways.addGateway')}</span>
                                        </div>`);
        core.elements['header-right'].prepend('' +
            '<a class="gateway-download" href="https://dashboard.videoexpertsgroup.com/downloads/uplink-gateway/" target="_blank" data-i18n="servers.downloadPackage">' + $.t('servers.downloadPackage') + '</a>');

        return defaultPromise();
    },
    loadGateways: function() {
        let self = this;
        self.wrapper.addClass('loader');
        var cameraList = localStorage.getItem('cameraList');
        if (cameraList) {
            var cams = JSON.parse(cameraList);
            self.createGatewayTable(cams.objects, self);
        } else {
            vxg.cameras.getFullCameraList(500, 0).then(function() {
                var cameraList = localStorage.getItem('cameraList');
                var cams = JSON.parse(cameraList);
                self.createGatewayTable(cams.objects, self);
            })
        }
         
         $(document).on('click', '.settings-gateway', function(event){
            self.simpleMenuPlugin_Gateway(this, event)
        });
    },
    createGatewayTable: function(cameraList, self) {
        var count = 0;
        var gatewaysList = cameraList.filter(cam => { return cam.meta && cam.meta.gateway != undefined });

        var columns = [
            {
                field: "order",
                sortable: true,
                cardVisible: false,
                class: "ordering"
            },
            {
                field: "id",
                width: "140",
                title: $.t('common.gateway'),
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
                cardVisible: false
            },
            {
                field: "group",
                title: $.t('common.group'),
                filterControl: "select",
                sortable: true,
                cardVisible: false
            },
            {
                field: "action",
                title: $.t('common.actionTitle')
            },
            {
                field: "hide",
                title: "hide",
                filterControl: "input",
            }
        ];

        var tableData = [];
        gatewaysList.forEach(camInfo => {
            //var currentGateway = JSON.parse(camInfo.meta.gateway_first_channel);
            let captured = camInfo.meta.capture_id && vxg.user.src.capture_id == camInfo.meta.capture_id ? ' captured' : '';
            var firstGatewayCam = cameraList.filter(gatewayCam => { return camInfo.meta.gateway_id == gatewayCam.meta.gateway_id && gatewayCam.meta.gateway_cam == "gateway_cam" });
            var camblockAccessToken = firstGatewayCam.length > 0 ? firstGatewayCam[0].id : "";
            tableData.push({
                order: count + 1,
                id: `<div class="camerablock${captured}" access_token="${camblockAccessToken}" channel_id="${camInfo.id}" gid="${camInfo.meta.gateway_id}" gateway_token="${camInfo.token}" id="scrollto${camInfo.id}">
                <campreview onclick_toscreen="gateway_cams" style="cursor: pointer;"></campreview>`,
                name: camInfo.name,
                location: camInfo.meta.location,
                group: camInfo.meta.group,
                action: `<div class="settings-gateway" channel_id="${camInfo.id}" access_token="${camInfo.token}" gateway_id="${camInfo.meta.gateway_id}">
                <svg class="inline-svg-icon icon-action"><use xlink:href="#action"></use></svg>
            </div>`,
                hide: 1
            })
            count++;
        });

        if (count == 0) {
            self.wrapper.addClass('nogateways');
            // $('#gateway-table').html(`<div class="no-recorders"><p>${$.t('gateways.noGateways')}</p></div>`);
            $('.nogateways').html(`<div class="no-recorders"><h5 class="font-md">${$.t('gateways.noGateways')}. <a href="javascript:void(0)" ifscreen="add_gateway" onclick_toscreen="add_gateway">${$.t('gateways.addGateway')}</a></h5></div>`);
            self.wrapper.removeClass('loader');
            return;
        } 
        
        $('#gateway-table').bootstrapTable({
            pagination: true,
            showToggle: true, 
            showSearchClearButton: true,
            reorderableRows: true,
            useRowAttrFunc: true,
            filterControl: true,
            // toolbar: ".toolbar",
            uniqueId: "order",
            columns: columns,
            sortName: 'order',
            formatRecordsPerPage (pageNumber) {
                return `${pageNumber} ${$.t('bootstrapTable.gatewaysPerPage')}`
            },
            formatShowingRows (pageFrom, pageTo, totalRows, totalNotFiltered) {
                const plural = totalRows > 1 ? 's' : ''
            
                if (totalNotFiltered !== undefined && totalNotFiltered > 0 && totalNotFiltered > totalRows) {
                    return `${$.t('bootstrapTable.showing')} ${pageFrom} ${$.t('bootstrapTable.to')} ${pageTo} ${$.t('bootstrapTable.of')} ${totalRows} ${$.t('common.gateway')}${plural} (${$.t('bootstrapTable.filteredTotal')}  ${totalNotFiltered} ${$.t('common.gateway')}${plural})`
                }
                
                return `${$.t('bootstrapTable.showing')} ${pageFrom} ${$.t('bootstrapTable.to')} ${pageTo} ${$.t('bootstrapTable.of')} ${totalRows} ${$.t('common.gateway')}${plural}`
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
            if (arg1 == 'location')
                localStorage.camera_location = arg2;
            if (arg1 == 'group')
                localStorage.camera_group = arg2;
            }
        });

        $('#gateway-table').bootstrapTable('load', tableData);
        $('#gateway-table').removeClass("table-bordered");

        self.wrapper.removeClass('nogateways');
        self.wrapper.removeClass('loader');
    },
    simpleMenuPlugin_Gateway: function(self, e) {
        let gatewayid = $(self).attr("gateway_id");
        let access_token = $(self).attr("access_token");
        let camid = $(self).attr("channel_id");

        var menu =  $(`
        <div class="simplemenu">
        <div class="listmenu-item gateway-menu mwebui_gateway disabled" title="Gateway Offline"> <a id="ui-link" target="_blank"><i class="fa fa-window-restore" aria-hidden="true"></i> <span class="listitem-name font-md"> ${$.t('common.gatewayUI')} </span></a></div>
        <div class="listmenu-item gateway-menu mconfigure_gateway" ifscreen="add_gateway" onclick_toscreen="add_gateway" editGateway="${gatewayid}"><i class="fa fa-wrench" aria-hidden="true"></i> <span class="listitem-name font-md"> ${$.t('common.config')} </span></div>
        <div class="listmenu-item gateway-menu mtrash_gateway" onclick="onGatewayDelete('${gatewayid}', '${camid}', '${access_token}')"><i class="fa fa-trash-o" aria-hidden="true"></i> <span class="listitem-name font-md"> ${$.t('action.remove')} </span></div>
        </div>`);

        var cameraUrlsStr = sessionStorage.getItem("cameraUrls");
        var cameraUrls = cameraUrlsStr ? JSON.parse(cameraUrlsStr) : [];
        var savedCam = cameraUrls.length != 0 ? cameraUrls.find(x => x.id == camid) : "";

        if (savedCam && savedCam.url && savedCam.url != "nourl") {
            $(menu).find("#ui-link").attr("href", savedCam.url);
            $(menu).find(".mwebui_gateway").removeClass("disabled");
            $(menu).find(".mwebui_gateway").attr('title',''); 
        } 
        
        if (!savedCam) {
            core.elements['global-loader'].show();
            vxg.api.cloud.getCameraConfig(camid, access_token).then(function(config) {
                return vxg.api.cloud.getUplinkUrl(config.id, config.url).then(function(urlinfo) {
                    if (urlinfo.id && urlinfo.url) {
                        cameraUrls.push({id: urlinfo.id, url: urlinfo.url});
                        sessionStorage.setItem("cameraUrls", JSON.stringify(cameraUrls));  
                        $(menu).find("#ui-link").attr("href", urlinfo.url);
                        $(menu).find(".mwebui_gateway").removeClass("disabled");
                        $(menu).find(".mwebui_gateway").attr('title',''); 
                    }
                    core.elements['global-loader'].hide();
                    addSimpleMenu(menu, self, e);
                });
            })
        } else {
            addSimpleMenu(menu, self, e);
        }
    }
};

function addCameraNamesInput(cameraInfo = null) {
    var cameraCount = parseInt($("#cameraCount").val());
    var camerasHtml = '';
    for (let i = 1; i <= cameraCount; i++) {
        var camName = cameraInfo ? cameraInfo[i-1].name : "";
        var camId = cameraInfo ? cameraInfo[i-1].id : "";

        camerasHtml += `
            <div class="gateway-input-wrapper">
                <label class="gateway-label cameras-label" for="cameraName${i}">${$.t('common.cameraName')} ${i}</label>
                <input class="gateway-input cameras-input required" name="cameraName${i}" type="text" value="${camName}"> 
                <input name="cameraId${i}" type="hidden" value="${camId}"> 
            </div>
        `;
    }

    $("#camera-names").html(camerasHtml);
}

function createTimezonesList () {
    var tzList = '';
    if (!window['moment']) {
        return;
    }
    
    var currentTz = moment.tz.guess();
    var tzs = moment.tz.names();

    for(var i in tzs) {
        var tz = tzs[i];
        var isCurrent = tz == currentTz ? "selected" : "";
        var option = `<option value="${tz}" ${isCurrent} >${tz}</option>`
        tzList += option;
    }
    
    return tzList;
}

function onGatewayDelete(gateway_id, channel_id, access_token){
    setTimeout(function(){$('.simplemenu').remove();},10);
    dialogs['mdialog'].activate(`<h7>${$.t('gateways.deleteConfirm.title')}</h7><p>${$.t('gateways.deleteConfirm.content')} </p><div class="action-btns modal-actions"><button name="cancel" class="vxgbutton">${$.t('action.cancel')}</button><button name="delete" class="vxgbutton delete-btn bg-danger">${$.t('action.delete')}</button></div>`).then(function(r){
        if (r.button!='delete') return;
        core.elements['global-loader'].show();

        var cameraUrlsStr = sessionStorage.getItem("cameraUrls");
        var cameraUrls = cameraUrlsStr ? JSON.parse(cameraUrlsStr) : [];
        var gatewayUrl = cameraUrls.length != 0 ? cameraUrls.find(x => x.id == channel_id) : "";
        gatewayUrl = gatewayUrl == "nourl" ? "" : gatewayUrl;
        if (!gatewayUrl) {
            vxg.api.cloud.getCameraConfig(channel_id, access_token).then(function(config) {
                return vxg.api.cloud.getUplinkUrl(config.id, config.url).then(function(urlinfo) {
                    if (!urlinfo.id && !urlinfo.url) {
                        cameraUrls.push({id: config.id, url: "nourl"});
                        sessionStorage.setItem("cameraUrls", JSON.stringify(cameraUrls));
                        alert($.t('toast.findGatewayUrlFailed'));
                        return;
                    } else {
                        cameraUrls.push({id: urlinfo.id, url: urlinfo.url});
                        sessionStorage.setItem("cameraUrls", JSON.stringify(cameraUrls));  
                        return doGatewayDelete(gateway_id, urlinfo.url);
                    }
                });
            })
        } else {
            return doGatewayDelete(gateway_id, gatewayUrl.url);
        }  
    })
}

function doGatewayDelete(gateway_id, gatewayUrl) {
    return vxg.api.cloud.getCamerasList({"meta": gateway_id, "detail":'detail'}).then(function(r){
        //var cameraIds = cameras.objects.map((cam) => cam.id);
        var gatewayUsername = "";
        var gatewayPassword = "";
        var cameras = r.objects;
        let currentCam;
        let promiseChain = Promise.resolve();        
        for (let i = 0; i < cameras.length; i++) { 
            currentCam = cameras[i];

            const makeNextPromise = (currentCam) => () => {
                var useGatewayUrl = currentCam.meta && (currentCam.meta.gateway_cam || currentCam.meta.gateway) ? gatewayUrl : null;
                if (currentCam.meta && currentCam.meta.gateway) {
                    gatewayUsername = currentCam.meta.gateway_username;
                    gatewayPassword = currentCam.meta.gateway_password;
                }
                var gatewayInfo = {
                    gatewayUsername: gatewayUsername,
                    gatewayPassword: gatewayPassword,
                    gatewayUrl: useGatewayUrl,
                    gatewayId: gateway_id
                }
                return vxg.cameras.removeCameraFromListPromise(currentCam.id, gatewayInfo)
                    .then((r) => {
                        if (i == cameras.length - 1) {
                            return vxg.api.cloud.restartGateway(gatewayInfo).then(function() {
                                location.reload();
                            });
                        }
                        return true;
                    }, function(err) {
                        console.log(err);
                        window.core.showToast('error');
                    });
            }
            promiseChain = promiseChain.then(makeNextPromise(currentCam))
        }
    });
}
