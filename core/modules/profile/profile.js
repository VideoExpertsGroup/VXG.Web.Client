window.screens = window.screens || {};
var path = window.core.getPath('profile.js');

window.screens['profile'] = {
    bucket: {},
    storage_config: {},
    'get_args':function(){
    },
    'header_name': 'User profile',
    'html': path+'profile.html',
    'stablecss':[path+'profile.css'],
    'on_show':function(){
        if (vxg.user.src.plans.length != 0) {
            planTable = `
                <tr class="plan-header">
                    <th>Plan</th>
                    <th>Count</th>
                    <th>Used</th>
                </tr>
            `;
            vxg.user.src.plans.forEach(plan => {
                if (plan.count != 0) {
                    planTable += `
                    <tr class="plan ${ plan.count == plan.used ? "disabled" : ""}">
                        <td class="plan-desc" planid="${plan.id}"> ${plan.name} </td>
                        <td class="plan-count">${plan.count}</td>
                        <td class="used-count" >${plan.used}</td>
                    </tr>
                    `;
                }
            });
    
            var planlist = `
                <table class="plansTable">
                    ${planTable}
                </table>
            `;
            $(this.wrapper).find('.planlist').html(planlist);
        } else {
            $(this.wrapper).find('.planlist').html("<p>No subscriptions found for this account.</p>");
        }
        $(this.wrapper).find('[name="phone"]').val(vxg.user.src.phone ? vxg.user.src.phone:'' );
        $(this.wrapper).find('[name="sheduler"]').val(vxg.user.src.sheduler ? vxg.user.src.sheduler:'' );
        $(this.wrapper).addClass('tab2').removeClass('tab1').removeClass('tab3').removeClass('tab4');

        let self = this;
        core.elements['global-loader'].show();
        vxg.api.cloudone.storage.getStorages().then(function(data){
            core.elements['global-loader'].hide();
            if ( data.data.objects.length > 0) {
                let current_bucket = data.data.objects[0];
                self.bucket = current_bucket;

                $(self.wrapper).find('[name="storage_type"]').val( current_bucket.type );
                $(self.wrapper).find('[name="storage_type"]').change();
                $(self.wrapper).find('.remove_storage').css('display', 'block');

                $(self.wrapper).find('[name="endpoint"]').val( current_bucket.endpoint );
                $(self.wrapper).find('[name="name"]').val( current_bucket.name );
                $(self.wrapper).find('[name="access_key"]').val( current_bucket.access_key );
                $(self.wrapper).find('[name="secret_key"]').val( current_bucket.secret_key );
                $(self.wrapper).find('[name="upload_sqs_name"]').val( current_bucket.upload_sqs_name );
                $(self.wrapper).find('[name="upload_sqs_region"]').val( current_bucket.upload_sqs_region );
            }
        },function(r){
            core.elements['global-loader'].hide();
        });
        return defaultPromise();
    },
    'on_hide':function(){
        $(this.wrapper).find('.planlist').html('');
        return defaultPromise();
    },
    'on_ready':function(){
        core.elements['header-search'].prepend('');
        core.elements['header-search'].find('form').submit(function(e){
            e.preventDefault();
            let t = core.elements['header-search'].find('input').val();
            let s = window.core.getActiveScreen();
            if (typeof s['on_search'] === 'function') s['on_search'](t);
            $(this).find('input').blur();
        });

        var path = window.core.getPath('profile.js');
        core.elements['global-menu-header'].html(''+
        '<div class="dropdown profile-element" style="height:155px;padding-top: 32px;" onclick_toscreen="profile">'+
        '<span class="rounded-circle profile-img" src="'+path+'profile_dev.svg"></span><br/>'+
        '<div class="username">'+vxg.user.src.username+'</div>'+
        '</div>');
        return defaultPromise();
    },
    'on_signout':function(){
    },
    'on_init':function(){
        let self = this;
	 if (vxg.user.src.role == "user") $(".prifiletabs > .tab3").hide();
     if (vxg.user.src.role != "partner") $(".prifiletabs > .tab4").hide();
	 $(self.wrapper).addClass('tab2');
        core.elements['header-center'].text('User '+vxg.user.src.email+' profile');
        this.wrapper.find('.prifiletabs > div').click(function(){
            if ($(this).hasClass('tab1')) $(self.wrapper).addClass('tab1').removeClass('tab2').removeClass('tab3').removeClass('tab4');
            if ($(this).hasClass('tab2')) $(self.wrapper).addClass('tab2').removeClass('tab1').removeClass('tab3').removeClass('tab4');
            if ($(this).hasClass('tab3')) $(self.wrapper).addClass('tab3').removeClass('tab2').removeClass('tab1').removeClass('tab4');
	        if ($(this).hasClass('tab4')) $(self.wrapper).addClass('tab4').removeClass('tab1').removeClass('tab2').removeClass('tab3');
        });

        $.getJSON("core/modules/profile/storage.json", function(json) {
          console.log(json);
          self.storage_config = json;

          if (self.storage_config.providers && self.storage_config.providers.length > 0) {
             for (var i=0;i<self.storage_config.providers.length;i++){
                $(self.wrapper).find('[name="storage_type"]').append(
                   '<option value="'+ self.storage_config.providers[i].name + '"' + ((i==0)?(" selected"):("")) + '>' + self.storage_config.providers[i].showableName + '</option>'
                );
             }
             $(self.wrapper).find('[name="storage_type"]').change();
          }
        });
        this.wrapper.find('[name="storage_type"]').change(function(){
            let provider = $(self.wrapper).find('[name="storage_type"] option:selected').val();
            let endpoint = $(self.wrapper).find('[name="endpoint"]').val();
 
            if (self.storage_config.providers && self.storage_config.providers.length > 0) {
               for (var i=0;i<self.storage_config.providers.length;i++){
                  if (provider === self.storage_config.providers[i].name){
                     if (self.storage_config.providers[i].controls.endpoint_visible == true){
                        $(self.wrapper).find('.strg_ep').removeClass('hidden')
                     } else {
                        $(self.wrapper).find('.strg_ep').addClass('hidden')
                     }
                     if (self.storage_config.providers[i].controls.name_visible == true){
                        $(self.wrapper).find('.strg_nm').removeClass('hidden')
                     } else {
                        $(self.wrapper).find('.strg_nm').addClass('hidden')
                     }
                     if (self.storage_config.providers[i].controls.access_key_visible == true){
                        $(self.wrapper).find('.strg_ak').removeClass('hidden')
                     } else {
                        $(self.wrapper).find('.strg_ak').addClass('hidden')
                     }
                     if (self.storage_config.providers[i].controls.secret_key_visible == true){
                        $(self.wrapper).find('.strg_sk').removeClass('hidden')
                     } else {
                        $(self.wrapper).find('.strg_sk').addClass('hidden')
                     }
                     if (self.storage_config.providers[i].controls.upload_sqs_name_visible == true){
                        $(self.wrapper).find('.strg_usn').removeClass('hidden')
                     } else {
                        $(self.wrapper).find('.strg_usn').addClass('hidden')
                     }
                     if (self.storage_config.providers[i].controls.upload_sqs_region_visible == true){
                        $(self.wrapper).find('.strg_usr').removeClass('hidden')
                     } else {
                        $(self.wrapper).find('.strg_usr').addClass('hidden')
                     }
                     if ( self.bucket && self.bucket.type == provider) {
                        $(self.wrapper).find('[name="endpoint"]').val( self.bucket.endpoint );
                     } else {
                        $(self.wrapper).find('[name="endpoint"]').val( (self.storage_config.providers[i].end_point||"") );
                     }
                     break;
                  } 
               }
            }
        });
        this.wrapper.find('.showhidepass').click(function(){
            if ($(this.previousSibling).attr('type')=='text')
                $(this.previousSibling).attr('type','password');
            else
                $(this.previousSibling).attr('type','text');
        });
        this.wrapper.find('button.submit2').click(function(){
            var obj = {
                id: vxg.user.src.uid,
                phone: self.wrapper.find('[name="phone"]').val(),
                sheduler: self.wrapper.find('[name="sheduler"]')[0].value
            };

            if (obj.phone){
                if (obj.phone.length!==10 || isNaN(parseInt(obj.phone))){
                    window.core.flashInputBackgroundColor(self.wrapper.find('[name="phone"]'));
                    return;
                }
            } else obj.phone='';
            core.elements['global-loader'].show();
            vxg.api.cloudone.user.update(obj).then(function(){
                core.elements['global-loader'].hide();
                vxg.user.src.phone = obj.phone;
                vxg.user.src.sheduler = obj.sheduler;
            },function(r){
                if (r && r.responseJSON && r.responseJSON.errorDetail)
                    alert(r.responseJSON.errorDetail);
                else
                    alert('Falied to update user data');
                core.elements['global-loader'].hide();
            });
        });

        this.wrapper.find('button.submit').click(function(){
            var obj = {
                password: self.wrapper.find('[name="current_password"]').val(),
                new_password: self.wrapper.find('[name="new_password"]').val(),
                reenter_new_password: self.wrapper.find('[name="reenter_new_password"]').val(),
            };
            if (!obj.password || !obj.new_password) {
                alert('Password empty');
                return;
            }
            if (obj.new_password != obj.reenter_new_password) {
                alert('Password mismatch');
                return;
            }
            core.elements['global-loader'].show();
            if (firebase){
                var user = firebase.auth().currentUser;
                var credential = firebase.auth.EmailAuthProvider.credential(firebase.auth().currentUser.email, obj.password);
                user.reauthenticateWithCredential(credential).then(function() {
                    firebase.auth().currentUser.updatePassword(obj.new_password).then(function(){
                        core.elements['global-loader'].hide();
                    }, function(r){
                        alert('Error on change password. '+(r.message?r.message:''));
                        core.elements['global-loader'].hide();
                    });
                }).catch(function(error) {
                    core.elements['global-loader'].hide();
                    alert('Invalid password');
                });
                return;
            }
/*
            vs_api.user.change_password(obj).then(function(){
                core.elements['global-loader'].hide();
            },function(err){
                alert(err.responseJSON.errorDetail);
                core.elements['global-loader'].hide();
            });
*/
        });
	this.wrapper.find('button.submit_storage').click(function(){
            var obj = {
                storage: self.wrapper.find('[name="storage_type"]').val(),
                endpoint: self.wrapper.find('[name="endpoint"]').val(),
                name: self.wrapper.find('[name="name"]').val(),
                access_key: self.wrapper.find('[name="access_key"]').val(),
                secret_key: self.wrapper.find('[name="secret_key"]').val(),
                upload_sqs_name: self.wrapper.find('[name="upload_sqs_name"]').val(),
                upload_sqs_region: self.wrapper.find('[name="upload_sqs_region"]').val()
            };

            if (!obj.endpoint ) {
                alert('Necessary fields are empty');
                return;
            }
            if (self.bucket && self.bucket.id ) {
                obj.id = self.bucket.id;
                core.elements['global-loader'].show();
                vxg.api.cloudone.storage.putStorage(obj).then(function(data){
                  core.elements['global-loader'].hide();
                },function(r){
                  core.elements['global-loader'].hide();
                  alert('Cant change storage settings')
                });
            } else {
                core.elements['global-loader'].show();
                vxg.api.cloudone.storage.postStorage(obj).then(function(data){
                  core.elements['global-loader'].hide();
                  self.bucket = data.data;
                  $(self.wrapper).find('.remove_storage').css('display', 'block');
                },function(r){
                  core.elements['global-loader'].hide();
                  alert(r.responseJSON.errorDetail);
                });
            }
        });
        this.wrapper.find('button.remove_storage').click(function(){
            core.elements['global-loader'].show();
            vxg.api.cloudone.storage.removeStorage({"id": self.bucket.id}).then(function(){
                location.reload();
            }, function(r) {
                core.elements['global-loader'].hide();
                alert('Error removing storage')
            });
        });
        return defaultPromise();
    }
};