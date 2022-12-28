<?php

function update0021($conn) {
    $result = array();
    $result['result'] = false;

    $query1 = $conn->prepare('ALTER TABLE "camera" ADD COLUMN "planName" VARCHAR(256) DEFAULT \'\'');
    if (!$query1->execute()) {
        $result['step'] = 1;
        $result['error'] = $query1->errorInfo();
        return $result;
    }

    $result['result'] = true;
    return $result;
}
