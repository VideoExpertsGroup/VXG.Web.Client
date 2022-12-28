<?php

include_once ('../../core/MCoreJson.php');
include_once ('../../core/MUser.php');
MCoreJson::init();
MCore::checkOnlyForAuthorized();

if (!MCore::$core->current_user->isPartner())
    $user_id = MCore::$core->current_user->id;
else
    list($user_id) = MCore::getInputParameters(['id']);

if ($user_id == MCore::$core->current_user->id)
    $user = MCore::$core->current_user;
else
    $user = MUser::getUserById(0+$user_id);

if (!$user)
    error('404','User not found');
if (MCore::$core->current_user->isPartner() && (MCore::$core->current_user->id!=$user->parentUserID && MCore::$core->current_user->id!=$user->id))
    error('401','No access');

$password = null;
list($address, $desc, $phone, $username, $sheduler) = MCore::getInputParameters(['address','desc','phone','username', 'sheduler']);
if (MCore::$core->current_user->isPartner() && MCore::$core->current_user->id!=$user->id)
    list($password) = MCore::getInputParameters(['password']);

$user->updateUser($address, $desc, $phone, $username, $password, $sheduler);

/*
return;

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../vendor/autoload.php");
include_once ($curdir."/../../../static_lib.php");

use Kreait\Firebase\Factory;
use Firebase\Auth\Token\Exception\InvalidToken;

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

if (!StaticLib::isAuthorized())
	StaticLib::error(401, "Unauthorized request");

if (!(StaticLib::isSuperAdmin() || StaticLib::isChannel() || StaticLib::isTheater() || StaticLib::isDistributor() || StaticLib::isPartner()))
	StaticLib::error(403, "Access deny");

$parentUserID = StaticLib::$USERID;

if (!isset(StaticLib::$REQUEST['id']))
	StaticLib::error(400, "id parameters are required");

$userID = intval(StaticLib::$REQUEST['id']);
$desc = isset(StaticLib::$REQUEST['desc']) ? StaticLib::$REQUEST['desc'] : '';
$addr = isset(StaticLib::$REQUEST['address']) ? StaticLib::$REQUEST['address'] : '';
$username = StaticLib::$REQUEST['username'];

// check that the updating user is belong the
$stmt = $conn->prepare('SELECT * FROM "user" WHERE id = ? AND "parentUserID" = ?');
if (!$stmt->execute(array($userID, $parentUserID)))
    StaticLib::error(550, $stmt->errorInfo());
if (!$row = $stmt->fetch())
    StaticLib::error(404,'User not found.');

$stmt = $conn->prepare('UPDATE "user" SET address=?,"desc"=? WHERE id=? AND "parentUserID"='.$parentUserID);
if (!$stmt->execute(array($addr,$desc,$userID)))
    StaticLib::error(550, $stmt->errorInfo());

if ($usernam){
    $stmt = $conn->prepare('UPDATE "user" SET name=? WHERE id=? AND "parentUserID"='.$parentUserID);
    if (!$stmt->execute(array($username,$userID)))
        StaticLib::error(550, $stmt->errorInfo());
}

if (isset(StaticLib::$REQUEST['password'])) {
    $password_sha3 = StaticLib::$REQUEST['password'];
    $stmt = $conn->prepare('SELECT * FROM "user" WHERE name=? AND password_sha3=? AND "parentUserID"='.$parentUserID);
    if (!$stmt->execute(array($username, $password_sha3)))
        StaticLib::error(551, $stmt->errorInfo());
    if ($row = $stmt->fetch())
        StaticLib::error(403, "The such username and password already exist, try enter another password");

    $stmt = $conn->prepare('UPDATE "user" SET password_sha3=? WHERE id=? AND "parentUserID"='.$parentUserID);
    if (!$stmt->execute(array($password_sha3, $userID)))
        StaticLib::error(552, $stmt->errorInfo());
}

if (isset(StaticLib::$REQUEST['pass']) && class_exists('Kreait\Firebase\Factory')){

    $stmt = $conn->prepare('SELECT email FROM "user" WHERE "id"=?');
    if (!$stmt->execute(array($userID)))
        StaticLib::error(551, $stmt->errorInfo());
    if (!($row = $stmt->fetch()))
        StaticLib::error(403, "The such username and password already exist, try enter another password");

    $a = dirname(dirname(dirname(dirname(__FILE__))));
//    include_once($a.'/vendor/autoload.php');
    $fj = str_replace('<?php','',file_get_contents($a.'/conf.d/firebase.php'));
    $factory = (new Factory)->withServiceAccount($fj);
    $auth = $factory->createAuth();
    $u='';
    try {
        $u = $auth->getUserByEmail($row['email']);
    } catch (Exception $e) {
        StaticLib::error(403, "The Email not exist!");
    }
    if (!$u)
        StaticLib::error(403, "The Email not exist!");
    $auth->changeUserPassword($u->uid, StaticLib::$REQUEST['pass']);
}

$response['httpcode'] = 200;
StaticLib::endPage($response);
*/