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

list($storage, $endpoint, $name, $access_key, $secret_key, $upload_sqs_name, $upload_sqs_region, $id) 
 = MCore::checkAndGetInputParameters(['storage', 'endpoint', 'name', 'access_key', 'secret_key', 'upload_sqs_name', 'upload_sqs_region', 'id']);


$curl=curl_init( ''.$server['serverHost'].'api/v3/buckets/'.$id.'/');

$data = json_encode([
    'type'=>$storage, 
    'endpoint'=>$endpoint, 
    'name'=>$name, 
    'access_key'=>$access_key, 
    'secret_key'=>$secret_key, 
    'upload_sqs_name'=>$upload_sqs_name, 
    'upload_sqs_region'=>$upload_sqs_region
]);

curl_setopt_array($curl, [CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => false, CURLOPT_POST => true, 
        CURLOPT_POSTFIELDS => $data, CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => false, CURLOPT_CUSTOMREQUEST => 'PUT',
        CURLOPT_HTTPHEADER => ['Content-Type:application/json','Authorization: LKey '.$server['serverLkey'] ]]);

$answer = json_decode(curl_exec($curl),TRUE);
curl_close($curl);    

MCore::$core->response['data'] = $answer;
MCore::$core->response['result'] = 'OK';
return;

