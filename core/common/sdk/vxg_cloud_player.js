// VXG cloud player ver. 1.0.4.13 10/12/2021
// @language_out ES6
window.VXG = window.VXG || {};

VXG.API = function(token, as_cloud, link, as_default){
    if (!token) return;
    if (as_cloud===undefined) as_cloud = true;
    if (!link) link = 'web.skyvr.videoexpertsgroup.com';
    let channel_id;
    let ts = token.split(';');
    if (ts.length>0 && parseInt(ts[0])>0){
        channel_id = parseInt(ts[0]);
        token = ts[1];
    }
    let token_json;
    try{token_json = JSON.parse(atob(token));} catch(e){};
    let cam_obj; let token_type = 'LKey';
    if (token_json)
        token_type = (token_json['camid']===undefined && token_json['token']!==undefined) ? 'SI' : 'Acc';
    if (token_type==='Acc'){
        cam_obj = new VXG.CAMERA;
        cam_obj.set_token(token);
    } else
        cam_obj = new VXG.CAMERALIST;
    cam_obj.api = new VXG.CLOUDAPI(cam_obj, token, token_type, link, as_cloud);
    if (token_json){
        cam_obj.api.server_token_json = token_json;
        if (cam_obj.api.server_token_json['api']) cam_obj.api.server_url = cam_obj.api.server_token_json['api'];
        cam_obj.api.server_url = cam_obj.api.server_url.trim();
        if (location.protocol=='http:' && cam_obj.api.server_token_json['api_p']) cam_obj.api.server_url += ':'+cam_obj.api.server_token_json['api_p'];
        if (location.protocol=='https:' && cam_obj.api.server_token_json['api_sp']) cam_obj.api.server_url += ':'+cam_obj.api.server_token_json['api_sp'];
        if (cam_obj.api.server_token_json['path']) cam_obj.api.server_url += (cam_obj.api.server_token_json['path'][0]!='/'?'/':'')+cam_obj.api.server_token_json['path'];
    }
    if (cam_obj.api.server_url.substr(0,7)=='http://') cam_obj.api.server_url = cam_obj.api.server_url.substr(7);
    if (cam_obj.api.server_url.substr(0,8)=='https://') cam_obj.api.server_url = cam_obj.api.server_url.substr(8);
    if (cam_obj.api.server_url.substr(-1)!=='/') cam_obj.api.server_url += '/';
    cam_obj.api.server_url = (['http:','https:'].indexOf(location.protocol)===-1?'https:':location.protocol) + '//' + cam_obj.api.server_url;
    if (token_type!=='Acc' && as_default)
        VXG.DEFAULT = cam_obj;
    if ((token_type==='LKey' || token_type==='SI') && channel_id){
        return cam_obj.getCamera(channel_id);
    }

    return cam_obj;
}

VXG.API.V2 = {
      post_v2_cameras_notifications_push_devices(channel_id,param)     {return this.r('POST',  'api/v2/cameras/'+channel_id+'/notifications/push/devices/',{}, params?params:{});},
    delete_v2_cameras_notifications_push_devices(channel_id,device_id) {return this.r('DELETE','api/v2/cameras/'+channel_id+'/notifications/push/devices/'+device_id+'/',{},params?params:{});},
       get_v2_cameras(params, camera_id)                               {return this.r('GET',   'api/v2/cameras/'+(camera_id?camera_id+'/':''),                       params?params:{'detail':'detail'}, {});},
       put_v2_cameras(camera_id, camera_data)                          {return this.r('PUT',   'api/v2/cameras/'+camera_id+'/',                                      {}, camera_data);},
      post_v2_cameras(camera_data)                                     {return this.r('POST',  'api/v2/cameras/',                                                    {}, camera_data);},
    delete_v2_cameras(camera_id)                                       {return this.r('DELETE','api/v2/cameras/'+camera_id+'/',                                      {}, {});},
       get_v2_cameras_meta(camera_id, params, tag)                     {return this.r('GET',   'api/v2/cameras/'+camera_id+'/'+(tag?tag+'/':''),                     params?params:{}, {});},
      post_v2_cameras_meta(camera_id, params)                          {return this.r('POST',  'api/v2/cameras/'+camera_id+'/',                                      {}, params?params:{});},
       put_v2_cameras_meta(camera_id, params, tag)                     {return this.r('PUT',   'api/v2/cameras/'+camera_id+'/'+tag+'/',                              {}, params?params:{});},
    delete_v2_cameras_meta(camera_id, tag)                             {return this.r('DELETE','api/v2/cameras/'+camera_id+'/'+tag+'/',                              {}, {});},
       get_v2_cameras_sharings(channel_id,params,share_id)             {return this.r('GET',   'api/v2/cameras/'+channel_id+'/sharings/'+(share_id?share_id+'/':''), params?params:{}, {});},
      post_v2_cameras_sharings(channel_id,params)                      {return this.r('POST',  'api/v2/cameras/'+channel_id+'/sharings/'+(share_id?share_id+'/':''), {}, params?params:{});},
       put_v2_cameras_sharings(channel_id,share_id, params)            {return this.r('PUT',   'api/v2/cameras/'+channel_id+'/sharings/'+share_id+'/',               {}, params?params:{});},
    delete_v2_cameras_sharings(channel_id,share_id)                    {return this.r('DELETE','api/v2/cameras/'+channel_id+'/sharings/'+share_id+'/',               {}, {});},
       get_v2_cameras_preview(camera_id)                               {return this.r('GET',   'api/v2/cameras/'+camera_id+'/preview/',                              {}, {});},
       get_v2_cameras_limits(camera_id)                                {return this.r('GET',   'api/v2/cameras/'+camera_id+'/limits/',                               {}, {});},
       get_v2_cameras_usage(camera_id)                                 {return this.r('GET',   'api/v2/cameras/'+camera_id+'/usage/',                                {}, {});},
       get_v2_sharings(params,share_id)                                {return this.r('GET',   'api/v2/sharings/'+(share_id?share_id+'/':''),                        {}, {});},
       put_v2_sharings(share_id,params)                                {return this.r('PUT',   'api/v2/sharings/'+share_id+'/',                                      {}, params);},
      post_v2_sharings(params)                                         {return this.r('POST',  'api/v2/sharings/',                                                   {}, params?params:{});},
    delete_v2_sharings(share_id)                                       {return this.r('DELETE','api/v2/sharings/'+share_i+'/',                                       {}, {});},
       get_v2_storage_events(params)                                   {return this.r('GET',   'api/v2/storage/events/',                                             params?params:{}, {});},
       get_v2_storage_thumbnails(params)                               {return this.r('GET',   'api/v2/storage/thumbnails/',                                         params?params:{}, {});},
       get_v2_storage_timeline(camera_id,params)                       {return this.r('GET',   'api/v2/storage/timeline/'+camera_id+'/',                             params?params:{}, {});},
      post_v2_storage_clips_sharings(clip_id,param)                    {return this.r('POST',  'api/v2/storage/clips/'+clip_id+'/sharings/',                         {}, params);},
       get_v2_storage_clips(clip_id, param)                            {return this.r('GET',   'api/v2/storage/clips/'+(clip_id?clip_id+'/':''),                     params, {});},
      post_v2_storage_clips(param)                                     {return this.r('POST',  'api/v2/storage/clips/',                                              {},params);},
       put_v2_storage_clips(clip_id, param)                            {return this.r('PUT',   'api/v2/storage/clips/'+clip_id+'/',                                  {},params);},
    delete_v2_storage_clips(clip_id)                                   {return this.r('DELETE','api/v2/storage/clips/'+(clip_id?clip_id+'/':''),                     {}, {});},
      post_v2_storage_memorycard_timeline(camera_id,param)             {return this.r('POST',  'api/v2/storage/memory_card/'+camera_id+'/timeline/',                 {}, param);},
       get_v2_storage_memorycard_timeline(camera_id,rid)               {return this.r('GET',   'api/v2/storage/memory_card/'+camera_id+'/timeline/'+rid+'/',         {}, {});},
      post_v2_storage_memorycard_synchronize(camera_id,param)          {return this.r('POST',  'api/v2/storage/memory_card/'+camera_id+'/synchronize/',              {}, param);},
       get_v2_storage_memorycard_synchronize(camera_id,rid)            {return this.r('GET',   'api/v2/storage/memory_card/'+camera_id+'/synchronize/'+rid+'/',      {}, {});}
}
VXG.API.V4 = {
       get_v4_channel(params)                                          {return this.r('GET',   'api/v4/channel/',                                                    params?params:{}, {});},
       put_v4_channel(params)                                          {return this.r('PUT',   'api/v4/channel/',                                                    {}, params);},
       get_v4_clip(clip_id, params)                                    {return this.r('GET',   'api/v4/clips/'+(clip_id?clip_id+'/':''),                             params?params:{}, {});},
       put_v4_clip(clip_id, params)                                    {return this.r('PUT',   'api/v4/clips/'+clip_id+'/',                                          {},params?params:{});},
      post_v4_clip(params)                                             {return this.r('POST',  'api/v4/clips/',                                                      {}, params?params:{});},
    delete_v4_clip(clip_id)                                            {return this.r('DELETE','api/v4/clips/'+(clip_id?clip_id+'/':''),                             {}, {});},
      post_v4_meta(params)                                             {return this.r('POST',  'api/v4/meta/',                                                       {}, params?params:{});},
       put_v4_meta(params)                                             {return this.r('PUT',   'api/v4/meta/',                                                       {}, params?params:{});},
    delete_v4_meta(params)                                             {return this.r('DELETE','api/v4/meta/',                                                       {}, {});},
      post_v4_meta_filter(params)                                      {return this.r('POST',  'api/v4/meta/filter/',                                                {}, params?params:{});},
    delete_v4_meta_filter(params)                                      {return this.r('DELETE','api/v4/meta/filter/',                                                {}, {});},
       get_v4_storage_records(params, record_id)                       {return this.r('GET',   'api/v4/storage/records/'+(record_id?record_id+'/':''),               params?params:{}, {});},
    delete_v4_storage_records(record_id)                               {return this.r('GET',   'api/v4/storage/records/'+(record_id?record_id+'/':''),               {}, {});},
      post_v4_storage_records_upload()                                 {return this.r('POST',  'api/v4/storage/records/upload/',                                     {}, {});},
       get_v4_storage_images(params, images_id)                        {return this.r('GET',   'api/v4/storage/records/'+(images_id?images_id+'/':''),              params?params:{}, {});},
    delete_v4_storage_images(images_id)                                {return this.r('DELETE','api/v4/storage/records/'+(images_id?images_id+'/':''),               {}, {});},
      post_v4_storage_images_upload()                                  {return this.r('POST',  'api/v4/storage/records/upload/',                                     {}, {});},
       get_v4_live_watch()                                             {return this.r('GET',   'api/v4/live/watch/',                                                 {}, {});},
       get_v4_live_image()                                             {return this.r('GET',   'api/v4/live/image/',                                                 {}, {});},
       get_v4_live_source()                                            {return this.r('GET',   'api/v4/live/source/',                                                {}, {});},
      post_v4_live_source()                                            {return this.r('POST',  'api/v4/live/source/',                                                {}, {});},
       put_v4_live_source(params)                                      {return this.r('PUT',   'api/v4/live/source/',                                                {}, params?params:{});}
}
VXG.API.V5 = {
    get_v5_channels(params, channel_id){return this.r('GET','api/v5/channels/'+(channel_id?channel_id+'/':''),params?params:{'include_events_info':'true','preview':'true','include_meta':'true'},{});}
}


VXG.CLOUD = function(token, link, as_default=true){
    let ret = VXG.API(token, true, link, as_default);
    return ret;
}
VXG.SERVER = function(token, link, as_default=true, id=0, uuid='',  endpoint='', name = 'Noname server'){
    let ret = VXG.API(token, false, link, as_default);
    ret.id=0;ret.uuid=uuid;ret.endpoint=endpoint;ret.name=name;
    return ret;
}

VXG.CLOUDAPI = class{
    get ver(){
        let ret = [];
        if (this.get_v2_cameras) ret.push(2);
        if (this.get_v3_channels) ret.push(3);
        if (this.get_v4_channel) ret.push(4);
        if (this.get_v5_channels) ret.push(5);
        if (this.get_v6_servers) ret.push(6);
        return ret;
    }
    constructor(parent, token, token_type, link, as_cloud, with_acc){
        this.livetime = 2000;
        if (VXG.CLOUDAPI.cache === undefined) VXG.CLOUDAPI.cache = {};
        this.parent = parent;
        this.server_token = token; 
        this.server_token_type = token_type; 
        this.server_url = link;
        this.server_headers = {Authorization: token_type+' '+token};
        this.as_cloud = as_cloud;
        if (token_type==='Acc'){
            Object.assign(this, VXG.API.V2);
            if (as_cloud) Object.assign(this, VXG.API.V4);
            this.server_acc_headers = {Authorization: 'Acc '+token};
            try{
                let token_json = JSON.parse(atob(token));
                if (token_json['access']!==undefined)
                    this.access = token_json['access'];
                this.server_acc_v2 = 'token='+token_json['token'];
            } catch(e){return;};
        }
        if (token_type==='LKey'){
            Object.assign(this, VXG.API.V2);
            Object.assign(this, VXG.API.V3);
            if (as_cloud) Object.assign(this, VXG.API.V6);
            this.access = 'all';
        }
        if (token_type==='SI'){
            Object.assign(this, VXG.API.V2);
            if (as_cloud) Object.assign(this, VXG.API.V5);
        }
        if (with_acc && parent.token){
            Object.assign(this, VXG.API.V4);
            if (as_cloud) Object.assign(this, VXG.API.V5);
            this.server_acc_headers = {Authorization: 'Acc '+parent.token};
            try{
                let token_json = JSON.parse(atob(parent.token));
                this.server_acc_v2 = 'token='+token_json['token'];
            } catch(e){return;};
        }
    }
    setHook(hook_before, hook_after){
        this.hook_before = hook_before;
        this.hook_after = hook_after;
    }
    r(type, path, get_param={}, post_param={}){
        if (this.hook_before) this.hook_before(type, path, get_param, post_param);
        let self = this;
        if (path.substr(0,1)=='/') path = path.substr(1);
        if (path.substr(-1)!=='/') path += '/';
        let params = '';
        for (let i in get_param) params += (params?'&':'?') + i + '=' + get_param[i];
        let headers = this.server_headers;
        if (path.indexOf('/v4/')!==-1 && this.server_token_type!=='Acc') {
            if (this.server_acc_headers)
                headers = this.server_acc_headers;
            else
                return this.parent.getToken().then(function(token){
                    self.server_acc_headers = {Authorization: 'Acc '+token};
                    return self.r(type, path, get_param, post_param);
                });
        }
//        if (path.indexOf('/v2/')!==-1 && this.server_acc_v2) {headers = {};params=(params?'&':'?')+this.server_acc_v2;}
        if (type==='GET'){
            if (VXG.CLOUDAPI.cache[self.server_url + path + params + (headers&&headers.Authorization?' '+headers.Authorization:'')]!==undefined){
                if (VXG.CLOUDAPI.cache[self.server_url + path + params + (headers&&headers.Authorization?' '+headers.Authorization:'')] instanceof Promise) 
                    return VXG.CLOUDAPI.cache[self.server_url + path + params + (headers&&headers.Authorization?' '+headers.Authorization:'')];
                if (VXG.CLOUDAPI.cache[self.server_url + path + params + (headers&&headers.Authorization?' '+headers.Authorization:'')].__expired > new Date().getTime())
                    return new Promise(function(resolve, reject){resolve(VXG.CLOUDAPI.cache[self.server_url + path + params + (headers&&headers.Authorization?' '+headers.Authorization:'')]);});
                delete VXG.CLOUDAPI.cache[self.server_url + path + params + (headers&&headers.Authorization?' '+headers.Authorization:'')];
            }
        } else
            VXG.CLOUDAPI.cache = {};
        let abort_controller = new AbortController();
        let ps = {method:type,headers: headers, signal:abort_controller.signal};
        if (type!=='GET') ps.body = JSON.stringify(post_param);

        let ret = fetch(this.server_url + path + params,ps).then(function(r){
            if (parseInt(r.status/100)!==2) {
                return r.json().then(function(t){
                    if (t && t.errorDetail)
                        throw '['+r.status+'] '+t.errorDetail;
                    throw '['+r.status+']';
                },function(t){
                    throw '['+r.status+']';
                });
            }
            return r.json().then(function(t){
                if (self.hook_after) self.hook_after(t, type, path, get_param, post_param);
/*
                if (type==='GET'){
                    VXG.CLOUDAPI.cache[self.server_url + path + params + (headers&&headers.Authorization?' '+headers.Authorization:'')] = t;
                    VXG.CLOUDAPI.cache[self.server_url + path + params + (headers&&headers.Authorization?' '+headers.Authorization:'')].__expired = new Date().getTime() + self.livetime;
                } 
*/
                return t;
            });
        },function(r){
            throw r;
        });
        ret.abort_controller = abort_controller;
//        if (type==='GET') VXG.CLOUDAPI.cache[self.server_url + path + params + (headers&&headers.Authorization?' '+headers.Authorization:'')] = ret;
        return ret;
    }
}

VXG.CAMERA = class{
    setHook(hook_before, hook_after){
        this.api.setHook(hook_before, hook_after);
    }
    isFullAccess(){
        return this.api.access==='all';
    }
    set_token(acc_token){
        try{this.token_json = JSON.parse(atob(acc_token));} catch(e){return;};
        this.token = acc_token;
        if (!isNaN(parseInt(this.token_json['camid']))) this.id = parseInt(this.token_json['camid']);
        this.readonly = this.token_json['access']!='all';
    }
    set_v2_data(v2_data){
        this.v2_data = v2_data;
        this.name = v2_data.name;
        this.id = v2_data.id;
        if (v2_data.status) this.status= v2_data.status;
        if (v2_data.access!==undefined) this.readonly = v2_data.access.indexOf('all')===-1;
    }
    set_v3_data(v3_data){
        this.v3_data = v3_data;
        if (v3_data.access_tokens) {
            if (v3_data.access_tokens['all']) {this.set_token(v3_data.access_tokens['all']);this.readonly=false;}
            else if (v3_data.access_tokens['watch']) {this.set_token(v3_data.access_tokens['watch']);this.readonly=true;}
        }
        this.name = v3_data.name;
        this.name = v3_data.id;
    }
    set_v4_data(v4_data, acc_token, readonly){
        this.readonly = readonly===undefined ? true : readonly;
        if (acc_token) this.set_token(acc_token);
        this.v4_data = v4_data;
        this.name = v4_data.name;
        if (v4_data.status) this.status= v4_data.status;
    }
    set_v5_data(v5_data){
        this.v5_data = v5_data;
        if (v5_data.token) this.set_token(v5_data.token);
        this.name = v5_data.name;
        this.id = v5_data.id;
        if (v5_data.status) this.status= v5_data.status;
    }
    getToken(){
        let self = this;
        if (this.token) return new Promise(function(resolve, reject){resolve(self.token);});
        if (!this.id) return new Promise(function(resolve, reject){reject();});
        if (this.api.get_v5_channels)
            return this.api.get_v5_channels(null,this.id).then(function(r){
                self.set_v5_data(r);
                return r.token;
            });
        if (this.api.get_v3_channels)
        return this.api.get_v3_channels(null,this.id).then(function(r){
            self.set_v3_data(r);
            if (self.api.as_cloud) Object.assign(self.api, VXG.API.V4);
            return self.token;
        });
    }
    getName(){
        let self = this;
        if (this.name) return new Promise(function(resolve, reject){resolve(self.name);});
        if (!this.id) return new Promise(function(resolve, reject){reject('No channel id');});
        if (this.api.get_v2_cameras) return this.api.get_v2_cameras(null,this.id).then(function(r){
            self.set_v2_data(r);
            return r.name;
        });
        if (this.api.get_v5_channels) return this.api.get_v5_channels(null,this.id).then(function(r){
            let has_token = !!self.token;
            self.set_v5_data(r);
            if (!has_token && this.token){
                Object.assign(this.api, VXG.API.V4);
                Object.assign(this.api, VXG.API.V5);
                this.api.server_acc_headers = {Authorization: 'Acc '+this.token};
                try{
                    let token_json = JSON.parse(atob(this.token));
                    this.api.server_acc_v2 = 'token='+token_json['token'];
                } catch(e){return;};
            }
            return r.name;
        });
        if (!this.api.get_v4_channel) return new Promise(function(resolve, reject){reject();});
        return this.api.get_v4_channel().then(function(r){
            self.set_v4_data(r);
            return r.name;
        });
    }
    setLastStatus(status){
        this.last_status = status;
    }
    getLastStatus(){
        if (!this.last_status) this.last_status='inactive';
        return this.last_status;
    }
    getReqMode(){
        let self = this;
        if (this.api.get_v2_cameras) return this.api.get_v2_cameras(null,this.id).then(function(r){
            self.set_v2_data(r);
            return r.rec_mode;
        });
    }
    getStatus(){
        let self = this;
//        if (this.status) return new Promise(function(resolve, reject){resolve(self.status);});
        if (!this.id) return new Promise(function(resolve, reject){reject('No channel id');});
        if (this.api.get_v2_cameras) return this.api.get_v2_cameras(null,this.id).then(function(r){
            self.set_v2_data(r);
            self.last_status = r.status;
            return r.status;
        });
        if (this.api.get_v5_channels) return this.api.get_v5_channels(null,this.id).then(function(r){
            self.set_v5_data(r);
            self.last_status = r.status;
            return r.status;
        });
        if (!this.api.get_v4_channel) return new Promise(function(resolve, reject){reject();});
        return this.api.get_v4_channel().then(function(r){
            self.set_v4_data(r);
            self.last_status = r.status;
            return r.status;
        });
    }
    getStorageTimeline(start_time, end_time, limit){
        return this.api.get_v2_storage_timeline(this.id, {slices:1,limit:(limit||50),start:(new Date(start_time)).toISOString().substr(0,23),end:(new Date(end_time)).toISOString().substr(0,23)});
    }

    getStorageThumbnails(time,reverse,limit, camera_id, time_to){
        let params = {limit:(limit||50), order_by:'time'};
        if (reverse) params['order_by']='-time';
        if (camera_id) params['camid']=camera_id;
        if (reverse) {
            params['end']=(new Date(time)).toISOString().substr(0,23);
            if (time_to)
                params['start']=(new Date(time_to)).toISOString().substr(0,23);
        }else {
            params['start']=(new Date(time+ 1000)).toISOString().substr(0,23);
            if (time_to)
                params['end']=(new Date(time_to)).toISOString().substr(0,23);
        }
        return this.api.get_v2_storage_thumbnails(params);
    }
    getStorageRecords(time,reverse,limit){
        let params = {limit:(limit||50)};
        if (reverse) params['order_by']='-time';
        if (reverse)  params['end']=(new Date(time)).toISOString().substr(0,23);
        else params['start']=(new Date(time)).toISOString().substr(0,23);
        return this.api.get_v4_storage_records(params);
    }
    getOneStorageRecord(time_from,time_to,retry_count){
        let t1 = typeof time_from === 'string' ? time_from : (new Date(time_from)).toISOString().substr(0,23);
        let t2 = typeof time_to === 'string' ? time_to : (new Date(time_to)).toISOString().substr(0,23);
        let params = {limit:1, start: t1, end: t2};
        let self = this;
        return this.api.get_v4_storage_records(params).then(function(r){
            if (r.objects.length || retry_count<1) return r;
            return new Promise(function(resolve, reject){setTimeout(function(){resolve()},1000);}).then(function(){
                return self.getOneStorageRecord(time_from,time_to,retry_count-1);
            });
        });
    }
    getStorageMemorycardTimeline(start_time, end_time, retry_count){
        let self = this;
        if (!retry_count) retry_count=50;
        if (this.timeline_promise) return this.timeline_promise;
        this.timeline_promise =  this.api.post_v2_storage_memorycard_timeline(this.id,{start:(new Date(start_time)).toISOString().substr(0,23),end:(new Date(end_time)).toISOString().substr(0,23)}).then(function(trd){
            if (trd.status!=='pending') {
                self.timeline_promise = undefined;
                return trd;
            }
            let check = function(rid, rc){
                if (!rc) {
                    self.timeline_promise = undefined;
                    return self.getStorageMemorycardTimeline(start_time, end_time);
                }
                return self.api.get_v2_storage_memorycard_timeline(self.id, rid).then(function(r){
                    if (r.status!=='pending') {
                        self.timeline_promise = undefined;
                        return r;
                    }
                    return new Promise(function(resolve, reject){setTimeout(function(){resolve()},1000);}).then(function(){
                        return check(rid, rc-1);
                    });
                });
            }
            return check(trd.id, retry_count);
        },function(){
            self.timeline_promise = undefined;
        });
        return this.timeline_promise;
    }
    getStorageMemorycardSynchronize(start_time, end_time, cb, retry_count){
        let self = this;
        if (!retry_count) retry_count=100;

        let st = typeof start_time === 'string' ? start_time : (new Date(start_time)).toISOString().substr(0,23);
        let et = typeof end_time === 'string' ? end_time : (new Date(end_time)).toISOString().substr(0,23);
        return this.api.post_v2_storage_memorycard_synchronize(this.id,{/*existing_data:'delete',*/start:st,end:et}).then(function(trd){
//            return trd;
            if (trd.status!=='pending') return trd;
            let check = function(rid, rc){
                if (!rc)
                    return new Promise(function(resolve, reject){setTimeout(function(){resolve()},1000);}).then(function(){
                        return self.getStorageMemorycardSynchronize(start_time, end_time, cb);
                    });
                if (cb) cb();
                return new Promise(function(resolve, reject){setTimeout(function(){resolve()},1000);}).then(function(){
                    return self.api.get_v2_storage_memorycard_synchronize(self.id, rid).then(function(r){
                        if (r.status!=='pending') return r;
                        return new Promise(function(resolve, reject){setTimeout(function(){resolve()},100);}).then(function(){
                            return check(rid,rc-1);
                        });
                    });
                });
            }
            return check(trd.id, retry_count);
        });
    }
    destroy(){
    }
}

VXG.CAMERALIST = class{
    getCamera(id){
        if (isNaN(parseInt(id))) return;
        let cam_obj = new VXG.CAMERA;
        cam_obj.api = new VXG.CLOUDAPI(cam_obj, this.api.server_token, this.api.server_token_type, this.api.server_url, this.api.as_cloud, true);
        if (this.api.as_cloud) Object.assign(cam_obj.api, VXG.API.V4);
        cam_obj.id = parseInt(id);
        return cam_obj;
    }
    getCamera2(token_or_id){
        let self = this;
        let id = token_or_id;
        if (isNaN(parseInt(id))){
            try{
                let json = JSON.parse(atob(token_or_id)); 
                if (!isNaN(parseInt(this.token_json['camid']))) id = parseInt(json['camid']);
            } catch(e){return new Promise(function(resolve, reject){reject();});};
        } else id = parseInt(id);
        if (!id) return new Promise(function(resolve, reject){reject();});
        
        if (this.api.get_v5_channels)
            return this.api.get_v5_channels(null,id).then(function(r){
                let cam_obj = new VXG.CAMERA;
                cam_obj.set_v5_data(r);
                cam_obj.api = new VXG.CLOUDAPI(cam_obj, self.api.server_token, self.api.server_token_type, self.api.server_url, self.api.as_cloud, true);
                return cam_obj;
            });
        if (this.api.get_v3_channels)
            return this.api.get_v3_channels(null,id).then(function(r){
                let cam_obj = new VXG.CAMERA;
                cam_obj.set_v3_data(r);
                cam_obj.api = new VXG.CLOUDAPI(cam_obj, self.api.server_token, self.api.server_token_type, self.api.server_url, self.api.as_cloud, true);
                return cam_obj;
            });
        if (!this.api.get_v2_cameras) return new Promise(function(resolve, reject){reject();});
        return this.api.get_v2_cameras(null,id).then(function(r){
            let cam_obj = new VXG.CAMERA;
            cam_obj.api = self.api;
            cam_obj.set_v2_data(r);
            cam_obj.api = new VXG.CLOUDAPI(cam_obj, self.api.server_token, self.api.server_token_type, self.api.server_url, self.api.as_cloud);
            return cam_obj;
        });
    }
    getServer(id_or_uuid){
        if (!this.api.get_v6_servers) return new Promise(function(resolve, reject){reject();});
        return this.api.get_v6_servers().then(function(servers){
            if (!servers.objects) return new Promise(function(resolve, reject){reject();});
            for (let i in servers.objects){
                if (servers.objects[i]['id']==id_or_uuid || servers.objects[i]['uuid']==id_or_uuid){
                    if (servers.objects[i]['l_key'] && servers.objects[i]['api_endpoint'] && servers.objects[i]['id'] && servers.objects[i]['uuid'] && servers.objects[i]['endpoint'])
                        return new VXG.SERVER(servers.objects[i]['l_key'], servers.objects[i]['api_endpoint'], servers.objects[i]['id'], servers.objects[i]['uuid'], servers.objects[i]['endpoint'], servers.objects[i]['name']);
                }
            }
            return new Promise(function(resolve, reject){reject();});
        });
    }
    destroy(){
    }
}
class CTimeLinePicker extends HTMLElement {
    static get observedAttributes() {
        return ['scale','centerutctime','selectutctime','utc']; 
    }
    constructor() {
        super();
        this.event_moved = new Event('moved',{cancelable: false, bubbles: true});
        this.event_moving = new Event('moving',{cancelable: false, bubbles: true});
        this.event_change = new Event('change',{cancelable: false, bubbles: true});
        this.event_getrange = new Event('getrange',{cancelable: false, bubbles: true});
        this.default_scale = 100;
        this.min_frame_width = 18;
        this.min_sec_frame_width = 155;
        this.min_hoursec_width = 57;
        this.min_year_width = 32;
    }
    recalcWidths(){
        this.min_year_width = this.textWidth('0000');
        this.min_months_width = this.textWidth('M');
        this.min_year_month_width = this.textWidth('2020 May')+6;
        this.min_day_width = this.textWidth('00')+10;
        this.min_day_hour_width = this.textWidth('22 Feb 2020')+2;
        this.min_hour_width = this.textWidth('00:00');
        this.min_hoursec_width = this.textWidth('00:00:00');
        this.min_frame_width = this.textWidth('00')+2;
        this.min_sec_frame_width = this.textWidth('22 Feb 2020, 00:00:000')+2;
        this.default_scale = 60*60*24*365/(this.min_year_width*1);
    }
    adjustTime(time){
        let mintime = this.getAttribute('mintime');
        if (mintime!==null){
            if (mintime[0]!='+' && mintime[0]!='-' && parseInt(mintime)==mintime) mintime = parseInt(mintime);
            else{
                let t = parseInt(mintime.substr(1));
                if (mintime[0]=='+' && !isNaN(t))
                    mintime = new Date().getTime()+t;
                else
                    if (mintime[0]=='-' && !isNaN(t))
                        mintime = new Date().getTime()-t;
                    else
                        mintime = new Date().getTime()
            }
            if (mintime!==undefined && time<parseInt(mintime)) time=parseInt(mintime);
        }

        let maxtime = this.getAttribute('maxtime');
        if (maxtime!==undefined){
            if (maxtime[0]!='+' && maxtime[0]!='-' && parseInt(maxtime)==maxtime) maxtime = parseInt(maxtime);
            else{
                let t = parseInt(maxtime.substr(1));
                if (maxtime[0]=='+' && !isNaN(t))
                    maxtime = new Date().getTime()+t;
                else
                    if (maxtime[0]=='-' && !isNaN(t))
                        maxtime = new Date().getTime()-t;
                    else
                        maxtime = new Date().getTime()
            }
            if (maxtime!==undefined && time>parseInt(maxtime)) time=parseInt(maxtime);
        }
        return time;
    }
    connectedCallback() {
        let self = this;
        this.addEventListener("mousewheel", function(e) { 
            if (self.getAttribute('disabled')!==null) return;
            if (e.wheelDeltaX==0 && e.offsetX < self.getBoundingClientRect().width/2){
                let scale = self.getAttribute('scale');
                scale = scale===null ? self.default_scale : (scale);
                if(e.wheelDelta /120 > 0) {
                    scale = (scale/1.5);
                    let req_frames = self.getAttribute('frames') || 1;
                    if (req_frames>1 && req_frames*frames <= 1/scale)
                        scale = 1 / self.min_frame_width / req_frames;
                    if (req_frames<=1 && 1/scale > self.min_hoursec_width)
                        scale = 1 / self.min_hoursec_width;
                }
                else{
                    let new_scale = (scale*1.5);
                    if (self.min_year_width <= 60*60*24*365*1000 / new_scale)
                        scale = new_scale;
                }
                if (!isNaN(parseInt(self.getAttribute('maxscale'))) && scale>parseInt(self.getAttribute('maxscale')))
                    scale = parseInt(self.getAttribute('maxscale'));
                if (!isNaN(parseInt(self.getAttribute('minscale'))) && scale<parseInt(self.getAttribute('minscale')))
                    scale = parseInt(self.getAttribute('minscale'));
                self.loc_change=true;
                self.setAttribute('scale',scale>1?scale:1);
                self.loc_change=undefined;
            } else {
                let new_time = parseInt(self.getAttribute('centerutctime')||0) + this.one_shift_time*e.wheelDelta/120;
                new_time = self.adjustTime(new_time);
                self.loc_change=true;
                self.setAttribute('centerutctime',new_time);
                self.loc_change=undefined;
            }
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        let handleMouseUp = function(event){
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousemove', handleMouseMove);
            delete self.down_mouse_posx;
            delete self.down_mouse_time;
            setTimeout(function(){self.dispatchEvent(self.event_moved);},0);
        };
        let handleMouseMove = function(event){
            let scale = parseFloat(self.getAttribute('scale')||100);
            let pixel_shift = event.pageX - self.down_mouse_posx;
            let new_time = parseInt(self.down_mouse_time - pixel_shift*scale);
            new_time = self.adjustTime(new_time);
            self.loc_change=true;
            self.setAttribute('centerutctime',new_time);
            self.loc_change=undefined;
        };
        this.addEventListener('mousedown', function(event){
            if (self.getAttribute('disabled')!==null) return;
            self.down_mouse_posx = event.pageX;
            self.down_mouse_time = parseInt(self.getAttribute('centerutctime'));
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('mousemove', handleMouseMove);
            setTimeout(function(){self.dispatchEvent(self.event_moving);},0);
            return event.preventDefault ? event.preventDefault() : event.returnValue = false;
        })
        window.addEventListener("resize", function() {
            self.update();
        }, false);

        this.recalcWidths();

        this.style.display="block";
        this.shadow = this.attachShadow({mode: 'open'});
        this.shadow.innerHTML = CTimeLinePicker.css;
//        $(this).css('position','relative').css('overflow','hidden');
        let databar = this.getAttribute('databar')!==null ? ' databar':'';
        this.shadow.innerHTML += '<div class="body"'+databar+'><div class="centerpos"></div><div class="wrap"><div class="twrap"><div class="range"></div><div class="databar"></div><table><tr><td>123</td></tr><tr></tr></table></div></div></div>';
        this.centerpos= this.shadow.querySelector('.centerpos');
        this.wrap= this.shadow.querySelector('.wrap');
        this.twrap= this.shadow.querySelector('.twrap');
        this.table = this.shadow.querySelector('table');
        this.databar = this.shadow.querySelector('.databar');;
        this.line1 = this.shadow.querySelector('table tr:first-child');
        this.line2 = this.shadow.querySelector('table tr:last-child');
        if (this.getAttribute('scale')===null || this.getAttribute('centerutctime')===null){
            this.loc_change=true;
            if (this.getAttribute('scale')===null)
                this.setAttribute('scale', this.default_scale); // 50 pixels per year
            if (this.getAttribute('centerutctime')===null)
                this.setAttribute('centerutctime', this.adjustTime(Date.now()));
            this.loc_change=false;
        }
        else
            this.attributeChangedCallback();
    }
    disconnectedCallback(){
        delete this.event_moved;
        delete this.event_moving;
    }
    attributeChangedCallback(name, oldValue, newValue) {
        let self = this;
        if (!this.table) {
            if (name=='scale')
                this.default_scale = parseInt(newValue);
            return;
        }
        if (name=='centerutctime'){
            let shift_time = parseInt(oldValue) - parseInt(newValue);
            let scale = parseInt(self.getAttribute('scale')||100);
            if (this.down_mouse_posx!==undefined)
                self.update(!self.loc_change);
            else
                if (shift_time!=0 && !isNaN(shift_time)){
                    clearTimeout(this.move_anivate_timer);
                    let lc = !!self.loc_change;
                    this.move_anivate_timer = setTimeout(function(){
                        self.moveAnimate(parseInt(shift_time / scale),!lc);
                    },0);
                }
                else this.update(!this.loc_change);
            return;
        }
        if (name=='scale'){
            this.scaleAnimate(parseFloat(oldValue),!self.loc_change);
            return;
        }
        this.update(!self.loc_change);
    }
    scaleAnimate(oldscale, from_out){
        let self = this;

        if (this.scale_timer) return;
        this.scale_timer = setTimeout(function(){
            let scale = parseFloat(self.getAttribute('scale')||100);
            scale = oldscale/scale;

            self.table.style.transform='scaleX(1)';
            let animate = self.table.parentElement.parentElement.animate([{ transform: 'scaleX('+(scale || 1)+')' }], 100);
            animate.onfinish = function() {
                self.table.parentElement.parentElement.style.transform = 'scaleX(1)';
                self.update(from_out);
                delete self.scale_timer;
            }
        },0);
    }
    moveAnimate(animate_move_pixels, from_out){
        let self = this;
        if (this.animate_move_pixels===undefined) this.animate_move_pixels=0;
        this.animate_move_pixels = this.animate_move_pixels + animate_move_pixels;

        if (this.animater) {this.animater.commitStyles();this.animater.cancel();}
        this.animater = this.twrap.animate([{ left: this.animate_move_pixels+'px' }], 100);
        this.animater.onfinish = function() {
            self.animater = undefined;
            self.animate_move_pixels=0;
            self.twrap.style.left = 0;
            self.update(from_out);
        };
    }
    divider(val,arr){
        for (let i=0; i<arr.length; i++)
            if (val>arr[i]) return arr[i];
        return val;
    }
    static get RANGES(){
        return;
    }
    update(from_out){
        let self = this;
        if (!this.table) return;
        let screen_width = this.getBoundingClientRect().width;
        if (!screen_width && this.last_screen_width>0) screen_width = this.last_screen_width;
        if (!screen_width) return;
        this.last_screen_width = screen_width;
        if (!this.min_year_width) this.recalcWidths();
        if (!this.min_year_width) return;
//        if (this.update_timer) clearTimeout(this.update_timer);
//        if (!screen_width) {this.update_timer = setTimeout(function(){delete self.update_timer;self.update();},500);return;}

        const scale = parseFloat(this.getAttribute('scale')||0);
        const MAX_PIXELS_PER_YEAR = parseInt(60*60*24*365*1000 / scale);
        const MAX_PIXELS_PER_MONTH = parseInt(60*60*24*31*1000 / scale);
        const PIXELS_PER_DAY = 60*60*24*1000 / scale;
        const PIXELS_PER_HOUR = 60*60*1000 / scale;
        const PIXELS_PER_MINUTE = 60*1000 / scale;
        const PIXELS_PER_SECOND = 1000 / scale;

        const MONTHS_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
//            let MONTHS_NAMES = ['January','February','March','April','May','June','Jule','August','September','October','November','December'];

        this.one_shift_time = 1000;

        // Seconds per pixel
        let centerutctime = parseInt(this.getAttribute('centerutctime') || Date.now());
        if (centerutctime===undefined || scale===undefined) return;

        let left_time = parseInt(centerutctime - scale*screen_width*1.5);
        let right_time = parseInt(centerutctime + scale*screen_width*1.5);

        let left_date = new Date(left_time+this.getTimeOffset());
        let right_date = new Date(right_time+this.getTimeOffset());

        // as "only years" mode
        let only_years_mode = this.min_months_width >= MAX_PIXELS_PER_MONTH;
        let seconds_frame_mode = this.min_sec_frame_width < PIXELS_PER_SECOND;
        let day_seconds_mode = seconds_frame_mode ? false : this.min_hoursec_width < PIXELS_PER_HOUR/2;
        let day_hour_mode = seconds_frame_mode||day_seconds_mode ? false : this.min_day_hour_width <= PIXELS_PER_DAY;
        let months_day_mode = seconds_frame_mode||day_hour_mode||day_seconds_mode ? false : this.min_year_month_width < MAX_PIXELS_PER_MONTH;
        let year_months_mode = seconds_frame_mode||months_day_mode||day_hour_mode||day_seconds_mode ? false : (this.min_months_width < MAX_PIXELS_PER_MONTH);

        let left_day_time = this.roundDayDown(left_time);
        let right_day_time = this.roundDayUp(right_time);

        let line1 = '', line2='';
        this.ranges = [];
        if (only_years_mode || year_months_mode){
            let prev_pos = 0, sum_milli_seconds=0;
            let i = new Date(left_date);
            do{
                sum_milli_seconds+=this.getYearSeconds(i.getFullYear());
                let next_pos = sum_milli_seconds/scale;
                let ys = Math.round(next_pos - prev_pos);

                let text = i.getFullYear();
                if (screen_width/2 < 365*24*60*60*1000 / scale){
                    let g = Math.ceil(365*24*60*60*1000 / scale / screen_width)+1;
                    let text2=text;text='';
                    for (let ii=0;ii<g;ii++)
                        text += '<div>'+text2+'</div>';
                }

                line1 += '<td style="min-width:'+ys+'px;max-width:'+ys+'px"'+(only_years_mode?' rowspan=2':'')+(year_months_mode?' colspan=12':'')+'><div>'+text+'</div></td>';
                this.ranges.push([i.getTime(),ys]);
                prev_pos += ys;
            } while (i<right_date && i.setFullYear(i.getFullYear()+1));
            let left_day = new Date(left_date.getFullYear(),0,1,0,0,0);
            this.table_left_time = left_day.getTime();
            this.one_shift_time = 60*60*24*365*1000;
        }

        if (year_months_mode){
            this.ranges = [];
            let prev_pos=0,month_seconds_sum=0;
            let i = new Date(left_date.getFullYear(), 0,1,0,0,0);
            this.table_left_time = i.getTime() - this.getTimeOffset();;
            let e = new Date(right_date.getFullYear()+1, 0,1,0,0,0);
            do{
                month_seconds_sum += this.getMonthSeconds(i.getFullYear(),i.getMonth());
                let next_pos = month_seconds_sum/scale;
                let ms = Math.round(next_pos - prev_pos);
                line2 += '<td style="min-width:'+ms+'px;max-width:'+ms+'px";"><div>'+MONTHS_NAMES[i.getMonth()]+'</div></td>';
                this.ranges.push([i.getTime(),ms]);
                prev_pos += ms;
            } while (i<e && i.setMonth(i.getMonth()+1));
            this.one_shift_time = 60*60*24*30*1000;
        }

        if (months_day_mode){
            let prev_pos=0,msilliseconds_sum=0;
            let i = new Date(left_date.getFullYear(), left_date.getMonth(),1,0,0,0);
            this.table_left_time = i.getTime()-this.getTimeOffset();
            let e = new Date(right_date.getFullYear(), right_date.getMonth()+1,1,0,0,0);
            do{
                let dim = this.getDaysInMonth(i.getFullYear(),i.getMonth());
                let month_divider = this.divider(MAX_PIXELS_PER_MONTH / this.min_day_width, [dim,10,6,4,3,2,1]);
                let text = MONTHS_NAMES[i.getMonth()]+' '+i.getFullYear();
                if (screen_width/2 - this.min_day_hour_width < MAX_PIXELS_PER_MONTH){
                    let g = Math.ceil(MAX_PIXELS_PER_MONTH / screen_width)+1;
                    let text2=text;text='';
                    for (let ii=0;ii<g;ii++)
                        text += '<div>'+text2+'</div>';
                }
                line1 += '<td colspan='+month_divider+'><div>'+text+'</div></td>';
                let d = new Date(i); let de = new Date(d.getFullYear(),d.getMonth()+1,1,0,0,0);
                let divs_count=month_divider;
                do{
                    divs_count--;
                    let next_pos = (d.getTime() - this.getTimeOffset() - this.table_left_time + parseInt(dim/month_divider)*24*60*60*1000 )/scale;
                    if (!divs_count)
                        next_pos = (i.getTime() - this.getTimeOffset() + dim*24*60*60*1000 - this.table_left_time)/scale;
                    let dw = Math.round(next_pos - prev_pos);
                    let style = ' style="width:'+dw+'px;min-width:'+dw+'px;max-width:'+dw+'px;"';
                    line2 += '<td'+style+'><div>'+d.getDate()+'</div></td>';
                    this.ranges.push([d.getTime(),dw]);
                    prev_pos += dw;
                    if (!divs_count) break;
                    d.setDate(d.getDate()+parseInt(dim/month_divider));
                } while (d<de);
                i.setMonth(i.getMonth()+1);
            } while (i<e);
            this.one_shift_time = 60*60*24*1000;
        }

        if (day_hour_mode){
            let day_divider = this.divider(PIXELS_PER_DAY / this.min_hour_width, [24,12,8,6,4,3,2,1]);
            let prev_pos=0;
            let i = new Date(left_date);
            do{
                let text = (i.getDate())+' '+MONTHS_NAMES[i.getMonth()]+' '+i.getFullYear();

                if (screen_width/2 < 24*60*60*1000 / scale){
                    let g = Math.ceil(24*60*60*1000 / scale / screen_width)+1;
                    let text2=text;text='';
                    for (let ii=0;ii<g;ii++)
                        text += '<div>'+text2+'</div>';
                }

                line1 += '<td colspan='+day_divider+'><div>'+text+'</div></td>';
                for (let hour = 0; hour<24; hour+= 24 / day_divider){
                    let next_pos = (i.getTime() - left_date.getTime()+(hour+24 / day_divider)*60*60*1000)/scale;
                    let full_width = Math.round(next_pos - prev_pos);
                    line2 += '<td style="width:'+full_width+'px;min-width:'+full_width+'px;max-width:'+full_width+'px;">&nbsp;<div>'+hour+':00</div></td>';
                    this.ranges.push([i.getTime() + hour*60*60*1000,full_width]);
                    prev_pos += full_width;
                }
            } while (i<right_date && i.setDate(i.getDate()+1));
            let left_day = new Date(left_date.getFullYear(),left_date.getMonth(),left_date.getDate(),0,0,0);
            this.table_left_time = left_day.getTime() - this.getTimeOffset();;
            this.one_shift_time = parseInt(60*60*24*1000/day_divider);
        }

        if (day_seconds_mode){

            let day_width = 60*60*24*1000 / scale;
            let hour_divider = this.divider(day_width / this.min_hoursec_width / 24,[60*60,60*30,60*12,60*10,60*6,60*4,60*3,60*2,60,30,20,15,12,10,6,5,4,3,2,1]);

            let left_sec_time = parseInt(left_time / (60*60*1000/hour_divider)) * (60*60*1000/hour_divider);
            let r = parseInt(right_time / (60*60*1000/hour_divider)) * (60*60*1000/hour_divider) + 60*60*1000/hour_divider;
            let right_sec_time = r == right_time + 60*60*1000/hour_divider ?  right_time : r;

            let border_mode = (new Date(left_sec_time+this.getTimeOffset())).getDate() != (new Date(right_sec_time+this.getTimeOffset())).getDate();
            let seconds_before_border = left_day_time + 60*60*24*1000 - left_sec_time;
            let full_width = parseInt((right_sec_time - left_sec_time) / scale);
            let cols_count = parseInt((right_sec_time - left_sec_time) / (60*60*1000/hour_divider));
            let cols_count_before = parseInt(seconds_before_border / (60*60*1000/hour_divider));
            let col_width = 60*60*1000/hour_divider / scale;

            let ldate = new Date(left_sec_time+this.getTimeOffset());
            let rdate = new Date(right_sec_time+this.getTimeOffset());
            let style = '';
            let style_first = 'text-align:right;';
            let t = parseInt((right_sec_time - left_sec_time - seconds_before_border)/scale);
            let style_last = 'text-align:left;';

            let text='',text2 = ldate.getDate()+' '+MONTHS_NAMES[ldate.getMonth()]+' '+ldate.getFullYear();
            for (let ii=0;ii<3;ii++) text += '<div>'+text2+'</div>';
            let text4='',text3 = rdate.getDate()+' '+MONTHS_NAMES[rdate.getMonth()]+' '+rdate.getFullYear();
            for (let ii=0;ii<3;ii++) text4+= '<div>'+text3+'</div>';

            if (!border_mode)
                line1 = '<td colspan='+cols_count+' style="'+style+'"><div style="text-align:center;">'+text+'</div></td>';
            else
                line1 = '<td colspan='+cols_count_before+' style="'+style_first+'"><div>'+text+'</div></td>'+
                '<td colspan='+(cols_count-cols_count_before)+' style="'+style_last+'"><div>'+text4+'</div></td>';
            let has_seconds = false;
            let prev_pos=0;
            for (let utc = left_sec_time; utc < right_sec_time; utc += 60*60*1000/hour_divider){
                let next_pos = ((utc - left_sec_time + 60*60*1000/hour_divider)/(60*60*1000)) * PIXELS_PER_HOUR;
                let hw = Math.round(next_pos - prev_pos);
                let d = new Date(utc); d = new Date(utc+this.getTimeOffset());
                if (!has_seconds) has_seconds = d.getSeconds()>0;
                let datetext = d.getHours();
                if (col_width > this.min_hour_width) datetext += ':'+(d.getMinutes()<10?'0':'')+d.getMinutes();
                if (has_seconds) datetext += '<sup>:'+(d.getSeconds()<10?'0':'')+d.getSeconds()+'</sup>';
                line2 += '<td style="width:'+hw+'px;min-width:'+hw+'px;max-width:'+hw+'px;">&nbsp;<div>'+datetext+'</div></td>';
                this.ranges.push([utc,hw]);
                prev_pos += hw;
            }
            this.table_left_time = left_sec_time;

            this.one_shift_time = parseInt(60*60*1000/hour_divider);
        }
    
        if (seconds_frame_mode){
            let req_frames = parseInt(this.getAttribute('frames') || 1);
            let max_frames = parseInt(PIXELS_PER_SECOND / this.min_frame_width);
            let frame_divider;
            for (frame_divider = max_frames; frame_divider>1; frame_divider--)
                if (!(req_frames % frame_divider)) break;
            let prev_pos=0;
            let left_seconds = new Date(left_date.getFullYear(), left_date.getMonth(), left_date.getDate(), left_date.getHours(), left_date.getMinutes(), left_date.getSeconds());
            let right_seconds = new Date(right_date.getFullYear(), right_date.getMonth(), right_date.getDate(), right_date.getHours(), right_date.getMinutes(), right_date.getSeconds());
            let i = new Date(left_seconds);
            do{
                let text = i.toLocaleTimeString() + ', ' + i.getDate()+' '+MONTHS_NAMES[i.getMonth()]+' '+i.getFullYear();
                if (screen_width < 1000 / scale){
                    let g = Math.ceil(1000 / scale / screen_width);
                    let text2=text;text='';
                    for (let ii=0;ii<g;ii++)
                        text += '<div>'+text2+'</div>';
                }
                line1 += '<td colspan='+frame_divider+'><div>'+text+'</div></td>';
                for (let frame = 0; frame < req_frames; frame += req_frames / frame_divider){
                    let next_pos = PIXELS_PER_SECOND*((i.getTime()-left_seconds.getTime())/1000 + 1/frame_divider+frame/req_frames);
                    let ws = Math.round(next_pos - prev_pos);
                    line2 += '<td style="width:'+ws+'px;min-width:'+ws+'px;max-width:'+ws+'px;">&nbsp;<div>'+frame+'</div></td>';
                    this.ranges.push([i.getTime() + 1000 / req_frames * frame,ws]);
                    prev_pos += ws;
                }
            } while (i<right_seconds && i.setSeconds(i.getSeconds()+1));
            this.table_left_time = left_seconds.getTime() - this.getTimeOffset();
            this.one_shift_time = parseInt(1000/frame_divider);
        }
        this.setAttribute('step',this.one_shift_time);

        this.line1.innerHTML = line1;
        this.line2.innerHTML = line2;

        let wrap_shift_left = Math.floor(-screen_width/2);
        this.wrap.style.left = ''+wrap_shift_left+'px';
        let twrap_shift_left = - wrap_shift_left - Math.round((centerutctime - this.table_left_time)/scale - parseInt(screen_width/2));
        this.twrap.style.marginLeft = ''+twrap_shift_left+'px';
        this.centerpos.style.left = Math.round(screen_width/2-20.5)+'px';
        this.summary_shift = wrap_shift_left + twrap_shift_left;

        while (this.getAttribute('databar')!==null){
            this.event_getrange.time_from = parseInt(centerutctime - scale*screen_width/2);
            this.event_getrange.time_to = parseInt(centerutctime + scale*screen_width/2)
            this.dispatchEvent(this.event_getrange);
            let ranges = this.event_getrange.ranges;
//            let ranges = this.ongetranges(parseInt(centerutctime - scale*screen_width/2), parseInt(centerutctime + scale*screen_width/2));
            this.databar.innerHTML = '';
            if (!ranges || ranges.length<2) {
                this.databar.innerHTML = '';
                break;
            }
            let start, end;
            for (let i=0; i<ranges.times.length; i++){
                if (ranges.times[i]<this.table_left_time) start=i;
                if (Math.abs(ranges.durations[i]) >= right_time && end===undefined) {end=i+1;break;}
            }
            if (start===undefined) start=0;
            if (end===undefined) end=ranges.times.length;
            let timeline_html='';

            let prev_pos=0;
            for (let i=start; i<end; i++){
                let st = parseInt((ranges.times[i] - this.table_left_time)/scale);
                if (st<0) st=0;
                let et = parseInt((ranges.times[i] + Math.abs(ranges.durations[i]) - this.table_left_time)/scale);
                let w = et - st;
                let n = st - prev_pos;
                if (w<0){
                    n+=w;
                    w=0;
                }
                timeline_html += '<div '+(ranges.durations[i]<0?'e ':'')+'style="width:'+w+'px; margin-left:'+n+'px;"></div>';
                prev_pos = et;
            }
            this.databar.innerHTML = timeline_html;
            break;
        }
        if (this.getAttribute('selectutctime')!==null){
            let selectutctime = parseInt(this.getAttribute('selectutctime'));
            let lt = centerutctime > selectutctime ? selectutctime : centerutctime;
            let mar_left = parseInt(this.getBoundingClientRect().width/2 - (centerutctime - lt)/scale) - wrap_shift_left - twrap_shift_left;
            let range_width = (centerutctime > selectutctime ? centerutctime - selectutctime : selectutctime - centerutctime)/scale;
            this.shadow.querySelector('.range').style.width = ''+range_width+'px';
            this.shadow.querySelector('.range').style.marginLeft = ''+mar_left+'px';
            this.shadow.querySelector('.range').style.display = 'block';
        } else
            this.shadow.querySelector('.range').style.display = 'none';
        if (!from_out){
            setTimeout(function(){
                self.event_change.time = self.getAttribute('centerutctime');
                self.dispatchEvent(self.event_change);
            },0);
        }
    }
    getTimeOffset(){
        let utc = this.getAttribute('utc');
        if (utc!==null) return (new Date().getTimezoneOffset())*60*1000+parseInt(utc)*60*60*1000;
        return 0;
    }

    roundDayDown(utctime){
        let d = new Date(utctime+this.getTimeOffset());
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime() - this.getTimeOffset();
    }
    roundDayUp(utctime){
        let d = new Date(utctime+this.getTimeOffset());
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()+1, 0, 0, 0).getTime() - this.getTimeOffset();
    }
    getYearSeconds(year) {
        let utc1 = Date.UTC(year, 0, 1, 0, 0, 0);
        let utc2 = Date.UTC(year+1, 0, 1, 0, 0, 0);
        return parseInt((utc2 - utc1) );
    }
    getMonthSeconds(year, month) {
        let utc1 = Date.UTC(year, month, 1, 0, 0, 0);
        let utc2 = Date.UTC(year, month+1, 1, 0, 0, 0);
        return parseInt((utc2 - utc1) );
    }
    getDaysInMonth(year, month) {
        let utc1 = Date.UTC(year, month, 1, 0, 0, 0);
        let utc2 = Date.UTC(year, month+1, 1, 0, 0, 0);
        return parseInt((utc2 - utc1) / 1000 / 24/60/60);
    }
    textWidth(text, fontSize, fontFamily){
        let el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.float = "left";
        el.style.whiteSpace = 'nowrap';
        el.style.visibility = 'hidden';
        el.style.fontSize = fontSize ? fontSize : this.style.fontSize;
        el.style.fontFamily = fontFamily ? fontFamily : this.style.fontFamily;
        el.innerHTML = text;
        if (!document.body) return 0;
        el = document.body.appendChild(el);
        let w = el.offsetWidth;
        document.body.removeChild(el);
        return w;
    }
    getRanges() {
        return this.ranges!==undefined ? this.ranges : [];
    }
    getSummaryShift() {
        return this.summary_shift ? this.summary_shift : 0;
    }
    static get css() {
        return `<style>
table{border-spacing:0px;height:100%;min-height:3em;color:inherit;font-size:inherit;}
table tr td{padding:0;}
.body:not(:not([databar])) table tr:first-child td{padding-bottom:3px;}
.body:not([databar]) .databar{display:none;}
.databar{text-align:left;height:5px;position:absolute;min-width:100%;display:block;top:1em;z-index:20;line-height:0px;white-space:nowrap;background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAAAXNSR0IB2cksfwAAAAZQTFRF////AAAAVcLTfgAAAAJ0Uk5TZmbh5cV0AAAADElEQVR4nGNwYGgAAAFEAME6ehxWAAAAAElFTkSuQmCC);}
table tr:first-child td{box-shadow:1px 0px 0px white;vertical-align:middle;height:1em;}
.body:not([databar]) table tr:first-child td{height:1.2em;}
table tr:first-child td:first-child > div{text-align:right;}
table tr:first-child td:last-child > div{text-align:left;}
table tr:first-child td > div{padding:0px 3px;text-align:center;height:1.1em;overflow:hidden;white-space:nowrap;display:flex;flex-direction:row;align-content:space-between;justify-content:space-between;}
table tr:last-child td > div{height:1.2em;word-break:break-all;overflow:hidden;width:100%;position:absolute;text-align:center;top:4px;left:-50%;}
table tr:last-child td{height:min-content;text-align:left;vertical-align:middle;position:relative;}
table tr:last-child td.year{border-left:1px solid gray;border-top:2px solid gray;}
.body:not([databar]) table tr:last-child td:not(.year){border-top:2px solid gray;}
table tr:last-child td:not(.year):before{margin-left:0px;content:'';width:0px;height:5px;border-left:1px solid;position:absolute;top:0;border-left-color:inherit;}
table tr:last-child td.odd{background-color:#80808040;}
table td sup{vertical-align:baseline;}
.centerpos{width:41px;background:none;background:linear-gradient(90deg, #0000, #0000 40%,#0000 45%, #f88f 49%,#0000 50%, #f88f 51%, #0000 55%, #0000 60%, #0000);height:100%;position:absolute;left:calc(50% - 20.5px);top:0;z-index:10;}
.centerpos div{margin:0 auto;width:1px;height:100%;background:red;}
*{-moz-user-select:none;-webkit-user-select:none;-ms-user-select:none;user-select:none;}
.body{position:relative;overflow:hidden;width:100%;height:100%;}
.wrap{position:absolute;left:-50%;height:100%;right:-50%;}
.twrap{position:absolute;height:100%;}
.databar > [e]{background-color:black;}
.databar > :not([e]){box-shadow:-1px 0 1px #00000080;}
.databar > div{height:5px;height:4px;background-color:white;margin-top:1px;display:inline-block;}
.databar > div.e{background-color:white;}
.range{height:40px;background-color:#f888;margin-top:1px;position:absolute;}
</style>`;
    }

}
window.customElements.define('k-timeline-picker', CTimeLinePicker);
class CKControl extends HTMLElement {
    getType(){
        return 'min';
    }
    static get observedAttributes() {
        return []; 
    }
    constructor() {
        super();
        let self = this;
    }
    connectedCallback() {
        let self = this;
        this.style.position='relative';
        this.style.width='100%';
        this.style.height='100%';
        this.style.display='block';
        this.shadow = this.attachShadow({mode: 'open'});
        this.shadow.innerHTML = '<style>'+this.css()+'</style>';
    }
    attributeChangedCallback(name, oldValue, newValue) {
    }
    setPlayer(player){
        this.player = player;
    }
    css() {
        return `
`;
    }
    setRedux(redux){
        this.redux = redux;
    }
}

window.customElements.define('k-control', CKControl);
class CKControlFullscreen extends CKControl {
    getType(){
        return 'min';
    }
    static get observedAttributes() {
        return []; 
    }
    customFullScreen(){
        if (this.player.classList.contains('fullscreen')){
            this.player.classList.remove('fullscreen');
            let p = document.getElementById('fullscreenstyle');
            if (p) p.remove();
            return;
        }
        if (document.getElementById('fullscreenstyle')===null)
            document.body.insertAdjacentHTML('beforeend','<div id="fullscreenstyle"><style>body{overflow:hidden!important;}body .fullscreen{position:fixed!important;left:0!important;right:0!important;top:0!important;bottom:0!important;z-index:2000000!important;width:100%!important;height:100%!important;}</style></div>')
        this.player.classList.add('fullscreen');
    }
    constructor() {
        super();
        let self = this;
    }
    connectedCallback() {
        super.connectedCallback();
        let self = this;
        this.shadow.innerHTML += '<div class="fsbtn"></div>';
        this.shadow.querySelector('.fsbtn').onclick = function(){
            self.customFullScreen();
        }
    }
    onPlay(){
    }
    onPause(){
    }
    attributeChangedCallback(name, oldValue, newValue) {
    }
    css() {
        return super.css()+`
.fsbtn{
height: 100%;
    width: 100%;
    background: url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGc+CjxwYXRoIGQ9Ik0xMjgsMzJWMEgxNkM3LjE2MywwLDAsNy4xNjMsMCwxNnYxMTJoMzJWNTQuNTZMMTgwLjY0LDIwMy4ybDIyLjU2LTIyLjU2TDU0LjU2LDMySDEyOHoiIGZpbGw9IiNmZmYiLz4KPHBhdGggZD0iTTQ5NiwwSDM4NHYzMmg3My40NEwzMDguOCwxODAuNjRsMjIuNTYsMjIuNTZMNDgwLDU0LjU2VjEyOGgzMlYxNkM1MTIsNy4xNjMsNTA0LjgzNywwLDQ5NiwweiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNDgwLDQ1Ny40NEwzMzEuMzYsMzA4LjhsLTIyLjU2LDIyLjU2TDQ1Ny40NCw0ODBIMzg0djMyaDExMmM4LjgzNywwLDE2LTcuMTYzLDE2LTE2VjM4NGgtMzJWNDU3LjQ0eiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNMTgwLjY0LDMwOC42NEwzMiw0NTcuNDRWMzg0SDB2MTEyYzAsOC44MzcsNy4xNjMsMTYsMTYsMTZoMTEydi0zMkg1NC41NkwyMDMuMiwzMzEuMzZMMTgwLjY0LDMwOC42NHoiIGZpbGw9IiNmZmYiLz4KPC9nPgo8L3N2Zz4K) no-repeat;
    background-size: 70%;
    background-position: center;
   transition-property: background-size;transition-duration: .1s;
}
.fsbtn:hover{
   transition-property: background-size;transition-duration: .1s;
   background-size: 80%;
cursor:pointer;
}
`;
    }
}

window.customElements.define('k-control-fullscreen', CKControlFullscreen);
class CKControlPlay extends CKControl {
    getType(){
        return 'min';
    }
    static get observedAttributes() {
        return []; 
    }
    constructor() {
        super();
        let self = this;
    }
    connectedCallback() {
        super.connectedCallback();
        let self = this;
        this.shadow.innerHTML += '<div class="playbtn disabled"></div>';
        this.shadow.querySelector('.playbtn').onclick = function(){
            if (!self.shadow.querySelector('.playbtn').classList.contains('pause'))
                self.player.play().catch(function(){});
            else
                self.player.pause().catch(function(){});
        }
        setTimeout(function(){
            self.player.player.addEventListener("statusupdate", function(event){
                if (event.status==='invalidtoken')
                    self.shadow.querySelector('.playbtn').classList.add('disabled');
                else if (event.status!=='loading')
                    self.shadow.querySelector('.playbtn').classList.remove('disabled');
            },{once:false});
        },0);
    }
    onPlay(){
        if (!this.shadow.querySelector('.playbtn').classList.contains('pause'))
            this.shadow.querySelector('.playbtn').classList.add('pause');
    }
    onPause(){
        if (this.shadow.querySelector('.playbtn').classList.contains('pause'))
            this.shadow.querySelector('.playbtn').classList.remove('pause');
    }
    attributeChangedCallback(name, oldValue, newValue) {
    }
    css() {
        return super.css()+`
.playbtn.disabled{pointer-events:none;}
.playbtn{
height: 100%;
    width: 100%;
    background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yMyAxMmwtMjIgMTJ2LTI0bDIyIDEyem0tMjEgMTAuMzE1bDE4LjkxMi0xMC4zMTUtMTguOTEyLTEwLjMxNXYyMC42M3oiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4=) no-repeat;
    background-size: 70%;
    background-position: center;
   transition-property: background-size;transition-duration: .1s;
}
.playbtn:hover{
   transition-property: background-size;transition-duration: .1s;
   background-size: 80%;
cursor:pointer;
}
.playbtn.pause{
    background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE4LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDMxNCAzMTQiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDMxNCAzMTQ7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxwYXRoIGQ9Ik05MS40NywwSDc1LjM0M0M1OC41MzgsMCw0NC44NjcsMTMuNjcxLDQ0Ljg2NywzMC40NzZ2MjUzLjA0OGMwLDE2LjgwNSwxMy42NzEsMzAuNDc3LDMwLjQ3NiwzMC40NzdIOTEuNDcNCgkJYzE2LjgwNSwwLDMwLjQ3Ny0xMy42NzIsMzAuNDc3LTMwLjQ3N1YzMC40NzZDMTIxLjk0NiwxMy42NzEsMTA4LjI3NCwwLDkxLjQ3LDB6IE0xMDcuOTQ2LDI4My41MjMNCgkJYzAsOS4wODUtNy4zOTIsMTYuNDc3LTE2LjQ3NywxNi40NzdINzUuMzQzYy05LjA4NSwwLTE2LjQ3Ni03LjM5Mi0xNi40NzYtMTYuNDc3VjMwLjQ3NkM1OC44NjcsMjEuMzkxLDY2LjI1OCwxNCw3NS4zNDMsMTRIOTEuNDcNCgkJYzkuMDg1LDAsMTYuNDc3LDcuMzkxLDE2LjQ3NywxNi40NzZWMjgzLjUyM3oiIGZpbGw9IiNmZmZmZmYiLz4NCgk8cGF0aCBkPSJNMjM4LjY1NywwSDIyMi41M2MtMTYuODA1LDAtMzAuNDc3LDEzLjY3MS0zMC40NzcsMzAuNDc2djI1My4wNDhjMCwxNi44MDUsMTMuNjcyLDMwLjQ3NywzMC40NzcsMzAuNDc3aDE2LjEyNw0KCQljMTYuODA1LDAsMzAuNDc2LTEzLjY3MiwzMC40NzYtMzAuNDc3VjMwLjQ3NkMyNjkuMTMzLDEzLjY3MSwyNTUuNDYyLDAsMjM4LjY1NywweiBNMjU1LjEzMywyODMuNTIzDQoJCWMwLDkuMDg1LTcuMzkxLDE2LjQ3Ny0xNi40NzYsMTYuNDc3SDIyMi41M2MtOS4wODUsMC0xNi40NzctNy4zOTItMTYuNDc3LTE2LjQ3N1YzMC40NzZjMC05LjA4NSw3LjM5Mi0xNi40NzYsMTYuNDc3LTE2LjQ3Ng0KCQloMTYuMTI3YzkuMDg1LDAsMTYuNDc2LDcuMzkxLDE2LjQ3NiwxNi40NzZWMjgzLjUyM3oiIGZpbGw9IiNmZmZmZmYiLz4NCjwvZz4NCjwvc3ZnPg0K);
}
`;
    }
}

window.customElements.define('k-control-play', CKControlPlay);
class CKControlSpeed extends CKControl {
    getType(){
        return 'top';
    }
    static get observedAttributes() {
        return []; 
    }
    constructor() {
        super();
        let self = this;
    }
    connectedCallback() {
        super.connectedCallback();
        let self = this;
        this.style.position='absolute';
        this.style.width='50px';
        this.style.height='100%';
        this.style.left='0';
        this.style.top='50%';
        this.style.maxHeight='200px';

        this.shadow.innerHTML += '<div class="body disabled"><div class="value">1x</div><input class="slider" orient="vertical" type="range" min="-16" max="16" step="1" value="1"><div class="info">SPEED</div></div>';
        this.slider = this.shadow.querySelector('.slider');
        this.speedval = this.shadow.querySelector('.value');
        this.slider.addEventListener("input", function(event){
            self.speedval.innerHTML = self.slider.value+'x';
            self.player.playbackRate = parseInt(self.slider.value);
            event.preventDefault();
            event.stopPropagation();
            return false;
        });
        this.slider.addEventListener("click", function(event){
            event.preventDefault();
            event.stopPropagation();
            return false;
        });
        setTimeout(function(){
            if (self.player.getAttribute('noreverse')!==null)
                self.slider.setAttribute('min',0);
        },0)
        setTimeout(function(){
            self.player.player.addEventListener("statusupdate", function(event){
                clearTimeout(self.enable_timeout);
                if (event.status==='invalidtoken')
                    self.shadow.querySelector('.body').classList.add('disabled');
                else if (event.status!=='loading')
                    self.enable_timeout = setTimeout(function(){
                        self.shadow.querySelector('.body').classList.remove('disabled');
                    },300);
            },{once:false});
        },0);
    }
    attributeChangedCallback(name, oldValue, newValue) {
    }
    css() {
        return super.css()+`
.body.disabled{display:none;}
.body{
    width: 100%;
    height: 100%;
    position: absolute;
    top: -50%;
background:#0004;
padding:10px 0;
}
.value{height:20px;color:white;text-align:center;}
input[type="range"]{
-webkit-appearance: slider-vertical;
width: 50px;
height: calc(100% - 40px);
margin: 0;
}
.info{
color:white;
font-size:55%;
text-align:center;
}
`;
    }
}

window.customElements.define('k-control-speed', CKControlSpeed);
class CKControlTimeinfo extends CKControl {
    getType(){
        return 'double';
    }
    static get observedAttributes() {
        return []; 
    }
    constructor() {
        super();
        let self = this;
    }
    connectedCallback() {
        super.connectedCallback();
        let self = this;
        this.shadow.innerHTML += '<div class="timearea">2021-06-23<br>18:58:15</div>';
        this.timearea = this.shadow.querySelector('.timearea');
        setTimeout(function(){
            self.player.addEventListener("timeupdate", function(){
                let utc = parseInt(self.player.getAttribute('utc'));
                utc = !isNaN(utc) ? utc : -(new Date()).getTimezoneOffset()/60;
                let time = new Date(self.player.currentUtcTime);
//if (time<100000) debugger;
                time.setHours(time.getHours()+utc);
                self.timearea.innerHTML = (time).toISOString().substr(0,19).replace('T','<br>');
            },{once:false});
            if (self.player.getAttribute('utc')===null)
                self.removeAttribute('utc');
            else
                self.setAttribute('utc',self.player.getAttribute('utc'));
        },0);

    }
    attributeChangedCallback(name, oldValue, newValue) {
    }
    css() {
        return super.css()+`
.timearea{
height: calc(100% - 4px);
    width: 100%;
    white-space: nowrap;
    padding: 4px 0px 0 0px;
    line-height: 16px;
    text-align: center;
    color: white;
    font-size: 14px;
}
`;
    }
}

window.customElements.define('k-control-timeinfo', CKControlTimeinfo);
class CKControlTimepicker extends CKControl {
    getType(){
        return 'full';
    }
    static get observedAttributes() {
        return []; 
    }
    constructor() {
        super();
        let self = this;
    }
    setRedux(redux){
        let self = this;
        super.setRedux(redux);
        redux.subscribe('min_time',function(event){
/*
            if (!isNaN(parseInt(event.event_param.value)))
                self.picker.setAttribute('mintime',parseInt(event.event_param.value));
            else
                self.picker.removeAttribute('mintime');
*/
        });
        redux.subscribe('time_line_update',function(event){
            self.range = {times:event.event_param.times,durations:event.event_param.durations};
            self.picker.update(true);
        });

    }
    connectedCallback() {
        super.connectedCallback();
        let self = this;
        setTimeout(function(){
            let tls = self.player.getAttribute('timelineselector');
            let el = tls? document.querySelector(tls) : null;
            if (el){
                el.innerHTML = '<k-timeline-picker databar frames="25" scale="600" maxscale="1330000" minscale="12" maxtime="+600000"></k-timeline-picker>';
                self.picker = el.querySelector('k-timeline-picker');
            } else {
                self.shadow.innerHTML += '<k-timeline-picker databar frames="25" scale="600" maxscale="1330000" minscale="12" maxtime="+600000"></k-timeline-picker>';
                self.picker = self.shadow.querySelector('k-timeline-picker');
            }

            if (self.player.player.options.maxscale) self.picker.setAttribute('maxscale',self.player.player.options.maxscale);
            if (self.player.player.options.minscale) self.picker.setAttribute('minscale',self.player.player.options.minscale);
            self.picker.addEventListener("moving", function(e){
                self.early_playing = self.player.isPlaying();
                self.player.pause().catch(function(){});
            },{once:false});
//            self.picker.addEventListener("moved", function(e){
//                if (self.early_playing)
//                    self.player.play().catch(function(){});
//            },{once:false});
            self.player.addEventListener("timeupdate", function(e){
                if (self.skip_next_timeupdate){
                    delete self.skip_next_timeupdate;
                    return;
                }
//                if (!self.player.isPlaying()) return;
                let time = self.player.currentUtcTime;
                self.picker.setAttribute('centerutctime',time);
            },{once:false});
            self.picker.addEventListener("change", function(e){
                clearTimeout(self.change_time_timer);
                self.change_time_timer = setTimeout(function(){
                    let time = parseInt(self.picker.getAttribute('centerutctime'));
                    self.player.pause();
                    self.player.currentUtcTime = time;
                    self.skip_next_timeupdate=true;
                    self.player.sendTimeUpdate();

                    let step = parseInt(self.picker.getAttribute('step'));
                    if (!isNaN(step))
                        self.player.player.posters.autoPreload(time, step);
                },10);
            },{once:false});
/*
            self.player.player.addEventListener("rangeupdate", function(e){
                self.range = {times:e.times,durations:e.durations};
                self.picker.update(true);
            },{once:false});
*/
            self.picker.addEventListener("getrange", function(e){
                self.player.player.rangeRequest(e.time_from, e.time_to);
                e.ranges = self.range!==undefined ? self.range : {times:[],durations:[]};
            });
/*
            self.picker.ongetranges = function(from, to, interval){
                self.player.player.rangeRequest(from, to);
                return self.range!==undefined ? self.range : {times:[],durations:[]};
            };
*/
            if (self.player.getAttribute('utc')===null)
                self.picker.removeAttribute('utc');
            else
                self.picker.setAttribute('utc',self.player.getAttribute('utc'));
        },0);
    }
    attributeChangedCallback(name, oldValue, newValue) {
    }
    css() {
        return super.css()+`
k-timeline-picker{
height: 100%;
    width: 100%;
display:block;
color:white;
    background: #00000080;
}
`;
    }
}

window.customElements.define('k-control-timepicker', CKControlTimepicker);
class CKControlVolume extends CKControl {
    getType(){
        return 'top';
    }
    static get observedAttributes() {
        return []; 
    }
    constructor() {
        super();
        let self = this;
    }
    connectedCallback() {
        super.connectedCallback();
        let self = this;
        this.style.position='absolute';
        this.style.width='50px';
        this.style.height='100%';
        this.style.right='0';
        this.style.top='50%';
        this.style.maxHeight='200px';

        this.shadow.innerHTML += '<div class="body disabled"><div class="value">0.0</div><input class="slider" orient="vertical" type="range" min="0" max="1" step=".1" value="0"><div class="info">VOLUME</div></div>';
        this.slider = this.shadow.querySelector('.slider');
        this.volume = this.shadow.querySelector('.value');
        this.slider.addEventListener("input", function(event){
            self.volume.innerHTML = parseFloat(self.slider.value).toFixed(1);
            self.player.volume = parseFloat(self.slider.value).toFixed(1);
            event.preventDefault();
            event.stopPropagation();
            return false;
        });
        this.slider.addEventListener("click", function(event){
            event.preventDefault();
            event.stopPropagation();
            return false;
        });
        setTimeout(function(){
            self.slider.value = self.player.volume.toFixed(1);
            self.volume.innerHTML = parseFloat(self.slider.value).toFixed(1);
        },0)
        setTimeout(function(){
            self.player.player.addEventListener("statusupdate", function(event){
                clearTimeout(self.enable_timeout);
                if (event.status==='invalidtoken')
                    self.shadow.querySelector('.body').classList.add('disabled');
                else if (event.status!=='loading')
                    self.enable_timeout = setTimeout(function(){
                        self.shadow.querySelector('.body').classList.remove('disabled');
                    },300);
            },{once:false});
        },0);
    }
    attributeChangedCallback(name, oldValue, newValue) {
    }
    css() {
        return super.css()+`
.body.disabled{display:none;}
.body{
    width: 100%;
    height: 100%;
    position: absolute;
    top: -50%;
background:#0004;
padding:10px 0;
}
.value{height:20px;color:white;text-align:center;}
input[type="range"]{
-webkit-appearance: slider-vertical;
width: 50px;
height: calc(100% - 40px);
margin: 0;
}
.info{
color:white;
font-size:55%;
text-align:center;
}
`;
    }
}

window.customElements.define('k-control-volume', CKControlVolume);
class CustomVideoElement extends HTMLElement {
  constructor() {
    super();
    let shadow = this.attachShadow({mode:'open'});
    shadow.innerHTML = '<style>:host{all:initial;display:inline-block;box-sizing:border-box;position:relative;width:300px;height:150px;}video{position:absolute;width:100%;height:100%;}</style><video crossorigin></video>';

    const nativeEl = this.nativeEl = this.shadowRoot.querySelector('video');

    // Initialize all the attribute properties
    Array.prototype.forEach.call(this.attributes, attrNode => {
      this.attributeChangedCallback(attrNode.name, null, attrNode.value);
    });

    // Neither Chrome or Firefox support setting the muted attribute
    // after using document.createElement.
    // One way to get around this would be to build the native tag as a string.
    // But just fixing it manually for now.
    // Apparently this may also be an issue with <input checked> for buttons
    if (nativeEl.defaultMuted) {
      nativeEl.muted = true;
    }

    this.shadowRoot.appendChild(nativeEl);

    this.querySelectorAll(':scope > track').forEach((track)=>{
      this.nativeEl.appendChild(track.cloneNode());
    });

    // Watch for child adds/removes and update the native element if necessary
    const mutationCallback = (mutationsList, observer) => {
      for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {

          // Child being removed
          mutation.removedNodes.forEach(node => {
            this.nativeEl.removeChild(this.nativeEl.querySelector(`track[src="${node.src}"]`));
          });

          mutation.addedNodes.forEach(node => {
            this.nativeEl.appendChild(node.cloneNode());
          });
        }
      }
    };

    const observer = new MutationObserver(mutationCallback);
    observer.observe(this, { childList: true, subtree: true });
  }

  // observedAttributes is required to trigger attributeChangedCallback
  // for any attributes on the custom element.
  // Attributes need to be the lowercase word, e.g. crossorigin, not crossOrigin
  static get observedAttributes() {
    let attrs = [];

    // Instead of manually creating a list of all observed attributes,
    // observe any getter/setter prop name (lowercased)
    Object.getOwnPropertyNames(this.prototype).forEach(propName => {
      let isFunc = false;

      // Non-func properties throw errors because it's not an instance
      try {
        if (typeof this.prototype[propName] === 'function') {
          isFunc = true;
        }
      } catch (e) {}

      // Exclude functions and constants
      if (!isFunc && propName !== propName.toUpperCase()) {
        attrs.push(propName.toLowerCase());
      }
    });

    // Include any attributes from the super class (recursive)
    const supAttrs = Object.getPrototypeOf(this).observedAttributes;

    if (supAttrs) {
      attrs = attrs.concat(supAttrs);
    }

    return attrs;
  }

  // We need to handle sub-class custom attributes differently from
  // attrs meant to be passed to the internal native el.
  attributeChangedCallback(attrName, oldValue, newValue) {
    // Find the matching prop for custom attributes
    const ownProps = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
    const propName = arrayFindAnyCase(ownProps, attrName);

    // Check if this is the original custom native elemnt or a subclass
    const isBaseElement =
      Object.getPrototypeOf(this.constructor)
        .toString()
        .indexOf('function HTMLElement') === 0;

    // If this is a subclass custom attribute we want to set the
    // matching property on the subclass
    if (propName && !isBaseElement) {
      // Boolean props should never start as null
      if (typeof this[propName] == 'boolean') {
        // null is returned when attributes are removed i.e. boolean attrs
        if (newValue === null) {
          this[propName] = false;
        } else {
          // The new value might be an empty string, which is still true
          // for boolean attributes
          this[propName] = true;
        }
      } else {
        this[propName] = newValue;
      }
    } else {
      // When this is the original Custom Element, or the subclass doesn't
      // have a matching prop, pass it through.
      if (newValue === null) {
        this.nativeEl.removeAttribute(attrName);
      } else {
        // Ignore a few that don't need to be passed through just in case
        // it creates unexpected behavior.
        if (['id', 'class'].indexOf(attrName) === -1) {
          this.nativeEl.setAttribute(attrName, newValue);
        }
      }
    }
  }
  connectedCallback() {
  }
}

// Map all native element properties to the custom element
// so that they're applied to the native element.
// Skipping HTMLElement because of things like "attachShadow"
// causing issues. Most of those props still need to apply to
// the custom element.
// But includign EventTarget props because most events emit from
// the native element.
let nativeElProps = [];

// Can't check typeof directly on element prototypes without
// throwing Illegal Invocation errors, so creating an element
// to check on instead.
const nativeElTest = document.createElement('video');

// Deprecated props throw warnings if used, so exclude them
const deprecatedProps = [
  'webkitDisplayingFullscreen',
  'webkitSupportsFullscreen',
];

// Walk the prototype chain up to HTMLElement.
// This will grab all super class props in between.
// i.e. VideoElement and MediaElement
for (
  let proto = Object.getPrototypeOf(nativeElTest);
  proto && proto !== HTMLElement.prototype;
  proto = Object.getPrototypeOf(proto)
) {
  Object.keys(proto).forEach(key => {
    if (deprecatedProps.indexOf(key) === -1) {
      nativeElProps.push(key);
    }
  });
}

// For the video element we also want to pass through all event listeners
// because all the important events happen there.
nativeElProps = nativeElProps.concat(Object.keys(EventTarget.prototype));

// Passthrough native el functions from the custom el to the native el
nativeElProps.forEach(prop => {
  const type = typeof nativeElTest[prop];

  if (type == 'function') {
    // Function
    CustomVideoElement.prototype[prop] = function() {
      return this.nativeEl[prop].apply(this.nativeEl, arguments);
    };
  } else {
    // Getter
    let config = {
      get() {
        return this.nativeEl[prop];
      },
    };

    if (prop !== prop.toUpperCase()) {
      // Setter (not a CONSTANT)
      config.set = function(val) {
        this.nativeEl[prop] = val;
      };
    }

    Object.defineProperty(CustomVideoElement.prototype, prop, config);
  }
});

function arrayFindAnyCase(arr, word) {
  let found = null;

  arr.forEach(item => {
    if (item.toLowerCase() == word.toLowerCase()) {
      found = item;
    }
  });

  return found;
}

if (!window.customElements.get('custom-video')) {
  window.customElements.define('custom-video', CustomVideoElement);
  window.CustomVideoElement = CustomVideoElement;
}

class CKVideo extends CustomVideoElement{
    static get observedAttributes() {
        return ['src']; 
    }
    constructor() {
        super();
        this.kv_event_timeupdate = new Event('timeupdate',{cancelable: false, bubbles: true});
        this.kv_event_ended = document.createEvent('Event');
        this.kv_event_ended.initEvent('ended', true, true);
        this.kv_event_error = document.createEvent('Event');
        this.kv_event_error.initEvent('error', true, true);
        this.kv_event_waiting= document.createEvent('Event');
        this.kv_event_waiting.initEvent('waiting', true, true);
        this.kv_event_statusupdate = document.createEvent('Event');
        this.kv_event_statusupdate.initEvent('statusupdate', true, true);
    }
    setStatus(status, delay=false){
        clearTimeout(this.status_timer);
        let self = this;
        if (!delay){ 
            this.setAttribute('status',status);
            this.kv_event_statusupdate.status = status;
            this.dispatchEvent(this.kv_event_statusupdate);
            return;
        }
        this.status_timer = setTimeout(function(){
            self.status_timer = undefined;
            self.setAttribute('status',status);
            self.kv_event_statusupdate.status = status;
            self.dispatchEvent(self.kv_event_statusupdate);
        },50);
    }
    get currentUtcTime(){
        if (this.getAttribute('time')!==null)
            return parseInt(this.getAttribute('time')||0) + parseInt(super.currentTime*1000);
        if (this.getAttribute('playtime')!==null)
            return parseInt(this.getAttribute('playtime') || 0);
        return parseInt(super.currentTime*1000);
    }
    set currentUtcTime(time){
        this.setTimePromise(time).catch(function(){});
    }
    set playbackRate(rate){
        super.playbackRate = rate > 0 ? rate : 0;
    }
    get playbackRate(){
        return super.playbackRate;
    }
    set src(src){
        let self = this;
        let t = src.indexOf(';');let msec;let time;
        if (t<30 && parseInt(src.substr(0,t))!=src.substr(0,t)){
            let v = src.substr(0,t);
            let d = new Date(v);
            if (!isNaN(d)){
                time = d.getTime();
                src = src.substr(t+1);
            }
        }
        t = src.indexOf(';');
        if (t<10){
            let v = src.substr(0,t);
            if (!isNaN(parseInt(v))){
                msec = parseInt(v);
                src = src.substr(t+1);
            }
        }

        this.setSourcePromise(src,time,msec).catch(function(){}).finally(function(){
            if (time || msec){
                if (time) self.setAttribute('playtime',time);
                self.dispatchEvent(self.kv_event_timeupdate);
            }

        });
    }
    get src(){
        return this.original_src;
    }
    play(abort_controller)          {this.setAttribute('autoplay','');return this.playPromise(abort_controller);}
    pause(abort_controller)         {this.removeAttribute('autoplay');return this.pausePromise(abort_controller);}
    superSrc(src)   {super.src = src;}
    isEmpty()       {return !this.original_src;}
    isError()       {return this.getAttribute('error')!==null;}
    getFirstTime()  {return this.getAttribute('time')!==null ? parseInt(this.getAttribute('time') || 0) : undefined;}
    getLastTime()   {return this.getAttribute('msec')!==null ? ((parseInt(this.getAttribute('time') || 0)) + (parseInt((this.getAttribute('duration')||0)*1000) || parseInt(this.getAttribute('msec') || 0)) - 1) : undefined;}
    getInitialLastTime()   {return this.getAttribute('msec')!==null ? ((parseInt(this.getAttribute('time') || 0)) + (parseInt(this.getAttribute('msec') || 0)) - 1) : undefined;}
    isPlaying()     {return !this.paused && this.readyState > 2;}
    isPlayRequired(){return this.getAttribute('autoplay')!==null;}
    isWaiting()     {return this.getAttribute('status')=='waiting';}
    isReadyForPlay(){return super.src && this.getAttribute('loaded')==100;}
    isFull()        {return this.getAttribute('fullload')!==null;}
    isFilled()      {return this.src && (parseInt(this.getAttribute('msec'))>0 || parseInt(this.getAttribute('duration'))>0);}
    isLoaded()      {return !this.load_promise;}
    isSeeking()     {return this.seeking;}
    atStart()       {return this.currentTime==0;}
    atEnd()         {return this.currentTime==this.duration;}

    getRanges(from, to, interval){
        return [this.getFirstTime() || 0,this.getInitialLastTime()||this.getLastTime()||parseInt(this.duration*1000+(this.getFirstTime()||0))||0];
    }

    isOutOfBound(){
        let currentUtcTime = this.currentUtcTime;
        return currentUtcTime<this.getFirstTime() || currentUtcTime>this.getLastTime();
    }

    abort(abort_controller){
        if (this.abort_controller) this.abort_controller.abort();
        this.abort_controller = abort_controller ? abort_controller : new AbortController();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (this.do_not_attr_callback) return;
        if (name=="src"){
            let utc_from_in_msec = this.getAttribute('time')===null ? undefined : parseInt(this.getAttribute('time'));
            let duration_msec = this.getAttribute('msec')===null ? undefined : parseInt(this.getAttribute('msec'));
            let off = this.getAttribute('msec')===null ? undefined : parseInt(this.getAttribute('off'));
            this.setSourcePromise(newValue, utc_from_in_msec, duration_msec, this.getAttribute('fullload')!==null, off).catch(function(e){});
        }
    }

    connectedCallback() {
        let self = this;
        this.players_layer = this;
        this.addEventListener("timeupdate", function(e) { 
            let time = self.currentUtcTime;
            if (isNaN(time) || self.isEmpty() || self.isError()) {
                self.removeAttribute('playtime');
                self.setStatus('pause');
            } else 
                if (self.isPlaying())
                    self.setAttribute('playtime', time);
//            if (time>0 && time<100000) debugger;
        },false);
        this.addEventListener("error", function(e) { 
            self.setStatus('error');
            self.removeAttribute('playtime');
            self.removeAttribute('duration');self.removeAttribute('loaded');self.removeAttribute('fullload');
            if (self.src!==''){
                let err='MEDIA_ERR_UNDEFINED';
                if (e&&e.target&&e.target.error&&e.target.error.code){
                    switch(e.target.error.code){
                        case e.target.error.MEDIA_ERR_ABORTED: err='MEDIA_ERR_ABORTED'; break;
                        case e.target.error.MEDIA_ERR_NETWORK: err='MEDIA_ERR_NETWORK'; break;
                        case e.target.error.MEDIA_ERR_DECODE: err='MEDIA_ERR_DECODE'; break;
                        case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED: err='MEDIA_ERR_SRC_NOT_SUPPORTED'; break;
                    }
                } 
                self.setAttribute('error',err);
            }
            if (self.pause_promise) self.pause_promise_reject();
            if (self.play_promise) self.play_promise_reject(self.abort_controller);
            if (self.load_promise) self.load_promise_reject(self.abort_controller);
            if (self.seek_promise) self.seek_promise_reject(self.abort_controller);
        },false);
        this.addEventListener("durationchange", function(r) { 
            self.setAttribute('duration',this.duration || 0);
        });
        this.addEventListener("canplay", function(r) { 
            if (self.getAttribute('loaded')===null) self.setAttribute('loaded',0);
            if (self.load_promise) self.load_promise_resolve(self.abort_controller);
//            self.setStatus(self.isPlayRequired() ? 'playing' : 'pause');
        });
        this.addEventListener("canplaythrough", function(r) { 
            self.setAttribute('loaded',100);
//            self.setStatus(self.isPlayRequired() ? 'playing' : 'pause');
        });
        this.addEventListener("ended", function() { 
//            self.playRequired = false;
            self.setStatus('pause');
            if (self.play_promise) self.play_promise_reject(self.abort_controller);
            if (self.pause_promise) self.pause_promise_resolve();
        },false);
        this.addEventListener("waiting", function() { 
            self.setStatus('loading',true);
        },false);
        this.addEventListener("playing", function() { 
            self.setStatus('playing');
            if (self.play_promise) self.play_promise_resolve(self.abort_controller);
            if (self.pause_promise) self.pause_promise_reject();
        },false);
        this.addEventListener("pause", function() { 
            self.setStatus('pause');
            if (self.play_promise) self.play_promise_reject(self.abort_controller);
            if (self.pause_promise) self.pause_promise_resolve();
        },false);
        this.addEventListener("loadstart", function() { 
            self.setStatus('loading',true);
            self.removeAttribute('duration');self.setAttribute('loaded',0);
        },false);
        this.addEventListener("seeking", function() { 
            self.setStatus('seeking',true);
        },false);
        this.addEventListener("seeked", function() { 
            if (self.isPlayRequired()) self.setStatus('playing'); else self.setStatus('pause');
            if (self.seek_promise) self.seek_promise_resolve(self.abort_controller);
        },false);
        this.addEventListener("emptied", function() { 
            self.setStatus('pause');
            self.removeAttribute('playtime');
            self.removeAttribute('duration');self.removeAttribute('loaded');
            if (self.load_promise) self.load_promise_resolve();
            if (self.play_promise) self.play_promise_reject(self.abort_controller);
            if (self.pause_promise) self.pause_promise_resolve();
            if (self.seek_promise) self.seek_promise_reject(self.abort_controller);
        },false);
        this.addEventListener("progress", function(r) { 
            let percent = null;
            if (r.srcElement.buffered.length > 0 && r.srcElement.buffered.end && r.srcElement.duration) {
                percent = r.srcElement.buffered.end(0) / r.srcElement.duration;
            } else if (r.srcElement.bytesTotal != undefined && r.srcElement.bytesTotal > 0 && r.srcElement.bufferedBytes != undefined) {
                percent = r.srcElement.bufferedBytes / r.srcElement.bytesTotal;
            }
            self.setAttribute('duration',r.srcElement.duration || 0);
            if (percent !== null) {
                percent = 100 * Math.min(1, Math.max(0, percent));
                if (self.getAttribute('loaded')!==null && parseInt(self.getAttribute('loaded'))<percent)
                    self.setAttribute('loaded',parseInt(percent));
            }
        },false);
    }

    loadPromise(){
        if (this.load_promise) return this.load_promise;
        return new Promise(function(resolve, reject){resolve();});
    }
    clearAllFlags(){
        this.removeAttribute('time');
        this.removeAttribute('msec');
        this.removeAttribute('playtime');
        this.removeAttribute('duration');
        this.removeAttribute('loaded');
        this.removeAttribute('error');
        this.removeAttribute('fullload');
//        this.poster = '';
//        this.removeAttribute('status');
    }

    setSourcePromise(src, utc_from_in_msec, duration_msec, full_load, off){
        let self = this;
        if (src || utc_from_in_msec && duration_msec) {
            if (this.original_src == src){
                if (this.load_promise) return this.load_promise;
                return new Promise(function(resolve, reject){resolve(self.abort_controller);});
             }
            this.original_src = src;
        } else {
            this.clearAllFlags();
            this.removeAttribute('status');
            if (!this.original_src) {
                if (this.load_promise) return this.load_promise;
                return new Promise(function(resolve, reject){resolve(self.abort_controller);});
            }
            this.original_src = undefined;
            self.removeAttribute('src');
//            try{self.load();}catch(e){};
            return new Promise(function(resolve, reject){resolve(self.abort_controller);});
        }
        this.abort();

        this.clearAllFlags();
        this.setStatus('loading',true);
        if (src && !isNaN(utc_from_in_msec))
            self.setAttribute('time',parseInt(utc_from_in_msec));
        if (src && !isNaN(duration_msec))
            self.setAttribute('msec',parseInt(duration_msec));
        if (src && !isNaN(off))
            self.setAttribute('off',parseInt(off));
//        if (duration_msec>100000) debugger;

        if (self.pause_promise) self.pause_promise_reject(); self.pause_promise = undefined;
        if (self.play_promise) self.play_promise_reject(self.abort_controller); self.play_promise = undefined;
        if (self.seek_promise) self.seek_promise_reject(self.abort_controller); self.seek_promise = undefined;
        if (self.load_promise) self.load_promise_reject(self.abort_controller); self.load_promise = undefined;

        function tryLoad(src){
            if (self.abort_controller) self.abort_controller.signal.addEventListener('abort', function(){
                if (self.load_promise) self.load_promise_reject(self.abort_controller);
                self.load_promise=undefined;
            });
            self.load_promise = new Promise(function(resolve, reject){
                self.load_promise_resolve = resolve;
                self.load_promise_reject = reject;
            }).then(function(){
                self.load_promise=undefined;
                if (self.isPlayRequired()) self.setStatus('playing'); else self.setStatus('pause');
/*
                let off = parseInt(this.getAttribute('off')||0);
                if (off) return self.setTimePromise(time).then(function(){
                    return self.abort_controller;
                });
*/
                return self.abort_controller;
            },function(err){
                self.load_promise=undefined;
//                if (self.isPlayRequired()) self.setStatus('playing'); else self.setStatus('pause');
                if (!(err instanceof AbortController)) self.setStatus('error');
                throw err;
            });
            self.do_not_attr_callback=true;
            if (!src)
                self.removeAttribute('src');
            else{
                self.setAttribute('src',src);
                self.superSrc(src);
            }
            delete self.do_not_attr_callback;
            self.load();
            if (src=='') setTimeout(function(){
                self.load_promise_resolve(self.abort_controller);
            },0);
            return self.load_promise;
        }
        if (full_load!==undefined && !full_load || full_load!==undefined && self.getAttribute('fulload')===null) return tryLoad(src);
        self.setAttribute('loaded',0);
        self.dispatchEvent(self.kv_event_waiting);

        return fetch(src,{signal:self.abort_controller.signal,  headers: { range: 'bytes=0-100000000' } }).then(function(res){
            if (parseInt(res.status/100)!==2)
                return tryLoad(src);
            return res.blob().then(function(blob){
                self.setAttribute('fullload','');
                return tryLoad(window.URL.createObjectURL(blob));
            });
        },function(err){
            if (err.code!==undefined && err.code == err.ABORT_ERR){
                if (self.isPlayRequired()) self.setStatus('playing'); else self.setStatus('pause');
                throw err;
            }
//            console.warn('Full load failed. May be CORS?')
            return tryLoad(src);
        });
    }
    toStart(){
        let time = parseInt(this.getAttribute('time')||0);
        let off = parseInt(this.getAttribute('off')||0);
        return this.setTimePromise(time+off);
    }
    toEnd(abort_controller){
        if (abort_controller && this.abort_controller!=abort_controller) {
            this.abort_controller.abort();
            this.abort_controller = abort_controller;
        }
        let time = parseInt(this.getAttribute('time')||0) + parseInt(this.getAttribute('msec')||0);
        return this.setTimePromise(time, abort_controller);
    }
    setTimePromise(utc_milliseconds, abort_controller){
        if (!this.isPlaying())
            this.setAttribute('playtime', utc_milliseconds);
        if (abort_controller && this.abort_controller!=abort_controller) {
            this.abort_controller.abort();
            this.abort_controller = abort_controller;
        }

        let self = this;
        let time = parseInt(self.getAttribute('time')) || 0;
        let currentTime = parseFloat(utc_milliseconds - time)/1000;
        if (this.seek_promise) {
            if (currentTime<=this.duration)
                this.setSuperCurrentTime(currentTime);
            return this.seek_promise;
        }
        if (this.isEmpty() || this.isError())
            return new Promise(function(resolve, reject){reject();});
        if (super.currentTime!=currentTime){
//console.log('Seeking to '+currentTime);
            self.seek_promise = new Promise(function(resolve, reject){
                self.seek_promise_resolve = resolve;
                self.seek_promise_reject = reject;
            }).then(function(){
//console.log('Seek end');
                if (self.isPlayRequired()) self.setStatus('playing'); else {
                    if (utc_milliseconds>self.getLastTime() || utc_milliseconds<self.getFirstTime())
                        self.setStatus('nodata');
                    else
                        self.setStatus('pause');
                }
                self.seek_promise=undefined;
                return abort_controller;
            },function(err){
//console.log('Seek fail');
                if (self.isPlayRequired()) self.setStatus('playing'); else self.setStatus('pause');
                self.seek_promise=undefined;
                throw err;
            });
//            self.setStatus('loading');
//            if (currentTime<=self.duration)
                self.setSuperCurrentTime(currentTime);
            if (abort_controller) abort_controller.signal.addEventListener('abort', function(){
                if (self.seek_promise) self.seek_promise_reject(self.abort_controller);
                self.seek_promise=undefined;
            });
            return self.seek_promise;
        }
        return new Promise(function(resolve, reject){resolve(abort_controller);});
    }
    setPlaybackRatePromise(speed){
        this.playbackRate = speed;
        return new Promise(function(resolve, reject){resolve();});
    }
    disconnectedCallback(){
        if (this.play_promise)  this.play_promise_reject();
        if (this.seek_promise)  this.seek_promise_reject();
        if (this.pause_promise) this.pause_promise_reject();
        if (this.load_promise)  this.load_promise_reject();
    }

    setSuperCurrentTime(time){
        if (isNaN(time))
            debugger;
        super.currentTime = time;
    }
    preparePlay(abort_controller){
        if (abort_controller && this.abort_controller!=abort_controller) {
            this.abort_controller.abort();
            this.abort_controller = abort_controller;
        }
        let self = this;
        if (this.pause_promise)
            this.pause_promise_reject();
        if (this.isEmpty()) setTimeout(function(){self.dispatchEvent(self.kv_event_ended);},0);
        if (this.isError()) setTimeout(function(){if (self.isError()) self.dispatchEvent(self.kv_event_error);},0);
        if (this.isEmpty() || this.isError())
            return new Promise(function(resolve, reject){reject();});
        if (this.isPlaying())
            return new Promise(function(resolve, reject){resolve();});
        if (this.play_promise) 
            return this.play_promise;
    }
    playPromise(abort_controller){
        this.setAttribute('autoplay','')
        let self = this;
        let p = this.preparePlay(abort_controller);
        if (p) return p;
        if (this.atEnd()){
            setTimeout(function(){self.dispatchEvent(self.kv_event_ended);},0);
            if (this.getAttribute('norepeat')!==null)
                return new Promise(function(resolve, reject){resolve(abort_controller);});
        }
        this.play_promise = new Promise(function(resolve, reject){
            self.play_promise_resolve = resolve;
            self.play_promise_reject = reject;
        }).then(function(abort_controller){
            self.setStatus('playing');
            self.play_promise=undefined;
            return abort_controller;
        },function(err){
            self.play_promise=undefined;
//            if (err instanceof AbortController) return err;
            throw err;
        });
        super.play();
        if (abort_controller) abort_controller.signal.addEventListener('abort', function(){
            if (self.play_promise) self.play_promise_reject(self.abort_controller);
            self.play_promise=undefined;
        });
        return this.play_promise;
    }
    superPause(){
        super.pause();
    }
    pausePromise(abort_controller){
        this.removeAttribute('autoplay')
        if (abort_controller && this.abort_controller!=abort_controller)
            this.abort(abort_controller);
        let self = this;
        if (self.play_promise) self.play_promise_reject(self.abort_controller);
        if (this.pause_promise) return this.pause_promise;
        if (!this.isPlaying())
            return new Promise(function(resolve, reject){resolve();});
        self.pause_promise = new Promise(function(resolve, reject){
            self.pause_promise_resolve = resolve;
            self.pause_promise_reject = reject;
        }).then(function(abort_controller){
            self.setStatus('pause');
            self.pause_promise=undefined;
            return abort_controller;
        },function(err){
            self.pause_promise=undefined;
            throw err;
        });
        super.pause();
        if (abort_controller) abort_controller.signal.addEventListener('abort', function(){
            if (self.pause_promise) self.pause_promise_reject(self.abort_controller);
            self.pause_promise=undefined;
        });
        return self.pause_promise;
    }
}

window.customElements.define('k-video', CKVideo);
class CKVideoReverse extends CKVideo{
    constructor() {
        super();
        this.reverse_event_ended = document.createEvent('Event');
        this.reverse_event_ended.initEvent('ended', true, true);
        this.reverse_event_playing= document.createEvent('Event');
        this.reverse_event_playing.initEvent('playing', true, true);
        this.reverse_event_pause= document.createEvent('Event');
        this.reverse_event_pause.initEvent('pause', true, true);
        this.speed=1;
    }

    get reverseFramerate(){
        const REVERSE_FRAME_RATE = 25; // 12 frame per second in reverse play
        let rf = this.getAttribute('reverse-frame-rate');
        rf = rf === null ? REVERSE_FRAME_RATE : parseInt(rf);
        if (rf<1) rf=1; if (rf>30) rf=30;
        return rf;
    }
    set playbackRate(rate){
        this.setPlaybackRatePromise(rate).catch(function(){});
    }
    get playbackRate(){
        return this.speed;
    }
    pause(abort_controller){
        this.removeAttribute('autoplay');
        return this.pauseWithReversePromise(abort_controller);
    }
    play(abort_controller){
        this.setAttribute('autoplay','');
        if (this.speed>=0)
            return super.play();
        let pr = this.preparePlay(abort_controller);
        if (pr) return pr;
        return this.playWithReversePromise(abort_controller);
    }
    isPlaying() {
        return this.play_reverse_timer || super.isPlaying();
    }
    setSourcePromise(src, utc_from_in_msec, duration_msec, full_load, off){
        if (this.play_reverse_timer) clearInterval(this.play_reverse_timer); this.play_reverse_timer = undefined;
        return super.setSourcePromise(src, utc_from_in_msec, duration_msec, full_load, off);
    }
    setPlaybackRatePromise(speed){
        let self = this;
        if (speed<0){
            let p = this.getAttribute('autoplay')!==null;
            self.speed = speed;
            self.setSuperPlaybackRate(-self.speed);
            let r = super.pause().then(function(abort_controller){
                if (self.getAttribute('autoplay')!==null && self.isPlayRequired() && !self.isPlaying() && !self.atStart())
                    return self.play(abort_controller);
                return new Promise(function(resolve, reject){resolve(abort_controller);});
            });
            if (p) this.setAttribute('autoplay','');
            return r;
        }
        if (this.speed<0 && this.isPlayRequired()){
            this.clearReverseTimer();
        }
        this.speed = speed;
        this.setSuperPlaybackRate(speed);
        return new Promise(function(resolve, reject){resolve();}).then(function(){
            if (!self.atEnd() && self.isPlayRequired() && !self.isPlaying()) return self.play();
        });
    }
    disconnectedCallback(){
        this.clearReverseTimer();
        super.disconnectedCallback();
    }

    clearReverseTimer(){
        if (this.play_reverse_timer) {
//console.log('Clear timer');
            clearTimeout(this.play_reverse_timer);
            this.play_reverse_timer = undefined;
        }
    }
    clearPlay(){
        if (this.pause_promise) this.pause_promise_resolve();
        if (this.play_promise) this.play_promise_reject(this.abort_controller);
        this.clearReverseTimer();
        this.setStatus('pause');
        this.dispatchEvent(this.reverse_event_ended);
    }
    playReverseTimer(){
        if (this.speed>=0 || !this.isPlayRequired() || this.play_reverse_timer) 
            return;
        if (super.isPlaying()) 
            super.superPause();

        this.play_reverse_timer = undefined;
        this.setStatus('playing');
        let self = this;
        let time_correct = new Date().getTime();
        let t = self.currentUtcTime - 1/self.reverseFramerate*(-self.speed)*1000;
        if (t<this.getFirstTime() && self.currentUtcTime==this.getFirstTime()){
            this.clearPlay();
            return;
        }
        if (t<this.getFirstTime()) t=this.getFirstTime();
        if (t>this.getLastTime()) t=this.getLastTime();
//console.log('Timer fired');
        return this.setTimePromise(t).catch(function(err){
//console.log('Set time fail');
        }).finally(function(){
//console.log('Set time ok');
            let time = parseInt(self.getAttribute('time')||0);
            if (t>=time) {
                if (!self.play_reverse_timer && self.isPlayRequired()) {
                    let c = new Date().getTime() - time_correct;
                    c = c > 1000/self.reverseFramerate-10 ? 1000/self.reverseFramerate-10 : c;
//console.log('Set timer '+(1000/self.reverseFramerate - c));
                    self.play_reverse_timer = setTimeout(function(){
                        self.play_reverse_timer=undefined;
                        self.playReverseTimer();
                    },1000/self.reverseFramerate - c);
                }
                if (!self.play_reverse_timer){
                    self.setStatus('pause');
                }
                if (self.pause_promise) self.pause_promise_reject();
                if (self.play_promise) self.play_promise_resolve(self.abort_controller);
                return;
            }
            self.clearPlay();
        });
    }
    setSuperPlaybackRate(rate){
        super.playbackRate = rate;
    }
    pauseWithReversePromise(abort_controller){
        if (abort_controller && this.abort_controller!=abort_controller)
            this.abort(abort_controller);
        this.clearReverseTimer();
        if (this.play_promise) this.play_promise_reject(this.abort_controller);
        if (this.speed>=0){
            if (!super.isPlaying())
                return new Promise(function(resolve, reject){resolve();});
            let p = this.getAttribute('autoplay')!=null;
            let r = super.pause(abort_controller);
            if (p) this.setAttribute('autoplay','');
            return r;
        } else
            this.dispatchEvent(this.reverse_event_pause);
        this.setStatus('pause');
        return new Promise(function(resolve, reject){resolve();});
    }
    playWithReversePromise(abort_controller){
        let self = this;
        if (this.atStart()){
            setTimeout(function(){self.dispatchEvent(self.reverse_event_ended);},0);
            if (this.getAttribute('norepeat')!==null)
                return new Promise(function(resolve, reject){resolve(abort_controller);});
            return this.toEnd(abort_controller).then(function(abort_controller){
                if (self.atStart()) return abort_controller;
                return self.playWithReversePromise(abort_controller);
            });
        }

        if (abort_controller && this.abort_controller!=abort_controller)
            this.abort(abort_controller);
        this.play_promise = new Promise(function(resolve, reject){
            self.play_promise_resolve = resolve;
            self.play_promise_reject = reject;
        }).then(function(){
            if (self.pause_promise) self.pause_promise_reject();
            self.dispatchEvent(self.reverse_event_playing);
            self.play_promise=undefined;
        },function(err){
            if (self.play_promise) self.play_promise_reject(self.abort_controller);
            if (self.pause_promise) self.pause_promise_resolve();
            self.clearReverseTimer();
            if (self.play_promise) self.play_promise_reject(self.abort_controller);
            self.setStatus('pause');
            self.play_promise=undefined;
//            if (err instanceof AbortController) return err;
            throw err;
        });
        self.playReverseTimer();
        return this.play_promise;
    }
}

window.customElements.define('k-video-reverse', CKVideoReverse);
class CRedux{
    constructor(element) {
        let self=this;
        this.element = element;
        this.messages = [];
        this.events_list = [];
        this.element.addEventListener("kredux", function(event){
            if (self.element.getAttribute('debuginfo')===null || !self.checkEventForLog(event.event_name)) return;
            let val='';
            if (event.event_param.value!==undefined) val=' = '+event.event_param.value;
            if (event.event_param.debug)
                val+=' => '+event.event_param.debug;
            else if (!isNaN(event.event_param.value) && event.event_param.value>1600000000000)
                val += ' ['+(new Date(event.event_param.value)).toISOString().replace('T',' ')+']';
            console.groupCollapsed('['+event.event_object.tagName.toLowerCase()+']: '+event.event_name+val);
            console.log(event.event_param);
            console.log(event.event_object);
            console.groupEnd();
        }, {once:false});
        this.event_timeupdate = new Event('timeupdate',{cancelable: false, bubbles: true});
        this.event_loadstart = new Event('loadstart',{cancelable: false, bubbles: true});
        this.event_statusupdate = document.createEvent('Event');
        this.event_statusupdate.initEvent('statusupdate', true, true);
    }
    checkEventForLog(event_name){
        if (typeof this.check_event_for_log_callback !== 'function') return true;
        let el = this.check_event_for_log_callback();
        if (!el || !el.length) return false;
        if (el.indexOf(event_name)===-1) return false;
        return true;
    }
    setLoggingEventsListCallback(listcallback){
        this.check_event_for_log_callback = listcallback;
    }
    subscribe(event, func){
        this.element.addEventListener("kredux", function(e){
            if (event===e.event_name)
                func(e);
        }, {once:false});
    }
    unsubscribe(func){
        this.element.removeEventListener("kredux", func, {once:false});
    }
    send(object, event_name, params){
        let event = new Event('kredux',{cancelable: false, bubbles: true});
        event.event_name = event_name;
        event.event_object = object;
        event.event_param = params;
        this.element.dispatchEvent(event);
/*
        let ev;
        switch(event_name){
            case 'timeupdate': ev = this.event_timeupdate;break;
            case 'loadstart':  ev = this.event_loadstart;break;
            case 'statusupdate': ev = this.event_statusupdate;break;
            case 'stateupdate': ev = this.event_stateupdate;break;
        }
        if (ev){
            ev.event_object = object;
            ev.event_param = params;
            this.dispatchEvent(this.event_stateupdate);
        }
*/
    }
    post(object, event, params){
        let self = this;
        let i=0;
        for (; i<this.messages.length;i++){
            if (this.messages['object']===object && this.messages['event']===event){
                this.messages['params'] = params;
                break;
            }
        }
        if (i>=this.messages.length)
            this.messages.push({object:object,event:event,params:params});
        if (this.timer) return;
        this.timer = setTimeout(function(){
            self.timer = undefined;
            while(self.messages.length>0){
                let e = self.messages.shift();
                self.send(e.object,e.event,e.params);
            }
        },0);
    }
}

class CKVideoSet extends HTMLElement{
    get LEFT_BUFFER_SIZE(){return this.options.left_prefetch || 1;};
    get RIGHT_BUFFER_SIZE(){return this.options.right_prefetch  || 2;};
    constructor() {
        super();
        this.event_timeupdate = new Event('timeupdate',{cancelable: false, bubbles: true});
        this.event_loadstart = new Event('loadstart',{cancelable: false, bubbles: true});
        this.options = this.getAttribute('options')===null ? {} : JSON.parse(this.getAttribute('options'));

        this.event_statusupdate = document.createEvent('Event');
        this.event_statusupdate.initEvent('statusupdate', true, true);
        this.event_videochanged = document.createEvent('Event');
        this.event_videochanged.initEvent('videochanged', true, true);

        this.redux = new CRedux(this);
    }
    getRanges(from, to, interval){
        let ret = [];

        for(let srcelement of this.source_list_element.children) {
            let time = srcelement.getAttribute('time');
            let msec = srcelement.getAttribute('msec');
            if (time===null || msec===null) continue;
            time = parseInt(time);
            if (isNaN(time)) continue;
            msec = parseInt(msec);
            if (isNaN(msec)) continue;
            ret.push(time);
            ret.push(time+msec-1);
        }
        return ret;
    }
    sendTimeUpdate(){
        this.dispatchEvent(this.event_timeupdate);
    }
    // overload base functions
    get currentUtcTime(){
        return parseInt(this.getAttribute('playtime')||0);
//        return this.shadow.querySelector('[pos="0"]').currentUtcTime;
    }
    set currentUtcTime(time){
        if (this.shadow.querySelector('[pos="0"]').currentUtcTime == time) 
            return;
        this.setTimePromise(time).catch(function(){});
    }
    get playbackRate(){
        return this.speed;
    }
    set playbackRate(speed){
        this.setPlaybackRatePromise(speed).catch(function(){});
    }
    get volume(){
        return this.shadow.querySelector('[pos="0"]').volume;
    }
    set volume(v){
        for (let i=-this.LEFT_BUFFER_SIZE; i<=this.RIGHT_BUFFER_SIZE; i++)
            this.shadow.querySelector('[pos="'+i+'"]').volume = v;
    }
    get muted(){
        return this.shadow.querySelector('[pos="0"]').muted;
    }
    set muted(v){
        for (let i=-this.LEFT_BUFFER_SIZE; i<=this.RIGHT_BUFFER_SIZE; i++)
            this.shadow.querySelector('[pos="'+i+'"]').muted = v;
    }
    getVideo(){
        return this.shadow.querySelector('[pos="0"]');
    }
    isPlaying(){
        return this.getAttribute('autoplay')!==null;
    }
    get videoHeight(){
        return this.shadow.querySelector('[pos="0"]').videoHeight;
    }
    get videoWidth(){
        return this.shadow.querySelector('[pos="0"]').videoWidth;
    }
    play(){
        this.setAttribute('autoplay','');
//        this.removeAttribute('nodata');
        let player = this.shadow.querySelector('[pos="0"]');
//        this.setAttribute('playing','');
        if (0 && this.speed<0 && !player.isEmpty() && !player.isFull()){
            this.setStatus('seeking', this.speed<0);
//            this.setWait();
            let src = player.src; 
            let time = player.getFirstTime(); 
            let msec = parseInt(parseInt(player.getAttribute('duration')*1000) || player.getAttribute('msec') || 0);
            return player.updateState();
/*
            return player.setSourcePromise().then(function(abort_controller){
                return player.setSourcePromise(src, time, msec, true).then(function(abort_controller){
                    return player.updateState(abort_controller);
                });
            });
*/
        }

        if (player.isPlaying() || player.isWaiting()) 
            return new Promise(function(resolve, reject){resolve();});
        return player.play().catch(function(){});
    }
    pause(){
        this.removeAttribute('autoplay');
//        this.setStatus('pause');
        return this.shadow.querySelector('[pos="0"]').pause();
    }

    // debug info
    onDebugInfo(){
        return '';
    }
    onResize(){
        let w = this.wplayers_layer.clientWidth;
        let h = this.wplayers_layer.clientHeight;
        if (!this.media_scale) return;
        if (w/this.media_scale<=h)
            h = w/this.media_scale;
        else
            w = h*w/this.media_scale;
        this.players_layer.style.width = ''+w+'px';
        this.players_layer.style.height= ''+h+'px';
    }
    connectedCallback() {
        let self = this;
        this.setStatus('nodata');
        if (this.innerText=='') this.innerHTML='';
        this.shadow = this.attachShadow({mode: 'open'});
        let video_tag = 'k-video-reverse';
        if (typeof CKVideoReverse==="undefined" || this.getAttribute('noreverse')!==null) {
            if (typeof CKVideo==="undefined"){
                console.error('No CKVideo or CKVideoReverse class - player disabled');
                return;
            }
            video_tag = 'k-video';
        }

        let pb = '<'+video_tag+' crossorigin="anonymous" preload norepeat pos="0"></'+video_tag+'>';
        for (let i=0; i<this.LEFT_BUFFER_SIZE; i++) pb = '<'+video_tag+' crossorigin="anonymous" preload norepeat pos="-'+(i+1)+'"></'+video_tag+'>' + pb;
        for (let i=0; i<this.RIGHT_BUFFER_SIZE; i++) pb += '<'+video_tag+' crossorigin="anonymous" preload norepeat pos="'+(i+1)+'"></'+video_tag+'>';
        this.shadow.innerHTML = '<style>'+this.getCss()+'</style><iframe></iframe>'+(this.getAttribute('debuginfo')!==null?'<div class="debuginfo"></div>':'')+'<div class="wplayers"><div class="players">'+pb+'</div></div>';
        this.wplayers_layer = this.shadow.querySelector('.wplayers');
        this.players_layer = this.shadow.querySelector('.players');

        this.shadow.querySelector('iframe').contentWindow.addEventListener('resize', function(e){self.onResize();});
        this.redux.subscribe('media_scale',function(event){
            if (!isNaN(parseFloat(event.event_param.value)))
                self.media_scale = parseFloat(event.event_param.value);
            self.onResize();
        });

        this.debuginfo = this.shadow.querySelector('.debuginfo');
        if (typeof this.updateDebugInfo=="function") this.updateDebugInfo();

        function setSourceForTimePromise(utctime, to_left, accuracy){
            let it = this;
            let source_data = to_left===true ? self.getLastSrcBeforeTime(utctime+1) : self.getFirstSrcFromTime(utctime);
            if (accuracy && !to_left && source_data && source_data.time>utctime)
                source_data = self.getLastSrcBeforeTime(utctime);

            if (!source_data/* || (accuracy && (source_data.time>utctime || source_data.time+source_data.msec<utctime))*/) 
                return this.setSourcePromise();
            return this.setSourcePromise(source_data.src, source_data.time, source_data.msec, to_left /*&& self.isPlaying()*//*,utctime*/, source_data.off).finally(function(){
                if (accuracy) return it.setTimePromise(utctime);
//                if (it.getAttribute('pos')==0 && it.isReadyForPlay())
//                    self.clearWait();
            });
        }
        function updateState(abort_controller){
//console.log('updateState');
            let it = this;
            if (!abort_controller) abort_controller = this.abort();

            if (this.getAttribute('pos')!=0){
                if (this.isError()/* || this.isEmpty()*/)
                    return new Promise(function(resolve, reject){resolve(abort_controller);});
                if (parseInt(this.getAttribute('pos'))<0)
                    return this.toEnd().then(function(){
                        if (it.isPlaying())
                            return it.pause(abort_controller).catch(function(){});
                        return new Promise(function(resolve, reject){resolve(abort_controller);});
                    }).catch(function(e){});

                if (this.isPlaying())
                    return this.pause(abort_controller).catch(function(){});
                return new Promise(function(resolve, reject){resolve(abort_controller);}).then(function(){
                    if (self.getAttribute('autoplay')===null) return abort_controller;
                    let cp = self.shadow.querySelector('[pos="0"]');
                    if (!cp.isPlaying() && self.isPlaying() && (it.getAttribute('pos')==1 && self.speed>=0 || it.getAttribute('pos')==-1 && self.speed<0))
                        self.onPlayNextBlock();
                    return abort_controller;
                });
            }
            if (this.isError() || this.isEmpty()){
//                self.clearWait();
                self.setStatus('nodata');
                if (this.isError()) return new Promise(function(resolve, reject){reject();});
                return new Promise(function(resolve, reject){resolve();});
            }
            let playtime = parseInt(self.getAttribute('playtime')||0);
            if (self.getAttribute('autoplay')!=null){
                if (playtime<this.getFirstTime() || playtime>this.getLastTime()){
//                    self.clearWait();
                    self.setStatus('nodata');
                }else{
//                    self.setStatus('pause');
                }
            }

            return this.setTimePromise(playtime, abort_controller).then(function(abort_controller){
                return it.setPlaybackRatePromise(self.speed).then(function(){
                    if (it.getAttribute('pos')!=0)
                        return it.isPlaying() ? it.pause(abort_controller).catch(function(){}) : abort_controller;
//                    self.clearWait();
                    if (self.getAttribute('autoplay')===null && it.isReadyForPlay()){
                        let playtime = parseInt(self.getAttribute('playtime')||0);
                        if (playtime<it.getFirstTime() || playtime>it.getLastTime())
                            self.setStatus('nodata');
                        else
                            self.setStatus('pause');
                    }
                    if (self.getAttribute('autoplay')!==null && !it.isPlaying())
                        return it.play(abort_controller).catch(function(err){
                            if (err instanceof AbortController)
                                return err;
                            self.setStatus('nodata');
                        });
                    if (self.getAttribute('autoplay')===null && it.isPlaying())
                        return it.pause(abort_controller).catch(function(){});
                    return new Promise(function(resolve, reject){resolve(abort_controller);});
                });
            },function(err){
                if (it.getAttribute('pos')==0){
//                    self.clearWait();
                    self.setStatus('nodata');
                }
                throw err;
            });
        }
        function setTimeWithSourcePromise(utctime, to_left, accuracy, not_create_promise=false){
            let it = this;

            if (parseInt(it.getAttribute('pos'))!==0){
                let player = self.shadow.querySelector('[pos="0"]');
                clearTimeout(it.set_time_timer);
                if (not_create_promise!==true){
                    if (it.set_time_promise_reject) it.set_time_promise_reject(); 
                    it.set_time_promise_reject=undefined;
                    it.set_time_promise = undefined;
                }
                if (!player.isLoaded() || player.isSeeking()){
                    if (!it.set_time_promise)
                        it.set_time_promise = new Promise(function(resolve, reject){
                            it.set_time_promise_resolve = resolve; it.set_time_promise_reject = reject;
                        });
                    it.set_time_timer = setTimeout(function(){
                        it.setTimeWithSourcePromise(utctime, to_left, accuracy, true).then(function(e){
                            if (it.set_time_promise_resolve) it.set_time_promise_resolve(e);
                            it.set_time_promise = undefined;
                            it.set_time_promise_resolve = undefined;
                        },function(e){
                            if (it.set_time_promise_reject) it.set_time_promise_reject(e);
                            it.set_time_promise = undefined;
                            it.set_time_promise_reject = undefined;
                        });
                    },2000);
                    return it.set_time_promise;
                }
            }

            return this.setSourceForTimePromise(utctime, to_left, accuracy).then(function(abort_controller){
                return it.updateState(abort_controller);
            },function(abort_controller){
                if (abort_controller instanceof AbortController) throw abort_controller;
                return abort_controller;
            });
        }

        this.setListiners(this.shadow.querySelector('[pos="0"]'));

        for (let i = -this.LEFT_BUFFER_SIZE; i<=this.RIGHT_BUFFER_SIZE; i++){
            this.shadow.querySelector('[pos="'+i+'"]').addEventListener("error", function(e){
                self.dispatchEvent(new CustomEvent("error", {detail: { src: this} }));
            },{once:false});
            this.shadow.querySelector('[pos="'+i+'"]').addEventListener("loadedmetadata", function(event){
                let w = !event ? 0 : (event.target && event.target.videoWidth ? event.target.videoWidth : (event.detail&&event.detail.src&&event.detail.src.videoWidth?event.detail.src.videoWidth:0));
                let h = !event ? 0 : (event.target && event.target.videoHeight ? event.target.videoHeight : (event.detail&&event.detail.src&&event.detail.src.videoHeight?event.detail.src.videoHeight:0));
                if (w && h){
                    if (self.last_media_scale!==w/h)
                        self.redux.post(event.srcElement,'media_scale',{value:w/h});
                    self.last_media_scale=w/h;
                }
//                self.dispatchEvent(new CustomEvent("loadedmetadata", {detail: { src: event.srcElement} }));
            },{once:false});
        }

        for (let s of this.shadow.querySelectorAll('.players > *')) {
            s.setSourceForTimePromise = setSourceForTimePromise;
            s.setTimeWithSourcePromise = setTimeWithSourcePromise;
            s.updateState = updateState;
        }

        this.speed=1;
        this.setSourceListObserver(this);

        this.addEventListener("loadstart", function(){
            let player = self.shadow.querySelector('[pos="0"]');
            if (player && player.isEmpty())
                self.setStatus('loading');
        },{once:false});
        this.addEventListener("waiting", function(){
            self.setStatus('loading');
        },{once:false});

    }
    setWait2(deferred){
        let self = this;
        if (this.set_wait_timer) clearTimeout(this.set_wait_timer);
        if (!deferred){
            this.setAttribute('waiting','');
            return;
        }
        this.set_wait_timer = setTimeout(function(){
            self.setAttribute('waiting','');
        },200);
    }
    clearWait2(){
//console.trace();
        if (this.set_wait_timer) clearTimeout(this.set_wait_timer);
        delete this.set_wait_timer;
        this.removeAttribute('waiting');
    }
    setPlayTime(time){
if (time<1000000) debugger;
        this.setAttribute('playtime', time);
    }
    setListiners(player){
        let self = this;
        let pl =  player;
        this.onTimeUpdateEvent = function(){
//            self.clearWait();
            if (!self.shadow || !pl.isLoaded()) return;
            if (pl.isPlaying() && pl.playbackRate<0) self.setStatus('playing');
            const player = self.shadow.querySelector('[pos="0"]');
            if (!player || player.isEmpty()) return;
            let time = player.currentUtcTime;
if (time<1000000){
debugger;
time = player.currentUtcTime;
}
            if (time<=0) {
//                debugger;
                return;
            }

            if (!isNaN(time)) {
                if (self.getAttribute('playtime')!=time){
                    self.prev_time = parseInt(self.getAttribute('playtime')||0);
                    self.setPlayTime(time);

                    let current_time = new Date().getTime();
                    if (!self.last_time_update || current_time - self.last_time_update >500){
                        setTimeout(function(){self.sendTimeUpdate();},0);
                        self.last_time_update = current_time;
                    }
                }
            }
        }
/*
        this.onSeeking= function(){
            self.setStatus('seeking', self.speed<0);
        }
        this.onSeekend= function(){
            self.setStatus(self.getAttribute('autoplay')!==null ? 'playing' : 'pause');
        }
*/
        this.onLoading = function(e){
            self.dispatchEvent(self.event_loadstart);
//console.log('onLoading');
//            self.setStatus('loading');
        }
        this.onPlayNextBlock = function(){
            self.setStatus('seeking',true);
            let player = self.shadow.querySelector('[pos="0"]');
            if (self.speed>=0){
                let lt = player.getLastTime();
                if (lt!==undefined) {
                    self.prev_time = parseInt(self.getAttribute('playtime')||0);
                    self.setPlayTime(lt+1);
                }
            } else {
                let lt = player.getFirstTime();
                if (lt!==undefined) {
                    self.prev_time = parseInt(self.getAttribute('playtime')||0);
                    self.setPlayTime(lt-1);
                }
            }

            if (/*player.isEmpty() && */!self.checkNextBlock()){
                self.updateCache();
                return;
            }
            player = self.shiftToNextBlock();
            if (player.isEmpty()){
                self.setStatus('nodata');
                self.updateCache();
                return;
            }
            if (!player.isError()){
                self.setPlayTime(self.speed>=0 ? player.getFirstTime() : player.getLastTime());
                if (!player.isLoaded()){
                    self.setStatus('loading',true);
                    return;
                }
                player.setTimeWithSourcePromise(self.speed>=0 ? player.getFirstTime() : player.getLastTime(),false,true).catch(function(){}).finally(function(){
                    self.updateCache();
                });
                return;
            } else
                self.setStatus('nodata');
            self.onPlayNextBlock();
        }
        this.onStatusUpdate = function(event){
            self.setStatus(event.status);
        }
        player.addEventListener("statusupdate", this.onStatusUpdate,{once:false});

//        player.addEventListener("seeking", this.onSeeking,{once:false});
//        player.addEventListener("seekend", this.onSeekend,{once:false});
        player.addEventListener("ended", this.onPlayNextBlock,{once:false});
        player.addEventListener("waiting", this.onLoading,{once:false});
        player.addEventListener("loadstart", this.onLoading,{once:false});
        player.addEventListener("timeupdate", this.onTimeUpdateEvent,{once:false});
    }
    getPoster(){
        return this.shadow.querySelector('[pos="0"]').poster;
    }
    setPoster(url, preload, withcache){
        if (!url){
debugger;
            return;
        }
        let self = this;
        if (url.substr(0,5)==='blob:'){
            let img = new Image();
            img.src = url;
            img.onload = function(){
                for (let i=-self.LEFT_BUFFER_SIZE; i<=self.RIGHT_BUFFER_SIZE; i++){
                    let p = self.shadow.querySelector('[pos="'+i+'"]');
                    p.poster = url;
                    if (!p.src) {p.src='';p.load();}
                }
            }
            return new Promise(function(resolve, reject){resolve();});
        }

        if (!self.preview_cache) self.preview_cache = [];

/*
        if (!preload || self.preview_cache[url]){
            self.shadow.querySelector('[pos="0"]').poster = self.preview_cache[url] ? self.preview_cache[url] : url;
            if (!self.shadow.querySelector('[pos="0"]').src) self.shadow.querySelector('[pos="0"]').load();
            return new Promise(function(resolve, reject){resolve();});
        }
*/
        if (this.preview_abort_controller) this.preview_abort_controller.abort();
        this.preview_abort_controller = new AbortController();
        setTimeout(function(){self.setState('thumbnailing');},0);

        return fetch(url,{signal:this.preview_abort_controller.signal, headers: { range: 'bytes=0-100000000' } }).then(function(res){
            return res.blob().then(function(blob){
                self.clearState('thumbnailing');
                let url2 =  window.URL.createObjectURL(blob);
                if (withcache)
                    self.preview_cache[url] = url2;

                let img = new Image();
                img.src = url;
                img.onload = function(){
                    for (let i=-self.LEFT_BUFFER_SIZE; i<=self.RIGHT_BUFFER_SIZE; i++){
                        let p = self.shadow.querySelector('[pos="'+i+'"]');
                        p.poster = url2;
                        if (!p.src) {p.src='';p.load();}
                    }
                }

                return url2;
            });
        }).catch(function(){
            self.clearState('thumbnailing');
        });
    }
    setStatus(status, delay=false){
        clearTimeout(this.status_timer);
        if (this.getAttribute('status')===status) return;
        let self = this;
        if (!delay){ 
            this.setAttribute('status',status);
            this.event_statusupdate.status = status;
            this.dispatchEvent(this.event_statusupdate);
            return;
        }
        this.status_timer = setTimeout(function(){
            self.status_timer = undefined;
            self.setAttribute('status',status);
            self.event_statusupdate.status = status;
            self.dispatchEvent(self.event_statusupdate);
        },50);
    }
    getState(state){
        return this.classList.contains(state);
    }
    setState(state){
        if (this.getState(state)) return;
        this.classList.add(state);
        this.redux.send(this,'set_state',{value:state});
/*
        this.event_stateupdate.setstate = state;
        this.event_stateupdate.removestate = undefined;
        this.dispatchEvent(this.event_stateupdate);
*/
    }
    clearState(state){
        if (!this.getState(state)) return;
        this.classList.remove(state);
        this.redux.send(this,'clear_state',{value:state});
/*
        this.event_stateupdate.setstate = undefined;
        this.event_stateupdate.removestate = state;
        this.dispatchEvent(this.event_stateupdate);
*/
    }
    shiftToNextBlock(){
        if (this.speed>=0){
            let p = this.shadow.querySelector('[pos="-'+this.LEFT_BUFFER_SIZE+'"]');
            for (let i = -this.LEFT_BUFFER_SIZE+1; i<=this.RIGHT_BUFFER_SIZE; i++){
                let np = this.shadow.querySelector('[pos="'+i+'"]');
                this.swapPlayers(p,np);
                np.pause().catch(function(){});
            }
            if (this.shadow.querySelector('[pos="0"]').isEmpty() && this.checkNextBlock()){
                p = this.shadow.querySelector('[pos="-'+this.LEFT_BUFFER_SIZE+'"]');
                for (let i = -this.LEFT_BUFFER_SIZE+1; i<=this.RIGHT_BUFFER_SIZE; i++){
                    let np = this.shadow.querySelector('[pos="'+i+'"]');
                    this.swapPlayers(p,np);
                    np.pause().catch(function(){});
                }
            }

            p.setSourcePromise().catch(function(err){});
            return this.shadow.querySelector('[pos="0"]');
        }
        let p = this.shadow.querySelector('[pos="'+this.RIGHT_BUFFER_SIZE+'"]');
        for (let i = this.RIGHT_BUFFER_SIZE-1; i>=-this.LEFT_BUFFER_SIZE; i--){
            let np = this.shadow.querySelector('[pos="'+i+'"]');
            this.swapPlayers(p,np);
            np.pause().catch(function(){});
        }
        p.setSourcePromise().catch(function(err){});
        return this.shadow.querySelector('[pos="0"]');
    }
    removeListiners(player){
        player.removeEventListener("statusupdate", this.onStatusUpdate);

        player.removeEventListener("waiting", this.onLoading);
        player.removeEventListener("loadstart", this.onLoading);
//        player.removeEventListener("seeking", this.onSeeking);
//        player.removeEventListener("seekend", this.onSeekend);
        player.removeEventListener("ended", this.onPlayNextBlock);
        player.removeEventListener("error", this.onPlayNextBlock);
        player.removeEventListener("timeupdate", this.onTimeUpdateEvent);
        player.removeEventListener("loadedmetadata", this.onLoadedmetadata);
    }
    setSourceListObserver(v){
        let self = this;
        this.source_list_element = v;
        this.source_list_observer = new MutationObserver(function(mutations) {self.onSourceListChange(mutations);});
        this.source_list_observer.observe(v, {childList: true}); // attributes: true, characterData: true, subtree: true, attributeOldValue: true, characterDataOldValue: true,
    }
    onSourceListChange(mutations){
        this.updateCache();
    }
    setPlaybackRatePromise(speed){
        if ((typeof CKVideoReverse==="undefined" || this.getAttribute('noreverse')!==null) && speed<0) speed=0;
        let self = this;
        const player = this.shadow.querySelector('[pos="0"]');
        this.speed = speed;
        if (speed>=0) this.removeAttribute('reverseplay');
        else this.setAttribute('reverseplay','');
        return player.setPlaybackRatePromise(speed).finally(function(){
            if (parseInt(player.getAttribute('pos'))!==0) return;
            if (self.getAttribute('autoplay')!==null)
                return player.play().catch(function(){});
        }).catch(function(){});
    }

    setTimePromise(utctime){
//if (utctime===0) debugger;
        if (this.getAttribute('playtime')!==null && parseInt(this.getAttribute('playtime'))==utctime)
            return new Promise(function(resolve, reject){resolve();});
        this.shift_to_more = (this.last_time||0) <= utctime;
        this.last_time = utctime;
        let self = this;
        for (let i=-self.LEFT_BUFFER_SIZE; i<=self.RIGHT_BUFFER_SIZE; i++){
            if (i===0) continue;
            let p = this.shadow.querySelector('[pos="'+i+'"]');
            if (!p.isLoaded() || p.isSeeking()){
                p.setSourcePromise();
//                console.log('Player '+p.getAttribute('pos')+' set to empty');
            }
        }

        let player = this.shadow.querySelector('[pos="0"]');
        if (!player.isPlaying() && !player.isWaiting()){
            if (isNaN(utctime))
                debugger;
            this.prev_time = parseInt(this.getAttribute('playtime')||0);
            this.setPlayTime(utctime);
        }
        let source_data = this.speed<0 ? this.getLastSrcBeforeTime(utctime+1) : this.getFirstSrcFromTime(utctime);
        if (this.speed>=0 && source_data && source_data.time>utctime)
            source_data = this.getLastSrcBeforeTime(utctime);
        if (self.getAttribute('autoplay')===null && (!source_data || utctime<source_data.time || utctime>=source_data.time+source_data.msec)){
            this.setStatus('nodata');
        } else {
            let op = source_data&&source_data.src ? this.getPlayerWithSrc(source_data.src) : undefined;
            if (op && op!==player){
                this.swapPlayers(player,op);
                player = op;
            }
        }
        this.setStatus(this.getAttribute('autoplay')!==null ? 'playing' : 'pause');
        return player.setTimeWithSourcePromise(utctime, this.speed<0, true).catch(function(){}).then(function(){
            self.updateCache();
        }).catch(function(e){
let a=e;
        });
    }
    getTime(){
        const player = this.shadow.querySelector('[pos="0"]');
        return player.currentUtcTime();
    }
    swapPlayers(v1, v2){
        let pos1 = parseInt(v1.getAttribute('pos'));
        let pos2 = parseInt(v2.getAttribute('pos'));
        if (pos1 == pos2 || v1==v2) return;
        if (pos1==0) this.removeListiners(v1);
        if (pos2==0) this.removeListiners(v2);

        v1.setAttribute('pos',pos2);
        v2.setAttribute('pos',pos1);

        if (pos1==0) this.setListiners(v2);
        if (pos2==0) this.setListiners(v1);
        this.event_videochanged.video = this.shadow.querySelector('[pos="0"]');
        this.dispatchEvent(this.event_videochanged);
    }
    getPlayerWithSrc(src){
        if (!src) return;
        for (let i=-this.LEFT_BUFFER_SIZE; i<=this.RIGHT_BUFFER_SIZE; i++) {
            let p = this.shadow.querySelector('[pos="'+i+'"]');
            if (p.src==src)
                return p;
        }
    }
    getEmptyPlayer(){
        for (let i=-this.LEFT_BUFFER_SIZE; i<=this.RIGHT_BUFFER_SIZE; i++) {
            let p = this.shadow.querySelector('[pos="'+i+'"]');
            if (p.isEmpty())
                return p;
        }
    }
    invalidate(){
        let self = this;
        return this.pause().finally(function(){
            for (let i=-self.LEFT_BUFFER_SIZE; i<=self.RIGHT_BUFFER_SIZE; i++){
                let p = self.shadow.querySelector('[pos="'+i+'"]');
                p.setSourcePromise().catch(function(){});
                p.poster='';
                p.removeAttribute('poster');
                p.load();
            }
            self.setStatus('nodata');
//            self.updateCache();
        }).catch(function(){});
    }
    updateCache(){
        let self = this;
        let player = this.shadow.querySelector('[pos="0"]');
        if (!player) return;
        let playtime = parseInt(this.getAttribute('playtime'));
        if (isNaN(playtime)){
            playtime = this.getLastTime();
            if (playtime!==undefined){
                this.setPlayTime(playtime);
                setTimeout(function(){self.sendTimeUpdate();},0);
            } else
                playtime = new Date().getTime();
            this.setAttribute('playtime',playtime);
        }

        let last_left = player.getFirstTime()!==undefined ? player.getFirstTime() : playtime;
        let last_right = player.getInitialLastTime()!==undefined ? player.getInitialLastTime()+1 : playtime; 
if (last_right<1000000) debugger;
        let no_data_before, no_data_from;
        function tryToRight(onlymain){
            for (let i=0; i<=self.RIGHT_BUFFER_SIZE; i++) {
                if (i==0 && !player.isEmpty()) continue;
                if (onlymain && i>0) return;
                let p = self.shadow.querySelector('[pos="'+i+'"]');
                if (i!=0) p.pause().catch(function(){});
                let src = self.getFirstSrcFromTime(last_right);
                if (!src && (no_data_from===undefined || no_data_from>last_right)){
                    no_data_from = last_right;
                    self.setAttribute('reqfrom',no_data_from);
                } else
                if ((!p.src && !src) || (src && p.src == src.src)) {
                    if (src) last_right = src.time+src.msec;
if (last_right<1000000) debugger;
                    continue;
                }
                if (src && i==0 && src.time>last_right){
                    continue;
                }
                let op = src && src.src ? self.getPlayerWithSrc(src.src) : undefined;
                if (op){
                    self.swapPlayers(p,op);
                    last_right = op.getInitialLastTime()+1;
if (last_right<1000000) debugger;
                    op.setTimeWithSourcePromise(op.getFirstTime(),false,true).catch(function(){});
                    continue;
                }
                if (!src)
                    p.setSourcePromise().catch(function(){});
                else {
                    if (last_left>src.time-1) last_left=src.time-1;
                    p.setTimeWithSourcePromise(last_right,false).catch(function(){});
                    last_right = src.time+src.msec;
if (last_right<1000000) debugger;
                }
            }
        }
        function tryToLeft(){
            for (let i = 0; i<=self.LEFT_BUFFER_SIZE; i++) {
                if (i==0 && !player.isEmpty()) continue;
                let p = self.shadow.querySelector('[pos="'+(i>0?'-':'')+i+'"]');
                p.pause().catch(function(){});
                let src = self.getLastSrcBeforeTime(last_left);
                if (!src && (no_data_before===undefined || no_data_before<last_left)){
                    no_data_before = last_left;
                    self.setAttribute('reqbefore',no_data_before);
                }
                if ((!p.src && !src) || (src && p.src == src.src)) {
                    if (src) last_left = src.time;
                    continue;
                }
                let op = src && src.src ? self.getPlayerWithSrc(src.src) : undefined;
                if (op){
                    self.swapPlayers(p,op);
                    last_left = op.getFirstTime();
                    op.setTimeWithSourcePromise(op.getFirstTime(),false,true).catch(function(){});
                    continue;
                }
                if (!src)
                    p.setSourcePromise().catch(function(){});
                else {
                    if (last_right<src.time+src.msec) last_right=src.time+src.msec;
if (last_right<1000000) debugger;
                    p.setTimeWithSourcePromise(last_left-1,true).catch(function(){});
                    last_left = src.time;
                }
            }
        }
        if (this.prev_time < playtime){
//            tryToRight(true);
            tryToRight();
            tryToLeft();
        } else {
            tryToRight();
            tryToLeft();
        }
        if (player.isEmpty() || player.isError() || player.isOutOfBound() || playtime<player.getFirstTime() || playtime>player.getLastTime())
            this.setStatus('nodata');
        else if (player.isPlaying())
            this.setStatus('playing');
        else
            this.setStatus('pause');

        if (no_data_before===undefined) this.removeAttribute('reqbefore');
        if (no_data_from===undefined) this.removeAttribute('reqfrom');
            this.onUpdateCache(no_data_before, no_data_from);
    }

    checkNextBlock(){
        if (this.speed>=0) return this.checkAfter();
        return this.checkBefore();
    }
    checkBefore(){
        let i = -this.LEFT_BUFFER_SIZE;
        for (; i<0; i++){
            let p = this.shadow.querySelector('[pos="'+i+'"]');
            if (!p.isEmpty()) break;
        }
        if (i==0) return false;
        return true;
    }
    checkAfter(){
        let i = 1;
        for (; i<=this.RIGHT_BUFFER_SIZE; i++){
            let p = this.shadow.querySelector('[pos="'+i+'"]');
            if (!p.isEmpty()) break;
        }
        if (i>this.RIGHT_BUFFER_SIZE) return false;
        return true;
    }
    getFirstSrcFromTime(from){
        let ret;
        for(let srcelement of this.source_list_element.children) {
            let time = srcelement.getAttribute('time');
            if (time!==null){
                time = parseInt(time);
                if (isNaN(time)) time=0;
            } else time=0;
            let msec = parseInt(srcelement.getAttribute('msec')) || 0;
            if (from<=time+msec-1 && (!ret || ret.time > time)){
                let src = srcelement.getAttribute('src');
                ret = {src:src,time:time,msec:msec};
            }
        }
        return ret;
    }
    getLastSrcBeforeTime(before){
        let ret;
        for(let srcelement of this.source_list_element.children) {
            let time = srcelement.getAttribute('time');
            let msec = srcelement.getAttribute('msec');
            let src = srcelement.getAttribute('src');
            if (time===null || msec===null || src===null) continue;
            time = parseInt(time);
            if (isNaN(time)) continue;
            msec = parseInt(msec);
            if (isNaN(msec)) continue;
            if (before>time && (!ret || ret.time < time)){
                let src = srcelement.getAttribute('src');
                ret = {src:src,time:time,msec:msec};
            }
        }
        return ret;
    }
    getLastTime(){
        let ret=0;
        for(let srcelement of this.source_list_element.children) {
            let time = srcelement.getAttribute('time');
            let msec = srcelement.getAttribute('msec');
            if (time===null || msec===null) continue;
            time = parseInt(time);
            if (isNaN(time)) continue;
            msec = parseInt(msec);
            if (isNaN(msec)) continue;
            if (ret<time+msec) ret=time+msec;
        }
        return ret;
    }
    disconnectedCallback(){
        this.invalidate();
        this.removeListiners(this.shadow.querySelector('[pos="0"]'));
        this.shadow.innerHTML='';
//        delete this.event_timeupdate;
        delete this.event_beforenextblock;
        delete this.event_afternextblock;
    }
    onUpdateCache(no_data_before, no_data_from){
    }

    getCss() {
        return `
iframe{position: absolute;left: 0;right: 0;top: 0;bottom: 0;width: 100%;height: 100%;border: 0;opacity: 0;z-index: -1000;}
.wplayers{width:100%;height:100%;position:relative;display:flex;}
.players{max-width:100%;max-height:100%;position:relative;margin: auto auto;width: 100%;height: 100%;}
.players>*{position:absolute;width:100%;height:100%;left:0;}
.posters_info{display: flex;display: flex;flex-direction: row;justify-content: space-between;align-items: baseline;}
.posters_info div:first-child,.posters_info div:last-child{font-size:80%;color: gray;}
.posters_info div:last-child{text-align:right;}
.posters_preview{width:100%;height:10px;border:1px solid gray;background-color:lightgray;position:relative}
.posters_preview div{display:inline-block;height:100%;position:absolute;min-width:1px;}
.posters_preview div.full{background-color:#ffff;}
.posters_preview div.empty{background-color:#000;}
.cachetable{width:100%;height:1em;display:flex;}
.cachetable > div{text-align:center;background:lightgray;flex:1;border:1px solid darkslategray;height:1.2em;width:20px;overflow:hidden;font-size:9px;margin-left:-1px;cursor:pointer;}
.cachetable .center{border:1px solid white;position:relative;z-index:1000;}
.cachetable .error{background:#ff5050;}
.cachetable .ready{background:#50ff50;}
.cachetable .wait{background:#ffff50;}
.players>*:not([pos="0"]),.players>*[status="error"]{visibility:hidden;}
.debuginfo{font-size:12px;position:absolute;background:#ffffffc0;padding:10px;z-index:10000;font-family:monospace;display:none;}
.cachetable > div:hover{border:1px solid blue;}
`;
    }
}

window.customElements.define('k-video-set', CKVideoSet);
class CTimeRange{
    constructor(default_data) {
        if (default_data!==undefined){
            this.range_data = [];
            this.default_data = default_data;
        }
        this.invalidate();
    }
    getView(no_width){
        let ft = this.getFirstTime();
        let range = this.getLastTime() - ft;
        let ars=[];
        for (let i=0;i<this.range_durations.length;i++){
            let w = Math.abs(this.range_durations[i]) / range;
            let t = (this.range_durations[i]>0?'full':'empty');
            if (i>0 && this.range_times[i-1]+Math.abs(this.range_durations[i-1])<this.range_times[i]){
                if (ars.length && ars[ars.length-1].t == '')
                    ars[ars.length-1].w += this.range_times[i]-this.range_times[i-1]-Math.abs(this.range_durations[i-1]);
                else
                    ars.push({s:(this.range_times[i-1]-ft)/range,w:(this.range_times[i]-this.range_times[i-1]-Math.abs(this.range_durations[i-1]))/range,t:''});
            }
            if (ars.length && ars[ars.length-1].t == t)
                ars[ars.length-1].w += w;
            else
                ars.push({s:(this.range_times[i]-ft)/range,w:w,t:t});
        }
        let ret1='',ret2='',ret3='';
        for (let i=0;i<ars.length;i++){
            if (ars[i].t=='full'){
                let w = no_width ? '' : 'width:'+(ars[i].w*100)+'%';
                ret1 += '<div class="'+ars[i].t+'" style="left:'+(ars[i].s*100)+'%;'+w+'"></div>';
            } else if (ars[i].t=='empty')
                ret2 += '<div class="'+ars[i].t+'" style="left:'+(ars[i].s*100)+'%;width:'+(ars[i].w*100)+'%"></div>';
            else
                ret3 += '<div class="'+ars[i].t+'" style="left:'+(ars[i].s*100)+'%;width:'+(ars[i].w*100)+'%"></div>';
        }
        return ret3+ret2+ret1;
    }
    invalidate(){
        if (this.abort_controller) this.abort_controller.abort();
        clearTimeout(this.preview_preload_timer);
        this.range_times = [];
        this.range_durations = [];
        if (this.range_data) this.range_data = [];
    }
    isEmpty(){
        return !this.range_times.length;
    }
    getFirstTime(){
        if (this.isEmpty()) return;
        return this.range_times[0];
    }
    getLastTime(){
        if (this.isEmpty()) return;
        return this.range_times[this.range_times.length-1] + Math.abs(this.range_durations[this.range_times.length-1]);
    }
    getFirstSpace(){
        if (this.isEmpty()) return;
        for (let i=0;i<this.range_times.length-1;i++){
            let l = this.range_times[i]+Math.abs(this.range_durations[i]);
            if (l !== this.range_times[i+1]) return l;
        }
    }
    getLastSpace(){
        if (this.isEmpty()) return;
        for (let i=this.range_times.length-1;i>0;i--)
            if (this.range_times[i-1]+Math.abs(this.range_durations[i-1]) !== this.range_times[i]) return this.range_times[i];
    }
    checkData(time){
        if (this.isEmpty()) return;
        for (let i=0;i<this.range_times.length;i++)
            if (this.range_times[i]<=time && this.range_times[i]+Math.abs(this.range_durations[i])>time) return this.range_durations[i]>0;
    }
    getRangeWithTime(time){
        for (let i=0;i<this.range_times.length;i++){
            if (time < this.range_times[i] || this.range_times[i]+Math.abs(this.range_durations[i]) <= time) continue;
            if (this.default_data===undefined)
                return {time:this.range_times[i],msec:this.range_durations[i]};
            return {time:this.range_times[i],msec:this.range_durations[i],src:this.range_data[i].s,off:this.range_data[i].o};
        }
    }
/*
    getNearCached(time, reverse){
        if (reverse){
            for (let i=this.range_times.length-1;i>=0;i--)
                if (this.range_times[i]<time && this.range_data[i].s.substr(0,5)==='blob:')
                    return {s:this.range_data[i].s,t:this.range_times[i],o:this.range_data[i].o};
        } else {
            for (let i=0;i<this.range_times.length;i++)
                if (this.range_times[i]>=time && this.range_data[i].s.substr(0,5)==='blob:')
                    return {s:this.range_data[i].s,t:this.range_times[i],o:this.range_data[i].o};
        }
    }
*/
    getNearCached(time){
        let i=0;
        for (;i<this.range_times.length;i++)
            if ((i==this.range_times.length-1 || this.range_times[i+1]>=time) && this.range_data[i].s.substr(0,5)==='blob:') 
                break;
        if (i==this.range_times.length) return;
        let j=i+1;
        for (;j<this.range_times.length;j++)
            if (this.range_data[j].s.substr(0,5)==='blob:') 
                break;
        if (j!=this.range_times.length && this.range_times[j]-time < time-this.range_times[i])
            return {s:this.range_data[j].s,t:this.range_times[j],o:this.range_data[j].o};
        return {s:this.range_data[i].s,t:this.range_times[i],o:this.range_data[i].o};
    }
    getNearByStartTime(time){
        if (!this.range_times.length) return;
        if (this.range_times.length<2) return {s:this.range_data[0].s,t:this.range_times[0],o:this.range_data[0].o};
        if (this.range_times[this.range_times.length-1]<=time) return {s:this.range_data[this.range_times.length-1].s,t:this.range_times[this.range_times.length-1],o:this.range_data[this.range_times.length-1].o};
        let i=0,j=-1;
        for (;i<this.range_times.length;i++){
            if (this.range_durations[i]>=0 && this.range_times[i]>=time)
                break;
            if (this.range_durations[i]>=0) j=i;
        }
        if (i>=this.range_times.length && j<0) return;
        if (i<this.range_times.length && j<0) return {s:this.range_data[i].s,t:this.range_times[i],o:this.range_data[i].o};
        if (i>=this.range_times.length && j>=0) return {s:this.range_data[j].s,t:this.range_times[j],o:this.range_data[j].o};

        if (this.range_times[i]-time < time-this.range_times[j])
            return {s:this.range_data[i].s,t:this.range_times[i],o:this.range_data[i].o};
        return {s:this.range_data[j].s,t:this.range_times[j],o:this.range_data[j].o};
    }
    getIndexFromTime(time){
        if (this.default_data===undefined) return;
        for (let i=0;i<this.range_times.length;i++){
            if (this.range_times[i]>time) break;
            if (time <= this.range_times[i]+Math.abs(this.range_durations[i])) 
                return i;
        }
    }
    getDataFromTime(time){
        if (this.default_data===undefined) return;
        for (let i=0;i<this.range_times.length;i++){
            if (time < this.range_times[i] || this.range_times[i]+Math.abs(this.range_durations[i]) <= time) continue;
            return {s:this.range_data[i].s,t:this.range_times[i],o:this.range_data[i].o};
        }
    }
    setDataFromData(new_data, old_data){
        for (let i=0;i<this.range_times.length;i++){
            if (this.range_data[i].s===old_data){
                this.range_data[i].s = new_data;
                break;
            }
        }
    }
    getFirstKnownTime(time, reverse){
        if (this.isEmpty()) return;
        if (!reverse)
            for (let i=0;i<this.range_times.length;i++){
                if (this.range_durations[i]<0) continue;
                if (this.range_times[i]<=time && this.range_times[i]+this.range_durations[i]>time) return time;
                if (this.range_times[i]<time) continue;
                if (this.range_durations[i]>0) return this.range_times[i];
            }
        else 
            for (let i=this.range_times.length-1;i>=0; i--){
                if (this.range_times[i]>=time || this.range_durations[i]<0) continue;
                if (this.range_times[i]+this.range_durations[i]>time) return time;
                if (this.range_times[i]+this.range_durations[i]<=time) return this.range_times[i]+this.range_durations[i];
            }
    }
    checkRange(from, to){
        if (this.isEmpty()) return;
        for (let i=0;i<this.range_times.length;i++){
            if (this.range_durations[i]<0) continue;
            let e = this.range_times[i]+Math.abs(this.range_durations[i]);
            if ((this.range_times[i]>=from && this.range_times[i]<to) || (e>=from && e<to) || (this.range_times[i]<from && e>to)) return true;
        }
        return false;
    }
    autoPreload(right_time,preload_interval){
        let PRELOAD_INTERVAL = preload_interval || 10000*60;
        let self = this;
        this.preview_autoload_time = right_time;
        this.preview_reload = true;
        if (this.preview_preload_timer) return;
        function preload(url){
            self.abort_controller = new AbortController();
            return fetch(url,{signal:self.abort_controller.signal, headers: { range: 'bytes=0-100000000' } }).then(function(res){
                return res.blob().then(function(blob){
                    return window.URL.createObjectURL(blob);
                });
            }).finally(function(){
                self.abort_controller = undefined;
            });
        }
        function preload_preview(){
            if (!self.range_times || !self.range_times.length) {
                self.preview_preload_timer = undefined;
                return;
            }
            // Search first preloaded block
            let fb=-1;
            for (let i=self.range_times.length-1; i>=0;i--)
                if (self.range_data[i].p){
                    fb = i;break;
                }
            let nb=-1;
            if (fb>=0) {
                let tfb = fb;
                for (let i=fb-1; i>=0;i--){
                    if (self.range_data[i].p || !self.range_data[i].s){
                        tfb=i;
                        continue;
                    }
                    if (self.range_times[i] < self.range_times[tfb]-PRELOAD_INTERVAL && (!i || (!self.range_data[i-1].p && self.range_data[i-1].s))){
                        nb = i;break;
                    }
                }
            }
            if (fb>=0 && nb<0) for (let i=fb+1; i<self.range_times.length;i++){
                if (self.range_times[i] >= self.range_times[fb]+PRELOAD_INTERVAL){
                    nb = i;break;
                }
            }
            if (fb>=0 && nb<=0) {
                self.preview_preload_timer = undefined;
                return;
            }
            if (nb<=0) nb=self.range_data.length-1;

            let preload_time = self.range_times[nb];
//console.log('Preload image at '+new Date(preload_time).toLocaleString());
            return preload(self.range_data[nb].s).then(function(burl){
                let autoload_index=self.range_times.length-1;
                for (;autoload_index>=0;autoload_index--)
                    if (self.range_times[autoload_index]===preload_time)
                        break;
                if (autoload_index>=0 && self.range_data && self.range_data[autoload_index]){
                    self.range_data[autoload_index].s = burl;
                    self.range_data[autoload_index].p = true;
                }
                return preload_preview();
            }, function(error){
                let autoload_index=self.range_times.length-1;
                for (;autoload_index>=0;autoload_index--)
                    if (self.range_times[autoload_index]===preload_time)
                        break;
                if (autoload_index>=0 && self.range_data && self.range_data[autoload_index])
                    self.range_data[autoload_index].p = true;
                return preload_preview();
            });
        }
        this.preview_preload_timer = setTimeout(preload_preview,0);
    }
    addSpace(time, duration){
if (time+Math.abs(duration) > new Date().getTime()) debugger;
        let self = this;
        if (!duration) return;
        let TIMEEND = time+Math.abs(duration);
        function RANGEEND(index){return !self.range_times || self.range_times.length<=index ? 0 : self.range_times[index]+Math.abs(self.range_durations[index]);}
        for (let i=this.range_times.length-1;i>=0;i--){
            if (this.range_times[i]>=TIMEEND) continue;
            if (RANGEEND(i)<time) break;
            let sgn = this.range_durations[i] < 0 ? -1 : 1;
            // Если новый блок полностью включает в себя этот, то убиваем его
            if (time<=this.range_times[i] && RANGEEND(i)<=TIMEEND){
                this.range_times.splice(i, 1);
                this.range_durations.splice(i, 1);
                if (this.range_data) this.range_data.splice(i, 1);
                continue;
            }
            // Если это блок с данными, и новый блок как то его касается то убиваем его
            if (this.range_data && this.range_data[i].s!==this.default_data && (this.range_times[i]>time && time<RANGEEND(i) || this.range_times[i]>TIMEEND && TIMEEND<RANGEEND(i))){
                this.range_times.splice(i, 1);
                this.range_durations.splice(i, 1);
                if (this.range_data) this.range_data.splice(i, 1);
                continue;
            }
            // Если новый блок полностью внутри этого, то режем его пополам с незанятым местом внутри
            if (this.range_times[i]<time && TIMEEND<RANGEEND(i)){
                this.range_times.splice(i+1, 0, TIMEEND);
                this.range_durations.splice(i+1, 0, (RANGEEND(i) - TIMEEND) * sgn);
                if (this.range_data) this.range_data.splice(i+1, 0, {s:''});
                this.range_durations[i] = (time - this.range_times[i]) * sgn;
                continue;
            }
            // Если в текущий блок попадает время начала нового блока, то укорачиваем его
            if (this.range_times[i]<time && time<=RANGEEND(i)){
                this.range_durations[i] = (time - this.range_times[i]) * sgn;
                continue;
            }
            // Если в текущий блок попадает время конца нового блока, то подрезаем его спереди
            if (this.range_times[i]<TIMEEND && TIMEEND<RANGEEND(i)){
                this.range_durations[i] = (Math.abs(this.range_durations[i]) - (TIMEEND-this.range_times[i]))*sgn;
                this.range_times[i] = TIMEEND;
                continue;
            }
        }
        for (let i=this.range_times.length-1;i>=0;i--)
            if (RANGEEND(i)<=time) return i+1;
        return 0;
    }
    // Проверка, если указанное время уже полностью есть
    checkIncluded(time, duration){
        if (duration<0 || this.isEmpty()) return;
        let fti,lti;
        for (let i=0;i<this.range_times.length;i++){
            if (this.range_times[i]>time) continue;
            if (this.range_durations[i]<0) {
                if (fti!==undefined) break;
                continue;
            }
            if (fti===undefined) {fti = lti = i;continue}
            if (this.range_times[i-1]+this.range_durations[i-1]!=this.range_times[i]+this.range_durations[i])
                break;
            lti = i;
        }
        if (fti===undefined) return false;
        if (this.range_times[fti]<=time && (time+duration<=this.range_times[lti]+this.range_durations[lti]))
            return true;
        return false;
    }
    // Удаляем все блоки, которые полностью находятся внутри указанного диапазона
    removeIncluded(time, duration){
        for (let i=this.range_times.length-1;i>=0;i--){
            if (this.range_times[i] > time+Math.abs(duration)) continue;
            if (this.range_times[i]+Math.abs(this.range_durations[i]) < time) break;
            if (time <= this.range_times[i] && this.range_times[i]+Math.abs(this.range_durations[i]) <= time+Math.abs(duration)){
                this.range_times.splice(i, 1);
                this.range_durations.splice(i, 1);
                if (this.range_data) this.range_data.splice(i, 1);
            }
        }
    }
    addToRange(time, duration, data){
        if (!duration) return;
        if (this.default_data===undefined) data = undefined;
        else if (data===undefined) data = this.default_data;
        data = {s:data};
        let self = this;
        function RANGEEND(index){return !self.range_times || self.range_times.length<=index ? 0 : self.range_times[index]+Math.abs(self.range_durations[index]);}

        let block_before;
        if (this.range_data && duration>0){
            if (this.checkIncluded(time, duration)) return;
            this.removeIncluded(time, duration);
            let left_block = this.getIndexFromTime(time);
            if (left_block!==undefined){
                if (this.range_durations[left_block]<0 || !this.range_data || this.range_data[left_block]===this.default_data)
                    this.range_durations[left_block] = time - this.range_times[left_block];
                else {
                    data.o = (data.o||0) + this.range_times[left_block]+this.range_durations[left_block] - time;
                    duration = time + duration - this.range_times[left_block]-this.range_durations[left_block];
                    time = this.range_times[left_block]+this.range_durations[left_block];
                }
            }
            let right_block = this.getIndexFromTime(time+duration);
            if (right_block!==undefined){
                if (this.range_durations[right_block]<0 || !this.range_data || this.range_data[left_block]===this.default_data){
                    this.range_durations[right_block] = (this.range_times[right_block]+Math.abs(this.range_durations[right_block]) - time-duration) * (this.range_durations[right_block]>0?1:-1);
                    this.range_times[right_block] = time+duration;
                } else {
                    this.range_data[right_block].o = (this.range_data[right_block].o||0) + time+duration - this.range_times[right_block];
                    this.range_durations[right_block] = this.range_times[right_block]+this.range_durations[right_block] - time-duration;
                    this.range_times[right_block] = time+duration;
                }
                block_before = right_block;
            } else {
                for (block_before=this.range_times.length-1;block_before>=0;block_before--)
                    if (this.range_times[block_before]<=time)
                        break;
                block_before++;
            }
        } else 
            block_before= this.addSpace(time,duration);
    
        // Вставляем требуемый элемент
        this.range_times.splice(block_before, 0, time);
        this.range_durations.splice(block_before, 0, duration);
        if (this.range_data) this.range_data.splice(block_before, 0, data);

        // Объединяем общие куски
        for (let i=this.range_times.length-2;i>=0; i--){
            if ( (this.range_data && (this.range_data[i].s!==this.default_data || this.range_data[i+1].s!==this.default_data)) || (this.range_durations[i]>=0 && this.range_durations[i+1]<0) 
                || (this.range_durations[i]<0 && this.range_durations[i+1]>=0)
                || RANGEEND(i)<this.range_times[i+1]) continue;
            this.range_durations[i] += this.range_durations[i+1];
            this.range_times.splice(i+1, 1);
            this.range_durations.splice(i+1, 1);
            if (this.range_data) this.range_data.splice(i+1, 1);
        }
    }
}

class CKVideoAsync extends CKVideoSet{
    get VIDEO_LIMIT(){return this.options.video_limit || 1000;};
    constructor() {
        super();
        this.base_url = undefined;
        this.records_cache = new CTimeRange('');
        this.mean_duration = 60000;
        this.max_buffer_duration = 10*60*1000;
        this.options = this.getAttribute('options')===null ? {} : JSON.parse(this.getAttribute('options'));
    }
    onCacheUpdated(){
        this.innerHTML = this.innerHTML==''?' ':'';
    }
    invalidateCache(){
        this.records_cache.invalidate();
        this.no_data_before=undefined;
        this.no_data_from=undefined;
    }
    invalidate(){
        this.invalidateCache();
        return super.invalidate();
    }
    rangeRequest(from, to, interval){
        return {times:this.records_cache.range_times,durations:this.records_cache.range_durations};
    }
    getUrl(index){
        if (typeof this.decompressUrl !== 'function') return this.urls[index];
        return this.decompressUrl(this.urls[index]);
    }
    checkDataExist(time_from, time_to){
        return false;
    }
    loadRecords(req_time,reverse,limit){
        let self = this;
        if (this.load_records_promise) throw 'load already started';
        let prom = this.onGetData(req_time,reverse,limit);
        this.load_records_promise = prom.then(function(r){
            self.load_records_promise = undefined;
            let m=0; let c=0;
            // Если это был прямой поиск, и конец первого элемента на микросекунды больше искомого то удаляем его
            if (!reverse && r.objects.length && (new Date(r.objects[0]['end']+'Z')).getTime() == req_time)
                r.objects.shift();
            for (let i in r.objects){
                let st = (new Date(r.objects[i]['start']+'Z')).getTime();
                let et = (new Date(r.objects[i]['end']+'Z')).getTime();
                if (isNaN(et) || isNaN(st)){
                    console.warn('Invalid time value for archive block');
                    continue;
                }
                let duration = et - st;
                if (duration<=0){
                    console.warn('Invalid duration for archive block');
                    continue;
                }
                if (duration>0) {m+=duration;c++;}
                if (!reverse && st-req_time>0 && !self.checkDataExist(req_time, st))
                    self.records_cache.addToRange(req_time, req_time - st, '');
                if (reverse && req_time-et>0 && !self.checkDataExist(et, req_time))
                    self.records_cache.addToRange(et, et - req_time, '');
                req_time = reverse ? st : et;
                self.records_cache.addToRange(st, duration, r.objects[i]['url']);
            }
            // Добавляем пустоту от начала времен до self.times[0]
//            if (reverse && self.times.length>0 && r.objects.length!=self.VIDEO_LIMIT && !self.checkDataExist(0, self.times[0])){
//                self.add('', 0, -self.times[0]);
//            }
            if (!r.objects.length && reverse && !self.checkDataExist(0, req_time))
                self.records_cache.addToRange(0, -req_time, '');
            if (c) self.mean_duration = parseInt(m/c);
            return r;
        },function(e){
            self.load_records_promise = undefined;
            throw e;
        });
        this.load_records_promise.abort_controller = prom.abort_controller;
        return this.load_records_promise;
    }
    loadData(){
        if (this.load_records_promise) return;
        clearTimeout(this.load_records_timer);
        this.load_records_promise = true;
        let self = this;
//        if (this.no_data_before===undefined && this.no_data_from===undefined) return new Promise(function(resolve, reject){resolve();});
        if (this.no_data_from!==undefined && this.getFirstSrcFromTime(this.no_data_from,true)!==undefined) this.no_data_from=undefined;
        if (this.no_data_before!==undefined && this.getLastSrcBeforeTime(this.no_data_before,true)!==undefined) this.no_data_before=undefined;
        this.load_records_promise = undefined;
        if (this.no_data_before===undefined && this.no_data_from===undefined) return new Promise(function(resolve, reject){resolve();});

//        if (this.no_data_from > new Date().getTime()) this.no_data_from = this.times[this.times.length-1]+Math.abs(this.durations[this.times.length-1]);

        let reverse = !this.no_data_from;
        let no_data_before = this.no_data_before;
        if (reverse && this.no_data_before===undefined || !reverse && this.no_data_from===undefined) return;
        let req_time = reverse ? this.no_data_before: this.no_data_from;
        let prom = this.loadRecords(req_time,reverse,this.VIDEO_LIMIT);
        let load_data_promise = prom.then(function(r){
            if (!reverse && !r.objects.length && !self.records_cache.isEmpty() && self.records_cache.getLastTime() <= self.no_data_from){
                return new Promise(function(resolve, reject){
                    self.load_records_timer = setTimeout(function(){resolve()},5000);
                }).then(function(){
                    return self.loadData();
                });
            }
            if (!reverse)
                self.no_data_from=undefined;
            else
                self.no_data_before=undefined;
            if (reverse){
                if (r.objects.length!=self.VIDEO_LIMIT)
                    if (self.records_cache.range_times[0])
                        self.min_archive_time = self.records_cache.range_times[0];
                    else
                        self.min_archive_time = no_data_before;
            }
            if (reverse) self.no_data_before=undefined; else self.no_data_from=undefined;
            self.onCacheUpdated();
            return self.loadData();
        }).catch(function(){
            return self.loadData();
        });
        load_data_promise.abort_controller = prom.abort_controller;
        return load_data_promise;
    }
/*
    clearBufferIfNeed(time){
        if (this.durations.length) {
            let st = this.times[0];
            let et = this.times[this.times.length-1]+Math.abs(this.durations[this.durations.length-1]);
            if (time<st) st=time;
            if (time>et) et=time;
            if (et-st>this.max_buffer_duration){
                this.times = [];
                this.durations.splice(0,this.durations.length);
                this.urls = [];
                this.thumbnails = [];
            }
        } 
    }
*/
    get NOLOAD_DURATION(){return 0;};

    getFirstSrcFromTime(from, noload){
        if (this.options.onlypreview && this.getAttribute('autoplay')===null) return;
if (from<100000) debugger;
        let self = this;
        if (this.records_cache.range_times.length && from < this.records_cache.range_times[0]) {
            this.records_cache.invalidate();
        }
        if (!this.records_cache.range_durations.length) {
            if (this.no_data_from !== from){
                this.no_data_from = from;
                self.loadData();
            }
            this.redux.post(this,'first_record_from_time',{time:from,debug:'none records from '+(new Date(parseInt(from)).toISOString().replace('T',' '))});
            return;
        }
        let i;let last;
        for (i=0; i<this.records_cache.range_times.length;i++){
            if (last && from >=last && from < this.records_cache.range_times[i] - this.NOLOAD_DURATION)
                break;
            if (this.records_cache.range_durations[i]>=0 && from < this.records_cache.range_times[i] + Math.abs(this.records_cache.range_durations[i])){
                if (this.records_cache.range_times[i] <= from){
                    this.redux.post(this,'first_record_from_time',{time:from,debug:''+(new Date(parseInt(from)).toISOString().replace('T',' ')+' is '+(new Date(this.records_cache.range_times[i]).toISOString())+' '+this.records_cache.range_durations[i]+'ms')});
                    return {time:this.records_cache.range_times[i],msec:this.records_cache.range_durations[i],src:this.records_cache.range_data[i].s,off:this.records_cache.range_data[i].off};
                }else{
                    this.redux.post(this,'first_record_from_time',{time:from,debug:'empty '+(new Date(parseInt(from)).toISOString().replace('T',' ')+' is '+(new Date(this.records_cache.range_times[i]).toISOString())+' '+this.records_cache.range_durations[i]+'ms')});
                    return {time:from,msec:this.records_cache.range_times[i]-from,src:''};
                }
            }
            last = this.records_cache.range_times[i] + Math.abs(this.records_cache.range_durations[i]);
        }

        if (noload) return;
        if (this.records_cache.range_durations.length) {
            if (i>this.records_cache.range_durations.length-1) i=this.records_cache.range_durations.length-1;
            if (last && from >=last && from < this.records_cache.range_times[i])
                this.no_data_from = from;
            else
                this.no_data_from = this.records_cache.range_times[i]+Math.abs(this.records_cache.range_durations[i]);
        }

        this.redux.post(self,'first_record_from_time',{time:from,debug:'try load records from '+(new Date(parseInt(from)).toISOString().replace('T',' '))});
        this.loadData();
    }
    getLastSrcBeforeTime(before, noload){
        if (this.options.onlypreview && this.getAttribute('autoplay')===null) return;
//console.log('getLastSrcBeforeTime: '+new Date(before).toISOString());
        if (before<=0) debugger;
        let self = this;
        if (!this.records_cache.range_durations.length) {
            if (this.no_data_before===0) return;
            this.no_data_before = before;
            this.redux.post(self,'last_record_before_time',{time:before,debug:'try load records before '+(new Date(parseInt(before)).toISOString().replace('T',' '))});
            this.loadData();
            return;
        }
        let i;
        for (i=this.records_cache.range_times.length-1;i>=0;i--)
            if (this.records_cache.range_times[i] < before){
                if (this.records_cache.range_durations[i]>=0)
                    if (this.records_cache.range_times[i]+this.records_cache.range_durations[i] < before){
                        this.redux.post(this,'last_record_before_time',{time:before,debug:'empty '+(new Date(parseInt(before)).toISOString().replace('T',' ')+' is '+(new Date(this.records_cache.range_times[i]).toISOString())+' '+this.records_cache.range_durations[i]+'ms')});
                        return {time:this.records_cache.range_times[i]+this.records_cache.range_durations[i],msec:before-this.records_cache.range_times[i]-this.records_cache.range_durations[i],src:''};
                    }else{
                        this.redux.post(this,'last_record_before_time',{time:before,debug:''+(new Date(parseInt(before)).toISOString().replace('T',' ')+' is '+(new Date(this.records_cache.range_times[i]).toISOString())+' '+this.records_cache.range_durations[i]+'ms')});
                        return {time:this.records_cache.range_times[i],msec:this.records_cache.range_durations[i],src:this.records_cache.range_data[i].s,off:this.records_cache.range_data[i].off};
                    }
//                break;
            }
        if (noload || this.records_cache.range_times.length>0 && this.records_cache.range_times[0]==0) return;
        this.no_data_before = before;
if (this.no_data_before<1000) debugger;

        if (this.records_cache.range_durations.length) {
            if (i<0) i=0;
            this.no_data_before = this.records_cache.range_times[i]-1;
if (this.no_data_before<1000) debugger;

        }
        this.redux.post(this,'last_record_before_time',{time:before,debug:'try load records before '+(new Date(parseInt(before)).toISOString().replace('T',' '))});
        this.loadData();
    }
    getLastTime(){
        if (!this.records_cache.range_durations.length) return;
        return this.records_cache.range_times[this.records_cache.range_times.length-1] + Math.abs(this.records_cache.range_durations[this.records_cache.range_durations.length-1]);
    }
    sendRangeUpdate(times,durations){
        this.redux.post(this,'time_line_update',{times:times,durations:durations});
    }
    getRanges(from, to, interval){
        return {times:[],durations:[]};
    }
    compressUrl(url){
        return url;
    }
    decompressUrl(url){
        return url;
    }
    onGetData(time,reverse,limit){
        return [];
    }
    disconnectedCallback(){
        this.invalidateCache();
        super.disconnectedCallback();
    }
}

//window.customElements.define('k-video-async', CKVideoAsync, {extends: 'video'});
class CKVgxVideo extends CKVideoAsync{
    get TIMELINE_LIMIT(){return this.options.timeline_limit || 1000;};
    constructor() {
        super();
        this.storage_timeline = new CTimeRange();
        this.options = this.getAttribute('options')===null ? {} : JSON.parse(this.getAttribute('options'));
        let self = this;
        this.posters = new CTimeRange('');
        setTimeout(function(){
            self.parent.addEventListener("timeupdate", function(e){
                setTimeout(function(){self.updatePoster(self.parent.currentUtcTime,false,true).catch(function(){});},0);
            },{once:false});
        });
    }
    updatePoster(time, fast, near_cached){
        if (!this.camera || this.isPlaying()) 
            return new Promise(function(resolve, reject){resolve();});
        if (this.get_thumbnails_promise) {
            this.next_time = time;
            return this.get_thumbnails_promise;
        }
        this.next_time = undefined;
        let self = this;
        if (near_cached){
            let data = this.posters.getNearCached(time,!(!this.last_poster_time || time < this.last_poster_time));
            if (data) {
                this.setPoster(data.s, true, true);
                clearTimeout(this.accuracy_poster_time);
                let d = this.posters.getNearByStartTime(time);
                if (!d || data.t !== d.t){
                    this.accuracy_poster_time = setTimeout(function(){
                        self.updatePoster(time);
                    },300);
                }
                return new Promise(function(resolve, reject){resolve();});
            }
        }

        if (this.posters.checkData(time)){
            let data = this.posters.getNearByStartTime(time);
            if (data) {
                if (this.get_thumbnails_promise) {
                    this.get_thumbnails_promise.abort_controller.abort();
                    this.get_thumbnails_promise = undefined;
                }
                this.setPoster(data.s, true, true).then(function(bloburl){
                    if (bloburl) self.posters.setDataFromData(bloburl,data.s);
                });
            }
            this.last_poster_time = time;
            return new Promise(function(resolve, reject){resolve(data);});
        }
        this.last_poster_time = time;
        let prev_camera_id = this.camera.id;
        if (fast || !this.getPoster()){
            this.setState('previewing');
            this.get_thumbnails_promise = this.camera.getStorageThumbnails(time,true,1);
            this.get_thumbnails_promise.then(function(r){
                self.get_thumbnails_promise = undefined;
                self.clearState('previewing');
                if (prev_camera_id !== self.camera.id) return;
                if (r.objects.length>0 && r.objects[0]['url'])
                    self.setPoster(r.objects[0]['url'], true, true);
                if (self.next_time) return self.updatePoster(self.next_time,false);
            },function(error){
                self.get_thumbnails_promise = undefined;
                self.clearState('previewing');
                if (prev_camera_id !== self.camera.id) return;
                if (self.next_time) return self.updatePoster(self.next_time,false);
            });
            return this.get_thumbnails_promise;
        }

        let time_before = self.posters.getFirstKnownTime(time,true);
if (time_before<100000) debugger;
        let time_after = self.posters.getFirstKnownTime(time,false);
        if (!time_after || time_after - time > 1*60*60*1000)
            time_after = time + 1*60*60*1000;
        if (time_after > new Date().getTime() - 100*1000) 
            time_after = new Date().getTime() - 100*1000;
        if (!time_before || time_before < time_after - 1*60*60*1000)
            time_before = time_after - 1*60*60*1000;

        this.setState('previewing');

        this.get_thumbnails_promise = this.camera.getStorageThumbnails(time_before,false,1000,undefined,time_after);
        this.get_thumbnails_promise.then(function(r){
            self.redux.post(self,'get_previews',{start_time:time_before,end_time:time_after,limit:1000,result:r.objects,debug:'found '+r.objects.length+' items from time '+(new Date(parseInt(time_before)).toISOString().replace('T',' '))+' to time '+(new Date(parseInt(time_after)).toISOString().replace('T',' '))});
            self.clearState('previewing');
            self.get_thumbnails_promise = undefined;
            if (prev_camera_id !== self.camera.id) return;

            if (!r || !r.objects || !r.objects.length/* || typeof self.onThumbnailsReceived !== 'function'*/) {
                let e = time_after;
                if (e > new Date().getTime() - 100*1000) e = new Date().getTime() - 100*1000;
                if (time_before<e)
                    self.posters.addToRange(time_before, time_before-e);
                return;
            }
            // Нужно "продлить" предыдущий кадр

            for (let i=0;i<r.objects.length;i++){
                let t = (new Date(r.objects[i]['time']+'Z')).getTime();
//                console.log('Preview: '+new Date(t).toLocaleString());
                let t2 = r.objects.length>i+1 ? (new Date(r.objects[i+1]['time']+'Z')).getTime() : time_after;
                self.posters.addToRange(t, t2-t, r.objects[i]['url']);
            }
            let data = self.posters.getDataFromTime(time);
            if (data) 
                self.setPoster(data.s, true, true);
            self.posters.autoPreload(time_after);
//            console.log('Previews '+self.posters.range_times.length);

            if (self.next_time) return self.updatePoster(self.next_time,false);
        },function(error){
            self.clearState('previewing');
            self.redux.post(self,'get_previews',{start_time:time_before,end_time:time_after,limit:1000,debug:' load fail from time '+(new Date(parseInt(time_before)).toISOString().replace('T',' '))+' to time '+(new Date(parseInt(time_after)).toISOString().replace('T',' '))});
            self.get_thumbnails_promise = undefined;
            if (prev_camera_id !== self.camera.id) return;
            if (self.next_time) return self.updatePoster(self.next_time,false);
        });
        return this.get_thumbnails_promise;
    }
    connectedCallback() {
        super.connectedCallback();
        let self = this;
        this.addEventListener("error", function(e){
            if (e && e.detail && e.detail.src && e.detail.src.error && e.detail.src.error.code===4)
                self.invalidate();
        });

    }
    get src(){
        return this.camera.token;
    }
    set src(token){
        let self = this;
        this.camera = VXG.CLOUD(token);
        this.invalidate().then(function(){
            self.updateCache();
            let t = self.currentUtcTime||(new Date().getTime());
            self.updateRange(t - 1000*60*60*24, t + 1000*60*60*24, 1000);
        });
    }
    invalidate(){
        this.storage_timeline.invalidate();
        this.posters.invalidate();
        return super.invalidate();
    }
    rangeRequest(from, to, interval){
        this.updateRange(from, to);
        return {times:this.storage_timeline.range_times,durations:this.storage_timeline.range_durations};
    }
    updateRange(from, to, delay){
//console.log('updateRange: '+(new Date(from).toISOString())+' '+(new Date(to).toISOString()));
        if (isNaN(from) || isNaN(to)) return;

        let self = this;
        this.range_from = from;
        this.range_to = to;
        if (this.update_range_timer) return;
        this.update_range_timer = setTimeout(function(){
            if (self.archive_right_time !==undefined && self.range_to>self.archive_left_time) self.range_to=self.archive_right_time;
            if (self.archive_left_time !==undefined && self.range_from<self.archive_right_time) self.range_from=self.archive_left_time;
            let from_time = self.range_from; 
            let to_time = self.range_to; 
            if (!self.storage_timeline.isEmpty()){
                let first = self.storage_timeline.getFirstSpace();
                let last = self.storage_timeline.getLastSpace();

                if (from_time>=self.storage_timeline.getFirstTime()){
                    if (first===undefined) from_time=self.storage_timeline.getLastTime();
                    else if (from_time<first) from_time=first;
                }
                if (to_time<=self.storage_timeline.getLastTime()){
                    if (last===undefined) to_time=self.storage_timeline.getFirstTime();
                    else if (to_time>last) to_time=last;
                }
            }
            if (from_time>=to_time - 15000) {
                self.update_range_timer = undefined;
                return;
            }
            self.onGetTimeline(from_time, to_time, self.TIMELINE_LIMIT).then(function(do_not_send_update){
                self.update_range_timer = undefined;
                if (!do_not_send_update) self.sendRangeUpdate(self.storage_timeline.range_times,self.storage_timeline.range_durations);
                let l = self.storage_timeline.getLastTime();
                if (l && l < self.range_to)
                    self.updateRange(l, self.range_to, 10000);
            },function(){
                self.update_range_timer = undefined;
            });
        },delay||50);
    }
    onGetTimeline(start_time, end_time, limit){
        let self = this;
        if (!this.camera)
            return new Promise(function(resolve, reject){setTimeout(function(){resolve();},0);}).then(function(){
                self.redux.post(self,'get_storage_timeline',{start_time:start_time,end_time:end_time,limit:limit,debug:' no camera'});
                self.setState('invalidtoken');
                throw 'invalidtoken';
            });
        this.setState('timelining');
        let prev_camera_id = this.camera.id;
        return this.camera.getStorageTimeline(start_time, end_time, limit).then(function(r){
            self.redux.post(self,'get_storage_timeline',{start_time:start_time,end_time:end_time,limit:limit,result:r.objects,debug:''+r.objects.length+' items from time '+(new Date(parseInt(start_time)).toISOString().replace('T',' '))+' to time '+(new Date(parseInt(end_time)).toISOString().replace('T',' '))});
            self.clearState('timelining');
            if (prev_camera_id !== self.camera.id) return;
            let lasttime;
            if (r && r.objects && r.objects[0] && r.objects[0][1] && r.objects[0][1].length) for (let i=0; i< r.objects[0][1].length; i++){
                let st = (new Date(r.objects[0][1][i][0]+'Z')).getTime();
                if (i==0 && st>start_time)
                    self.storage_timeline.addToRange(start_time, start_time - st);
                let dur = parseInt(r.objects[0][1][i][1])*1000;
                if (lasttime!==undefined && st-lasttime>0)
                    self.storage_timeline.addToRange(lasttime, lasttime - st);
                self.storage_timeline.addToRange(st, dur);
                lasttime = st + dur;
            } else 
                lasttime = start_time;
            if (lasttime<end_time){
                let e = Date.now()-3*60000;
                e = e < end_time ? e : end_time;
                if (lasttime<e)
                    self.storage_timeline.addToRange(lasttime, lasttime - e);
            }
            let ft = self.storage_timeline.getFirstKnownTime(0, false);
            if (ft) self.redux.post(self,'min_time',{value:ft});
        },function(r){
            self.redux.post(self,'get_storage_timeline',{start_time:start_time,end_time:end_time,limit:limit,error:r,debug:' load fail from time '+(new Date(parseInt(start_time)).toISOString().replace('T',' '))+' to time '+(new Date(parseInt(end_time)).toISOString().replace('T',' '))});
            self.clearState('timelining');
        });
    }
    hasAccess(){
        return true;
    }
    onGetData(time,reverse,limit){
        let self = this;
        if (!this.camera)
            return this.invalidate().then(function(){
                self.setStatus('invalidtoken');
                throw 'invalidtoken';
            });

        if (this.getAttribute('status')==='invalidtoken') return new Promise(function(resolve, reject){setTimeout(function(){reject();},0);});
        let reqtime = parseInt(time);
        let prevattr = this.getAttribute('status');
        if (prevattr!=='playing')
            this.setStatus('loading');

        this.setState('getrecords');
        let prev_camera_id = this.camera.id;
        return this.camera.getStorageRecords(time,reverse,limit).then(function(r){
            self.redux.post(self,'get_storage_records',{time:time,reverse:reverse,limit:limit,result:r.objects,debug:'found '+r.objects.length+' items from time '+(new Date(parseInt(time)).toISOString().replace('T',' '))+' with limit '+limit+(reverse?' reverse':'')});
            self.clearState('getrecords');
            if (prev_camera_id !== self.camera.id) return;
            let first_data=false;
            let last_time = reqtime; let first_time = reqtime;
            if (reverse && !r.objects.length && self.records_cache.range_times.length>0 && self.records_cache.range_times[0]>0){
                self.storage_timeline.addToRange(0, -self.records_cache.range_times[0]);
                first_data = true;
            }
            for (let i in r.objects){
                let st = (new Date(r.objects[i]['start']+'Z')).getTime();
                let et = (new Date(r.objects[i]['end']+'Z')).getTime();
                if (isNaN(et) || isNaN(st)){
                    console.warn('Invalid time value for archive block');
                    continue;
                }
                let duration = et - st;
                if (duration<=0){
                    console.warn('Invalid duration for archive block');
                    continue;
                }
                if (i>0){
                    if (st>last_time)
                        self.storage_timeline.addToRange(last_time, -st+last_time);
                    if (et<first_time)
                        self.storage_timeline.addToRange(et, -first_time + et);
                } else if (st>reqtime){
                    self.storage_timeline.addToRange(reqtime, reqtime-st);
                }
                self.storage_timeline.addToRange(st, duration);
                first_time = st;
                last_time = st + duration;
            }
            if (r.objects.length>0 && r.objects.length!==limit){
                if (reverse) {
                    let t = (new Date(r.objects[r.objects.length-1]['start']+'Z')).getTime();
                        self.storage_timeline.addToRange(0, -t);
                    self.archive_left_time = t;
                }
                else self.archive_right_time = (new Date(r.objects[r.objects.length-1]['end']+'Z')).getTime();
            }
            if (reverse && !r.objects.length){
                self.storage_timeline.addToRange(0, -reqtime);
            }
            if (r.objects.length==0 && !reverse && self.archive_right_time==undefined){
                self.archive_right_time = reqtime;
            }
            if (reverse && Math.abs(reqtime-new Date().getTime())<100000 && r.objects.length>0){
                self.archive_right_time = (new Date(r.objects[0]['end']+'Z')).getTime();
            }

            if (first_data || r.objects.length && !self.storage_timeline.isEmpty())
                self.sendRangeUpdate(self.storage_timeline.range_times,self.storage_timeline.range_durations);
            return {objects:r.objects, limit:r.meta.limit, total_count:r.meta.total_count};
        },function(r){
            self.redux.post(self,'get_storage_records',{time:time,reverse:reverse,limit:limit+20,result:r.objects,debug:'load fail'});
            self.clearState('getrecords');
            if (r && r.status || r instanceof TypeError){
                self.removeAttribute('autoplay');
                return self.invalidate().then(function(){
                    self.setStatus('invalidtoken');
                    throw r;
                });
            }
            throw r;
        });
    }
    disconnectedCallback(){
        if (this.camera) this.camera.destroy();
        this.camera = undefined;
        this.storage_timeline.invalidate();
        this.posters.invalidate();
        super.disconnectedCallback();
    }
}

window.customElements.define('k-video-vxg', CKVgxVideo);
class CKVgxSdVideo extends CKVgxVideo{
    constructor() {
        super();
        this.check_times = [];
        this.sdcard_timeline = new CTimeRange();


/*
const handler = {
  get: function(obj, prop) {
      return prop in obj ? obj[prop] : undefined;
  },
  set: function(obj, prop, val) {
if (val===undefined) debugger;
      obj[prop] = val;
      return true;
  }
};
        this.durations2 = this.durations;
        this.durations = new Proxy(this.durations2, handler);
*/


    }              	
    connectedCallback() {
        super.connectedCallback();
        let self = this;
        this.redux.subscribe('camera_connected',function(event){
            if (!event.event_param.value){
                self.setState('notconnected');
                self.last_status='offline';
                self.sendRangeUpdate(self.storage_timeline.range_times,self.storage_timeline.range_durations);
                self.sdcard_timeline.invalidate();
                self.timlineloaded = false;
            } else{
                self.clearState('notconnected');
                self.invalidate().then(function(){
                    self.updateCache();
                });
            }
        });

    }
    disconnectedCallback(){
        super.disconnectedCallback();
    }
    set src(token){
        let self = this;
        let camera = VXG.CLOUD(token);
        if (!camera.isFullAccess()){
            camera = undefined;
            this.setStatus('invalidtoken');
            console.error('SD VXG required full access!');
        }
        this.camera = camera;
        if (camera)
           this.invalidate().then(function(){
            self.updateCache();
        });
    }
    checkDataExist(time_from, time_to){
        return this.sdcard_timeline.checkRange(time_from, time_to);
    }
    onGetTimeline(start_time, end_time, limit){
        let self = this;
        this.setState('timelining');
        if (!this.timlineloaded) this.setState('firsttimelining');

        return super.onGetTimeline(start_time, end_time,limit).then(function(r2){
            if (!self.isCameraOnline()) {
                self.sendRangeUpdate(self.storage_timeline.range_times,self.storage_timeline.range_durations);
                return;
            }

            return self.camera.getStorageMemorycardTimeline(start_time, end_time).then(function(r){
                self.redux.post(self,'get_camera_timeline',{start_time:start_time,end_time:end_time,limit:limit,result:r.data,debug:''+r.data.length+' items from time '+(new Date(parseInt(start_time)).toISOString().replace('T',' '))+' to time '+(new Date(parseInt(end_time)).toISOString().replace('T',' '))});

                if (!r.data || !r.data.length) console.warn('Empty internal camera timeline!');
                else self.timlineloaded=true;
                if (r.error_code=='not_connected'){
                    if (!self.getState('notconnected'))
                        self.redux.send(self,'camera_connected',{value:false});
                    throw 'not_connected';
                }

                if (r2 && r2.objects && r2.objects[0] && r2.objects[0][1] && r2.objects[0][1].length) for (let i=0; i< r2.objects[0][1].length; i++){
                    let st = (new Date(r2.objects[0][1][i][0]+'Z')).getTime();
                    let et = st + r2.objects[0][1][i][1]*1000;
                    self.sdcard_timeline.addToRange(st, et-st);
                }
                let lasttime;

                if (r && r.data && r.data.length)
                    r.data.sort(function(a,b){
                        if (a['start']<b['start']) return -1;
                        if (a['start']>b['start']) return 1;
                        return 0;
                    })

                if (r && r.data && r.data.length) for (let i=0; i< r.data.length; i++){
                    let st = (new Date(r.data[i]['start']+'Z')).getTime();
                    let et = (new Date(r.data[i]['end']+'Z')).getTime();
                    if (i==0 && st>start_time) {
                        if (!self.sdcard_timeline.range_times.length)
                            self.sdcard_timeline.addToRange(start_time, start_time - st);
                        else if (self.sdcard_timeline.range_times[0] > start_time)
                            self.sdcard_timeline.addToRange(start_time, start_time - self.sdcard_timeline.range_times[0]);
                    }
                    if (lasttime!==undefined && st-lasttime>0)
                        self.sdcard_timeline.addToRange(lasttime, lasttime - st);
                    self.sdcard_timeline.addToRange(st, et-st);
                    lasttime = et;
                } else 
                    self.sdcard_timeline.addToRange(start_time, start_time - end_time);

                self.sendRangeUpdate(self.sdcard_timeline.range_times,self.sdcard_timeline.range_durations);
                self.startLoader();
                return true;
            },function(r){
                self.redux.post(self,'get_camera_timeline',{start_time:start_time,end_time:end_time,limit:limit,error:r,debug:'load fail from time '+(new Date(parseInt(start_time)).toISOString().replace('T',' '))+' to time '+(new Date(parseInt(end_time)).toISOString().replace('T',' '))});
                throw r;
            });
        }).finally(function(){
            self.clearState('firsttimelining');
            self.clearState('timelining');
        });
    }
    getMicroDate(v){
        v = v.split('.');
        return (new Date(v[0]+'Z')).getTime() + (v[1] ? parseFloat('.'+v[1])*1000 : 0);
    }
    adjustTime(time, add_mks){
        if (this.check_times[parseInt(time/1000)*1000]===undefined) return time;
        return this.addMicro(this.check_times[parseInt(time/1000)*1000],add_mks);
    }
    compareMicro(t1,t2){
        t1 = t1.split('.');
        t2 = t2.split('.');
        let mks1 = t1[1] ? parseFloat('.'+t1[1]) : 0.0;
        let mks2 = t2[1] ? parseFloat('.'+t2[1]) : 0.0;
        t1 = new Date(t1[0]).getTime();
        t2 = new Date(t2[0]).getTime();
        if (t1<t2) return -1;
        if (t1>t2) return 1;
        if (mks1<mks2) return -1;
        if (mks1>mks2) return 1;
        return 0;
    }
    addMicro(time, add_mks){
        let v = time.split('.');
        let mks = (v[1] ? parseFloat('.'+v[1]) : 0.0) + add_mks/1000000;
        let add_sec = mks>=1 ? parseInt(mks) : (mks<0 ? parseInt(mks)-1 : 0);
        if (mks<0) mks+= - parseInt(mks) + 1.0;
        if (mks>=1) mks-=parseInt(mks);
        let t = new Date(v[0]+'Z').getTime() + add_sec*1000;
        let ret = new Date(t).toISOString().substr(0,19)+mks.toFixed(6).substr(1);
        return ret;
    }
    get SYNC_DURATION(){return this.options.sync_duration ? this.options.sync_duration*1000 : 15000;};
    get NOLOAD_DURATION(){return this.options.noload_duration ? this.options.noload_duration*1000 : 2000;};
    isCameraOnline(){
        let self = this;
        function autoUpdateStatus(){
            self.setState('caminfo');
            return self.camera.getStatus().then(function(status){
                self.clearState('caminfo');
                self.last_status = status ? status : undefined;
                if (status==='active'){
                    if (self.getState('notconnected'))
                        self.redux.send(self,'camera_connected',{value:true});
                }else{
                    if (!self.getState('notconnected'))
                        self.redux.send(self,'camera_connected',{value:false});
                }
                self.clearState('caminfo');
                return new Promise(function(resolve, reject){setTimeout(function(){resolve();},3000);}).then(function(){return autoUpdateStatus();});
            },function(e){
                self.clearState('caminfo');
                if (!self.getState('notconnected'))
                    self.redux.send(self,'camera_connected',{value:false, result:e});
                return new Promise(function(resolve, reject){setTimeout(function(){resolve();},3000);}).then(function(){return autoUpdateStatus();});
            });
        }
        if (!this.autoupdate_promise && (!this.last_status || this.last_status!=='active')){
            this.autoupdate_promise = autoUpdateStatus().then(function(){
                self.autoupdate_promise = undefined;
            },function(){
                self.autoupdate_promise = undefined;
            });
        }
        return !this.last_status || this.last_status=='active';
    }

    onGetData(time,reverse,limit,no_thumbnails){
        if (!this.isCameraOnline()) return super.onGetData(time,reverse,limit,no_thumbnails);

        if (this.getAttribute('status')==='invalidtoken') return new Promise(function(resolve, reject){setTimeout(function(){reject();},0);});
        let self = this;
        let reqtime = parseInt(time);
        let prevattr = this.getAttribute('status');
        if (prevattr!=='playing' && this.getAttribute('status')!=='not_connected')
            this.setStatus('loading');

        if (!self.timlineloaded){
            self.redux.post(self,'create_storage_record',{value:time,reverse:reverse,limit:limit,debug:'firstly load timeline'});
            self.updatePoster(self.parent.currentUtcTime,true).then(function(){
                self.updatePoster(self.parent.currentUtcTime).catch(function(){});
            },function(){
                self.updatePoster(self.parent.currentUtcTime).catch(function(){});
            });
            if (this.parent) this.parent.setTimelineState(false);
            let t = time; if ((new Date().getTime()-t)<1000*60*60) t = new Date().getTime();
            this.invalidateCache();
            return this.onGetTimeline(t - 1000*60*60*24, t + 1000*60*60*24, 1000).then(function(){
                return self.onGetData(time,reverse,limit,no_thumbnails);
            }).finally(function(){
                if (self.parent) self.parent.setTimelineState(false);
            });
        }
        if (!reverse && !self.sdcard_timeline.isEmpty() && self.sdcard_timeline.getLastTime()<time-30000){
            return this.onGetTimeline(self.sdcard_timeline.getLastTime(), self.sdcard_timeline.getLastTime() + 1000*60*10, 1000).then(function(){
                return self.onGetData(time,reverse,limit,no_thumbnails);
            });
        }

        if (this.getAttribute('status')==='nodata' && this.isPlaying())
            this.setStatus('loading');

        this.setState('getrecords');
        let prom = this.camera.getStorageRecords(time+(reverse?10000:-10000),reverse,limit+20);
        let ret = prom.then(function(r){
            self.redux.post(self,'get_storage_records',{time:(time+(reverse?10000:-10000)),reverse:reverse,limit:limit+20,result:r.objects,debug:'found '+r.objects.length+' items from time '+(new Date(parseInt(time)).toISOString().replace('T',' '))+' with limit '+limit+(reverse?' reverse':'')});
            self.clearState('getrecords');
            let prev_start, prev_end, prev_start_utc, prev_end_utc;

            let first_time = self.sdcard_timeline.getFirstKnownTime(time, reverse);
            if (first_time) time=first_time;

            while(r.objects && r.objects.length) {
                let st = (new Date(r.objects[0]['start']+'Z')).getTime();
                let et = (new Date(r.objects[0]['end']+'Z')).getTime();
                if (!reverse && et<=time || reverse && st>=time){
                    prev_start_utc = st;
                    prev_end_utc = et;
                    prev_start = r.objects[0]['start'];
                    prev_end = r.objects[0]['end'];
                    r.objects.shift();
                } else break;
            }
            let block_loaded=false;
            let ft = r.objects.length ? (new Date(r.objects[0]['start']+'Z')).getTime() : 0;
            if (!reverse && r.objects.length>0 && ft > first_time && ft <= first_time+self.NOLOAD_DURATION) {
                self.sdcard_timeline.addToRange(first_time, first_time - ft);
                self.records_cache.addToRange(first_time, first_time - ft,'');
            }

            if (first_time && r.objects && r.objects.length && (new Date(r.objects[0]['start']+'Z')).getTime() <= first_time+(!reverse?self.NOLOAD_DURATION:0) && (first_time-(reverse?1:0)) < (new Date(r.objects[0]['end']+'Z')).getTime())
                block_loaded = true;


            if (!block_loaded && first_time!==undefined){
                let next_start, next_end, next_start_utc, next_end_utc;
                if (r.objects && r.objects.length) {
                    next_start_utc = (new Date(r.objects[0]['start']+'Z')).getTime();
                    next_end_utc = (new Date(r.objects[0]['end']+'Z')).getTime();
                    next_start = r.objects[0]['start'];
                    next_end = r.objects[0]['end'];
                }
                let t1,t2;
                if (reverse)
                    [next_start, next_start_utc, next_end, next_end_utc, prev_start, prev_start_utc, prev_end, prev_end_utc] = [prev_start, prev_start_utc, prev_end, prev_end_utc, next_start, next_start_utc, next_end, next_end_utc];

                let last_time = self.sdcard_timeline.getLastTime();
                if (next_start_utc && prev_end_utc && next_start_utc - prev_end_utc < self.SYNC_DURATION){
                    t1 = prev_end;
                    t2 = self.addMicro(next_start,-1);
                    if ((new Date(t1+'Z').getTime())>=(new Date(t2+'Z').getTime()))
                        console.error('Overlapping on '+(prev_end_utc-next_start_utc)+'ms: '+prev_start+' - '+prev_end+' with '+next_start+' - '+next_end);
                } else
                if (next_start_utc && next_start_utc - time < self.SYNC_DURATION){
                    t2 = self.addMicro(next_start,-1);
                    if (prev_start_utc && next_start_utc - prev_start_utc < self.SYNC_DURATION)
                        t1 = prev_start;
                    else
                        t1 = self.addMicro(next_start, -self.SYNC_DURATION*1000);
                } else
                if (prev_end_utc && time - prev_end_utc < self.SYNC_DURATION){
                    t1 = prev_end;
                    t2 = self.addMicro(prev_end,self.SYNC_DURATION*1000);
                    if (last_time < prev_end_utc+self.SYNC_DURATION)
                        t2 = new Date(last_time).toISOString().substr(0,23);
                } else{
                    if (last_time && last_time-self.SYNC_DURATION < first_time){
                        t2 = new Date(last_time).toISOString().substr(0,23);
                        t1 = new Date(last_time-self.SYNC_DURATION).toISOString().substr(0,23);
                    } else if (first_time === time){
                        let nt = time+self.SYNC_DURATION-1000;
                        if (nt>new Date().getTime()) nt = new Date().getTime();
                        t1 = new Date(nt-self.SYNC_DURATION).toISOString().substr(0,23);
                        t2 = new Date(nt).toISOString().substr(0,23);
                    } else {
                        if (!reverse){
                            t1 = new Date(first_time).toISOString().substr(0,23);
                            t2 = new Date(first_time+(self.SYNC_DURATION)).toISOString().substr(0,23);
                        } else {
                            t1 = new Date(first_time-self.SYNC_DURATION).toISOString().substr(0,23);
                            t2 = new Date(first_time).toISOString().substr(0,23);
                        }
                    }
                }

                function getStorageMemorycardSynchronize(start_time, end_time, cb, retry_count){
                    if (!retry_count) retry_count=100;
            
                    let st = typeof start_time === 'string' ? start_time : (new Date(start_time)).toISOString().substr(0,23);
                    let et = typeof end_time === 'string' ? end_time : (new Date(end_time)).toISOString().substr(0,23);
                    return self.camera.api.post_v2_storage_memorycard_synchronize(self.camera.id,{/*existing_data:'delete',*/start:st,end:et}).then(function(trd){
                        if (trd.status!=='pending') return trd;
                        let check = function(rid, rc){
                            if (!self.isCameraOnline()){
//                                self.toNotConnected();
                                throw 'not_connected';
                            }
                            if (!rc)
                                return new Promise(function(resolve, reject){setTimeout(function(){resolve()},1000);}).then(function(){
                                    return getStorageMemorycardSynchronize(start_time, end_time, cb);
                                });
                            if (cb) cb();
                            return new Promise(function(resolve, reject){setTimeout(function(){resolve()},1000);}).then(function(){
                                return self.camera.api.get_v2_storage_memorycard_synchronize(self.camera.id, rid).then(function(r){
                                    if (r.status!=='pending') return r;
                                    return new Promise(function(resolve, reject){setTimeout(function(){resolve()},100);}).then(function(){
                                        return check(rid,rc-1);
                                    });
                                });
                            });
                        }
                        return check(trd.id, retry_count);
                    });
                }

                self.setState('syncronizing');
                return getStorageMemorycardSynchronize(t1,t2).then(function(r){
                    self.clearState('syncronizing');
                    if (r.error_code=='not_connected'){
                        self.redux.post(self,'create_storage_record',{time_from:t1+'Z',time_to:t2+'Z',error:r,debug:'syncronize fail from '+t1.replace('T',' ')+' to '+t2.replace('T',' ')+ ' error code:'+r.error_code});
                        if (!self.getState('notconnected'))
                            self.redux.send(self,'camera_connected',{value:false, error:r});
                        throw 'not_connected';
                    }

                    if (r.status!='done'){
                        let s = new Date(t1+'Z').getTime();
                        let e = new Date(t2+'Z').getTime();
                        self.sdcard_timeline.addToRange(s, s-e<0?s-e:-1);
                        self.records_cache.addToRange(s, s-e<0?s-e:-1,'');
                        self.redux.post(self,'create_storage_record',{time_from:t1+'Z',time_to:t2+'Z',error:r,debug:'syncronize fail from '+t1.replace('T',' ')+' to '+t2.replace('T',' ')+ ' error code:'+r.error_code});
                        return {objects:[]};
//                        return self.onGetData(time,reverse,limit,no_thumbnails);
                    }
                    self.setState('syncronizing');
                    return self.camera.getOneStorageRecord(self.addMicro(t1,1000),self.addMicro(t2,-1000),120).then(function(r){
                        self.redux.post(self,'create_storage_record',{time_from:t1+'Z',time_to:t2+'Z',created_from:r.objects[0]['start']+'Z',created_to:r.objects[0]['end']+'Z',result:r.objects,debug:'syncronize\n'+t1.replace('T',' ')+' to '+t2.replace('T',' ')+' requested \n'+r.objects[0]['start'].replace('T',' ')+' to '+r.objects[0]['end'].replace('T',' ')+' created'});
                        if (r.objects.length){
                            let st = (new Date(r.objects[0]['start']+'Z')).getTime();
                            let et = (new Date(r.objects[0]['end']+'Z')).getTime();
                            let s = new Date(t1+'Z').getTime();
                            if (st-s>0){
//                                self.sdcard_timeline.addToRange(s, s-st);
                                self.records_cache.addToRange(s, s-st, '');
                            }
                            self.records_cache.addToRange(st, et-st, r.objects[0]['url']);
                        }
                        self.clearState('syncronizing');
                        return r;
                    });
                },function(e){
                    self.redux.post(self,'create_storage_record',{time_from:t1+'Z',time_to:t2+'Z',error:e,debug:'syncronize failed from '+t1.replace('T',' ')+' to '+t2.replace('T',' ')});
                    self.clearState('syncronizing');
                    self.invalidateCache();
//                    throw e;
                });
            }
            if (r.objects.length && !self.sdcard_timeline.isEmpty())
                self.sendRangeUpdate(self.sdcard_timeline.range_times,self.sdcard_timeline.range_durations);
            return {objects:r.objects, limit:r.meta.limit, total_count:r.meta.total_count};
        },function(r){
            self.redux.post(self,'get_storage_records',{time:(time+(reverse?10000:-10000)),reverse:reverse,limit:limit+20,error:r,debug:'load fail'});
            self.clearState('getrecords');
            if (r && r.status || r instanceof TypeError){
                self.removeAttribute('autoplay');
                return self.invalidate().then(function(){
                    self.setStatus('invalidtoken');
                    throw r;
                });
            }
            throw r;
        });
        ret.abort_controller = prom.abort_controller;
        return ret;
    }
    getLastSrcBeforeTime(before, noload){
        if (!this.isCameraOnline()) return super.getLastSrcBeforeTime(before, noload);
        if (before<=0) debugger;
        let self = this;

        if (!this.records_cache.range_durations.length) {
            if (this.no_data_before===0) return;
            this.no_data_before = before;
            this.redux.post(this,'last_record_before_time',{time:before,debug:'try load records before '+(new Date(parseInt(before)).toISOString().replace('T',' '))});
            this.loadData();
            return;
        }
        let i;
        for (i=this.records_cache.range_times.length-1;i>=0;i--)
            if (this.records_cache.range_times[i] < before){
                if (this.records_cache.range_durations[i]>=0){
                    let first_time = self.sdcard_timeline.getFirstKnownTime(before, true);
                    if (!first_time || this.records_cache.range_times[i]+this.records_cache.range_durations[i] < first_time) break;
                    this.redux.post(this,'last_record_before_time',{time:before,debug:''+(new Date(parseInt(before)).toISOString().replace('T',' ')+' is '+(new Date(this.records_cache.range_times[i]).toISOString())+' '+this.records_cache.range_durations[i]+'ms')});
                    return {time:this.records_cache.range_times[i],msec:this.records_cache.range_durations[i],src:this.records_cache.range_data[i].s,off:this.records_cache.range_data[i].off};
                }
            }
        if (noload) return;
        this.no_data_before = before;
        this.loadData();
        this.redux.post(this,'last_record_before_time',{time:before,debug:'try load records before '+(new Date(parseInt(before)).toISOString().replace('T',' '))});
    }
}


window.customElements.define('k-video-sdvxg', CKVgxSdVideo);
class CKPlayer extends HTMLElement {
    static get observedAttributes() {
        return ['src','time','msec','playtime']; 
    }
    constructor() {
        super();
        this.kp_event_timeupdate = new Event('timeupdate',{cancelable: false, bubbles: true});
        this.kp_event_playing = new Event('playing',{cancelable: false, bubbles: true});
        this.kp_event_pause = new Event('pause',{cancelable: false, bubbles: true});
        this.kp_event_statusupdate = document.createEvent('Event');
        this.kp_event_videochanged = document.createEvent('Event');
        this.kp_event_statusupdate.initEvent('statusupdate', true, true);
        this.kp_event_videochanged.initEvent('videochanged', true, true);
        this.controls = [];
    }
    setTimelineState(enable){
        let tl = this.shadow.querySelector('k-control-timepicker');
        if (!enable) tl.setAttribute('disabled','disabled');
        else tl.removeAttribute('disabled');
    }
    setLoggingEventsListCallback(listcallback){
        this.player.redux.setLoggingEventsListCallback(listcallback);
    }
    connectedCallback() {
        let self = this;
        this.style.position='relative';
        this.style.overflow='hidden';
        this.style.userSelect='none';
        this.style['-moz-user-select']='none';
        this.style['-webkit-user-select']='none';
        this.style['-ms-user-select']='none';

        this.shadow = this.attachShadow({mode: 'open'});
        let player_tag = this.getAttribute('videomodule')!==null ? this.getAttribute('videomodule') : 'k-video-vxg';
        let tag = player_tag == 'k-video' || player_tag == 'k-video-reverse' ? 'video' : player_tag;
        let controls = 'k-control-play k-control-timeinfo k-control-timepicker k-control-speed';
        if (this.getAttribute('controls')!==null) controls=this.getAttribute('controls');
        let controls_html='';let top_html='';
        while (controls.indexOf('  ')!==-1) controls = controls.replaceAll('  ',' ');
        controls = controls.trim().split(' ');
        for (let i = 0; i<controls.length; i++){
            let el = window.customElements.get(controls[i]);
            if (!el) continue;
            el = new el();
            if (!(el instanceof CKControl)) {
                console.warn(controls[i]+' is not instance of CKControl')
                continue;
            }
            let type = el.getType();
            if (type=='top')
                top_html += '<'+controls[i]+' class="k-control"></'+controls[i]+'>';
            else
                controls_html += '<div class="'+type+'"><'+controls[i]+' class="k-control"></'+controls[i]+'></div>';
            el = undefined;
        }
        let options = this.getAttribute('options')===null ? '' : " options='"+this.getAttribute('options')+"'";
        let over= (top_html || controls_html) ? ('<div class="over"><div class="top">'+top_html+'</div><div class="bottom">'+controls_html+'</div></div>') : '';
        if (!top_html && controls.length==1 && controls[0]=='k-control-timepicker')
            over= '<div class="over" style="opacity: 0;"><div class="top"></div><div class="bottom">'+controls_html+'</div></div>';

        let playtime = isNaN(parseInt(this.getAttribute('playtime'))) ? '' : ' playtime="'+parseInt(this.getAttribute('playtime'))+'"';
        this.shadow.innerHTML = '<style>'+CKPlayer.css+'</style>'+'<'+tag+(tag=='video'?' is="'+player_tag+'"':'')
            +(this.getAttribute('debuginfo')!==null?' debuginfo':'')
            +(this.getAttribute('autoplay')!==null?' autoplay':'')
            +(this.getAttribute('thumbnails')!==null?' thumbnails':'')
            +playtime+options+' innerkplayer'+(this.getAttribute('statuses')!==null?' statuses':'')+'></'+tag+'>'+over;	
        this.player = this.shadow.querySelector('[innerkplayer]');
        let ks = this.shadow.querySelectorAll('.k-control');
        for (let i=0;i<ks.length;i++)
            ks[i].setRedux(this.player.redux);

        setTimeout(function(){self.player.redux.post(self,'media_scale',{value:self.clientWidth/self.clientHeight});},100);

        this.player.parent = this;
        if (!(this.player instanceof CKVideoAsync) && typeof this.player.setSourceListObserver === 'function'){
            this.player.setSourceListObserver(this);
            this.innerHTML+=' ';
        }
        this.over = this.shadow.querySelector('.over');
        this.shadow.querySelectorAll('.bottom > div > *, .top > *').forEach(function(el){
            if (typeof el.setPlayer !== 'function') return;
            self.controls.push(el);
            el.setPlayer(self);
        });
        if (playtime)
            setTimeout(function(){self.sendTimeUpdate();},0);
        this.player.addEventListener("videochanged", function(event){
            self.kp_event_videochanged.video = event.video;
            self.dispatchEvent(self.kp_event_videochanged);
        });
        this.player.addEventListener("timeupdate", function(event){
            if (self.player.getAttribute('playtime')===null) return;
            if (!self.player.isPlaying() && !self.new_src) return;
            delete self.new_src;
            self.sendTimeUpdate();
        },{once:false});
        this.player.addEventListener("statusupdate", function(event){
            self.setAttribute('status',event.status);
            if (event.status==='playing' || self.isPlaying()) self.classList.add('playing');
            else self.classList.remove('playing');
            self.kp_event_statusupdate.status = event.status;
            self.dispatchEvent(self.kp_event_statusupdate);
        },{once:false});
        this.player.redux.subscribe("set_state", function(event){
            if (event && event.event_param && event.event_param.value) self.classList.add(event.event_param.value);
        },{once:false});
        this.player.redux.subscribe("clear_state", function(event){
            if (event && event.event_param && event.event_param.value) self.classList.remove(event.event_param.value);
        },{once:false});
/*
        this.player.addEventListener("loadedmetadata", function(event){
            let w = !event ? 0 : (event.target && event.target.videoWidth ? event.target.videoWidth : (event.detail&&event.detail.src&&event.detail.src.videoWidth?event.detail.src.videoWidth:0));
            let h = !event ? 0 : (event.target && event.target.videoHeight ? event.target.videoHeight : (event.detail&&event.detail.src&&event.detail.src.videoHeight?event.detail.src.videoHeight:0));
            if (self.getAttribute('autoprop')===null || !w || !h) return;
            self.player.redux.post(self,'media_scale',{value:w/h});
            self.media_width = w;
            self.media_height = h;
            if (self.clientWidth)
                self.style.height = ''+(self.clientWidth * h / w )+'px';
        },{once:false});
*/
        this.player.redux.subscribe('media_scale', function(event){
            if (event && event.event_param && !isNaN(parseFloat(event.event_param.value)) && self.getAttribute('autoprop')!==null){
                let nh = (self.clientWidth / parseFloat(event.event_param.value) );
                if (self.style.height!=nh) self.style.height = ''+nh+'px';
            }
        });
/*
        window.addEventListener("resize", function() {
            if (!self.media_width || !self.media_height) return;
            if (self.getAttribute('autoprop')!==null)
                self.style.height = ''+(self.clientWidth * self.media_height / self.media_width )+'px';
        });
*/
    }
    disconnectedCallback(){
        this.player.pause().catch(function(){});
        this.shadow.innerHTML='';
    }
    get currentUtcTime(){
        return this.player.currentUtcTime;
    }
    set currentUtcTime(time){
        this.player.currentUtcTime = time;
    }
    get playbackRate(){
        return this.player.speed;
    }
    set playbackRate(speed){
        this.player.setPlaybackRatePromise(speed).catch(function(){});
    }
    get volume(){
        return this.player.volume;
    }
    set volume(volume){
        this.player.volume = volume;
    }
    get muted(){
        return this.player.muted;
    }
    set muted(v){
        this.player.muted = v;
    }
    setHook(hook_before, hook_after){
        this.hook_before = hook_before;
        this.hook_after = hook_after;
        if (this.player.camera)
            this.player.camera.setHook(hook_before, hook_after);
    }
    getVideo(){
        return this.player.getVideo();
    }
    play(){
        let self = this;
        this.dispatchEvent(self.kp_event_playing);

        return this.player.play().then(function(){
            self.controls.forEach(function(el){
                if (typeof el.onPlay === 'function') el.onPlay();
            });
        }).catch(function(){});
    }
    pause(){
        let self = this;
        if (this.player.isPlaying()){
            this.dispatchEvent(this.kp_event_pause);
        }
        return this.player.pause().catch(function(){}).finally(function(){
            self.controls.forEach(function(el){
                if (typeof el.onPause === 'function') el.onPause();
            });
        });
    }
    isPlaying(){return this.player.isPlaying();}

    setTimePromise(utctime){
        let self = this;
        return this.player.setTimePromise(utctime).then(function(){
             self.kp_event_timeupdate.currentTime = self.player.currentUtcTime;
             self.dispatchEvent(self.kp_event_timeupdate);
        });
    }

    set currentTime(time){
        this.setTimePromise(time);
    }

    get currentTime(){
        return parseInt(this.getAttribute('playtime'));
    }

    sendTimeUpdate(){
        this.do_not_update_playtime=true;
        this.setAttribute('playtime',this.player.currentUtcTime);
        this.do_not_update_playtime=undefined;

        this.kp_event_timeupdate.currentTime = this.player.currentUtcTime;
        this.dispatchEvent(this.kp_event_timeupdate);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        let self=this;
        if (name==='src') setTimeout(function(){
            self.new_src = true; 
            self.player.src = newValue;
            self.player.clearState('invalidtoken');
            if (self.player.camera)
                self.player.camera.setHook(self.hook_before, self.hook_after);
            else{
                self.player.invalidate();
                self.player.sendRangeUpdate([],[]);
            }
            if (self.getAttribute('autoplay')!==null)
                self.play();
        },0);
        if (this.shadow && name==='playtime' && newValue!==null && !this.do_not_update_playtime){
            let t = parseInt(newValue);
            if (!isNaN(t))
                self.player.setTimePromise(t).then(function(){
                     self.kp_event_timeupdate.currentTime = self.player.currentUtcTime;
                     self.dispatchEvent(self.kp_event_timeupdate);
                });
        }

        if (name==='time') setTimeout(function(){self.player.setAttribute('time',newValue);},0);
        if (name==='msec') setTimeout(function(){self.player.setAttribute('msec',newValue);},0);
    }
    static get css() {
        return `
[innerkplayer]{width:100%;height:100%;}
.over{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;flex-direction:column;}
.top{flex:100;position:relative;}
.bottom{background:#0004;flex:1;min-height:40px;display:flex;flex-direction:row;border-bottom: 5px solid #0008;border-top: 5px solid #0008;}
.bottom > div{background:#00000080;}
.bottom .min{flex:1;min-width:40px;max-width:40px;}
.bottom .double{flex:1;min-width:80px;min-width:80px;}
.bottom .full{flex:100;}
k-timeline-picker{display:block;width:100%;height:100%;background:#00000080;color:white;font-family:monospace;font-size:15px;}
[innerkplayer][statuses][status]:before {font-size:40px;color:black;z-index:10000;display:block;background:#fffb;padding:10px 20px;position:absolute;right:0;}
[innerkplayer][statuses]:before {content:attr(status);}
[innerkplayer][statuses]:after{max-width:115px;position: absolute;display: block;right: 0;top: 68px;background: #fffb;padding: 10px 15px;}
[innerkplayer][statuses]:after{content:attr(class)}
`;
    }
}

window.customElements.define('vxg-cloud-player', CKPlayer);
