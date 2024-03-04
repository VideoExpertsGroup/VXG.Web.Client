window.screens = window.screens || {};
var path = window.core.getPath('notes.js');

window.screens['notes'] = {
    'menu_weight':51,
    'menu_name': $.t('notes.title'),
    'get_args':function(){
    },
    'menu_icon': '<i class="fa fa-sticky-note" aria-hidden="true"></i>',
    'html': path+'notes.html',
    'css':[path+'notes.css',
	path+'../../common/VXGActivity/VXGActivityCollection.css',
    ],
    'stablecss':[
    ],
    'commoncss':[
	'VXGActivity/VXGActivity.css'
    ],
    'commonjs':[
	'VXGActivity/VXGActivity.js'
    ],
    'js': [
    ],
    'on_search':function(text){
    },
    'on_before_show':function(r){
        return defaultPromise();
    },
    'on_show':function(r){
        if (core.elements['header-search']) core.elements['header-search'].find('input').val(this.search_text ? this.search_text : '');
        return defaultPromise();
    },
    'on_hide':function(){
    },

    'on_ready':function(){
        let self = this;

        vxg.api.cloud.getAllNotes(vxg.user.src.allCamsToken).then(ret => {
            var notesList = ret.objects;
            if (notesList.length > 0) {
                $('.nonotes').hide();
                var columns = [
                    {
                        field: "order",
                        class: "ordering",
                        sortable: true,
                        width: "100"
                    },
                    {
                        field: "camera",
                        title: $.t('common.camera'),
                        width: "140",
                    },
                    {
                        field: "time",
                        title: $.t('common.time'),
                        filterControl: "input",
                        sortable: true,
                        sorter: timeSorting(),
                        width: "200"
                    },
                    {
                        field: "title",
                        title: $.t('common.title'),
                        filterControl: "input",
                        sortable: true,
                        width: "200"
                    },
                    {
                        field: "description",
                        title: $.t('common.description'),
                        filterControl: "input",
                        sortable: true
                    }
                ];

                var tableData = [];
                var order = 1;
                notesList.forEach(note => {
                    var cachedCams = localStorage.cameraList ? JSON.parse(localStorage.cameraList).objects : [];
                    var camera = cachedCams.filter(cam => cam.id == note.camid);
                    var cameraListed = note.camid;
                    var timestamp = Math.floor(new Date(note.timestamp).getTime())
                    if (camera.length > 0) {
                        let captured = camera[0].meta &&  camera[0].meta.capture_id && vxg.user.src.capture_id ==  camera[0].meta.capture_id ? ' captured' : '';
                        cameraListed = `<div class="camerablock${captured}" notetime="${timestamp}" access_token="${note.camid}">
                        <campreview onclick_toscreen="tagsview" notetime="${timestamp}"></campreview>`
                    }

                    tableData.push({
                        order: order,
                        camera: cameraListed,
                        time: new Date(note.timestamp).toLocaleString().replace(",", ""),
                        title: note.string.case,
                        description: note.string.description
                    })
                    order++;
                });

                $('#notesTable').bootstrapTable({
                    pagination: true,
                    showToggle: false, 
                    showSearchClearButton: true,
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
                    if (arg1 == 'title')
                        localStorage.setItem("title", arg2);
                    if (arg1 == 'description')
                        localStorage.setItem("description", arg2);
                    }
                });
                $("#notesTable").bootstrapTable('load', tableData);
                $('.noteslist').show();
            }
        }, function(err) {
            console.log(err.responseText);
            return;
        });
    },
    'on_init':function(){
        return defaultPromise();
    }, 
};

function timeSorting(a, b) {
    if (new Date(a) < new Date(b)) return 1;
    if (new Date(a) > new Date(b)) return -1;
    return 0;
}
