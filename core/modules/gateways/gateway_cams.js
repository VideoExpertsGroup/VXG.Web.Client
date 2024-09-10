window.screens = window.screens || {};
window.controls = window.controls || {};
window.dialogs = window.dialogs || {};
var path = window.core.getPath('gateway_cams.js');
window.screens['gateway_cams'] = {
    'header_name': $.t('gateways.gatewayCams'),
    'html': path+'gateway_cams.html',
    'css': [path+'gateway.css'],
    'commonjs':[],
    'stablecss':[],
    'js':[],
    'on_before_show':function(r){
        return defaultPromise();
    },
    'on_show':function(r, gatewayChannelId, gatewayToken, isOpenWRT){
        var self = this;
        self.gatewayId = $(this.src).getNearParentAtribute('gid');
        self.gatewayChannelId = !gatewayChannelId ? $(this.src).getNearParentAtribute('channel_id') : gatewayChannelId;
        self.gatewayToken = !gatewayToken ? $(this.src).getNearParentAtribute('gateway_token') : gatewayToken;
        self.isOpenWRT = !isOpenWRT ?  $(this.src).getNearParentAtribute('openwrt') : isOpenWRT;

        setTimeout(function(){onCameraScreenResize();},100);
        core.elements['header-search'].hide();
        if (core.elements['header-search']) core.elements['header-search'].find('input').val(this.search_text ? this.search_text : '');
        $('.addgatewaycams').attr("channel_id", self.gatewayChannelId);
        $('.addgatewaycams').attr("gateway_token", self.gatewayToken);
        $('.addgatewaycams').attr("openwrt", self.isOpenWRT);
        $('.addgatewaycams').addClass("disabled")
        $('#gatewaycams-table').bootstrapTable('destroy');
        this.loadGatewayCams()

        var cameraUrlsStr = sessionStorage.getItem("cameraUrls");
        var cameraUrls = cameraUrlsStr ? JSON.parse(cameraUrlsStr) : [];
        var savedCam = cameraUrls.length != 0 ? cameraUrls.find(x => x.id == self.gatewayChannelId) : "";
        if (savedCam && savedCam.url && savedCam.url != "nourl") {
            $('.addgatewaycams').removeClass("disabled")
        } else {
            return vxg.api.cloud.getCameraConfig(self.gatewayChannelId, self.gatewayToken).then(function(cam) {
                // check for openwrt?
                return vxg.api.cloud.getUplinkUrl(cam.id, cam.url).then(function(urlinfo) {
                    if (urlinfo.id && urlinfo.url) {
                        cameraUrls.push({id: urlinfo.id, url: urlinfo.url});
                        sessionStorage.setItem("cameraUrls", JSON.stringify(cameraUrls));  
                        $('.addgatewaycams').removeClass("disabled")
                    }
                });
            });
        }
    },
    'on_hide':function(){
    },
    'on_ready':function(){
    },
    'on_init':function(){
        let self = this;
        core.elements['header-right'].prepend('' +
        `<div class="transparent-button active addgatewaycams disabled" ifscreen="newcamera" onclick_toscreen="newcamera" channel_id="" gateway_token="" openwrt=""><span class="add-icon">+</span><span>${$.t('gateways.addCameraToGateway')}</span></div>`);
        return defaultPromise();
    },
    loadGatewayCams: function() {
        let self = this;
        //$('#gatewaycams-table').html('');
        self.wrapper.addClass('loader');
        var cameraList = localStorage.getItem('cameraList');
        if (cameraList) {
            var cams = JSON.parse(cameraList);
            self.createGatewayCamsTable(cams.objects, self);
        } else {
            vxg.cameras.getFullCameraList(500, 0).then(function() {
                var cameraList = localStorage.getItem('cameraList');
                var cams = JSON.parse(cameraList);
                self.createGatewayCamsTable(cams.objects, self);
            })
        }
         
        $(document).on('click', '.settings-gatewaycam', function(event){
            $(this).simpleMenuPlugin(event)
        });
    },
    createGatewayCamsTable: function(cameraList, self) {
        var count = 0;
        var gatewayCamsList = cameraList.filter(cam => { return cam.meta && cam.meta.gateway_cam && cam.meta.gateway_id == self.gatewayId});

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
                title: $.t('common.camera'),
            },
            {
                field: "status",
                title: $.t('common.status'),
                filterControl: "select",
                sortable: true,
                cardVisible: false,
            },
            {
                field: "recording",
                title: $.t('common.recording'),
                filterControl: "select",
                sortable: true,
                cardVisible: false
            },
            {
                field: "name",
                title: $.t('common.name'),
                filterControl: "input",
                sortable: true
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
        ]

        var tableData = [];
        gatewayCamsList.forEach(camInfo => {
            //var currentGateway = JSON.parse(camInfo.meta.gateway_first_channel);
            var channelID = camInfo.id;
            let captured = camInfo.meta && camInfo.meta.capture_id && vxg.user.src.capture_id == camInfo.meta.capture_id ? ' captured' : '';
            let statusBlock = '<div class="caminfo tablecaminfo '+camInfo.status+' '+(camInfo.status=='active'?' online':'')+'">'+ (camInfo.status=='active'?'Online':'Offline')+'</div>';
            tableData.push({
                camId: channelID,
                order: count + 1,
                id: `<div class="camerablock${captured}" access_token="${channelID}" id="scrollto${channelID}">
                <campreview onclick_toscreen="tagsview" style="cursor: pointer;"></campreview>`,
                status: statusBlock,
                recording: camInfo.recording?'yes':'no',
                name: camInfo.name,
                location: camInfo.meta && camInfo.meta.location ? camInfo.meta.location : "",
                group: camInfo.meta && camInfo.meta.group ? camInfo.meta.group : "",
                action: `<div class="settings-gatewaycam" access_token="${camInfo.token}" cam_order="${count+1}" cam_id="${channelID}" gateway_id="${self.gatewayId}" gateway_channel_id="${self.gatewayChannelId}" gateway_token="${self.gatewayToken}" openwrt="${self.isOpenWRT}">
                <svg class="inline-svg-icon icon-action"><use xlink:href="#action"></use></svg>
            </div>`,
                hide: 1
            })
            count++;
        });

        if (count == 0) {
            self.wrapper.addClass('nogatewaycams');
            $('#nogatewaycams').show();
            self.wrapper.removeClass('loader');
            return;
        } else {
            self.wrapper.removeClass('nogatewaycams');
            $('#nogatewaycams').hide();
        }
        
        $('#gatewaycams-table').bootstrapTable({
            pagination: true,
            showToggle: true, 
            showSearchClearButton: true,
            useRowAttrFunc: true,
            filterControl: true,
            //reorderableRows: !isGridView,
            //toolbar: ".toolbar",
            uniqueId: "order",
            columns: columns,
            sortName: 'order',
            sortOrder: localStorage.tableOrder,
            //cardView: isGridView,
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

        $('#gatewaycams-table').bootstrapTable('load', tableData);
        $('#gatewaycams-table').removeClass("table-bordered");

        setTimeout(function() {
            var inputs = $("#gatewaycams-table").find('.bootstrap-table-filter-control-name');
            for (var i = 0; i < inputs.length; i++) {
                $(inputs[i]).attr("autocomplete", "off");
            }
            $('.bootstrap-table-filter-control-hide').val('1');
        }, 500);

        self.wrapper.removeClass('nogatewaycams');
        self.wrapper.removeClass('loader');

        
        return vxg.api.cloud.getCameraStatusChange(self.gatewayId).then(function(changedCams) {
            // updateCell, index, fieldName
            var tableData = $("#gatewaycams-table").bootstrapTable('getData');
            for (var i = 0; i < changedCams.length; i++) {
                var rowIndex = tableData.findIndex((cam) => cam.camId == changedCams[i].id);
                var statusBlock ='<div class="font-md caminfo tablecaminfo '+changedCams[i].status+' '+(changedCams[i].status=='active'?' online':'')+'">'+ (changedCams[i].status=='active'?$.t('common.online'):$.t('common.offline'))+'</div>';
                $("#gatewaycams-table").bootstrapTable('updateCell', {
                    index: rowIndex,
                    field: "status",
                    value: statusBlock
                });
            }
        })
    }
};