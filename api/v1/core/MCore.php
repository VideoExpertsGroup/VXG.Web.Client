<?php

include_once('skin.php');
include_once('MSettings.php');
include_once('MConstants.php');
include_once('MPdo.php');
include_once('MUser.php');

/**
 * Wrap, for quick access to core
 */
function core(){
    return MCore::$core;
}

/**
 * Wrap, for quick check debug mode
 */
function isProduction(){
   return MCore::isProduction();
}

function isMobile(){
    if (stripos($_SERVER['HTTP_USER_AGENT'],'Android')!==false) return true;
    if (stripos($_SERVER['HTTP_USER_AGENT'],'webOS')!==false) return true;
    if (stripos($_SERVER['HTTP_USER_AGENT'],'iPhone')!==false) return true;
    if (stripos($_SERVER['HTTP_USER_AGENT'],'iPad')!==false) return true;
    if (stripos($_SERVER['HTTP_USER_AGENT'],'iPod')!==false) return true;
    if (stripos($_SERVER['HTTP_USER_AGENT'],'BlackBerry')!==false) return true;
    if (stripos($_SERVER['HTTP_USER_AGENT'],'Windows Phone')!==false) return true;
    return false;
}

/**
 * Wrap, for error method from MCore
 */
function error($code, $message, $backtrace_level=2){
    MCore::$core->error($code, $message, $backtrace_level);
}

/**
 * Core class for VXG project
 * 
 * Sample of use:
 * 
 * include_once('MCore.php');
 * 
 * MCore::init();
 */
class MCore extends MConstants{
    /** 
     * @var array Request array from php input json or $_POST variable 
     */
    public $request=[];

    /** 
     * @var bool|MUser current user, if detected
     */
    public $current_user = false;

    /** 
     * @var integer HTTP code for return
     */
    public $http_code=MCore::DEFAULT_RETURN_HTTP_CODE;

    /** 
     * @var integer Start time
     */
    public $timestart;

    /** 
     * @var integer static core link
     */
    public static $core;

    /** 
     * @var MPdo MPdo class object
     */
    public $pdo;

    /** 
     * @var MSettings class object
     */
    public $settings;

    /** 
     * @var array Data from config file
     */
    public $config;

    /**
     * Check is prodaction mode
     *
     * @return boolean
     */
    static function isProduction(){
        if (!isset(MCore::$core->config['isProduction'])) return true;
        return MCore::$core->config['isProduction'] ? true : false;
    }

    /**
     * Stripe primary key
     *
     * @return string Stripe primary key
     */
    static function getStripePk(){
        return isProduction() ? MCore::$core->config['stripe_pk'] : MCore::$core->config['dev']['stripe_pk'];
    }

    /**
     * Stripe secondary key
     *
     * @return string Stripe secondary key
     */
    static function getStripeSk(){
        return isProduction() ? MCore::$core->config['stripe_sk'] : MCore::$core->config['dev']['stripe_sk'];
    }

    /**
     * Return protocol name
     *
     * @return string http or https
     */
    static function getProtocol(){
        return 'http'.((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') ? 's' : '');
    }

    /**
     * Returns the net url of the site - no dealer prefixes
     *
     * @return string for example videosurveillancecloud.com
     */
    public static function getDomain(){
        $d = explode('.',$_SERVER['HTTP_HOST']);
        if (is_numeric($d[0]) || count($d)<3) return $_SERVER['HTTP_HOST'];
        array_shift($d);
        return implode('.',$d);
    }

    /**
     * Return subpath - '/vxg' for example
     *
     * @return string subpath
     */
    static function getSubpath(){
        $pos = strpos($_SERVER['REQUEST_URI'], "/api/");
        $subpath = substr($_SERVER['REQUEST_URI'], 0, $pos);
        return $subpath;
    }

    /**
     * Check and interrupt script, if user not authorized
     *
     * @return void
     */
    static function checkOnlyForAuthorized(){
        if (MCore::$core->current_user) return;
        MCore::$core->error(401, 'Unauthorized',0);
    }

    /**
     * Check and interrupt script, if user have not role 'user'
     *
     * @return void
     */
    static function checkOnlyForUsers(){
        if (MCore::$core->current_user && isset(MCore::$core->current_user->role) && MCore::$core->current_user->role=='user') return;
        MCore::$core->error(403, "Currently only for 'user' role",0);
    }

    /**
     * Check and interrupt script, if user have not role 'dealer' and above
     *
     * @return void
     */
    static function checkOnlyForParentUsers(){
        if (MCore::$core->current_user && isset(MCore::$core->current_user->parentUserID) && MCore::$core->current_user->role!='user') return;
        MCore::$core->error(403, "Currently only for parent user roles",0);
    }

    /**
     * Mass load input parameters into array. Sample of use:
     * list($camIDs, $subusers, $planUID) = MCore::getInputParameters(['camIDs','subusers'=>false, 'planUID']);
     *
     * @param array $arr list of required parameters
     * @return void
     */
    static function getInputParameters($arr, $trim_string=false){
        $ret = [];
        foreach($arr as $i=>$p){
            $param_name = !is_numeric($i) ? $i : $p;
            $param_default_value = !is_numeric($i) ? $p : null;
            $v = isset(MCore::$core->request[$param_name]) ? MCore::$core->request[$param_name] : $param_default_value;
            if ($trim_string && is_string($v))
                $v = trim($v);
            $ret[] = $v;
        }
        return $ret;
    }

    /**
     * Check for exist and mass load input parameters into array. Sample of use:
     * list($additionalData, $stripeCardToken) = MCore::checkAndGetInputParameters(['additionalData'=>'datetime', 'stripeCardToken']);
     *
     * @param array $arr list of required parameters
     * @return void
     */
    static function checkAndGetInputParameters($arr){
        $need='';$ret = [];
        foreach($arr as $i=>$p){
            $param_name = !is_numeric($i) ? $i : $p;
            $param_type = !is_numeric($i) ? $p : '';
            if (!isset(MCore::$core->request[$param_name])){
                $need .= ($need?', ':'') . "'".$param_name."'";
                continue;
            }
            if ($param_type=='datetime'){
                $t = date("Y-m-d H:i:s", strtotime(MCore::$core->request[$param_name]));
                if (strpos(MCore::$core->request[$param_name], $t)===false)
                    MCore::$core->error(400, "The paretemer '".$p."' requires format YYYY-MM-DD hh:mm:ss",0);
                $ret[] = $t;
                continue;
            }
            $ret[] = MCore::$core->request[$param_name];
        }
        if ($need)
            MCore::$core->error(400, "Missing parameter(s) ".$need." in the request",0);
        return $ret;
    }

    /**
     * Initialize core
     *
     * @return MCore
     */
    static function init(){
        if (is_file(__DIR__."/../../../skin/skin.php"))
            include_once(__DIR__."/../../../skin/skin.php");
        date_default_timezone_set('UTC');
        if (!MCore::$core)
            MCore::$core = new MCore();
        include (MCore::CONFIG_FILE);
        try{
            include (MCore::SKIN_CONFIG_FILE);
        } catch(Exception $e){}
        MCore::$core->config = $config;
        if (!MCore::$core->config['capture_id'])
            error(501,'No capture_id settings');

        if (!MCore::$core->pdo)
            MCore::$core->pdo = new MPdo(
                'pgsql:host='.MCore::$core->config['db']['host'].';dbname='.MCore::$core->config['db']['dbname'],
                MCore::$core->config['db']['username'],
                MCore::$core->config['db']['userpass']
            );

        MCore::$core->settings = new MSetings(MCore::$core->pdo);
        if (!MCore::$core->request) MCore::$core->request = $_POST;
        try{
            if (!MCore::$core->request) MCore::$core->request = json_decode(file_get_contents('php://input'), true);
        } catch (Exception $e) {}

        MCore::$core->current_user = false;
        if (isset(MCore::$core->request['token'])) {
//            if (MCore::$core->settings['enable_old_auth'])
//                MCore::$core->current_user = MUser::getUserByToken(MCore::$core->request['token']);
            if (!MCore::$core->current_user)
                MCore::$core->current_user = MUser::getUserByAuthToken(MCore::$core->request['token'], isset(MCore::$core->request['newdealer']) ? MCore::$core->request['newdealer'] : '');
        }


        if (MCore::$core->current_user && (MCore::$core->current_user->isPartner() || MCore::$core->current_user->isDistributor()
            || MCore::$core->current_user->isTheater() || MCore::$core->current_user->isChannel() || MCore::$core->current_user->isSuperAdmin()) &&
            isset(MCore::$core->request['manage_uid'])){
            $manage_uid = 0+MCore::$core->request['manage_uid'];
            $r = MCore::$core->pdo->fetchAll('WITH RECURSIVE r AS (SELECT * FROM "user" WHERE id=? UNION SELECT u.* FROM "user" u JOIN r ON r."parentUserID"=u.id) SELECT * FROM r WHERE id=?',
                [$manage_uid,MCore::$core->current_user->id]);
            if (!count($r))
                error(403, 'No permissions to manage the UID '.$manage_uid);
            else {
                MCore::$core->manage_user = MCore::$core->current_user;
                MCore::$core->current_user = MUser::getUserById($manage_uid);
            }
            if (!MCore::$core->current_user)
                error(403, 'No user with ID '.$manage_uid);
        }
        return MCore::$core;
    }

    /**
     * Return true, if user is managed by dealer etc.
     */
    static function isManaged(){
        return isset(MCore::$core->request['manage_uid']);
    }

    /**
     * set HTTP code for return
     *
     * @param integer HTTP code
     */
    static function setHttpCode($code=MCore::DEFAULT_RETURN_HTTP_CODE) {
        MCore::$core->http_code = $code;
    }

    /**
     * Error handler
     *
     * @param integer $code HTTP code
     * @param string $message Error message
     * @param integer $backtrace_level backtrace level, if enabled
     */
    public function error($code, $message, $backtrace_level=2) {
        MCore::$core->http_code = $code;
        $backtrace_text = '';
        if (MCore::DEBUG_BACKTRACE_ENABLE && $backtrace_level){
            $backtrace = debug_backtrace();
            for ($i=0; $i<$backtrace_level; $i++){
                 if (!isset($backtrace[$i])) break;
                 $backtrace_text.=" \n".$backtrace[$i]['file']."(".$backtrace[$i]['line'].")";
            }
        }
        error_log('['.$code.']:'.print_r($message, true).$backtrace_text);

        // Call the core destructor
        if (get_class($this)=='MCore'){
            http_response_code($this->http_code);
            if (!MCore::isProduction())
                print(print_r($message, true)."\n".$backtrace_text)."\n\n";
            exit;
        }
    }

    /**
     * Class constructor unavailable for external use
     */
    protected function __construct(){
    }

    /**
     * Desctruction
     */
    function __destruct(){
    }
}
