<?php
use kornrunner\Keccak;
include_once ('../../core/MCoreJson.php');
include_once ('../../core/MUser.php');
include_once ('../../core/MCamera.php');
MCoreJson::init();
MCore::checkOnlyForAuthorized();

if (MCore::$core->current_user->isPartner() && !MCore::$core->current_user->serverLkey)
    MCore::$core->current_user->updateLicenseKey();
if (!MCore::$core->current_user->allCamsToken)
    MCore::$core->current_user->updateAllCamsToken();

$server = MCore::$core->current_user->getServerData();
$cloud_url = $server['serverHost'];
if (substr($cloud_url,-1)=='/')
    $cloud_url = substr($cloud_url,0, strlen($cloud_url)-1);
$cloud_url = $cloud_url . ':' . $server['serverPort'];

MCore::$core->response['cloud_url'] = $cloud_url;
MCore::$core->response['allCamsToken'] = MCore::$core->current_user->allCamsToken;
MCore::$core->response['email'] = MCore::$core->current_user->email;
MCore::$core->response['role'] = MCore::$core->current_user->role;
MCore::$core->response['token'] = MCore::$core->current_user->token;
MCore::$core->response['uid'] = MCore::$core->current_user->id;
MCore::$core->response['username'] = MCore::$core->current_user->name;
MCore::$core->response['vxgstripe_url'] = MCore::$core->config['vxgstripe_url'];
MCore::$core->response['settings'] = [];
MCore::$core->response['capture_id'] = MCore::$core->config['capture_id'];
MCore::$core->response['servers'] = MCore::$core->current_user->getServersIdList();
MCore::$core->response['phone'] = MCore::$core->current_user->phone;
MCore::$core->response['sheduler'] = MCore::$core->current_user->sheduler;

$meta = MCore::$core->current_user->getAllCamsTokenMeta();

if (0 &&isMobile())

$skin["scripts"]["partner"]=[
//    "core/modules/reports/reports.js",
//    "core/modules/users/users.js",
    "core/modules/mobcameras/cameras.js",
//    "core/modules/activity/activity.js",
//    "core/modules/profile/profile.js",
//    "core/modules/player/cameraowner.js",
//    "core/modules/player/camerameta.js",
//    "core/modules/player/cameraedit.js",
//    "core/modules/player/cameraeditsettings.js",
    "core/modules/player/player.js",
    "core/modules/player/playercontrol.js",
//    "core/modules/subscribe/subscribe.js",
//    "core/modules/subscribe/plan2camera.js",
//    "core/modules/player/cameramd.js"
];


$s = explode("\n", trim(MCore::$core->current_user->js));
if (is_array($s) && count($s)>0 && $s[0])
    MCore::$core->response['scripts'] = array_merge($s, $skin['scripts'][MCore::$core->current_user->role]);
else
    MCore::$core->response['scripts'] = $skin['scripts'][MCore::$core->current_user->role];

if ((!isset($meta['storage_channel_id']) || !(0+$meta['storage_channel_id'])) && !MCore::$core->current_user->isUser()){
    $camera = MCamera::createCamera(MCore::$core->current_user, '#StorageFor'.MCore::$core->current_user->id, false, false, 'Canada/Eastern', '', '', '', 0, 0, 0, true);
    MCore::$core->current_user->updateAllCamsToken();
    $meta['storage_channel_id'] = $camera instanceof MCamera ? $camera->camera['channelID'] : $camera;
    MCore::$core->current_user->setAllCamsTokenMeta($meta);
    
/*    
    $i = array_search("core/modules/archieve/archieve.js",MCore::$core->response['scripts']);
    if ($i!==false)
        unset(MCore::$core->response['scripts'][$i]);
*/        

}

/*
if (MCore::$core->current_user->isUser())
    MCore::$core->response['scripts']=[
        'core/modules/reports/reports.js',
        'core/modules/cameras/cameras.js',
        'core/modules/activity/activity.js',
        'core/modules/profile/profile.js',
        'core/modules/player/player.js',
        'core/modules/player/playercontrol.js',
        'core/modules/player/camerameta.js',
        'core/modules/player/cameramd.js'
    ];
else 
    MCore::$core->response['scripts']=[
        'core/modules/reports/reports.js',
        'core/modules/users/users.js',
        'core/modules/cameras/cameras.js',
        'core/modules/activity/activity.js',
        'core/modules/profile/profile.js',
        'core/modules/player/cameraowner.js',
        'core/modules/player/camerameta.js',
        'core/modules/player/cameraedit.js',
        'core/modules/player/cameraeditsettings.js',
        'core/modules/player/player.js',
        'core/modules/player/playercontrol.js',
        'core/modules/subscribe/subscribe.js',
        'core/modules/subscribe/plan2camera.js',
        'core/modules/player/cameramd.js'
    ];
*/    

/*
if (MCore::$core->current_user->email=='daniel@videoexpertsgroup.com' || 
    MCore::$core->current_user->email=='ibigroup@mailinator.com')
    MCore::$core->response['scripts'][]='core/modules/map/map.js';
*/