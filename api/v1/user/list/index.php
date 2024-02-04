<?php

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../static_lib.php");

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

if (isset(StaticLib::$REQUEST['dealers'])){
    $stmt = $conn->prepare('SELECT id,name FROM "user" WHERE role=\'partner\' ORDER BY name DESC');
    if (!$stmt->execute())
        StaticLib::error(500, $stmt->errorInfo());
    while ($row = $stmt->fetch()) {
        $response['data'][] = array(
            'id' => $row['id'],
            'name' => $row['name']
        );
    }
    $response['httpcode'] = 200;
    StaticLib::endPage($response);
    exit;
}

if(!StaticLib::isAuthorized()){
	StaticLib::error(401, "Unauthorized request");
}

$isSuperadmin = StaticLib::isSuperAdmin();
$isDistrib = StaticLib::isDistributor();
$isTheater = StaticLib::isTheater();
$isChannel = StaticLib::isChannel();

if(!(StaticLib::isPartner() || $isDistrib || $isTheater || $isChannel || $isSuperadmin)){
	StaticLib::error(403, "Access deny");
}

$searchQuery = '';
if(isset(StaticLib::$REQUEST['searchQuery'])){
	$searchQuery = trim(StaticLib::$REQUEST['searchQuery']);
}

$sqlFilters = array();
$sqlValues = array();
if($searchQuery != ''){
	$sqlFilters[] = '(name LIKE ?)';
	$sqlValues[] = '%'.$searchQuery.'%';
}

$isNoDetails = isset(StaticLib::$REQUEST['no_details']);
$dealerID = 0;
if ($isDistrib && $isNoDetails && isset(StaticLib::$REQUEST['dealerID'])) {
    $dealerID = StaticLib::$REQUEST['dealerID'];
    // check that the dealer is belong the owner
    $stmt = $conn->prepare('SELECT * FROM "user" WHERE id = ? AND "parentUserID" = ?');
    if (!$stmt->execute(array($dealerID, StaticLib::$USERID)))
        StaticLib::error(550, $stmt->errorInfo());
    if (!$row = $stmt->fetch())
        StaticLib::error(404,'User not found.');
}
$sqlFilters[] = '("parentUserID" = ?)';
$sqlValues[] = $dealerID ? $dealerID : StaticLib::$USERID;
$sqlFilter = implode(' AND ', $sqlFilters);

$stmt = $conn->prepare('SELECT *,count(*) OVER() AS total_count FROM "user" WHERE '.$sqlFilter.' ORDER BY id DESC' . StaticLib::$LIMITOFFSET);
if (!$stmt->execute($sqlValues))
	StaticLib::error(500, $stmt->errorInfo());

$total = 0;
while($row = $stmt->fetch()){
    // TODO: to optimize query for totalCameras,totalUsers, need inc/dec appropriate field "total*" in table "user" during add/del camera operations
    if (!$total) $total = $row['total_count'];
    $userID = $row['id'];
    if ($isSuperadmin) {
        $stmt3 = $conn->prepare('SELECT count(*) AS "totalCameras" FROM camera WHERE "userID" IN (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID"=' . $userID . '))))');
    } else
    if ($isChannel) {
        $stmt3 = $conn->prepare('SELECT count(*) AS "totalCameras" FROM camera WHERE "userID" IN (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID"=' . $userID . ')))');
    } else
    if ($isTheater) {
        $stmt3 = $conn->prepare('SELECT count(*) AS "totalCameras" FROM camera WHERE "userID" IN (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID"=' . $userID . '))');
    } else
    if ($isDistrib) {
        $stmt3 = $conn->prepare('SELECT count(*) AS "totalCameras" FROM camera WHERE "userID" IN (SELECT id FROM "user" WHERE "parentUserID"=' . $userID . ')');
    } else {
        //$row3 = array('totalUsers' => 0);
    }
    if (!$isNoDetails) {
        $stmt2 = $conn->prepare('SELECT "cameraCHID", "location" FROM "userCamera" u WHERE u."userID"='.$row['id']);
        if (!$stmt2->execute()) StaticLib::error(500, $stmt2->errorInfo());
        $row2 = $stmt2->fetchAll(PDO::FETCH_ASSOC);
        $cameras = []; $locations = [];
        foreach($row2 as $v) {
            $cameras[] =$v['cameraCHID']; 
            if ($v['location'] != ""){
                $locations[] = $v['location'];
            }
        }
        $stmt3 = $conn->prepare('SELECT count(*) AS "totalUsers" FROM "user" WHERE "parentUserID"=' . $row['id']);
        if (!$stmt3->execute()) StaticLib::error(500, $stmt3->errorInfo());
        $row3 = $stmt3->fetch();

        $response['data'][] = array(
            'id' => $row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'address' => $row['address'],
            'desc' => $row['desc'],
            'phone' => $row['phone'],
            'created' => $row['created'],
            'updated' => $row['updated'],
            'totalUsers' => $row3['totalUsers'],
            'totalCameras' => count($row2),
            'cameras' => $cameras,
            'locations' => $locations,
            'bandwidthBytes' => $row['bandwidthBytes'],
            'storageBytes' => $row['storageBytes'],
            'revenue' => $row['revenue'],
            'sheduler' => $row['sheduler'],
        );
    } else
        $response['data'][] = array(
            'id' => $row['id'],
            'name' => !empty($row['name']) ? $row['name'] : $row['email']
        );
}

$response['limit'] = StaticLib::$LIMIT;
$response['offset'] = StaticLib::$OFFSET;
$response['total'] = $total;
$response['httpcode'] = 200;

StaticLib::endPage($response);
