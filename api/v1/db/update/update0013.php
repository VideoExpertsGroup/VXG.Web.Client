<?php

function update0013($conn) {
    $result = array();
    $result['result'] = false;

    $query = $conn->prepare('CREATE TABLE IF NOT EXISTS plan (
        id BIGSERIAL NOT NULL,
        name VARCHAR(32) NOT NULL,
        uid VARCHAR(32) NOT NULL, /* onlinePro1,onlinePro3,onlinePro12, cloud10Pro1,cloud10Pro3,cloud10Pro12, cloud30Pro1,cloud30Pro3,cloud30Pro12,??? */
        "monthsAmount" SMALLINT DEFAULT 1,
        "camerasAmount" SMALLINT DEFAULT 1,
        price VARCHAR(32) NOT NULL, /* 999.99 USD, DEFAULT USD */
        "desc" VARCHAR(1024) DEFAULT NULL,
        CONSTRAINT "plan_pkey" PRIMARY KEY (id));');
    if (!$query->execute()) {
        $result['error'] = $query->errorInfo();
        return $result;
    };

    $query1 = $conn->prepare('
		INSERT INTO plan (name,uid,"monthsAmount",price) VALUES
		(\'Online Pro\',\'onlinePro1\',1,\'5\'),
		(\'Online Pro\',\'onlinePro3\',3,\'15\'),
		(\'Online Pro\',\'onlinePro12\',12,\'50\'),
		(\'Cloud 10 Pro\',\'cloud10Pro1\',1,\'12\'),
		(\'Cloud 10 Pro\',\'cloud10Pro3\',3,\'36\'),
		(\'Cloud 10 Pro\',\'cloud10Pro12\',12,\'100\'),
		(\'Cloud 30 Pro\',\'cloud30Pro1\',1,\'22\'),
		(\'Cloud 30 Pro\',\'cloud30Pro3\',3,\'66\'),
		(\'Cloud 30 Pro\',\'cloud30Pro12\',12,\'200\');
	');
    if (!$query1->execute()) {
        $result['step'] = 1;
        $result['error'] = $query1->errorInfo();
    };

    $query2 = $conn->prepare('CREATE TABLE IF NOT EXISTS "cameraPlan" (
        id BIGSERIAL NOT NULL,
        "cameraID" BIGINT NOT NULL,
        "userID" BIGINT NOT NULL,
        "planID" BIGINT NOT NULL,
        "paymentID" BIGINT default 0,
        CONSTRAINT "cameraPlan_pkey" PRIMARY KEY (id));');
    if (!$query2->execute()) {
        $result['step'] = 2;
        $result['error'] = $query2->errorInfo();
        return $result;
    };

    $query3 = $conn->prepare('ALTER TABLE "user" ADD COLUMN "stripeAccID" VARCHAR(64) DEFAULT NULL');
    if (!$query3->execute()) {
        $result['step'] = 3;
        $result['error'] = $query3->errorInfo();
    }

    $query4 = $conn->prepare('ALTER TABLE "payment" DROP COLUMN "planID"');
    if (!$query4->execute()) {
        $result['step'] = 4;
        $result['error'] = $query4->errorInfo();
        return $result;
    }

    $query41 = $conn->prepare('ALTER TABLE "payment" ADD COLUMN "planID" BIGINT NOT NULL');
    if (!$query41->execute()) {
        $result['step'] = 4.1;
        $result['error'] = $query41->errorInfo();
        return $result;
    }

    $query5 = $conn->prepare('ALTER TABLE payment ADD COLUMN "customerID" VARCHAR(32) DEFAULT NULL;'); // Stripe customer id
    if (!$query5->execute()) {
        $result['step'] = 5;
        $result['error'] = $query5->errorInfo();
        return $result;
    }
    $query51 = $conn->prepare('ALTER TABLE payment ADD COLUMN "subscribID" VARCHAR(32) DEFAULT NULL;'); // Stripe customer id
    if (!$query51->execute()) {
        $result['step'] = 5.1;
        $result['error'] = $query51->errorInfo();
        return $result;
    }

    $result['result'] = true;
    return $result;
}
