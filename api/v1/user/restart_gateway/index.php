<?php

include_once ('../../core/MCoreJson.php');
include_once ('../../core/MCamera.php');
include_once ('../../core/MUser.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isDealer())
    error(403,'No rights');

list($gatewayUrl, $gatewayId, $gatewayUsername, $gatewayPassword) = MCore::checkAndGetInputParameters(['gatewayUrl', 'gatewayId', 'gatewayUsername', 'gatewayPassword']);

$gatewayAuthToken = MCamera::getGatewayAuthToken($gatewayUrl, $gatewayId, $gatewayUsername, $gatewayPassword);
if(!MCamera::restartGateway($gatewayUrl, $gatewayAuthToken)) {
    MCore::$core->response['status'] = "Error restarting gateway";
}

MCore::$core->response['status'] = "Restart succesfull";