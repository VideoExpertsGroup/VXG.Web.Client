<?php
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MUser.php');
MCoreJson::init();
MCore::checkOnlyForAuthorized();

if (!MCore::$core->current_user->isPartner())
    error(401,'No access');

$server = MCore::$core->current_user->getServerData();

if ($server == false) {
    error(550, 'get buckets is failed by reason: cant get server info');
}

//MCore::$core->response['data']['lkey'] = $server['serverLkey'];
//MCore::$core->response['data']['entrypoint'] = $server['serverHost'];
//MCore::$core->response['data']['entryport'] = $server['serverPort'];

$curl=curl_init( ''.$server['serverHost'].'api/v3/buckets/');
curl_setopt_array($curl, [CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => false, CURLOPT_POST => false, 
        CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => false, CURLOPT_CUSTOMREQUEST => 'GET',
        CURLOPT_HTTPHEADER => ['Content-Type:application/json','Authorization: LKey '.$server['serverLkey'] ]]);

$buckets = json_decode(curl_exec($curl),TRUE);
curl_close($curl);    


MCore::$core->response['data'] = $buckets;
MCore::$core->response['result'] = 'OK';
return;

