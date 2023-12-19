<?php

include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
include_once ('../../../core/MUser.php');

MCoreJson::init();
MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isPartner())
    error(401, 'Access denied');

list($name) = MCore::checkAndGetInputParameters(['name']);
list($location, $group, $recording, $tz, $lat, $lon, $url, $username, $password, $onvif_rtsp_port_fwd, $serialnumber, $macAddress, $uplink, $dvrName, $channel_number, $dvrId, $isFirst) = 
    MCore::getInputParameters(['location'=>'','group'=>'','recording','tz'=>'UTC','lat'=>0,'lon'=>0,'url','username','password', 'onvif_rtsp_port_fwd'=>0,'serialnumber'=>'','macAddress'=>'', 'uplink'=>'', 'dvrName' => '', 'channel_number' => '', 'dvrId' => '', 'isFirst' => false]);

$password = strval($password);
$username = strval($username);
$name = strval($name);

if (MCore::$core->current_user->getUserCamerasCount()>=MConstants::MAX_CAMERAS_PER_USER)
    error(401, 'Camera limit exceeded for current user');

if ($uplink) {
    $url = MCore::$core->config['camera_proxy_service'];
    if (!$url)
        error(500, 'Camera proxy service url not set.');
}

$onvif_rtsp_port_fwd = $onvif_rtsp_port_fwd ? 0+ $onvif_rtsp_port_fwd : 0;

$meta = null;
if ($dvrName && $channel_number) {
    $dvr_url = explode("/dvr_camera/", $url)[0];
    $loc_str = $location ? ', "location": "'.$location.'"' : "";
    $dvrInfo_str = '{"url": "'.$dvr_url.'", "name": "'.$dvrName.'", "id": "'.$dvrId.'" '.$loc_str.'}';
    //$dvrInfo = ['name' => $dvrName, 'url' => $url, 'id' => $dvrId];
    //if ($location) $dvrInfo['loc'] = $location;
    $meta = ['dvr_name' => $dvrName, 'dvr_camera' => $channel_number, $dvrId => 'dvr_id', 'dvr_id' => $dvrId, 'subid' => 'NOPLAN', 'subname' => 'No Plan'];
    if ($isFirst) $meta['dvr_first_channel'] = $dvrInfo_str;
}
$camera = MCamera::createCamera(MCore::$core->current_user, $name, $location, $group, $recording, $tz, $url, $username, $password, $lat, $lon, $onvif_rtsp_port_fwd, false, $serialnumber, $meta);

if ($camera && $serialnumber && $macAddress) {
    $newSerialNumber = $camera->checkResolverServiceSerial($serialnumber);
    if($newSerialNumber==false) {
        $camera->remove();
        error(500, 'Serial number already in use');
    } else if ($newSerialNumber!==true) {
        $camera->remove();
        error(500, strval($newSerialNumber) . ': Error getting serial numbers from server');
    }
    if (!$camera->addToResolverService($serialnumber, $macAddress)){
        $camera->remove();
        error(401, 'Fail to call camera resolver service');
    }
}

/*if ($camera && strpos(MCore::$core->current_user->js,'ai_access')!==false) {
    list($ai_type) = MCore::getInputParameters(['ai_type']);
    $aiGroupToken = MCore::$core->current_user->getAIChannelGroupToken($ai_type, $camera->camera['channelID']);
    if(!MCamera::setAIConfigByChannelID($camera->camera['channelID'], $ai_type, $aiGroupToken)) {
        $camera->remove();
        error(401, "Fail to set AI configuration");
    }
}*/

MCore::$core->current_user->updateAllCamsToken();

/*if ($camera && strpos(MCore::$core->current_user->js,'retention')!==false){
    list($rec_mode, $recording, $time) = MCore::getInputParameters(['rete_recmode', 'rete_sd', 'rete_time']);
    if ($rec_mode || $recording || $time)
        MCore::$core->response = MCamera::setRetention($camera->camera['channelID'], MCore::$core->current_user, $rec_mode, $recording, $time); 
}*/


if ($camera)
{
    MCore::$core->response['access_tokens']['all'] = $camera->camera['rwToken'];
    MCore::$core->response['id'] = $camera->camera['channelID'];
    MCore::$core->response['meta'] = $camera->meta;
}
    
