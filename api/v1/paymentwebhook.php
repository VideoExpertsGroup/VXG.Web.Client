<?php
date_default_timezone_set('UTC');
include_once ('core/MCore.php');
include_once ('core/MCamera.php');
MCore::init();  

list($email, $plans) = MCore::checkAndGetInputParameters(['user', 'plans']);
$user = MUser::getUserByEmail($email);
if (!$user) return;

// Update cameras limits, if expired change
foreach($user->plans as $old_plan){
    foreach($plans as $new_plan){
        if ($old_plan['stripe_plan_id']!=$new_plan['stripe_plan_id']) continue;
        if ($old_plan['expired']==$new_plan['expired']) break;
//        $limits = json_decode($new_plan['metadata'] ? $new_plan['metadata'] : '{}', JSON_OBJECT_AS_ARRAY);
        $limits = is_array($new_plan['metadata']) ? $new_plan['metadata'] : [];
        $limits['expired'] = date("Y-m-d\TH:i:s.000", $new_plan['expired']);
        $cameras = MCamera::getCamerasByPlanIdAndOwner($new_plan['stripe_plan_id'], $user);
        foreach($cameras as $camera)
        {
            $camera->setLimits($limits);
            // TODO
            // Set this function to setLimits
            
            $camera->setAITokenLimit($limits);
        }
            
        break;
    }
}

$ids = [];
foreach($plans as $plan) $ids[] = $plan['stripe_plan_id'];
$cameras = MCamera::getCamerasWithOtherPlanIdAndOwner($ids, $user);
foreach($cameras as $camera)
    $camera->setPlanID('', '', true);

$user->setPlans($plans);
