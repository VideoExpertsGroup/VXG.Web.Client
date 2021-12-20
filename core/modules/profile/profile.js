window.screens = window.screens || {};
var path = window.core.getPath('profile.js');

window.screens['profile'] = {
    'get_args':function(){
    },
    'header_name': 'User profile',
    'html': path+'profile.html',
    'stablecss':[path+'profile.css'],
    'on_show':function(){
        if (window.controls['planlist']!==undefined)
            $(this.wrapper).find('.planlist').html('<planlist></planlist>');
        $(this.wrapper).find('[name="phone"]').val(vxg.user.src.phone ? vxg.user.src.phone:'' );
        $(this.wrapper).find('[name="sheduler"]').val(vxg.user.src.sheduler ? vxg.user.src.sheduler:'' );
        $(this.wrapper).addClass('tab1').removeClass('tab2').removeClass('tab3');
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
        core.elements['header-center'].text('User '+vxg.user.src.email+' profile');
        this.wrapper.find('.prifiletabs > div').click(function(){
            if ($(this).hasClass('tab1')) $(self.wrapper).addClass('tab1').removeClass('tab2').removeClass('tab3');
            if ($(this).hasClass('tab2')) $(self.wrapper).addClass('tab2').removeClass('tab1').removeClass('tab3');
            if ($(this).hasClass('tab3')) $(self.wrapper).addClass('tab3').removeClass('tab2').removeClass('tab1');
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
        return defaultPromise();
    }
};