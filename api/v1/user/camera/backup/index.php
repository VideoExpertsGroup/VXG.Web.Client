<?php
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
include_once ('../../../core/MUser.php');

MCoreJson::init();
MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isPartner())
    error(401, 'Access denied');

list($channelId, $accessToken, $startTime, $endTime, $overwrite) = MCore::checkAndGetInputParameters(['channel_id', 'access_token', 'startTime', 'endTime', 'overwrite']);
$camera = MCamera::getCameraByChannelIdAndUser($channelId, MCore::$core->current_user);
$syncInfo = $camera ? $camera->memoryBackup(null, null, $startTime, $endTime, $overwrite) : MCamera::memoryBackup($channelId, $accessToken, $startTime, $endTime, $overwrite);

if ($syncInfo) {
    MCore::$core->response['sync_id'] = $syncInfo['id'];
    MCore::$core->response['sync_status'] = $syncInfo['status'];
}
else 
    error(500, "Couldn't create memory card synchronization");
    