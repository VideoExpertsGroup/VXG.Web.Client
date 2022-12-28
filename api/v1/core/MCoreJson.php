<?php
include_once('MCore.php');

/**
 * Core class with response support for VXG project
 * 
 * Sample of use:
 * 
 * include_once('MCoreJson.php');
 * 
 * MCoreJson::init();
 */
class MCoreJson extends MCore{
    /**
     * @var array Response array
     */
    public $response=[];

    /**
     * Core initialization
     *
     * @return MCodeJson core object
     */
    static function init(){
        if (MCore::$core) return;
        MCore::$core = new MCoreJson();
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: application/json');
        MCore::$core->timestart = microtime(true);
        MCore::$core->request = json_decode(file_get_contents('php://input'), true);
        MCore::$core->request = array_merge(MCore::$core->request ?? [], $_POST ?? []);
        parent::init();
        return MCore::$core;
    }

    /**
     * Desctructor
     */
    function __destruct(){
        parent::__destruct();
        http_response_code($this->http_code);
	    if ($this->timestart != null)
            $this->response['lead_time_sec'] = microtime(true) - $this->timestart;
        $this->response['httpcode'] = $this->http_code;
// todo add limit and offset support        
        if (!isset($this->response['limit']))
            $this->response['limit'] = 100;
        if (!isset($this->response['offset']))
            $this->response['offset'] = 0;
        if (!isset($this->response['data']))
            $this->response['data'] = [];
        if (!isset($this->response['total']))
            $this->response['total'] = is_array($this->response['data']) ? count($this->response['data']) : 0;
        print json_encode($this->response);
    }

    /**
     * Error handler.
     *
     * @param integer $code HTTP code
     * @param string $message Error message
     * @param integer $backtrace_level backtrace level, if enabled
     */
    function error($code, $message, $backtrace_level=2) {
        parent::error($code, $message, $backtrace_level);
        MCore::$core->response = array(
            'result' => 'fail',
            'httpcode' => $code,
            'errorDetail' => $message,
            'data' => array(),
        );
        if (MCore::DEBUG_BACKTRACE_ENABLE && (!MCore::isProduction()) && $backtrace_level){
            MCore::$core->response['backtrace'] = [];
            foreach(debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS) as $v){
                if (!$backtrace_level) break;
                MCore::$core->response['backtrace'][] = $v['file'].'('.$v['line'].')';
                $backtrace_level--;
            }
        }
        // Call the core destructor
        exit;
    }
}
