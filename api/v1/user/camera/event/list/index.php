<?php

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../../../static_lib.php");
include_once ($curdir."/../../../../../streamland_api.php");

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

if(!StaticLib::isAuthorized())
    StaticLib::error(401, "Unauthorized request");

$partnerID = StaticLib::isUser() ? StaticLib::$PARENTUSERID : StaticLib::$USERID;

if(!(StaticLib::isPartner() || StaticLib::isUser()))
    StaticLib::error(403, "Access deny");

if(!isset(StaticLib::$REQUEST['id'],StaticLib::$REQUEST['from'],StaticLib::$REQUEST['limit'],StaticLib::$REQUEST['offset']))
    StaticLib::error(400, "Expected parameters: id, from");

$cameraID = intval(StaticLib::$REQUEST['id']);
$fromTS = StaticLib::$REQUEST['from'];

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

if (!StreamLandAPI::generateServicesURLs($server['hostname'], $server['port']))
    StaticLib::error(553, 'Failed. reason: generateServicesURLs');

$params = array(
    'camid' => $cam['channelID'],
    'start' => $fromTS,
    'offset' => StaticLib::$REQUEST['offset'],
    'limit' => StaticLib::$REQUEST['limit']
);
if (!empty(StaticLib::$REQUEST['to']))
    $params['end'] = StaticLib::$REQUEST['to'];
$response_cloud = StreamLandAPI::getChannelEvents($server['key'], $params);
if (isset($response_cloud['errorDetail']))
    StaticLib::error(554, 'Failed get channel events channel id '.$cam['channelID'].', errorDetail='.$response_cloud['errorDetail']);

$response = $response_cloud['meta'];
$response['objects'] = $response_cloud['objects'];
$response['from'] = $fromTS;

$response['httpcode'] = 200;
StaticLib::endPage($response);
