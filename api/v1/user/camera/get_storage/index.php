<?php
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();

$meta = MCore::$core->current_user->getAllCamsTokenMeta();
if (isset($meta['storage_channel_id']) && $meta['storage_channel_id']>0){
    MCore::$core->response['storage_channel_id'] = 0+$meta['storage_channel_id'];
    return;
}

$camera = MCamera::createCamera(MCore::$core->current_user, '#StorageFor'.MCore::$core->current_user->id, false, false, 'Canada/Eastern', '', '', '', 0, 0, 0, true);

MCore::$core->current_user->updateAllCamsToken();
$meta['storage_channel_id'] = $camera instanceof MCamera ? $camera->camera['channelID'] : $camera;
MCore::$core->current_user->setAllCamsTokenMeta($meta);

MCore::$core->response['storage_channel_id'] = 0+$meta['storage_channel_id'];

