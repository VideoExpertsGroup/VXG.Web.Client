<?php

function update0008($conn) {
    $result = array();
    $result['result'] = true;

    return $result;
    $stmp = $conn->prepare('ALTER TABLE "camera" ADD COLUMN "location" varchar(64) DEFAULT NULL');
    if (!$stmp->execute()) {
        $result['result'] = false;
        $result['error'] = $stmp->errorInfo();
        return $result;
    }

	return $result;
}
