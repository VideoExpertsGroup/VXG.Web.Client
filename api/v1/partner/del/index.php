<?php
include_once ('../../core/MCoreJson.php');
include_once ('../../core/MUser.php');
include_once ('../../core/MCamera.php');

MCoreJson::init();
MCore::checkOnlyForAuthorized();

if (!MCore::$core->current_user->isDistributor())
    error('401','No access');

list($user_id) = MCore::checkAndGetInputParameters(['id']);

$user = MUser::getUserById(0+$user_id);
if (!$user)
    error(401,'User not found');

if ($user->getNonStorageCameraCount()>0)
    error(577,'Cannot remove users with related cameras.');

$storageCamIds = $user->getStorageCameraIds();
foreach($storageCamIds as $camid) {
    MCamera::removeByChannelID($camid, $user);
}

$user->updateAllCamsToken();

MUser::deleteFirebaseUser($user->email);
$user->deleteUser();    

/*
return;

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../static_lib.php");
include_once ($curdir."/../../../streamland_api.php");

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

if(!StaticLib::isAuthorized()){
	StaticLib::error(401, "Unauthorized request");
}

if(!isset(StaticLib::$REQUEST['id'])){
	StaticLib::error(400, "Expected parameter id");
}
$userIDtoDelete = intval(StaticLib::$REQUEST['id']);
$parentUserID = StaticLib::$USERID;

// 1. check that child user exist
$stmt = $conn->prepare('SELECT count(*) AS "amountUsers" FROM "user" WHERE id = ? AND "parentUserID" = ?');
if (!$stmt->execute(array($userIDtoDelete, $parentUserID)))
    StaticLib::error(550, $stmt->errorInfo());
$row = $stmt->fetch();
if (empty($row['amountUsers']))
    StaticLib::error(404,'User not found.');

// 2. check that user does not have other users
$stmt = $conn->prepare('SELECT count(*) AS "amountUsers" FROM "user" WHERE "parentUserID" = ?');
if (!$stmt->execute(array($userIDtoDelete)))
    StaticLib::error(550, $stmt->errorInfo());
$row = $stmt->fetch();
if (!empty($row['amountUsers']))
    StaticLib::error(577,'It is allowed to delete only an empty users.');

if (StaticLib::isPartner()) { // if partner(dealer) makes delete a user
    // 3. check that user does not have related cameras
    $stmt = $conn->prepare('SELECT count(*) AS "amountCameras" FROM "userCamera" WHERE "userID"=?');
    if (!$stmt->execute(array($userIDtoDelete)))
        StaticLib::error(550, $stmt->errorInfo());
    $row = $stmt->fetch();
    if (!empty($row['amountCameras']))
        StaticLib::error(577,'It is allowed to delete only users without related cameras.');
}

$stmt = $conn->prepare('DELETE FROM "user" WHERE id = ? AND "parentUserID" = ?');
if (!$stmt->execute(array($userIDtoDelete, $parentUserID)))
    StaticLib::error(560, $stmt->errorInfo());


$response['httpcode'] = 200;
StaticLib::endPage($response);
*/