<?php

include_once ('../../core/MCoreJson.php');
include_once ('../../core/MCamera.php');
include_once ('../../core/MUser.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isDealer())
    error(403,'No rights');

list($gatewayUrl, $gatewayId, $gatewayUsername, $gatewayPassword, $isOpenWRT) = MCore::checkAndGetInputParameters(['gatewayUrl', 'gatewayId', 'gatewayUsername', 'gatewayPassword', 'openwrt']);

$gatewayAuthToken = MCamera::getGatewayAuthToken($gatewayUrl, $gatewayId, $gatewayUsername, $gatewayPassword, $isOpenWRT);

if ($isOpenWRT) {
    MCamera::restartOpenWRT($gatewayUrl, $gatewayAuthToken);
    MCore::$core->response['status'] = "Don't wait for response";
} else {
    if(!MCamera::restartGateway($gatewayUrl, $gatewayAuthToken)) {
        MCore::$core->response['status'] = "Error restarting gateway";
    }
    MCore::$core->response['status'] = "Restart succesfull";
}


