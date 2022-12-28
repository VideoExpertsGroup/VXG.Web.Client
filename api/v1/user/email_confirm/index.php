<?php

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../static_lib.php");

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

if (!isset(StaticLib::$REQUEST['token'], StaticLib::$REQUEST['password'])) {
    StaticLib::error(400, "token and password are required");
}

$usertoken = StaticLib::$REQUEST['token'];
$password_sha3 = StaticLib::$REQUEST['password'];

if (!is_int($dealerID)) // ctype_digit()
    $dealerID = intval($dealerID);

$stmt = $conn->prepare('SELECT * FROM "user" WHERE token = ?');
if (!$stmt->execute(array($usertoken)))
    StaticLib::error(551, $stmt->errorInfo());
if (!($row = $stmt->fetch())) {
    StaticLib::error(403, "Token not found");
} else {
    $userid = $row['id'];
}

$desc = 'User confirmed email at '.date('Y-m-d H:i:s', time()).'UTC.';

$stmt = $conn->prepare('UPDATE "user" SET token = ?, "desc" = ?, password_sha3 = ? WHERE id = ?');
if (!$stmt->execute(array('',$desc, $password_sha3, $userid)))
    StaticLib::error(552, $stmt->errorInfo());

$response['httpcode'] = 200;
StaticLib::endPage($response);
