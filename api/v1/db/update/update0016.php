<?php

function update0016($conn) {
    $result = array();
    $result['result'] = false;

    $query1 = $conn->prepare('ALTER TABLE "logs" ADD COLUMN "log_tag" VARCHAR(128) DEFAULT \'\'');
    if (!$query1->execute()) {
        $result['step'] = 1;
        $result['error'] = $query1->errorInfo();
        return $result;
    }

    $query2 = $conn->prepare('ALTER TABLE "logs" ALTER COLUMN "log_message" TYPE TEXT');
    if (!$query2->execute()) {
        $result['step'] = 2;
        $result['error'] = $query2->errorInfo();
        return $result;
    }

    $result['result'] = true;
    return $result;
}
