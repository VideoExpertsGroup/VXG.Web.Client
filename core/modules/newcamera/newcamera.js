window.screens = window.screens || {};
window.controls = window.controls || {};
var path = window.core.getPath('newcamera.js');

window.screens['newcamera'] = {
    'header_name': 'Add camera',
    'html': path+'newcamera.html',
    'css': [path+'newcamera.css'],
    'commonjs':[],
    'stablecss':[],
    'js':[],
    'on_before_show':function(access_token){
        if (this.from_back) return defaultPromise();
        delete this.camera;
        let self=this;
        this.wrapper.find('.sarea').html('<button class="vxgbutton" onclick_toscreen="back">Back</button>');
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
            core.elements['header-center'].text('Edit camera: '+name);
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
        this.wrapper.find('.gsapply').click(function(e){
             if (self.wrapper.find('newgscamera').submit())
                 core.elements['global-loader'].show();
        });
        this.wrapper.find('.apply').click(function(e){
             if (self.wrapper.find('cameraedit').submit())
                 core.elements['global-loader'].show();
        });
        this.wrapper.find('newgscamera').off('submited').on('submited',function(e){
             self.wrapper.find('.gsapply').removeAttr('disabled');
             core.elements['global-loader'].hide();
             window.core.onclick_toscreen('back');
        });
        this.wrapper.find('newgscamera').off('error').on('error',function(e){
             core.elements['global-loader'].hide();
        });
        this.wrapper.find('.newcamerabtns > .add1').click(function(e){
            self.wrapper.find('.newcameratabs ').removeClass('add2').removeClass('add3').addClass('add1');
        });
        this.wrapper.find('.newcamerabtns > .add2').click(function(e){
            self.wrapper.find('.newcameratabs ').removeClass('add1').removeClass('add3').addClass('add2');
        });
        this.wrapper.find('.newcamerabtns > .add3').click(function(e){
            self.wrapper.find('.newcameratabs ').removeClass('add2').removeClass('add1').addClass('add3');
        });
        return defaultPromise();
    }
};
