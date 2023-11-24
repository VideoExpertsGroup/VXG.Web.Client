<?php
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
include_once ('../../../core/MUser.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isDealer() && !MCore::$core->current_user->isDistributor())
    error(401,'No access');

list($channelId, $meta, $oldPlan, $userId) = MCore::getInputParameters(['id', 'meta', 'old_sub', 'user_id']);

if (!isset($channelId) || !isset($meta)) 
    error(500, "Missing parameter(s) channel id or meta");

$user = $userId ? MUser::getUserById($userId) : MCore::$core->current_user;
$usersPlans = json_decode($user->getPlansForUser());
$newPlan = $meta['subid'];
$planInfo = !$oldPlan || $oldPlan == "NOPLAN" || $oldPlan == "customParameters" || $oldPlan == "CUST" ? null : $user->getPlanInfo($oldPlan);

if ($oldPlan == $newPlan) {
    MCore::$core->response['planInfo'] = null;
    return;
} 

if ($oldPlan && $oldPlan != "NOPLAN" && $oldPlan != "customParameters" ) {
    if ($newPlan != "CUST") {
        // need to unsubscribe from the plan first 
        $ret = MCamera::setRetention($channelId, $user, "off", false, 0);

        $ai_type = $planInfo->object_detection;
        if ($ai_type != "off" || $oldPlan == "CUST") {
            $targetToken = $user->getAIChannelGroupToken(null, $channelId, true);
            $ret = MCamera::setAIConfigByChannelID($channelId, 'off', $targetToken, null, $user);
            if(!$ret) error(500, "Error setting AI configuration");
        }
    }
   
    if(!$user->updatePlanUsed($oldPlan, -1)) 
        error(500, "Error updating plan count");
}

if ($newPlan != "NOPLAN") {
    // subscribing to something
    foreach($usersPlans as $plan) {
        if ($plan->id == $meta['subid']) {
            $count = intval($plan->count);
            $used = intval($plan->used);
            if ($count == 0) 
                error(500, "Plan not assigned to this user");
            if ($used + 1 > $count)
                error(500, "No more plans of this type available");
            break;
        }
    }

    if($newPlan != "CUST") {
        $planInfo = $user->getPlanInfo($newPlan);
        $ret = MCamera::setRetention(
            $channelId, 
            $user, 
            $planInfo->rec_mode, 
            $planInfo->memorycard_rec, 
            $planInfo->records_max_age
        );
    
        $ai_type = $planInfo->object_detection;
        if ($ai_type != "off") {
            $targetToken = $user->getAIChannelGroupToken($ai_type, $channelId);
            $currentToken = $user->getAIChannelGroupToken(null, $channelId, true);
            $ret = MCamera::setAIConfigByChannelID($channelId, $ai_type, $targetToken, $currentToken);
    
            if(!$ret) error(500, "Error setting AI configuration");
        }
    }

    if(!$user->updatePlanUsed($newPlan, 1)) 
        error(500, "Error updating plan count");

    MCore::$core->response['planInfo'] = $planInfo;
}

if ($oldPlan == "customParameters" && $newPlan == "NOPLAN") {
    $ret = MCamera::setRetention($channelId, $user, "off", false, 0);
    $targetToken = $user->getAIChannelGroupToken(null, $channelId, true);
    $ret = MCamera::setAIConfigByChannelID($channelId, 'off', $targetToken, null, $user);
    if(!$ret) error(500, "Error setting AI configuration");
    if(!MCamera::updateChannelPlans($channelId, $meta)) {
        error(500, "Error updating plan for camera");
    }
    MCore::$core->response['planInfo'] = null;
    return;
}

if(!MCamera::updateChannelPlans($channelId, $meta)) {
    $user->updatePlanUsed($newPlan, -1);
    error(500, "Error updating plan for camera");
}