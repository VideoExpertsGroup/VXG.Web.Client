<?php
include_once ('../../core/MCoreJson.php');
include_once ('../../core/MUser.php');
MCoreJson::init();

MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isSubuser() && !MCore::$core->current_user->isUser() && !MCore::$core->current_user->isDealer() && !MCore::$core->current_user->isDistributor())
    error(401,'No access');

list($url, $camid) = MCore::getInputParameters(['url', 'camid']);

$authPass = "12345678"; // hardcoded for now

$ch=curl_init($url);
curl_setopt_array($ch, [CURLOPT_POST => false, CURLOPT_CUSTOMREQUEST=>'GET', CURLOPT_RETURNTRANSFER => true, CURLOPT_VERBOSE => true,
    CURLOPT_HTTPHEADER => ['Content-Type:application/json', 'Authorization: Bearer '. $authPass]]);

$result = curl_exec($ch);
$r = json_decode($result, JSON_OBJECT_AS_ARRAY);

foreach($r['forwards'] as $f) {
    if ($f['protocol'] == "http") {
        MCore::$core->response['id'] = $camid;
        MCore::$core->response['url'] = $f['proxy_url'];
    }
}

