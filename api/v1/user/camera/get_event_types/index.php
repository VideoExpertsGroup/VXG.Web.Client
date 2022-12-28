<?php
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
MCoreJson::init();

list($channel_id) = MCore::getInputParameters(['channel_id']);

$events = MCamera::getEventsStatesForChannelID(0+$channel_id);
$types = ['motion','post_object_and_scene_detection'];
$ret = [];
foreach ($events['objects'] as $e){
    if (in_array($e['name'],$types) && $e['notify']===true) $ret[] = $e['name'];
}

MCore::$core->response['event_types']=$ret;