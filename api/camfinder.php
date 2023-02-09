<?php
$a = dirname(dirname(__FILE__));
$directory = $a.'/download';
$camfinder = scandir($directory,SCANDIR_SORT_DESCENDING);
header('Location: /download/'.$camfinder[0]);
exit;
