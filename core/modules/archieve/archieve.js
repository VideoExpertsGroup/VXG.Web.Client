window.screens = window.screens || {};
var path = window.core.getPath('archieve.js');


window.screens['archive'] = {
    'menu_weight':52,
	'menu_name': $.t('archive.title'),
    'get_args':function(){
    },
//  TODO:
//    'menu_toggle':true,
//    'menu_disabled':true,
    'menu_icon': '<i class="fa fa-folder-o" aria-hidden="true"></i>',
    'html': path+'archieve.html',
    'css':[ path+'archieve.css',
	path+'VXGArchieve/VXGArchieve.css',
	path+'VXGArchieve/VXGArchieveCollection.css',
    ],
    'stablecss':[],
    'commoncss':[],
    'commonjs':[],
    'js': [
	path+'VXGArchieve/VXGArchieve.js'
     ],
    somethingWrong: function( err ) {
	console.warn('Something wrong' + err);
    },
    listarchieveCB: function ( operation,  clipinfo ) {
	if (operation === 'play') {
		console.log('TODO: clipinfo');
		if (window.screens['clipview']){
    			window.screens['clipview'].clipinfo = clipinfo;
			window.screens['clipview'].activate(clipinfo);
		}
	}
    },
// Когда экран "активируется" - например вследствие нажатия меню
    'on_search':function(text){
        console.log("DEBUG: archieve search text:" + text );
/*
        var search_obj = {};
	targetElement = this.wrapper.find('.archieve_archievelist')[0];
        targetElement.acceptVXGFilter(search_obj);
*/
	var targetElement = this.wrapper.find('.archieve_archievelist')[0];
	if (text.length > 0) {
		targetElement.updateList(text);
	} else {
		targetElement.updateList();
	}
    },
    'on_before_show':function(r){
	let self = this;
	
        if (this.from_back) return defaultPromise();;
        if (this.scroll_top!==undefined)
            delete this.scroll_top;
	    var targetElement = this.wrapper.find('.archieve_archievelist')[0];
	    let allCamToken	= vxg.user.src.allCamsToken;

	    var archieve_controller = new VXGArchieveController(targetElement);
	    targetElement.showArchieveList();
	    window.vxg.cameras.getCameraListPromise(100, 0).then(function (answer) {
		let apiGetClipListFunc	= vxg.api.cloud.getClipslist;
		let apiDeleteClipFunc 	= vxg.api.cloud.deleteClipV2;
		let apiGetClipMeta	= vxg.api.cloud.getClipMeta;
		let apiCreateClipMeta 	= vxg.api.cloud.createClipMeta;
		let apiUpdateClipMeta 	= vxg.api.cloud.updateClipMeta;
		let apiShareClip	= vxg.api.cloud.shareClip ;
		let apiGetSharedClip	= vxg.api.cloud.getClip;
		let apiGetClipsIdByMeta = vxg.api.cloud.getClipsIdByMeta;
		let apiGetClipsByIdSet	= vxg.api.cloud.getClipsByIdSet;
		    
		let somethingWrongFunc	= self.somethingWrong;
		let controlCbFunc	= self.listarchieveCB;
		if (answer.length > 0) {
			//let camera0	= answer[0];
			targetElement.setMetaControlFuncs(apiGetClipMeta,apiCreateClipMeta,apiUpdateClipMeta);
			targetElement.setShareControlFuncs(apiGetSharedClip, apiShareClip);
			targetElement.setSearchByMetaFuncs(apiGetClipsIdByMeta, apiGetClipsByIdSet);
			targetElement.setCameraArray(answer);
			vxg.cameras.getCameraByIDPromise(vxg.user.src.allCamsTokenMeta.storage_channel_id,vxg.user.src.allCamsToken).then(function(storage){
				targetElement.showArchieveList( storage.token, allCamToken, apiGetClipListFunc, apiDeleteClipFunc, somethingWrongFunc.bind(this), controlCbFunc.bind(this) );
			});
		} else {
			targetElement.showArchieveList(undefined, allCamToken, apiGetClipListFunc, apiDeleteClipFunc, somethingWrongFunc.bind(this), controlCbFunc.bind(this) );
		}
	    }, function(r) {
		targetElement.showarchieveList();
	    });
        return defaultPromise();
    },
    'on_show':function(r){
		core.elements['header-search'].hide();
        //if (core.elements['header-search']) core.elements['header-search'].find('input').val(this.search_text ? this.search_text : '');
        if (this.scroll_top!==undefined)
            $('.screens').scrollTop(this.scroll_top);
        return defaultPromise();
    },
// Когда экран "прячется" - например вследствие активации другого экрана
    'on_hide':function(){
        this.scroll_top = $('.screens').scrollTop();
	let targetElement = core.elements['header-search'].find('input')[0];
	if (targetElement !== undefined) {
	    targetElement.value = "";
	}

//        alert('hide Test screen');
    },
// Когда все скрипты и стили загружены
    'on_ready':function(){
//        alert('on_ready Test screen');
    },
// Когда скрипт инициализируется первый раз (чтоб не выполнять лишнюю работу, возможно даже не нужную пользователю)
    'on_init':function(){
//        alert('on_init Test screen');
        return defaultPromise();
    }
};