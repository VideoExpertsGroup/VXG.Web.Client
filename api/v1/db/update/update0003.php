<?php

function update0003($conn) {
    $result = array();
    $result['result'] = true;

	$query = $conn->prepare('
		insert into "user"(role,name,password_sha3) values(\'superadmin\',\'superadmin\',\'\');
	');
    if (!$query->execute()) {
        $result['result'] = false;
        $result['error'] = $query->errorInfo();
    };
	$query = $conn->prepare('
		insert into "user"(role,name,password_sha3) values(\'distrib\',\'distrib\',\'\');
	');
    if (!$query->execute()) {
        $result['result'] = false;
        $result['error'] = $query->errorInfo();
    };

	return $result;
}
