<?php
$ep = 'https://dashboard.videoexpertsgroup.com/downloads/camera_finder/';
$current = file_get_contents($ep.'current');
header('Location: '.$ep.$current);
exit;
