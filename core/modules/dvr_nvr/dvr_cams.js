window.screens = window.screens || {};
window.controls = window.controls || {};
window.dialogs = window.dialogs || {};
var path = window.core.getPath('dvr_cams.js');
window.screens['dvr_cams'] = {
    'header_name': $.t('recorders.recorderCams'),
    'html': path+'dvr_cams.html',
    'css': [path+'dvr_nvr.css'],
    'commonjs':[],
    'stablecss':[],
    'js':[],
    'on_before_show':function(r){
        return defaultPromise();
    },
    'on_show':function(r, dvrId){
        var self = this;
        self.dvrId = !dvrId ? $(this.src).getNearParentAtribute('dvr_id') : dvrId;

        setTimeout(function(){onCameraScreenResize();},100);
        core.elements['header-search'].hide();
        if (core.elements['header-search']) core.elements['header-search'].find('input').val(this.search_text ? this.search_text : '');
       
        return this.loadRecorderCams()
    },
    'on_hide':function(){
    },
    'on_ready':function(){
    },
    'on_init':function(){
        let self = this;
        return defaultPromise();
    },
    loadRecorderCams: function() {
        let self = this;
        self.wrapper.addClass('loader');
        var cameraList = localStorage.getItem('cameraList');
        if (cameraList) {
            var cams = JSON.parse(cameraList);
            var dvrCams = cams.objects.filter(cam => { return cam.meta && cam.meta.dvr_id == self.dvrId})
            self.createRecorderCamsTable(dvrCams, self);
        } else {
            vxg.api.cloud.getCamerasList({meta: dvrId}).then(function(cams) {
                self.createRecorderCamsTable(cams.objects, self);
            })
        }
         
        $(document).on('click', '.settings-dvrcam', function(event){
            $(this).simpleMenuPlugin(event)
        });
    },
    createRecorderCamsTable: function(dvrCams, self) {
        var count = 0;
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
        ]

        var tableData = [];
        dvrCams.forEach(camInfo => {
            var channelID = camInfo.id;
            let captured = camInfo.meta.capture_id && vxg.user.src.capture_id == camInfo.meta.capture_id ? ' captured' : '';
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
                action: `<div class="settings-dvrcam" access_token="${camInfo.token}" cam_id="${channelID}">
                <svg class="inline-svg-icon icon-action"><use xlink:href="#action"></use></svg>
            </div>`
            })
            count++;
        });

        if (count == 0) {
            self.wrapper.addClass('nodvrcams');
            $('#nodvrcams').show();
            self.wrapper.removeClass('loader');
            return;
        } else {
            self.wrapper.removeClass('nodvrcams');
            $('#nodvrcams').hide();
        }
        
        $('#dvrcams-table').bootstrapTable({
            pagination: true,
            showToggle: true, 
            showSearchClearButton: true,
            useRowAttrFunc: true,
            filterControl: true,
            uniqueId: "order",
            columns: columns,
            sortName: 'order',
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

        $('#dvrcams-table').bootstrapTable('load', tableData);
        $('#dvrcams-table').removeClass("table-bordered");

        self.wrapper.removeClass('nodvrcams');
        self.wrapper.removeClass('loader');
    }
};