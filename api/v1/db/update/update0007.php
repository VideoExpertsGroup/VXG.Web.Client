<?php

function update0007($conn) {
    $result = array();
    $result['result'] = true;

    return $result;
    $stmp = $conn->prepare('ALTER TABLE "camera" DROP COLUMN "bus"');
    if (!$stmp->execute()) {
        $result['result'] = false;
        $result['error'] = $stmp->errorInfo();
        return $result;
    }

    $stmp = $conn->prepare('ALTER TABLE "camera" DROP COLUMN "location"');
    if (!$stmp->execute()) {
        $result['result'] = false;
        $result['error'] = $stmp->errorInfo();
        return $result;
    }

    $stmp = $conn->prepare('ALTER TABLE "camera" DROP COLUMN "route"');
    if (!$stmp->execute()) {
        $result['result'] = false;
        $result['error'] = $stmp->errorInfo();
        return $result;
    }

	return $result;
}
