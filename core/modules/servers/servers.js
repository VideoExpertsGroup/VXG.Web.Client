window.screens = window.screens || {};
var path = window.core.getPath('servers.js');

var servermenu = ''
    + '<div class="msetting svgbtnbeforehover font-md" onclick="onServerConfig(this)">Config</div>'
    + '<div class="mtrash svgbtnbeforehover font-md" onclick="onServerDelete(this)">Remove</div>';
var servermenu2 = ''
    + '<div class="mtrash svgbtnbeforehover font-md" onclick="onServerDelete(this)">Remove</div>';

function onServerConfig(e){
    setTimeout(function(){$('.simplemenu').remove();},10);
    let l = e.parentElement.parentElement.getAttribute('href');
    window.open(l,'_blank');
}
function onServerDelete(e){
    setTimeout(function(){$('.simplemenu').remove();},10);
    let serverid = e.parentElement.parentElement.getAttribute('serverid');
    let servername = e.parentElement.parentElement.getAttribute('servername');
    dialogs['mdialog'].activate('<h7>Do you want to delete server with name<br/>'+servername+'?</h7><p>It can\'t be cancelled </p><p><button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;<button name="delete" class="vxgbutton">Delete</button></p>').then(function(r){
        if (r.button!='delete') return;

        core.elements['global-loader'].show();
        vxg.cameras.deleteServerPromise(serverid).then(function(r){
            core.elements['global-loader'].hide();
            updateServerBootstrapTable("#serverlist_table", serverid)
            dialogs['idialog'].activate('The server<br/>successfully removed');
            return screens['servers'].on_show();
        },function(r){
            if (r && r.responseJSON && r.responseJSON.errorDetail) alert(r.responseJSON.errorDetail);
            else alert('Fail to remove server');
            core.elements['global-loader'].hide();
        });

    });
}

function updateServerBootstrapTable(tableId, serverId) {
    var tableData = $(tableId).bootstrapTable("getData");

    var serverToRemove = tableData.filter(t => t.serverid == serverId); 
    if (serverToRemove.length == 0) return;
    var serverOrder = serverToRemove[0].order;

    if (serverOrder) $(tableId).bootstrapTable('removeByUniqueId', serverOrder);

   /* while (serverOrder < tableData.length) {
        $(tableId).bootstrapTable('updateCell', {index: serverOrder-1, field: 'order', value: serverOrder.toString()});
        var serverIdCurr = tableData[serverOrder-1].serverId;
        $("input.groupserverCheck[server_id='"+serverIdCurr+"']").attr("server_order", serverOrder);
        $("div.settings[server_id='"+serverIdCurr+"']").attr("server_order", serverOrder);
        serverOrder++;
    } */
}

(function( $ ){

  $.fn.simpleMenuPlugin_servers = function(menu) {
    let _menu = menu;

    this.click(function(e){
        $('.simplemenu').remove();
        let self = this;
        let el = $(this).find('.simplemenu');
        if (!el.length) {
            $(this).append('<div class="simplemenu">'+menu+'</div>');
            el = $(this).find('.simplemenu');
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

    });
  };
})( jQuery );

window.screens['servers'] = {
    'menu_weight': 21,
    'menu_name':$.t('servers.title'),
    'get_args':function(){
    },
    'stablecss':[path+'sserver.css'],
    'menu_icon': '<i class="fa fa-server" aria-hidden="true"></i>',
    'html': path+'servers.html',
    'css':[path+'servers.css'],
    'on_search':function(text){
    },
    'on_show':function(r){
        let self=this;
        self.wrapper.addClass('loader');
        self.wrapper.removeClass('noservers');
        this.wrapper.find('.bootstrap-table').remove();
        this.wrapper.find('.clearfix').remove();
        let el = this.wrapper.find('.serverlist');
        el.append('<table id="serverlist_table" class="font-md"></table>');
        return vxg.cameras.getServersListPromise().then(function(serverlist){
            self.wrapper.removeClass('loader');
            if (serverlist.data.length === 0){
                self.wrapper.addClass('noservers');
                $('.addserver').click(function(){
                    dialogs['mdialog'].activate('<h7>Enter the server UUID</h7><p></p><p><input name="uuid"/><br/><button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;<button name="add" class="vxgbutton">Add server</button></p>').then(function(r){
                        if (r.button!='add') return;
                        core.elements['global-loader'].show();
                        let uuid = r.form.uuid;
                        self.addServer(uuid);
                    });
                });
                return;
            }
//             for (let i=0;i<serverlist.data.length;i++){
//                 let l = '<div class="preview"></div>';
// //                if (serverlist.data[i]['endpoint']) l = '<a href="'+serverlist.data[i]['endpoint']+'" target="_blank" class="preview"></a>';
//                 if (serverlist.data[i]['endpoint']) l = '<div serverid="'+serverlist.data[i]['id']+'" servername="'+serverlist.data[i]['name']+'" class="preview active"></div>';
//                 let s = 'on';
//                 html += '<div><div class="serverstatus'+(serverlist.data[i]['online']?' online':'')+'">'+(serverlist.data[i]['online']?'online':'offline')+
//                     '</div>'+l+'<div class="desc cameras"><div serverid="'+serverlist.data[i]['id']+'" class="settings '+(serverlist.data[i]['endpoint']?'active':'')+'" href="'
//                     +serverlist.data[i]['endpoint']+'" servername="'+serverlist.data[i]['name']+'"></div>'+'<div class="name">'+serverlist.data[i]['name']+'</div><div class="expires">'+(serverlist.data[i]['expires']||'')+'</div></div></div>'
//             }
//             el.html(html);
//             el.find('.preview.active').click(function(){
//                 let serverid = parseInt($(this).attr('serverid'));
//                 let servername = $(this).attr('servername');
//                 window.screens['servercameras'].activate(serverid, servername);
//             });
//             el.find('.settings.active').simpleMenuPlugin(servermenu);
//             el.find('.settings:not(.active)').simpleMenuPlugin(servermenu2);
// /*
//             el.find('.settings').click(function(){
//                 let ref = parseInt($(this).attr('href'));
//                 let serverid = $(this).attr('serverid');
// //                window.screens['servercameras'].activate(serverid, servername);
//             });
// */
            let columns = [
                {
                    field: "order",
                    sortable: true,
                },
                {
                    field: "id",
                    width: "140",
                    title: $.t('servers.title'),
                },
                {
                    field: "name",
                    title: $.t("common.name"),
                    filterControl: "input",
                    sortable: true,
                },
                {
                    field: "status",
                    title: $.t("common.status"),
                    filterControl: "select",
                    sortable: true,
                    class: 'status',
                },
                {
                    field: "expires",
                    title: $.t("common.expires"),
                    sortable: true,
                },
                {
                    field: "action",
                    title: $.t("common.actionTitle"),
                    class: 'action',
                },
                {
                    field: "hide",
                    title: "hide",
                    filterControl: "input",
                }
            ];
            let tableData = [];
            var serverIds = [];
            for (let i = 0; i < serverlist.data.length; i++) {
                var serverId = serverlist.data[i]["id"]
                serverIds.push(serverId);
                tableData.push({
                    order: i + 1,
                    id: `<div class="camerablock captured" thumbnail_id="${serverId}" access_token="">
                    <campreview onclick_toscreen="servercameras" server_id="${serverId}" server_name="${serverlist.data[i]["name"]}" style="cursor: pointer;"></campreview>`,
                    name: serverlist.data[i]["name"],
                    status: `<div class="serverstatus ${serverlist.data[i]["online"] ? "online" : ""}">${serverlist.data[i]["online"] ? "online" : "offline"}</div>`,
                    expires: serverlist.data[i]["expires"] || "",
                    action: `<div serverid="${serverlist.data[i]["id"]}" class="settings ${serverlist.data[i]["endpoint"] ? "active" : ""}" href="${serverlist.data[i]["endpoint"]}" servername="${serverlist.data[i]["name"]}"><svg class="inline-svg-icon icon-action"><use xlink:href="#action"></use></svg></div>`,
                    endpoint: serverlist.data[i]["endpoint"],
                    serverid: serverId,
                    hide: 1
                });
            }

            function rowAttributes(row, index) {
                return {
                  'class': `preview ${row.endpoint ? 'active' : ''}`,
                  'serverid': row.serverid,
                  'servername': row.name,
                }
            }
            $("#serverlist_table").bootstrapTable({
                pagination: true,
                filterControl: true,
                columns: columns,
                sortName: 'order',
                sortOrder: 'asc',
                uniqueId: 'order',
                data: tableData,
                rowAttributes
            });

            let promiseChain = Promise.resolve();
            for (let i = 0; i < serverIds.length; i++) { 
                currentServer = serverIds[i];

                const makeNextPromise = (currentServer) => () => {
                    return vxg.cameras.getServerCamerasListPromise(currentServer).then(serverCams => {
                        var cameraBlockToken = serverCams && serverCams.length > 0 ? serverCams[0].src.token : "";
                        $(`[thumbnail_id="${currentServer}"]`).attr("access_token", cameraBlockToken);
                        return true;
                    });
                }
                promiseChain = promiseChain.then(makeNextPromise(currentServer))
            }

            setTimeout(
                function () {
                    /*el.find('tr.preview.active').click(function() {
                        let serverid = parseInt($(this).attr('serverid'));
                        let servername = $(this).attr('servername');
                        window.screens['servercameras'].activate(serverid, servername);
                    });*/
                    var inputs = $("#serverlist_table").find('.bootstrap-table-filter-control-name');
                    for (var i = 0; i < inputs.length; i++) {
                        $(inputs[i]).attr("autocomplete", "off");
                    }
                    $('.bootstrap-table-filter-control-hide').val('1');
                    el.find('.settings.active').simpleMenuPlugin_servers(servermenu);
                    el.find('.settings:not(.active)').simpleMenuPlugin_servers(servermenu2);
                }, 500
            );
        },function(){
            self.wrapper.addClass('noservers');
            $('.addserver').click(function(){
                dialogs['mdialog'].activate('<h7>Enter the server UUID</h7><p></p><p><input name="uuid"/><br/><button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;<button name="add" class="vxgbutton">Add server</button></p>').then(function(r){
                    if (r.button!='add') return;
                    core.elements['global-loader'].show();
                    let uuid = r.form.uuid;
                    self.addServer(uuid);
                });
            });
            self.wrapper.removeClass('loader');
        });
        return defaultPromise();
    },
    'on_hide':function(){
    },
    'on_ready':function(){
    },
    'on_init':function(){
        let self = this;
        core.elements['header-right'].prepend('' +
            '<div class="transparent-button active addserver" ><span class="add-icon">+</span><span data-i18n="servers.add">' + $.t('servers.add') + '</span></div>');
        core.elements['header-right'].prepend('' +
            '<a class="server-download" href="https://dashboard.videoexpertsgroup.com/downloads/gateway/" target="_blank" data-i18n="servers.downloadPackage">' + $.t('servers.downloadPackage') + '</a>');
        $('.addserver').click(function(){
            dialogs['mdialog'].activate('<h7>Enter the server UUID</h7><p></p><p><input name="uuid"/><br/><button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;<button name="add" class="vxgbutton">Add server</button></p>').then(function(r){
                if (r.button!='add') return;
                core.elements['global-loader'].show();
                let uuid = r.form.uuid;
                self.addServer(uuid);
            });
        });

        return defaultPromise();
    },
    addServer: function(uuid) {
        let self = this;
        vxg.cameras.addServerPromise(uuid).then(function(r){
            core.elements['global-loader'].hide();
            dialogs['idialog'].activate('The server<br/>successfully added');
            var tableData = $("#serverlist_table").bootstrapTable('getData');
            if (tableData.length == 0) {
                location.reload();
            }

            var insertIndex = tableData.length;
            var order = insertIndex + 1;
            $("#serverlist_table").bootstrapTable('insertRow', {
                index: insertIndex,
                row: {
                    order: order,
                    id: `<div class="camerablock captured" thumbnail_id="${r.server.id}" access_token="">
                    <campreview onclick_toscreen="servercameras" server_id="${r.server.id}" server_name="${r.server.name}" style="cursor: pointer;"></campreview>`,
                    name: r.server.name ? r.server.name : "Server " + r.server.uuid,
                    status: `<div class="serverstatus ${r.server.online ? "online" : ""}">${r.server.online ? "online" : "offline"}</div>`,
                    expires: "",
                    action: `<div serverid="${r.server.id}" class="settings ${r.server.endpoint ? "active" : ""}" href="${r.server.endpoint ? r.server.endpoint : ""}" servername="${r.server.name}"></div>`,
                    endpoint: r.server.endpoint ? r.server.endpoint : "",
                    serverid: r.server.id,
                }
            })
             
           self.on_show();
        },function(r){
            if (r && r.responseJSON && r.responseJSON.errorDetail) alert(r.responseJSON.errorDetail);
            else alert('Fail to add server');
            core.elements['global-loader'].hide();
        });
    }
};

window.screens['servercameras'] = {
    'html': path+'servercameras.html',
    'css':[path+'servercameras.css'],
    'js':[],
    'on_show':function(serverid, servername){
        let s_id = serverid ? serverid : $(this.src).attr('server_id');
        let s_name = servername ? servername : $(this.src).attr('server_name');
	core.elements['header-center'].text(s_name||'server');
        this.loadCameras(s_id);
    },
    loadCameras: function(serverid){
        if (this.camera_list_promise) return this.camera_list_promise;

        let self = this;
        let el = this.wrapper.find('.camlist');
        el.html('');
        self.wrapper.addClass('loader');
        this.camera_list_promise = vxg.cameras.getServerCamerasListPromise(serverid).then(function(list){
            self.camera_list_promise=undefined;
            let h='';
            self.last_offset += list.length;
            let count = 0;
            if (list.length == 0) {
                el.html(`<h5 class="font-md noservercams">${$.t('servers.noServerCams')}.</h5>`);
                self.wrapper.removeClass('loader');
                return;
            }
            for (let i in list){
                if (list[i].src.name.substr(0,11)=="#StorageFor" && !isNaN(parseInt(list[i].src.name.substr(11)))) continue;
                if (list[i].src && list[i].src.meta && list[i].src.meta.isstorage) continue;
                let captured = list[i].src && list[i].src.meta && list[i].src.meta.capture_id && vxg.user.src.capture_id == list[i].src.meta.capture_id ? ' captured' : '';
                let info = '<div class="caminfo '+list[i].src.status+' '+(list[i].src.recording?'rec':'')+(list[i].src.status=='active'?' online':'')+'">'+(list[i].src.recording?'Online':(list[i].src.status=='active'?'Online':'Offline'))+'</div>';
                if (!list[i].src || list[i].src.status===undefined) info='';
                h += '<div class="camerablock'+captured+'" camera_name="'+list[i].src.name+'" access_token="'+list[i].src.token+'">'+info+'<campreview onclick_toscreen="player"></campreview><div><div class="settings"></div><div class="name name'+list[i].getChannelID()+'">'+list[i].src.name+'</div><div class="loc loc'+list[i].getChannelID()+'">'+list[i].getLocation()+'</div></div></div>';
                count++;
            }
            self.wrapper.removeClass('loader');
            el.html(h); 
        });
    },
    'on_hide':function(){
    },
    'on_ready':function(){
        let self = this;
    },
    'on_init':function(){
        let self=this;
        return defaultPromise();
    }
};