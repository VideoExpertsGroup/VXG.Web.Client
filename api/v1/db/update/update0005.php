<?php

function update0005($conn) {
    $result = array();
    $result['result'] = true;

	$query = $conn->prepare('
		CREATE TABLE IF NOT EXISTS "dealers_secrets" (
			id BIGSERIAL NOT NULL,
            dealerid BIGINT DEFAULT 0,
            secret_string varchar(64) NOT NULL,
			CONSTRAINT dealers_secret_id_pkey PRIMARY KEY (id)
    );');

    if (!$query->execute()) {
        $result['step'] = 1;
        $result['result'] = false;
        $result['error'] = $query->errorInfo();
        return $result;
    };
	return $result;
}
