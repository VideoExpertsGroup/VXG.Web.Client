<?php

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../static_lib.php");

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

if (1){
    $stmt = $conn->prepare('SELECT "id","name","allCamsToken","serverLkey","js" FROM "user" WHERE role=\'partner\' ORDER BY id DESC');
    if (!$stmt->execute())
        StaticLib::error(500, $stmt->errorInfo());
    while ($row = $stmt->fetch()) {
        $response['data'][] = array(
            'id' => $row['id'],
            'name' => $row['name'],
			'allcamstoken' => $row['allCamsToken'],
			'lkey' => $row['serverLkey'],
            'allow_rec' => (strpos($row['js'],"retention")) ? true: false,
            'allow_int' => (strpos($row['js'],"integration")) ? true: false		
        );
    }
    $response['httpcode'] = 200;
    StaticLib::endPage($response);
    exit;
}

if(!StaticLib::isAuthorized()){
	StaticLib::error(401, "Unauthorized request");
}

$response['limit'] = StaticLib::$LIMIT;
$response['offset'] = StaticLib::$OFFSET;
$response['total'] = $total;
$response['httpcode'] = 200;

StaticLib::endPage($response);
