<?php
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();

list($channel_id, $group) = MCore::getInputParameters(['channel_id','group']);

MCamera::updateGroupByChannelID($channel_id, MCore::$core->current_user, $group);
