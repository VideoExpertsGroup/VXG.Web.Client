<?php

include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MServer.php');
include_once ('../../../core/MUser.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isUser() && !MCore::$core->current_user->isDealer() && !MCore::$core->current_user->isDistributor())
    error(401,'No access');

list($server_uuid) = MCore::checkAndGetInputParameters(['uuid']);
$newServer = MCore::$core->current_user->addServer($server_uuid);
if (!$newServer) {
    error(501,"Failed to add server");
} else if ($newServer['errorDetail']) {
    error(501,$newServer['errorDetail']);
} else {
    MCore::$core->response['server'] = $newServer;
}

