<?php

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../static_lib.php");
include_once ($curdir."/../../../static_lib_mail.php");

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

if(!StaticLib::isAuthorized()){
	StaticLib::error(401, "Unauthorized request");
}

$userRole = StaticLib::isSuperAdmin() ? 'channel' :
           (StaticLib::isChannel() ? 'theater' :
           (StaticLib::isTheater() ? 'distrib' :
           (StaticLib::isDistributor() ? 'partner' :
           (StaticLib::isPartner() ? 'user' : null))));
if(!$userRole)
	StaticLib::error(403, "Access deny");

$parentUserID = StaticLib::$USERID;
$parentUserRole = StaticLib::$USERRAW['role'];

if(!isset(StaticLib::$REQUEST['username'],StaticLib::$REQUEST['email'],StaticLib::$REQUEST['password'])){
	StaticLib::error(400, "username and password are required");
}
$username = StaticLib::$REQUEST['username'];
$email = StaticLib::$REQUEST['email'];
$password_sha3 = StaticLib::$REQUEST['password'];
$isInvite = $username == '(invited)';
$email_template = null;

// firstly check if username and password already exists
if (!$isInvite) {
    $stmt = $conn->prepare('SELECT * FROM "user" WHERE name=? OR email=? AND password_sha3=?');
    if (!$stmt->execute(array($username, $email, $password_sha3)))
        StaticLib::error(550, $stmt->errorInfo());
    if ($row = $stmt->fetch())
        StaticLib::error(403, "The such username and password already exist, try enter another password");

    $address = isset(StaticLib::$REQUEST['address']) ? StaticLib::$REQUEST['address'] : '';
} else {
    $stmt = $conn->prepare('SELECT * FROM "user" WHERE email=? AND "parentUserID"=?');
    if (!$stmt->execute(array($email,$parentUserID)))
        StaticLib::error(553, $stmt->errorInfo());
    if ($row = $stmt->fetch())
        StaticLib::error(403, "The email is already exist in your users list.");
    $email_template = file_get_contents($curdir.'/../../../templates/email_invite.html');
    if (empty($email_template))
        StaticLib::error(403, "Email template not found.");
    $password_sha3 = $username;
}
$desc = isset(StaticLib::$REQUEST['desc']) ? StaticLib::$REQUEST['desc'] : '';
$token = StaticLib::gen_guid();

$stmt = $conn->prepare('INSERT INTO "user"(role, "parentUserID", name, email, password_sha3, address, "desc",token) VALUES(?,?,?,?,?,?,?,?)');
if (!$stmt->execute(array($userRole,$parentUserID,$username,$email,$password_sha3,$address,$desc,$token)))
    StaticLib::error(551, $stmt->errorInfo());

$stmt = $conn->prepare('SELECT * FROM "user" WHERE id='.$conn->lastInsertId("user_id_seq"));
if(!$stmt->execute())
    StaticLib::error(552, $stmt->errorInfo());

if ($isInvite) {
    $link = 'http'.((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') ? 's' : '').'://'.$_SERVER['HTTP_HOST'].'/?token='.$token;
    $email_body = str_replace('%direct_link%', $link, $email_template);
    error_log('Mail body: ' . $email_body);
    StaticLibMail::send($email, 'Invitation', 'text email', $email_body);
}


if($row = $stmt->fetch()){
    $response['data'] = array(
        'id' => $row['id'],
        'name' => $row['name'],
        'email' => $row['email'],
        'address' => $row['address'],
        'desc' => $row['desc'],
        'created' => $row['created'],
        'updated' => $row['updated'],
        'totalUsers' => $row['totalUsers'],
        'totalCameras' => $row['totalCameras'],
        'bandwidthBytes' => $row['bandwidthBytes'],
        'storageBytes' => $row['storageBytes'],
        'revenue' => $row['revenue'],
    );
}

$response['httpcode'] = 200;
StaticLib::endPage($response);
