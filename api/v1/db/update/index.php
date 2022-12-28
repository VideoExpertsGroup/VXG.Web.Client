<?php

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../static_lib.php");

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

$current_db_ver = 0;
$stmt = $conn->prepare('SELECT * FROM updates ORDER BY dt DESC LIMIT 1 OFFSET 0'); // on first update tables can be not exists
if (!$stmt->execute()) {
}
if ($row = $stmt->fetch()) {
	$current_db_ver = $row['version'];
}
$response['current_db_ver_init'] = $current_db_ver;
$response['current_db_ver'] = $current_db_ver;
$response['apply_updates'] = array();

function next_func($cv){
	return 'update'.str_pad("".($cv+1), 4, "0", STR_PAD_LEFT);
}

$funcname = next_func($current_db_ver);
$fileupdate = $funcname.'.php';

while(file_exists($curdir.'/'.$fileupdate)){
	include_once($fileupdate);
	if(function_exists($funcname)){
		$response['apply_updates'][] = $funcname;
		$updateResult = $funcname($conn);
		if($updateResult['result']){
			$stmt = $conn->prepare('INSERT INTO updates(version) VALUES(?)');
			if(!$stmt->execute(array($current_db_ver+1))){
				StaticLib::error(500, "1. Failed update: ".print_r($stmt->errorInfo(), true));
			}
			$response['current_db_ver'] = $current_db_ver+1;
		}else{
			StaticLib::error(500, "2. Failed update: ".print_r($updateResult['error'], true));
		}
	}
	// next update
	$current_db_ver++;
	$funcname = next_func($current_db_ver);
	$fileupdate = $funcname.'.php';
	
}
$response['httpcode'] = 200;
StaticLib::endPage($response);
