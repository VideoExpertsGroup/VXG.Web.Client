<?php

function update0017($conn) {
    $result = array();
    $result['result'] = false;

    $query1 = $conn->prepare('ALTER TABLE "user" ADD COLUMN "serverLkey" VARCHAR(32) DEFAULT \'\'');
    if (!$query1->execute()) {
        $result['step'] = 1;
        $result['error'] = $query1->errorInfo();
        return $result;
    }

    $query2 = $conn->prepare('ALTER TABLE "user" ADD COLUMN "serverHost" VARCHAR(256) DEFAULT \'\'');
    if (!$query2->execute()) {
        $result['step'] = 2;
        $result['error'] = $query2->errorInfo();
        return $result;
    }

    $query3 = $conn->prepare('ALTER TABLE "user" ADD COLUMN "serverPort" INT DEFAULT 0');
    if (!$query3->execute()) {
        $result['step'] = 3;
        $result['error'] = $query3->errorInfo();
        return $result;
    }

    $result['result'] = true;
    return $result;
}
