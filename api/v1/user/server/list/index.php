<?php

include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MServer.php');
include_once ('../../../core/MUser.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isUser() && !MCore::$core->current_user->isDealer() && !MCore::$core->current_user->isDistributor())
    error(401,'No access');
    
$servers = MServer::getServerListByUser(MCore::$core->current_user);

$ret = [];
foreach($servers as $server){
    $r = [
        'id'=>$server->server['id'],
        'name'=>$server->server['name'] ? $server->server['name'] : 'Server '.$server->server['uuid'],
        'online'=>$server->server['online'],
    ];
    if (isset($server->server['endpoint'])) $r['endpoint'] = $server->server['endpoint'];
    if (isset($server->server['expires'])) $r['expires'] = $server->server['expires'];
    $ret[] = $r;
}

MCore::$core->response['data'] = $ret;