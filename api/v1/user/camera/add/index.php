<?php

include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
include_once ('../../../core/MUser.php');
MCoreJson::init();
MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isPartner())
    error(401, 'Access denied');

list($name) = MCore::checkAndGetInputParameters(['name']);
list($location, $recording, $tz, $lat, $lon, $url, $username, $password, $onvif_rtsp_port_fwd, $serialnumber, $gspassword) = 
    MCore::getInputParameters(['location'=>'','recording','tz'=>'UTC','lat'=>0,'lon'=>0,'url','username','password', 'onvif_rtsp_port_fwd'=>0,'serialnumber'=>'','gspassword'=>'']);

$password = strval($password);
$username = strval($username);
$name = strval($name);

if (MCore::$core->current_user->getUserCamerasCount()>=MConstants::MAX_CAMERAS_PER_USER)
    error(401, 'Camera limit exceeded for current user');

$onvif_rtsp_port_fwd = $onvif_rtsp_port_fwd ? 0+ $onvif_rtsp_port_fwd : 0;
$camera = MCamera::createCamera(MCore::$core->current_user, $name, $location, $recording, $tz, $url, $username, $password, $lat, $lon, $onvif_rtsp_port_fwd, false, $serialnumber);

if ($camera && $serialnumber && $gspassword) {
    if (!$camera->addToResolverService($serialnumber, $gspassword)){
        $camera->remove();
        error(401, 'Fail to call camera resolver service');
    }
}

MCore::$core->current_user->updateAllCamsToken();

if ($camera && strpos(MCore::$core->current_user->js,'retention')!==false){
    list($rec_mode, $recording, $time) = MCore::getInputParameters(['rete_recmode', 'rete_sd', 'rete_time']);
    if ($rec_mode || $recording || $time)
        MCore::$core->response = MCamera::setRetention($camera->camera['channelID'], MCore::$core->current_user, $rec_mode, $recording, $time); 
}


if ($camera)
{
    MCore::$core->response['access_tokens']['all'] = $camera->camera['rwToken'];
    MCore::$core->response['id'] = $camera->camera['channelID'];
}
    
