<?php
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');

MCoreJson::init();
MCore::checkOnlyForAuthorized();

if (!MCore::$core->current_user->isPartner())
    error(403, "Access deny");

list($withUserID, $attach, $detach) = MCore::checkAndGetInputParameters(['withUserID', 'attach', 'detach']);
if (!is_array($attach)) $attach=[];
if (!is_array($detach)) $detach=[];
if (!($user = MUser::getUserById($withUserID)))
    error(403, "No user with id ".$withUserID);

if (!MCore::$core->current_user->checkChild($user))
    error(403, "User with id ".$withUserID." not child to user with id ".MCore::$core->current_user->id);

$meta = MCore::$core->current_user->getAllCamsTokenMeta();
$storage_id = isset($meta['storage_channel_id']) ? 0+$meta['storage_channel_id'] : 0;
$usermeta = $user->getAllCamsTokenMeta();
$user_storage_id = isset($usermeta['storage_channel_id']) ? 0+$usermeta['storage_channel_id'] : 0;

foreach($attach as $attachItem){
    if (is_int($attachItem)) {
        $user->attachCameraByChannelID($attachItem);
    } else {
        $user->attachLocationToUser($attachItem);
    }

    if ($attachItem==$storage_id && $storage_id!=$user_storage_id){
        $usermeta['storage_channel_id'] = $storage_id;
        $user->setAllCamsTokenMeta($usermeta);
    }
}
foreach($detach as $detachItem) {
    if (is_int($detachItem)) {
        $user->detachCameraByChannelID($detachItem);
    } else {
        $user->detachLocationFromUser($detachItem);
    }
    if ($detachItem==$storage_id && $storage_id==$user_storage_id){
        unset($usermeta['storage_channel_id']);
        $user->setAllCamsTokenMeta($usermeta);
    }
}

$user->updateAllCamsToken();

/*

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../../static_lib.php");
include_once ($curdir."/../../../../streamland_api.php");

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

if(!StaticLib::isAuthorized()){
	StaticLib::error(401, "Unauthorized request");
}

if(!StaticLib::isPartner()){
	StaticLib::error(403, "Access deny");
}

$parentUserID = StaticLib::$USERID;

if (!isset(StaticLib::$REQUEST['withUserID'], StaticLib::$REQUEST['attach'], StaticLib::$REQUEST['detach'])) {
	StaticLib::error(400, "Arrays of attach, detach and withUserID are required");
}
$relatedUID = StaticLib::$REQUEST['withUserID'];

// 1. check that user exist and that it is created by partner
$stmt = $conn->prepare('SELECT * FROM "user" WHERE id = ? AND "parentUserID" = ?');
if (!$stmt->execute(array($relatedUID, $parentUserID)))
    StaticLib::error(550, $stmt->errorInfo());

if (!$row = $stmt->fetch())
    StaticLib::error(404, "User not found");
$relatedUID = $row['id'];

// 2. detach all relations for requested list
$attachList = StaticLib::$REQUEST['attach'];
$isAttachList = 0;
if (count($attachList)) {
    foreach ($attachList as $v) {
        if (!is_numeric($v))
            StaticLib::error(400, "attach and detach should be integer values array");
    }
    $isAttachList = 1;
}

$detachList = StaticLib::$REQUEST['detach'];
if ($isAttachList || count($detachList)) {
    foreach ($detachList as $v)
        if (!is_numeric($v))
            StaticLib::error(400, "attach and detach should be integer values array");
    if ($isAttachList)
        $detachList = array_merge($attachList, $detachList);
    $in  = '('.str_repeat('?,', count($detachList) - 1) . '?))';
    $query = 'DELETE FROM "userCamera" WHERE id in (SELECT uc.id FROM "userCamera" uc LEFT JOIN camera c ON uc."cameraID"=c.id WHERE uc."userID" = ? AND c."userID" = ? AND c.id IN '.$in;
    $stmt = $conn->prepare($query);
    $vals = array_merge(array($relatedUID, $parentUserID), $detachList);
    if (!$stmt->execute($vals))
        StaticLib::error(551, $stmt->errorInfo());
}

// 3. attach new relations
if ($isAttachList) {
    $in  = '('.str_repeat('?,', count($attachList) - 1) . '?)';
    $query = 'INSERT INTO "userCamera" ("userID", "cameraID") SELECT ? AS "userID", id AS "cameraID" FROM camera WHERE "userID" = ? AND id IN '.$in;
    $stmt = $conn->prepare($query);
    $vals = array_merge(array($relatedUID, $parentUserID), $attachList);
    if (!$stmt->execute($vals))
        StaticLib::error(552, $stmt->errorInfo());
}

include_once ($curdir."/../groupSharedToken.php");
createGroupSharedToken($conn, $relatedUID, $parentUserID);

$response['httpcode'] = 200;
StaticLib::endPage($response);
*/