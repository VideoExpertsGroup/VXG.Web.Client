<?php

include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
include_once ('../../../core/MUser.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isDealer())
    error(403,'No rights');

list($cameraID) = MCore::checkAndGetInputParameters(['id']);
list($gatewayUrl, $gatewayId, $gatewayUsername, $gatewayPassword) = MCore::getInputParameters(['gatewayUrl', 'gatewayId', 'gatewayUsername', 'gatewayPassword']);
$camera = MCamera::getCameraByChannelIdAndUser($cameraID, MCore::$core->current_user);

//MCamera::updateLocationByChannelID($cameraID, MCore::$core->current_user, '');
$planId = MCamera::getCameraPlanId($cameraID);

if ($camera){
    if ($gatewayUrl) {
        $gatewayAuthToken = $camera->getGatewayAuthToken($gatewayUrl, $gatewayId, $gatewayUsername, $gatewayPassword);
        $camera->removeCameraFromGateway($gatewayUrl, $gatewayAuthToken);
    }
    $camera->remove();
}
else
    MCamera::removeByChannelID($cameraID, MCore::$core->current_user);

MCore::$core->current_user->updateAllCamsToken();

if ($planId) MCore::$core->current_user->updatePlanUsed($planId, -1);

if (!MCore::$core->current_user->allCamsToken)
    MCore::$core->response['allCamsToken'] = null;
else
    MCore::$core->response['allCamsToken'] = MCore::$core->current_user->allCamsToken;

/*

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../../static_lib.php");
include_once ($curdir."/../../../../streamland_api.php");

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

if(!StaticLib::isAuthorized())
	StaticLib::error(401, "Unauthorized request");

$userID = StaticLib::$USERID;
$partnerID = StaticLib::isUser() ? StaticLib::$PARENTUSERID : $userID;
$isUser = StaticLib::isUser();

if(!(StaticLib::isPartner() || $isUser))
    StaticLib::error(403, "Access deny");

if(!isset(StaticLib::$REQUEST['id']))
	StaticLib::error(400, "Expected parameter id");

$cameraID = intval(StaticLib::$REQUEST['id']);

// TODO: currently scenario is 1 user 1 camera
$stmt = $conn->prepare('SELECT pt.expired,pt."subscribID" FROM "cameraPlan" cp LEFT JOIN payment pt ON cp."paymentID"=pt.id '.
    'WHERE cp."cameraID"=? AND EXTRACT(EPOCH FROM (to_timestamp(pt.expired, \'YYYY-MM-DD\')-CURRENT_TIMESTAMP))>0');
if (!$stmt->execute(array($cameraID)))
    StaticLib::error(550, $stmt->errorInfo());
if ($row = $stmt->fetch()) {
    if ($row['subscribID'][0] == '-')
        StaticLib::error(490, "The camera still have active plan and can not be removed.");
    else
        StaticLib::error(490, "The camera is subscribed to a plan and can not be removed.");
}

$stmt = $conn->prepare('SELECT * FROM camera WHERE id=? AND "userID"=?');
if (!$stmt->execute(array($cameraID,$partnerID)))
    StaticLib::error(550, $stmt->errorInfo());
if (!($cam = $stmt->fetch()))
    StaticLib::error(404, "Camera not found");
$cameraID = $cam['id'];

// try delete related cloud channel

$stmt = $conn->prepare('SELECT * FROM server WHERE id='.$cam['serverID']);
if(!$stmt->execute())
    StaticLib::error(551, $stmt->errorInfo());
if (!$server = $stmt->fetch())
    StaticLib::error(552,'Server not found.');

$server = MCore::$core->current_user->getServerData();

if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
    StaticLib::error(553, 'Failed creating camera channel. reason: generateServicesURLs');

if ($isUser) { // partner should unlink the camera from user firstly
    include_once($curdir . "/../groupSharedToken.php");
    createGroupSharedToken($conn, $userID, $partnerID);
}

$rc = StreamLandAPI::deleteChannel($cam['channelID']);
if (!($rc == 200 || $rc == 204 || $rc == 404))
    StaticLib::error(554, 'Failed delete channel id '.$cam['channelID'].', rc='.$rc);

// delete related cameras from users
$stmt = $conn->prepare('DELETE FROM "userCamera" WHERE "cameraID"='.$cameraID); // TODO: currently scenario is 1 user 1 camera
if (!$stmt->execute())
    StaticLib::error(555, $stmt->errorInfo());

$stmt = $conn->prepare('DELETE FROM camera WHERE id='.$cameraID);
if (!$stmt->execute())
	StaticLib::error(556, $stmt->errorInfo());

if (MCore::$core->current_user->updateAllCamsToken())
    $response['allCamsToken'] = MCore::$core->current_user->allCamsToken;

$response['httpcode'] = 200;
StaticLib::endPage($response);
*/