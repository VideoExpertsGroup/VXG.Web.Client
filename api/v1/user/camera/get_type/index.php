<?php
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
// Check the access
list($channel_id) = MCore::getInputParameters(['channel_id']);
// 1 - SD Card, 0 - Cloud
MCore::$core->response = MCamera::getCameraType($channel_id); 