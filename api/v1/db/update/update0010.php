<?php

function update0010($conn) {
    $result = array();
    $result['result'] = true;

    $stmp = $conn->prepare('ALTER TABLE "user" ADD COLUMN "allCamsToken" varchar(512) DEFAULT NULL');
    if (!$stmp->execute()) {
        $result['result'] = false;
        $result['error'] = $stmp->errorInfo();
        return $result;
    }

	return $result;
}
