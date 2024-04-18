<?php

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../static_lib.php");
include_once ('../../core/MCoreJson.php');

MCoreJson::init();
$conn = StaticLib::db_connection();

if (1){
    $stmt = $conn->prepare('SELECT "id","name","allCamsToken","serverLkey","js","role", "plans" FROM "user" WHERE role=\'partner\' ORDER BY id DESC');
    if (!$stmt->execute())
        StaticLib::error(500, $stmt->errorInfo());
    while ($row = $stmt->fetch()) {
        MCore::$core->response['data'][] = array(
            'id' => $row['id'],
            'name' => $row['name'],
            'role' => $row['role'],
            'plans' => $row['plans'],
			'allcamstoken' => $row['allCamsToken'],
			'lkey' => $row['serverLkey'],
            'allow_rec' => (strpos($row['js'],"retention")) ? true: false,
            'allow_int' => (strpos($row['js'],"integration")) ? true: false,
            'allow_ai'	=> (strpos($row['js'],"ai_access")) ? true: false,
			'allow_nvr'	=> (strpos($row['js'],"servers")) ? true: false
        );
    }

    $stmt2 = $conn->prepare('SELECT "id","email" FROM "user" WHERE role=\'pending\' ORDER BY id DESC');
    if (!$stmt2->execute())
        StaticLib::error(500, $stmt2->errorInfo());
    while ($row = $stmt2->fetch()) {
        MCore::$core->response['pending'][] = array(
            'id' => $row['id'],
            'email' => $row['email'],
        );
    }

    $aiAccessKey = MCore::$core->config['ai_access_key'];
    $aiSecretKey = MCore::$core->config['ai_secret_key'];
    $aiDetThresh = MCore::$core->config['ai_det_threshold'];

    if ($aiAccessKey && $aiSecretKey && $aiDetThresh) {
        MCore::$core->response['aiEnabled'] = true;
    }

    MCore::$core->response['httpcode'] = 200;
    exit;
}

if(!StaticLib::isAuthorized()){
	StaticLib::error(401, "Unauthorized request");
}

MCore::$core->response['limit'] = StaticLib::$LIMIT;
MCore::$core->response['offset'] = StaticLib::$OFFSET;
MCore::$core->response['total'] = $total;
MCore::$core->response['httpcode'] = 200;
