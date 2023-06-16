CloudOneCamera.setAIConfig = function(data){
    return vxg.api.cloudone.camera.setAIConfig(this.camera_id,data);
}
CloudOneCamera.getAIConfig = function(){
    return vxg.api.cloudone.camera.getAIConfig(this.camera_id);
}

vxg.api.cloudone.camera.setAIConfig = function(channel_id, data){
    return vxg.user.getToken().then(function(r){
        data.token = r;
        data.channel_id = channel_id;
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/ai/set_config/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
}

vxg.api.cloudone.camera.getAIConfig = function(channel_id){
    return vxg.user.getToken().then(function(r){
        let data={token:r,channel_id:channel_id};
        return $.ajax({
            type: 'POST',
            url: vxg.api.cloudone.apiSrc+'/api/v1/user/camera/ai/get_config/',
            contentType: "application/json",
            data: JSON.stringify(data)
        });
    });
}
