<?php

include_once ('../../core/MCoreJson.php');
include_once ('../../core/MUser.php');
MCoreJson::init();


$uid = $_GET["uid"];
MUser::verifyFirebaseUser($uid);
