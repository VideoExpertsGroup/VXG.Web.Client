<?php
use kornrunner\Keccak;
include_once ('../../core/MCoreJson.php');
include_once ('../../core/MUser.php');
include_once('../../../Keccak.php');
include_once('../../../vendor/autoload.php');
MCoreJson::init();
list($username, $password) = MCore::checkAndGetInputParameters(['email','password']);
//$password = '123456'; //yIjJzp4JjVhk097W68wUChIUImO6zjojo2+ZBfEr1ko=
//$username = 'leyoy57456@1heizi.com';

$passsha = base64_encode(Keccak::hash($password, 256, true)); 
list($firebasepass) = MCore::getInputParameters(['firebasepass']);
$firebasepass = $firebasepass && trim($firebasepass) ? trim($firebasepass) : trim($password);

if (strlen($firebasepass)<6)
    error(403,'Firebase password less then 6 symbols');

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
    
    $user = MUser::getUserByEmail($username);
    if ($user || MUser::checkEmailExistInFirebase($username))
        error(403,'User not required transfer');

    $req = json_encode(['token'=>$result['token'], 'uid'=>$result['uid']]);
    $ch=curl_init('https://rtspplayer.vxg.io/api/v1/user/camera/list/');
    curl_setopt_array($ch, [CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => false, CURLOPT_POST => true, 
        CURLOPT_POSTFIELDS => $req, CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => false, CURLOPT_CUSTOMREQUEST => 'GET',
        CURLOPT_HTTPHEADER => ['Content-Type:application/json', 'Content-Length: ' . strlen($req)]]);
    $camlist = curl_exec($ch);
    curl_close($ch);
    $camlist = json_decode($camlist,TRUE);

    if (!is_array($camlist['data']))
        error(501,'Invalid cameras list from RTSP for user '.$username);

    MUser::createFirebaseUser($username, $username, $firebasepass, true);
    $firebase_token = MUser::getFirebaseUserToken($username, $firebasepass);
    if (!$firebase_token)
        error(501,'Failed get firebase token for user '.$username);

    $distr=MUser::getDefaultDistributor();
    $user = $distr->createUser($username);
    if (!$user)
        error(501,'Fail to create user '.$username);
    $user->firebase_token = $firebase_token;
    $user->updateLicenseKey();

    $ch=curl_init('https://web.skyvr.videoexpertsgroup.com/api/v2/account/');
    curl_setopt_array($ch, [CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => false, CURLOPT_POST => false, 
        CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => false, CURLOPT_CUSTOMREQUEST => 'GET',
        CURLOPT_HTTPHEADER => ['Content-Type:application/json','Authorization: LKey '.$user->serverLkey]]);
    $account = json_decode(curl_exec($ch),TRUE);
    curl_close($ch);    
    if (!$account || !isset($account['id']))
        error(501,'Fail to get owner id for user '.$username);
    $owner = $account['id'];
        
    $error = '';
    foreach($camlist['data'] as $cam){
        $chid = $cam['channelID'];
        $movereq = json_encode(['owner'=>['id'=>$owner]]);

        $ch=curl_init('https://web.skyvr.videoexpertsgroup.com/api/v2/cameras/'.$chid.'/');
        curl_setopt_array($ch, [CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => false, CURLOPT_POST => true, 
            CURLOPT_POSTFIELDS => $movereq, CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => false, CURLOPT_CUSTOMREQUEST => 'PUT',
            CURLOPT_HTTPHEADER => ['Content-Type:application/json','Authorization: LKey aT0iWa2QrKqvXXqB',
            'Authorization2: LKey '.$user->serverLkey, 'Content-Length: ' . strlen($movereq)]]);
        $ret = curl_exec($ch);
        $rez = 'complete';$resp='';
        if (curl_getinfo($ch, CURLINFO_HTTP_CODE)!=200){
            $error = 'Error transferring one or more cameras';
            $rez = 'fail';
            $resp = $ret;
        }
        curl_close($ch);    

        openlog("*** Transfer camera ".$chid." ".$rez." ", LOG_PID | LOG_PERROR, LOG_LOCAL0);
        syslog(LOG_NOTICE, 'New company owner='.$owner.' LKeys: aT0iWa2QrKqvXXqB => '.$user->serverLkey.' New user='.$user->email.' '.$resp);
        closelog();

    }
    if ($error)
        error(501,$error);

} catch(Exception $e){
    error(501,'Internal error');
}

MCore::$core->response['result'] = $error ? $error : 'ok';

return;

/*
if (1){
include_once ('../../core/MCoreJson.php');
include_once ('../../core/MUser.php');

// We need to transfer all cameras from RTSP player account to the same account on Cloudone and change password on RTSPplayer backend on XXX 
// There are 4 steps 
// Step #1  Check an account on rtspplayer back-end
// Step #2  Create an account on firebase
// Step #3  Check an account on the cloudone 
// Step #4  Receive camera list
// Step #5  Move cameras from RTSP account to the CloudOne account

// Step #1 Check account on https://rtspplayer.vxg.io/
//  

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../static_lib.php");
include_once ($curdir."/../../../rtspplayer_api.php");

$response = StaticLib::startPage();
$user = StaticLib::$REQUEST['username'];
error_log("user -> ". print_r(StaticLib::$REQUEST,true));
$password = StaticLib::$REQUEST['password'];
$valid_rtsp_user = false;


// Step #1 , check user on RTSP backend
if ( isset($user) && isset($password))
    $valid_rtsp_user = RTSPPlayer_API::userLogin( $user, $password);

if ($valid_rtsp_user === true)
{
    // Step #2 create an new user on Firebase
    $createdUser = MUser::createFirebaseUser($user,$user,$password);
    if ($createdUser === null)
    {
        

    }

    


}

// Code !!!! TODO
$response['httpcode'] = 200;
$response['transfer'] = $need_transfer;
StaticLib::endPage($response);
return;
}
*/