<?php

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../static_lib.php");
include_once ('../../core/MCoreJson.php');

MCoreJson::init();

$conn = StaticLib::db_connection();

if (1){
    $stmt = $conn->prepare('SELECT * FROM "plan" WHERE "desc" != \'LEGACY\'');
    if (!$stmt->execute())
        StaticLib::error(500, $stmt->errorInfo());
    while ($row = $stmt->fetch()) {
        MCore::$core->response['data'][] = array(
            'id' => $row['uid'],
            'name' => $row['name'],
            'feeCents' => $row['feeCents'],
        );
    }

    MCore::$core->response['httpcode'] = 200;
    exit;
}

if(!StaticLib::isAuthorized()){
	StaticLib::error(401, "Unauthorized request");
}

MCore::$core->response['limit'] = StaticLib::$LIMIT;
MCore::$core->response['offset'] = StaticLib::$OFFSET;
MCore::$core->response['httpcode'] = 200;
