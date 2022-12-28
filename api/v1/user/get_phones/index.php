<?php
include_once ('../../core/MCoreJson.php');
include_once ('../../core/MUser.php');
MCore::init();

//$user_email = 'hilahax138@ptcji.com';
//if (!isset($_GET['key']) || $_GET['key']!=md5($user_email))
//    error(401,'No access');

if (!isset($_GET['channelid']))
    error(401,'No channel id parameter found');

$channel_id = 0+$_GET['channelid'];
$lkeyhash = $_GET['userhash'];

$r = fetchAll('
select "phone","sheduler" from "user" where md5("serverLkey")=? and "phone" is not null and "phone"<>\'\'
union
select "phone","sheduler" from "user" where "parentUserID" = (select id from "user" where md5("serverLkey")=?)
and "phone" is not null and "phone"<>\'\'
and "id" in (select "userID" from "userCamera" where "cameraCHID"=?)',[$lkeyhash,$lkeyhash,$channel_id]);
$ret = [];
foreach($r as $v)
    $ret[] = ['phone'=>$v['phone'],'sheduler'=>$v['sheduler'] ? json_decode($v['sheduler']) : []];
print json_encode($ret);