<?php

include_once ('../../core/MCoreJson.php');
include_once ('../../core/MUser.php');
MCoreJson::init();


$email = $_GET["email"];
$pass = $_GET["pass"];

if (!isset($plans)) {
	$pass = 'q1w2e3r4';
}
	
MUser::createFirebaseUser($email,'',$pass,true);
