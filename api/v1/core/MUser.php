<?php
include_once('MCore.php');
include_once('MCamera.php');
include_once(dirname(dirname(dirname(__FILE__))).'/streamland_api.php');

use Kreait\Firebase\Factory;
use Firebase\Auth\Token\Exception\InvalidToken;
use Aws\SecretsManager\SecretsManagerClient; 
use Aws\Sns\SnsClient; 
use Aws\Exception\AwsException;
use Aws\Credentials\CredentialProvider;

/**
 *  Class for working with table 'user' in VXG database
 *
 * Sample of use:
 * 
 * include_once('MCore.php');
 * 
 * MCore::init();
 * 
 * $user = MUser::getUserById(123);
 */
class MUser{
    /**
     * Create MUser object from 'user' table row
     * 
     * @param array $array row from 'user' table
     */
    protected function __construct($array=array())
    {                                          
        if (is_array($array)) foreach($array as $attrName => $attrValue)
            $this->{$attrName} = $array[$attrName];
        $this->plans = json_decode($this->plans ? $this->plans : '{}', JSON_OBJECT_AS_ARRAY);
    }

    public function setPlans($plans){
        $this->plans = $plans;
        $_plans = json_encode($plans);
        query('UPDATE "user" set plans=? WHERE id=?',[$_plans, $this->id]);
    }

    public function getUsedPlans(){
        $p = fetchAll('select DISTINCT "planID", (select string_agg(c2."channelID"::text,\',\') as count from camera c2 
        where c2."planID"=c1."planID" and c2."userID"=c1."userID") as count from camera c1 where c1."userID"=? and c1."planID"<>\'\'',[$this->id]);
        $ret = [];
        foreach ($p as $v){
            $ret[$v['planID']] = explode(',', $v['count']);
        }        
        return $ret;
    }

    public function getPlanNameByPlanID($plan_id){
        foreach($this->plans as $p)
            if ($p['stripe_plan_id']==$plan_id)
                return $p['metadata']['name'] ? $p['metadata']['name'] : $p['metadata']['stripe_plan_description'];
        return '';
    }

    public function addPlanDefinitions() {
        $planCheck = MCore::$core->pdo->fetchOne('SELECT * from "plan" where "uid"=?', ["CR30"]);
        $planCheck_cust = MCore::$core->pdo->fetchOne('SELECT * from "plan" where "uid"=?', ["CUST"]);
        $planCheck_back = MCore::$core->pdo->fetchOne('SELECT * from "plan" where "uid"=?', ["BACK"]);


        if (!$planCheck) {
            // convert any existing plans to "LEGACY" plans
            $updateOldPlansQuery = 'UPDATE "plan" SET "desc"=\'LEGACY\'';
            MCore::$core->pdo->query($updateOldPlansQuery);

            MUser::createPlanDescription("30 Day Continuous Recording", "CR30", 1, '{"type":"camera","records_max_age":720,"meta_max_age":720,"memorycard_rec":false,"rec_mode":"on","object_detection":"off"}', 0);
            MUser::createPlanDescription("30 Day Event Recording", "ER30", 1, '{"type":"camera","records_max_age":720,"meta_max_age":720,"memorycard_rec":false,"rec_mode":"by_event","object_detection":"off"}', 0);
            MUser::createPlanDescription("30 day Continued Rec-AI by Timer", "CR30_BT", 1, '{"type":"camera","records_max_age":720,"meta_max_age":720,"memorycard_rec":false,"rec_mode":"on","object_detection":"continuous"}', 0);
            MUser::createPlanDescription("30 day Continued Rec-AI by Event", "CR30_BE", 1, '{"type":"camera","records_max_age":720,"meta_max_age":720,"memorycard_rec":false,"rec_mode":"on","object_detection":"by_event"}', 0);
            MUser::createPlanDescription("Custom Plan", "CUST", 1, '{"type":"camera","records_max_age":720,"meta_max_age":720,"memorycard_rec":false,"rec_mode":"on","object_detection":"off"}', 0);
            MUser::createPlanDescription("100 GB Plan", "BACK", 1, '{"type":"camera","storage_size":1000,"records_max_age":null,"meta_max_age":null,"memorycard_rec":false,"rec_mode":"off","object_detection":"off"}', 0);
            return true;
        } 
        
        if (!$planCheck_cust) {
            MUser::createPlanDescription("Custom Plan", "CUST", 1, '{"type":"camera","records_max_age":720,"meta_max_age":720,"memorycard_rec":false,"rec_mode":"on","object_detection":"off"}', 0);
        } 

        if (!$planCheck_back) {
            MUser::createPlanDescription("100 GB Plan", "BACK", 1, '{"type":"camera","storage_size":1000,"records_max_age":null,"meta_max_age":null,"memorycard_rec":false,"rec_mode":"off","object_detection":"off"}', 0);
        }

        return true;
    }

    public function createPlanDescription($name, $uid, $monthsAmount, $desc, $feeCents) {
        MCore::$core->pdo->query('INSERT into "plan" ("name", "uid", "monthsAmount", "desc", "feeCents") VALUES(?,?,?,?,?)',
        [$name, $uid, $monthsAmount, $desc, $feeCents]);
    }

    public function getPlanInfo($planId) {
        $ret = fetchRow('SELECT "desc" FROM "plan" WHERE "uid"=?', [$planId]);
        if ($ret) return json_decode($ret['desc']);
        else error(400, "Error getting plan information");
    } 

    public function getPlansForUser() {
        $ret = fetchRow('SELECT "plans" from "user" WHERE id=?', [$this->id]);
        if ($ret) return $ret['plans'];
        else error(400, "Error getting plans for this user");
    }

    public function updatePlanUsed($planid, $count) {
        $ret = fetchRow('SELECT "plans" from "user" WHERE id=?', [$this->id]);

        if($ret) {
            $plans = json_decode($ret['plans']);
            foreach($plans as $p) {
                if($p->id == $planid) {
                    $p->used = $p->used + $count;
                    break;
                }
            }
            $newPlans = json_encode($plans);
            $query = 'UPDATE "user" SET "plans"=\''.$newPlans.'\' WHERE "id"=\''.$this->id.'\'';
            MCore::$core->pdo->query($query);
            return true;
        } else {
            error(400, "Error getting plans for this user");
        }
    }

    public function setJsData($js) {
        $query = 'UPDATE "user" SET "js"=\''.$js.'\' WHERE "id"=\''.$this->id.'\'';
        MCore::$core->pdo->query($query);
        return;
    }

	public function getServerData(){
		$row = fetchRow('SELECT * from (
			SELECT 0 as id, s.key as "serverLkey",s.hostname as "serverHost",s.port as "serverPort" from "server" s 
			UNION(
			WITH RECURSIVE r AS (SELECT * FROM "user" WHERE id=? UNION SELECT u.* FROM "user" u JOIN r ON r."parentUserID"=u.id) 
			SELECT r.id, r."serverLkey", r."serverHost", r."serverPort" FROM r where r."serverLkey"!=\'\' order by r.id desc limit 1)
            ) a order by a."id" desc limit 1',[$this->id]);
            
		if ($row){
            unset($row['id']);
            if (!$row['serverHost'] && isset(MCore::$core->config['vxg_server'],MCore::$core->config['vxg_server']['lkey'],MCore::$core->config['vxg_server']['host'],MCore::$core->config['vxg_server']['port']))
                $row = ['serverLkey'=>MCore::$core->config['lkey'],'serverHost'=>MCore::$core->config['vxg_server']['host'],'serverPort'=>MCore::$core->config['vxg_server']['port']];
			return $row;
		}
		return false;
    }
    function checkServer() { 
        $server = $this->getServerData();
        if (!isset($server,$server['serverHost'])) {$this->updateAllCamsToken();$server = $this->getServerData();}
        $host = str_replace('http://','',str_replace('https://','',$server['serverHost']));
        $p = strpos($host,'/'); if ($p!==false) $host = substr($host,0,$p);
        $errno = $errstr = 0;
        $fP = fsockopen($host, $server['serverPort'], $errno, $errstr, 15); 
        if ($fP===false)
            error(556, 'No answer from server '. $host.':'.$server['serverPort'].($errstr?': '.$errstr:''));

        if (substr($server['serverHost'],0,7)=='http://' && isset($_SERVER['HTTPS']))
            error(556, 'Protocol mismatch: this request is over https, but the server needs an http schema');
    }
  

    public function getServersIdList(){
        if (isset(MCore::$core->config['vxg_server'])) return [];
        $server = $this->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed generateServicesURLs');

        $response_cloud = StreamLandAPI::getServerList();
        if (isset($response_cloud['errorDetail'])) 
            error(556, 'Failed to get servers list : '. $response_cloud['errorDetail']);
        $ret = [];
        foreach($response_cloud['objects'] as $s)
            if ($s['online'])
                $ret[]=$s['id'];
        return $ret;
    }

    /**
     * Generate host name for current user. For example dealer1.videoexpertsgroup.com if user
     * have 'dealer1' in dealer_prefix
     * 
     * @return string host name
     */
    public function getHostForUser(){
        $interface = $this->getInterfaceSettings();
        $host = $_SERVER['HTTP_HOST'];
        $prefix = isset($interface['dealer_prefix']) ? $interface['dealer_prefix'] : null;
        if (!$prefix || strpos($host,$prefix)!==false)
            return $host;
        // if host is IP address with port number and without dealer prefix
        if (preg_match('/^([\d]+\.[\d]+\.[\d]+\.[\d]+:[\d]+)$/i', $host))
            return $prefix.'.'.$host;
        // if host is IP address without port number and dealer prefix
        if (preg_match('/^([\d]+\.[\d]+\.[\d]+\.[\d]+)$/i', $host))
            return $prefix.'.'.$host;
        // if host is two levels address without port number
        if (preg_match('/^[^\.]+\.[^\.]+$/i', $host))
            return $prefix.'.'.$host;
        // if host is two levels address with port number
        if (preg_match('/^[^\.]+\.[^\.]+:[\d]+$/i', $host))
            return $prefix.'.'.$host;
        return $prefix.'.'.$host;
    }

     /**
     * Get array of parent for current user
     * 
     * @return boolean|array array of MUser or false
     */
    public function getAllParentUser(){
        $users = MCore::$core->pdo->fetchAll(
        'WITH RECURSIVE r AS (SELECT * FROM "user" WHERE id=? UNION SELECT u.* FROM "user" u JOIN r ON r."parentUserID"=u.id) 
        SELECT * FROM r',[$this->id]);
        if (!$users) return false;
        $ret = [];
        foreach($users as $v) 
            if (isset($v['id']))
                $ret[$v['id']] = new MUser($v);
        return $ret;
    }

    /**
     * Get array of child users for current user
     * 
     * @return array array of MUser
     */
    public function getAllChildUser($only_with_role='user'){
        $req = 'WITH RECURSIVE r AS (SELECT * FROM "user" WHERE id=? UNION SELECT u.* FROM "user" u JOIN r ON r."id"=u."parentUserID") SELECT * FROM r';
        if ($only_with_role) $req.= ' WHERE r."role"=\''.$only_with_role.'\'';
        $users = MCore::$core->pdo->fetchAll($req, [$this->id]);
        if (!$users) return [];
        $ret = [];
        foreach($users as $v) 
            if (isset($v['id']))
                $ret[$v['id']] = new MUser($v);
        return $ret;
    }

    /**
     * Get dealer for current user
     * 
     * @return boolean|MUser false, if dealer not exist
     */
    public function getDealer(){
        if (!$this->isUser()) return false;
        return MUser::getUserById($this->parentUserID);
    }

    /**
     * Get all dealers
     * 
     * @return boolean|array array of MUser or false
     */
    static function getAllDealers(){
        $users = MCore::$core->pdo->fetchAll('SELECT * FROM "user" WHERE role=\'partner\'');
        if (!$users) return false;
        $ret = [];
        foreach($users as $v) 
            if (isset($v['id']))
                $ret[$v['id']] = new MUser($v);
        return $ret;
    }

    /**
     * Get one or array of users
     * 
     * @param integer|array $id one or array of users id
     * @return boolean|MUser|array if $id is array, return array of MUser, else return one MUser object, or false
     */
    public static function getUsersById(...$id){
        if (!is_array($id)) return false;
        $ia = $id;
        if (is_array($ia[0])) $ia = $ia[0];
        $ids = '';
        foreach($ia as $v) 
            if ($v>0) $ids .= ($ids ? ',' : '') . (0+$v);
        if (!$ids) return false;
        $users = MCore::$core->pdo->fetchAll('SELECT * FROM "user" WHERE id in ('.$ids.')');
        foreach($users as $v) 
            if (is_array($v))
                $ret[$v['id']] = new MUser($v);
        if (!is_array($id[0]) && count($id)==1) return array_shift($ret);
        return $ret;
    }

    public function getDealerSecret(){
        if (!$this->isPartner()) return false;
        $skey = MCore::$core->pdo->fetchOne('SELECT secret_string FROM dealers_secrets WHERE dealerid=?', [$this->id]);
        if (!$skey || empty($skey)) {
            $skey = MUser::_gen_guid();
            MCore::$core->pdo->query('INSERT INTO "dealers_secrets"(dealerid, secret_string) VALUES(?,?)', [$this->id, $skey]);
        }
        return $skey;
    }

	protected static function _gen_guid() {
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

    /**
     * Get parent user for current user
     * 
     * @return boolean|MUser false, if user not found
     */ 
    public function getParentUser(){
        if (!isset($this->parentUserID) || !$this->parentUserID) return false;
        return MUser::getUserById($this->parentUserID);
    }

    /**
     * Generate new token string
     * 
     * @return string token string
     */
    protected static function _gen_new_token($for_user_id) {
        if ($for_user_id){
            $uuid = '00000000-0000-0000-0000-'.substr('000000000000' . $for_user_id, -12);
        } else {
            mt_srand((double)microtime()*10000);//optional for php 4.2.0 and up.
            $charid = strtoupper(md5(uniqid(rand(), true)));
            $hyphen = chr(45);// "-"
            $uuid = substr($charid, 0, 8).$hyphen.substr($charid, 8, 4).$hyphen.substr($charid,12, 4).$hyphen.substr($charid,16, 4).$hyphen.substr($charid,20,12);
        }
		return $uuid;	
    }    

    /**
     * Generate new token (when need) and update token
     * 
     * @param $generate_new_token if true, then generate new token
     * @return string token for current user
     */
    public function updateTokenExpires($generate_new_token=false){
        $this->tokenExpires = date("Y-m-d H:i:s", time() + 60*60*24);
        if ($generate_new_token)
            $this->token = MUser::_gen_new_token($this->id);
        MCore::$core->pdo->query('UPDATE "user" SET "token" = ?, "tokenExpires" = ?, "updated" = ? WHERE "id" = ?',
            [$this->token, $this->tokenExpires, date("Y-m-d H:i:s", time()), $this->id]);
        return $this->token;
    }

    /**
     * Get user by name and password. Generate new token and update token expired when success
     * 
     * @param string $username user name
     * @param string $password_sha3 password in sha3
     * @return boolean|MUser false, if user not found
     */ 
    public static function getUserByEmailAndSha3Password($username, $password_sha3){
        $r = MCore::$core->pdo->fetchRow('SELECT * FROM "user" WHERE (LOWER("name") = LOWER(?) OR LOWER("email") = LOWER(?)) AND "password_sha3" = ? limit 1',
            [$username, $username, $password_sha3]);
        if (!$r) return false;
        $user = new MUser($r);
        if (!$user->token || strtotime($r['tokenExpires'])<time())
            $user->updateTokenExpires(true);
        return $user;
    }

    /**
     * Get user by id
     * 
     * @param integer $id id of row from 'user' table
     * @return boolean|MUser false, if user not found
     */ 
    public static function getUserById($id){
        $r = MCore::$core->pdo->fetchRow('SELECT * FROM "user" WHERE id = ? order by id desc limit 1',[$id]);
        if (!$r) return false;
        return new MUser($r);
    }

    /**
     * Get user by token. Update token expires when called
     * 
     * @param string $token token string
     * @return boolean|MUser false, if user not found or token expired
     */ 
    public static function getUserByToken($token){
        $r = MCore::$core->pdo->fetchRow('SELECT * FROM "user" WHERE token = ? order by id desc limit 1',[$token]);
        if (!$r) return false;
        // check for token expired
        if (strtotime($r['tokenExpires']) - time()<=0) return false;
        $user = new MUser($r);
        $user->updateTokenExpires();
        return $user;
    }

    /**
     * Get user by email
     * 
     * @param string $email user e-mail
     * @return boolean|MUser false, if user not found
     */ 
    public static function checkEmailExistInFirebase($email){

        $a = dirname(dirname(dirname(__FILE__)));
        include_once($a.'/vendor/autoload.php');
        
        $fj = str_replace('<?php','',file_get_contents($a.'/conf.d/firebase.php'));
        $factory = (new Factory)->withServiceAccount($fj);
        $auth = $factory->createAuth();
        try {
            $user = $auth->getUserByEmail($email);
            if ($user) return true;
        } catch (Exception $e) {
        }
        return false;
    }

    public function updateFirebasePassword($newpassword){
        $a = dirname(dirname(dirname(__FILE__)));
        include_once($a.'/vendor/autoload.php');
        
        $fj = str_replace('<?php','',file_get_contents($a.'/conf.d/firebase.php'));
        $factory = (new Factory)->withServiceAccount($fj);
        $auth = $factory->createAuth();
        $user='';
        try {$user = $auth->getUserByEmail($this->email);} catch (Exception $e) {}
        if (!$user)
            return false;
        $auth->changeUserPassword($user->uid, $newpassword);
    }
    
    public static function getFirebaseSignInEmailLink($to_user_email, $dealer=false){

        $a = dirname(dirname(dirname(__FILE__)));
        include_once($a.'/vendor/autoload.php');

        
        $fj = str_replace('<?php','',file_get_contents($a.'/conf.d/firebase.php'));
        $factory = (new Factory)->withServiceAccount($fj);
        $auth = $factory->createAuth();
        $actionCodeSettings = [
            'continueUrl' => MCore::getProtocol().'://'.MCore::getDomain().MCore::getSubpath().'/email-confirmation/?user='.$to_user_email.(!$dealer?'':('&dealer='.$dealer->getDealerSecret())),
            'handleCodeInApp' => true
        ];

        try{
            return $auth->getSignInWithEmailLink($to_user_email, $actionCodeSettings);
        } catch (Exception $e) {
        }
        return false;
    }
    public function addServer($uuid){
        $owner_id = $this->getOwnerID();
        if (!$owner_id) return false;

        $data = json_encode(["uuid"=> $uuid, "owner"=> $owner_id], JSON_NUMERIC_CHECK);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->adminurl.'api/v6/admin/servers/');
//        curl_setopt($ch, CURLOPT_PORT , 9000);
        curl_setopt($ch, CURLOPT_SSLCERT, $this->certfilepath);
        curl_setopt($ch, CURLOPT_SSLCERTPASSWD, $this->certpass);
    //        curl_setopt($ch,CURLOPT_SSLCERTTYPE,"PEM");
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('accept: application/json','Content-Type: application/json','Content-Length: ' . strlen($data)));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, $this->verifyhost);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_VERBOSE, true);
        $result = curl_exec($ch);
        $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        fclose($this->certfile);
        if (!$result) {
            error(501,curl_error($ch));
            return false;
        }
        if (2 != (int)($httpcode/100)){
            $r = json_decode($result, JSON_OBJECT_AS_ARRAY);
            error(501,$r['errorDetail']);
            return $r;
        }
        $r = json_decode($result, JSON_OBJECT_AS_ARRAY);
        return $r;
    }
    
    public function removeServer($server_id){
        $owner_id = $this->getOwnerID();
        if (!$owner_id) return false;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->adminurl.'api/v6/admin/servers/'.$server_id.'/');
//        curl_setopt($ch, CURLOPT_PORT , 9000);
        curl_setopt($ch, CURLOPT_SSLCERT, $this->certfilepath);
        curl_setopt($ch, CURLOPT_SSLCERTPASSWD, $this->certpass);
    //        curl_setopt($ch,CURLOPT_SSLCERTTYPE,"PEM");
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('accept: application/json','Content-Type: application/json'));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, $this->verifyhost);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_VERBOSE, true);
        $result = curl_exec($ch);
        $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        fclose($this->certfile);

        if (2 != (int)($httpcode/100)){
            $r = json_decode($result, JSON_OBJECT_AS_ARRAY);
            error(501,$r['errorDetail']);
            return false;
        }
    }

    public function initSecrets(){
				
        if (isset($this->certfilepath)) return true;
        if (!isset(MCore::$core->config['admin_channel'])) 
        {
            error_log('No config for admin channel or key file');
            return false;
        }
        $a = dirname(dirname(dirname(__FILE__)));
        include_once($a.'/vendor/autoload.php');

        $aws_access_key_id = MCore::$core->config['admin_channel']['aws_access_key_id'];
        $aws_secret_access_key = MCore::$core->config['admin_channel']['aws_secret_access_key'];
        $admin_file_path = MCore::$core->config['admin_channel']['admin_file_path'];

        try {
        
			if (!empty($aws_access_key_id) && !empty($aws_secret_access_key))
			{			
				$credentials = new Aws\Credentials\Credentials($aws_access_key_id,$aws_secret_access_key);
				$region = isset(MCore::$core->config['admin_channel']['aws_region']) && MCore::$core->config['admin_channel']['aws_region'] ? MCore::$core->config['admin_channel']['aws_region'] : 'us-east-1';
				
				$client = new SecretsManagerClient([
					'region' => $region,
					'version' => '2017-10-17',
					'credentials' => $credentials
				]);
				
				$result = $client->getSecretValue(['SecretId' => 'admin_channel']);
                $admin_channel = json_decode($result['SecretString'],true);
			}
			else
			{
				if (empty($admin_file_path))
					$result = file_get_contents($a.'/conf.d/admin_channel.json');
				else
					$result = file_get_contents($admin_file_path.'/admin_channel.json');

				$admin_channel = json_decode($result,true);				
			}
            
            #$result = $client->getSecretValue(['SecretId' => 'admin_channel']);
            #$admin_channel = json_decode($result['SecretString'],true);
            if (!isset($admin_channel['certpass'])  
            || !isset($admin_channel['certcompany']) || !isset($admin_channel['cloudport'])
            || !isset($admin_channel['cloudhost']) || !isset($admin_channel['adminurl'])
            || !isset($admin_channel['maxcameras'])) return false;
			
			
            $this->certpass = $admin_channel['certpass'];
            $this->certkey = $admin_channel['certkey'];
            $this->certcompany = $admin_channel['certcompany'];
            $this->cloudport = $admin_channel['cloudport'];
            $this->cloudhost = $admin_channel['cloudhost'];
            $this->adminurl = $admin_channel['adminurl'];
            $this->maxcameras = $admin_channel['maxcameras'];
            $this->verifyhost = $admin_channel['dontverifyhost'] ? false : true;
            if (substr($this->cloudhost,0,8)!=='https://') $this->cloudhost = 'https://'.$this->cloudhost;
            if (substr($this->cloudhost,-1)!=='/') $this->cloudhost.= '/';
            if (substr($this->adminurl,-1)!=='/') $this->adminurl.= '/';
        } catch (AwsException $e) {
            error(501,'AWS '.$e->getAwsErrorCode());
        }
        
        $this->certfile = tmpfile();
		
        if ($this->certpass && $this->certkey) {
            fwrite($this->certfile, $this->certkey);    		
		} 
		else
		{
			if (empty($admin_file_path))
				$this->$result = file_get_contents($a.'/conf.d/admin_channel.pem');
			else
				$this->$result = file_get_contents($admin_file_path.'/admin_channel.pem');
            
			fwrite($this->certfile, $this->$result);
		}
		        
        $this->certfilepath = stream_get_meta_data($this->certfile);
        $this->certfilepath = $this->certfilepath['uri'];

        return true;
    }

    public function getOwnerID(){
        if (!$this->initSecrets()) return false;
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->adminurl.'api/v2/admin/users/?license_key='.$this->serverLkey);
//        curl_setopt($ch, CURLOPT_PORT , 9000);
        curl_setopt($ch, CURLOPT_SSLCERT, $this->certfilepath);
        curl_setopt($ch, CURLOPT_SSLCERTPASSWD, $this->certpass);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('accept: application/json'));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, $this->verifyhost);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_VERBOSE, true);
        $result = curl_exec($ch);
        if (!$result) {
            fclose($this->certfile);
            $err = curl_error($ch);
            error(501,$err);
            return false;
        }
        $r = json_decode($result, JSON_OBJECT_AS_ARRAY);
        if (!isset($r['objects'])||!isset($r['objects'][0])||!isset($r['objects'][0]['id'])) 
            return false;
        return 0+ $r['objects'][0]['id'];
    }    

    public function getLicenseKey($email){
        if (!$this->initSecrets()) return false;
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->adminurl.'api/v2/admin/users/?suid='.$email);
//        curl_setopt($ch, CURLOPT_PORT , 9000);
        curl_setopt($ch, CURLOPT_SSLCERT, $this->certfilepath);
        curl_setopt($ch, CURLOPT_SSLCERTPASSWD, $this->certpass);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('accept: application/json'));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, $this->verifyhost);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_VERBOSE, true);
        $result = curl_exec($ch);
        if (!$result) {
            fclose($this->certfile);
            $err = curl_error($ch);
            error(501,$err);
            return false;
        }
        $r = json_decode($result, JSON_OBJECT_AS_ARRAY);
        if (!isset($r['objects'])||!isset($r['objects'][0])||!isset($r['objects'][0]['license_key'])||!isset($r['objects'][0]['license_key']['value'])) 
            return false;
        $ret = $r['objects'][0]['license_key']['value'];        
        return $ret;
    }
    public function createLicenseKey(){

        $lkey = ["value"=> "co.".bin2hex(random_bytes(10))];
        $data = json_encode(["suid"=> $this->email, "usrc"=> $this->certcompany, "license_key"=> $lkey, 
            "limits"=> ["hosted_cameras"=> 0+$this->maxcameras]], JSON_NUMERIC_CHECK);

        if (!$this->initSecrets()) return false;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->adminurl.'api/v2/admin/users/');
//        curl_setopt($ch, CURLOPT_PORT , 9000);
        curl_setopt($ch, CURLOPT_SSLCERT, $this->certfilepath);
        curl_setopt($ch, CURLOPT_SSLCERTPASSWD, $this->certpass);
    //        curl_setopt($ch,CURLOPT_SSLCERTTYPE,"PEM");
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('accept: application/json','Content-Type: application/json','Content-Length: ' . strlen($data)));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, $this->verifyhost);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_VERBOSE, true);
        $result = curl_exec($ch);
        if (!$result) {
            error(501,curl_error($ch));
            return false;
        }
        $r = json_decode($result, JSON_OBJECT_AS_ARRAY);
        if (!isset($r['license_key'])) {
            if (strpos($result,'400 The SSL certificate error')!==false)
                error(501,'Invalid SSL sertificate for admin channel');
            else
                error(501,$result);
            return false;
        }
        return $r['license_key']['value'];
    }

    public function removePendingUser($id) {
        query('DELETE FROM "user" WHERE id = ? AND "role" = ?',[$id, "pending"]);
    }
    
    /**
     * Update license key for partner role. Get or create all cams token
     * 
     */ 
    public function updateLicenseKey(){
        if (!$this->isPartner()) return;

        $key='';
       
        if (isset(MCore::$core->config['vxg_server'],MCore::$core->config['vxg_server']['lkey'],MCore::$core->config['vxg_server']['host'],MCore::$core->config['vxg_server']['port'])){
            $key = MCore::$core->config['vxg_server']['lkey'];
            $host = MCore::$core->config['vxg_server']['host'];
            $port = MCore::$core->config['vxg_server']['port'];
        } 
        
        while (!$key){
            $key = MUser::getLicenseKey($this->email);
            if (!$key)
                $key = MUser::createLicenseKey($this->email);
            if (!$key) break;
            $host = $this->cloudhost;
            $port = 0+$this->cloudport;
            break;
        }
        
        if (!$key) {
            $url = MCore::$core->config['vxg_dashboard']['host'];
            if (!$url) $url = 'http://10.20.16.128:10001/';
            $host = MCore::$core->config['vxg_service']['host'];
            $port = MCore::$core->config['vxg_service']['port'];
            if (!$host || !$port) 
                error(501,'No settings for vxg service host and port');

            $ch=curl_init();
            curl_setopt_array($ch, [CURLOPT_SSL_VERIFYPEER => false,CURLOPT_SSL_VERIFYHOST => false,CURLOPT_URL=>$url.'api/v1/users/login_firebase/', 
                CURLOPT_CUSTOMREQUEST => 'POST', CURLOPT_RETURNTRANSFER => '1', CURLOPT_HTTPHEADER => ['Authorization: FB '.$this->firebase_token]]);
            $result = json_decode(curl_exec($ch),TRUE);
            $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($httpcode!=200 || isset($result['errorDetail']))
                error(501,'Fail login into dashboard : '.$result['errorDetail']);

            $ch=curl_init();
            curl_setopt_array($ch, [CURLOPT_SSL_VERIFYPEER => false,CURLOPT_SSL_VERIFYHOST => false,CURLOPT_URL=>$url.'admin/api/v1/users/licenses/', 
                CURLOPT_CUSTOMREQUEST => 'POST', CURLOPT_RETURNTRANSFER => '1', CURLOPT_HTTPHEADER => ['Authorization: FB '.$this->firebase_token]]);
            $result = json_decode(curl_exec($ch),TRUE);
            $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($httpcode!=200 || isset($result['errorDetail']))
                error(501,'Fail login into dashboard : '.$result['errorDetail']);

            if (!$result || !isset($result['data']) || !isset($result['data']['vxgcloudvideokey']))
                error(501,'Invalid responce from dashboard - no license key');
            $key = ''.$result['data']['vxgcloudvideokey']['0']['license_key'];

        }
        MCore::$core->pdo->query('UPDATE "user" set "serverLkey"=?, "serverHost"=?, "serverPort"=? where "id" = ?',[$key,$host,$port,$this->id]);
        $this->serverLkey = $key;
        $this->serverHost = $host;
        $this->serverPort = $port;
    }

    public function deleteUser(){
        if ($this->allCamsTokenID){
            include_once(dirname(dirname(dirname(__FILE__))).'/streamland_api.php');
            $server = $this->getServerData();
            if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
                error(555, 'Failed delete. reason: generateServicesURLs');
            StreamLandAPI::deleteGroupToken($this->allCamsTokenID);
        }
        query('DELETE FROM "user" WHERE id = ?',[$this->id]);
    }

    public function getUserCamerasCount(){
        if ($this->isPartner())
            return fetchOne('SELECT count(*) AS "amountCameras" FROM "camera" WHERE "userID"=?',[$this->id]);
        return fetchOne('SELECT count(*) AS "amountCameras" FROM "userCamera" WHERE "userID"=?',[$this->id]);
    }

    public function getNonStorageCameraCount() {
        if ($this->isPartner())
            return fetchOne('SELECT count(*) AS "amountCameras" FROM "camera" WHERE "userID"=? AND "name" NOT LIKE ?',[$this->id, '%#StorageFor%']);
        return fetchOne('SELECT count(*) AS "amountCameras" FROM "userCamera" WHERE "userID"=? ',[$this->id]);
    }

    public function getNonLocationCamerasCount() {
        return fetchOne('SELECT count(*) AS "amountCameras" FROM "userCamera" WHERE "userID"=? AND "cameraCHID" IS NOT NULL ',[$this->id]);
    }

    public function setTotalCamerasWithLocations($totalCams) {
        MCore::$core->pdo->query('UPDATE "user" SET "totalCameras" = ? WHERE "id" = ?',
            [$totalCams, $this->id]);
    }

    public function getAllUserLocations() {
        $locs = fetchAll('SELECT "location" FROM "userCamera" WHERE "userID"=? AND "cameraCHID" IS NULL', [$this->id]);
        $userLocs = [];
        foreach($locs as $l) {
            array_push($userLocs, $l['location']);
        }
        return $userLocs;
    }

    public function getStorageCameraIds() {
        $ret = [];
        if ($this->isPartner())
            $camIds = fetchAll('SELECT "channelID" FROM "camera" WHERE "userID"=? AND "name" LIKE ?',[$this->id, '%#StorageFor%']);
        else
            $camIds = fetchAll('SELECT "channelID" FROM "camera" WHERE "userID"=? AND "name" LIKE ?',[$this->id, '%#StorageFor%']);
        
        foreach($camIds as $c) {
            array_push($ret, $c['channelID']);
        }

        return $ret;
    }

    public static function deleteFirebaseUser($email){
        $a = dirname(dirname(dirname(__FILE__)));
        include_once($a.'/vendor/autoload.php');
        $fj = str_replace('<?php','',file_get_contents($a.'/conf.d/firebase.php'));
        $factory = (new Factory)->withServiceAccount($fj);
        $auth = $factory->createAuth();

        try {
            $user = $auth->getUserByEmail($email);
        } catch (Exception $e) {
            return false;
        }
        $auth->deleteUser($user->uid);
    }

    public static function getFirebaseUserToken($email, $pass){
        $a = dirname(dirname(dirname(__FILE__)));
        include_once($a.'/vendor/autoload.php');
        $fj = str_replace('<?php','',file_get_contents($a.'/conf.d/firebase.php'));
        $factory = (new Factory)->withServiceAccount($fj);
        $auth = $factory->createAuth();

        $customToken = $auth->signInWithEmailAndPassword($email, $pass);
        return $customToken->idToken();
    }

    public static function createFirebaseUser($email, $username='', $password='', $email_verified=false){
        $a = dirname(dirname(dirname(__FILE__)));
        include_once($a.'/vendor/autoload.php');
        $fj = str_replace('<?php','',file_get_contents($a.'/conf.d/firebase.php'));
        $factory = (new Factory)->withServiceAccount($fj);
        $auth = $factory->createAuth();

        $userProperties = [
            'email' => $email,
            'emailVerified' => $email_verified,
            'displayName' => $username ? $username : $email,
            'disabled' => false
        ];
        if ($password) $userProperties['password'] = $password;
        
        $createdUser = null;
        try {
            $createdUser = $auth->createUser($userProperties);
        } catch (Exception $e) {
            $msg = $e->getMessage();
            if ($msg != "The email address is already in use by another account.") 
                error(400,$e->getMessage());
        }
        return $createdUser;
    }

    public static function verifyFirebaseUser($uid){
        $a = dirname(dirname(dirname(__FILE__)));
        include_once($a.'/vendor/autoload.php');
        $fj = str_replace('<?php','',file_get_contents($a.'/conf.d/firebase.php'));
        $factory = (new Factory)->withServiceAccount($fj);
        $auth = $factory->createAuth();

        $userProperties = [
            'emailVerified' => true
        ];
        
        $user = null;
        try {
            $user = $auth->updateUser($uid, $userProperties);
        } catch (Exception $e) {
            $msg = $e->getMessage();
            error(400,$e->getMessage());
        }
        return $user;
    }	


    /**
     * Calls relevant get user method based on auth identity
     * Auth config retrieved from /conf.d/auth.php
     * 
     * @param string $token token string
     * @return boolean|MUser false, if user not found or token expired
     */ 
    public static function getUserByAuthToken($token){
        $a = dirname(dirname(dirname(__FILE__)));
        include_once($a.'/vendor/autoload.php');

        // checks if firebase.php config file exists first
        if (file_exists($a . '/conf.d/firebase.php')) {
            $fj = str_replace('<?php','',file_get_contents($a.'/conf.d/firebase.php'));
            return MUser::getUserByFirebaseToken($token, $fj);
        }

        $authString = str_replace('<?php','',file_get_contents($a.'/conf.d/auth.php'));
        $auth = json_decode($authString);
    
        $getUserFromAuthMethodName = 'getUserBy' . ucfirst($auth->identity) . 'Token';
        $arguments = array($token, json_encode($auth->config));

        return call_user_func_array(array('MUser', $getUserFromAuthMethodName), $arguments);
    }

    /**
     * Get user by keycloak token. Create user, if no exist
     * 
     * @param string $token token string
     * @param object $kc auth config
     * @return boolean|MUser false, if user not found or token expired
     */ 
    public static function getUserByKeycloakToken($token, $kcString) {
        $kc = json_decode($kcString);

        $ch = curl_init();
        $url = $kc->url . 'realms/' . $kc->realm . '/protocol/openid-connect/userinfo';
        $authorizationToken = 'Bearer ' . $token;
        $clientId = $kc->clientId;
        
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Authorization: ' . $authorizationToken));

        // Disable SSL verification for dev
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        
        $verify = curl_exec($ch);

        if (curl_errno($ch)) {
            echo 'cURL error: ' . curl_error($ch);
        }
        
        if ($verify === false) {
            return false;
        }
        curl_close($ch);
        $keycloak_user = json_decode($verify);




        
        // $uid = $keycloak_user->sub;
        // $default_aclrole = MUser::get_default_aclrole_id();
        // $aclrole_id = isset($keycloak_user->resource_access->$clientId->roles[0]) ? MUser::get_aclrole_id_by_keycloak($keycloak_user->resource_access->$clientId->roles[0]) : $default_aclrole;
        // $skins = [];
        // foreach($skin_records as $item) { $skins[] = $item['file']; }
        // $dom_records = MCore::$core->pdo->fetchAll('SELECT d.key_word, d.display_value FROM doms d JOIN aclrole_dom ars ON d.id = ars.dom_id WHERE ars.aclrole_id = ' . $aclrole_id);
        // $doms = [];
        // foreach($dom_records as $item) { $doms[] = [$item['key_word'] => $item['display_value']]; }




        // uncomment after - commented out for testing
        // if (!$keycloak_user->email) return false;
        // if (!$keycloak_user->email_verified) error(401, 'Email is not verified');

        $r = MCore::$core->pdo->fetchRow('SELECT * FROM "user" WHERE "email" = ? order by id desc limit 1',[$keycloak_user->email]);
        if ($r) {
            // MCore::$core->pdo->query('UPDATE "user" set "aclrole_id"=? where "id" = ?',[$aclrole_id, $r['id']]);
            $user = new MUser($r);
        } else {
            $distr=MUser::getDefaultDistributor();
            if (!$distr) return false;
            $user = $distr->createUser($keycloak_user->email);
        }
        // $ar = MCore::$core->pdo->fetchRow('SELECT name FROM "aclroles" WHERE "id" = ? order by id desc limit 1', [$aclrole_id]);
        // $user->aclrole = $ar ? $ar['name'] : "";
        // $user->aclrole_id = $aclrole_id;
        // $user->skins = $skins;
        $user->doms = $doms;
        $user->keycloak_user = $keycloak_user;
        $user->keycloak_token = $token;

        return $user;
    }



    /**
     * Get user by firebase token. Create user, if no exist
     * 
     * @param string $token token string
     * @param object $fj auth config
     * @return boolean|MUser false, if user not found or token expired
     */ 
    public static function getUserByFirebaseToken($token, $fj){
        // return $fj;
        // $a = dirname(dirname(dirname(__FILE__)));
        // include_once($a.'/vendor/autoload.php');
        // $fj = str_replace('<?php','',file_get_contents($a.'/conf.d/firebase.php'));
        $factory = (new Factory)->withServiceAccount($fj);
        $auth = $factory->createAuth();


        try {
            $verify = $auth->verifyIdToken($token);
        } catch (Exception $e) {
            return false;
        }
        $uid = $verify->getClaim('sub');
        $firebase_user = $auth->getUser($uid);
        if (!$firebase_user->email) return false;
// TODO: check email verification
        if (isset(MCore::$core->config->no_check_mail_auth) &&
         MCore::$core->config['no_check_mail_auth']!==true && !$firebase_user->emailVerified )            
            error(401, 'Email is not verified');

// Либо читаем существующего пользователя, либо создаем пользователя с ролью "partner"
        $r = MCore::$core->pdo->fetchRow('SELECT * FROM "user" WHERE "email" = ? order by id desc limit 1',[$firebase_user->email]);
        if ($r && $r['role'] != "pending") 
            $user = new MUser($r);
        else {
            if ($r && $r['role'] == "pending") MUser::removePendingUser($r['id']);
            $distr=MUser::getDefaultDistributor();
            if (!$distr) return false;
            $user = $distr->createUser($firebase_user->email);
        }
//        MCore::$core->pdo->query('UPDATE "user" set "token"=? where "id" = ?',[$token,$user->id]);
        $user->firebase_user = $firebase_user;
        $user->firebase_token = $token;
        $vp = strpos($user->desc, 'Email is not confirmed yet');
        if ($vp!==false){
            $d = substr($user->desc,0,40);
            MCore::$core->pdo->query('UPDATE "user" set "desc"=? where "id" = ?',[$d,$user->id]);
            $user->desc = $d;
        }
        // check for token expired
//        if (strtotime($r['tokenExpires']) - time()<=0) return false;
//        $user->updateTokenExpires();
        return $user;
    }

    public function setMetadata($metadata){
        MCore::$core->pdo->query('UPDATE "user" set "metaData"=? where "id" = ?',[$metadata,$this->id]);
        $this->metaData = $metadata;
    }

    /**
     * Get user by email
     * 
     * @param string $email user e-mail
     * @return boolean|MUser false, if user not found
     */ 
    public static function getUserByEmail($email){
        $r = MCore::$core->pdo->fetchAll('SELECT * FROM "user" WHERE LOWER("email")=LOWER(?) limit 1',[$email]);
        if (!$r || !$r[0]) return false;
        return new MUser($r[0]);
    }

    /**
     * Create new user with parent user as this user
     * 
     * @param string $email user e-mail
     * @param string $customer customer
     * @param string $address address
     * @param string $accountManager account manager
     * @param string $accountNumber account number
     * @return boolean|MUser false, if user not found
     */ 
    public function createUser($email,$customer='',$password_sha3='', $address=''){
        $invite_roles = array(
            "superadmin" => "channel",
            "channel" => "theater",
            "theater" => "distrib",
            "distrib" => "partner",
            "partner" => "user",
            "user" => "subuser"
        );
        if (!$customer) $customer = $email;
        $desc = '';
        // do not save firebase password
        $password_sha3 = '';
        
        $created_user_id = query(
            'INSERT INTO "user" ("role", "parentUserID", "name", "email", "address", "password_sha3", "desc","token") VALUES(?,?,?,?,?,?,?,?)', 
            [$invite_roles[$this->role],$this->id,$customer,$email,$address,$password_sha3,$desc,'']);
        $user = MUser::getUserById($created_user_id);
        $user->updateTokenExpires(true);
        return $user;
    }

    public function updateUser($address, $desc, $phone, $username, $password, $sheduler){
        $args='';$vars=[];
        if ($address!==null){
            $args.=($args?',':'').'"address"=?';
            $vars[]=$address;
            $this->address = $address;
        }
        if ($username!==null){
            $args.=($args?',':'').'"name"=?';
            $vars[]=$username;
            $this->name = $username;
        }
        if ($desc!==null){
            $args.=($args?',':'').'"desc"=?';
            $vars[]=$desc;
            $this->desc = $desc;
        }
        if ($phone!==null){
            $args.=($args?',':'').'"phone"=?';
            $vars[]=$phone;
            $this->phone = $phone;
        }
        if ($phone!==null){
            $args.=($args?',':'').'"sheduler"=?';
            $vars[]=$sheduler;
            $this->sheduler = $sheduler;
        }
        if (!$vars) return;
        $vars[] = $this->id;
        query('UPDATE "user" SET '.$args.' WHERE id=?',$vars);
        if ($password!==null)
            $this->updateFirebasePassword($password);
    }    
    
    public function createPendingUser($email) {
        $tempUser = query(
            'INSERT INTO "user" ("role", "parentUserID", "name", "email", "address", "password_sha3", "desc","token") VALUES(?,?,?,?,?,?,?,?)', 
            ["pending",-1,$email,$email,"","","pending",'']);
        return $tempUser;
    }
    /**
     * Get default dealer
     * 
     * @return boolean|MUser false, if user not found
     */ 
    public static function getDefaultDistributor(){
        $r = MCore::$core->pdo->fetchRow('select * from "user" where "role" =\'distrib\' order by "id" asc limit 1');
        if (!$r) return false;
        return new MUser($r);
    }

    /**
     * Get default dealer
     * 
     * @return boolean|MUser false, if user not found
     */ 
    public static function getDefaultDealer(){
        $r = MCore::$core->pdo->fetchRow('select * from "user" where "role" =\'partner\' order by "id" asc limit 1');
        if (!$r) return false;
        return new MUser($r);
    }

    /**
     * Get default dealer
     * 
     * @return boolean|MUser false, if user not found
     */ 
    public static function getDealerBySecret($secret_string){
        $r = MCore::$core->pdo->fetchRow('select * from "user" where id=(select "dealerid" from "dealers_secrets" where "secret_string"=?) order by "id" asc limit 1',[$secret_string]);
        if (!$r) return false;
        return new MUser($r);
    }

    /**
     * Check if current user have role 'user', or generate error
     */
    public static function checkOnlyForUsers(){
        if (MCore::$core->current_user && MCore::$core->current_user->isUser()) return;
        MCore::$core->error(403, "Currently only for 'user' role",0);
    }

    /**
     * Check if current user have role 'superadmin'
     * 
     * @return boolean true, if current user have role 'superadmin'
     */
    public function isSuperAdmin() {
        return isset($this->role) && $this->role=='superadmin';
    }

    /**
     * Check if current user have role 'channel'
     * 
     * @return boolean true, if current user have role 'channel'
     */
    public function isChannel() {
        return isset($this->role) && $this->role=='channel';
    }
    
    /**
     * Check if current user have role 'theater'
     * 
     * @return boolean true, if current user have role 'theater'
     */
    public function isTheater() {
        return isset($this->role) && $this->role=='theater';
    }

    /**
     * Check if current user have role 'partner' (equals to dealer)
     * 
     * @return boolean true, if current user have role 'partner'
     */
    public function isPartner() {
        return isset($this->role) && $this->role=='partner';
    }

    /**
     * Check if current user have role 'partner' (equals to dealer)
     * 
     * @return boolean true, if current user have role 'partner'
     */
    public function isDealer() {
        return isset($this->role) && $this->role=='partner';
    }

    /**
     * Check if current user have role 'distributor'
     * 
     * @return boolean true, if current user have role 'distributor'
     */
    public function isDistributor() {
        return isset($this->role) && $this->role=='distrib';
    }

    /**
     * Check if current user have role 'user'
     * 
     * @return boolean true, if current user have role 'user'
     */
    public function isUser() {
        return isset($this->role) && $this->role=='user';
    }
    
    /**
     * Check if current user have role 'subuser'
     * 
     * @return boolean true, if current user have role 'subuser'
     */
    public function isSubuser() {
        return isset($this->role) && $this->role=='subuser';
    }

    public function isPending() {
        return isset($this->role) && $this->role=='pending';
    }

    public function addLocationToAllCamsTokenMeta($location){
//        $location = str_replace(" ", "_", $location);
        $meta = $this->getAllCamsTokenMeta();
        if (isset($meta['L+'.md5($location)])) {
            $p = strpos($meta['L+'.md5($location)],',');
            $count = intval(substr($meta['L+'.md5($location)],0,$p));
            $count ++;
            $meta['L+'.md5($location)] = ''.$count.','.$location;
        } else
            $meta['L+'.md5($location)] = '1,'.$location;
        $this->setAllCamsTokenMeta($meta);
    }

    public function removeLocationFromAllCamsTokenMeta($location){
        $location = str_replace(" ", "_", $location);
        $meta = $this->getAllCamsTokenMeta();
        if (isset($meta['L+'.md5($location)])) {
            $p = strpos($meta['L+'.md5($location)],',');
            $count = intval(substr($meta['L+'.md5($location)],0,$p));
            $count --;
            if (!$count)
                unset($meta['L+'.md5($location)]);
            else
                $meta['L+'.md5($location)] = ''.$count.','.$location;
        } 
        $this->setAllCamsTokenMeta($meta);
    }

    public function removeAllLocationFromAllCamsTokenMeta(){
        $meta = $this->getAllCamsTokenMeta();
        $f=0;
        foreach($meta as $i=>$v)
            if (substr($i,0,2)=='L+'){
                unset($meta[$i]);
                $f=1;
            }
        if ($f)
            $this->setAllCamsTokenMeta($meta);
    }

    public function getAllCamsTokenMeta(){
        if (!$this->allCamsTokenID) $this->updateAllCamsToken();
        $server = $this->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed creating camera channel. reason: generateServicesURLs');
        $l = StreamLandAPI::getAllCamsToken($this->allCamsTokenID);
        return isset($l['meta']) ? $l['meta'] : [];
    }

    public function setAllCamsTokenMeta($meta){
        if (!$this->allCamsTokenID) $this->updateAllCamsToken();
        $server = $this->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed creating camera channel. reason: generateServicesURLs');
        if (!$meta) $meta=(object)[];
        $response_cloud = StreamLandAPI::updateAllCamsToken($this->allCamsTokenID, ['meta' => $meta]);
    }

    /**
     * Update all cams token for this admin
     */
    public function updateAdminAllCamsToken(){
        include_once(dirname(dirname(dirname(__FILE__))).'/streamland_api.php');

        if (!$this->isPartner()) return;
        $server = $this->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed creating camera channel. reason: generateServicesURLs');

        $this->allCamsToken='';
        $this->allCamsTokenID=0;
        $l = StreamLandAPI::getGroupTokensList();

        // Retreive all cams group token from cloud server
        if (is_array($l['objects'])) foreach($l['objects'] as $tk){
            if ($tk['name'] != "AllCamsAdmin#".$this->id) continue;
            $this->allCamsToken = $tk['token'];
            $this->allCamsTokenID = $tk['id'];
            if (strpos($tk['channels_access'],'all')===false)
                $response_cloud = StreamLandAPI::UpdateGroupToken($this->allCamsTokenID, ['channels_access' => "all", 'include_all_channels'=>true,'max_channels_amount'=>100]);
            break;    
        }

        if (!$this->allCamsTokenID){
            $data = [
                'expire' => "2099-12-31T00:00:00", // 10 years
                'name' => "AllCamsAdmin#" . $this->id,
                'channels_access' => "all",
                'include_all_channels'=>true
            ];
            $response_cloud = StreamLandAPI::createAllCamsToken($data);
            if (isset($response_cloud['status']))
                error(500, $response_cloud['errorDetail']);
            $this->allCamsToken = $response_cloud['token'];
            $this->allCamsTokenID = $response_cloud['id'];
        }

        if (isset(MCore::$core->config['vxg_server'],MCore::$core->config['vxg_server']['lkey'],MCore::$core->config['vxg_server']['host'],MCore::$core->config['vxg_server']['port'])){
            $cams = fetchAll('SELECT "channelID" FROM "camera" WHERE "userID"=?',[$this->id]);
            $camarr = [];
            if ($cams) foreach($cams as $c)
                $camarr[] = $c['channelID'];
            $response_cloud = StreamLandAPI::UpdateGroupToken($this->allCamsTokenID, ['channels' => $camarr]);
        }

        MCore::$core->pdo->query('UPDATE "user" set "allCamsToken"=?, "allCamsTokenID"=? WHERE id=?',[$this->allCamsToken, $this->allCamsTokenID, $this->id]);
    }

    /**
     * Update all cams token (allCamsToken field in user table) for this user
     * cameras from db
     */
    public function updateAllCamsToken(){
        if ($this->isPartner()) {   
            $this->updateAdminAllCamsToken();
            return;
        }
        $channels = MCore::$core->pdo->fetchAll('SELECT "cameraCHID", "location" from "userCamera" u where u."userID"=?', [$this->id]);
        $channel_ids = []; $locations = [];
        if (is_array($channels)) {
            foreach($channels as $ch) {
                if ($ch['cameraCHID'])
                    $channel_ids[] = $ch['cameraCHID'];
                if ($ch['location'] != "")
                    $locations[] = $ch['location'];
            }
        }

        $server = $this->getServerData();
        include_once(dirname(dirname(dirname(__FILE__))).'/streamland_api.php');
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed creating camera channel. reason: generateServicesURLs');
/*
        $ret = StreamLandAPI::getCamerasListV2();
        if (isset($ret['status']) && $ret['status']==500)
            error(500, $ret['errorDetail']);
        foreach($ret['objects'] as $o)
            if (!in_array($o['id'],$channel_ids))
                $channel_ids[] = $o['id'];
*/
        foreach($locations as $location) {
            $locArr = explode(":", $location);
            $cameras = StreamLandAPI::getCamerasList($locArr[count($locArr) - 1]);
            foreach($cameras['objects'] as $cam) {
                $inCurrentLoc = true;
                foreach($locArr as $loc) {
                    if (!isset($cam['meta'][$loc])) $inCurrentLoc = false;
                }
                if ($inCurrentLoc) $channel_ids[] = $cam['id'];
            }
        }

        $channel_ids_unique = array_unique($channel_ids, SORT_REGULAR);

        $response_cloud = ['token'=>'', 'id'=>0];
        if (!$this->allCamsTokenID){
            $data = [
                'channels' => $channel_ids_unique,
                'expire' => "2099-12-31T00:00:00", // 10 years
                'name' => "AllCamsUser#" . $this->id,
                'channels_access' => "all"
            ];
            $response_cloud = StreamLandAPI::createAllCamsToken($data);
        }
        if (isset($response_cloud['status']) && $response_cloud['status']==500)
            error(500, $response_cloud['errorDetail']);

        if ($this->allCamsTokenID)
            $response_cloud = StreamLandAPI::updateAllCamsToken($this->allCamsTokenID, ['channels' => $channel_ids_unique, 'channels_access' => "all",'max_channels_amount'=>100]);
        if (!$response_cloud['token']) $response_cloud['token'] = $this->allCamsToken ? $this->allCamsToken : '';
        if (!$response_cloud['id']) $response_cloud['id'] = $this->allCamsTokenID ? $this->allCamsTokenID : '';
 
        $token_changed = $response_cloud['token']!=$this->allCamsToken;
        $this->allCamsToken = $response_cloud['token'];
        $this->allCamsTokenID = $response_cloud['id'];
        MCore::$core->pdo->query('UPDATE "user" set "allCamsToken"=?, "allCamsTokenID"=? WHERE id=?',[$response_cloud['token'], $response_cloud['id'], $this->id]);
        return $token_changed;
    }

    public function getCamerasForUser() {
        $server = $this->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed creating camera channel. reason: generateServicesURLs');

        $ret = StreamLandAPI::getCamerasList();
        if (isset($response_cloud['errorDetail']))
            error(500, $response_cloud['errorDetail']);

        return $ret['objects'];
    }

    public function syncWithCamerasOnServer(){
        $server = $this->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed creating camera channel. reason: generateServicesURLs');
        $ec = fetchAll('select "channelID" from camera where "userID"=?',[$this->id]);
        if (!$ec) $ec=[];
        $camids = [];
        foreach($ec as $e)
            $camids[] = $e['channelID'];
        
        $ret = StreamLandAPI::getCamerasList();
        if (isset($response_cloud['errorDetail']))
            error(500, $response_cloud['errorDetail']);
        $need_update_shared_token = false;
        foreach($ret['objects'] as $o){
            if (in_array($o['id'], $camids)) continue;
            $need_update_shared_token = true;
            $isRecording = $o['rec_mode']=='on' ? 'TRUE' : 'FALSE';
            query('INSERT INTO camera '.
                     '("userID","deviceID","serverID","channelID",name,location,type,url,username,password,tz,"rwToken","roToken","isRecording",lat,lon,"onvifRtspPort")'.
                     " VALUES(?,'fromWebUI',1,?,?,?,?,?,?,?,?,?,?,$isRecording,?,?,?)",
                    [$this->id, $o['id'], $o['name'],'', -1, isset($o['source']['url'])?$o['source']['url']:'',
                    isset($o['source']['login'])?$o['source']['login']:'',isset($o['source']['password'])?$o['source']['password']:'',
                    $o['timezone'],$o['access_tokens']['all'],$o['access_tokens']['watch'],0,0,isset($o['source']['onvif_rtsp_port_fwd'])?0+$o['source']['onvif_rtsp_port_fwd']:0]);
        }
        if ($need_update_shared_token)
            $this->updateAllCamsToken();
    }

    public function getAIChannelGroupToken($type = null, $channel_id = null, $forCam = false) {
        $server = $this->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed creating camera channel. reason: generateServicesURLs');

        $params = ['ai_targeted' => 'true', 'meta'=> 'ai_period,ai_type', 'include_meta' => 'true'];

        $aiTargetedTokens = StreamLandAPI::getGroupTokensList($params);

        foreach($aiTargetedTokens['objects'] as $gt) {
            $ai_params = json_decode($gt['meta']['ai_params']);
            $ai_filter = $ai_params->{'filter'};

            if ($forCam) {
                if(in_array($channel_id, $gt['channels'])) {
                    return $gt;
                }
            } else {
                if ($type == 'continuous') {
                    if($ai_filter == 'recording_thumbnail' && $gt['meta']['ai_type'] == "object_and_scene_detection") {
                        return $gt;
                    }
                } else if ($type == 'by_event') {
                    if($ai_filter == 'undefined' && $gt['meta']['ai_type'] == "object_and_scene_detection") {
                        return $gt;
                    }
                } else if ($type == 'off') {
                    if(in_array($channel_id, $gt['channels'])) {
                        return $gt;
                    }
                }
            }
        }

        return null;
    }

    public function getAllAIGroupTokens() {
        $server = $this->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed creating camera channel. reason: generateServicesURLs');

        $params = ['ai_targeted' => 'true', 'meta'=> 'ai_period,ai_type', 'include_meta' => 'true'];

        $aiTargetedTokens = StreamLandAPI::getGroupTokensList($params);
        if (!$aiTargetedTokens) error(500, "Error getting channel group tokens");
        return $aiTargetedTokens['objects'];
    }

    public function getListOfAIEnabledCameras($channel_ids) {
        $server = $this->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed creating camera channel. reason: generateServicesURLs');
        
        $aiTargetedTokens = StreamLandAPI::getGroupTokensList(['ai_targeted' => 'true']);

        $aiEnabledCameraIds = [];
        foreach($channel_ids as $c_id) {
            foreach($aiTargetedTokens['objects'] as $aiToken) {
                if (in_array($c_id, $aiToken['channels'])) {
                    array_push($aiEnabledCameraIds, $c_id);
                    break;
                }
            }
        }

        return $aiEnabledCameraIds;
    }

    public function getLocations($limit, $offset){
        $ret=[];
        if ($this->isDealer()){
            $ec = fetchAll('select "location", count(*) as count from camera where "userID"=? group by "location" order by "location" asc limit ? offset ?',[$this->id,$limit, $offset]);
            if (!$ec) return [];
            foreach($ec as $i=>$v)
                $ret[$v['location']] = $v['count'];
        } else {
            $ec = fetchAll('select "location", count(*) as count from camera where "channelID" in (select "cameraCHID" from "userCamera" where "userID"=?)
                group by "location" order by "location" asc limit ? offset ?',
                [$this->id,$limit, $offset]);
            if (!$ec) return [];
            foreach($ec as $i=>$v)
                $ret[$v['location']] = $v['count'];
        }
        return $ret;
    }

    public function getLocationsCount(){
        return fetchOne('select count(*) from (select "location" from camera where "userID"=? group by "location") v',[$this->id]);
    }

    public function getAccountStats() {
        $server = $this->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed creating camera channel. reason: generateServicesURLs');
        
        $accountStats = StreamLandAPI::getAccountStats();
        if (!$accountStats) error(555, 'Failed getting account statistics');
        return $accountStats;
    }

    /**
     * Check for user is child for the this user
     */
    public function checkChild($user=null){
        if (!$user || !$user instanceof MUser) return false;
        $count = MCore::$core->pdo->fetchOne('SELECT count(*) from "user" where "id"=? and "parentUserID"=?', [$user->id, $this->id]);
        return $count > 0;
    }

     /**
     * Attach camera to this user
     * After calling this function, updateAllCamsToken() function call is required
     * 
     * @param MCamera $camera camera to attach
     */
    public function attachCameraByChannelID($channel_id){
        $r = MCore::$core->pdo->fetchOne('SELECT count(*) from "userCamera" where "userID"=? and "cameraCHID"=?',[$this->id, $channel_id]);
        if ($r>0) return;
        MCore::$core->pdo->query('INSERT INTO "userCamera"  ("userID", "cameraCHID") VALUES (?, ?)',[$this->id, $channel_id]);
    }

    public function attachLocationToUser($location) {
        $r = MCore::$core->pdo->fetchOne('SELECT count(*) from "userCamera" where "userID"=? and "location"=?',[$this->id, $location]);
        if ($r>0) return;
        MCore::$core->pdo->query('INSERT INTO "userCamera"  ("userID", "location") VALUES (?, ?)',[$this->id, $location]);
    }

    /**
     * Detach camera to this user
     * After calling this function, updateAllCamsToken() function call is required
     * 
     * @param MCamera $camera camera to detach
     */
    public function detachCameraByChannelID($channel_id){
        MCore::$core->pdo->query('DELETE from "userCamera" where "userID"=? and "cameraCHID"=?',[$this->id, $channel_id]);
    }

    public function detachLocationFromUser($location){
        MCore::$core->pdo->query('DELETE from "userCamera" where "userID"=? and "location"=?',[$this->id, $location]);
    }

    public function setAccess($services_access, $debug_access){
        $this->servicesAccess = $services_access ? 1 : 0;
        $this->debugAccess = $debug_access ? 1 : 0;
        MCore::$core->pdo->query('UPDATE "user" SET "servicesAccess"=?, "debugAccess"=? WHERE "id"=?',[$this->servicesAccess, $this->debugAccess, $this->id]);
    }
}