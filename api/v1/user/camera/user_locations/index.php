<?php
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
list($userId) = MCore::getInputParameters(['userId']);
if (!($user = MUser::getUserById($userId)))
    error(403, "No user with id ".$userId);

if (!MCore::$core->current_user->checkChild($user))
    error(403, "User with id ".$userId." not child to user with id ".MCore::$core->current_user->id);

$userLocs = $user->getAllUserLocations();
MCore::$core->response['locs'] = $userLocs;