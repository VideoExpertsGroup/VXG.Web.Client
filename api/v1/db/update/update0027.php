<?php

function update0027($conn) {
    $result = array();
    $result['result'] = false;

    $query1 = $conn->prepare('ALTER TABLE "user" ADD COLUMN "sheduler" varchar(512) default \'\'');
    if (!$query1->execute()) {
        $result['step'] = 1;
        $result['error'] = $query1->errorInfo();
        return $result;
    }

    $result['result'] = true;
    return $result;
}
