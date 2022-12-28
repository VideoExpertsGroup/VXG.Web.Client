<?php

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../static_lib.php");
include_once ($curdir."/../../../static_lib_mail.php");

// prepare link
$link = 'http'.((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') ? 's' : '').'://'.$_SERVER['HTTP_HOST'];
$pos = strpos($_SERVER['REQUEST_URI'], "/api/v1/user/");
$link .= substr($_SERVER['REQUEST_URI'], 0, $pos)."/email-confirmation/";

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

if(!StaticLib::isAuthorized() || !StaticLib::isPartner()){
	StaticLib::error(401, "Unauthorized request");
}
$confirm_uid = 0+StaticLib::$REQUEST['confirm_uid'];

if ($confirm_uid<0){
    $response['httpcode'] = 200;
    StaticLib::endPage($response);
    exit;
}


$stmt = $conn->prepare('SELECT * FROM "user" WHERE id = ?');
if (!$stmt->execute(array($confirm_uid)))
    StaticLib::error(551, $stmt->errorInfo());
if (!($row = $stmt->fetch(PDO::FETCH_ASSOC)))
    StaticLib::error(403, "Dealer ID not found");
//print_r($row);


$email = trim($row['email']);
$username = trim($row['name']);

$email_template = file_get_contents($curdir.'/../../../templates/email_signup.html');
$email_subject = "Registration to VXG RTSP Player";


if (empty($email_template))
    StaticLib::error(553, "Email template not found.");

$token = StaticLib::gen_guid();
$desc = 'Confirm email resended at '.date('Y-m-d H:i:s', time()).'UTC. Email is not confirmed yet.';

//print ('UPDATE "user" set "desc"="'.$desc.'", token="'.$token.'" where id='.$confirm_uid);
$stmt = $conn->prepare('UPDATE "user" set "desc"=?, token=? where id=?');
if (!$stmt->execute(array($desc,$token,$confirm_uid)))
    StaticLib::error(554, $stmt->errorInfo());

$link .= '?token='.$token;

// Move To Seprate class 

$email_body = str_replace('%direct_link%', $link, $email_template);

//error_log('Mail body: '.$email_body);
StaticLibMail::send($email, $email_subject, $email_subject, $email_body);

$response['result']=$desc;

$response['httpcode'] = 200;
StaticLib::endPage($response);
