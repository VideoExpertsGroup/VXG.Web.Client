CloudOneCamera.setRetention = function(data){
    return vxg.api.cloudone.camera.setRetention(this.camera_id,data);
}
CloudOneCamera.getRetention = function(){
    return vxg.api.cloudone.camera.getRetention(this.camera_id);
}
vxg.api.cloudone.camera.setRetention = function(channel_id, data){
    return vxg.user.getToken().then(function(r){
        data.token = r;
        data.channel_id = channel_id;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/set_retention/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
}

vxg.api.cloudone.camera.getRetention = function(channel_id){
    return vxg.user.getToken().then(function(r){
        let data={token:r,channel_id:channel_id};
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/get_retention/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
}
