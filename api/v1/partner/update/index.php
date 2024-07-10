<?php

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../static_lib.php");
include_once ('../../core/MCoreJson.php');
include_once ('../../core/MCamera.php');
include_once ('../../core/MUser.php');
MCore::init();

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

if (1){
//    list($partner_id, $setting_rec, $setting_int) = MCore::checkAndGetInputParameters(['id','setting_rec','setting_int']);
    list($partner_id, $setting_rec, $setting_int, $setting_server, $setting_dvr, $setting_ai) = MCore::getInputParameters(['id','setting_rec','setting_int', 'setting_server', 'setting_dvr', 'setting_ai']);
	
    $stmt = $conn->prepare('SELECT "js" FROM "user" WHERE "id"='.$partner_id);
	if (!$stmt->execute())
        StaticLib::error(500, print_r($stmt->errorInfo(),true));
    
	$js_var = $stmt->fetchColumn();
			
	if ($setting_rec){		
		if ($setting_rec == "on"){
			$pos = strpos($js_var, "core/vxg_retention_access.js");
			if ($pos === false) {
				if ($js_var == "")
					$js_var = "core/vxg_retention_access.js";
				else
					$js_var .= "\ncore/vxg_retention_access.js";				
			}			
		}		
		if ($setting_rec == "off"){
			$js_var = str_replace('core/vxg_retention_access.js','',$js_var);
		}			
	}
	
	if ($setting_int){		
		if ($setting_int == "on"){
			$pos = strpos($js_var, "core/modules/integration/integration.js");
			if ($pos === false) {
				if ($js_var == "")
					$js_var = "core/modules/integration/integration.js";
				else
					$js_var .= "\ncore/modules/integration/integration.js";
			}
		}
		
		if ($setting_int == "off"){
			$js_var = str_replace('core/modules/integration/integration.js','',$js_var);	
		}			
	}

	if ($setting_server){		
		if ($setting_server == "on"){
			$pos = strpos($js_var, "core/modules/servers/servers.js");
			if ($pos === false) {
				if ($js_var == "")
					$js_var = "core/modules/servers/servers.js";
				else
					$js_var .= "\ncore/modules/servers/servers.js";
			}
		}
		
		if ($setting_server == "off"){
			$js_var = str_replace('core/modules/servers/servers.js','',$js_var);	
		}			
	}

	if ($setting_dvr){		
		if ($setting_dvr == "on"){
			$pos = strpos($js_var, "core/modules/dvr_nvr/dvr_nvr.js");
			if ($pos === false) {
				if ($js_var == "")
					$js_var = "core/modules/dvr_nvr/dvr_nvr.js";
				else
					$js_var .= "\ncore/modules/dvr_nvr/dvr_nvr.js";
			}
		}
		
		if ($setting_dvr == "off"){
			$js_var = str_replace('core/modules/dvr_nvr/dvr_nvr.js','',$js_var);	
		}			
	}

	if ($setting_ai) {
		if ($setting_ai == "on"){
			$pos = strpos($js_var, "core/vxg_ai_access.js");
			if ($pos === false) {
				if ($js_var == "")
					$js_var = "core/vxg_ai_access.js";
				else
					$js_var .= "\ncore/vxg_ai_access.js";				
			}			
		}		
		if ($setting_ai == "off"){
			$js_var = str_replace('core/vxg_ai_access.js','',$js_var);
		}
	}

	$js_var = str_replace('\n\n','\n',$js_var);			
	$query = 'UPDATE "user" SET "js"=E\'' . $js_var . '\' WHERE "id"=' .$partner_id;	

	$stmt = $conn->prepare($query);
		
    if (!$stmt->execute())
        StaticLib::error(500, $stmt->errorInfo());

	$response['httpcode'] = 200;
    StaticLib::endPage($response);
    exit;
}

if(!StaticLib::isAuthorized()){
	StaticLib::error(401, "Unauthorized request");
}

$response['limit'] = StaticLib::$LIMIT;
$response['offset'] = StaticLib::$OFFSET;
$response['total'] = $total;
$response['httpcode'] = 200;

StaticLib::endPage($response);
