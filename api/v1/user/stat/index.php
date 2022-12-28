<?php

$curdir = dirname(__FILE__);
require_once ($curdir."/../../../static_lib.php");
include_once ($curdir."/../../../streamland_api.php");

date_default_timezone_set('UTC');
set_time_limit(0);
$stat_interval_hours = 24;
$stat_interval_seconds = $stat_interval_hours * 60 * 60;

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

if(!StaticLib::isAuthorized()){
	StaticLib::error(401, "Unauthorized request");
}

$userID = StaticLib::$USERID;
$isSuperAdmin = StaticLib::isSuperAdmin();
$isChannel = StaticLib::isChannel();
$isTheater = StaticLib::isTheater();
$isDistributor = StaticLib::isDistributor();
//$isPartner = StaticLib::isPartner();

// TODO: to optimize query for totalCameras,totalUsers, need inc/dec appropriate field "total*" in table "user" during add/del camera operations
if ($isSuperAdmin) {
    $stmt4 = $conn->prepare('SELECT count(*) as "totalServers" FROM server WHERE "userID"='.$userID);
    if(!$stmt4->execute()) StaticLib::error(550, $stmt4->errorInfo());
    $row_servers = $stmt4->fetch();

    $stmt00 = $conn->prepare('SELECT count(*) as "totalChannels" FROM "user" WHERE "parentUserID"='.$userID);
    if(!$stmt00->execute()) StaticLib::error(551, $stmt00->errorInfo());
    $row_channels = $stmt00->fetch();

    $stmt0 = $conn->prepare('SELECT count(*) as "totalTheaters" FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID"='.$userID.')');
    if(!$stmt0->execute()) StaticLib::error(552, $stmt0->errorInfo());
    $row_theaters = $stmt0->fetch();

    $stmt1 = $conn->prepare('SELECT count(*) as "totalDistributors" FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID"='.$userID.'))');
    if(!$stmt1->execute()) StaticLib::error(553, $stmt1->errorInfo());
    $row_distribs = $stmt1->fetch();

    $stmt11 = $conn->prepare('SELECT count(*) as "totalPartners" FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID"='.$userID.')))');
    if(!$stmt11->execute()) StaticLib::error(554, $stmt11->errorInfo());
    $row_partners = $stmt11->fetch();

    $stmt2 = $conn->prepare('SELECT count(*) as "totalUsers" FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID"='.$userID.'))))');
    if(!$stmt2->execute()) StaticLib::error(555, $stmt2->errorInfo());
    $row_users = $stmt2->fetch();

    $stmt3 = $conn->prepare('SELECT count(*) over() AS "totalCameras","channelID","serverID" FROM camera WHERE "userID" IN (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID"=' . $userID . '))))');
} else
if ($isChannel) {
    $stmt0 = $conn->prepare('SELECT count(*) as "totalTheaters" FROM "user" WHERE "parentUserID"='.$userID);
    if(!$stmt0->execute()) StaticLib::error(551, $stmt0->errorInfo());
    $row_theaters = $stmt0->fetch();

    $stmt1 = $conn->prepare('SELECT count(*) as "totalDistributors" FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID"='.$userID.')');
    if(!$stmt1->execute()) StaticLib::error(552, $stmt1->errorInfo());
    $row_distribs = $stmt1->fetch();

    $stmt11 = $conn->prepare('SELECT count(*) as "totalPartners" FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID"='.$userID.'))');
    if(!$stmt11->execute()) StaticLib::error(553, $stmt11->errorInfo());
    $row_partners = $stmt11->fetch();

    $stmt2 = $conn->prepare('SELECT count(*) as "totalUsers" FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID"='.$userID.')))');
    if(!$stmt2->execute()) StaticLib::error(554, $stmt2->errorInfo());
    $row_users = $stmt2->fetch();

    $stmt3 = $conn->prepare('SELECT count(*) over() AS "totalCameras","channelID","serverID" FROM camera WHERE "userID" IN (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID"=' . $userID . ')))');
} else
if ($isTheater) {
    $stmt1 = $conn->prepare('SELECT count(*) as "totalDistributors" FROM "user" WHERE "parentUserID"='.$userID);
    if(!$stmt1->execute()) StaticLib::error(551, $stmt1->errorInfo());
    $row_distribs = $stmt1->fetch();

    $stmt11 = $conn->prepare('SELECT count(*) as "totalPartners" FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID"='.$userID.')');
    if(!$stmt11->execute()) StaticLib::error(552, $stmt11->errorInfo());
    $row_partners = $stmt11->fetch();

    $stmt2 = $conn->prepare('SELECT count(*) as "totalUsers" FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID"='.$userID.'))');
    if(!$stmt2->execute()) StaticLib::error(553, $stmt2->errorInfo());
    $row_users = $stmt2->fetch();

    $stmt3 = $conn->prepare('SELECT count(*) over() AS "totalCameras","channelID","serverID" FROM camera WHERE "userID" IN (SELECT id FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID"=' . $userID . '))');
} else
if ($isDistributor) {
    $stmt1 = $conn->prepare('SELECT count(*) as "totalPartners" FROM "user" WHERE "parentUserID"='.$userID);
    if(!$stmt1->execute()) StaticLib::error(550, $stmt1->errorInfo());
    $row_partners = $stmt1->fetch();

    $stmt2 = $conn->prepare('SELECT count(*) as "totalUsers" FROM "user" WHERE "parentUserID" in (SELECT id FROM "user" WHERE "parentUserID"='.$userID.')');
    if(!$stmt2->execute()) StaticLib::error(551, $stmt2->errorInfo());
    $row_users = $stmt2->fetch();

    $stmt3 = $conn->prepare('SELECT count(*) over() AS "totalCameras","channelID","serverID" FROM camera WHERE "userID" IN (SELECT id FROM "user" WHERE "parentUserID"=' . $userID . ')');
} else {
    $stmt1 = $conn->prepare('SELECT count(*) as "totalUsers" FROM "user" WHERE "parentUserID"='.$userID);
    if(!$stmt1->execute()) StaticLib::error(550, $stmt1->errorInfo());
    $row_users = $stmt1->fetch();

    $stmt3 = $conn->prepare('SELECT count(*) over() AS "totalCameras","channelID","serverID" FROM camera WHERE "userID"='.$userID);
}

$serverID = 0;
$server = array();
$storageSize = 0;
$totalCameras = 0;
$downstream_size = 0;
$downstream_dur = 0;
$now = time();
$month_current_day = date('d', $now);
$month_first_day = date('Y-m-1', $now);
$month_prev_day = date('Y-m-d', $now-$stat_interval_seconds); // prev day
if ($month_current_day == '1') {
    $month_first_day = $month_prev_day;
    $month_first_day = date('Y-m-1', $now-$stat_interval_seconds);
}
$statRange = array('start' => $month_first_day, 'end' => $month_prev_day);

if (!$stmt3->execute()) StaticLib::error(500, $stmt3->errorInfo());
while (($row_cams = $stmt3->fetch())) {
    $totalCameras = $row_cams['totalCameras'];
    if ($serverID !== $row_cams['serverID']) {
        $serverID = $row_cams['serverID'];
        $stmt = $conn->prepare('SELECT * FROM server WHERE id='.$serverID);
        if (!$stmt->execute()) StaticLib::error(554, $stmt->errorInfo());
        if (!($server = $stmt->fetch())) continue;
        if (!StreamLandAPI::generateServicesURLs($server['hostname'], $server['port']))
            StaticLib::error(555, 'Failed generateServicesURLs');
    }
    /*
    $response_cloud = StreamLandAPI::getChannelStat($row_cams['channelID'], $server['key'], $statRange);
    if (isset($response_cloud['errorDetail']))
        StaticLib::error(556, 'Failed getting channel statistics');

    $storageSize += $response_cloud['records_size'] + $response_cloud['clips_size'] + $response_cloud['images_size'];
    $downstream_size += $response_cloud['downloaded_size'] + $response_cloud['live_size'];
    $downstream_dur += $response_cloud['downloaded_duration'] + $response_cloud['live_duration'];
    */
    //TODO: may be update appropriate fields(bandwidthBytes,storageBytes) in camera table to optimize cloud requests (one update per day)
};

$response['data'] = array(
    'total' => $isSuperAdmin ? $row_channels['totalChannels'] : 0,
    'totalChannels' => $isSuperAdmin ? $row_channels['totalChannels'] : 0,
    'totalTheaters' => $isChannel || $isSuperAdmin ? $row_theaters['totalTheaters'] : 0,
    'totalDistributors' => $isTheater || $isChannel || $isSuperAdmin ? $row_distribs['totalDistributors'] : 0,
	'totalPartners' => $isDistributor || $isTheater || $isChannel || $isSuperAdmin ? $row_partners['totalPartners'] : 0,
    'totalUsers' => $row_users['totalUsers'],
    'totalCameras' => $totalCameras,
    'totalServers' => $isSuperAdmin ? $row_servers['totalServers'] : 0,
    'bandwidthBytes' => $downstream_size,
    'bandwidthDur' => $downstream_dur,
    'storageSize' => $storageSize,
    'statRange' => $statRange,
    'revenue' => isset(StaticLib::$USERRAW['revenue']) ? StaticLib::$USERRAW['revenue'] : 0,
);

$response['httpcode'] = 200;
StaticLib::endPage($response);
