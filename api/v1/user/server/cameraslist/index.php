<?php

include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MServer.php');
include_once ('../../../core/MUser.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isUser() && !MCore::$core->current_user->isDealer() && !MCore::$core->current_user->isDistributor())
    error(401,'No access');

list($server_id) = MCore::checkAndGetInputParameters(['server_id']);
    
$cams = MServer::getCamerasListByUser($server_id, MCore::$core->current_user);

foreach($cams as $cam){
    $ret[] = [
        'id'=>$cam->camera['id'],
        'name'=>$cam->camera['name'],
        'token'=>$cam->camera['access_tokens']['watch'],
    ];
}

MCore::$core->response['data'] = $ret;