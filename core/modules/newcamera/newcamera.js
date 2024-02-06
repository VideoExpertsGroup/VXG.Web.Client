window.screens = window.screens || {};
window.controls = window.controls || {};
var path = window.core.getPath('newcamera.js');

window.screens['newcamera'] = {
    'header_name': $.t('newCamera.title'),
    'html': path+'newcamera.html',
    'css': [path+'newcamera.css'],
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

        var gatewayCamId = $(this.src).getNearParentAtribute("channel_id");
        var gatewayCamToken = $(this.src).getNearParentAtribute("gateway_token");

        if (gatewayCamId && gatewayCamToken) {
            this.gatewayCamId = gatewayCamId;
            this.gatewayCamToken = gatewayCamToken;
        } else {
            this.wrapper.find('.newcameratabs').removeClass("gatewayCamera");
            this.gatewayCamId = null;
            this.gatewayCamToken = null;
        }

        if (!access_token) return defaultPromise();
        return vxg.cameras.getCameraFrom(access_token).then(function(camera){
            self.camera = camera;
        });
    },
    'on_show':function(camtoken){
        var self = this;
     	this.wrapper.find('.newcameratabs ').removeClass('add2').removeClass('add1').removeClass('add4').removeClass('add5').addClass('add3');
        
        if (!this.camera) {
            this.wrapper.find('cameraedit').attr('access_token','');

            if (this.gatewayCamId) {
                return vxg.api.cloud.getCameraConfig(this.gatewayCamId, this.gatewayCamToken).then(function(cam) {
                    self.wrapper.find('.newcameratabs ').removeClass('add2').removeClass('add1').removeClass('add3').removeClass('add4').addClass('add5');
                    self.wrapper.find('.newcameratabs').addClass("gatewayCamera");
                    $('.headerBlock .header-center').text(`${$.t('newCamera.addCameraTo')} ${cam.name}`);
                    $('[name="location"]').addClass("disabled");
                    $('[name="group"]').addClass("disabled");
                    // gateway unique_id ?
                    $('[name="gatewayId"]').val(cam.meta.gateway_id);
                    if(cam.meta && cam.meta.location) self.wrapper.find('[name="location"]').val(cam.meta.location);
                    if(cam.meta && cam.meta.group) self.wrapper.find('[name="group"]').val(cam.meta.group);
                    $('[name="url_http_port"]').val(80);
                    $('[name="onvif_rtsp_port_fwd"]').val(554);
                    $('#prov-server-input').attr('checked', false);
                    $('.uplink-wrapper').hide();
                    $('.loc-dropdown').hide();
                    $('.gatewayinput').show();

                    var cameraUrlsStr = sessionStorage.getItem("cameraUrls");
                    var cameraUrls = cameraUrlsStr ? JSON.parse(cameraUrlsStr) : [];
                    var savedCam = cameraUrls.length != 0 ? cameraUrls.find(x => x.id == this.gatewayCamId) : "";

                    if (savedCam && savedCam.url && savedCam.url != "nourl") {
                        $('[name="gatewayUrl"]').val(savedCam.url);
                    } else if (!savedCam) {
                        return vxg.api.cloud.getUplinkUrl(cam.id, cam.url).then(function(urlinfo) {
                            if (!urlinfo.id && !urlinfo.url) {
                                cameraUrls.push({id: config.id, url: "nourl"});
                                sessionStorage.setItem("cameraUrls", JSON.stringify(cameraUrls));
                            } else {
                                cameraUrls.push({id: urlinfo.id, url: urlinfo.url});
                                sessionStorage.setItem("cameraUrls", JSON.stringify(cameraUrls));  
                                $('[name="gatewayUrl"]').val(urlinfo.url);
                            }
                        });
                    }
                });
            } else {
                $('[name="location"]').removeClass("disabled");
                $('[name="group"]').removeClass("disabled");
                $('[name="gatewayId"]').val("");
                $('[name="gatewayUrl"]').val("");
                $(['[name="url_http_port"']).val('');
                $(['[name="onvif_rtsp_port_fwd"']).val('');
                self.wrapper.find('[name="location"').val("");
                self.wrapper.find('[name="group"').val("");
                $('#prov-server-input').attr('checked', true);
                $('.uplink-wrapper').show();
                $('.gatewayinput').hide();
            }
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

        core.elements['header-right'].prepend(`<a class="helpurl" target="_blank" href="${vxg.links.camera_help}">${$.t('cameras.howToAddCameras')}</a>`);

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
        this.wrapper.find('.cloudapply').click(function(e){
             if (self.wrapper.find('#plugin-camera').submit())
                 core.elements['global-loader'].show();
        });
        this.wrapper.find('.apply').click(function(e){
             if (self.wrapper.find('cameraedit').submit())
                 core.elements['global-loader'].show();
        });

        this.wrapper.find('.pluginapply').click(function(e){
             self.wrapper.find('.newcameratabs ').removeClass('add2').removeClass('add1').removeClass('add3').removeClass('add5').addClass('add4');
        });

        this.wrapper.find('newgscamera').off('submited').on('submited',function(e){
             self.wrapper.find('.gsapply').removeAttr('disabled');
             core.elements['global-loader'].hide();
             window.core.onclick_toscreen('back');
        });
        this.wrapper.find('newcloudcamera').off('submited').on('submited',function(e){
             self.wrapper.find('.cloudapply').removeAttr('disabled');
             core.elements['global-loader'].hide();
             window.core.onclick_toscreen('back');
        });
        this.wrapper.find('newgscamera').off('error').on('error',function(e){
             core.elements['global-loader'].hide();
        });
        this.wrapper.find('newcloudcamera').off('error').on('error',function(e){
             core.elements['global-loader'].hide();
        });
        this.wrapper.find('.newcamerabtns > .add1').click(function(e){
            self.wrapper.find('.newcameratabs ').removeClass('add2').removeClass('add3').removeClass('add4').removeClass('add5').addClass('add1');
        });
        this.wrapper.find('.newcamerabtns > .add2').click(function(e){
            self.wrapper.find('.newcameratabs ').removeClass('add1').removeClass('add3').removeClass('add4').removeClass('add5').addClass('add2');
        });
        this.wrapper.find('.newcamerabtns > .add3').click(function(e){
            self.wrapper.find('.newcameratabs ').removeClass('add2').removeClass('add1').removeClass('add4').removeClass('add5').addClass('add3');
        });
        this.wrapper.find('.newcamerabtns > .add4').click(function(e){
            self.wrapper.find('.newcameratabs ').removeClass('add2').removeClass('add1').removeClass('add3').removeClass('add5').addClass('add4');
            $(".serial-number-input").val("");
            $(".username-input").val("");
            $(".path-input").val("");
            $(".password-input").val("");
            $(".mac-address-input").val("");
        });
        this.wrapper.find('.newcamerabtns > .add5').click(function(e){
            self.wrapper.find('.newcameratabs ').removeClass('add2').removeClass('add1').removeClass('add3').removeClass('add4').addClass('add5');
        });

        this.wrapper.find('#prov-server-input').click(function(e) {
            $('.uplink-wrapper').toggle();
            if ($(".mac-address-input").val() && $(".serial-number-input").val()) {
                $(".mac-address-input").val("");
                $(".serial-number-input").val("");
            }
        });

        this.wrapper.find('.uplinkapply').click(function(e) {
            if (self.wrapper.find('#uplink-camera').submit())
                core.elements['global-loader'].show();
        });

        return defaultPromise();
    }
};
