<?php
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
MCoreJson::init();
/*
MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isDealer())
    error(401,'No access');
    */

//MCore::$core->current_user = MUser::getUserById(22);

list($limit, $offset) = MCore::getInputParameters(['limit','offset']);
if ($limit === null)
    $limit = isset($_GET['limit']) ? 0+$_GET['limit'] : 50;
if ($offset === null)
    $offset = isset($_GET['offset']) ? 0+$_GET['offset'] : 0;


if ($limit>50)
    error(401,'Max limit is 50');

MCore::$core->response['data'] = MCore::$core->current_user->getLocations(0+$limit, 0+$offset);
MCore::$core->response['limit'] = $limit;
MCore::$core->response['offset'] = $offset;
MCore::$core->response['total'] = MCore::$core->current_user->getLocationsCount();
