<?php

include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
include_once ('../../../core/MUser.php');

MCoreJson::init();
MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isPartner())
    error(401, 'Access denied');

list($name) = MCore::checkAndGetInputParameters(['name']);
list($location, 
     $location_str,
     $group, 
     $recording, 
     $tz, 
     $lat, $lon, 
     $url, 
     $username, $password, 
     $onvif_rtsp_port_fwd, $http_port,
     $serialnumber, $macAddress, $uplink, 
     $dvrName, $channel_number, $uuid, $isFirst, 
     $gatewayId, $max_num_cameras,
     $gatewayCam, $gatewayUrl, $cameraIp, $path, $rtspOnly) = 
    MCore::getInputParameters(['location'=>'',
                               'location_str'=>'',
                               'group'=>'',
                               'recording',
                               'tz'=>'UTC',
                               'lat'=>0,'lon'=>0,
                               'url',
                               'username','password',
                               'onvif_rtsp_port_fwd'=>0, 'url_http_port'=>0,
                               'serialnumber'=>'','macAddress'=>'', 'uplink'=>'',
                               'dvrName'=>'','channel_number'=>'','uuid' =>'','isFirst'=>false,
                               'gatewayId'=>'','max_num_cameras'=>'',
                               'gatewayCam' => false, 'gatewayUrl' => '', 'url_ip' => '', 'path' => '', 'rtspOnly' => false]);

$password = strval($password);
$username = strval($username);
$name = strval($name);

if (MCore::$core->current_user->getUserCamerasCount()>=MConstants::MAX_CAMERAS_PER_USER)
    error(401, 'Camera limit exceeded for current user');

if ($uplink || $gatewayId) {
    $url = MCore::$core->config['camera_proxy_service'];
    if (!$url)
        error(500, 'Camera proxy service url not set.');

    // Check if the first character is "/"
    if (substr($path, 0, 1) === '/') {
        // Remove the first character
        $path = substr($path, 1);
    }
    // Other checking can be done here
    $url .= $path;
}

$onvif_rtsp_port_fwd = $onvif_rtsp_port_fwd ? 0+ $onvif_rtsp_port_fwd : 0;

$meta = null;
if ($dvrName && $channel_number) {
    $dvr_url = explode("/dvr_camera/", $url)[0];
    $loc_str = $location ? ', "location": "'.$location.'"' : "";
    $dvrInfo_str = '{"url": "'.$dvr_url.'", "name": "'.$dvrName.'", "id": "'.$uuid.'" '.$loc_str.'}';
    $meta = ['dvr_name' => $dvrName, 'dvr_camera' => $channel_number, $uuid => 'dvr_id', 'dvr_id' => $uuid, 'subid' => 'NOPLAN', 'subname' => 'No Plan'];
    if ($isFirst) $meta['dvr_first_channel'] = $dvrInfo_str;
} else if ($gatewayCam && $gatewayId) {
    $meta = [$gatewayId => 'gateway_id', 'gateway_id' => $gatewayId, 'gateway_cam' => "gateway_cam"];
} else if ($gatewayId && $max_num_cameras && $uuid) {
    $meta = ['gateway' => 'gateway', $gatewayId => 'gateway_id', 'gateway_id' => $gatewayId, $uuid => 'unique_id', 'max_num_cameras' => $max_num_cameras, 'subid' => 'NOPLAN', 'subname' => 'No Plan'];
}

if ($location_str) {
    $locTypes = ["Province", "City", "Zone", "Circuit", "Subcircuit"];
    $locArr = explode(":", $location_str);
    for ($i = 0; $i < count($locArr); $i++) {
        $removeLocType = trim(substr($locArr[$i], strpos($locArr[$i], '_') + 1));
        $locName = str_replace("_", " ", $removeLocType);
        if ($i == count($locArr) - 1) $location = $locName;
        // "Province": "Ontario", "province_Ontario": ""
        if ($meta){
            $meta[$locArr[$i]] = "";
            $meta[$locTypes[$i]] = $locName;
        } else {
            $meta = [$locArr[$i] => "", $locTypes[$i] => $locName];
        }
    }
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

if ($gatewayCam) {
    $gatewayAuthToken = $camera->getGatewayAuthToken($gatewayUrl);
    $http = $http_port ? $http_port : 80;
    $rtsp = $onvif_rtsp_port_fwd ? $onvif_rtsp_port_fwd : 554;
    $rtspOnly = $rtspOnly ? $rtspOnly : false;

    $params = [ 'ip'=>$cameraIp,
                'http_port'=>$http,
                'rtsp_port'=>$rtsp,
                'is_active'=>false,
                'pid'=>null,
                'access_token'=>$camera->camera['rwToken'],
                'rtsp_only'=>$rtspOnly
            ];

    if ($serialnumber && $macAddress) {
        $params['serial'] = $serialnumber;
        $params['mac'] = $macAddress;
    }

    $camera->addCameraToGateway($params, $gatewayUrl, $gatewayAuthToken);
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
    
