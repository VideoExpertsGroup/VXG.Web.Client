<?php
use Kreait\Firebase\Factory;
use Firebase\Auth\Token\Exception\InvalidToken;
$curdir_static_lib = dirname(__FILE__);




class StaticLib {
	static $TOKEN = null;
	static $CONN = null;
	static $CONFIG = null;
	static $TIMESTART = null;
	static $REQUEST = null;
	static $ROLE = null;
	static $USERID = null;
    static $PARENTUSERID = null;
    static $MANAGE_USERID = null;
    static $USERRAW = null;
    static $DBRAW = null;
	static $SETTINGS = null;
    static $OFFSET = 0;
    static $LIMIT = -1;
    static $LIMITOFFSET = '';

	static function db_connection() {
		if (StaticLib::$CONN != null)
			return StaticLib::$CONN;
		
		StaticLib::$CONN = new PDO(
			'pgsql:host='.StaticLib::$CONFIG['db']['host'].';dbname='.StaticLib::$CONFIG['db']['dbname'],
			StaticLib::$CONFIG['db']['username'],
			StaticLib::$CONFIG['db']['userpass']
		);
		return StaticLib::$CONN;
	}
	
	static function gen_guid() {
		mt_srand((double)microtime()*10000);//optional for php 4.2.0 and up.
		$charid = strtoupper(md5(uniqid(rand(), true)));
		$hyphen = chr(45);// "-"
		$uuid = substr($charid, 0, 8).$hyphen
				.substr($charid, 8, 4).$hyphen
				.substr($charid,12, 4).$hyphen
				.substr($charid,16, 4).$hyphen
				.substr($charid,20,12);
		return $uuid;	
	}
	
	static function getRandomString($length = 10) {
		mt_srand((double)microtime()*10000);//optional for php 4.2.0 and up.
		$characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		$charactersLength = strlen($characters);
		$randomString = '';
		for ($i = 0; $i < $length; $i++) {
			$randomString .= $characters[rand(0, $charactersLength - 1)];
		}
		return $randomString;
	}
	
	static function read_json_input(){
		return json_decode(file_get_contents('php://input'), true);
	}
	
	static function isAuthorized(){
		return StaticLib::$TOKEN != null;
	}
	
	static function last_db_version(){
		$conn = StaticLib::db_connection();
		$current_db_ver = 0;
		$stmt = $conn->prepare('SELECT * FROM updates ORDER BY dt DESC LIMIT 1 OFFSET 0');
		if(!$stmt->execute()){
			StaticLib::error(500, $stmt->errorInfo());
		}

		if($row = $stmt->fetch()){
			$current_db_ver = $row['version'];
		}
		return $current_db_ver;
	}

	static function getServerData($uid=null){
		if ($uid===null)
			$uid = StaticLib::$USERID;
		if (!$uid) $uid=0;
		$conn = StaticLib::db_connection();
		$stmt = $conn->prepare('SELECT * from (
			SELECT 0 as id, s.key as "serverLkey",s.hostname as "serverHost",s.port as "serverPort" from "server" s 
			UNION(
			WITH RECURSIVE r AS (SELECT * FROM "user" WHERE id=? UNION SELECT u.* FROM "user" u JOIN r ON r."parentUserID"=u.id) 
			SELECT r.id, r."serverLkey", r."serverHost", r."serverPort" FROM r where r."serverLkey"!=\'\' order by r.id desc limit 1)
			) a order by a."id" desc limit 1');
		$stmt->execute(array($uid));
		if ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
			unset($row['id']);
			return $row;
		}
		return false;
	}
	
	static function startPage() {
		header('Access-Control-Allow-Origin: *');
		header('Content-Type: application/json');
		StaticLib::$TIMESTART = microtime(true);
		StaticLib::$REQUEST = StaticLib::read_json_input();

        if (isset(StaticLib::$REQUEST['limit'])) {
            $limit = StaticLib::$REQUEST['limit'];
            if (!is_numeric($limit) || intval($limit) < 0)
                StaticLib::error(500, "Limit should be integer number");
            StaticLib::$LIMIT = $limit;
            StaticLib::$LIMITOFFSET = " LIMIT $limit";
        }
        if (isset(StaticLib::$REQUEST['offset'])) {
            $offset = StaticLib::$REQUEST['offset'];
            if (!is_numeric($offset) || intval($offset) < 0)
                StaticLib::error(500, "Offset should be integer number");
            StaticLib::$OFFSET = $offset;
            StaticLib::$LIMITOFFSET .= " OFFSET $offset";
        }

        if(isset(StaticLib::$REQUEST['uid'])){
            StaticLib::$USERID = StaticLib::$REQUEST['uid'];
        } else if(isset($_POST['uid'])){
            StaticLib::$USERID = $_POST['uid'];
        }else{
            StaticLib::$USERID = null;
        }
		if(isset(StaticLib::$REQUEST['token'])){
			StaticLib::$TOKEN = StaticLib::$REQUEST['token'];
		} else if(isset($_POST['token'])){
			StaticLib::$TOKEN = $_POST['token'];
		}else{
			StaticLib::$TOKEN = null;
		}
        if(isset(StaticLib::$REQUEST['manage_uid'])){
            StaticLib::$MANAGE_USERID = StaticLib::$REQUEST['manage_uid'];
        } else if(isset($_POST['manage_uid'])){
            StaticLib::$MANAGE_USERID = $_POST['manage_uid'];
        }else{
            StaticLib::$MANAGE_USERID = null;
        }

        $response = array(
            'httpcode' => 500,
            'lead_time_sec' => -1,
            'data' => array(),
        );
		if(StaticLib::$TOKEN != null){
			$conn = StaticLib::db_connection();
			try {

				include_once('vendor/autoload.php');
				if (
					// IT iS WORKAROUND ,because we need support Native and Firebase authorization 
					// We need : superadmin that works for old authorization only
					strlen(StaticLib::$TOKEN) > 50 &&
				    class_exists('Kreait\Firebase\Factory')
				   ){
					$fj = str_replace('<?php','',file_get_contents(dirname(__FILE__).'/conf.d/firebase.php'));
					$factory = (new Factory)->withServiceAccount($fj);
					$auth = $factory->createAuth();
					try {
						$verify = $auth->verifyIdToken(StaticLib::$TOKEN);
					} catch (Exception $e) {
						StaticLib::$TOKEN = null;
						return $response;
					}
					$uid = $verify->getClaim('sub');
					$firebase_user = $auth->getUser($uid);
					if (!$firebase_user->email) {
						StaticLib::$TOKEN = null;
						return $response;
					}
			
					$stmt = $conn->prepare('SELECT * FROM "user" WHERE "email" = ?');
					$stmt->execute(array($firebase_user->email));
				} else {
					$stmt = $conn->prepare('SELECT * FROM "user" WHERE token = ?');
					$stmt->execute(array(StaticLib::$TOKEN));
				}
				if ($row = $stmt->fetch()){
                    if (1  || StaticLib::$TOKEN == $row['token']) {
                        StaticLib::$ROLE = $row['role'];
                        StaticLib::$USERID = $row['id'];
                        StaticLib::$PARENTUSERID = $row['parentUserID'];
                        StaticLib::$USERRAW = $row;

                        if (StaticLib::$MANAGE_USERID) {
                            $stmt = $conn->prepare('WITH RECURSIVE r AS (SELECT * FROM "user" WHERE id=? UNION SELECT u.* FROM "user" u JOIN r ON r."parentUserID"=u.id) SELECT * FROM r WHERE id=?');
                            $stmt->execute(array(StaticLib::$MANAGE_USERID, StaticLib::$USERID));
                            if ($row = $stmt->fetch()) {
                                $stmt = $conn->prepare('SELECT * FROM "user" WHERE id = ?');
                                $stmt->execute(array(StaticLib::$MANAGE_USERID));
                                if ($row = $stmt->fetch()) {
                                    $response['owner_uid'] = StaticLib::$USERID;
                                    $response['manage_uid'] = $row['id'];
                                    StaticLib::$ROLE = $row['role'];
                                    StaticLib::$USERID = $row['id'];
                                    StaticLib::$USERRAW = $row;
                                }
                            } else
                                StaticLib::error(403, 'No permissions to manage the UID.');
                        }
                    } else
                        StaticLib::$TOKEN = null;
				} else
					StaticLib::$TOKEN = null;
			} catch(PDOException $e) {
				StaticLib::$TOKEN = null;
				StaticLib::error(500, $e->getMessage());
			}
		}

		return $response;
	}
	
	static function startAdminSimplePage() {
		if(isset($_COOKIE['VideoSurveillanceDBAdmin'])){
			StaticLib::$TOKEN = $_COOKIE['VideoSurveillanceDBAdmin'];
		}else{
			StaticLib::$TOKEN = null;
		}

		if(StaticLib::$TOKEN != null){
			$conn = StaticLib::db_connection();
			try {
				$stmt = $conn->prepare('SELECT * FROM "user" WHERE token = ?');
				$stmt->execute(array(StaticLib::$TOKEN));
				if ($row = $stmt->fetch()){
					StaticLib::$ROLE = $row['role'];
					StaticLib::$USERID = $row['id'];
					if(StaticLib::$ROLE != 'dbadmin'){
						StaticLib::$TOKEN = null;
						StaticLib::$USERID = null;
					}
				}else{
					StaticLib::$TOKEN = null;
				}
			} catch(PDOException $e) {
				StaticLib::$TOKEN = null;
				StaticLib::error(500, $e->getMessage());
			}
		}
	}
	
	static function endpage($response) {
		if (StaticLib::$TIMESTART != null){
			$result['lead_time_sec'] = microtime(true) - StaticLib::$TIMESTART;
		}
		http_response_code($response['httpcode']);
		echo json_encode($response);
	}
	
	static function error($code, $message) {
		$response = array(
			'result' => 'fail',
			'httpcode' => $code,
			'errorDetail' => $message,
			'data' => array(),
		);
		error_log("Response: ".print_r($response,true));
		StaticLib::endpage($response);
		exit;
	}
	
	static function getSett($sett_name){
		if(StaticLib::$SETTINGS == null){
			// cache
			StaticLib::$SETTINGS = array();
			$conn = StaticLib::db_connection();
			$stmt = $conn->prepare('SELECT * FROM settings');
			$stmt->execute();
			while($row = $stmt->fetch()){
				$k = $row['sett_name'];
				StaticLib::$SETTINGS[$k] = $row['sett_value'];
			}
		}
		return isset(StaticLib::$SETTINGS[$sett_name]) ? StaticLib::$SETTINGS[$sett_name] : '';
	}

	static function addLog($t, $msg){
		$conn = StaticLib::db_connection();
		$stmt = $conn->prepare('INSERT INTO logs(log_type, log_message) VALUES(?, ?)');
		if(!$stmt->execute(array($t, $msg))){
			StaticLib::error(500, $stmt->errorInfo());
		}
	}
    static function sendAlertMessage($msg){
	    // TODO: send alert message to admins channels
    }

    static function isDBAdmin() {
        return StaticLib::$ROLE == 'dbadmin';
    }

	static function isSuperAdmin() {
		return StaticLib::$ROLE == 'superadmin';
	}
    static function isChannel() {
        return StaticLib::$ROLE == 'channel';
    }
    static function isTheater() {
        return StaticLib::$ROLE == 'theater';
    }
	static function isPartner($role = false) {
		return $role ? $role : StaticLib::$ROLE == 'partner';
	}
    static function isDistributor() {
        return StaticLib::$ROLE == 'distrib';
    }
	static function isUser() {
		return StaticLib::$ROLE == 'user';
	}
	
	static function isRoleAllowed($role) {
		return
			$role == "user" ||
			$role == "partner" ||
            $role == "superadmin" ||
            $role == "theater" ||
            $role == "channel" ||
			$role == "dbadmin";
	}
}

// load config
include ($curdir_static_lib."/conf.d/config.php");
StaticLib::$CONFIG = $config;

class Log {

	static function ok($tag, $msg){
		$conn = StaticLib::db_connection();
		$stmt = $conn->prepare('INSERT INTO logs(log_type, log_tag, log_message) VALUES(?, ?, ?)');
		if(!$stmt->execute(array('ok', $tag, $msg))){
			StaticLib::error(500, $stmt->errorInfo());
		}
	}

	static function info($tag, $msg){
		$conn = StaticLib::db_connection();
		$stmt = $conn->prepare('INSERT INTO logs(log_type, log_tag, log_message) VALUES(?, ?, ?)');
		if(!$stmt->execute(array('info', $tag, $msg))){
			StaticLib::error(500, $stmt->errorInfo());
		}
	}

	static function err($tag, $msg){
		error_log('[ERROR] '.$tag.': '.$msg);
		$conn = StaticLib::db_connection();
		$stmt = $conn->prepare('INSERT INTO logs(log_type, log_tag, log_message) VALUES(?, ?, ?)');
		if(!$stmt->execute(array('err', $tag, $msg))){
			StaticLib::error(500, $stmt->errorInfo());
		}
	}

	static function warn($tag, $msg){
		error_log('[WARN] '.$tag.': '.$msg);
		$conn = StaticLib::db_connection();
		$stmt = $conn->prepare('INSERT INTO logs(log_type, log_tag, log_message) VALUES(?, ?, ?)');
		if(!$stmt->execute(array('warn', $tag, $msg))){
			StaticLib::error(500, $stmt->errorInfo());
		}
	}
}
