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



if(!isset(StaticLib::$REQUEST['deviceID'])) //TODO: complete this
    StaticLib::error(400, "Expected parameters: deviceID");

$server = MCore::$core->current_user->getServerData();

if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
    StaticLib::error(550, 'Notification unsubscription failed by reason: generateServicesURLs error');

//                        SELECT c."channelID",ps."deviceID",ps.id as psid FROM "pushService" ps LEFT JOIN camera c ON ps."cameraID"=c.id WHERE ps."deviceID"='2a79e6829d61d826' AND ps."userID"=17;
//$stmt = $conn->prepare('SELECT ps."deviceID",ps.id,"channelID" as psid FROM "pushService" ps LEFT JOIN camera c ON ps."cameraID"=c.id WHERE ps."deviceID"="" AND ps."userID"='.StaticLib::$USERID);
//if (!$stmt->execute(array(StaticLib::$REQUEST['deviceID'])))

//$stmt = $conn->prepare('SELECT ps."pushID",ps.id as psid,c."channelID" FROM "pushService" ps LEFT JOIN camera c ON ps."cameraID"=c.id WHERE ps."deviceID"=? AND ps."userID"=?');
$stmt = $conn->prepare('SELECT ps."pushID",ps.id as psid,ps."cameraID" as "channelID" FROM "pushService" ps WHERE ps."deviceID"=? AND ps."userID"=?');
if (!$stmt->execute(array(StaticLib::$REQUEST['deviceID'],StaticLib::$USERID)))

//$stmt = $conn->prepare('SELECT ps."deviceID",ps.id,"channelID" as psid FROM "pushService" ps LEFT JOIN camera c ON ps."cameraID"=c.id WHERE ps."deviceID"=? AND ps."userID"=?'.StaticLib::$USERID);
//if (!$stmt->execute())
    StaticLib::error(500, print_r($stmt->errorInfo(),true));

while($row = $stmt->fetch(PDO::FETCH_ASSOC)){
    $response_cloud = StreamLandAPI::unsubscribeNotification($row['channelID'], $row['pushID'] ,$server['serverLkey']);
    if (isset($response_cloud['errorDetail']))
        StaticLib::error(551, 'Notification unsubscription failed.');

    $stmt2 = $conn->prepare('DELETE FROM "pushService" WHERE id='.$row['psid']);
    if (!$stmt2->execute())
        StaticLib::error(552, print_r($stmt2->errorInfo(),true));
}

$response['httpcode'] = 200;
StaticLib::endPage($response);
