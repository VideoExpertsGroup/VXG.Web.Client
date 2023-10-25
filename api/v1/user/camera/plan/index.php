<?php
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
include_once ('../../../core/MUser.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isDealer() && !MCore::$core->current_user->isDistributor())
    error(401,'No access');

list($channelId, $meta, $old_plan, $user_id) = MCore::getInputParameters(['id', 'meta', 'old_sub', 'user_id']);

if (!isset($channelId) || !isset($meta)) 
    error(500, "Missing parameter(s) channel id or meta");

$usersPlans = json_decode(MCore::$core->current_user->getPlansForUser());
$type = $old_plan ? "unsub" : "sub";
$planid = $old_plan ? $old_plan : $meta['subid'];
$planInfo = MCore::$core->current_user->getPlanInfo($planid);

// checking if plan assignment is valid
if ($type == "sub") {
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

    $ret = MCamera::setRetention(
        $channelId, 
        MCore::$core->current_user, 
        $planInfo->rec_mode, 
        $planInfo->memorycard_rec, 
        $planInfo->records_max_age
    );

    $ai_type = $planInfo->object_detection;
    if ($ai_type != "off") {
        $targetToken = MCore::$core->current_user->getAIChannelGroupToken($ai_type, $channelId);
        $currentToken = $type != "off" ? MCore::$core->current_user->getAIChannelGroupToken(null, $channelId, true) : null;

        $ret = MCamera::setAIConfigByChannelID($channelId, $ai_type, $targetToken, $currentToken);

        if(!$ret) error(500, "Error setting AI configuration");
    }
} else {
    $user = $user_id ? MUser::getUserById($user_id) : MCore::$core->current_user;
    $ret = MCamera::setRetention($channelId, $user, "off", false, 0);

    $ai_type = $planInfo->object_detection;
    if ($ai_type != "off") {
        $targetToken = $user->getAIChannelGroupToken($ai_type, $channelId);
        $ret = MCamera::setAIConfigByChannelID($channelId, 'off', $targetToken, null, $user);
        if(!$ret) error(500, "Error setting AI configuration");
    }

}

if (!$user_id) {
    $count = $type == "sub" ? 1 : -1;
    if(!MCore::$core->current_user->updatePlanUsed($planid, $count)) 
        error(500, "Error updating plan count");
    
    if(!MCamera::updateChannelPlans($channelId, $meta)) {
        MCore::$core->current_user->updatePlanUsed($meta['subid'], -$count);
            error(500, "Error updating plan for camera");
    }
}

MCore::$core->response['planInfo'] = $planInfo;

