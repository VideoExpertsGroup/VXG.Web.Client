<?php
require '../../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\OAuth;

include_once ('../../../static_lib_mail.php');

include_once ('../../core/MCoreJson.php');
include_once ('../../core/MCamera.php');
include_once ('../../core/MUser.php');
MCoreJson::init();
MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isPartner())
    error(401, 'Access denied');



//MCoreJson::init();
//MCore::checkOnlyForAuthorized();
//if (!MCore::$core->current_user->isPartner())
//    error(401,'No access');

if (StaticLibMail::isConfigured())
	StaticLibMail::send(MCore::$core->current_user->email, "cloud key", "123456", MCore::$core->current_user->serverLkey);
else
	MCore::$core->response = MCore::$core->current_user->serverLkey;
