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

$camera = MCamera::getCameraByChannelIdAndUser($channel_id, MCore::$core->current_user);
$aiGroupToken = $camera && $camera->camera['aiGroupTokenID'] ? $camera->getCameraGroupToken() : MCore::$core->current_user->getAIChannelGroupToken($type, $channel_id);

$ret = $camera ? $camera->setAIConfig($channel_id, $type, $aiGroupToken) : MCamera::setAIConfigByChannelID($channel_id, $type, $aiGroupToken);

if(!$ret) error(500, "Error setting AI configuration");

// TODO remove from another group token if it is changed