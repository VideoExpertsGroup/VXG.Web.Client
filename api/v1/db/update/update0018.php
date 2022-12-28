<?php

function update0018($conn) {
    $result = array();
    $result['result'] = false;

    $query1 = $conn->prepare('ALTER TABLE "user" ADD COLUMN "plans" VARCHAR(4096) DEFAULT \'\'');
    if (!$query1->execute()) {
        $result['step'] = 1;
        $result['error'] = $query1->errorInfo();
        return $result;
    }

    $query2 = $conn->prepare('ALTER TABLE "userCamera" ADD COLUMN "planID" VARCHAR(256) DEFAULT \'\'');
    if (!$query2->execute()) {
        $result['step'] = 2;
        $result['error'] = $query2->errorInfo();
        return $result;
    }

    $result['result'] = true;
    return $result;
}
