<?php

function update0014($conn) {
    $result = array();
    $result['result'] = false;

    $query1 = $conn->prepare('CREATE TABLE IF NOT EXISTS "commission" (
        id BIGSERIAL NOT NULL,
        "planID" BIGINT NOT NULL,
        "userID" BIGINT NOT NULL,
        "feeCents" INT default 0,  /* USD = feeCents / 100 */
        CONSTRAINT "commission_pkey" PRIMARY KEY (id));');
    if (!$query1->execute()) {
        $result['step'] = 1;
        $result['error'] = $query1->errorInfo();
        return $result;
    };

    $query2 = $conn->prepare('ALTER TABLE "plan" DROP COLUMN "price"');
    if (!$query2->execute()) {
        $result['step'] = 2;
        $result['error'] = $query2->errorInfo();
        return $result;
    }
    $query21 = $conn->prepare('ALTER TABLE "plan" DROP COLUMN "camerasAmount"');
    if (!$query21->execute()) {
        $result['step'] = 2.1;
        $result['error'] = $query21->errorInfo();
        return $result;
    }

    $query22 = $conn->prepare('ALTER TABLE "plan" ADD COLUMN "feeCents" INT DEFAULT 0');
    if (!$query22->execute()) {
        $result['step'] = 2.2;
        $result['error'] = $query22->errorInfo();
        return $result;
    }
    $query23 = $conn->prepare('UPDATE plan SET "feeCents"= CASE uid '.
        'WHEN \'onlinePro1\' then 500 '.
        'WHEN \'onlinePro3\' then 1500 '.
        'WHEN \'onlinePro12\' then 5000 '.
        'WHEN \'cloud10Pro1\' then 1200 '.
        'WHEN \'cloud10Pro3\' then 3600 '.
        'WHEN \'cloud10Pro12\' then 10000 '.
        'WHEN \'cloud30Pro1\' then 2200 '.
        'WHEN \'cloud30Pro3\' then 6600 '.
        'WHEN \'cloud30Pro12\' then 20000 '.
        'END WHERE name!=\'\';');
    if (!$query23->execute()) {
        $result['step'] = 2.3;
        $result['error'] = $query23->errorInfo();
    };

    $query3 = $conn->prepare('CREATE TABLE IF NOT EXISTS "dealerPlan" (
        id BIGSERIAL NOT NULL,
        "userID" BIGINT NOT NULL,
        "planID" BIGINT NOT NULL,
        "isArchive" SMALLINT DEFAULT 0,
        CONSTRAINT "dealerPlan_pkey" PRIMARY KEY (id));');
    if (!$query3->execute()) {
        $result['step'] = 3;
        $result['error'] = $query3->errorInfo();
        return $result;
    };

    $result['result'] = true;
    return $result;
}
