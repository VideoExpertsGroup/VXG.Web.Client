<?php
$step = isset($_GET['step']) ? 0+$_GET['step'] : 0;
if (!$step) {print 'fail';exit;}
include_once ('api/v1/core/MCore.php');

MCore::init();

$servers = fetchAll('select distinct("serverLkey"), "serverHost","serverPort","email" from "user" where "serverLkey"<>\'\'');
if ($_GET['step']==1){
print_r($servers);
exit;
}

$cams = [];
foreach($servers as $server){
    if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey'],true))
        continue;

    $cameras = StreamLandAPI::getCamerasListV2();
    if (!isset($cameras['objects'])) continue;
    foreach ($cameras['objects'] as $camera){
        if (!isset($camera['meta']) || !is_array($camera['meta']) || !$camera['meta']) continue;
        if (isset($camera['meta']['location'])) continue;
        foreach ($camera['meta'] as $i=>$v){
            if (substr($i,0,2)=='L+'){
                $r = $server;
                $r['channelID'] = $camera['id'];
                $r['location'] = $v;
                $cams[] = $r;
            }
        }
    }
    if (count($cams)>0) break;
}

print 'Found '.count($cams).' cameras
';
if ($_GET['step']==2){
    print_r($cams);
    exit;
}


foreach($cams as $cam){
    print "\n".$cam['channelID'];
    if (!StreamLandAPI::generateServicesURLs($cam['serverHost'], $cam['serverPort'], $cam['serverLkey'],true)){
        print ' - fail';
        continue;
    }
    $response_cloud  = StreamLandAPI::getChannel($cam['channelID']);
    if (!isset($response_cloud['meta'])) {
        print ' - fail';
        continue;
    }
    $meta = isset($response_cloud['meta']) ? $response_cloud['meta'] : [];
    foreach ($meta as $i=>$v){
        if (substr($i,0,2)=='L+'){
            $meta['location']= $v;
            break;
        }
    }
    $response_cloud = StreamLandAPI::updateChannel($cam['channelID'], ['meta'=>$meta]);
    print ' - ok';
}
