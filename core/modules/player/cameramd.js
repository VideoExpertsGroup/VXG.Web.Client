window.screens = window.screens || {};
window.controls = window.controls || {};
var path = window.core.getPath('cameramd.js');

window.controls['cameramd'] = {
    'js':[],
    'css':[path+'cameramd.css'],
    'commoncss':[],
    'commonjs':[],
    'observedAttributes':function(){
        return ['access_token'];
    },
    'on_init':function(element){
        CameraMotionDetectionControl.apply(element,[]);
        return this.connectedCallback();
    },
    'attributeChangedCallback':function(name, value){
        this.attributeChangedCallback(name,value);
    },
    'disconnectedCallback':function(){
        this.disconnectedCallback();
    },
}

CameraMotionDetectionControl = function(){
    this.connectedCallback = function(){
        this.submit_event = new Event('submit',{cancelable: true, bubbles: true});
        this.submitenable_event = new Event('submitenable',{cancelable: false, bubbles: true});
        let self = this;
        access_token = $(this).getNearParentAtribute('access_token');
        this.newid = Math.floor(Math.random() * Math.floor(1000000000));
        $(this).html('<div class="mdwrap"><div class="wait"><span>Wait</span>&nbsp;&nbsp;<div class="spinner"></div></div><div id="cameramd'+this.newid+'"></div><div class="dgrid"></div></div>' +
            '<div class="barea">' +
            '<label class="en"><input type="checkbox" class="enable"><span class="cameramd-checkbox-enabled">Enable</span></label>'+
            '<span>Sensitivity</span><input class="sens" type="number" min="0" max="100" value="0"/>' +
            ($(self).attr('hidesubmit')!==undefined ? '' : '<button class="apply vxgbutton">Apply</button>') +
            '</div>');
        window.controls['cameramd'].players = window.controls['cameramd'].players || {};
        var playerOptions = {timeline: false, timelineampm: true, mute: true, alt_protocol_names:true, calendar: false, autohide:-1}
        if (window.core.isMobile()){
        	playerOptions.disableAudioControl = true;
        	playerOptions.disableZoomControl = true;
        	playerOptions.disableGetShot = true;
        	playerOptions.disableGetClip = true;
        }
        playerOptions.livePoster = true;
        
        window.controls['cameramd'].players['cameramd'+this.newid]  = new CloudPlayerSDK('cameramd'+this.newid, playerOptions);

        $(this).find('.apply').click(function(){
            if (!self.dgrid) return;
            if (!self.dispatchEvent(self.submit_event)) return;
            self.submit();
        });
        if ($(this).attr('tokenautofind')!==undefined){
            let parent=this.parentElement;
            let find = $(this).attr('tokenautofind');
            while(parent.tagName!=='HTML'){
                let inp = $(parent).find('input['+find+'],textarea['+find+']');
                if (inp.length>0){
                    if (!access_token) access_token = $(inp[0]).val();
                    $(inp[0]).on("keypress",function(e) {
                        if (e.keyCode == 13) {
                            self.attributeChangedCallback('access_token', $(this).val());
                            return false;
                        }
                        return true;
                    });
                    break;
                }
                parent = parent.parentElement;
            }

        }
        this.showerror('<a target="_blank" href="'+vxg.links.error+'">Error #1</a>');
        return this.attributeChangedCallback('access_token', access_token);
    }
    this.attributeChangedCallback = function(name, access_token){
        let self = this;
        if (name!='access_token') return defaultPromise();
        if (this.checksizetimer) clearTimeout(this.checksizetimer); 
        delete this.checksizetimer; 
        this.stop();
        if (!(parseInt(access_token)>0 || typeof access_token ==="string")) return defaultPromise();
        if (this.dgrid) this.dgrid.setMatrix();
        $(this).removeClass('partially');
        this.showwait('Loading');
        $(this).find('.dgrid').addClass('disabled');
        if (parseInt(access_token)>0)
            return window.vxg.cameras.getCameraByIDPromise(parseInt(access_token)).then(function(camera){self.onCameraLoaded(camera);}, function(){self.onCameraLoadedFail();});
        if (access_token) return window.vxg.cameras.getCameraByTokenPromise(access_token).then(function(camera){self.onCameraLoaded(camera);}, function(){self.onCameraLoadedFail();});
        this.stop();
        this.showerror('<a target="_blank" href="'+vxg.links.error+'">Error #1</a>');
        return defaultPromise();
    }
    this.disconnectedCallback = function(){
        let self = this;
        if (this.set_source_timeout) clearTimeout(this.set_source_timeout);
        if (this.checksizetimer) clearTimeout(this.checksizetimer);
        delete this.camera;
        if (window.controls['cameramd'].players['cameramd'+this.newid]){
            window.controls['cameramd'].players['cameramd'+this.newid].stop();
            setTimeout(function(){
                window.controls['cameramd'].players['cameramd'+self.newid].destroy();
                setTimeout(function(){delete window.controls['cameramd'].players['cameramd'+self.newid];},0);
            },0);
        }
        return defaultPromise();
    }
    this.submit = function(){
        let self = this;
        if (!self.regions || !self.regions[0] || !self.regions[0].map) return;

        if (this.dgrid) {
            this.regions[0].map = this.dgrid.getPackedMatrix();
            this.regions[0].sensitivity = parseInt($(this).find('.barea input.sens').val());
        }
        this.regions[0].enabled = $(this).find('.barea input.enable').prop('checked');
        this.showwait('Saving');
        this.camera.setMotionDetectionRegions(this.regions).then(function(){
            self.hidewait();
        }, function(){
            self.showerror('<a target="_blank" href="'+vxg.links.error+'">Error #2</a>');
            setTimeout(function(){self.hidewait();},2000);
        });
    },
    this.onCameraLoadedFail = function(r){
        window.controls['cameramd'].players['cameramd'+this.newid].stop();
        this.showerror('<a target="_blank" href="'+vxg.links.error+'">Error #3</a>');
        return r;
    }
    this.onCameraLoaded = function(camera){
        let self = this;
        if (!camera) return this.onCameraLoadedFail();
        this.camera = camera;
        camera.getToken().then(function(token){
            let t = token;
            window.controls['cameramd'].players['cameramd'+self.newid].stop();
            self.checksize(self);
            self.set_source_timeout = setTimeout(function(){
                delete self.set_source_timeout;
                window.controls['cameramd'].players['cameramd'+self.newid].setSource(t);
            },100);
        });
        this.showwait('Loading');
        return this.camera.getMotionDetectionInfo().then(function(info){
            self.info = info;

            self.showwait('Loading');
            return self.camera.getMotionDetectionRegions().then(function(regions){
                self.regions = regions.objects;
//self.info.caps.columns=1;
                if (self.info && self.info.caps && self.info.caps.columns>1 && self.info.caps.rows>1 & self.info.caps.max_regions>0 && self.regions[0]!==undefined) {
                    self.dgrid = new ClassDgrid($(self).find('.dgrid')[0],self.info.caps.columns,self.info.caps.rows);
                    self.dgrid.update(self.regions && self.regions[0] ? self.regions[0].map : undefined);
                    if (!self.regions || !self.regions[0] || !self.regions[0].map)
                        self.showerror('This camera does not support motion detection');
                    if (self.regions && self.regions[0] && self.regions[0].sensitivity!==undefined)
                        $(self).find('.barea input.sens').val(self.regions[0].sensitivity);
                    $(self).find('.barea input.enable').prop('checked',self.regions[0].enabled);
                    $(self).find('.dgrid').removeClass('disabled');
                    setTimeout(function(){self.dispatchEvent(self.submitenable_event);},0);
                    self.hidewait();
                } else {
                    if (self.regions[0]!==undefined){
                        self.showerror('This camera does not support changing the motion grid');
                        $(self).addClass('partially');
                        $(self).find('.barea input.enable').prop('checked',self.regions[0].enabled);
                        setTimeout(function(){self.dispatchEvent(self.submitenable_event);},0);
                    } else
                        self.showerror('Motion detector are not available for this camera');
                }
            }, function(){
                self.showerror('Motion detector are not available for this camera');
            });
        },function(){
            self.showerror('Motion detector are not available for this camera');
        });
    }
    this.checksize = function(){
	//console.log("checksize");
	
        let self = this;
        let he = parseInt(Math.ceil($(this).width()/16*9))+2;

//        if (he && $(this).find('.cloudplayer').height()!=he) 
//    	    $(this).find('.cloudplayer').height(he);
        if (he && $(this).find('.mdwrap').height()!=he) 
    	    $(this).find('.mdwrap').height(he);

        let w=0,h=0,v = $(this).find('video');
        for (let i=0; i<v.length; i++){
            w = v[i].videoWidth;
            h = v[i].videoHeight;
            if (w && h) break;
        }
        if (!w || !h) {
            this.checksizetimer = setTimeout(function(){self.checksize(self);},500);
            return;
        }
        delete this.checksizetimer;

        let dgrid = $(this).find('.dgrid');
        let plr = $(this).find('.cloudplayer');

        $( window ).resize(function() {
            let dgridw = plr.width();
            let dgridh = plr.height();

            if ($(self).attr('autoheight')!==undefined && parseInt(dgridw/w*1000) != parseInt(dgridh/h*1000)){
                let new_height = parseInt(dgridw/w*h);
//                new_height += $(self).find('.barea').height() + parseInt('0'+$(self).find('.barea').css('padding-top')) + parseInt('0'+$(self).find('.barea').css('padding-bottom'));
                if (new_height>0) {
                    //$(self).find('.cloudplayer').height(new_height);
                    $(self).find('.mdwrap').height(new_height);
                }
                return;
            }

            let left=0,top=0,right=0,bottom=0;
            if (w/dgridw > h/dgridh){
                bottom = top = (dgridh - dgridw*h/w)/2;
            } else {
                left = right= (dgridw - dgridh*w/h)/2;
            }
            dgrid.css('left',left).css('top',top).css('right',right).css('bottom',bottom);
        });
        $( window ).resize();
    }
    this.hidewait = function(text){
        $(this).removeClass('wait');
    }
    this.showerror = function(text){
        $(this).find('.wait span').html(text);
        $(this).find('.wait .spinner').hide();
        $(this).addClass('wait');
    }
    this.showwait = function(text){
        $(this).find('.wait span').html(text);
        $(this).addClass('wait').find('.wait .spinner').show();
    }
    this.play = function(){
        if (window.controls['cameramd'].players['cameramd'+this.newid]!==undefined) window.controls['cameramd'].players['cameramd'+this.newid].play();
    };
    this.stop = function(){
        if (window.controls['cameramd'].players['cameramd'+this.newid]!==undefined) window.controls['cameramd'].players['cameramd'+this.newid].stop();
    };
}

ClassDgrid = function(element, width, height) {
    let self = this;
    this.element = $(element);
    this.emptyimg = new Image();
    this.emptyimg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    if (width>0) this.width = width;
    if (height>0) this.height = height;
    this.update = function(packed_matrix, width, height){
        if (width>0) this.width = width;
        if (height>0) this.height = height;
        this.element.html('');
        if (!packed_matrix){
            return;
        }

        let s = atob(packed_matrix);
        let res = "";
        let i = 0;
        while (i < s.length) {
            let hdr = s.charCodeAt(i++);
            res += hdr > 128 ? s[i++].repeat(257 - hdr)
                 : hdr < 128 ? s.slice(i, i += hdr+1)
                 : "";
        }

        let data = []; let c=1000,r=-1;
        for (i=0;i<res.length;i++){
            if ((++c)>=this.width){
                data[++r] = [];
                c=0;
            }
            data[r][c] = res[i]=='1' ? 1 : 0;
        }

        this.element.empty();let h = '<table>';
        for (let y=0;y<this.height;y++){
            h += '<tr class="row'+y+'">';
            for (let x=0;x<this.width;x++){
                h += '<td class="col' + x + ' ceil' + x + '-' + y +(data[y][x]?' active':'')+'" data-x="'+x+'" data-y="'+y+'" draggable="true"></td>';
            }
            h += '</tr>';
        }
        this.element.html(h+'</table>');
        this.element.find('td').on('dragstart', function (event) {
            event.originalEvent.dataTransfer.setDragImage(self.emptyimg, 0, 0);
            self.startx = parseInt(this.dataset.x);
            self.starty = parseInt(this.dataset.y);
            self.fill = $(this).hasClass('active') ? 0 : 1;
            self.matrix = self.getMatrix();
        });
        this.element.find('td').click(function (event) {
            let matrix = self.getMatrix();
            let x = parseInt(this.dataset.x);
            let y = parseInt(this.dataset.y);
            matrix[y][x] = matrix[y][x]===1 ? 0 : 1;
            self.setMatrix(matrix);
            let el = self.element.find('td.ceil'+x+'-'+y);
            el.addClass(el.hasClass('active') ? 'set' : 'unset');
            setTimeout(function(){
                self.element.find('td.ceil'+x+'-'+y).removeClass('set').removeClass('unset');
            },100);
        });
        this.element.find('td').on('mousedown', function (event) {
            $(this).addClass($(this).hasClass('active') ? 'unset' : 'set');
        });
        this.element.find('td').on('dragenter', function (event) {
            if (!self.matrix) return;
            if (self.updatetimer)
                clearTimeout(self.updatetimer);
            let newx = parseInt(this.dataset.x);
            let newy = parseInt(this.dataset.y);
            self.updatetimer = setTimeout(function(){
                delete self.updatetimer;
                let newmatrix = self.getNewMatrix(self.matrix, self.startx, self.starty, newx, newy, self.fill);
                self.setMatrix(newmatrix, self.startx, self.starty, newx, newy, self.fill===1);
            });
        });
        this.element.find('td').on('dragend', function (event) {
            self.element.find('td.set,td.unset').removeClass('set').removeClass('unset');
        });
        this.element.find('td').on('dragover', function (event) {
            event.preventDefault();
        });
    };
    this.setMatrix = function(matrix, sx, sy, ex, ey, isset){
        self.element.find('td.set,td.unset').removeClass('set').removeClass('unset');
        self.element.find('td').removeClass('active');
        if (matrix!==undefined) for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[0].length; x++) {
                if (matrix[y][x])
                    self.element.find('td.ceil'+x+'-'+y).addClass('active');
            }
        }
        if (sx===undefined || sy===undefined || ex===undefined || ey===undefined || isset===undefined) return;
        if (sx>ex){let t=ex;ex=sx;sx=t;}
        if (sy>ey){let t=ey;ey=sy;sy=t;}
        for (let y = sy; y <= ey; y++) 
            for (let x = sx; x <= ex; x++) 
                self.element.find('td.ceil'+x+'-'+y).addClass(isset ? 'set' : 'unset');
    }
    this.getMatrix = function(){
        let ret = [];
        for (let y = 0; y < this.height; y++) {
            ret[y]=[];
            for (let x = 0; x < this.width; x++) 
                ret[y][x]=0;
        }
        this.element.find('td.active').each(function(){
            ret[parseInt(this.dataset.y)][parseInt(this.dataset.x)] = 1;
        });
        return ret;
    }
    this.getNewMatrix = function(matrix, sx, sy, ex, ey, value){
        if (sx>ex){let t=ex;ex=sx;sx=t;}
        if (sy>ey){let t=ey;ey=sy;sy=t;}
        let ret = [];
        for (let y = 0; y < matrix.length; y++) {
            ret[y]=[];
            for (let x = 0; x < matrix[0].length; x++) {
                ret[y][x] = matrix[y][x];
                if (x>=sx && x<=ex && y>=sy && y<=ey)
                    ret[y][x] = value;
            }
        }
        return ret;
    },
    this.getPackedMatrix = function(){
        let matrix = this.getMatrix();

        let rs = '';
        for (let i=0;i<matrix.length;i++)
            for (let j=0;j<matrix[i].length;j++)
                rs += matrix[i][j] ? '1' : '0';
        return btoa(rs.match(/(.)\1{1,127}|(?:(.)(?!\2)){1,128}/gs).map(function(s){
            return s[0] === s[1] ? String.fromCharCode(257-s.length) + s[0] : String.fromCharCode(s.length-1) + s
        }).join(""));
    }
}
