<?php

include_once ('../../core/MCoreJson.php');
include_once ('../../core/MUser.php');
MCoreJson::init();
MCore::checkOnlyForAuthorized();
if (!MCore::$core->current_user->isPartner())
    error(401,'No access');

list($email, $username, $password, $address, $phone, $sheduler) = MCore::checkAndGetInputParameters(['email', 'username', 'password', 'address', 'phone', 'sheduler']);

if (MCore::$core->current_user->getUserByEmail($email))
    error(501,'User already exist');

// Create firebase user with email verification flag is true
MUser::createFirebaseUser($email, $username, $password, true);

// Hard coding for now because I don't know what's happening.
$password = $password ? $password : "q1w2e3r4";

// Create user in local data base
$user = MCore::$core->current_user->createUser($email, $username, $password, $address);
$user->updateUser(null, null, $phone, null, null, $sheduler);

// Create group token for all cameras
$user->updateAllCamsToken();

MCore::$core->response['user'] = $user;

/*
return;

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../vendor/autoload.php");
include_once ($curdir."/../../../static_lib.php");
include_once ($curdir."/../../../static_lib_mail.php");

use Kreait\Firebase\Factory;
use Firebase\Auth\Token\Exception\InvalidToken;

// prepare link
$link = 'http'.((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') ? 's' : '').'://'.$_SERVER['HTTP_HOST'];
$pos = strpos($_SERVER['REQUEST_URI'], "/api/v1/user/");
$link .= substr($_SERVER['REQUEST_URI'], 0, $pos)."/email-confirmation/";

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

if(!StaticLib::isAuthorized()){
	StaticLib::error(401, "Unauthorized request");
}

$role = StaticLib::$ROLE;
$userid = StaticLib::$USERID;

$invite_role = "";
$can_invite_role = array(
    "channel" => "theater",
    "theater" => "distrib",
    "distrib" => "partner",
    "partner" => "user",
);

if (!isset($can_invite_role[$role])){
    StaticLib::error(403, "Denied invite somebody");
}

$invite_role = $can_invite_role[$role];

if (!isset(StaticLib::$REQUEST['email'])) {
    StaticLib::error(400, "Expected email");
}

if (!isset(StaticLib::$REQUEST['username'])) {
    StaticLib::error(400, "Expected username");
}

if (!isset(StaticLib::$REQUEST['address'])) {
    StaticLib::error(400, "Expected address");
}

$email = trim(StaticLib::$REQUEST['email']);
$username = trim(StaticLib::$REQUEST['username']);
$password = trim(StaticLib::$REQUEST['pass']);
$address = trim(StaticLib::$REQUEST['address']);

// check the email inside in parent
$stmt = $conn->prepare('SELECT * FROM "user" WHERE email=? AND "parentUserID"=?');
if (!$stmt->execute(array($email,$userid))) {
    StaticLib::error(552, $stmt->errorInfo());
}
if ($row = $stmt->fetch()) {
    StaticLib::error(403, "The Email already exist!");
}

function getFirebaseSignInEmailLink($to_user_email, $link){
    $a = dirname(dirname(dirname(dirname(__FILE__))));
    include_once($a.'/vendor/autoload.php');
    $fj = str_replace('<?php','',file_get_contents($a.'/conf.d/firebase.php'));
    $factory = (new Factory)->withServiceAccount($fj);
    $auth = $factory->createAuth();
    $actionCodeSettings = [
        'continueUrl' => $link,
        'handleCodeInApp' => true
    ];

    try{
        return $auth->getSignInWithEmailLink($to_user_email, $actionCodeSettings);
    } catch (Exception $e) {
    }
    return false;
}

if (class_exists('Kreait\Firebase\Factory')){

    $a = dirname(dirname(dirname(dirname(__FILE__))));
    include_once($a.'/vendor/autoload.php');
    $fj = str_replace('<?php','',file_get_contents($a.'/conf.d/firebase.php'));
    $factory = (new Factory)->withServiceAccount($fj);
    $auth = $factory->createAuth();
    $u='';
    try {
        $u = $auth->getUserByEmail($email);
    } catch (Exception $e) {
    }
    if ($u)
        StaticLib::error(403, "The Email already exist!");

//    $actionCodeSettings = [
//        'continueUrl' => $link,
//        'handleCodeInApp' => true
//    ];
//    $l='';
//    try{
//        $l = $auth->getSignInWithEmailLink($email, $actionCodeSettings);
//    } catch (Exception $e) {
//    }
//    if (!$l)
//        StaticLib::error(403, "Add user failed");

    $link = $l;

    $userProperties = [
        'email' => $email,
        'emailVerified' => true,
        'password' => $password,
        'displayName' => $username,
        'disabled' => false
    ];
    
    $createdUser = null;
    try {
        $createdUser = $auth->createUser($userProperties);
    } catch (Exception $e) {
        StaticLib::error(403, $e->getMessage());
    }
    if (!$createdUser)
        StaticLib::error(403, 'Failed to create user');
}


$email_template = file_get_contents($curdir.'/../../../templates/email_invite.html');
$email_subject = "Registration to VXG RTSP Player";
$invite_text = ''; // nothing now
$email_template = str_replace('%invite_text%', $invite_text, $email_template);

if (empty($email_template)) {
    StaticLib::error(553, "Email template not found.");
}

$token = StaticLib::gen_guid();
$password_sha3 = '(wait-confirm-email)';
$desc = 'User invited at '.date('Y-m-d H:i:s', time()).'UTC. Email is not confirmed yet.';
$userRole = 'user';

$stmt = $conn->prepare('INSERT INTO "user"(role, "parentUserID", name, email, address, password_sha3, "desc",token) VALUES(?,?,?,?,?,?,?,?)');
if (!$stmt->execute(array($invite_role,$userid,$username,$email,$address,$password_sha3,$desc,$token))) {
    StaticLib::error(554, $stmt->errorInfo());
}

$stmt = $conn->prepare('SELECT * FROM "user" WHERE id='.$conn->lastInsertId("user_id_seq"));
if(!$stmt->execute()) {
    StaticLib::error(555, $stmt->errorInfo());
}

$link .= '?token='.$token;

//$email_body = str_replace('%direct_link%', $link, $email_template);
//error_log('Mail body: '.$email_body);
//StaticLibMail::send($email, $email_subject, $email_subject, $email_body);


$response['httpcode'] = 200;
StaticLib::endPage($response);
*/