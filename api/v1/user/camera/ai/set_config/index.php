<?php
include_once ('../../../../core/MCoreJson.php');
include_once ('../../../../core/MCamera.php');
include_once ('../../../../core/MUser.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
// Check the access
if (strpos(MCore::$core->current_user->js,'ai_access')===false)
    error(401,'No access');

list($channel_id, $type) = MCore::getInputParameters(['channel_id', 'type']);

$targetToken = MCore::$core->current_user->getAIChannelGroupToken($type, $channel_id);
$currentToken = $type != "off" ? MCore::$core->current_user->getAIChannelGroupToken(null, $channel_id, true) : null;

$ret = MCamera::setAIConfigByChannelID($channel_id, $type, $targetToken, $currentToken);

if(!$ret) error(500, "Error setting AI configuration");

// TODO remove from another group token if it is changed
