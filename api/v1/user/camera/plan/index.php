<?php
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isDealer())
    error(401,'No access');

list($cameraID, $newPlanID) = MCore::checkAndGetInputParameters(['id', 'planid']);

$camera = MCamera::getCameraByChannelIdAndUser($cameraID, MCore::$core->current_user);
if (!$camera)
    error(401,'No camera');

$plan_name = MCore::$core->current_user->getPlanNameByPlanID($newPlanID);
if ($newPlanID && !$plan_name)
    error(503, 'Plan not found');

$camera->setPlanID($newPlanID, $plan_name);
