<?php

function update0015($conn) {
    $result = array();
    $result['result'] = false;

    $query1 = $conn->prepare('ALTER TABLE "user" DROP COLUMN "stripeAccID"');
    if (!$query1->execute()) {
        $result['step'] = 1;
        $result['error'] = $query1->errorInfo();
        return $result;
    }
    $query2 = $conn->prepare('ALTER TABLE "user" ADD COLUMN "stripeAcctData" VARCHAR(128) DEFAULT NULL');
    if (!$query2->execute()) {
        $result['step'] = 2;
        $result['error'] = $query2->errorInfo();
        return $result;
    }

    $query3 = $conn->prepare('CREATE TABLE IF NOT EXISTS "transfer" (
        id BIGSERIAL NOT NULL,
        "planID" BIGINT NOT NULL,
        "userID" BIGINT NOT NULL,
        "paymentID" BIGINT NOT NULL,
        "commissionID" BIGINT NOT NULL,
        "isDone" INT default 0,
        CONSTRAINT "transfer_pkey" PRIMARY KEY (id));');
    if (!$query3->execute()) {
        $result['step'] = 3;
        $result['error'] = $query3->errorInfo();
        return $result;
    };

    $result['result'] = true;
    return $result;
}
