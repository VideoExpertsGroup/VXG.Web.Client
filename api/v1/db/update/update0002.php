<?php

function update0002($conn) {
	$result = array();
    $result['result'] = true;

	$query = $conn->prepare('
		CREATE TABLE IF NOT EXISTS "user" (
			id BIGSERIAL NOT NULL,
			role varchar(10) NOT NULL,  /* dbadmin, superadmin, distrib, partner, user */
			name varchar(64) NOT NULL,
			password_sha3 varchar(64) NOT NULL,
			email varchar(128) DEFAULT NULL,
			"parentUserID" BIGINT DEFAULT 0,
			token varchar(64) DEFAULT NULL,
			"tokenExpires" TIMESTAMP DEFAULT NULL,
			address varchar(128) DEFAULT NULL,
			"desc" varchar(512) DEFAULT NULL,
			created TIMESTAMP DEFAULT now(),
			updated TIMESTAMP DEFAULT now(),
			"totalPartners" BIGINT DEFAULT 0,
			"totalUsers" BIGINT DEFAULT 0,
			"totalCameras" BIGINT DEFAULT 0,
			"bandwidthBytes" BIGINT DEFAULT 0,
			"storageBytes" BIGINT DEFAULT 0,
			revenue BIGINT DEFAULT 0,
			CONSTRAINT user_pkey PRIMARY KEY (id)
	);');
    if (!$query->execute()) {
        $result['step'] = 1;
        $result['result'] = false;
        $result['error'] = $query->errorInfo();
        return $result;
    };

    $query = $conn->prepare('
        CREATE TABLE IF NOT EXISTS "server" (
			id BIGSERIAL NOT NULL,
			"userID" BIGINT NOT NULL, /* owners is superadmins */
			name varchar(64) DEFAULT NULL,
			hostname varchar(64) DEFAULT NULL,
			port INT DEFAULT 0,
			key varchar(128) DEFAULT NULL,
			"desc" varchar(512) DEFAULT NULL,
			"totalCameras" BIGINT DEFAULT 0,
			"maxCameras" BIGINT DEFAULT 0,
			created TIMESTAMP DEFAULT now(),
			updated TIMESTAMP DEFAULT now(),
			CONSTRAINT server_pkey PRIMARY KEY (id)
	);');
    if (!$query->execute()) {
        $result['step'] = 2;
        $result['result'] = false;
        $result['error'] = $query->errorInfo();
        return $result;
    };

    $query = $conn->prepare('
        CREATE TABLE IF NOT EXISTS "camera" (
			id BIGSERIAL NOT NULL,
			"userID" BIGINT NOT NULL, /* owner */
			"deviceID" varchar(16) DEFAULT NULL,
			"serverID" BIGINT DEFAULT 0,
			"channelID" BIGINT DEFAULT 0,
			name varchar(64) DEFAULT NULL,
			url varchar(128) DEFAULT NULL,
			username varchar(64) DEFAULT NULL,
			password varchar(64) DEFAULT NULL,
			tz varchar(50) DEFAULT NULL,
			type SMALLINT DEFAULT NULL,
			"isRecording" BOOLEAN DEFAULT FALSE,
			location varchar(64) DEFAULT NULL,
			"address" varchar(128) DEFAULT NULL,
			lon DOUBLE PRECISION DEFAULT 0,
			lat DOUBLE PRECISION DEFAULT 0,
			floor SMALLINT DEFAULT 0,
			x DOUBLE PRECISION DEFAULT 0,
			y DOUBLE PRECISION DEFAULT 0,
			floor_plans_id BIGINT DEFAULT 0,
			"desc" varchar(512) DEFAULT NULL,
			"rwToken" TEXT DEFAULT NULL,
			"roToken" TEXT DEFAULT NULL,
			"bandwidthBytes" BIGINT DEFAULT 0,
			"storageBytes" BIGINT DEFAULT 0,
			created TIMESTAMP DEFAULT now(),
			updated TIMESTAMP DEFAULT now(),
			CONSTRAINT camera_pkey PRIMARY KEY (id)
	);');
    if (!$query->execute()) {
        $result['step'] = 3;
        $result['result'] = false;
        $result['error'] = $query->errorInfo();
        return $result;
    };

    $query = $conn->prepare('
        CREATE TABLE IF NOT EXISTS "userCamera" (
			id BIGSERIAL NOT NULL,
			"userID" BIGINT NOT NULL,
			"cameraID" BIGINT NOT NULL,
			"favorite" INT DEFAULT 0,
			permissions SMALLINT DEFAULT NULL, /* bit: 0 - only viewer, 1 - ptz allowed, 2 - ? control*/
			CONSTRAINT "userCamera_pkey" PRIMARY KEY (id)
	);');
    if (!$query->execute()) {
        $result['step'] = 4;
        $result['result'] = false;
        $result['error'] = $query->errorInfo();
        return $result;
    };

    $query = $conn->prepare('
        CREATE TABLE IF NOT EXISTS "floor_plans" (
			id BIGSERIAL NOT NULL,
			"address" varchar(128) DEFAULT NULL,
			"floor" SMALLINT DEFAULT 0,
			"img" varchar(128) DEFAULT NULL,
			"img_small" varchar(128) DEFAULT NULL,
			CONSTRAINT floor_plans_pkey PRIMARY KEY (id)
	);');
    if (!$query->execute()) {
        $result['step'] = 5;
        $result['result'] = false;
        $result['error'] = $query->errorInfo();
        return $result;
    };

	return $result;
}
