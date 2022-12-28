<?php

function update0001($conn){
	$result = array();
    $result['result'] = true;

	$stmt = $conn->prepare("
		CREATE TABLE IF NOT EXISTS updates (
			id BIGSERIAL NOT NULL,
			version BIGSERIAL NOT NULL,
			dt TIMESTAMP DEFAULT now(),
			CONSTRAINT updates_pkey PRIMARY KEY (id)
		);");
	if(!$stmt->execute()){
        $result['step'] = 1;
		$result['error'] = $stmt->errorInfo();
		$result['result'] = false;
		return $result;
	}

    $stmt = $conn->prepare("
		CREATE TABLE IF NOT EXISTS logs (
			id BIGSERIAL NOT NULL,
			log_type varchar(128) NOT NULL,
			log_message varchar(1024) NOT NULL,
			created TIMESTAMP DEFAULT now(),
			CONSTRAINT logs_pkey PRIMARY KEY (id)
		);");
    if(!$stmt->execute()){
        $result['step'] = 2;
        $result['error'] = $stmt->errorInfo();
        $result['result'] = false;
        return $result;
    }

    $stmt = $conn->prepare("CREATE TABLE IF NOT EXISTS settings (
			id BIGSERIAL NOT NULL,
			sett_name varchar(255) NOT NULL,
			sett_type varchar(255) NOT NULL,
			sett_value text NOT NULL,
			CONSTRAINT settings_pkey PRIMARY KEY (id)
		);");
    if(!$stmt->execute()){
        $result['step'] = 3;
        $result['error'] = $stmt->errorInfo();
        $result['result'] = false;
        return $result;
    }

	return $result;
}
