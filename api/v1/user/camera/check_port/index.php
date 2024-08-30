<?php

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../../static_lib.php");
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
include_once ('../../../core/MUser.php');
MCore::init();

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['httpcode'] = 405; // Method Not Allowed
    StaticLib::endPage($response);
    exit;
}

$ip = $_POST['ip'];
$port = $_POST['port'];

if (!isset($ip) || !isset($port)) {
    $response['httpcode'] = 400; // Bad Request
    StaticLib::endPage($response);
    exit;
}

/*
if (filter_var($ip, FILTER_VALIDATE_IP) === false) {
    $response['httpcode'] = 400; // Bad Request
    $response['error'] = "Invalid IP address.";
    StaticLib::endPage($response);
    exit;
}
*/

if (!is_numeric($port)) {
    $response['httpcode'] = 400; // Bad Request
    $response['error'] = "Invalid port number.";
    StaticLib::endPage($response);
    exit;
}

function isPortOpen($ip, $port, $timeout = 3) {
    $connection = @fsockopen($ip, $port, $errno, $errstr, $timeout);
    if ($connection) {
        fclose($connection);
        return true;
    } else {
        return false;
    }
}

if (isPortOpen($ip, $port)) {
    $response['message'] = "Port $port on $ip is open.";
} else {
    $response['message'] = "Port $port on $ip is closed.";
}

$response['httpcode'] = 200; // OK
StaticLib::endPage($response);