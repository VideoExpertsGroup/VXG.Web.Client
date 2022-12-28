<?php

function update0025($conn) {
    $result = array();
    $result['result'] = false;

    $query1 = $conn->prepare('ALTER TABLE "userCamera" ADD COLUMN "cameraCHID" bigint');
    if (!$query1->execute()) {
        $result['step'] = 1;
        $result['error'] = $query1->errorInfo();
        return $result;
    }
    $query1 = $conn->prepare('update "userCamera" u set "cameraCHID"=(select c."channelID" from "camera" c where c.id=u."cameraID")');
    if (!$query1->execute()) {
        $result['step'] = 2;
        $result['error'] = $query1->errorInfo();
        return $result;
    }
    $query1 = $conn->prepare('ALTER TABLE "userCamera" ALTER COLUMN "cameraID" SET default 0');
    if (!$query1->execute()) {
        $result['step'] = 3;
        $result['error'] = $query1->errorInfo();
        return $result;
    }


    $result['result'] = true;
    return $result;
}
