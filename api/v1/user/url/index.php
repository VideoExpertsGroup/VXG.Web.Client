<?php
include_once ('../../core/MCoreJson.php');
include_once ('../../core/MUser.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();

$server = MCore::$core->current_user->getServerData();
MCore::$core->response['cloud_url'] = $server['serverHost'];