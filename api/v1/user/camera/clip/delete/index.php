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

if(!isset(StaticLib::$REQUEST['id'], StaticLib::$REQUEST['camid'])){
    StaticLib::error(400, "id and camid are required");
}

$userID = StaticLib::$USERID;
$cameraID = StaticLib::$REQUEST['camid'];
$clipID = StaticLib::$REQUEST['id'];

$stmt = $conn->prepare('SELECT c.* FROM "userCamera" uc LEFT JOIN camera c ON uc."cameraCHID"=c."channelID" WHERE uc."cameraCHID"=? AND uc."userID"='.$userID);
if (!$stmt->execute(array($cameraID)))
    StaticLib::error(550, $stmt->errorInfo());
if (!($cam = $stmt->fetch()))
    StaticLib::error(404, "Camera not found");

$response_cloud = StreamLandAPI::deleteClip($clipID, $cam['rwToken']);
if (isset($response_cloud['errorDetail'])) {
    StaticLib::error(556, 'Failed delete channel clip');
}

$response['data'] = $response_cloud;
$response['httpcode'] = 200;
StaticLib::endPage($response);
