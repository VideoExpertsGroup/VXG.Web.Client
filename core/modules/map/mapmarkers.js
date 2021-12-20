// version 0.9

const MapMarkers = {
    init: function () {
/*
        this.auth = {
            "username": "user",
            "password": CryptoJS.SHA3("user", {outputLength: 256}).toString(CryptoJS.enc.Base64)
        };
        this.auth_data = '';
*/
        this.api_base = '';
        this.$planContainer = $('#planContainer').hide();
        this.$infobox = $('#infobox').hide();
        this.map = '';
        this.addresses = {};
        this.markers = [];
        this.planScale = '';
//        this.cameraClickCallback = '';
        this.getFloorImg = ''; // your callback for floor plan
        this.getPreviewImg = ''; // your callback for camera preview
        this.mcOptions = {
            styles: [{
                textColor: 'white',
                height: 30,
                url: "img/cluster.svg",
                width: 30
            }
            ]
        };
        this.mapOptions = {
            center: {lat: 0, lng: 0},
            zoom: 5,
            minZoom: 2,
            maxZoom: 15,
            gestureHandling: 'greedy',
            mapTypeControl: false,
            fullscreenControl: false
        };
    },
    setMapOptions: function (mapOptions) {
        this.mapOptions = Object.assign({}, this.mapOptions, mapOptions);
        this.initMap(this.mapOptions);


    },
    initMap: function (options, mapContainer) {
        this.mapContainer = mapContainer;
        this.map = new google.maps.Map(mapContainer, options);
        let self = this;
        let lastValidCenter;
        let minZoomLevel = 2;

        setOutOfBoundsListener();

        function setOutOfBoundsListener() {
            google.maps.event.addListener(self.map, 'dragend', function () {
                checkLatitude(self.map);
            });
            google.maps.event.addListener(self.map, 'idle', function () {
                checkLatitude(self.map);
            });
            google.maps.event.addListener(self.map, 'zoom_changed', function () {
                checkLatitude(self.map);
            });
        }

        function checkLatitude(map) {
            if (this.minZoomLevel) {
                if (map.getZoom() < minZoomLevel) {
                    map.setZoom(parseInt(minZoomLevel));
                }
            }

            let bounds = map.getBounds();
            let sLat = map.getBounds().getSouthWest().lat();
            let nLat = map.getBounds().getNorthEast().lat();
            if (sLat < -85 || nLat > 85) {
                //the map has gone beyone the world's max or min latitude - gray areas are visible
                //return to a valid position
                if (this.lastValidCenter) {
                    map.setCenter(this.lastValidCenter);
                }
            }
            else {
                this.lastValidCenter = map.getCenter();
            }
        }
    },
    add: function (arrOfObjects) {
        let locations = this.sortCameras(arrOfObjects);
        let self = this;

        this.setMarkers(locations);

    },
    sortCameras: function (data) {
        let locations = [];
        $.each(data, function (i, camera) {
            if (camera.src2 && camera.src2.longitude!==undefined && camera.src2.latitude!==undefined) {
                locations.push({
                    lng: parseFloat(camera.src2.longitude),
                    lat: parseFloat(camera.src2.latitude),
                    icon: "img/camera.svg",
                    markerType: 'camera',
                    data: camera
                });
//                delete data[i];

            }
        });

        let filtered = data.filter(function (el) {
            return el != null;
        });

        this.addresses = groupBy(filtered, 'address');

        $.each(this.addresses, function (address, list) {
            let camera = list[0];

            let sortedByFloors = groupBy(list, 'floor');

            locations.push({
                lng: parseFloat(camera.src2.longitude),
                lat: parseFloat(camera.src2.latitude),
                icon: "img/floor.svg",
                markerType: 'floor',
                data: {
                    address: address,
                    cameras: list,
                    floors: Object.keys(sortedByFloors).length
                }
            });
        });

        return locations;
    },
    setMarkers: function (locations) {
        let self = this;
        let bounds = new google.maps.LatLngBounds();
        let marker;

        let infowindow = new google.maps.InfoWindow();
        let markers = locations.map(function (location, i) {
            bounds.extend(location);
            marker = new google.maps.Marker({
                position: {lng: location.lng, lat: location.lat},
                map: self.map,
                icon: location.icon,
                markerType: location.markerType
            });
            marker.id = location.data.id;
            google.maps.event.addListener(marker, 'click', (function (marker, i) {
                infowindow.close(self.map);

                if (location.markerType === 'camera') {
                    return function () {
                        self.cameraClickCallback(location.data);
                    }
                } else {
                    return function () {
                        infowindow.close(self.map, marker);
                        let addressCameras = groupBy(self.addresses[location.data.address], 'floor');

                        let floor = self.getFloorNumber(location.data.address);
                        let planData = self.getFloorImg(floor, location.data.address);

                        planData.done(
                            result => {
                                let floorCameras = addressCameras[result.data.floor];
                                self.showFloorPlan(result.data.image, floorCameras);
                            })

                    }
                }
            })(marker, i));
            google.maps.event.addListener(marker, 'mouseover', (function (marker, i) {

                if (location.markerType === 'camera') {
                    return function () {
                        let info = '';//'<div class="preview-container"></div>';
                        info += '<div class="info-header">' + location.data.src.name + '</div>';
                        if (location.data.address) {
                            info += '<span>' + location.data.address + '</span>';
                        }
                        infowindow.setContent('<div class="preview-container img empty"></div>'+info);
                        infowindow.open(self.map, marker);
                        let cameraPreview = self.getPreviewImg(location.data.camera_id);
                        cameraPreview.then(function(result){
                            info = '<div class="preview-container img" style="background-image:url(' + result + ')"></div>' + info;
                            infowindow.setContent(info);
                        });
                    }
                } else if (location.markerType === 'floor') {
                    return function () {
                        let info = '<div class="preview-container"></div>';
                        info += '<span class="info-header">' + location.data.address + '</span>';
                        info += '<span>' + location.data.floors + ' floors,</span> <span>' + location.data.cameras.length + ' cams</span>';
                        infowindow.setContent(info);
                        infowindow.open(self.map, marker);
                        let floor = self.getFloorNumber(location.data.address);
                        let planData = self.getFloorImg(floor, location.data.address);
                        planData.then(function(result){
                            info = '<div class="preview-container"><img src="' + result.data.image_small + '"></div>' + info;
                            infowindow.setContent(info);
                        })
                    }
                }
            })(marker, i));
            google.maps.event.addListener(marker, 'mouseout', function () {
                infowindow.close(self.map);
            });
            return marker;
        });

        self.markers = markers;

        console.log(markers);
        self.markerCluster = new MarkerClusterer(self.map, markers, self.mcOptions);
        google.maps.event.addListener(self.markerCluster, "mouseover", function (mCluster) {
            infowindow.setPosition(mCluster.getCenter());
        });
        google.maps.event.addListener(self.markerCluster, "mouseout", function (mCluster) {
            infowindow.close(self.map);
        });
        google.maps.event.addListener(self.markerCluster, "click", function (mCluster) {
            infowindow.close(self.map);
        });

        self.map.fitBounds(bounds);

    },
    delete: function (ids) {
        let self = this;
        this.markerCluster.setMap(null);

        for (let i = 0; i < self.markers.length; i++) {
            if (ids.includes(self.markers[i].id)) {
                self.markers[i].setMap(null);
                self.markers[i] = null;
            }
        }

        this.markers = this.markers.filter(function (el) {
            return el != null;
        });

        self.markerCluster = new MarkerClusterer(self.map, this.markers, self.mcOptions);

    },
    showFloorPlan: function (planImg, cameras) {
        let self = this;
        self.$planContainer.find('.plan').remove();
        let $plan = $('<div>', {
            class: 'plan',
            id: 'plan'
        });
        $('<img>', {
            src: planImg,
            class: 'floor-plan',
            id: 'floor-plan'
        }).appendTo($plan);

        $.each(cameras, function (i, camera) {
            let $camEl = $('<img>', {
                class: 'camera',
                src: "img/camera.svg",
                'data-id': camera.id,
                'data-location': camera.id,
            }).css({
                top: camera.y + 'px',
                left: camera.x + 'px'
            }).appendTo($plan);


            $camEl.on('mouseover', function (e) {
                let $this = $(this);

                self.showInfobox(camera, $(this))
            }).on('mouseout', function () {
                self.$infobox.hide().empty();
            }).on('click', function () {
                self.cameraClickCallback(camera);
            })
        });
        $(mapContainer).hide();
        $plan.appendTo(self.$planContainer);
        self.$planContainer.show();
        fitPlanToScreen();
        // let renderer = new ZoomPanRenderer("plan");
        dragElement(document.getElementById("plan"));
    },
    getFloorNumber: function (address) {
        let addressCameras = groupBy(this.addresses[address], 'floor');
        return Object.keys(addressCameras)[0];
    },
    showInfobox: function (data, $this) {
        let self = this;
        parentOffsetLeft = this.$planContainer.offset().left;
        parentOffsetTop = this.$planContainer.offset().top;
        let realOffset = $this[0].getBoundingClientRect();
        let offset = $this.offset();
        let width = realOffset.width;
        let height = realOffset.height;

        let info = '<div class="preview-container"></div>';
        info += '<span class="info-header">' + data.name + '</span>';
        info += '<span>' + data.address + '</span>';

        this.$infobox.html(info);
        let centerX = offset.left - parentOffsetLeft - this.$infobox.outerWidth() / 2  + realOffset.width / 2;
        let centerY = realOffset.bottom - parentOffsetTop - realOffset.height - this.$infobox.outerHeight() - 5;

        if(centerY-5 <= 0){
            centerY = realOffset.top  + realOffset.height + 5
        }

        if(centerX-5 <= 0){
            centerX = realOffset.left + realOffset.width
        }

        this.$infobox.css({
            top: centerY,
            left: centerX,
        }).show();
        console.log(centerY );
        let cameraPreview = self.getPreviewImg(data.id);
        cameraPreview.done(
            result => {
                info = '<div class="preview-container"><img src="' + result.url + '"></div>' + info;
                self.$infobox.html(info);
            })

    }
};


// Make the DIV element draggable:

function dragElement(el) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0,
        height=MapMarkers.$planContainer.height(),
        width=MapMarkers.$planContainer.width();
    el.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        if(($(el).offset().left - pos1 ) < 0
            && ($(el).offset().left + el.getBoundingClientRect().width - width - pos1 )> 0
        ){
            el.style.left = (el.offsetLeft - pos1) + "px";

        }
        if(($(el).offset().top - pos2 ) < 0
            && ($(el).offset().top + el.getBoundingClientRect().height - height - pos2 )> 0
        ){
            el.style.top = (el.offsetTop - pos2) + "px";

        }
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function Transformations(originX, originY, translateX, translateY, scale) {
    this.originX = originX;
    this.originY = originY;
    this.translateX = translateX;
    this.translateY = translateY;
    this.scale = scale;
}

/* Getters */
Transformations.prototype.getScale = function () {
    return this.scale;
}
Transformations.prototype.getOriginX = function () {
    return this.originX;
}
Transformations.prototype.getOriginY = function () {
    return this.originY;
}
Transformations.prototype.getTranslateX = function () {
    return this.translateX;
};
Transformations.prototype.getTranslateY = function () {
    return this.translateY;
};

/*****************************************************
 * Zoom Pan Renderer
 ****************************************************/
function ZoomPanRenderer(elementId) {
    this.zooming = undefined;
    this.elementId = elementId;
    this.current = new Transformations(0, 0, 0, 0, MapMarkers.planScale);
    this.last = new Transformations(0, 0, 0, 0, MapMarkers.planScale);
    new ZoomPanEventHandlers(this);
}

/* setters */
ZoomPanRenderer.prototype.setCurrentTransformations = function (t) {
    this.current = t;
};
ZoomPanRenderer.prototype.setZooming = function (z) {
    this.zooming = z;
};

/* getters */
ZoomPanRenderer.prototype.getCurrentTransformations = function () {
    return this.current;
};
ZoomPanRenderer.prototype.getZooming = function () {
    return this.zooming;
};
ZoomPanRenderer.prototype.getLastTransformations = function () {
    return this.last;
};
ZoomPanRenderer.prototype.getElementId = function () {
    return this.elementId;
};

/* Rendering */
ZoomPanRenderer.prototype.getTransform2d = function (t) {
    let transform2d = "matrix(";
    transform2d += t.getScale().toFixed(1) + ",0,0," + t.getScale().toFixed(1) + "," + t.getTranslateX().toFixed(1) + "," + t.getTranslateY().toFixed(1) + ")";
    //0,0)";
    return transform2d;
};

ZoomPanRenderer.prototype.applyTransformations = function (t) {
    let elem = $("#" + this.getElementId());
    let orig = t.getOriginX().toFixed(10) + "px " + t.getOriginY().toFixed(10) + "px";
    elem.css("transform-origin", orig);
    elem.css("-ms-transform-origin", orig);
    elem.css("-o-transform-origin", orig);
    elem.css("-moz-transform-origin", orig);
    elem.css("-webkit-transform-origin", orig);
    let transform2d = this.getTransform2d(t);
    elem.css("transform", transform2d);
    elem.css("-ms-transform", transform2d);
    elem.css("-o-transform", transform2d);
    elem.css("-moz-transform", transform2d);
    elem.css("-webkit-transform", transform2d);
};

/*****************************************************
 * Event handler
 ****************************************************/
function ZoomPanEventHandlers(renderer) {
    this.renderer = renderer;

    /* Disable scroll overflow - safari */
    document.addEventListener('touchmove', function (e) {
        e.preventDefault();
    }, false);

    /* Disable default drag opeartions on the element (FF makes it ready for save)*/
    $("#" + renderer.getElementId()).bind('dragstart', function (e) {
        e.preventDefault();
    });

    /* Add mouse wheel handler */
    $("#" + renderer.getElementId()).bind("mousewheel", function (event, delta) {
        if (renderer.getZooming() == undefined) {
            let offsetLeft = $("#" + renderer.getElementId()).offset().left;
            let offsetTop = $("#" + renderer.getElementId()).offset().top;
            let zooming = new MouseZoom(renderer.getCurrentTransformations(), event.pageX, event.pageY, offsetLeft, offsetTop, event.originalEvent.wheelDelta);
            renderer.setZooming(zooming);

            let newTransformation = zooming.zoom();
            renderer.applyTransformations(newTransformation);
            renderer.setCurrentTransformations(newTransformation);
            renderer.setZooming(undefined);
        }
        return false;
    });
}

/*****************************************************
 * Mouse zoom
 ****************************************************/
function MouseZoom(t, mouseX, mouseY, offsetLeft, offsetTop, delta) {
    this.current = t;
    this.offsetLeft = offsetLeft;
    this.offsetTop = offsetTop;
    this.mouseX = mouseX;
    this.mouseY = mouseY;
    this.delta = delta;
}

MouseZoom.prototype.zoom = function () {
    // current scale
    let previousScale = this.current.getScale();
    console.log(previousScale);
    // new scale
    let newScale = previousScale + this.delta / 1000;
    // scale limits
    let maxscale = 20;
    if (newScale < .5) {
        newScale = .5;
    }
    else if (newScale > maxscale) {
        newScale = maxscale;
    }
    // current cursor position on image
    let imageX = (this.mouseX - this.offsetLeft).toFixed(2);
    let imageY = (this.mouseY - this.offsetTop).toFixed(2);
    // previous cursor position on image
    let prevOrigX = (this.current.getOriginX() * previousScale).toFixed(2);
    let prevOrigY = (this.current.getOriginY() * previousScale).toFixed(2);
    // previous zooming frame translate
    let translateX = this.current.getTranslateX();
    let translateY = this.current.getTranslateY();
    // set origin to current cursor position
    let newOrigX = imageX / previousScale;
    let newOrigY = imageY / previousScale;

    // move zooming frame to current cursor position
    if ((Math.abs(imageX - prevOrigX) > 1 || Math.abs(imageY - prevOrigY) > 1) && previousScale < maxscale) {
        translateX = translateX + (imageX - prevOrigX) * (1 - 1 / previousScale);
        translateY = translateY + (imageY - prevOrigY) * (1 - 1 / previousScale);
    }
    // stabilize position by zooming on previous cursor position
    else if (previousScale != 1 || imageX != prevOrigX && imageY != prevOrigY) {
        newOrigX = prevOrigX / previousScale;
        newOrigY = prevOrigY / previousScale;
        //frame limit
    }
    // on zoom-out limit frame shifts to original frame
    if (this.delta <= 0) {
        let width = 500;
        let height = 350;
        if (translateX + newOrigX + (width - newOrigX) * newScale <= width) {
            translateX = 0;
            newOrigX = width;
        }
        else if (translateX + newOrigX * (1 - newScale) >= 0) {
            translateX = 0;
            newOrigX = 0;
        }
        if (translateY + newOrigY + (height - newOrigY) * newScale <= height) {
            translateY = 0;
            newOrigY = height;
        }
        else if (translateY + newOrigY * (1 - newScale) >= 0) {
            translateY = 0;
            newOrigY = 0;
        }
    }

    return new Transformations(newOrigX, newOrigY, translateX, translateY, newScale);
};

groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};
/*
$(document).ready(function () {
    $('#backToMap').click(function () {
        $('#' + MapMarkers.mapContainer).show();
        MapMarkers.$planContainer.hide();
    });
});
*/

function fitPlanToScreen() {
    let planImg = document.getElementById('floor-plan');
    planImg.onload = function () {
        let windowWidth = MapMarkers.$planContainer.width();
        let windowHeight = MapMarkers.$planContainer.height();
        let $plan = $('.plan');
        let realDimensions;

        let width = $plan.width();
        let height = $plan.height();
        let scale;

        scale = Math.max(windowWidth / width, windowHeight / height);

        MapMarkers.planScale = scale;
        $plan.css({
            '-webkit-transform': 'scale(' + scale + ')',
            'transform': 'scale(' + scale + ')',
        });

        realDimensions = $plan[0].getBoundingClientRect();
        $plan.css({
            'top': -realDimensions.top,
        });

    };

}
