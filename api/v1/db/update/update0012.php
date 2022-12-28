<?php

function update0012($conn) {
    $result = array();
    $result['result'] = true;

    $query = $conn->prepare('CREATE TABLE IF NOT EXISTS payment (
        id BIGSERIAL NOT NULL,
        "userID" BIGINT NOT NULL,
        created TIMESTAMP DEFAULT now(),
        updated TIMESTAMP DEFAULT now(),
        "planID" VARCHAR(32) DEFAULT NULL, /* onlinePro1,onlinePro3,onlinePro12, cloud10Pro1,cloud10Pro3,cloud10Pro12, cloud30Pro1,cloud30Pro3,cloud30Pro12 */
        ipn_ts VARCHAR(64) DEFAULT NULL,   /* hh:mm:ss Mmm DD, YYYY TZ, payment ts */ 
        txn_id VARCHAR(32) DEFAULT NULL,   /* transaction id */
        summ VARCHAR(16) DEFAULT NULL,     /* D...D,DD UNIT */
        expired VARCHAR(16) DEFAULT NULL,  /* YYYY-MM-DD in UTC timezone */
        CONSTRAINT "payment_pkey" PRIMARY KEY (id));');
    if (!$query->execute()) {
        $result['step'] = 1;
        $result['result'] = false;
        $result['error'] = $query->errorInfo();
        return $result;
    };

    $query2 = $conn->prepare('ALTER TABLE "userCamera" ADD COLUMN "paymentID" BIGINT default 0');
    if (!$query2->execute()) {
        $result['step'] = 2;
        $result['result'] = false;
        $result['error'] = $query2->errorInfo();
    }

    return $result;
}
