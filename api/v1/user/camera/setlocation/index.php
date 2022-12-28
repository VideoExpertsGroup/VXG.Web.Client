<?php
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isDealer())
    error(401,'No access');

list($channel_id, $location) = MCore::getInputParameters(['channel_id','location']);

MCamera::updateLocationByChannelID($channel_id, MCore::$core->current_user, $location);
