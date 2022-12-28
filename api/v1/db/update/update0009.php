<?php

function update0009($conn) {
    $result = array();
    $result['result'] = true;

    $query = $conn->prepare('
        CREATE TABLE IF NOT EXISTS "pushService" (
			id BIGSERIAL NOT NULL,
			"userID" BIGINT NOT NULL,
			"cameraID" BIGINT NOT NULL,
			"pushID" BIGINT NOT NULL,
			"deviceID" varchar(64) NOT NULL,
			"token" varchar(512) DEFAULT NULL,
			created TIMESTAMP DEFAULT now(),
			updated TIMESTAMP DEFAULT now(),
			CONSTRAINT pushService_pkey PRIMARY KEY (id)
	);');
    if (!$query->execute()) {
        $result['result'] = false;
        $result['error'] = $query->errorInfo();
    };

	return $result;
}
