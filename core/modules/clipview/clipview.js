window.screens = window.screens || {};
window.controls = window.controls || {};
window.dialogs = window.dialogs || {};
var path = window.core.getPath('clipview.js');


window.screens['clipview'] = {
    'header_name': 'Notes',
    'html': path+'clipview.html',
    'css': [path+'clipview.css',
    ],
    'js': [],
    'stablecss':[path+'sclipview.css'],
    'commoncss':[
    ],
    'commonjs':[
    ],
    'on_before_show':function( clipinfo ){
        core.elements['header-center'].text('Camera');
        self.access_token = clipinfo.camtoken;
        return defaultPromise();
    },
    'on_show':function( clipinfo ){
        if (vxg.user.src.role=="user") this.wrapper.find('.cliplistwrapper').hide();
        let self = this;
        let wrapper = $(self.wrapper)[0];

        $('.headerBlock .header-center').text((clipinfo.camname ? clipinfo.camname + ': ' : '') +clipinfo.cliptitle);
            self.clipinfo = clipinfo;
            self.access_token = clipinfo.camtoken;
            
	    var source = wrapper.getElementsByClassName('clipview-clipsource')[0];
	    var videotag = wrapper.getElementsByClassName('clipview-clipplayer')[0];
            videotag.src = clipinfo.clipurl;
	    $(videotag).attr('src', clipinfo.clipurl);
	    videotag.load();

	    self.update_meta();
        self.set_mode('showedittag');
        $(self.wrapper).find('.cliplistwrapper .shareinfo').hide();
        $(self.wrapper).find('.cliplistwrapper .shareinfo .shareurl').html('');

        return defaultPromise();
    },
    'on_hide':function(){
        let self = this;
        setTimeout(function(){
            $(self.wrapper)[0].getElementsByClassName('clipview-clipplayer')[0].pause();
        });
        return defaultPromise();
    },
    'on_ready':function(){
        return defaultPromise();
    },
    modes() {
        return ['showedittag', 'showshare']; 
    },
    get_mode(){
        let wrapper = $(this.wrapper);
        for (let i=0;i<this.modes().length;i++)
            if (wrapper.hasClass(this.modes()[i]))
                return this.modes()[i];
        return false;
    },
    set_mode(mode){
        if (this.modes().indexOf(mode)==-1) return;
        let self = this;
        let wrapper = $(this.wrapper);
        for (let i=0;i<this.modes().length;i++)
            wrapper.removeClass(this.modes()[i]);
        wrapper.addClass(mode);
    },
    dateToUserTimeString: function(date){
        if (date===undefined) date = new Date();
        return new Date(date).toLocaleString('en-CA', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }).replace(/[,|.]/g,'').replace(' 24',' 00');
    },
    timeToUtcString : function (time) {
	var retval = time.getUTCFullYear() 
	+ "-" + minTwoDigits(Number(time.getUTCMonth()) + 1) 
	+ "-" + minTwoDigits(time.getUTCDate()) 
	+ "T" + minTwoDigits(time.getUTCHours()) 
	+ ":" + minTwoDigits(time.getUTCMinutes()) 
	+ ":" + minTwoDigits(time.getUTCSeconds());
	return retval;
    },
    'on_init':function() {
        let self = this;
        if (vxg.user.src.role=='user'){
        }else{
	    let space = '&nbsp;';
            core.elements['header-right'].prepend('<div class="ncssclipbuttons"><button class="transparent-button deleteclip"><img class="svgbtn" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAxIDE2IDE2IiBmaWxsPSJub25lIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMi4yNTAyIDUuMTg4ODZIMy45MTY4OFYxMy41MjIyQzMuOTE2ODggMTMuODI5IDQuMTY1NjEgMTQuMDc3NyA0LjQ3MjQ0IDE0LjA3NzdIMTEuNjk0N0MxMi4wMDE1IDE0LjA3NzcgMTIuMjUwMiAxMy44MjkgMTIuMjUwMiAxMy41MjIyVjUuMTg4ODZaTTMuMzYxMzMgNC42MzMzVjEzLjUyMjJDMy4zNjEzMyAxNC4xMzU4IDMuODU4NzkgMTQuNjMzMyA0LjQ3MjQ0IDE0LjYzMzNIMTEuNjk0N0MxMi4zMDgzIDE0LjYzMzMgMTIuODA1OCAxNC4xMzU4IDEyLjgwNTggMTMuNTIyMlY0LjYzMzNIMy4zNjEzM1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTIuMjUxMSAzLjUyMjExSDMuOTE3NzVDMy42MTA5MyAzLjUyMjExIDMuMzYyMiAzLjc3MDg0IDMuMzYyMiA0LjA3NzY2QzMuMzYyMiA0LjM4NDQ5IDMuNjEwOTMgNC42MzMyMiAzLjkxNzc1IDQuNjMzMjJIMTIuMjUxMUMxMi41NTc5IDQuNjMzMjIgMTIuODA2NiA0LjM4NDQ5IDEyLjgwNjYgNC4wNzc2NkMxMi44MDY2IDMuNzcwODQgMTIuNTU3OSAzLjUyMjExIDEyLjI1MTEgMy41MjIxMVpNMy45MTc3NSAyLjk2NjU1QzMuMzA0MSAyLjk2NjU1IDIuODA2NjQgMy40NjQwMSAyLjgwNjY0IDQuMDc3NjZDMi44MDY2NCA0LjY5MTMxIDMuMzA0MSA1LjE4ODc4IDMuOTE3NzUgNS4xODg3OEgxMi4yNTExQzEyLjg2NDcgNS4xODg3OCAxMy4zNjIyIDQuNjkxMzEgMTMuMzYyMiA0LjA3NzY2QzEzLjM2MjIgMy40NjQwMSAxMi44NjQ3IDIuOTY2NTUgMTIuMjUxMSAyLjk2NjU1SDMuOTE3NzVaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTUuODYxNzYgNy4xMzMzQzYuMDE1MTcgNy4xMzMzIDYuMTM5NTQgNy4yNTc2NyA2LjEzOTU0IDcuNDExMDhWMTEuODU1NUM2LjEzOTU0IDEyLjAwODkgNi4wMTUxNyAxMi4xMzMzIDUuODYxNzYgMTIuMTMzM0M1LjcwODM1IDEyLjEzMzMgNS41ODM5OCAxMi4wMDg5IDUuNTgzOTggMTEuODU1NVY3LjQxMTA4QzUuNTgzOTggNy4yNTc2NyA1LjcwODM1IDcuMTMzMyA1Ljg2MTc2IDcuMTMzM1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNOC4wODQ0MiA3LjEzMzNDOC4yMzc4MyA3LjEzMzMgOC4zNjIyIDcuMjU3NjcgOC4zNjIyIDcuNDExMDhWMTEuODU1NUM4LjM2MjIgMTIuMDA4OSA4LjIzNzgzIDEyLjEzMzMgOC4wODQ0MiAxMi4xMzMzQzcuOTMxMDEgMTIuMTMzMyA3LjgwNjY0IDEyLjAwODkgNy44MDY2NCAxMS44NTU1VjcuNDExMDhDNy44MDY2NCA3LjI1NzY3IDcuOTMxMDEgNy4xMzMzIDguMDg0NDIgNy4xMzMzWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMC4zMDcxIDcuMTMzM0MxMC40NjA1IDcuMTMzMyAxMC41ODQ5IDcuMjU3NjcgMTAuNTg0OSA3LjQxMTA4VjExLjg1NTVDMTAuNTg0OSAxMi4wMDg5IDEwLjQ2MDUgMTIuMTMzMyAxMC4zMDcxIDEyLjEzMzNDMTAuMTUzNyAxMi4xMzMzIDEwLjAyOTMgMTIuMDA4OSAxMC4wMjkzIDExLjg1NTVWNy40MTEwOEMxMC4wMjkzIDcuMjU3NjcgMTAuMTUzNyA3LjEzMzMgMTAuMzA3MSA3LjEzMzNaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTkuNzUwNjUgMS44NTU2SDYuNjk1MUM2LjM4ODI3IDEuODU1NiA2LjEzOTU0IDIuMTA0MzQgNi4xMzk1NCAyLjQxMTE2QzYuMTM5NTQgMi43MTc5OSA2LjM4ODI3IDIuOTY2NzIgNi42OTUxIDIuOTY2NzJIOS43NTA2NUMxMC4wNTc1IDIuOTY2NzIgMTAuMzA2MiAyLjcxNzk4IDEwLjMwNjIgMi40MTExNkMxMC4zMDYyIDIuMTA0MzQgMTAuMDU3NSAxLjg1NTYgOS43NTA2NSAxLjg1NTZaTTYuNjk1MSAxLjMwMDA1QzYuMDgxNDUgMS4zMDAwNSA1LjU4Mzk4IDEuNzk3NTEgNS41ODM5OCAyLjQxMTE2QzUuNTgzOTggMy4wMjQ4MSA2LjA4MTQ1IDMuNTIyMjcgNi42OTUxIDMuNTIyMjdIOS43NTA2NUMxMC4zNjQzIDMuNTIyMjcgMTAuODYxOCAzLjAyNDgxIDEwLjg2MTggMi40MTExNkMxMC44NjE4IDEuNzk3NTEgMTAuMzY0MyAxLjMwMDA1IDkuNzUwNjUgMS4zMDAwNUg2LjY5NTFaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4="/><span>&nbsp;&nbsp;Delete</span></button>'+space+'<button class="transparent-button downloadclip"><img class="svgbtn" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTggOS4zOTU4VjMuMzk5OSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNMTIgMTAuMzk1OFYxMS4zOTU4QzEyIDExLjk0OCAxMS41NTIzIDEyLjM5NTggMTEgMTIuMzk1OEg1QzQuNDQ3NzIgMTIuMzk1OCA0IDExLjk0OCA0IDExLjM5NThWMTAuMzk1OCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNNS4xNzE4OCA3LjM4OTRMOC4wMDAzIDEwLjIxNzhMMTAuODI4NyA3LjM4OTQiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC44IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+"><span>&nbsp;&nbsp;Download</span></button></div>');
	}
        if ($('.screens > .clipview .addnote:visible').length>0)
            $(self.wrapper).addClass('showedittag');
        else
            $(self.wrapper).addClass('showshare');
        let d = $.Deferred();
        let f = false;
        core.elements['global-loader'].show();
        
        setTimeout(function(){
            if (!f) core.elements['global-loader'].hide();
            f = true;
            d.resolve();
        },100);

        core.elements['header-right'].find('.ncssclipbuttons .makeshare').click(function(){
            let mode = self.get_mode(); 
            self.modebeforeedit = mode;
            self.set_mode('showshare');
        });
        
        $(this.wrapper).find('.share1,.share2,.share3').click(function(){
            let time=30*60;
            if ($(this).hasClass('share2')) time = 60*60;
            if ($(this).hasClass('share3')) time = 24*60*60;
            let shareinfo = $(self.wrapper).find('.cliplistwrapper .shareinfo');
            shareinfo.addClass('spinner').show().find('.shareurl').html('');
            shareinfo.find('>*').hide();

	    console.log('TODO:share');
	    
	    let curtime = new Date();
	    let exptime = new Date( curtime.getTime() + time*1000);
	    let expire = self.timeToUtcString(exptime);
            let t = JSON.parse(atob(self.clipinfo.allcamtoken));
	    
	    vxg.api.cloud.shareClip(self.clipinfo.allcamtoken, self.clipinfo.clipid, expire)
		.done (function(data_share){ 
			shareinfo.find('>*').show();
			let host = 'http://'+t.api+(t.api_p ? ':'+t.api_p : '');
			if (window.location.protocol=='https:')
                            host = 'https://'+t.api+(t.api_sp ? ':'+t.api_sp : '');
			shareinfo.removeClass('spinner').find('.shareurl').html(window.location.origin+'/sharedClip.html?token='+data_share['token']+'&id='+self.clipinfo.clipid+'&host='+host);
			shareinfo.find('.shareexpire').html(self.dateToUserTimeString(new Date(data_share['expire']+'Z' )));
			shareinfo.find('.sharecreated').html(self.dateToUserTimeString(new Date(data_share['created']+'Z')));
		}).fail ( function(r){
			shareinfo.removeClass('spinner');
		})
        });
        $(this.wrapper).find('.toclipboard').click(function(){
            self.copyToClipboard($(self.wrapper).find('.shareurl').val());
            dialogs['idialog'].activate('The link<br/>successfully copied')
        });

        core.elements['header-right'].find('.ncssclipbuttons .downloadclip').click(function(){
	    console.log('TODO: download');
	    var dlAnchorElem = document.createElement('a');
	    
	    dlAnchorElem.setAttribute("href",     self.clipinfo.clipurl);
	    dlAnchorElem.setAttribute("download", self.clipinfo.cliptitle);
	    dlAnchorElem.setAttribute("type", "media/mp4");
	    dlAnchorElem.click();
        });

        core.elements['header-right'].find('.ncssclipbuttons .edittagclip').click(function(){
	    self.set_mode('showedittag');
	    self.update_meta();
        });
        core.elements['header-right'].find('.ncssclipbuttons .deleteclip').click(function(){
	    console.log('TODO: delete');
	    $(self.wrapper).find('.delete-clip-name').html( self.clipinfo.cliptitle);

            dialogs['mdialog'].activate('<h7>Do you want to delete clip?</h7><p>It can\'t be cancelled</p><p><button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;<button name="delete" class="vxgbutton">Delete</button></p>').then(function(r){
                if (r.button!='delete') return;
		vxg.api.cloud.deleteClipV2( self.clipinfo.allcamtoken , self.clipinfo.clipid )
		.done(function ( result ) {
			//core.elements['header-left'].find('.mainbackbtn').click();
			let wrapper = $(self.wrapper)[0];
			var videotag = wrapper.getElementsByClassName('clipview-clipplayer')[0];
			videotag.pause();
			videotag.currentTime = 0;
			$(self.wrapper).find('.clip-delete-dialog').removeClass('visible');
			
			window.screens['archive'].activate();
		}).fail(function (r) {
			$(self.wrapper).find('.clip-delete-dialog').removeClass('visible');

			console.warn('Delete clip error:' + r.statusText );
			window.screens['archive'].activate();
		});
            });

//	    $(self.wrapper).find('.clip-delete-dialog').addClass('visible');
        });
/*
        $(this.wrapper).find('.delete-clip-cancel').click(function(){
		$(self.wrapper).find('.clip-delete-dialog').removeClass('visible');
        });
        $(this.wrapper).find('.delete-clip-confirm').click(function(){
	    console.log('TODO: delete');
		vxg.api.cloud.deleteClipV2( self.clipinfo.allcamtoken , self.clipinfo.clipid )
		.done(function ( result ) {
			//core.elements['header-left'].find('.mainbackbtn').click();
			let wrapper = $(self.wrapper)[0];
			var videotag = wrapper.getElementsByClassName('clipview-clipplayer')[0];
			videotag.pause();
			videotag.currentTime = 0;
			$(self.wrapper).find('.clip-delete-dialog').removeClass('visible');
			
			window.screens['archive'].activate();
		}).fail(function (r) {
			$(self.wrapper).find('.clip-delete-dialog').removeClass('visible');

			console.warn('Delete clip error:' + r.statusText );
			window.screens['archive'].activate();
		});
        });
*/
        $(this.wrapper).find('.btnarea .addnote').click(function(){
	    self.set_mode('showedittag');
	    self.update_meta();
        });
        $(this.wrapper).find('.btnarea .addshare').click(function(){
            let mode = self.get_mode(); 
            self.modebeforeedit = mode;
            self.set_mode('showshare');
        });

        $(this.wrapper).find('.cancel,.closebtn').click(function(){
            self.set_mode(self.modebeforeedit);
            delete self.editmeta;
        });
        
        $(this.wrapper).find('.savetag').click(function(){
            $(self.wrapper).find('button,textarea').attr('disabled','disabled');
            $(self.wrapper).find('textarea').addClass('spinner');
            let desc = $(self.wrapper).find('.tagdesc').val().trim();
            let cas = $(self.wrapper).find('.tagcase').val().trim();
    	    let clipedit = $(self.wrapper).find('.clipedit');
    
	    let datetime = clipedit.attr('inctime');
	    let tagid    = clipedit.attr('tagid');
	    let storagetoken = clipedit.attr('storagetoken');
	    let inc = new Date(datetime+'Z');
            
            if (tagid !== undefined) {
		vxg.api.cloud.updateClipMeta ( storagetoken , tagid, desc, self.clipinfo.cliptitle, cas, inc.getTime())
		.done (function(data){ 
			setTimeout(function(){
				$(self.wrapper).find('button,textarea').removeAttr('disabled');
				$(self.wrapper).find('textarea').removeClass('spinner');
				self.update_meta();
			}, 1000 );
		}).fail ( function(r){
			
		});
            } else {
		vxg.api.cloud.createClipMeta( storagetoken, self.clipinfo.clipid, desc, datetime, self.clipinfo.cliptitle, cas, inc.getTime())
		.done (function(data){ 
			setTimeout(function(){
				$(self.wrapper).find('button,textarea').removeAttr('disabled');
				$(self.wrapper).find('textarea').removeClass('spinner');
				self.update_meta();
			}, 1000 );
		}).fail ( function(r){
			
		})
            }
        });
        return d;
    },
    "update_meta": function(){
        let self = this;

        $(self.wrapper).find('button,textarea').attr('disabled','disabled');
        $(self.wrapper).find('textarea').addClass('spinner');
         
        let desc = $(self.wrapper).find('.tagdesc')[0];
        let cas = $(self.wrapper).find('.tagcase')[0];
        let inctime = $(self.wrapper).find('.inctime')[0];
        let clipedit = $(self.wrapper).find('.clipedit');
        
        vxg.cameras.getCameraByIDPromise(vxg.user.src.allCamsTokenMeta.storage_channel_id,vxg.user.src.allCamsToken).then(function(storage){
                vxg.api.cloud.getClipMeta(storage.token, self.clipinfo.clipid)
		.done (function(data){ 
			$(self.wrapper).find('button,textarea').removeAttr('disabled');
			$(self.wrapper).find('textarea').removeClass('spinner');
        
			if (data.objects.length > 0) {
				cas.value = data.objects[0].string.clipcase;
				desc.value = data.objects[0].string.description;
				clipedit.attr('storagetoken', storage.token);
				clipedit.attr('tagid', data.objects[0].id);
				clipedit.attr('inctime', data.objects[0].timestamp);
				inctime.innerHtml = inctime.innerhtml = inctime.innerHTML = self.dateToUserTimeString(data.objects[0].timestamp+'Z');
			}
		}).fail ( function(r){
			$(self.wrapper).find('button,textarea').removeAttr('disabled');
			$(self.wrapper).find('textarea').removeClass('spinner');
		})
	})

    },
    copyToClipboard: function (text) {
        var $temp = $("<input>");
        $("body").append($temp);
        $temp.val(text).select();
        document.execCommand("copy");
        $temp.remove();
    }
};
