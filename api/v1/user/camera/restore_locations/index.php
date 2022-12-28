<?php
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
MCore::init();

$cmids = fetchAll('select "channelID", "location" from camera where location<>\'\'');
$cams = [];
foreach($cmids as $cid){
    $c = MCamera::getCameraByChannelIdAndUser($cid['channelID']);
    if (!$c || !$c->owner) continue;
//    $c->setLocation();
    MCamera::updateLocationByChannelID($cid['channelID'], $c->owner, $cid['location']);
    print_r($c);
}

print 'Complete';