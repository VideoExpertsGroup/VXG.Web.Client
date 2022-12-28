<?php
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
// Check the access
if (strpos(MCore::$core->current_user->js,'retention')===false)
    error(401,'No access');

list($channel_id) = MCore::getInputParameters(['channel_id']);

MCore::$core->response = MCamera::getRetention($channel_id, MCore::$core->current_user); 

//MCore::$core->response=['channel_id'=>$channel_id,'recording'=>0, 'time'=> 66, 'type'=>'event'];