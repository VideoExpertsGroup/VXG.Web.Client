window.screens = window.screens || {};
window.controls = window.controls || {};
var path = window.core.getPath('camerameta.js');

window.screens['camerameta'] = {
    'header_name': 'Camera metadata',
    'html': path+'camerameta.html',
    'css': [path+'camerameta.css'],
    'stablecss':[path+'scamerameta.css'],
    'js':[],
    'on_before_show':function(access_token, start_time_utc, end_time_utc){
        this.do_not_update = this.from_back ? true : false;
        if (this.do_not_update) return defaultPromise();
        if (this.scroll_top!==undefined)
            delete this.scroll_top;
        core.elements['header-center'].html('Camera metadata');
        core.elements['global-loader'].show();
        let self = this;

        if (!access_token) access_token = $(this.src ? this.src : this.wrapper).getNearParentAtribute('access_token');
        if (!start_time_utc) start_time_utc = $(this.src ? this.src : this.wrapper).getNearParentAtribute('start_time');
        if (!end_time_utc) end_time_utc = $(this.src ? this.src : this.wrapper).getNearParentAtribute('end_time_utc');
        this.start_time_utc = start_time_utc;
        this.end_time_utc = end_time_utc;

        return vxg.cameras.getCameraFrom(access_token).then(function(camera){
            if (camera)
                self.camera = camera;
            core.elements['global-loader'].hide();
        }, function(camera){
            alert('Failed get camera');
            core.elements['global-loader'].hide();
        });
    },
    'on_show':function(access_token, start_time_utc, end_time_utc, autodownload){
        if (this.do_not_update) {
            if (this.scroll_top!==undefined)
                $('.screens').scrollTop(this.scroll_top);
            return defaultPromise();
        }

        if (autodownload)
            this.autodownload = true;
        this.setCurTime();
        this.camera.getName().then(function(name){
            core.elements['header-center'].html('Camera '+name+': metadata');
        });

        return this.updateTable();
    },
    'on_hide':function(){
        this.scroll_top = $('.screens').scrollTop();
    },
    'on_ready':function(){
        return defaultPromise();
    },
    'on_init':function(){
         let self = this;
         this.wrapper.find('.download').click(function(){
             self.metaDownload();
         });
         this.wrapper.find('.show').click(function(){
             self.updateTable();
         });
         this.wrapper.find('.more').click(function(){self.updateTable(true);});
         return defaultPromise();
    },
    dateToUserTimeString: function(date){
        if (date===undefined) date = new Date();
        return date.toLocaleString('en-CA', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false }).replace(/[,|.]/g,'').replace(' 24',' 00');
    },
    dateToUserTimeStringWithMilliseconds: function(date){
        if (date===undefined) date = new Date();
        return ''+date.getHours()+':'+(date.getMinutes()>9?'':'0')+date.getMinutes()+':'+(date.getSeconds()>9?'':'0')+date.getSeconds()+'.'+Math.floor(date.getMilliseconds()/100);
    },
    setCurTime: function(){
        let et = this.end_time_utc ? new Date(this.end_time_utc*1000) : new Date();
        let st = this.start_time_utc ? new Date(this.start_time_utc*1000) : new Date(et.getTime() - 60 * 60 * 1000); // - 1 hour
        st = this.dateToUserTimeString(st);
        et = this.dateToUserTimeString(et);
        this.wrapper.find('.time_from').val(st);
        this.wrapper.find('.time_to').val(et);
    },
    getTimeFrom: function(){
        try{
            return time = new Date(this.wrapper.find('.time_from').val()).toISOString().replace('.000Z','');
            endtime = new Date(this.wrapper.find('.time_to').val()).toISOString().replace('.000Z','');
        } catch(e){
            core.flashInputBackgroundColor(this.wrapper.find('.time_from'));
            return null;
        }
    },
    getTimeTo: function(){
        try{
            return time = new Date(this.wrapper.find('.time_to').val()).toISOString().replace('.000Z','');
        } catch(e){
            core.flashInputBackgroundColor(this.wrapper.find('.time_to'));
            return null;
        }
    },
    updateTable: function(more){
        let _more = more;
        let self = this;
        if (!more) {
            this.starttime = this.getTimeFrom();
            this.endtime = this.getTimeTo();
            this.offset = 0;
            if (!this.starttime || !this.endtime)
                return defaultPromise();
            $(self.wrapper).find('.tablearea').empty();
        }

        if (this.offset===undefined) this.offset=0;
        $(self.wrapper).find('.tablearea').addClass('spinner');
        $(self.wrapper).find('.more').attr('disabled','disabled');

        return this.camera.events.getList(10, this.offset, this.starttime, this.endtime, 'object_and_scene_detection,yolov4_detection').then(function(r){
            let table = '';
            number = self.offset+1;
            for (i in r){
                var time = new Date(r[i]['src']['time']+'Z');
                time.setMinutes(time.getMinutes()-time.getTimezoneOffset());
//                time = time.toISOString().replace('T',' ').substr(0,19);
                time = time.toLocaleString('en-CA', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }).replace(/[,|.]/g,'').replace(' 24',' 00');

                var objects = ""; 
                let tags={};
                
                if (r[i]['src'].meta != null)
                {
                    let a=[];
                    for (var prop in r[i]['src'].meta){
                        if (! (prop == r[i]['src'].name || r[i]['src'].meta[prop] === "" || prop === "total")){
                            a.push({a:prop,v:r[i]['src'].meta[prop]});
                        }
                    }
                    a = a.sort(function(a, b){return parseInt(b.v)-parseInt(a.v)});

                    for (var prop in a)
                        // Exclude Groop ID , meta and ai_engine
                        if (! (a[prop].a == r[i]['src'].name || a[prop].v === "" || a[prop].a === "total")){
                            let v = a[prop].v;
                            objects += (objects?", ":"")+a[prop].a+ (parseInt(v)?"&nbsp;("+v+")":"");
                            tags[a[prop].a]=v;
                        }
                }


                table += '<tr access_token="'+self.camera.camera_id+'" ai_type="'+r[i].src.name+'" event_id="'+r[i].src.id+'"><td>'+number+'</td><td>' + time + '</td><td>' + objects + '</td><td onclick_toscreen="camerametaview"><div class="download_image"></div></td></tr>';
                number++;

            }
            if (!table) {
                $(self.wrapper).find('.tablearea').empty().append('No metadata found');
                $(self.wrapper).find('.tablearea').removeClass('spinner');
                return;
            }
            if (!_more)
                $(self.wrapper).find('.tablearea').empty().append('<table class="table"><tr><th>#</th><th>Time</th><th>Objects</th><th>Action</th></tr></table>');
            $(self.wrapper).find('.tablearea tbody').append(table);
            self.offset += r.length;
            if (self.offset < self.camera.events.total_count)
                $(self.wrapper).find('.more').show();
            else
                $(self.wrapper).find('.more').hide();

            $(self.wrapper).find('.tablearea').removeClass('spinner');
            $(self.wrapper).find('.more').removeAttr('disabled');

            if (self.autodownload) 
                setTimeout(function(){
                    self.metaDownload();
                    self.autodownload = false;
                },1);

        },function(r){
            if (r.status!=401)
                alert('Error loading meta');
            else
                $(self.wrapper).find('.tablearea').empty().append('No metadata found');
            $(self.wrapper).find('.tablearea').removeClass('spinner');
            $(self.wrapper).find('.more').removeAttr('disabled');
        });
    },

    getCameraFromElement: function(element){
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
    },

    'metaDownload': function (){
        let ai_id = this.camera.camera_id;
        let access_token = this.camera.token;
        let engine = 'aws';
        let type = 'object_and_scene_detection,yolov4_detection';
        let starttime = this.getTimeFrom();
        let endtime = this.getTimeTo();
        if (!starttime || !endtime) return;

        var self=this;
        self.access_token = access_token;
        self.meta = [];
        self.starttime = starttime;
        self.endtime = endtime;
        self.camid = ai_id;
    
        function download(data) {
            let file = new Blob([data], {type: 'json'});
            let filename = 'Camera_'+self.camid+'_start_'+self.starttime+'_end_'+self.endtime+'.json';
            if (window.navigator.msSaveOrOpenBlob) // IE10+
                window.navigator.msSaveOrOpenBlob(file, filename);
            else { // Others
                var a = document.createElement("a"),
                        url = URL.createObjectURL(file);
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                setTimeout(function() {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);  
                }, 0); 
            }
        }
    
        function getNext(){
            if (!self.objects.length) {
                return new Promise(function(resolve, reject){setTimeout(function(){resolve(self.meta);}, 0);});
            }
            let event = self.objects.shift();
            if (!event.filemeta || !event.filemeta.download || !event.filemeta.download.url)
                return getNext();
            let event_id = event.id;
            return $.ajax({
              type: "GET",
              dataType: 'json',
              url: event.filemeta.download.url
            }).then(function(res){
                if (!self.camid) self.camid=event.camid;
                self.meta.push({
                    id: event.id,
                    camid: event.camid,
                    time: event.time,
                    meta:res
                });
                return getNext();
            }, function(res){
                return getNext();
            });
        }
    
        var _baseurl = vxg.api.cloud.getBaseURLFromToken(access_token);
    
        core.elements['global-loader'].show();
        vxg.api.cloud.getEventslist(this.camera.token, 1000, 0, undefined, 'object_and_scene_detection,yolov4_detection', starttime, endtime).then(function(r){
            self.objects = r.objects;
            self.meta = [];
            return getNext().then(function(meta){
                download(JSON.stringify(self.meta));
                core.elements['global-loader'].hide();
            },function(){
                core.elements['global-loader'].hide();
            });
        }, function(r){
            alert('fail to get events list');
            core.elements['global-loader'].hide();
        });
    }
};


window.screens['camerametaview'] = {
    'header_name': 'Metadata',
    'html': path+'camerametaview.html',
    'css': [path+'camerameta.css'],
    'stablecss':[],
    'js':[],
    'on_before_show':function(camtoken, eventid, aitype){
        if (this.from_back) return defaultPromise();
        let access_token = camtoken;
        let event_id = eventid;
        let ai_type  = aitype;
        if (this.src){
            if (!access_token) access_token = $(this.src).getNearParentAtribute('access_token');
            if (!event_id) event_id = $(this.src).getNearParentAtribute('event_id');
            if (!ai_type) ai_type = $(this.src).getNearParentAtribute('ai_type');
            
        }
        let self = this;
        self.ai_type = ai_type;
        core.elements['global-loader'].show();
        return window.vxg.cameras.getCameraFrom(access_token).then(function(camera){
            self.camera = camera;
            return camera.events.getEventByID(event_id).then(function(event){
                self.event = event;
                core.elements['global-loader'].hide();
            }, function(){
                core.elements['global-loader'].hide();
            });
        }, function(){
            core.elements['global-loader'].hide();
        });
        return defaultPromise();
    },
    'on_show':function(camtoken){
        let self = this;
        this.camera.getName().then(function(name){
            core.elements['header-center'].html('Camera '+name+': metadata');
        });

        $(this.wrapper).find('.metaImg').attr('src',this.event.src.thumb.url);
        $(this.wrapper).find('.metaSvg').empty();
        $(this.wrapper).find('.metaText').empty();


        var visual = false;
        if (this.event.src.name === 'object_and_scene_detection' || this.event.src.name === "yolov4_detection")
            visual = true;

        let tags={};let objects = ""; 
        
        if (this.event.src.meta != null)
        {
            let a=[];
            for (var prop in this.event.src.meta){
                if (! (prop == this.event.src.name || this.event.src.meta[prop] === "" || prop === "total")){
                    a.push({a:prop,v:this.event.src.meta[prop]});
                }
            }
            a = a.sort(function(a, b){return parseInt(b.v)-parseInt(a.v)});

            for (var prop in a)
                // Exclude Groop ID , meta and ai_engine
                if (! (a[prop].a == this.event.src.name || a[prop].v === "" || a[prop].a === "total")){
                    let v = a[prop].v;
                    objects += (objects?", ":"")+a[prop].a+ (parseInt(v)?"&nbsp;("+v+")":"");
                    tags[a[prop].a]=v;
                }
        }

        var tags_html = '';
        for (let i in tags){
            var v;
            if (visual == true)  
                v =  tags[i] > 0 ? '<a href="javascript:void(0)" data-name="'+i+'">'+i+'&nbsp;('+tags[i]+')</a>' : i ;
            else 
               v =  tags[i] > 0 ? i+'&nbsp;('+tags[i]+')' : i ;
                   
            tags_html += (tags_html?', ':'') + v;
        }
        $(this.wrapper).find('.metaTags').html(tags_html);

        $(this.wrapper).find('.metaTags a').click(function(r){
            self.show_rect(this.dataset.name, self.ai_type);
        });

        $(this.wrapper).find('.metaText').addClass('spinner');
        this.event.getFileMeta().then(function(filemeta){
            $(self.wrapper).find('.metaText').removeClass('spinner');
            $(self.wrapper).find('.metaText').val(JSON.stringify(filemeta,'','  '));
        }, function(){
            $(self.wrapper).find('.metaText').removeClass('spinner');
        });

        return defaultPromise();
    },
    'on_hide':function(){
        return defaultPromise();
    },
    'on_ready':function(){
        return defaultPromise();
    },
    'on_init':function(){
        let self = this;
        $(this.wrapper).find('.copy').click(function(event){
            event.preventDefault();
            $(self.wrapper).find('.metaText').select();
            document.execCommand("copy");
        });
        return defaultPromise();
    },
   'show_rect':function(name, type)
    {
            let self = this;
            var data =  $(this.wrapper).find('.metaText').val();
            // Check if the data is available 
            if (type === 'object_and_scene_detection')
                 return self.show_rect_aws_object_and_scene_detection(data, name);
            else if (type === 'yolov4_detection')
                return self.show_rect_yolo_object_detection(data, name);     

            alert("The visualisation is not supported by the chosen AI : '" + type + "'");     
            return;
    },
    'show_rect_aws_object_and_scene_detection':function(ai_json, name)
    {

        var data = JSON.parse(ai_json);
	
        img_w = $(this.wrapper).find('.metaImg')[0].width;
        img_h = $(this.wrapper).find('.metaImg')[0].height;

        var ctx = '<svg viewbox="0 0 ' + img_w + ' ' + img_h + '" style="position:absolute; top:0px; left:0px">';

        for (var key in data['Labels']){
            var label = data['Labels'][key];
            if (label.Name === name)
                for (var key in label['Instances'])
                {
                    var instance = label['Instances'][key];			
                    //print(instance['BoundingBox']['Width'])
                    w = instance['BoundingBox']['Width']*img_w;
                    h = instance['BoundingBox']['Height']*img_h
                    l = instance['BoundingBox']['Left']*img_w;
                    t = instance['BoundingBox']['Top']*img_h
                    ctx += "<rect x='"+ l +"' y='"+ t +"' width='"+ w + "' height='"+ h +"' "
                    ctx += "style='fill:blue;stroke:#a0cf4d;stroke-width:3;fill-opacity:0.01;stroke-opacity:0.9'></rect>"
                }
            }
            ctx += "</svg>"

        $(this.wrapper).find('.metaSvg').html(ctx);
    },
    'show_rect_yolo_object_detection':function(ai_json, name){


        var data = JSON.parse(ai_json);
	
        c_w =  $(this.wrapper).find('.metaImg')[0].width/$(this.wrapper).find('.metaImg')[0].naturalWidth;
        c_h =  $(this.wrapper).find('.metaImg')[0].height/$(this.wrapper).find('.metaImg')[0].naturalHeight;

        img_w = $(this.wrapper).find('.metaImg')[0].width;
        img_h  = $(this.wrapper).find('.metaImg')[0].height;

        var ctx = '<svg viewbox="0 0 ' + img_w + ' ' + img_h + '" style="position:absolute; top:0px; left:0px">';

        if (data['data']['bounding-boxes'])
        data['data']['bounding-boxes'].forEach(function(item){
                    if (item.ObjectClassName.toUpperCase() == name.toUpperCase())
                    {
                        var width = item['coordinates']['right'] - item['coordinates']['left'];
                        var height = item['coordinates']['bottom'] - item['coordinates']['top'];
                        w = width * c_w;
                        h = height * c_h;
                        l = item['coordinates']['left'] * c_w;
                        t = item['coordinates']['top'] * c_h;

                        ctx += "<rect x='"+ l +"' y='"+ t +"' width='"+ w + "' height='"+ h +"' ";
                        ctx += "style='fill:blue;stroke:#a0cf4d;stroke-width:3;fill-opacity:0.01;stroke-opacity:0.9'></rect>";
                    }
        });
        
        ctx += "</svg>";

        $(this.wrapper).find('.metaSvg').html(ctx);
    } 


};
