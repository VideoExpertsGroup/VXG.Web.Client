<?php

include_once ('../../core/MCoreJson.php');
include_once ('../../core/MCamera.php');
include_once ('../../core/MUser.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isDealer())
    error(403,'No rights');

list($gatewayUrl) = MCore::checkAndGetInputParameters(['gatewayUrl']);

$gatewayAuthToken = MCamera::getGatewayAuthToken($gatewayUrl);
if(!MCamera::restartGateway($gatewayUrl, $gatewayAuthToken)) {
    MCore::$core->response['status'] = "Error restarting gateway";
}

MCore::$core->response['status'] = "Restart succesfull";