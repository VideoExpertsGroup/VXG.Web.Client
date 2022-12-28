<?php

include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
include_once ('../../../core/MUser.php');
MCoreJson::init();
MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isPartner())
    error(401, 'Access denied');

list($name, $channel_id) = MCore::checkAndGetInputParameters(['name','cameraID']);
list($location, $recording, $tz, $lat, $lon, $url, $username, $password, $onvif_rtsp_port_fwd) = 
    MCore::getInputParameters(['location'=>'','recording','tz'=>'UTC','lat'=>0,'lon'=>0,'url','username','password', 'onvif_rtsp_port_fwd'=>0]);

if (mb_strlen($location)>60)
    error(501,'Location contain more than 60 symbols');
if (preg_match('/[^a-zA-Z\d\s\-]/', $location))
    error(501,'Location can contain only a-z, A-Z, 0-9, "-" and space');

$camera = MCamera::getCameraByChannelIdAndUser($channel_id);
if (!$camera)
    error(404,'Camera not found');

$camera->updateCamera($name, $location, $recording, $tz, $url, $username, $password, $lat, $lon, $onvif_rtsp_port_fwd);

if ($camera->camera['location'] && $location!=$camera->camera['location'])
    MCore::$core->current_user->removeLocationFromAllCamsTokenMeta($camera->camera['location']);
if ($location!=$camera->camera['location'])
    MCore::$core->current_user->addLocationToAllCamsTokenMeta($location);
