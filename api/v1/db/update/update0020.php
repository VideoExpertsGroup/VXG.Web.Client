<?php

function update0020($conn) {
    $result = array();
    $result['result'] = false;

    $query1 = $conn->prepare('ALTER TABLE "camera" ADD COLUMN "cancelledPlanID" VARCHAR(256) DEFAULT \'\'');
    if (!$query1->execute()) {
        $result['step'] = 1;
        $result['error'] = $query1->errorInfo();
        return $result;
    }

    $query2 = $conn->prepare('ALTER TABLE "camera" ADD COLUMN "planExpired" BIGINT DEFAULT 0');
    if (!$query2->execute()) {
        $result['step'] = 2;
        $result['error'] = $query1->errorInfo();
        return $result;
    }


    $result['result'] = true;
    return $result;
}
