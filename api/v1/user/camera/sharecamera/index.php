<?php
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isDealer())
    error(401,'No access');

list($channel_id, $expired_seconds) = MCore::getInputParameters(['channel_id','expired_seconds']);


$server = MCore::$core->current_user->getServerData();
if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
    error(555, 'Failed generateServicesURLs');

$response_cloud = StreamLandAPI::shareChannel($channel_id, $expired_seconds, $server['serverLkey']);

if (!$response_cloud['token'])
    error(501,'Fail to share camera');

$api = str_replace('https://','',str_replace('http://','',$server['serverHost']));
if (substr($api,-1)=='/') $api = substr($api,0,strlen($api)-1);

if (strpos($server['serverHost'],'https')===false)
    $tok = ["access"=> "watch", "token"=>$response_cloud['token'], "camid"=> $channel_id, "api"=>$api, "api_p"=>$server['serverPort']];
else
    $tok = ["access"=> "watch", "token"=>$response_cloud['token'], "camid"=> $channel_id, "api"=>$api, "api_sp"=>$server['serverPort']];
$tok = base64_encode(json_encode($tok));

MCore::$core->response['token'] = $tok;
MCore::$core->response['created'] = strtotime($response_cloud['created']);
MCore::$core->response['expire'] = strtotime($response_cloud['expire']);
