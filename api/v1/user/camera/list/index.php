<?php

include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
include_once ('../../../core/MUser.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isUser() && !MCore::$core->current_user->isDealer() && !MCore::$core->current_user->isDistributor())
    error(401,'No access');
    
if (MCore::$core->current_user->isUser()){
    list($filter) = MCore::getInputParameters(['filter']);
    $cameras = MCamera::getAllCamerasByUser(MCore::$core->current_user, $filter);
}

if (MCore::$core->current_user->isDealer()){
    list($limit, $offset, $filter, $channelID) = MCore::getInputParameters(['limit'=>25, 'offset'=>0,'filter', 'channelID']);
    $total = 0;
//    MCore::$core->current_user->syncWithCamerasOnServer();

    if (!$channelID)
        $cameras = MCamera::getAllCamerasByDealer(MCore::$core->current_user, $limit, $offset, $filter, $total);
    else
        $cameras = MCamera::getCameraByChannelIdAndUser($channelID, MCore::$core->current_user);
}

MCore::$core->response['data'] = [];

if ($cameras) foreach($cameras as $cam){
// TODO: create aiGroupToken if need
    if (0 && !$cam->camera['aiGroupToken']){
        $cam->createAIToken();
        $cam->setAITokenLimit();
    }
    if (!isset($cam->camera)) continue;
    $ret = $cam->camera;

    //unset($ret['aiGroupToken']);
    //unset($ret['aiGroupTokenID']);
    unset($ret['roToken']);
    unset($ret['rwToken']);
    MCore::$core->response['data'][] = $ret;
}

if (isset($total)) MCore::$core->response['total'] = $total;
if (isset($limit)) MCore::$core->response['limit'] = $limit;
if (isset($offset)) MCore::$core->response['offset'] = $offset;
MCore::$core->response['allCamsToken'] = MCore::$core->current_user->allCamsToken;

/*
$curdir = dirname(__FILE__);
include_once ($curdir."/../../../../static_lib.php");

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

if(!StaticLib::isAuthorized()){
	StaticLib::error(401, "Unauthorized request");
}

$isUser = StaticLib::isUser();
$isDistrib = StaticLib::isDistributor();

$searchQuery = '';
if(isset(StaticLib::$REQUEST['searchQuery'])){
	$searchQuery = trim(StaticLib::$REQUEST['searchQuery']);
}

$channelid = isset(StaticLib::$REQUEST['channelID']) ? 0+StaticLib::$REQUEST['channelID'] : 0;

$sqlFilters = array();
$sqlValues = array();
if($searchQuery != ''){
	$sqlFilters[] = '(c.name LIKE ?)';
	$sqlValues[] = '%'.$searchQuery.'%';
}

if (!$isUser) {
    $query = '';
    if ($isDistrib) {
        $sqlFilters[] = '(c."userID" IN (SELECT id FROM "user" WHERE "parentUserID" = ?))';
        $sqlValues[] = StaticLib::$USERID;
        $sqlFilter = implode(' AND ', $sqlFilters);
        $query = 'SELECT c.*,count(*),u.id AS uid,u.name AS "dealerName",count(*) OVER() AS total_count FROM camera c LEFT JOIN "user" u ON c."userID"=u.id WHERE ' .
            $sqlFilter . ' GROUP BY u.id,c.id ORDER BY c.id' . StaticLib::$LIMITOFFSET;
    } else {
        $sqlFilters[] = '(c."userID" = ?)';
        $sqlValues[] = StaticLib::$USERID;
        $sqlFilter = implode(' AND ', $sqlFilters);
        if ($channelid){
            $sqlValues[] = $channelid;
            $sqlFilter = $sqlFilter . ($sqlFilter ? ' AND ': ' ') . 'c."channelID"=?';
        }
        $query = 'SELECT c.*,count(*) OVER() AS total_count FROM camera c WHERE ' . $sqlFilter . ' ORDER BY id DESC' . StaticLib::$LIMITOFFSET;
        $count_query = 'SELECT count(*) AS total_count FROM camera c WHERE ' . $sqlFilter;
    }
    $stmt = $conn->prepare($query);
    $count_stmt = $conn->prepare($count_query);
    if(!$stmt->execute($sqlValues) || !$count_stmt->execute($sqlValues)){
        StaticLib::error(500, $stmt->errorInfo());
    }
} else {
    if (!$channelid)
        $stmt = $conn->prepare('SELECT c.* FROM "userCamera" uc LEFT JOIN camera c ON uc."cameraID"=c.id '.
            'WHERE uc."userID"='.StaticLib::$USERID.' ORDER BY c.id DESC' . StaticLib::$LIMITOFFSET);
    else
        $stmt = $conn->prepare('SELECT c.* FROM "userCamera" uc LEFT JOIN camera c ON uc."cameraID"=c.id '.
            'WHERE uc."userID"='.StaticLib::$USERID.' AND "channelID"='.$channelid);
    $count_stmt = $conn->prepare('SELECT count(*) AS total_count FROM "userCamera" uc WHERE uc."userID"='.StaticLib::$USERID);
    if(!$stmt->execute($sqlValues) || !$count_stmt->execute($sqlValues))
        StaticLib::error(500, $stmt->errorInfo());
}

$forUserID = 0;
$camerasForUserID = null;
if (isset(StaticLib::$REQUEST['forUserID'])){
    $camerasForUserID =  array();
    $forUserID = StaticLib::$REQUEST['forUserID'];
    $sqlFilters[] = '(uc."userID" = ?)';
    $sqlValues[] = $forUserID;
    $sqlFilter = implode(' AND ', $sqlFilters);

    $stmt2 = $conn->prepare('SELECT c.* FROM "userCamera" uc LEFT JOIN camera c ON uc."cameraID"=c.id WHERE '.$sqlFilter.' ORDER BY c.id DESC');
    if (!$stmt2->execute($sqlValues))
        StaticLib::error(500, $stmt2->errorInfo());
    while($row2 = $stmt2->fetch())
        $camerasForUserID[$row2['id']] = $forUserID;
}
if ($isUser && isset(StaticLib::$REQUEST['manage_uid']))
    $isDistrib = true;

$total = 0;
while($row = $stmt->fetch()){
	$response['data'][] = array(
		'id' => $row['id'],
		'name' => $row['name'],
        'location' => $row['location'],
        'lon' => $row['lon'],
        'lat' => $row['lat'],
        'floor' => $row['floor'],
        'x' => $row['x'],
        'y' => $row['y'],
        'address' => $row['address'],
        'uid' => $isDistrib ? $row['uid'] : (($forUserID && isset($camerasForUserID[$row['id']])) ? $forUserID : 0),
        'dealerName' => $isDistrib ? $row['dealerName'] : null,
        'serverID' => $isDistrib ? null : $row['serverID'],
        'channelID' => $isDistrib ? null : $row['channelID'],
        'desc' => $row['desc'],
        'tz' => $row['tz'],
        'url' => $isUser || $isDistrib ? '' : $row['url'],
        'username' => $isUser || $isDistrib ? '' : $row['username'],
        'password' => $isUser || $isDistrib ? '' : $row['password'],
        'isRecording' => $row['isRecording'],
        'roToken' => $isDistrib ? null : $row['roToken'],
        'rwToken' => $isDistrib ? null : ($isUser ? $row['rwToken'] : $row['rwToken']),
        'created' => $row['created'],
        'updated' => $row['updated'],
        'planID' => $row['planID'], 
        'planName' => $row['planName'],
        'planExpired' => $row['planExpired']
	);
}
$row2 = $count_stmt->fetch();

$response['allCamsToken'] = StaticLib::$USERRAW['allCamsToken'];
$response['limit'] = StaticLib::$LIMIT;
$response['offset'] = StaticLib::$OFFSET;
$response['total'] = $row2['total_count'];
$response['httpcode'] = 200;

StaticLib::endPage($response);
*/