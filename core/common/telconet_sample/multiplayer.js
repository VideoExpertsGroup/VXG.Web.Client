$( document ).ready(function() {
    // var player1 = new CloudPlayerSDK('player1', {
    //     preferredPlayerFormat: 'jpeg',
    // });
    var player1 = new CloudPlayerSDK('player1');
    var player2 = new CloudPlayerSDK('player2');
    var player3 = new CloudPlayerSDK('player3');
    var player4 = new CloudPlayerSDK('player4');
    var player5 = new CloudPlayerSDK('player5');
    var player6 = new CloudPlayerSDK('player6');
    var player7 = new CloudPlayerSDK('player7');
    var player8 = new CloudPlayerSDK('player8');
    var player9 = new CloudPlayerSDK('player9');
    const playerList = [player1, player2, player3, player4, player5, player6, player7, player8, player9];

    const groupToken = "eyJ0b2tlbiI6ICJzaGFyZS5leUp6YVNJNklERTRmUS42NTE1ZWNjYXRiYzFmYWIwMC5CSVloTGpiQk53LUpycWk0X1VmNl9OSGFDWEUiLCAiYXBpIjogIndlYi52eGdkZW1vLnZ4Z2RlbW8uY2xvdWQtdm1zLmNvbSJ9";
    const vmsUrl = getURLFromToken(groupToken);
    const headers = {"Authorization": "SI " + groupToken};
    const data = {'include_meta': true, "meta_not": "isstorage,gateway"};
    var url = vmsUrl + '/api/v5/channels';
    function getCameras(url, headers, data) {
        return $.ajax({
            type: 'GET',
            url: url,
            headers: headers,
            contentType: "application/json",
            data: data
        }).then(function(r){
            var cameras = r.objects;
            var camNodes = {"noNode": []};
            cameras.forEach(cam => {
                if (cam.meta && cam.meta.location) {
                    var loc = cam.meta.location.replaceAll(" ", "_SP_").replaceAll(":", "_COL_");
                    if (loc in camNodes) 
                        camNodes[loc].push(cam);
                    else 
                        camNodes[loc] = [cam];
                } else {
                    camNodes['noNode'].push(cam);
                }
            });
    
            var camNodes_Ele = '';
            var count = 0;
            for (var nodeName in camNodes) { 
                if (nodeName != "noNode") {
                    camNodes_Ele += `<div class="node-dropdown draggable" draggable="true" id="node${count}" onclick="toggleCams('${nodeName}')" nodeName="${nodeName}"><span class="node-name">${nodeName.replaceAll("_SP_", " ").replaceAll("_COL_", ":")}</span></div>`;
                    camNodes[nodeName].forEach(cam => {
                        count++;
                        camNodes_Ele += `<div class="camera node-cam draggable ${nodeName}" id="cam${count}" draggable="true" token="${cam.token}"><span>${cam.name}</span></div>`
                    });
                } else {
                    camNodes[nodeName].forEach(cam => {
                        count++;
                        camNodes_Ele += `<div class="camera draggable" token="${cam.token}" id="cam${count}" draggable="true"><span>${cam.name}</span></div>`
                    });
                }
            }
            $(".cams-list").html(camNodes_Ele);

            $('.draggable, .player').on("dragstart", function(e) {
                e.originalEvent.dataTransfer.setData('text', e.currentTarget.id)         
            });
            
            $('.draggable, .player').on('drop dragdrop',function(event){
                var id = event.originalEvent.dataTransfer.getData('text');
                var firstNoSource = -1;
                for (var p = 0; p < playerList.length; p++) {
                    if (playerList[p].getSource().name == "ERROR_SOURCE_NOT_CONFIGURED") {
                        firstNoSource = p;
                        break;
                    }
                }
                
                if (firstNoSource == -1) alert("Camera grid full");

                if (id.includes("node")){
                    var nodeName = $("#"+id).attr("nodeName");
                    var camTokens = camNodes[nodeName].map(n => {return n.token});
                    for (var i = 0; i < camTokens.length; i++) {
                        if (firstNoSource >= playerList.length) break;
                        playerList[firstNoSource].setSource(camTokens[i]);
                        firstNoSource++;
                    }
                } else {
                    var camToken = $("#" + id).attr("token");
                    playerList[firstNoSource].setSource(camToken);
                }
            });
            $('.draggable, .player').on('dragover',function(event){
                event.preventDefault();
                return false;
            })
            $('.draggable, .player').on('dragenter',function(event){
                event.preventDefault();
            })
            $('.draggable, .player').on('dragleave',function(event){
                event.preventDefault();
            })
        });
    }

    getCameras(url, headers, data);

    $(".getcameras-btn").click(function() {
        $(".cams-list").empty();
        var groupToken = $(".token-input").val();
        var url = getURLFromToken(groupToken) + '/api/v5/channels';;
        var headers = {"Authorization": "SI " + groupToken};
        getCameras(url, headers, data);
    });
});

function toggleCams(nodeName) {
    $("." + nodeName).toggle();
}

function dragHandler(ev) {
    ev.preventDefault();
}

function getURLFromToken(token) {
    return "https://" + JSON.parse(atob(token)).api;
}