window.screens = window.screens || {};
window.controls = window.controls || {};
var path = window.core.getPath('add_dvr.js');

window.screens['add_dvr'] = {
    'header_name': $.t('recorders.addRecorder'),
    'html': path+'add_dvr.html',
    'css': [path+'dvr_nvr.css'],
    'commonjs':[],
    'stablecss':[],
    'js':[],
    'on_before_show':function(){
        var self = this;
        this.reset();
        this.wrapper.find('.sarea').html(`<button class="vxgbutton" onclick_toscreen="back">${$.t('action.back')}</button>`);

        var tzList = createTimezonesList();
        $("#tz-select").html(tzList);
        addCameraNamesInput();

        self.editingDvr = sessionStorage.getItem('editingDvr');
        if (self.editingDvr) {
            $('#add-dvr').html($.t('recorders.modifyRecorder'));
            sessionStorage.removeItem('editingDvr');
            return vxg.api.cloud.getCamerasList({"meta": self.editingDvr, "detail":'detail'}).then(function(cameras){
                self.cameras = cameras.objects;
                self.editing = true;
                self.loadDvrInfo();
            });
        } else {
            $('#add-dvr').html($.t('recorders.addRecorder'));
            $('.header-center').html($.t('recorders.addRecorder'));
            self.editing = false;
        }

        return defaultPromise();
    },
    'on_show':function(){
        var self = this;
        if (self.editing) $('.header-center').html($.t('recorders.editRecorder'));
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

        $('#add-dvr').click(function(e) {
            e.preventDefault();
            core.elements['global-loader'].show();
            let formData = $('#dvrnvrform').serializeObject(); 
            if (self.editingDvr) self.editDvr(formData, self);   
            else self.addDvr(formData, self);
        });

        return defaultPromise();
    },
    loadDvrInfo: function() {
        var self = this;
        var firstCam = self.cameras[0];

        var urlparser = document.createElement('a');
        urlparser.href = firstCam.url;

        var httpPort = urlparser.port;
        var ipdomain = urlparser.hostname;
        var path = urlparser.pathname.split('/');
        var type = path[2];
        var rtsp = firstCam.onvif_rtsp_port_fwd ? firstCam.onvif_rtsp_port_fwd : "";
        var loc = firstCam.meta.location ? firstCam.meta.location : "";
        var group = firstCam.meta.group ? firstCam.meta.group : "";

        $('[name="cameraCount"]').val(self.cameras.length);
        $('[name="cameraCount"]').attr("disabled", true);
        $('[name="dvrName"]').val(firstCam.meta.dvr_name);
        $('[name="type"]').val(type);
        $('[name="address"]').val(ipdomain);
        $('[name="httpPort"]').val(httpPort);
        $('[name="rtspPort"]').val(rtsp);
        $('[name="username"]').val(firstCam.login);
        $('[name="password"]').val(firstCam.password);
        $('[name="location"]').val(loc);
        $('[name="group"]').val(group);
        $('[name="tz"]').val(firstCam.timezone);
        
        var camNames = self.cameras.map((cam) => ({"name": cam.name, "id": cam.id}));
        addCameraNamesInput(camNames);
    },
    reset: function() {
        $('.dvr-input:not(#tz-select)').val('');
        $('[name="cameraCount"]').attr("disabled", false);
        $('[name="cameraCount"]').val(4);
        $('#camera-names').html('');
        $('#type').val('hikvision');
    },
    addDvr: function(formData, self) {
        if(!self.checkInputs(formData)) return;
        var cameraCount = parseInt(formData.cameraCount);
        var cameraList = [];
        for (let i = 1; i <= cameraCount; i++) {
            var cameraInfo = {
                name: formData['cameraName' + i],
                channel_number: (100 * i) + 1
            }
            cameraList.push(cameraInfo);
        }

        var uuid = "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
        formData.uuid = uuid;

        let currentCamInfo;
        let promiseChain = Promise.resolve();
        for (let i = 0; i < cameraList.length; i++) { 
            currentCamInfo = cameraList[i];

            const makeNextPromise = (currentCamInfo) => () => {
                if (i == 0) currentCamInfo.isFirst = true;
                return vxg.cameras.createCameraDVRPromise(currentCamInfo, formData)
                    .then((r) => {
                        if (i == cameraList.length - 1) {
                            var currentDVRs = localStorage.getItem('dvrInfo') ? JSON.parse(localStorage.getItem('dvrInfo')) : [];
                            var httpPort = formData.httpPort ? formData.httpPort : 80;
                            currentDVRs.push({
                                dvrName: formData.dvrName,
                                dvrUrl: 'http://' + formData.address + ':' + httpPort
                            })
                            localStorage.setItem('dvrInfo', JSON.stringify(currentDVRs));
                            core.elements['global-loader'].hide();
                            self.reset();
                            location.reload();
                        }
                        return true;
                    }).catch(err => {
                        console.log(err);
                        window.core.showToast('error');
                    }).finally(() => {
                        core.elements['global-loader'].hide();
                    });
            }
            promiseChain = promiseChain.then(makeNextPromise(currentCamInfo))
        }
    
    },
    editDvr: function(formData, self) {
        if(!self.checkInputs(formData)) return;
        var cameraCount = self.cameras.length;
        var cameraInfo = [];
        for (let i = 1; i <= cameraCount; i++) {
            var cameraEdits = {
                name: formData['cameraName' + i],
                camera: self.cameras[i - 1]
            }
            cameraInfo.push(cameraEdits);
        }

        let currentCam;
        let promiseChain = Promise.resolve();
        for (let i = 0; i < cameraInfo.length; i++) { 
            currentCam = cameraInfo[i];

            const makeNextPromise = (currentCam) => () => {
                return vxg.cameras.updateCameraDVRPromise(currentCam, formData)
                    .then((r) => {
                        if (i == self.cameras.length - 1) {
                            self.reset();
                            location.reload();
                        }
                        return true;
                    }).catch(err => {
                        console.log(err);
                        window.core.showToast('error');
                    }).finally(() => {
                        core.elements['global-loader'].hide();
                    });
            }
            promiseChain = promiseChain.then(makeNextPromise(currentCam))
        }
        
    },
    checkInputs: function(formData) {
        var inputError = false;
        if (!formData.dvrName) {
            $(".dvrName-label").css('color', 'red');
            inputError = true;
        } else {
            $(".dvrName-label").css('color', '#676a6c');
        }

        if (!formData.address) {
            $(".address-label").css('color', 'red');
            inputError = true;
        } else {
            $(".address-label").css('color', '#676a6c');
        }

        if (!formData.username) {
            $(".username-label").css('color', 'red');
            inputError = true;
        } else {
            $(".username-label").css('color', '#676a6c');
        }

        if (!formData.password) {
            $(".password-label").css('color', 'red');
            inputError = true;
        } else {
            $(".password-label").css('color', '#676a6c');
        }

        var cameraCount = parseInt(formData.cameraCount);
        for (let i = 1; i <= cameraCount; i++) {
            if (!formData['cameraName' + i]) {
                $('[for="cameraName'+i+'"]').css('color', 'red');
                inputError = true;
            } else {
                $('[for="cameraName'+i+'"]').css('color', '#676a6c');
            }
        }

        if (inputError) {
            $("#dvr-error-message").html($.t('toast.allHighlightedFieldsAreRequired'));
            core.elements['global-loader'].hide();
            return false;
        } else {
            $(".dvrName-label").css('color', '#676a6c');
            $(".address-label").css('color', '#676a6c');
            $(".username-label").css('color', '#676a6c');
            $(".password-label").css('color', '#676a6c');
            for (let i = 1; i <= cameraCount; i++) {
                $('[for="cameraName'+i+'"]').css('color', '#676a6c');
            }
            $("#dvr-error-message").html('');
            return true;
        }
    }
};

function createTimezonesList () {
    var tzList = '';
    if (!window['moment']) {
        return;
    }
    
    var currentTz = moment.tz.guess();
    var tzs = moment.tz.names();

    for(var i in tzs) {
        var tz = tzs[i];
        var isCurrent = tz == currentTz ? "selected" : "";
        var option = `<option value="${tz}" ${isCurrent} >${tz}</option>`
        tzList += option;
    }
    
    return tzList;
}
