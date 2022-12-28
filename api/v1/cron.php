<?php
// Cron need for call every day 

error_log('Cron started');

date_default_timezone_set('UTC');
include_once ('core/MCore.php');
include_once ('core/MCamera.php');
MCore::init();  

$cron_last_start = fetchOne('select "sett_value" from "settings" where "sett_name"=\'CRON_LAST_START\'');
// If the cron was launched less than 10 minutes ago
if ($cron_last_start && intval($cron_last_start) + 60*10 >= time())
    exit;

if ($cron_last_start)
    query('update "settings" set "sett_value"=? where "sett_name"=\'CRON_LAST_START\'', [time()]);
else
    query('insert into "settings" ("sett_name","sett_value","sett_type") VALUES (\'CRON_LAST_START\',?,\'number\')', [time()]);

while (MCamera::updateNextExpiredCamera()){
    query('update "settings" set "sett_value"=? where "sett_name"=\'CRON_LAST_START\'', [time()]);
    set_time_limit(30);
}