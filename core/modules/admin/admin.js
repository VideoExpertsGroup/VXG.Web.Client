window.screens = window.screens || {};
var path = window.core.getPath('admin.js');

window.screens['admin'] = {
    'menu_weight': 20,
    'menu_name':'Admin',
    'get_args':function(){
    },
    'menu_icon': '<i class="fa fa-lock" aria-hidden="true"></i>',
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
        return vxg.partners.getList(100).then(function(ret){
			var partners = ret.partners;
            let table=`
                <table>
                    <thead>
                        <tr class="header">
                            <th scope="col" style="width: 5%"></th>
                            <th scope="col" style="width: 8%">ID</th>
                            <th scope="col" style="width: 33%">Name</th>
                            <th scope="col" style="width: 14%"></th>
                            <th scope="col" style="width: 40%"></th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            c = 1;
            var hide_ai_class = ret.aiEnabled ? "" : "hide-ai";
            for (let i in partners) {
                table += '<tr userid="' + partners[i].src.id + '"><td>' + c + '</td><td>' + partners[i].src.id + '</td><td class="name">' + partners[i].src.name + '</td>'
                        + '<td><button title="Assign Plans" class="item-subs setting_sub sub-btn" userid="'+ partners[i].src.id + '">Assign Plans</button></td>'
                        + '<td class="action-icons">'
						//+ '<button class="userbtn item-rec userrec setting_rec '+ ((partners[i].src.allow_rec == true)?'active':'')+'" userid="'+ partners[i].src.id +'"><i class="fa fa-dot-circle-o" aria-hidden="true"></i></button>'
						+ '<button class="userbtn item-arch userarchive setting_int '+ ((partners[i].src.allow_int == true)?'active':'')+'" userid="'+ partners[i].src.id +'"><i class="fa fa-bookmark-o" aria-hidden="true"></i></button>'
						+ '<button class="userbtn item-arch userarchive setting_nvr '+ ((partners[i].src.allow_nvr == true)?'active':'')+'" userid="'+ partners[i].src.id +'"><i class="fa fa-server" aria-hidden="true"></i></button>'
                        //+ '<button class="userbtn item-ai userai setting_ai ' + hide_ai_class + " " + ((partners[i].src.allow_ai == true)?'active':'')+'" userid="'+ partners[i].src.id +'"><i class="fa fa-microchip" aria-hidden="true"></i></button>'
                        + '<button onclick_toscreen="admincams" class="userbtn item-delete usercameras" userid="'+ partners[i].src.id +'"><i class="fa fa-video-camera" aria-hidden="true"></i></button>'
						+ '<button class="userbtn item-delete deleteuser" userid="'+ partners[i].src.id +'"><i class="fa fa-trash-o" aria-hidden="true"></i></button>'
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

			self.wrapper.find('.setting_nvr').click(function(){
				
                let userid = this.getAttribute('userid');
                let username = this.getAttribute('username');
                let archive_enable = this.classList.contains('active');
                dialogs['mdialog'].activate('<h7>Do you want to allow Cloud NVR?</h7><p><br/>\
											<label><input type="checkbox" class="userarchive" '+(archive_enable?'checked="checked"':'')+
											' name="enable">Enable Cloud NVR?</label></p><p style="padding-top: 15px;">\
											<button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;\
											<button name="apply" class="vxgbutton">Apply</button></p>').then(function(r){
                    if (r.button!='apply') return;
					
					var obj = {};
					let checked = r.form.enable=="on";
					
					obj.id = userid;
					obj.setting_nvr = (checked)? "on":"off";
					
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


            self.wrapper.find('.setting_ai').click(function(){
				
                let userid = this.getAttribute('userid');
                let username = this.getAttribute('username');
                let ai_enable = this.classList.contains('active');
                dialogs['mdialog'].activate('<h7>Do you want to allow AI control?</h7><p><br/>\
											<label><input type="checkbox" class="userarchive" '+(ai_enable?'checked="checked"':'')+
											' name="enable">Enable AI?</label></p><p style="padding-top: 15px;">\
											<button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;\
											<button name="apply" class="vxgbutton">Apply</button></p>').then(function(r){
                    if (r.button!='apply') return;
					
					var obj = {};
					let checked = r.form.enable=="on";
					
					obj.id = userid;
					obj.setting_ai = (checked)? "on":"off";
					
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

            self.wrapper.find('.setting_sub').click(function(){
                let userid = this.getAttribute('userid');
                var savedPlans = sessionStorage.getItem('allPlans');
                if (!savedPlans) {
                    vxg.api.cloudone.partner.get_plans().then(function(allPlans) {
                        sessionStorage.setItem("allPlans", JSON.stringify(allPlans["data"]));
                        assignPlans(userid, partners, allPlans["data"]);
                    });
                } else {
                    assignPlans(userid, partners, JSON.parse(savedPlans));
                }
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
        core.elements['header-right'].prepend('<div class="transparent-button adduser" onclick="make_admin()"><span class="add-icon">+</span>&nbsp;&nbsp;Make&nbsp;admin</div>');
        core.elements['header-right'].prepend('<div class="transparent-button adduser" onclick="add_user()"><span class="add-icon">+</span>&nbsp;&nbsp;Add&nbsp;user</div>');

        return defaultPromise();
    }
};

function assignPlans(userid, partners, allPlans) {
    var partnerPlans;
    partners.forEach(partner => {
        if (partner.src.id == userid) {
            partnerPlans = partner.src.plans && partner.src.plans != "null" ? partner.src.plans : null;
            return;
        }
    })

    partnerPlans = !partnerPlans ? [] : JSON.parse(partnerPlans);

    var planEle = "";
    allPlans.forEach(plan => {
        var currCount = 0;
        var currUsed = 0;
        var planIndex = partnerPlans.findIndex(p => p.id === plan.id);
        if (planIndex > -1) {
            currCount = partnerPlans[planIndex].count;
            currUsed = partnerPlans[planIndex].used;
        }

        planEle += `
            <div class="plan" id="${plan.id}_row">
                <p class="plan-desc" planid="${plan.id}"> ${plan.name} </p>
                <input class="plan-count ${currCount == 0 ? "unassigned" : ""}" type="number" id="${plan.id}_count" onchange="checkUnsubscribe('${plan.id}')" name="${plan.id}" value="${currCount}" min="0">
                <input class="used-count" type="number" id="${plan.id}_used" value="${currUsed}" disabled>
            </div>
            `;
    });

    var plansDialog = `
        <h5 id="plans-title">Assign Plans</h5>
        <p id="sub-warning" style="display: none;"></p> 
        <div class="plans-list-cont">
            <div class="plans-list">
                ${planEle}
            </div>
            <button name="apply" class="vxgbutton assign-btn">Assign</button>
        </div>
    `;
    dialogs['mdialog'].activate(plansDialog).then(function(r){
        if (r.button!='apply') return;

        var plansArr = [];
        var detached = [];
        var doAssign = true;
        for (let i = 0; i < allPlans.length; i++) {
            var plan = allPlans[i];
            var newCount = $("#" + plan.id + "_count").val();
            var used = $("#" + plan.id + "_used").val();
            newCount =  parseInt(newCount) ? parseInt(newCount) : newCount == "0" ? 0 : -1;
            used = parseInt(used) ? parseInt(used) : used == "0" ? 0 : -1;

            if (used < 0 || newCount < 0) {
                doAssign = false;
                alert("Error getting information for plans. Please refresh the page and try again.");
                break;
            }

            if (used > newCount) {
                // special change where we have to remove cameras from subscriptions
                var detachCount = used - newCount; 
                var detach = {
                    "id": plan.id,
                    "detachCount": detachCount,
                    "detached": 0
                };
                used = newCount;
                detached.push(detach);
            }

            if (newCount > 0) {
                var plan = {
                    "id": plan.id,
                    "name": plan.name,
                    "used": used,
                    "count": newCount
                };
                plansArr.push(plan);
            }
        }

        if (doAssign) {
            var plansStr = JSON.stringify(plansArr);
        
            core.elements['global-loader'].show();
    
            vxg.api.cloudone.partner.assign_plans(userid, plansStr).then(function(r) {
                if (detached.length > 0) detachPlans(detached, userid);
                else location.reload();
            }, function(err) {
                if (err && err.responseJSON && r.responseJSON.errorDetail)
                    alert(err.responseJSON.errorDetail);
                else
                    alert('Falied to update setting');
                core.elements['global-loader'].hide();
            });
        }
    });
}

function checkUnsubscribe(planid) {
    var newCount = parseInt($("#" + planid + "_count").val());
    var currUsed = parseInt($("#" + planid + "_used").val());
    var warningEle = $("#sub-warning");
    if (currUsed > newCount && !warningEle.is(":visible")) {
        $("#" + planid + "_row").css("background-color", "#ffdc73");
        warningEle.show();
        warningEle.html(`<p> This user currently has <b> ${currUsed} </b> cameras subscribed to this plan. Changing the count to <b> ${newCount} </b> will automatically unsubscribe cameras from this plan. </p>`)
    } else {
        $("#" + planid + "_row").css("background-color", "transparent");
        warningEle.hide();
        warningEle.empty();
    }
}

function detachPlans(detachArr, userid) {
    vxg.api.cloud.setAllCamsToken(vxg.partners.list[userid].src.allcamstoken);
		
    vxg.api.cloud.getCamerasList().then(function(cameras){
        let promiseChain = Promise.resolve();
        cameras.objects.forEach(cam => {
            var subid = cam.meta && cam.meta.subid ? cam.meta.subid : null;
            let i = detachArr.findIndex(p => p.id == subid && p.detachCount != p.detached)
            if(i > -1) {
                //var oldsubid = cam.meta.subid;
                cam.oldsubid = cam.meta.subid;

                delete cam.meta.subid;
                delete cam.meta.subname;

                var newMeta = {
                    "meta": cam.meta,
                }

                detachArr[i].detached++;

                const makeNextPromise = (cam) => () => {
                    return vxg.api.cloud.updateCloudCam(cam.id, newMeta, vxg.partners.list[userid].src.lkey).then((r) => {
                        var obj = {
                            "old_sub": cam.oldsubid,
                            "id": cam.id,
                            "meta": [],
                            "user_id": userid
                        }
                        vxg.api.cloudone.camera.setPlans(obj).then(function(p) {
                            location.reload();
                        })
                    });
                }
                
                promiseChain = promiseChain.then(makeNextPromise(cam));
            }
        });
    });
}
 
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

function create_user() {
    // I don't think add user really does anything, so maybe don't advertise it
    var newuser = document.getElementById('adduser-email').value;
    $.ajax({
        type: 'GET',
        url: vxg.api.cloudone.apiSrc + '/api/v1/distrib/create_partner/?email=' + newuser,
        contentType: "application/json"
        }).then(function(d){
            location.reload();
        }).catch(function(d){						
            return ;
    });
}

function make_admin()
{

					dialogs['mdialog'].activate('<h7>Type existing e-mail address</h7><p><br/>\
												<label><input type="text" class="" name="newuser"></label></p><p style="padding-top: 15px;">\
												<label><input type="checkbox" class="userarchive" name="enable">Enable/disable</label></p><p style="padding-top: 15px;">\
												<button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;\
												<button name="apply" class="vxgbutton">Apply</button></p>').then(function(r){
					
						if (r.button!='apply') return;
						
						let adm_enable = "off"; 	
						if (r.form.enable == "on") adm_enable = "on";
						
						$.ajax({
						type: 'GET',
						url: vxg.api.cloudone.apiSrc + '/api/v1/distrib/update/?email=' + r.form.newuser +'&enable='+adm_enable,
						contentType: "application/json"
//						data: data
						}).then(function(d){
							return ;//self.on_show();
						}).catch(function(d){						
							return ;
						});
						
												});

}

function make_user_admin(userEmail, makeAdmin) {
        var dialog = makeAdmin == 'admin' ? `<p class='admin-desc'> Do you want to make <b>${userEmail}</b> an admin? </p>` : `<p class='admin-desc'> Do you want to revoke admin priveleges for <b>${userEmail}</b>? </p>`;

        dialogs['mdialog'].activate(`
            <h1 id="admin-title"> Are You Sure? </h1>
            ${dialog}
            <div class="action-btns">
                <button name="cancel" class="vxgbutton cancelbtn">Cancel</button>
                <button name="apply" class="vxgbutton applybtn">Apply</button>
            </div>
        `).then(function(r){

        if (r.button!='apply') return;

        let adm_enable = makeAdmin == "admin" ? "on" : "off";

        $.ajax({
        type: 'GET',
        url: vxg.api.cloudone.apiSrc + '/api/v1/distrib/update/?email=' + userEmail +'&enable='+adm_enable,
        contentType: "application/json"
        //						data: data
        }).then(function(d){
            location.reload();
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
		
		var obj ={"limit":1000};
		vxg.api.cloud.getCamerasList(obj).then(function(cameras){
            var cams = [];
            cameras.objects.forEach(c => { if ((c.meta && !c.meta.isstorage) || !c.meta) {cams.push(c)} });

            let table='<table><thead><tr class="header"><th scope="col">#</th><th scope="col">Name</th><th scope="col">Id</th><th scope="col" style="width:60%">Access token</th><th scope="col">Action</th></tr></thead><tbody>';
            c = 1;
            for (let i in cams) {
                table += '<tr camid="' + cams[i].id + '"><td>' + c + '</td>'
						+'<td class="name">' + cams[i].name + '</td>'
						+'<td class="acc_token">' + cams[i].id + '</td>'
						+'<td class="acc_token">' + cams[i].token + '</td>'
						+'<td class="action-icons">'
						+ '<button class="userbtn item-delete usercameras" chnlid="'+ cams[i].id +'"><i class="fa fa-video-camera" aria-hidden="true"></i></button>'
						+ '<button class="userbtn item-delete deleteuser" chnlid="'+ cams[i].id +'"><i class="fa fa-trash-o" aria-hidden="true"></i></button>'
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
			
			
			
		}, function(err) {
            self.wrapper.removeClass('loader');
            $(self.wrapper).find('.cameralist').empty().append('Error finding cameras: ' + err.responseJSON.errorDetail);
        });
		




    },
    'on_hide':function(){
    },
    'on_ready':function(){
    },
    'on_init':function(){
        core.elements['header-right'].prepend('<div class="transparent-button adduser" ifscreen="edituser" onclick_toscreen="edituser"><span class="add-icon">+</span>Add user</div>');

        return defaultPromise();
    }
};