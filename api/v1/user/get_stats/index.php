<?php
include_once ('../../core/MCoreJson.php');
include_once ('../../core/MUser.php');
MCoreJson::init();
MCore::checkOnlyForAuthorized();
$accountStats = MCore::$core->current_user->getAccountStats();
MCore::$core->response['stats'] = $accountStats;