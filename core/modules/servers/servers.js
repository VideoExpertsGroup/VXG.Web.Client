window.screens = window.screens || {};
var path = window.core.getPath('servers.js');

var servermenu = ''
    + '<div class="msetting svgbtnbeforehover" onclick="onServerConfig(this)">Config</div>'
    + '<div class="mtrash svgbtnbeforehover" onclick="onServerDelete(this)">Remove</div>';
var servermenu2 = ''
    + '<div class="mtrash svgbtnbeforehover" onclick="onServerDelete(this)">Remove</div>';

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
            dialogs['idialog'].activate('The server<br/>successfully removed');
            return screens['servers'].on_show();
        },function(r){
            if (r && r.responseJSON && r.responseJSON.errorDetail) alert(r.responseJSON.errorDetail);
            else alert('Fail to remove server');
            core.elements['global-loader'].hide();
        });

    });
}

(function( $ ){

  $.fn.simpleMenuPlugin = function(menu) {
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
    'menu_name':'Servers',
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
        let el = this.wrapper.find('.serverlist');
        el.html('');
        return vxg.cameras.getServersListPromise().then(function(serverlist){
            self.wrapper.removeClass('loader');
            let html = '';
            if (!serverlist.data.length){
                el.html('There are no servers.');
                self.wrapper.addClass('noservers');
                return;
            }
            for (let i=0;i<serverlist.data.length;i++){
                let l = '<div class="preview"></div>';
//                if (serverlist.data[i]['endpoint']) l = '<a href="'+serverlist.data[i]['endpoint']+'" target="_blank" class="preview"></a>';
                if (serverlist.data[i]['endpoint']) l = '<div serverid="'+serverlist.data[i]['id']+'" servername="'+serverlist.data[i]['name']+'" class="preview active"></div>';
                let s = 'on';
                html += '<div><div class="serverstatus'+(serverlist.data[i]['online']?' online':'')+'">'+(serverlist.data[i]['online']?'online':'offline')+
                    '</div>'+l+'<div class="desc cameras"><div serverid="'+serverlist.data[i]['id']+'" class="settings '+(serverlist.data[i]['endpoint']?'active':'')+'" href="'
                    +serverlist.data[i]['endpoint']+'" servername="'+serverlist.data[i]['name']+'"></div>'+'<div class="name">'+serverlist.data[i]['name']+'</div><div class="expires">'+(serverlist.data[i]['expires']||'')+'</div></div></div>'
            }
            el.html(html);
            el.find('.preview.active').click(function(){
                let serverid = parseInt($(this).attr('serverid'));
                let servername = $(this).attr('servername');
                window.screens['servercameras'].activate(serverid, servername);
            });
            el.find('.settings.active').simpleMenuPlugin(servermenu);
            el.find('.settings:not(.active)').simpleMenuPlugin(servermenu2);
/*
            el.find('.settings').click(function(){
                let ref = parseInt($(this).attr('href'));
                let serverid = $(this).attr('serverid');
//                window.screens['servercameras'].activate(serverid, servername);
            });
*/
        },function(){
            el.html('There are no servers.');
            self.wrapper.addClass('noservers');
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
            '<div class="transparent-button active addserver" ><span class="add-icon">+</span><span>Add server</span></div>');
        core.elements['header-right'].prepend('' +
            '<a class="server-download" href="https://dashboard.videoexpertsgroup.com/downloads/gateway/" target="_blank">Download Package</a>');
        core.elements['header-right'].find('.addserver').click(function(){
            dialogs['mdialog'].activate('<h7>Enter the server UUID</h7><p></p><p><input name="uuid"/><br/><button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;<button name="add" class="vxgbutton">Add server</button></p>').then(function(r){
                if (r.button!='add') return;
                core.elements['global-loader'].show();
                let uuid = r.form.uuid;
                vxg.cameras.addServerPromise(uuid).then(function(r){
                    core.elements['global-loader'].hide();
                    dialogs['idialog'].activate('The server<br/>successfully added');
                    self.on_show();
                },function(r){
                    if (r && r.responseJSON && r.responseJSON.errorDetail) alert(r.responseJSON.errorDetail);
                    else alert('Fail to add server');
                    core.elements['global-loader'].hide();
                });
            });
        });

        return defaultPromise();
    }
};

window.screens['servercameras'] = {
    'html': path+'servercameras.html',
    'css':[path+'servercameras.css'],
    'js':[],
    'on_show':function(serverid, servername){
	core.elements['header-center'].text(servername||'server');
        this.loadCameras(serverid);
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