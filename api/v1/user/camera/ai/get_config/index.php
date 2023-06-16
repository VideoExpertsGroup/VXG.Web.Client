<?php
include_once ('../../../../core/MCoreJson.php');
include_once ('../../../../core/MCamera.php');
include_once ('../../../../core/MUser.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
// Check the access
if (strpos(MCore::$core->current_user->js,'ai_access')===false)
    error(401,'No access');

list($channel_id, $camera_list) = MCore::getInputParameters(['channel_id', 'camera_list']);
// because it takes so long to get the groupTokens, I'll give them in a list so we only have to do the call once 
if ($camera_list) {
    $aiEnabledCameras = MCore::$core->current_user->getListOfAIEnabledCameras($camera_list);
    MCore::$core->response['ai_cameras'] = $aiEnabledCameras;
    return;
} 

$groupTokens = MCore::$core->current_user->getAIChannelGroupTokens();

foreach ($groupTokens['objects'] as $gt) {
    if (in_array($channel_id, $gt['channels'])) {
        if ($gt['meta']['ai_type'] == "object_and_scene_detection" && $gt['meta']['ai_period'] == '180') {
            // continuous
            MCore::$core->response['ai_type'] = "continuous";
            return;
        } /*else if (// by_event params) {
            // by_event for now
            MCore::$core->response['ai_type'] = "by_event";
        }*/
    } 
}

MCore::$core->response['ai_type'] = "off";