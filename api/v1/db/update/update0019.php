<?php

function update0019($conn) {
    $result = array();
    $result['result'] = false;

    $query1 = $conn->prepare('ALTER TABLE "camera" ADD COLUMN "planID" VARCHAR(256) DEFAULT \'\'');
    if (!$query1->execute()) {
        $result['step'] = 1;
        $result['error'] = $query1->errorInfo();
        return $result;
    }

    $query2 = $conn->prepare('ALTER TABLE "userCamera" DROP COLUMN "planID"');
    if (!$query2->execute()) {
        $result['step'] = 2;
        $result['error'] = $query1->errorInfo();
        return $result;
    }


    $result['result'] = true;
    return $result;
}
