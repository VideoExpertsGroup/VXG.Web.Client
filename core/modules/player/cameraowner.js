window.screens = window.screens || {};
window.controls = window.controls || {};
var path = window.core.getPath('cameraowner.js');


window.screens['addcamera'] = {
    'header_name': $.t('newCamera.title'),
    'html': path+'editcamera.html',
    'css': [path+'editcamera.css'],
    'commonjs':[],
    'stablecss':[],
    'js':[],
    'on_before_show':function(access_token){
        if (this.from_back) return defaultPromise();
        delete this.camera;
        let self=this;
        this.wrapper.find('.sarea').html(`<button class="vxgbutton" onclick_toscreen="back">${$.t('action.back')}</button>`);
        if (!access_token)
            access_token = $(this.src).getNearParentAtribute('access_token');
        if (!access_token) access_token='';
        this.access_token = access_token;

        if (!access_token) return defaultPromise();
        return vxg.cameras.getCameraFrom(access_token).then(function(camera){
            self.camera = camera;
        });
    },
    'on_show':function(camtoken){
        if (!this.camera) {
            this.wrapper.find('cameraedit').attr('access_token','');
            return defaultPromise();
        }
        core.elements['global-loader'].show();
        this.wrapper.find('cameraedit').attr('access_token',this.access_token);
        return this.camera.getName().then(function(name){
            core.elements['header-center'].text(`${$.t('cameras.editCamera')}: ${name}`);
        });
    },
    'on_hide':function(){
    },
    'on_ready':function(){
        return defaultPromise();
    },
    'on_init':function(){
        let self = this;
        this.wrapper.find('cameraedit').off('loaded').on('loaded',function(e){
             core.elements['global-loader'].hide();
        });
        this.wrapper.find('cameraedit').off('submited').on('submited',function(e){
             self.wrapper.find('> .apply').removeAttr('disabled');
             core.elements['global-loader'].hide();
             window.core.onclick_toscreen('back');
        });
        this.wrapper.find('cameraedit').off('error').on('error',function(e){
             core.elements['global-loader'].hide();
        });
        this.wrapper.find('> .apply').click(function(e){
             if (self.wrapper.find('cameraedit').submit())
                 core.elements['global-loader'].show();
        });
        return defaultPromise();
    }
};

window.screens['removecamera'] = {
    'header_name': $.t('cameras.removeCamera'),
    'html': path+'removecamera.html',
    'css': [path+'removecamera.css'],
    'stablecss':[],
    'js':[],
    'on_before_show':function(access_token){
        let self=this;
        this.wrapper.find('.sarea').html(`<button class="vxgbutton" onclick_toscreen="back">${$.t('action.back')}</button>`);
        if (!access_token)
            access_token = $(this.src).getNearParentAtribute('access_token');
        if (!access_token) return defaultPromise();

        return vxg.cameras.getCameraFrom(access_token).then(function(camera){
            self.camera = camera;
        });
    },
    'on_show':function(camtoken){
        if (!this.camera && !camtoken)
            return defaultPromise();
        if (camtoken) this.wrapper.find('.remcam').attr('access_token',camtoken);
        else this.wrapper.find('.remcam').attr('access_token',this.camera.camera_id);

        return defaultPromise();
    },
    'on_hide':function(){
        this.wrapper.find('.remcam').removeAttr('access_token');
    },
    'on_ready':function(){
        return defaultPromise();
    },
    'on_init':function(){
         let self = this;
         this.wrapper.find('.apply').click(function(){
             core.elements['global-loader'].show();
             if (self.camera) self.camera.deleteCameraPromise().then(function(){
                 core.elements['global-loader'].hide();
                 window.core.onclick_toscreen('back');
             }, function(){
                 core.elements['global-loader'].hide();
                 window.core.onclick_toscreen('back');
             });
         });
         return defaultPromise();
    }
};

window.screens['camerasettings'] = {
    'header_name': $.t('cameras.cameraSettings'),
    'html': path+'camerasettings.html',
    'css': [path+'camerasettings.css'],
    'stablecss':[],
    'js':[],
    'on_before_show':function(access_token){
        if (this.from_screen == "camerasettingsgrid") return defaultPromise();
        delete this.camera;
        this.access_token = '';
        if (!access_token)
            access_token = $(this.src).getNearParentAtribute('access_token');
        if (access_token) 
            this.access_token = access_token;
        return defaultPromise();

    },
    'on_show':function(){
        let self = this;
        $(this.wrapper).find('.settabbtn .apply').hide();
        core.elements['header-center'].html($.t('cameras.cameraSettings'));
        $(this.wrapper).find('cameraeditsettings').attr('access_token',this.access_token);
        $(this.wrapper).find('.mdbtn').attr('access_token',this.access_token);

        vxg.cameras.getCameraFrom(this.access_token).then(function(camera){
            self.camera = camera;
            self.camera.getName().then(function(name){
                core.elements['header-center'].html(`${$.t('cameras.settingsForCamera')} ${name}`);
            });
        });

        return defaultPromise();
    },
    'on_loaded': function(data){
        this.wrapper.removeClass('loader');
        return defaultPromise();
    },
    'on_hide':function(){
        delete self.camera;
//        this.wrapper.find('.sarea').html(`<button class="vxgbutton" onclick_toscreen="back">${$.t('action.back')}</button>`);
    },
    'on_ready':function(){
        return defaultPromise();
    },
    'on_init':function(){
        let self=this;
        $(self.wrapper).find('.settabbtn .apply').hide();
        $(this.wrapper).find('.settabbtn .apply').show().click(function(){
            $(self.wrapper).find('cameraeditsettings').submit();
        });
        $(this.wrapper).find('cameraeditsettings').on('submited',function(){
            window.core.onclick_toscreen('back');
        });
        $(this.wrapper).find('cameraeditsettings').on('submit',function(){
            $(self.wrapper).find('.settabbtn .apply').hide();
        });
        $(this.wrapper).find('cameraeditsettings').on('error',function(){
            $(self.wrapper).find('.settabbtn .apply').show();
        });
        $(this.wrapper).find('cameraeditsettings').on('submitenable',function(){
            $(self.wrapper).find('.settabbtn .apply').show();
        });
        return defaultPromise();
    }
};


window.screens['camerasettingsgrid'] = {
    'header_name': $.t('cameras.cameraMotionDetectionSettings'),
    'html': path+'camerasettingsgrid.html',
    'css': [path+'camerasettingsgrid.css'],
    'stablecss':[],
    'js':[],
    'on_before_show':function(access_token){
        let self=this;
        delete self.camera;
        if (!access_token)
            access_token = $(this.src).getNearParentAtribute('access_token');
        $(this.wrapper).find('.mdbtn').attr('access_token',access_token);
        if (!access_token) return defaultPromise();
        $(this.wrapper).find('.settabbtn .apply').hide();
        return vxg.cameras.getCameraFrom(access_token).then(function(camera){
            self.camera = camera;
            $(self.wrapper).find('cameramd, .sbtn').attr('access_token',access_token);
        });
    },
    'on_show':function(){
        if (!this.camera) return defaultPromise();
        core.elements['header-center'].html($.t('cameras.cameraSettings'));
        this.camera.getName().then(function(name){
            core.elements['header-center'].html(`${$.t('cameras.settingsForCamera')} ${name}`);
        });
    },
    'on_hide':function(){
        $(this.wrapper).find('cameramd, .sbtn').attr('access_token','');
    },
    'on_init':function(){
        let self=this;
        $(this.wrapper).find('.settabbtn .apply').click(function(){
            $(self.wrapper).find('cameramd').submit();
        });
        $(this.wrapper).find('cameramd').on('submitenable',function(){
            $(self.wrapper).find('.settabbtn .apply').show();
        });
        return defaultPromise();
    }
}

