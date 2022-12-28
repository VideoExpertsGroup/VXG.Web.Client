<?php

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../static_lib.php");
include_once ('../../core/MCoreJson.php');
include_once ('../../core/MCamera.php');
include_once ('../../core/MUser.php');
MCore::init();

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

$distr_email = $_GET["email"];
$enable = $_GET["enable"];

if (!isset($distr_email) || !isset($enable)) {
	$response['httpcode'] = 400;
	StaticLib::endPage($response);
	exit;
}	

if ($enable == "on"){
	$query = 'UPDATE "user" SET "role"=\'distrib\' WHERE "email"=\''.$distr_email.'\'';	    
}
if ($enable == "off"){
	$query = 'UPDATE "user" SET "role"=\'partner\' WHERE "email"=\''.$distr_email.'\'';	    
}

$stmt = $conn->prepare($query);
	
if (!$stmt->execute())
	StaticLib::error(500, $stmt->errorInfo());

$response['httpcode'] = 200;
StaticLib::endPage($response);
