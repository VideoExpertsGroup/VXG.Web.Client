<?php
include_once ('../../core/MCoreJson.php');
include_once ('../../core/MUser.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();

$plans = MCore::$core->current_user->getPlansForUser();
MCore::$core->response['plans'] = $plans;