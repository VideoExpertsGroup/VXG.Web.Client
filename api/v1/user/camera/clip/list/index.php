<?php

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../../../static_lib.php");

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

if(!StaticLib::isAuthorized()){
	StaticLib::error(401, "Unauthorized request");
}

/*if(!StaticLib::isSuperAdmin()){
	StaticLib::error(403, "Access deny");
}*/
//$isUser = StaticLib::isUser();

/*$searchQuery = '';
if(isset(StaticLib::$REQUEST['searchQuery'])){
	$searchQuery = trim(StaticLib::$REQUEST['searchQuery']);
}

$sqlFilters = array();
$sqlValues = array();
if($searchQuery != ''){
	$sqlFilters[] = '(c.name LIKE ?)';
	$sqlValues[] = '%'.$searchQuery.'%';
}*/

$stmt = $conn->prepare('SELECT cc.*,c.name as "cameraName",count(*) OVER() AS total_count FROM "clipCamera" cc LEFT JOIN camera c ON cc."cameraID"=c.id WHERE cc."userID"='.StaticLib::$USERID.' ORDER BY c.id DESC' . StaticLib::$LIMITOFFSET);
if (!$stmt->execute())
    StaticLib::error(500, $stmt->errorInfo());

$total = 0;
while($row = $stmt->fetch()){
    if (!$total) $total = $row['total_count'];
	$response['data'][] = array(
		'id' => $row['id'],
		'cameraName' => $row['cameraName'],
        'cameraID' => $row['cameraID'],
        'clipID' => $row['clipID'],
        'end' => $row['end'],
        'start' => $row['start'],
        'deleteAt' => $row['deleteAt']
	);
}

$response['limit'] = StaticLib::$LIMIT;
$response['offset'] = StaticLib::$OFFSET;
$response['total'] = $total;
$response['httpcode'] = 200;

StaticLib::endPage($response);
