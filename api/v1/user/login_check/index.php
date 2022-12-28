<?php
use kornrunner\Keccak;
include_once ('../../core/MCoreJson.php');
include_once ('../../core/MUser.php');
include_once('../../../Keccak.php');
include_once('../../../vendor/autoload.php');
MCoreJson::init();
list($username, $password) = MCore::checkAndGetInputParameters(['email','password']);
//$password = '123456'; //yIjJzp4JjVhk097W68wUChIUImO6zjojo2+ZBfEr1ko=
//$username = 'wiwoci9795@btsese.com';

$passsha = base64_encode(Keccak::hash($password, 256, true));

$req = json_encode(['password'=>$passsha, 'username'=> $username]);
try{
    $ch=curl_init('https://rtspplayer.vxg.io/api/v1/user/login/');
    curl_setopt_array($ch, [CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => false, CURLOPT_POST => true, 
        CURLOPT_POSTFIELDS => $req, CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => false, CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_HTTPHEADER => ['Content-Type:application/json', 'Content-Length: ' . strlen($req)]]);
    $result = curl_exec($ch);
    curl_close($ch);
    $result = json_decode($result,TRUE);
    if (!isset($result['token']) || !$result['token'])
        error(401,'No authorized');
    
    MCore::$core->response['userExistInFirebase'] = MUser::checkEmailExistInFirebase($username);
    MCore::$core->response['transfer'] = !MUser::getUserByEmail($username) && !MCore::$core->response['userExistInFirebase'];
} catch(Exception $e){
    error(501,'Internal error');
}

/*
return;

if (1){
include_once ('../../core/MCoreJson.php');
include_once ('../../core/MUser.php');

MCore::init();

// We need to check if we need to transfer this account from old back-end ot the new account
// There are 3 steps 
// Step #1  Check an account on rtspplayer back-end
// Step #2  Check an account on the firebase
// Step #3  Check an account on the cloudone 

// Check account on https://rtspplayer.vxg.io/
//  
$curdir = dirname(__FILE__);
include_once ($curdir."/../../../static_lib.php");
include_once ($curdir."/../../../rtspplayer_api.php");

$response = StaticLib::startPage();
$user = StaticLib::$REQUEST['username'];
error_log("user -> ". print_r(StaticLib::$REQUEST,true));
$password = StaticLib::$REQUEST['password'];
$need_transfer = false;

// Step #1
if ( isset($user) && isset($password))
    $need_transfer = RTSPPlayer_API::userLogin( $user, $password);

error_log("need_transfer1 -> ". $need_transfer);


//MCoreJson::init();
//MCore::checkOnlyForAuthorized();
// Step #2
if ($need_transfer == true)
{
    $is_firebase_user = MUser::checkEmailExistInFirebase($user);
    // Step #3
    $is_cloudone_user = (MUser::getUserByEmail($user) !== false);
    
    error_log("is_firebase_user -> ". $is_firebase_user);
    error_log("is_firebase_user -> ". $is_cloudone_user);
    
    if ($is_firebase_user === true && $is_cloudone_user == true)
        $need_transfer = false;    
}



$response['httpcode'] = 200;
$response['transfer'] = $need_transfer;
StaticLib::endPage($response);

}
*/