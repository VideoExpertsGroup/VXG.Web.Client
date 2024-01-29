window.screens = window.screens || {};
var path = window.core.getPath('users.js');

window.screens['users'] = {
    'menu_weight': 20,
    'menu_name':'Users',
    'get_args':function(){
    },
    'menu_icon': '<i class="fa fa-user-o" aria-hidden="true"></i>',
    'html': path+'userslist.html',
    'stablecss':[path+'users.css'],
    'on_search':function(text){
        this.filtertext = text;
        this.filter();
    },
    'filter':function(){
        let text = this.filtertext;
        if (!text){
            $(this.wrapper).find('.userlist tr:not(.header)').show();
            return;
        }
        $(this.wrapper).find('.userlist tr:not(.header)').hide();
        $(this.wrapper).find('.userlist td.name').each(function(e){
            if ($(this).text().indexOf(text)!==-1)
                $(this).parent().show();
        });
        $(this.wrapper).find('.userlist td.email').each(function(e){
            if ($(this).text().indexOf(text)!==-1)
                $(this).parent().show();
        });
    },
    'on_show':function(r){
        $('.mainsearch').find('input').attr("placeholder", "Search");
        core.elements['header-search'].show();
        if (core.elements['header-search']) core.elements['header-search'].find('input').val(this.filtertext ? this.filtertext : '');
        let self = this;
        $(self.wrapper).find('.userlist').empty();
        self.wrapper.addClass('loader');
        self.wrapper.removeClass('nouser');
        return vxg.user.getStorageChannelID().then(function(archive_channel_id){
            return self.show_users(archive_channel_id);
        },function(error){
            return self.show_users();
        });
        return defaultPromise();
    },
    'show_users':function(archive_channel_id){
        let self=this;
        return vxg.users.getList(100).then(function(users){
            let table='<table><thead><tr class="header"><th scope="col">#</th><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Cameras</th><th scope="col">Action</th></tr></thead><tbody>';
            let c=1;
            for (let i in users){

                  let archive_channel_id = vxg.user.src.allCamsTokenMeta && vxg.user.src.allCamsTokenMeta.storage_channel_id ? parseInt(vxg.user.src.allCamsTokenMeta.storage_channel_id) : 0;
                let totalcameras = users[i].src.totalCameras - (archive_channel_id && users[i].src.cameras.indexOf(archive_channel_id)>=0 ? 1 : 0);
                let user = vxg.users.getUserByID(users[i].src.id);
                let archive_enable = user.src.cameras.indexOf(archive_channel_id)>=0;

                let storimg = '<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xOS4zNSAxNlYxMC43OTE3QzE5LjM1IDEwLjE4NDIgMTguODU3NSA5LjY5MTY3IDE4LjI1IDkuNjkxNjdIMTMuNDg3N0MxMi41MDEgOS42OTE2NyAxMS41ODE5IDkuMTg5OTEgMTEuMDQ4MyA4LjM1OTg2TDkuNzkxNzMgNi40MDUxN0M5LjU4OTMzIDYuMDkwMzIgOS4yNDA3MiA1LjkgOC44NjY0MyA1LjlINkM1LjM5MjQ5IDUuOSA0LjkgNi4zOTI0OSA0LjkgN1YxNkM0LjkgMTYuNjA3NSA1LjM5MjQ5IDE3LjEgNiAxNy4xSDE4LjI1QzE4Ljg1NzUgMTcuMSAxOS4zNSAxNi42MDc1IDE5LjM1IDE2Wk02IDVDNC44OTU0MyA1IDQgNS44OTU0MyA0IDdWMTZDNCAxNy4xMDQ2IDQuODk1NDMgMTggNiAxOEgxOC4yNUMxOS4zNTQ2IDE4IDIwLjI1IDE3LjEwNDYgMjAuMjUgMTZWMTAuNzkxN0MyMC4yNSA5LjY4NzEgMTkuMzU0NiA4Ljc5MTY3IDE4LjI1IDguNzkxNjdIMTMuNDg3N0MxMi44MDcyIDguNzkxNjcgMTIuMTczNCA4LjQ0NTYzIDExLjgwNTQgNy44NzMxOEwxMC41NDg4IDUuOTE4NDhDMTAuMTgwOCA1LjM0NjA0IDkuNTQ2OTYgNSA4Ljg2NjQzIDVINloiIGZpbGw9IiNCMkIyQjIiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xNi42MjUyIDYuNTMzM0MxNy40ODEyIDYuNTMzMyAxOC4xNzUyIDcuMjI3MjYgMTguMTc1MiA4LjA4MzNWOS4wNjI0N0gxOS4wNzUyVjguMDgzM0MxOS4wNzUyIDYuNzMwMiAxNy45NzgzIDUuNjMzMyAxNi42MjUyIDUuNjMzM0gxMC4yMjk0VjYuNTMzM0gxNi42MjUyWiIgZmlsbD0iI0IyQjJCMiIvPgo8L3N2Zz4=" style="margin-top: -17px;">';
                if (archive_enable) storimg = '<img class="svgbtn" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgN0M0IDUuODk1NDMgNC44OTU0MyA1IDYgNUw4Ljg2NjQzIDVDOS41NDY5NiA1IDEwLjE4MDggNS4zNDYwNCAxMC41NDg4IDUuOTE4NDhMMTEuODA1NCA3Ljg3MzE4QzEyLjE3MzQgOC40NDU2MyAxMi44MDcyIDguNzkxNjcgMTMuNDg3NyA4Ljc5MTY3SDE4LjI1QzE5LjM1NDYgOC43OTE2NyAyMC4yNSA5LjY4NzEgMjAuMjUgMTAuNzkxN1YxNkMyMC4yNSAxNy4xMDQ2IDE5LjM1NDYgMTggMTguMjUgMThINkM0Ljg5NTQzIDE4IDQgMTcuMTA0NiA0IDE2VjdaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTguNjI1IDkuMDYyNDJWOC4wODMyNUMxOC42MjUgNi45Nzg2OCAxNy43Mjk2IDYuMDgzMjUgMTYuNjI1IDYuMDgzMjVMMTAuMjI5MiA2LjA4MzI1IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjAuOSIvPgo8L3N2Zz4=" style="margin-top: -17px;">';
                table += '<tr userid="' + users[i].src.id + '"><td>' + c + '</td><td class="name">' + users[i].src.name + '</td><td class="email">' + users[i].src.email + '</td>' +
                    //'<td>' + users[i].src.desc + '</td>' +
                    '<td>' + totalcameras + '</td>' +
                    '<td class="action-icons">' +
                    //'<button class="userbtn item-resend-confirm" title="Resend confirm email"></button>' +
                    //'<button class="userbtn item-report"></button>' +
                    '<button class="userbtn item-arch userarchive '+(archive_enable?'active':'')+'" userid='+users[i].src.id+' username="'+users[i].src.name+'"><i class="fa fa-folder-o" aria-hidden="true"></i></button>'+
                    '<button class="userbtn item-cams usercameras" onclick_toscreen="usercameras"><i class="fa fa-video-camera" aria-hidden="true"></i></button>' +
                    '<button class="userbtn item-edit edituser" onclick_toscreen="edituser"><i class="fa fa-pencil" aria-hidden="true"></i></button>' +
                    //'<button class="userbtn item-goto-user"></button>' +
                    '<button class="userbtn item-delete deleteuser" userid='+users[i].src.id+' username="'+users[i].src.name+'"><i class="fa fa-trash-o" aria-hidden="true"></i></button></td></tr>';
                c++;
    
            }
            table += '</tbody></table>'
            if (users.length>0)
                $(self.wrapper).find('.userlist').empty().append(table);
            else {
                self.wrapper.addClass('nouser');
                $(self.wrapper).find('.userlist').empty().append('No users. <a href="javascript:void(0)" ifscreen="edituser" onclick_toscreen="edituser">Add user</a>');
            }
            self.wrapper.removeClass('loader');
            self.wrapper.find('.userarchive').click(function(){

                if (!archive_channel_id){
                    dialogs['mdialog'].activate('<h7>Error</h7><p>You cannot create an archive. Your limit has been exceeded.</p><p><button name="cancel" class="vxgbutton">Ok</button></p>');
                    return;
                }

                let userid = this.getAttribute('userid');
                let username = this.getAttribute('username');
                let archive_enable = this.classList.contains('active');
                dialogs['mdialog'].activate('<h7>Do you want to assign archive ?</h7><p><br/><label><input type="checkbox" class="userarchive" '+(archive_enable?'checked="checked"':'')+' name="enable">Assign archive for user '+username+'?</label></p><p><button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;<button name="apply" class="vxgbutton">Apply</button></p>').then(function(r){
                    if (r.button!='apply') return;
                    let checked = r.form.enable=="on";

                    let archive_channel_id = parseInt(vxg.user.src.allCamsTokenMeta.storage_channel_id);
                    if (!archive_channel_id) return;
                    let attach = [], detach = [];
                    if (checked) attach.push(archive_channel_id);
                    else detach.push(archive_channel_id);
      
                    core.elements['global-loader'].show();
      
                    vxg.api.cloudone.user.relation({attach: attach, detach: detach, withUserID: userid}).then(function (ret) {
                        core.elements['global-loader'].hide();
                        return self.on_show();
                    },function(r){
                        if (r && r.responseJSON && r.responseJSON.errorDetail)
                            alert(r.responseJSON.errorDetail);
                        else
                            alert('Falied to update user cameras');
                        core.elements['global-loader'].hide();
                    });
                });
            });
            self.wrapper.find('.deleteuser').click(function(){
                let userid = this.getAttribute('userid');
                let username = this.getAttribute('username');
                dialogs['mdialog'].activate('<h7>Do you want to delete '+username+'?</h7><p>It can\'t be cancelled </p><p><button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;<button name="delete" class="vxgbutton">Delete</button></p>').then(function(r){
                    if (r.button!='delete') return;
                    core.elements['global-loader'].show();
                    vxg.api.cloudone.user.del(userid).then(function(){
                        core.elements['global-loader'].hide();
                        return self.on_show();
                    },function(r){
                        core.elements['global-loader'].hide();
                        let err_text = 'Failed to delete user';
                        if (r && r.responseJSON && r.responseJSON.errorDetail) err_text = r.responseJSON.errorDetail;
                        dialogs['mdialog'].activate('<h7>Error</h7><p>'+err_text+'</p><p><button name="cancel" class="vxgbutton">Ok</button></p>');
                    });
                });
            });
            self.filter();
        }, function(){
            self.wrapper.addClass('nouser');
            $(self.wrapper).find('.userlist').empty().append('Failed load users list');
            self.wrapper.removeClass('loader');
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

window.screens['edituser'] = {
    'header_name': 'Add user',
    'html': path+'edituser.html',
    'on_before_show':function(r){
        delete this.user;
        if (this.src){
            let userid = $(this.src).attr('userid');
            if (userid===undefined)
                userid = $($(this.src).parents('[userid]')[0]).attr('userid');
            userid = parseInt(userid);
            if (userid)
                this.user = vxg.users.getUserByID(userid);
        } 
        return defaultPromise();
    },
    'on_show':function(r){
        this.wrapper.find('[name="username"], [name="email"], [name="address"], [name="desc"], [name="password"]').val('');
        this.wrapper.find('[name="phone"]').val('+1');
        this.wrapper.find('[name="email"]').removeAttr('disabled');
//        this.wrapper.find('.pass').show();
        if (!this.user){
            $(this.wrapper).find('.invite').hide();
            return defaultPromise();
        }
        $(this.wrapper).find('.invite').show();
        core.elements['header-center'].text('Edit user: '+this.user.src.name);
        this.wrapper.find('[name="username"]').val(this.user.src.name);
        this.wrapper.find('[name="email"]').val(this.user.src.email).attr('disabled','disabled');
//        this.wrapper.find('.pass').hide();
        this.wrapper.find('[name="address"]').val(this.user.src.address);
        this.wrapper.find('[name="desc"]').val(this.user.src.desc);
        this.wrapper.find('[name="phone"]').val(this.user.src.phone ? this.user.src.phone : '');
        this.wrapper.find('form week-sheduler').val(this.user.src.sheduler);
        this.wrapper.find('.week_shedule').removeClass('active');

        return defaultPromise();
    },
    'on_hide':function(){
    },
    'on_ready':function(){
    },
    'on_init':function(){
        let self = this;
        this.wrapper.find('.week_shedule').click(function(){
            $(this).toggleClass('active');
        });
        this.wrapper.find('.invite').click(function(){
            if (window.firebase){
                var actionCodeSettings = {
                    url: (window.location.href.indexOf('#')===-1 ? window.location.href : window.location.href.substr(0,window.location.href.indexOf('#'))) + '#login='+self.wrapper.find('form [name="email"]').val()
                };
                self.wrapper.find('.invite').attr('disabled','disabled');
                window.firebase.auth().sendPasswordResetEmail(self.wrapper.find('form [name="email"]').val(), actionCodeSettings).then(function(){
                    self.wrapper.find('.invite').removeAttr('disabled');
                    dialogs['idialog'].activate('Password recovery email has been sent')
                },function(){
                    self.wrapper.find('.invite').removeAttr('disabled');
                    alert('Fail to send password recovery email');
                });
                
            }
        });
        this.wrapper.find('.apply').click(function(){
            let r = self.wrapper.find('form').serializeObject();
            r.sheduler = self.wrapper.find('form week-sheduler').val()
            if (!r.username.trim()){
                window.core.flashInputBackgroundColor(self.wrapper.find('form [name="username"]'));
                return;
            }
            if(self.user){
                if (r.phone){
                    if ((''+r.phone).length!==10 || isNaN(parseInt(r.phone))){
                        window.core.flashInputBackgroundColor(self.wrapper.find('form [name="phone"]'));
                        return;
                    }
                } else r.phone='';
                r.id = self.user.src.id;
                r.pass = ''+r.pass;
                if (r.password) r.pass = ''+r.password; else delete r.password;
                delete r.email;
                core.elements['global-loader'].show();
                vxg.api.cloudone.user.update(r).then(function(){
                    core.elements['global-loader'].hide();
                    window.core.onclick_toscreen('back');
                },function(r){
                    if (r && r.responseJSON && r.responseJSON.errorDetail)
                        alert(r.responseJSON.errorDetail);
                    else
                        alert('Falied to update user data');
                    core.elements['global-loader'].hide();
                });
                return;
            }
            if (!r.email.trim()){
                window.core.flashInputBackgroundColor(self.wrapper.find('form [name="email"]'));
                return;
            }
            core.elements['global-loader'].show();
            if (r.password) r.pass = (r.password=''+r.password);
            vxg.api.cloudone.user.invite(r).then(function(){
                core.elements['global-loader'].hide();
                window.core.onclick_toscreen('back');
            },function(r){
                if (r && r.responseJSON && r.responseJSON.errorDetail)
                    alert(r.responseJSON.errorDetail);
                else
                    alert('Falied to add user');
                core.elements['global-loader'].hide();
            });
        });

        return defaultPromise();
    }
};

window.screens['deleteuser'] = {
    'header_name': 'Delete user',
    'html': path+'deleteuser.html',
    'on_before_show':function(r){
        delete this.user;
        if (this.src){
            let userid = $(this.src).attr('userid');
            if (userid===undefined)
                userid = $($(this.src).parents('[userid]')[0]).attr('userid');
            userid = parseInt(userid);
            if (userid)
                this.user = vxg.users.getUserByID(userid);
        } 
        return defaultPromise();
    },
    'on_show':function(r){
        $(this.wrapper).find('.un').empty();
        if (this.user) $(this.wrapper).find('.un').text(this.user.src.name);
        return defaultPromise();
    },
    'on_hide':function(){
    },
    'on_ready':function(){
    },
    'on_init':function(){
        let self = this;
        this.wrapper.find('.apply').click(function(){
            core.elements['global-loader'].show();
            vxg.api.cloudone.user.del(self.user.src.id).then(function(){
                core.elements['global-loader'].hide();
                window.core.onclick_toscreen('back');
            },function(r){
                if (r && r.responseJSON && r.responseJSON.errorDetail)
                    alert(r.responseJSON.errorDetail);
                else
                    alert('Falied to add user');
                core.elements['global-loader'].hide();
            });
        });

        return defaultPromise();
    }
};

window.screens['usercameras'] = {
    'header_name': 'Assign camera to user',
    'html': path+'usercameras.html',
    'on_before_show':function(r){
        delete this.user;
        if (this.src){
            let userid = $(this.src).attr('userid');
            if (userid===undefined)
                userid = $($(this.src).parents('[userid]')[0]).attr('userid');
            userid = parseInt(userid);
            if (userid)
                this.user = vxg.users.getUserByID(userid);
        } 
        return defaultPromise();
    },
    'on_show':function(r){
        let self = this;
        $(self.wrapper).find('.usercameralist').empty().addClass('spinner');
        return window.vxg.cameras.getCameraListPromise(100,0, null, "isstorage").then(function(list){
            if (!list.length){
                $(self.wrapper).find('.usercameralist').empty().removeClass('spinner').append('No cameras available');
                return;
            }

            let html='';
            for (let i in list){
                let checked = self.user.src.cameras.indexOf(list[i].camera_id)>=0;
                html += `<div class="camerablock">
                            <campreview access_token="${list[i].camera_id}"></campreview>
                            <div class="usercamera-cont">
                                <div class="nameloc"> 
                                    <span class="name">${list[i].src.name}</span>
                                    <span class="loc">${list[i].getLocation()}</span>
                                </div>
                                <label id="cameraselect" class="camera-label custom-checkbox checkbox ${(checked ? 'active' : '')}" channel_id="${list[i].camera_id}">
                                    <input class="camera-check" ${(checked ? 'checked' : '')} type="checkbox" id="check_${list[i].camera_id}">
                                    <span class="checkmark"></span>	
                                </label>
                            </div>
                        </div>`;
            }

            $(self.wrapper).find('.usercameralist').html(html);
            $(self.wrapper).find('.usercameralist .camerablock').click(function(){
                $(this).find('.checkbox').toggleClass('active');
                var checkInput = $(this).find(".camera-check");
                checkInput.prop("checked", !checkInput.prop("checked"));
            });

            $(self.wrapper).find(".camera-check").click(function() {
                var channelId = $(this).attr('id').replace("check_", "");
                $(`[channel_id=${channelId}]`).toggleClass("active");
            })

            $(self.wrapper).find('.usercameralist').removeClass('spinner');
        });

        return defaultPromise();
    },
    'on_hide':function(){
    },
    'on_ready':function(){
    },
    'on_init':function(){
        let self = this;
        this.wrapper.find('.apply').click(function(){
              core.elements['global-loader'].show();

              let r = [], attach = [], detach = [];
              $(self.wrapper).find('.usercameralist .checkbox.active').each(function(){
                  r.push(parseInt($(this).attr('channel_id')));
              });
              for (let i in r)
                  if (self.user.src.cameras.indexOf(r[i])===-1)
                      attach.push(r[i]);
              for (let i in self.user.src.cameras)
                  if (r.indexOf(self.user.src.cameras[i])===-1 && (!vxg.user.src.allCamsTokenMeta || parseInt(vxg.user.src.allCamsTokenMeta.storage_channel_id)!=self.user.src.cameras[i]))
                      detach.push(self.user.src.cameras[i]);
              vxg.api.cloudone.user.relation({attach: attach, detach: detach, withUserID: self.user.src.id}).then(function (ret) {
                  self.user.src.cameras = r;
                  core.elements['global-loader'].hide();
                  window.core.onclick_toscreen('back');
              },function(r){
                if (r && r.responseJSON && r.responseJSON.errorDetail)
                    alert(r.responseJSON.errorDetail);
                else
                    alert('Falied to update user cameras');
                core.elements['global-loader'].hide();
            });


        });

        return defaultPromise();
    }
};

function getUserFromElement(element){
    let userid = $(element).attr('userid');
    if (userid===undefined)
        userid = $($(element).parents('[userid]')[0]).attr('userid');
    userid = parseInt(userid);
    if (!userid) return;
    return vxg.users.getUserByID(userid);
}

window.screens['userarchive'] = {
    'header_name': 'Assign archive to user',
    'html': path+'userarchive.html',
    'on_before_show':function(r){
        delete this.user;
        if (this.src){
            let userid = $(this.src).attr('userid');
            if (userid===undefined)
                userid = $($(this.src).parents('[userid]')[0]).attr('userid');
            userid = parseInt(userid);
            if (userid)
                this.user = vxg.users.getUserByID(userid);
        } 
        return defaultPromise();
    },
    'on_show':function(r){
        let self = this;
        let archive_channel_id = parseInt(vxg.user.src.allCamsTokenMeta.storage_channel_id);
        if (this.user.src.cameras.indexOf(archive_channel_id)<0)
            $(self.wrapper).find('.userarchive input')[0].checked = false;
        else
            $(self.wrapper).find('.userarchive input')[0].checked = true;
        core.elements['header-center'].html("Assign archive to user " + this.user.src.email);

        return defaultPromise();
    },
    'on_hide':function(){
    },
    'on_ready':function(){
    },
    'on_init':function(){
        let self = this;
        this.wrapper.find('.apply').click(function(){
              let checked = $(self.wrapper).find('.userarchive input:checked').length>0;
              let archive_channel_id = parseInt(vxg.user.src.allCamsTokenMeta.storage_channel_id);
              let attach = [], detach = [];
              if (checked) attach.push(archive_channel_id);
              else detach.push(archive_channel_id);


              core.elements['global-loader'].show();

              vxg.api.cloudone.user.relation({attach: attach, detach: detach, withUserID: self.user.src.id}).then(function (ret) {
                  let i = self.user.src.cameras.indexOf(archive_channel_id);
                  if (i && !checked) delete self.user.src.cameras[i];
                  if (i<0 && checked) self.user.src.cameras.push(archive_channel_id);
                  core.elements['global-loader'].hide();
                  window.core.onclick_toscreen('back');
              },function(r){
                if (r && r.responseJSON && r.responseJSON.errorDetail)
                    alert(r.responseJSON.errorDetail);
                else
                    alert('Falied to update user cameras');
                core.elements['global-loader'].hide();
            });


        });

        return defaultPromise();
    }
};
