<?php
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
// Check the access
if (strpos(MCore::$core->current_user->js,'retention')===false)
    error(401,'No access');

list($channel_id, $type, $recording, $time) = MCore::getInputParameters(['channel_id', 'type', 'recording', 'time']);

MCore::$core->response = MCamera::setRetention($channel_id, MCore::$core->current_user, $type, $recording, $time); 

if ($type=='by_event' || $type=='off' && $recording)
    MCamera::setEventStateForChannelID($channel_id, 'periodic-snapshot', ['receive'=>true,'period'=> 60]);
else
    MCamera::setEventStateForChannelID($channel_id, 'periodic-snapshot', ['receive'=>false]);
