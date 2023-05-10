window.screens = window.screens || {};
var path = window.core.getPath('admin.js');

window.screens['admin'] = {
    'menu_weight': 20,
    'menu_name':'Admin',
    'get_args':function(){
    },
    'menu_icon': path+'admin.svg',
    'menu_icon_hover': path+'adminh.svg',
    'html': path+'partnerslist.html',
    'stablecss':[path+'admin.css'],
    'on_search':function(text){
        this.filtertext = text;
        this.filter();
    },
    'filter':function(){
        let text = this.filtertext;
        if (!text){
            $(this.wrapper).find('.partnerlist tr:not(.header)').show();
            return;
        }
        $(this.wrapper).find('.partnerlist tr:not(.header)').hide();
        $(this.wrapper).find('.partnerlist td.name').each(function(e){
            if ($(this).text().indexOf(text)!==-1)
                $(this).parent().show();
        });
        $(this.wrapper).find('.partnerlist td.email').each(function(e){
            if ($(this).text().indexOf(text)!==-1)
                $(this).parent().show();
        });
    },
    'on_show':function(r){
        if (core.elements['header-search']) core.elements['header-search'].find('input').val(this.filtertext ? this.filtertext : '');
        let self = this;
        $(self.wrapper).find('.partnerlist').empty();
        self.wrapper.addClass('loader');
        self.wrapper.removeClass('nouser');
        return vxg.user.getStorageChannelID().then(function(archive_channel_id){
            return self.show_partners(archive_channel_id);
        },function(error){
            return self.show_partners();
        });
        return defaultPromise();
    },
    'show_partners':function(){
        let self=this;
        return vxg.partners.getList(100).then(function(partners){
			
            let table='<table><thead><tr class="header"><th scope="col">#</th><th scope="col">ID</th><th scope="col">Name</th><th scope="col">Action</th></tr></thead><tbody>';
            c = 1;
            for (let i in partners) {
                table += '<tr userid="' + partners[i].src.id + '"><td>' + c + '</td><td>' + partners[i].src.id + '</td><td class="name">' + partners[i].src.name + '</td><td class="action-icons">'
						+ '<button class="userbtn item-rec svgbtnhover userrec setting_rec '+ ((partners[i].src.allow_rec == true)?'active':'')+'" userid="'+ partners[i].src.id +'"></button>'
						+ '<button class="userbtn item-arch svgbtnhover userarchive setting_int '+ ((partners[i].src.allow_int == true)?'active':'')+'" userid="'+ partners[i].src.id +'"></button>'
						+ '<button onclick_toscreen="admincams" class="userbtn item-delete usercameras svgbtnhover" userid="'+ partners[i].src.id +'"></button>'
						+ '<button class="userbtn item-delete deleteuser svgbtnhover" userid="'+ partners[i].src.id +'"></button>'
						+ '</td></tr>';
                c++;
            }
            table += '</tbody></table>'
            if (partners.length>0)
                $(self.wrapper).find('.partnerlist').empty().append(table);
            else {
                self.wrapper.addClass('nopartner');
                $(self.wrapper).find('.partnerlist').empty().append('No partners.');
            }
            self.wrapper.removeClass('loader');
            self.filter();


			self.wrapper.find('.usercameras2').click(function(){

                let userid = this.getAttribute('userid');
				
				var obj = vxg.partners.list[userid].src.allcamstoken;
				
				
									
			});



			self.wrapper.find('.deleteuser').click(function(){
                let userid = this.getAttribute('userid');
				
                dialogs['mdialog'].activate('<h7>Do you want to delete the user?</h7><p><br/>\
											<label><input type="checkbox" class="userarchive" '+(0?'checked="checked"':'')+
											' name="enable">Are you sure?</label></p><p style="padding-top: 15px;">\
											<button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;\
											<button name="apply" class="vxgbutton">Apply</button></p>').then(function(r){
				
					if (r.button!='apply') return;
					let checked = r.form.enable=="on";
					if (!checked) return;
					
					
					
					var obj = {};
					obj.id = userid;
					
					core.elements['global-loader'].show();
					
					vxg.api.cloudone.partner.del(obj).then(function (ret) {
                        core.elements['global-loader'].hide();
                        return self.on_show();
                    },function(r){
                        if (r && r.responseJSON && r.responseJSON.errorDetail)
                            alert(r.responseJSON.errorDetail);
                        else
                            alert('Falied to delete setting');
                        core.elements['global-loader'].hide();
                    });                    
											
				});				
				
			});

			
			self.wrapper.find('.setting_rec').click(function(){
				
                let userid = this.getAttribute('userid');
                let username = this.getAttribute('username');
                let archive_enable = this.classList.contains('active');
                dialogs['mdialog'].activate('<h7>Do you want to allow cloud recording?</h7><p><br/>\
											<label><input type="checkbox" class="userarchive" '+(archive_enable?'checked="checked"':'')+
											' name="enable">Enable recording?</label></p><p style="padding-top: 15px;">\
											<button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;\
											<button name="apply" class="vxgbutton">Apply</button></p>').then(function(r){
                    if (r.button!='apply') return;
					
					var obj = {};
					let checked = r.form.enable=="on";
					
					obj.id = userid;
					obj.setting_rec = (checked)? "on":"off";
					
					core.elements['global-loader'].show();
					
					vxg.api.cloudone.partner.update(obj).then(function (ret) {
                        core.elements['global-loader'].hide();
                        return self.on_show();
                    },function(r){
                        if (r && r.responseJSON && r.responseJSON.errorDetail)
                            alert(r.responseJSON.errorDetail);
                        else
                            alert('Falied to update setting');
                        core.elements['global-loader'].hide();
                    });                    
                });
            });

			self.wrapper.find('.setting_int').click(function(){
				
                let userid = this.getAttribute('userid');
                let username = this.getAttribute('username');
                let archive_enable = this.classList.contains('active');
                dialogs['mdialog'].activate('<h7>Do you want to allow cloud integration?</h7><p><br/>\
											<label><input type="checkbox" class="userarchive" '+(archive_enable?'checked="checked"':'')+
											' name="enable">Enable integration?</label></p><p style="padding-top: 15px;">\
											<button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;\
											<button name="apply" class="vxgbutton">Apply</button></p>').then(function(r){
                    if (r.button!='apply') return;
					
					var obj = {};
					let checked = r.form.enable=="on";
					
					obj.id = userid;
					obj.setting_int = (checked)? "on":"off";
					
					core.elements['global-loader'].show();
					
					vxg.api.cloudone.partner.update(obj).then(function (ret) {
                        core.elements['global-loader'].hide();
                        return self.on_show();
                    },function(r){
                        if (r && r.responseJSON && r.responseJSON.errorDetail)
                            alert(r.responseJSON.errorDetail);
                        else
                            alert('Falied to update setting');
                        core.elements['global-loader'].hide();
                    });                    
                });
            });

			
			
        }, function(){
            self.wrapper.addClass('nopartner');
            $(self.wrapper).find('.partnerlist').empty().append('Failed load partners list');
            self.wrapper.removeClass('loader');
        });
    },
    'on_hide':function(){
    },
    'on_ready':function(){
    },
    'on_init':function(){
        core.elements['header-right'].prepend('<div class="transparent-button adduser" onclick="add_user()"><img class="svgbtn" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04IDEzLjVDNy43MjM4NiAxMy41IDcuNSAxMy4yNzYxIDcuNSAxM1YzQzcuNSAyLjcyMzg2IDcuNzIzODYgMi41IDggMi41QzguMjc2MTQgMi41IDguNSAyLjcyMzg2IDguNSAzVjEzQzguNSAxMy4yNzYxIDguMjc2MTQgMTMuNSA4IDEzLjVaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIuNSA4QzIuNSA3LjcyMzg2IDIuNzIzODYgNy41IDMgNy41TDEzIDcuNUMxMy4yNzYxIDcuNSAxMy41IDcuNzIzODYgMTMuNSA4QzEzLjUgOC4yNzYxNCAxMy4yNzYxIDguNSAxMyA4LjVMMyA4LjVDMi43MjM4NiA4LjUgMi41IDguMjc2MTQgMi41IDhaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K">&nbsp;&nbsp;Add&nbsp;user</div>');

        return defaultPromise();
    }
};

function add_user()
{

					dialogs['mdialog'].activate('<h7>Type new e-mail address</h7><p><br/>\
												<label><input type="text" class="" name="newuser"></label></p><p style="padding-top: 15px;">\
												<button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;\
												<button name="apply" class="vxgbutton">Apply</button></p>').then(function(r){
					
						if (r.button!='apply') return;
												
						$.ajax({
						type: 'GET',
						url: vxg.api.cloudone.apiSrc + '/api/v1/distrib/create_partner/?email=' + r.form.newuser,
						contentType: "application/json"
//						data: data
						}).then(function(d){
							return ;//self.on_show();
						}).catch(function(d){						
							return ;
						});
						
												});

}

window.screens['admincams'] = {
	'header_name': 'Cameras for the selected user',
    'html': path+'cameralist.html',
    'stablecss':[path+'admin.css'],
    'on_search':function(text){
        this.filtertext = text;
        this.filter();
    },
	'on_before_show':function(r){
        if (this.src){
            let userid = $(this.src).attr('userid');
            if (userid===undefined)
                userid = $($(this.src).parents('[userid]')[0]).attr('userid');
            userid = parseInt(userid);
            if (userid)
                this.user = vxg.partners.list[userid].src;
        } 
        return defaultPromise();
    },
    'filter':function(){
        let text = this.filtertext;
        if (!text){
            $(this.wrapper).find('.partnerlist tr:not(.header)').show();
            return;
        }
        $(this.wrapper).find('.partnerlist tr:not(.header)').hide();
        $(this.wrapper).find('.partnerlist td.name').each(function(e){
            if ($(this).text().indexOf(text)!==-1)
                $(this).parent().show();
        });
        $(this.wrapper).find('.partnerlist td.email').each(function(e){
            if ($(this).text().indexOf(text)!==-1)
                $(this).parent().show();
        });
    },
    'on_show':function(r){
        if (core.elements['header-search']) core.elements['header-search'].find('input').val(this.filtertext ? this.filtertext : '');
		
		core.elements['header-center'].append(" " + this.user.name);
		
        let self = this;
        $(self.wrapper).find('.cameralist').empty();
        self.wrapper.addClass('loader');
        self.wrapper.removeClass('nouser');
        return self.show_cameras();
        return defaultPromise();
    },
    'show_cameras':function(){
        let self=this;
		
		vxg.api.cloud.setAllCamsToken(self.user.allcamstoken);
		
		vxg.api.cloud.getCamerasList().then(function(cameras){
            var cams = [];
            cameras.objects.forEach(c => { if (!c.meta.isstorage) {cams.push(c)} });

            let table='<table><thead><tr class="header"><th scope="col">#</th><th scope="col">Name</th><th scope="col">Id</th><th scope="col" style="width:60%">Access token</th><th scope="col">Action</th></tr></thead><tbody>';
            c = 1;
            for (let i in cams) {
                table += '<tr camid="' + cams[i].id + '"><td>' + c + '</td>'
						+'<td class="name">' + cams[i].name + '</td>'
						+'<td class="acc_token">' + cams[i].id + '</td>'
						+'<td class="acc_token">' + cams[i].token + '</td>'
						+'<td class="action-icons">'
						+ '<button class="userbtn item-delete usercameras svgbtnhover" chnlid="'+ cams[i].id +'"></button>'
						+ '<button class="userbtn item-delete deleteuser svgbtnhover" chnlid="'+ cams[i].id +'"></button>'
						+ '</td></tr>';
                c++;
            }
            table += '</tbody></table>'

            if (cams.length>0)
                $(self.wrapper).find('.cameralist').empty().append(table);
            else {
                self.wrapper.addClass('nopartner');
                $(self.wrapper).find('.cameralist').empty().append('No cameras.');
            }
			
			$(self.wrapper).find('.cameralist').append("<p>Cloud key: <span class='acc_token'>"+ self.user.lkey +"</span></p>");
			
            self.wrapper.removeClass('loader');
            self.filter();
			

			self.wrapper.find('.usercameras').click(function(){
				
					let chnlid = this.getAttribute('chnlid');
					
					
					$.ajax({
						type: 'GET',
						url: vxg.api.cloud.apiSrc + '/api/v3/channels/' + chnlid +'/limits/',
						headers: {'Authorization':'LKey '+ self.user.lkey},
						contentType: "application/json"
//						data: data
						}).then(function(r){

							dialogs['mdialog'].activate('<h7>Camera retention</h7><p><br/>\
														<label><input name="rettime" type="number" value='+r.records_max_age+'>retention (hours, -1 to ignore)</label><br>\
														<label><input name="strgsize" type="number" value='+r.storage_size+'>size (GBs, -1 to ignore)</label></p><p style="padding-top: 15px;">\
														<button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;\
														<button name="apply" class="vxgbutton">Apply</button></p>').then(function(r){
							
								if (r.button!='apply') return;
								
								var data = {};
								if (r.form.rettime > 0)	
									data.records_max_age = parseInt(r.form.rettime);
								else
									data.records_max_age = null;
								
								if (r.form.strgsize > 0)
									data.storage_size = parseInt(r.form.strgsize);
								else
									data.storage_size = null;
								
								let headers = {};
								headers['Authorization'] = 'LKey ' + self.user.lkey;
								
					
								$.ajax({
									type: 'PUT',
									url: vxg.api.cloud.apiSrc + '/api/v3/channels/' + chnlid +'/limits/',
									headers: headers,
									contentType: "application/json",
									data: JSON.stringify(data)
									}).then(function(r){
										alert("Changes applied successfully");
									},function(r){
										alert("Failed to changes settings");
									});
														
								
								
							});				
						});
				
			});


			self.wrapper.find('.deleteuser').click(function(){
				
					let chnlid = this.getAttribute('chnlid');

					dialogs['mdialog'].activate('<h7>Do you want to delete the camera?</h7><p><br/>\
												<label><input type="checkbox" class="userarchive" '+(0?'checked="checked"':'')+
												' name="enable">Are you sure?</label></p><p style="padding-top: 15px;">\
												<button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;\
												<button name="apply" class="vxgbutton">Apply</button></p>').then(function(r){
					
						if (r.button!='apply') return;
						let checked = r.form.enable=="on";
						if (!checked) return;
						
						
						var data = {};
						data.user_id = self.user.id;
						data.cam_id = chnlid;
						
						core.elements['global-loader'].show();
							
						vxg.api.cloudone.partner.del_camera(data).then(function (ret) {
							core.elements['global-loader'].hide();
							return self.on_show();
						},function(r){
							if (r && r.responseJSON && r.responseJSON.errorDetail)
								alert(r.responseJSON.errorDetail);
							else
								alert('Falied to delete a camera');
							core.elements['global-loader'].hide();
						}); 						
						
						/*
						$.ajax({
						type: 'DELETE',
						url: vxg.api.cloud.apiSrc + '/api/v3/channels/' + chnlid,
						headers: {'Authorization':'LKey '+ self.user.lkey},
						contentType: "application/json"
//						data: data
						}).then(function(r){
							core.elements['global-loader'].hide();
							return self.on_show();
						});
						*/
					});				
				
			});
			
			
			
		});
		




    },
    'on_hide':function(){
    },
    'on_ready':function(){
    },
    'on_init':function(){
        core.elements['header-right'].prepend('<div class="transparent-button adduser" ifscreen="edituser" onclick_toscreen="edituser"><img class="svgbtn" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04IDEzLjVDNy43MjM4NiAxMy41IDcuNSAxMy4yNzYxIDcuNSAxM1YzQzcuNSAyLjcyMzg2IDcuNzIzODYgMi41IDggMi41QzguMjc2MTQgMi41IDguNSAyLjcyMzg2IDguNSAzVjEzQzguNSAxMy4yNzYxIDguMjc2MTQgMTMuNSA4IDEzLjVaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIuNSA4QzIuNSA3LjcyMzg2IDIuNzIzODYgNy41IDMgNy41TDEzIDcuNUMxMy4yNzYxIDcuNSAxMy41IDcuNzIzODYgMTMuNSA4QzEzLjUgOC4yNzYxNCAxMy4yNzYxIDguNSAxMyA4LjVMMyA4LjVDMi43MjM4NiA4LjUgMi41IDguMjc2MTQgMi41IDhaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K">&nbsp;&nbsp;Add&nbsp;user</div>');

        return defaultPromise();
    }
};