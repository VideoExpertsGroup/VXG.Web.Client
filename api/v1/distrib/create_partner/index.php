<?php

include_once ('../../core/MCoreJson.php');
include_once ('../../core/MUser.php');
MCoreJson::init();


$email = $_GET["email"];
MUser::createFirebaseUser($email,'','q1w2e3r4',true);
