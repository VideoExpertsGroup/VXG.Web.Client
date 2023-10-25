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

$groupTokens = MCore::$core->current_user->getAllAIGroupTokens();

foreach ($groupTokens as $gt) {

    $ai_params = json_decode($gt['meta']['ai_params']);
    $ai_filter = $ai_params->{'filter'};

    if (in_array($channel_id, $gt['channels'])) {
        if ($ai_filter == 'recording_thumbnail' && $gt['meta']['ai_type'] == "object_and_scene_detection") {
            MCore::$core->response['ai_type'] = "continuous";
            return;
        } else if ($ai_filter == "undefined" && $gt['meta']['ai_type'] == "object_and_scene_detection") {
            MCore::$core->response['ai_type'] = "by_event";
            return;
        }
    } 
}

MCore::$core->response['ai_type'] = "off";