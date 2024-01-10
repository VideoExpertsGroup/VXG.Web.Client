window.screens = window.screens || {};
window.controls = window.controls || {};
var path = window.core.getPath('add_gateway.js');

window.screens['add_gateway'] = {
    'header_name': 'Add Gateway',
    'html': path+'add_gateway.html',
    'css': [path+'gateway.css'],
    'commonjs':[],
    'stablecss':[],
    'js':[],
    'on_before_show':function(){
        var self = this;
        this.reset();
        this.wrapper.find('.sarea').html('<button class="vxgbutton" onclick_toscreen="back">Back</button>');

        self.editingGateway = sessionStorage.getItem('editingGateway');
        if (self.editingGateway) {
            $('#add-gateway').html("Modify Gateway");
            sessionStorage.removeItem('editingGateway');
            return vxg.api.cloud.getCamerasList({"meta": self.editingGateway, "detail":'detail'}).then(function(cameras){
                self.cameras = cameras.objects;
                var gatewayCam = cameras.objects.filter(c => { return c.meta && c.meta.gateway != undefined });
                self.gateway = gatewayCam[0];
                self.editing = true;
                $('.hide-edit-cont').hide();
                $('.hide-edit').attr("disabled", true);
                self.loadGatewayInfo();
            })
        } else {
            self.editing = false;
            $('#add-gateway').html("Add Gateway");
            $('.header-center').html("Add Recorder");
            $('.hide-edit-cont').show();
            $('.hide-edit').attr("disabled", false);
        }

        return defaultPromise();
    },
    'on_show':function(){
        var self = this;
        if (self.editing) $('.header-center').html("Edit Gateway");
    },
    'on_hide':function(){
    },
    'on_ready':function(){
        return defaultPromise();
    },
    'on_init':function(){
        let self = this;

        $('.tab').click(function() {
            if ($(this).hasClass('disabled')) return;
            var tabType = this.id.replace('-tab', '');
            $('.tab').removeClass('active');
            $(this).addClass('active');
            $('.tabcontent').hide();
            $('.' + tabType).show();
        });

        $('#add-gateway').click(function(e) {
            e.preventDefault();
            core.elements['global-loader'].show();
            let formData = $('#gatewayform').serializeObject(); 
            if (self.editingGateway) self.editGateway(formData, self);   
            else self.addGateway(formData, self);
        });

        return defaultPromise();
    },
    loadGatewayInfo: function() {
        var self = this;
        var cam = self.gateway;

        var loc = cam.meta.location ? cam.meta.location : "";
        var group = cam.meta.group ? cam.meta.group : "";

        $('[name="name"]').val(cam.name);
        $('[name="location"]').val(loc);
        $('[name="group"]').val(group);
    },
    reset: function() {
        $('.gateway-input').val('');
    },
    addGateway: function(formData, self) {
        if(!self.checkInputs(formData)) return;

        var cloud_uuid = "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
        formData.uuid = cloud_uuid;

        vxg.cameras.createCameraGatewayPromise(formData).then(function(r) {
            core.elements['global-loader'].hide();
            self.reset();
            location.reload();
        });
    },
    editGateway: function(formData, self) {
        if(!self.checkInputs(formData, false)) return;
        var gatewayCams = self.cameras.filter(c => { return c.meta && c.meta.gateway_cam != undefined });
        return vxg.cameras.updateGatewayPromise(self.gateway, formData).then(function() {
            var cameraFormData = {"location": formData['location'], "group": formData['group']};
            let currentCam;
            let promiseChain = Promise.resolve();
            for (let i = 0; i < gatewayCams.length; i++) { 
                currentCam = gatewayCams[i];
    
                const makeNextPromise = (currentCam) => () => {
                    return vxg.cameras.updateGatewayPromise(currentCam, cameraFormData)
                        .then((r) => {
                            if (i == gatewayCams.length - 1) {
                                self.reset();
                                location.reload();
                            }
                            return true;
                        });
                }
                promiseChain = promiseChain.then(makeNextPromise(currentCam))
            }
        
        })
    },
    checkInputs: function(formData, creating = true) {
        var inputError = false;
        if (!formData.name) {
            $(".name-label").css('color', 'red');
            inputError = true;
        } else {
            $(".name-label").css('color', '#676a6c');
        }

        if (creating && !formData.guid) {
            $(".guid-label").css('color', 'red');
            inputError = true;
        } else {
            $(".guid-label").css('color', '#676a6c');
        }

        if (inputError) {
            $("#gateway-error-message").html('All highlighted fields are required.');
            core.elements['global-loader'].hide();
            return false;
        } else {
            $(".name-label").css('color', '#676a6c');
            $(".guid-label").css('color', '#676a6c');
            $("#gateway-error-message").html('');
            return true;
        }
    }
};
