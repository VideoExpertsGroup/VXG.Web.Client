<?php
include_once ('../../core/MCoreJson.php');
include_once ('../../core/MUser.php');
MCoreJson::init();
MCore::checkOnlyForAuthorized();
$access_link = MCore::$core->config['access_reports_link'];
MCore::$core->response['access_reports_link'] = $access_link;
