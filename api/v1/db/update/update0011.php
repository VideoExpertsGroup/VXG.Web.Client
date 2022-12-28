<?php

function update0011($conn) {
    $result = array();
    $result['result'] = true;

    $stmp = $conn->prepare('ALTER TABLE "user" ADD COLUMN "allCamsTokenID" BIGINT DEFAULT 0');
    if (!$stmp->execute()) {
        $result['result'] = false;
        $result['error'] = $stmp->errorInfo();
        return $result;
    }

    return $result;
}
