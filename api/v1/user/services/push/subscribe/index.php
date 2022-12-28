<?php
include_once ('../../../../core/MCoreJson.php');
include_once ('../../../../core/MUser.php');
MCore::init();

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../../../static_lib.php");
include_once ($curdir."/../../../../../streamland_api.php");

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

if (!StaticLib::isAuthorized())
    StaticLib::error(401, "Unauthorized request");

if( ! (StaticLib::isUser() || StaticLib::isPartner()))
    StaticLib::error(401, "Only for user and admin role");

$userID = StaticLib::$USERID;

if(!isset(StaticLib::$REQUEST['deviceID'], StaticLib::$REQUEST['platform'], StaticLib::$REQUEST['notificationToken']))
    StaticLib::error(400, "Expected parameters: deviceID, platform, notificationToken");

$platform = StaticLib::$REQUEST['platform'];
$deviceID = StaticLib::$REQUEST['deviceID'];

$stmt = $conn->prepare('SELECT * FROM settings WHERE sett_name=?');
if (!$stmt->execute(array('appKey4'.$platform)))
    StaticLib::error(500, print_r($stmt->errorInfo(),true));
if (!($row = $stmt->fetch()))
    StaticLib::error(550, 'No firebase ID found for your platform');
$obj = json_decode($row['sett_value'], true);
//$packageID = $obj['package'];
$appID = $obj['appID'];
$appSecret = '';
//if ($platform == 'android') {}
if ($platform == 'ios_dev' || $platform == 'ios' ) {
    $appSecret = $obj['secret'];
}

// try to unsubscribe all old push notifications if exist
$stmt = $conn->prepare('SELECT * FROM "pushService" ps WHERE ps."deviceID"=? AND ps."userID"='.StaticLib::$USERID);
if (!$stmt->execute(array(StaticLib::$REQUEST['deviceID'])))
    StaticLib::error(500, print_r($stmt->errorInfo(),true));

$server = MCore::$core->current_user->getServerData();
if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
    StaticLib::error(550, 'Notification subscription failed by reason: generateServicesURLs error');

while($row = $stmt->fetch()){
    $response_cloud = StreamLandAPI::unsubscribeNotification($row['cameraID'], $row['key']);
    if (isset($response_cloud['errorDetail']))
        StaticLib::error(551, 'Notification unsubscription failed.');
}
$stmt = $conn->prepare('DELETE FROM "pushService" WHERE "deviceID"=? AND "userID"='.$userID);
if (!$stmt->execute(array($deviceID)))
    StaticLib::error(500, print_r($stmt->errorInfo(),true));

// and now subscribe for the application
$data = array();
$data['language'] = 'en';
$data['name'] = 'RtspPlayer';
$data['token'] = StaticLib::$REQUEST['notificationToken'];
$data['application'] = array();
$data['application']['platform'] = $platform;
$data['application']['name'] = 'APNS VXG CloudOne Player';
$data['application']['id'] = $appID;
$data['application']['secret'] = $appSecret;

$chids = [];
if (StaticLib::isUser()){
    $stmt = $conn->prepare('SELECT uc."cameraCHID" FROM "userCamera" uc WHERE uc."userID"='.$userID);
    if (!$stmt->execute())
        StaticLib::error(500, print_r($stmt->errorInfo(),true));
    while($row = $stmt->fetch(PDO::FETCH_ASSOC))
        $chids[] = $row['cameraCHID'];
} else {
    $ret = StreamLandAPI::getCamerasList();
    if (isset($response_cloud['errorDetail']))
        error(500, $response_cloud['errorDetail']);
    foreach($ret['objects'] as $o)
        $chids[] = $o['id'];
}

foreach($chids as $channel_id){
    $response_cloud = StreamLandAPI::subscribeNotification($channel_id, $data, $server['serverLkey']);
    if (isset($response_cloud['errorDetail']))
        StaticLib::error(553, 'Notification subscription failed. resp: '.print_r($response_cloud, true).'data: '.print_r($data, true));

    $pushID = $response_cloud['id'];
    $stmt2 = $conn->prepare('INSERT INTO "pushService" ("userID","cameraID","pushID","deviceID") VALUES(?,?,?,?)');
    if (!$stmt2->execute(array($userID,$channel_id,$pushID,$deviceID)))
        StaticLib::error(554, 'Failed inserting push in db. '.print_r($stmt2->errorInfo(),true));
}

/*
if (StaticLib::isUser())
//$stmt = $conn->prepare('SELECT c.id as "cameraID",c."channelID" FROM "userCamera" uc LEFT JOIN camera c ON uc."cameraID"=c.id WHERE uc."userID"='.$userID);
    $stmt = $conn->prepare('SELECT uc."cameraCHID" as "channelID" FROM "userCamera" uc WHERE uc."userID"='.$userID);
else 
	$stmt = $conn->prepare('SELECT c.id as "cameraID",c."channelID"  FROM camera c WHERE c."userID"='.$userID);

if (!$stmt->execute())
    StaticLib::error(500, print_r($stmt->errorInfo(),true));

while($row = $stmt->fetch(PDO::FETCH_ASSOC)){

    $server = MCore::$core->current_user->getServerData();
    if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
        StaticLib::error(552, 'Notification subscription failed by reason: generateServicesURLs error');

    $response_cloud = StreamLandAPI::subscribeNotification($row['channelID'], $data, $server['serverLkey']);
    if (isset($response_cloud['errorDetail']))
        StaticLib::error(553, 'Notification subscription failed. resp: '.print_r($response_cloud, true).'data: '.print_r($data, true));

    $pushID = $response_cloud['id'];
    $stmt2 = $conn->prepare('INSERT INTO "pushService" ("userID","cameraID","pushID","deviceID") VALUES(?,?,?,?)');
    $camID = $row['channelID'];
    if (!$stmt2->execute(array($userID,$camID,$pushID,$deviceID)))
        StaticLib::error(554, 'Failed inserting push in db. '.print_r($stmt2->errorInfo(),true));
}
*/

$response['httpcode'] = 200;
StaticLib::endPage($response);
