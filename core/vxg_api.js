window.VXG = window.VXG || {};

VXG.API = function(token, as_cloud, link){
    if (as_cloud===undefined) as_cloud = true;
    if (link===undefined) link = 'web.skyvr.videoexpertsgroup.com';
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
      post_v2_storage_clips_sharings(clip_id,param)                    {return this.r('POST',  'api/v2/storage/clips/'+clip_id+'/sharings/',                         {}, params);},
       get_v2_storage_clips(clip_id, param)                            {return this.r('GET',   'api/v2/storage/clips/'+(clip_id?clip_id+'/':''),                     params, {});},
      post_v2_storage_clips(param)                                     {return this.r('POST',  'api/v2/storage/clips/',                                              {},params);},
       put_v2_storage_clips(clip_id, param)                            {return this.r('PUT',   'api/v2/storage/clips/'+clip_id+'/',                                  {},params);},
    delete_v2_storage_clips(clip_id)                                   {return this.r('DELETE','api/v2/storage/clips/'+(clip_id?clip_id+'/':''),                     {}, {});}
}
VXG.API.V3 = {
       get_v3_channels(params, channel_id)                             {return this.r('GET',   'api/v3/channels/'+(channel_id?channel_id+'/':''),                    params?params:{'detail':'detail'}, {});},
       put_v3_channels(channel_id, channel_data)                       {return this.r('PUT',   'api/v3/channels/'+channel_id+'/',                                    {}, channel_data);},
      post_v3_channels(channel_data)                                   {return this.r('POST',  'api/v3/channels/',                                                   {}, channel_data);},
    delete_v3_channels(channel_id)                                     {return this.r('DELETE','api/v3/channels/'+channel_id+'/',                                    {}, {});},
       get_v3_channel_groups(token_id,params)                          {return this.r('GET',   'api/v3/channel_groups/'+token_id+'/',                                params?params:{'include_meta':'true'}, {});},
       put_v3_channel_groups(token_id,params)                          {return this.r('PUT',   'api/v3/channel_groups/'+token_id+'/',                                {},params);},
      post_v3_channel_groups(params)                                   {return this.r('POST',  'api/v3/channel_groups/'+token_id+'/',                                {},params);},
    delete_v3_channel_groups(token_id)                                 {return this.r('DELETE','api/v3/channel_groups/'+token_id+'/',                                {}, {});},
       get_v3_channels_limits(channel_id, params)                      {return this.r('GET',   'api/v3/channels/'+channel_id+'/limits/',                             {}, params?params:{});},
       put_v3_channels_limits(channel_id, params)                      {return this.r('PUT',   'api/v3/channels/'+channel_id+'/limits/',                             {}, params?params:{'caps':{},'system_id':false,'date':false,'time':false});},
       get_v3_statistics(channel_id, params)                           {return this.r('GET',   'api/v3/statistics/'+(channel_id?channel_id+'/':''),                  {}, params?params:{});}
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
VXG.API.V6 = {
    get_v6_servers(params=null){return this.r('GET',   'api/v6/servers/',params?params:{'detail':'detail','limit':1000,'is_owner':true}, {});}
}


VXG.CLOUD = function(token, link){
    let ret = new VXG.API(token, true, link);
    return ret;
}
VXG.SERVER = function(token, link, id=0, uuid='',  endpoint='', name = 'Noname server'){
    let ret = new VXG.API(token, false, link);
    ret.id=0;ret.uuid=uuid;ret.endpoint=endpoint;ret.name=name;
    return ret;
}

VXG.CLOUDAPI = class{
    constructor(parent, token, token_type, link, as_cloud, with_acc){
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
                this.server_acc_v2 = 'token='+token_json['token'];
            } catch(e){return;};
        }
        if (token_type==='LKey'){
            Object.assign(this, VXG.API.V2);
            Object.assign(this, VXG.API.V3);
            if (as_cloud) Object.assign(this, VXG.API.V6);
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
    r(type, path, get_param={}, post_param={}){
        let self = this;
        if (path.substr(0,1)=='/') path = path.substr(1);
        if (path.substr(-1)!=='/') path += '/';
        let params = '';
        for (let i in get_param) params += (params?'&':'?') + i + '=' + get_param[i];
        let headers = this.server_headers;
        if (path.indexOf('/v4/')!==-1 && this.server_acc_headers) headers = this.server_acc_headers;
        if (path.indexOf('/v2/')!==-1 && this.server_acc_v2) {headers = {};params=(params?'&':'?')+this.server_acc_v2;}
        if (type==='GET'){
            if (VXG.CLOUDAPI.cache[self.server_url + path + params]!==undefined){
                if (VXG.CLOUDAPI.cache[self.server_url + path + params] instanceof Promise) 
                    return VXG.CLOUDAPI.cache[self.server_url + path + params];
                if (VXG.CLOUDAPI.cache[self.server_url + path + params].__expired > new Date().getTime())
                    return new Promise(function(resolve, reject){resolve(VXG.CLOUDAPI.cache[self.server_url + path + params]);});
                delete VXG.CLOUDAPI.cache[self.server_url + path + params];
            }
        } else
            VXG.CLOUDAPI.cache = {};
        let ret = fetch(this.server_url + path + params,{headers: headers}).then(function(r){
            return r.json().then(function(t){
                if (type==='GET'){
                    VXG.CLOUDAPI.cache[self.server_url + path + params] = t;
                    VXG.CLOUDAPI.cache[self.server_url + path + params].__expired = new Date().getTime() + 10000;
                } 
                return t;
            });
        });
        if (type==='GET') VXG.CLOUDAPI.cache[self.server_url + path + params] = ret;
        return ret;
    }
}

VXG.CAMERA = class{
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
        return this.api.get_v3_channels(null,this.id).then(function(r){
            self.set_v3_data(r);
            return self.token;
        });
    }
    getName(){
        let self = this;
        if (this.name) return new Promise(function(resolve, reject){resolve(this.name);});
        if (this.api.get_v4_channel) return this.api.get_v4_channel().then(function(r){
            self.set_v4_data(r);
            return r.name;
        });
        if (!this.id) return new Promise(function(resolve, reject){reject();});
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
        if (!this.api.get_v2_cameras) return new Promise(function(resolve, reject){reject();});
        return this.api.get_v2_cameras(null,this.id).then(function(r){
            self.set_v2_data(r);
            return r.name;
        });
    }
    getStatus(){
        let self = this;
        if (this.status) return new Promise(function(resolve, reject){resolve(this.status);});
        if (this.api.get_v4_channel) return this.api.get_v4_channel().then(function(r){
            self.set_v4_data(r);
            return r.status;
        });
        if (!this.id) return new Promise(function(resolve, reject){reject();});
        if (this.api.get_v5_channels) return this.api.get_v5_channels(null,this.id).then(function(r){
            self.set_v5_data(r);
            return r.status;
        });
        if (!this.api.get_v2_cameras) return new Promise(function(resolve, reject){reject();});
        return this.api.get_v2_cameras(null,this.id).then(function(r){
            self.set_v2_data(r);
            return r.status;
        });
    }
}

VXG.CAMERALIST = class{
    getCamera(token_or_id){
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
}
/*
Samples of use

cloud = VXG.CLOUD(SI); // create a VXG object for cloud from SI token. Available API in object - v2, v5
cloud.api.post_v2_cameras(...).then(...)
cloud.api.get_v5_channels(...).then(...) // Caching. These two calls will result in one request per cloud, since less than 10 seconds elapsed between them
cloud.api.get_v5_channels(...).then(...)
cloud.getCamera(231245).then(function(cloud_camera){ // create a VXG camera object for cloud. Available API in object - v2, v3, v4
  cloud_camera.getToken().then(...)
  cloud_camera.api.post_v2_cameras(...).then(...)
  cloud_camera.api.get_v3_channels(...).then(...)
  cloud_camera.api.get_v4_channel(...).then(...)
}

server = VXG.SERVER(SI); // create a VXG object for cloud from SI token. Available API in object - v2
server.api.get_v2_cameras(...).then(...)
server.api.get_v5_channels(...).then(...)
server.getCamera(231245).then(function(server_camera){ // create a VXG camera object for server. Available API in object - v2, v4
  server_camera.getToken().then(...)
  server_camera.api.post_v2_cameras(...).then(...)
  server_camera.api.get_v4_channel(...).then(...)
}

cloud = VXG.CLOUD(LKEY,'web.bluemonitor.net'); // create a VXG object for cloud from LKEY. Available API in object - v2, v3, v6
cloud.api.post_v2_cameras(...).then(...)
cloud.api.get_v3_channels(...).then(...)
cloud.api.get_v6_servers(...).then(...)
cloud.getServer(243).then(function(server){ // get a VXG server object from cloud. Available API in object - v2, v3, v4
  server.api.post_v2_cameras(...).then(...)
  server.api.get_v3_channels(...).then(...)
  server.api.get_v4_channel(...).then(...)
}

server = VXG.SERVER(LKEY,'web.bluemonitor.net',243,'00000000-0000-0000-00000000-00000000'); // create a VXG object for server from LKEY. Available API in object - v2, v3
server.api.post_v2_cameras(...).then(...)
server.api.get_v3_channels(...).then(...)
server.getCamera(231245).then(function(server_camera){ // create a VXG camera object for server. Available API in object - v2, v3
  server_camera.getToken().then(...)
  server_camera.api.post_v2_cameras(...).then(...)
  server_camera.api.get_v3_channels(...).then(...)
}

cloud_camera = VXG.CLOUD(ACC); // create a VXG object for cloud from ACC token. Available API in object - v2, v4
cloud_camera.getToken().then(...)
cloud_camera.api.get_v2_cameras(...).then(...)
cloud_camera.api.get_v4_channel(...).then(...)
cloud_camera.getName().then(...)

server_camera = VXG.SERVER(ACC); // create a VXG object for server from ACC token. Available API in object - v2
server_camera.getToken().then(...)
server_camera.api.get_v2_cameras(...).then(...)
server_camera.getName().then(...)
*/
