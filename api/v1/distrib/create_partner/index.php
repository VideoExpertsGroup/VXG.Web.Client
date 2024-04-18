<?php

include_once ('../../core/MCoreJson.php');
include_once ('../../core/MUser.php');
MCoreJson::init();

$email = $_GET["email"];
$pass = $_GET["pass"];

if (!isset($plans)) {
	$pass = 'q1w2e3r4';
}
	
$newUser = MUser::createFirebaseUser($email,'',$pass,true);
$pendingUser = MUser::createPendingUser($email);
MCore::$core->response['user'] = $newUser;
MCore::$core->response['userId'] = $pendingUser;