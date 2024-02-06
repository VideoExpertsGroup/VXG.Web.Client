window.screens = window.screens || {};
window.controls = window.controls || {};
window.dialogs = window.dialogs || {};
var path = window.core.getPath('dvr_nvr.js');
window.screens['recorders'] = {
    'menu_weight': 31,
    'menu_name': $.t('recorders.title'),
    'get_args':function(){
    },
    'menu_icon': '<i class="fa fa-building" aria-hidden="true"></i>',
    'html': path+'dvr_nvr.html',
    'css':[path+'dvr_nvr.css'],
    'js':[],
    'on_before_show':function(r){
        return defaultPromise();
    },
    'on_show':function(r){
        setTimeout(function(){onCameraScreenResize();},100);

        core.elements['header-search'].hide();
        //if (core.elements['header-search']) core.elements['header-search'].find('input').val(this.search_text ? this.search_text : '');
        return this.loadDVRs()
    },
    'on_hide':function(){
    },
    'on_ready':function(){
    },
    'on_init':function(){
        let self = this;
        core.elements['header-right'].prepend(`<div class="transparent-button active adddvr" ifscreen="add_dvr" onclick_toscreen="add_dvr"><span class="add-icon">+</span><span>${$.t('recorders.addRecorder')}</span></div>`);
        return defaultPromise();
    },
    loadDVRs: function() {
        let self = this;
        $('.dvrlist').html("");  
        self.wrapper.addClass('loader');
        var cameraList = localStorage.getItem('cameraList');
        if (cameraList) {
            var cams = JSON.parse(cameraList);
            self.createDVRTable(cams.objects, self);
        } else {
            vxg.cameras.getFullCameraList(500, 0).then(function() {
                var cameraList = localStorage.getItem('cameraList');
                var cams = JSON.parse(cameraList);
                self.createDVRTable(cams.objects, self);
            })
        }
         
         $(document).on('click', '.settings-dvr', function(event){
            $(this).simpleMenuPlugin_DVR(event)
        });
    },
    createDVRTable: function(cameraList, self) {
        var count = 0;
        var dvrsList = cameraList.filter(cam => { return cam.meta && cam.meta.dvr_first_channel != undefined });

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
                title: $.t('common.recorder'),
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
                title: $.t('common.action')
            },
        ];

        var tableData = [];
        dvrsList.forEach(camInfo => {
            var currentDvr = JSON.parse(camInfo.meta.dvr_first_channel);
            let captured = camInfo.meta.capture_id && vxg.user.src.capture_id == camInfo.meta.capture_id ? ' captured' : '';
            tableData.push({
                order: count + 1,
                id: `<div class="camerablock${captured}" access_token="${camInfo.id}" id="scrollto${camInfo.id}">
                <campreview onclick_toscreen="tagsview"></campreview>`,
                name: currentDvr.name,
                location: camInfo.meta.location,
                group: camInfo.meta.group,
                action: `<div class="settings-dvr" dvr_id="${currentDvr.id}" dvr_url="${currentDvr.url}">
                <svg class="inline-svg-icon icon-action"><use xlink:href="#action"></use></svg>
            </div>`
            })
            count++;
        });

        if (count == 0) {
            self.wrapper.addClass('nodvrs');
            $('#dvr-table').html(`<div class="no-recorders"><p>${$.t('recorders.noRecorders')}</p></div>`);
            self.wrapper.removeClass('loader');
            return;
        } 
        
        $('#dvr-table').bootstrapTable({
            pagination: true,
            showToggle: true, 
            showSearchClearButton: true,
            reorderableRows: true,
            useRowAttrFunc: true,
            filterControl: true,
            uniqueId: "order",
            columns: columns,
            sortName: 'order',
            onColumnSearch: function (arg1, arg2) {
            if (arg1 == 'location')
                localStorage.camera_location = arg2;
            if (arg1 == 'group')
                localStorage.camera_group = arg2;
            }
        });

        $('#dvr-table').bootstrapTable('load', tableData);
        $('#dvr-table').removeClass("table-bordered");

        self.wrapper.removeClass('nodvrs');
        self.wrapper.removeClass('loader');
    },
    loadBootstrapTable: function(columns, tableData) {
        $('#dvr-table').bootstrapTable({
            pagination: true,
            showToggle: true, 
            showSearchClearButton: true,
            useRowAttrFunc: true,
            filterControl: true,
            toolbar: ".toolbar",
            uniqueId: "order",
            columns: columns,
            sortName: 'order',
            onColumnSearch: function (arg1, arg2) {
            if (arg1 == 'location')
                localStorage.camera_location = arg2;
            if (arg1 == 'group')
                localStorage.camera_group = arg2;
            }
        });

        $('#dvr-table').bootstrapTable('load', tableData);
    }
};

function addCameraNamesInput(cameraInfo = null) {
    var cameraCount = parseInt($("#cameraCount").val());
    var camerasHtml = '';
    for (let i = 1; i <= cameraCount; i++) {
        var camName = cameraInfo ? cameraInfo[i-1].name : "";
        var camId = cameraInfo ? cameraInfo[i-1].id : "";

        camerasHtml += `
            <div class="dvr-input-wrapper">
                <label class="dvr-label cameras-label" for="cameraName${i}">${$.t('common.cameraName')} ${i}</label>
                <input class="dvr-input cameras-input required" name="cameraName${i}" type="text" value="${camName}"> 
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

function onDVRDelete(dvrId){
    setTimeout(function(){$('.simplemenu').remove();},10);
    dialogs['mdialog'].activate(`<h7>${$.t('recorders.deleteConfirm.title')}</h7><p>${$.t('recorders.deleteConfirm.content')} </p><div class="action-btns modal-actions"><button name="cancel" class="vxgbutton">${$.t('action.cancel')}</button><button name="delete" class="vxgbutton delete-btn bg-danger">${$.t('action.delete')}</button></div>`).then(function(r){
        if (r.button!='delete') return;
        core.elements['global-loader'].show();
        return vxg.api.cloud.getCamerasList({"meta": dvrId, "detail":'detail'}).then(function(cameras){
            var cameraIds = cameras.objects.map((cam) => cam.id);
            let currentCamId;
            let promiseChain = Promise.resolve();
            for (let i = 0; i < cameraIds.length; i++) { 
                currentCamId = cameraIds[i];
    
                const makeNextPromise = (currentCamId) => () => {
                    return vxg.cameras.removeCameraFromListPromise(currentCamId)
                        .then((r) => {
                            if (i == cameraIds.length - 1) {
                                location.reload();
                            }
                            return true;
                        });
                }
                promiseChain = promiseChain.then(makeNextPromise(currentCamId))
            }
        });
    
    })
}

(function( $ ){

    $.fn.simpleMenuPlugin_DVR = function(e) {
  
          var self = this;
          let dvrid = $(this).attr("dvr_id");
          let url = $(this).attr("dvr_url")
  
          var menu =  $(`
          <div class="simplemenu">
          <div class="listmenu-item dvr-menu mwebui_dvr"> <a id="ui-link" href="${url}" target="_blank"><i class="fa fa-window-restore" aria-hidden="true"></i> <span class="listitem-name"> ${$.t('common.recorderUI')} </span></a></div>
          <div class="listmenu-item dvr-menu mconfigure_dvr" ifscreen="add_dvr" onclick_toscreen="add_dvr" editdvr="${dvrid}"><i class="fa fa-wrench" aria-hidden="true"></i> <span class="listitem-name"> ${$.t('common.config')} </span></div>
          <div class="listmenu-item dvr-menu mtrash_dvr" onclick="onDVRDelete('${dvrid}')"><i class="fa fa-trash-o" aria-hidden="true"></i> <span class="listitem-name"> ${$.t('action.remove')} </span></div>
          </div>`);
  
          addSimpleMenu(menu, self, e);

      //});
    };
  })( jQuery );