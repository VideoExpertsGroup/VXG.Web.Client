<?php

function update0026($conn) {
    $result = array();
    $result['result'] = false;

    $query1 = $conn->prepare('ALTER TABLE "user" ADD COLUMN "phone" varchar(1024)');
    if (!$query1->execute()) {
        $result['step'] = 1;
        $result['error'] = $query1->errorInfo();
        return $result;
    }

    $result['result'] = true;
    return $result;
}
