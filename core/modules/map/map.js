window.screens = window.screens || {};
var path = window.core.getPath('map.js');

window.screens['map'] = {
    'menu_weight':50,
    'menu_name':'Map view',
    'get_args':function(){
    },
//  TODO:
//    'menu_toggle':true,
//    'menu_disabled':true,
    'menu_icon': path+'map.svg',
    'menu_icon_hover': path+'maphover.svg',
    'html': path+'map.html',
    'js':[path+'mapmarkers.js', path+'markerclusterer.js', 'https://maps.googleapis.com/maps/api/js?key=API_KEY'],
    'css':[path+'map.css'],
    'stablecss':[path+'smap.css'],
    'on_show':function(r){
        let self = this;
//        core.elements['global-loader'].show();


        if (!this.mapinited) {
            this.mapinited = true;
            MapMarkers.cameraClickCallback = function(r){
                screens['player'].activate(r.camera_id);
            };
            MapMarkers.init();
            MapMarkers.getFloorImg = function (floor, address) {
                return vxg.api.cloudone.addresses.find({floor: floor, address: address})
            };
            MapMarkers.getPreviewImg = function (camid) {
                let cam;
                for (let i in self.cameralist)
                    if (self.cameralist[i].camera_id==camid)
                        cam = self.cameralist[i];

                return cam.getPreview();
            };
            MapMarkers.initMap(MapMarkers.mapOptions, $(this.wrapper).find('.mapcontainer')[0]);
        }

        return window.vxg.cameras.getCameraListWithLatLonPromise(100,0).then(function(list){
            self.cameralist = list;
            MapMarkers.add(list);
/*
            let camlist = [], promises = [];
            for (var i in list) 
                promises.push(list[i].getBsrc().then(function(bsrc){
                    camlist.push(bsrc);
                }));
            return Promise.all(promises).then(function(){
                MapMarkers.add(camlist);
            });
*/
//            core.elements['global-loader'].hide();
        },function(){
//            core.elements['global-loader'].hide();
        });

        return defaultPromise();
    },
    'on_hide':function(){
    },
    'on_ready':function(){
    },
    'on_init':function(){
        let self=this;
        return defaultPromise();
    }
};