<?php

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../../../static_lib.php");
include_once ($curdir."/../../../../../streamland_api.php");

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

if(!StaticLib::isAuthorized()){
	StaticLib::error(401, "Unauthorized request");
}

if(!StaticLib::isUser()){
	StaticLib::error(403, "Access deny");
}

if(!isset(StaticLib::$REQUEST['camid'],StaticLib::$REQUEST['start'],StaticLib::$REQUEST['end'])){
    StaticLib::error(400, "camid, start and end are required");
}

$userID = StaticLib::$USERID;
$cameraID = StaticLib::$REQUEST['camid'];

$stmt = $conn->prepare('SELECT c.* FROM "userCamera" uc LEFT JOIN camera c ON uc."cameraCHID"=c."channelID" WHERE uc."cameraCHID"=? AND uc."userID"='.$userID);
if (!$stmt->execute(array($cameraID)))
    StaticLib::error(550, $stmt->errorInfo());
if (!($cam = $stmt->fetch()))
    StaticLib::error(404, "Camera not found");

$clipOpt = array(
    'start' => StaticLib::$REQUEST['start'],
    'end' => StaticLib::$REQUEST['end'],
    'delete_at' => date('Y-m-d\TH:i:s', time() + 604800) // 1week = 604800
);

$response_cloud = StreamLandAPI::createClip($clipOpt, $cam['rwToken']);
if (isset($response_cloud['errorDetail'])) {
    StaticLib::error(556, 'Failed creating channel clip');
}
// TODO: insert record into clipCamera table

$response['data'] = $response_cloud;
$response['httpcode'] = 200;
StaticLib::endPage($response);
