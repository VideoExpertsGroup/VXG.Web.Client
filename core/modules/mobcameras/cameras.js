window.screens = window.screens || {};
var path = window.core.getPath('cameras.js');

var menu =  `
        <div class="listmenu-item mcamera" onclick_toscreen="player"><i class="fa fa-video-camera" aria-hidden="true"></i> <span class="listitem-name"> ${$.t('common.timeline')} </span> </div>'
        <div class=" listmenu-item msetting" ifscreen="camerasettings" onclick_toscreen="camerasettings"><i class="fa fa-cog" aria-hidden="true"></i> <span class="listitem-name"> ${$.t('common.camera')} </span></div>'
        <div class=" listmenu-item mchart" ifscreen="camerameta" onclick_toscreen="camerameta"><i class="fa fa-bar-chart" aria-hidden="true"></i> <span class="listitem-name"> ${$.t('common.metadata')} </span></div>'
        <div class=" listmenu-item mconfigure" ifscreen="addcamera" onclick_toscreen="addcamera"><i class="fa fa-wrench" aria-hidden="true"></i> <span class="listitem-name"> ${$.t('common.config')} </span></div>'
        <div class=" listmenu-item mtrash" ifscreen="removecamera" onclick_toscreen="removecamera"><i class="fa fa-trash-o" aria-hidden="true"></i> <span class="listitem-name"> ${$.t('action.remove')} </span></div>`

(function( $ ){

  $.fn.simpleMenuPlugin = function(menu) {
    let _menu = menu;

    this.click(function(e){
        let el = $(this).find('.simplemenu');
        if (!el.length) {
            $(this).append('<div class="simplemenu">'+menu+'</div>');
            el = $(this).find('.simplemenu');
        }
        el.mouseleave(function(){
            $('.simplemenu').remove();
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

function onCameraScreenResize(){
return;
    let el = $('.screens .cameras');
    let w = el.width();
    let h = el.height();
    if (w/7*5<h)
        $('.screens .cameras').addClass('gridtop');
    else
        $('.screens .cameras').removeClass('gridtop');
}

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
    'stablecss':[path+'scameras.css'],
    'on_search':function(text){
        if (!text)
            delete this.search_text;
        else
            this.search_text = text;
        window.screens['cameras'].activate();
    },
    'on_show':function(filterarray){
        if (core.elements['header-search']) core.elements['header-search'].find('input').val(this.search_text ? this.search_text : '');
        if (!filterarray) {
            if (!sessionStorage.checkedLocations) {
                filterarray = []
            } else {
                filterarray = JSON.parse(sessionStorage.checkedLocations);
            }
        }

        let self = this;
//        core.elements['global-loader'].show();
//vs_api.user.camera.getCameraListBySharedToken(vxgcore.user.src.allCamsToken).then(function(r){
//alert(111);
//});
        let p = this.wrapper.find('player');
        for (i=0; i<p.length; i++) if ($(p[i]).attr('access_token')) p[i].play();


        let el = this.wrapper.find('.camlist');
        self.wrapper.addClass('loader');
        el.html('');
//        el.empty().addClass('spinner');
//        filterarray = [];

	let pr;
        if (filterarray && filterarray.length>0)
            pr = window.vxg.cameras.getCameraFilterListPromise(100,0,filterarray,this.search_text);
        else
            pr = window.vxg.cameras.getCameraListPromise(100,0,undefined,undefined,this.search_text);
        return pr.then(function(list){
            let h='';
            for (let i=0;i<list.length;i++){
                let captured = list[i].src && list[i].src.meta && list[i].src.meta.capture_id && vxg.user.src.capture_id == list[i].src.meta.capture_id ? ' captured' : '';
                let info = '<div class="caminfo '+list[i].src.status+' '+(list[i].src.recording?'rec':'')+(list[i].src.status=='active'?' online':'')+'">'+(list[i].src.status=='active'?'Online':'Offline')+'</div>';
                h += '<div class="camerablock'+captured+'" access_token="'+list[i].getChannelID()+'">'+info+'<campreview></campreview><div><div class="name name'+list[i].getChannelID()+'"></div></div></div>';
            }
            if (h) {
                self.wrapper.removeClass('nocameras');
                el.html(h); 
            } else {
                self.wrapper.addClass('nocameras');
                el.html('No cameras found. <a href="javascript:void(0)" ifscreen="addcamera" onclick_toscreen="addcamera">Add a camera</a>');
            }

            for (let i=0;i<list.length;i++){
                let cid = list[i].getChannelID();
                list[i].getName().then(function(name){
                    self.wrapper.find('.name'+cid).text(name);
                });
            }
            el.find('campreview').click(function(){
                self.wrapper.addClass('showplayer');
                let t = $(this).parent().attr('access_token');
                self.wrapper.find('player').attr('access_token',t);
            });


//            el.removeClass('spinner');
            self.wrapper.removeClass('loader');
            el.find('.settings').simpleMenuPlugin(menu);
//            core.elements['global-loader'].hide();
        },function(){
            self.wrapper.addClass('nocameras');
            el.html('Failed to load list of cameras');
            self.wrapper.removeClass('loader');
//            el.removeClass('spinner')
//            core.elements['global-loader'].hide();
        });

        return defaultPromise();
    },
    'on_hide':function(){
        core.elements['global-loader'].show();
        let p = this.wrapper.find('player');
        for (i=0; i<p.length; i++) p[i].stop();
        core.elements['global-loader'].hide();
    },
    'on_ready':function(){
        let self = this;
    },
    'on_init':function(){
        let self=this;
        setTimeout(function(){onCameraScreenResize();},100);
        $( window ).resize(onCameraScreenResize);
        return defaultPromise();
    }
};