<?php

include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MServer.php');
include_once ('../../../core/MUser.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isUser() && !MCore::$core->current_user->isDealer() && !MCore::$core->current_user->isDistributor())
    error(401,'No access');

list($server_id) = MCore::checkAndGetInputParameters(['serverid']);
MCore::$core->current_user->removeServer($server_id);
