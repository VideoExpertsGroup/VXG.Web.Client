<?php
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
MCoreJson::init();

list($channel_id,$event_types) = MCore::getInputParameters(['channel_id','event_types']);

$types = ['motion','post_object_and_scene_detection'];
$events = MCamera::getEventsStatesForChannelID(0+$channel_id);
$r=[];
foreach ($events['objects'] as $e){
    if (in_array($e['name'],$types)) $r[$e['name']] = $e['notify'];
}

foreach($types as $type){
    if (!isset($r[$type]))
        MCamera::createEventStateForChannelID($channel_id, $type, in_array($type,$event_types));
    else if (in_array($type,$event_types) && !$r[$type] || !in_array($type,$event_types) && $r[$type])
        MCamera::setEventStateForChannelID($channel_id, $type, in_array($type,$event_types));
}
