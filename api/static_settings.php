<?php
$curdir_static_settings = dirname(__FILE__);

class StaticSettings {
	static $DEFAULT_VALS = null;
}

// Init default settings
StaticSettings::$DEFAULT_VALS = array(
	"email_host" => array(
		"type" => "string",
		"value" => "",
		"group" => "email_conf",
		"caption" => "SMTP host"
	),
    "email_port" => array(
        "type" => "number",
        "value" => "",
        "group" => "email_conf",
        "caption" => "SMTP port"
    ),
    "email_address" => array(
        "type" => "string",
        "value" => "",
        "group" => "email_conf",
        "caption" => "SMTP email address"
    ),
    "email_from_name" => array(
        "type" => "string",
        "value" => "",
        "group" => "email_conf",
        "caption" => "Send email from name"
    ),
    "email_password" => array(
        "type" => "string",
        "value" => "",
        "group" => "email_conf",
        "caption" => "SMTP password"
    ),
);
