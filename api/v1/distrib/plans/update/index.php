<?php
$curdir = dirname(__FILE__);
include_once ($curdir."/../../../../static_lib.php");
include_once ('../../../core/MCoreJson.php');
include_once ('../../../core/MCamera.php');
include_once ('../../../core/MUser.php');
MCore::init();

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

// how I wanna do it
//list($partner_id, $plans) = MCore::getInputParameters(['id', 'plansArr']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	$partner_email = $_POST['email'];
	$partner_id = $_POST["id"];
	$plans = $_POST['plans'];
} else {
	$partner_email = $_GET['email'];
	$partner_id = $_GET["id"];
	$plans = $_GET['plans'];
}

if (!isset($plans) || (!isset($partner_email) && !isset($partner_id))) {
	$response['httpcode'] = 400;
	StaticLib::endPage($response);
	exit;
}	

if (isset($partner_id)){
	
	$ret = fetchRow('SELECT "plans" from "user" WHERE id=?', [$partner_id]);

	$merge = update_plans($ret["plans"],$plans);
	
	$query = 'UPDATE "user" SET "plans"=\''.$merge.'\' WHERE "id"=\''.$partner_id.'\'';	    
}

if (isset($partner_email)){ 
	
	$ret = fetchRow('SELECT "plans" from "user" WHERE email=?', [$partner_email]);

	$merge = update_plans($ret["plans"],$plans);

	$query = 'UPDATE "user" SET "plans"=\''.$merge.'\' WHERE "email"=\''.$partner_email.'\'';	    
}

$stmt = $conn->prepare($query);

$ret = $stmt->execute();

if (!$ret)
	StaticLib::error(500, $stmt->errorInfo());

$response['httpcode'] = 200;
StaticLib::endPage($response);

function update_plans($js1,$js2)
{
	if (empty($js1)) return $js2; 

	$a1 = json_decode($js1);
	$a2 = json_decode($js2);

	$merged = $a1;    
    foreach ($a2 as $k2 => &$v2)
    {
        $exist = false;
	    foreach ($merged as $km => &$vm)
      	{
           if ($v2->id == $vm->id) {
           		$vm->count = $vm->count + $v2->count;
                $exist = true;
           }
      	}    	
		if (!$exist)
    	    array_push($merged, $v2); 
    }    
    return json_encode($merged);
}

