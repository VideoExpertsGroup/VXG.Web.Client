window.screens = window.screens || {};
var path = window.core.getPath('plan2camera.js');

window.screens['plan2camera'] = {
    'header_name': 'Set plan to camera',
    'html': path+'plan2camera.html',
    'js': [],
    'stablecss':[path+'plan2camera.css'],
    'on_show':function(camera_token){
        let self = this; let _camera_token = camera_token;
        $(self.wrapper).find('.selectplan').empty().addClass('spinner');
        $(self.wrapper).find('.apply').attr('disabled','disabled');

        return firebase.auth().currentUser.getIdToken().then(function(token){
            return window.vxgstripe.getUserInfo(token).then(function(user_info){
                let _user_info = user_info;
                return vxg.user.getUsedPlans().then(function(plans){
                    self.used_plans = plans;
                    if (_camera_token) 
                        return window.vxg.cameras.getCameraByTokenPromise(_camera_token).then(function(camera){return self.show_camera_settings(camera, _user_info);},function(){
                            alert('Failed get camera by token');
                            $(self.wrapper).find('.selectplan').removeClass('spinner');
                        });
                    return self.getCameraFromElement(self.src).then(function(camera){return self.show_camera_settings(camera, _user_info);},function(){
                        alert('Failed get camera by element');
                        $(self.wrapper).find('.selectplan').removeClass('spinner');
                    });
                }, function(){
                    alert('Failed get used plans');
                    $(self.wrapper).find('.selectplan').removeClass('spinner');
                });
            });
        });
    },
    show_camera_settings: function(camera, user_info){
        if (!camera) {alert('no camera');return;}
        if (!user_info) {alert('no user info');return;}
        let _user_info = user_info;
        let self = this;
        self.camera = camera;
        self.camera_plan_id = '';
        for (i in self.used_plans)
            for (let j=0; j<self.used_plans[i].length; j++)
                if (camera.camera_id == self.used_plans[i][j])
                    self.camera_plan_id = i;

        $(self.wrapper).find('.selectplan').removeClass('spinner');

        let html = '<div><label><input type="radio" name="cameraplan" value="" '+(!self.camera_plan_id ? 'checked' : '')+'>No plan (free)</label></div>';
        for (i=0; i<_user_info.plans.length; i++){
            if (!_user_info.plans[i].active && !_user_info.plans[i].paid_quantity && _user_info.plans[i].stripe_plan_id!=self.camera_plan_id) continue;
            let left = _user_info.plans[i].paid_quantity - (self.used_plans[_user_info.plans[i].stripe_plan_id]?self.used_plans[_user_info.plans[i].stripe_plan_id]:[]).length;
            if (_user_info.plans[i].stripe_plan_id==self.camera_plan_id) left++;
            let name = (_user_info.plans[i].metadata && _user_info.plans[i].metadata.name) ? _user_info.plans[i].metadata.name : _user_info.plans[i].stripe_plan_description;
            let addbutton = '';//_user_info.plans[i].active ? '<button class="add vxgbutton" ifscreen="subscribe2" onclick_toscreen="subscribe2" planid="'+_user_info.plans[i].stripe_plan_id+'">Add</button>' : '<div class="add arc">(archive)</div>';
            html += '<div>'+addbutton+'<label><input type="radio" name="cameraplan" '+(left<1 && _user_info.plans[i].stripe_plan_id!=self.camera_plan_id ?'disabled="disabled"':'')+' value="'+_user_info.plans[i].stripe_plan_id
                +'" '+(self.camera_plan_id==_user_info.plans[i].stripe_plan_id ? 'checked' : '')+'>'+name+(left>0?' (left '+left+')':'')+'</label></div>';
        }
        $(self.wrapper).find('.selectplan').html(html);
        $(self.wrapper).find('.apply').removeAttr('disabled');
    },
    'on_hide':function(){
        return defaultPromise();
    },
    'on_ready':function(){

        return defaultPromise();
    },

    'on_init':function(){
        let self = this;
        $(this.wrapper).find('.apply').click(function(){
            let planid = $(self.wrapper).find('.selectplan input:checked').val();
            if (self.camera_plan_id == planid) return;
            core.elements['global-loader'].show();
            self.camera.setPlans(planid).then(function(){
                core.elements['global-loader'].hide();
                core.onclick_toscreen('back');
            },function(){
                alert('Fail to save plan for camera');
                core.elements['global-loader'].hide();
            });
        });

        return defaultPromise();
    },
    getCameraFromElement: function (element){
        let access_token = $(element).attr('access_token');
        if (access_token===undefined)
            access_token = $($(element).parents('[access_token]')[0]).attr('access_token');
        if (!access_token) return defaultPromise();
    
        if (access_token[0]=='+'){
            let limit = parseInt(access_token.substr(1));
            return window.vxg.cameras.getCameraListPromise(limit+1,0).then(function(list){
                let l=0;
                for(let i in list){
                    if (l==limit){
                        return list[i];
                    }
                    l++;
                }
            });
        } else if (parseInt(access_token)>0)
            return window.vxg.cameras.getCameraByIDPromise(parseInt(access_token));
        else if (typeof access_token ==="string")
            return window.vxg.cameras.getCameraByTokenPromise(access_token);
        else return defaultPromise();
    }

};
