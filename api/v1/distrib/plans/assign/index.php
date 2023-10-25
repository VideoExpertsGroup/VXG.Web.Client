<?php
$curdir = dirname(__FILE__);
include_once ($curdir."/../../../../static_lib.php");
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
include_once ('../../../core/MUser.php');
MCore::init();

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

// how I wanna do it
//list($partner_id, $plans) = MCore::getInputParameters(['id', 'plansArr']);
$partner_id = $_GET["id"];
$plans = $_GET["plans"];

if (!isset($partner_id) || !isset($plans)) {
	$response['httpcode'] = 400;
	StaticLib::endPage($response);
	exit;
}	

$query = 'UPDATE "user" SET "plans"=\''.$plans.'\' WHERE "id"=\''.$partner_id.'\'';	    

$stmt = $conn->prepare($query);

$ret = $stmt->execute();

if (!$ret)
	StaticLib::error(500, $stmt->errorInfo());

$response['httpcode'] = 200;
StaticLib::endPage($response);
