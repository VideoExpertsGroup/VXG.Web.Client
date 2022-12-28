<?php

$curdir = dirname(__FILE__);
include_once ($curdir."/vendor/autoload.php");

use kornrunner\Keccak;

$curdir_streamland_api = dirname(__FILE__);
require_once $curdir_streamland_api.'/static_lib.php';
date_default_timezone_set('UTC');

function convert_password($password)
{
  Log::warn("RTSPPlayer_API", 'password1='.$password);
  $s = Keccak::hash($password, 256, true); 
  $s1 =  base64_encode($s);		
  Log::warn("RTSPPlayer_API password3=", $s1);
  return $s1;
}

class RTSPPlayer_API {
	static $mBaseSvcpURL = 'https://rtspplayer.vxg.io/';
	static $SvcpAdminApiToken = null;
	static $mRequestData = null;
	static $mRequestLoginData = null;

	// RTSP player API
	static function userLogin($user, $password) {
		//$url = getApiURL($access_token);
		$params = array(); 
		$params['password'] = convert_password($password);
		$params['username'] = $user;
		$res = RTSPPlayer_API::requestPost(
		array(
			'url' => RTSPPlayer_API::$mBaseSvcpURL,
			'path' => 'api/v1/user/login',
			'get_params' => array(),
			'json_data' => $params
		));

		// Check result and return false or true
		if ($res && $res['httpcode'] && $res['httpcode'] == 200) return true;
			else
		return false;

	}
	
	


	static private function checkCurlTotalTime($curl, $opt) {
		if (!curl_errno($curl)) {
			$info = curl_getinfo($curl);
			if ($info['total_time'] > 1) {
				Log::warn("RTSPPlayer_API", 'checkCurlTotalTime ['.$opt['type'].'] '
					.' Total time '.$info['total_time'].' second(s) for execute on request: '.json_encode($opt));
			}
		}
	}

	static private function getHttpCodeAndCheck($curl, $opt, $httpcodes_expected) {
		$type = $opt['type'];
		if (!in_array($opt['httpcode'], $httpcodes_expected)) {
			Log::err("RTSPPlayer_API", 'getHttpCodeAndCheck ['.$type.'] HTTP Code not ['.implode(',', $httpcodes_expected).'] for '.json_encode($opt));
			return false;
		}
		return true;
	}

	static private function curlInit(&$opt) {
		$params_ = array();

		if (isset($opt['get_params'])) {
			foreach ($opt['get_params'] as $v => $k) {
				$params_[] = urlencode($v).'='.urlencode($k);
			}
		}

		/// TODO redesing find host/port by key in database
		$url = $opt['url'].$opt['path']."/";//.'?'.implode('&',$params_);

		$curl = curl_init();
		$curl_options = array(
			CURLOPT_URL => $url,
			CURLOPT_CUSTOMREQUEST => $opt['type'],
			CURLOPT_HTTPHEADER => array(),
			CURLOPT_RETURNTRANSFER => '1',
			CURLOPT_SSL_VERIFYPEER => false,
			CURLOPT_SSL_VERIFYHOST => false,
		);
		if (isset($opt['json_data'])) {
			$data_string = json_encode($opt['json_data']);
			$curl_options[CURLOPT_HTTPHEADER][] = 'Content-Type: application/json';
			$curl_options[CURLOPT_HTTPHEADER][] = 'Content-Length: '.strlen($data_string);
			$curl_options[CURLOPT_POSTFIELDS] = $data_string;
		}
		curl_setopt_array($curl, $curl_options);
		return $curl;
	}

	static private function curlExecute(&$curl, &$opt) {
		$opt['response'] = curl_exec($curl);
		$opt['httpcode'] = curl_getinfo($curl, CURLINFO_HTTP_CODE);
		if ($opt['response'] != '') {
			try { 
				$opt['response_json'] = json_decode($opt['response'], true);
			} catch (Exception $e) {
				error_log($e);
			}
		}
	}

	static private function requestGet($opt) {
		$opt['type'] = 'GET';
		$curl = RTSPPlayer_API::curlInit($opt);
		RTSPPlayer_API::curlExecute($curl, $opt);
		RTSPPlayer_API::checkCurlTotalTime($curl, $opt);
		RTSPPlayer_API::getHttpCodeAndCheck($curl, $opt, array(200,201));
		curl_close($curl);

		if(!$opt['response_json']){
			Log::err("RTSPPlayer_API", '[GET] Wrong response on request '.json_encode($opt));
			exit;
		}
		
		return $opt['response_json'];
	}

	static private function requestPost($opt) {
		$res = false;
		$opt['type'] = 'POST';
		$curl = RTSPPlayer_API::curlInit($opt);
		RTSPPlayer_API::curlExecute($curl, $opt);
		RTSPPlayer_API::checkCurlTotalTime($curl, $opt);
		Log::err("RTSPPlayer_API", ' '.print_r($opt,true));
		RTSPPlayer_API::getHttpCodeAndCheck($curl, $opt, array(200,201));
		curl_close($curl);

		//if (!$opt['response_json']) {
		//	Log::err("RTSPPlayer_API", '[POST] Wrong response on request: '.json_encode($opt));
		//	exit;
		//}
		$res = null;
		if ($opt['response'])
			$res = json_decode($opt['response'],true);
		return $res;
	}

	// new api
	static private function requestPut($streamland_url, $opt) {
		$opt['type'] = 'PUT';
		$curl = RTSPPlayer_API::curlInit($opt);
		RTSPPlayer_API::curlExecute($curl, $opt);
        RTSPPlayer_API::checkCurlTotalTime($curl, $opt);
		RTSPPlayer_API::getHttpCodeAndCheck($curl, $opt, array(200,201));
		curl_close($curl);

        if (!$opt['response_json']) {
			Log::err("RTSPPlayer_API", '[PUT] Wrong response on request '.json_encode($opt));
            exit;
        }
        return $opt['response_json'];
	}

	static private function requestDelete($opt) {
		$opt['type'] = 'DELETE';
		$curl = RTSPPlayer_API::curlInit($opt);
		RTSPPlayer_API::curlExecute($curl, $opt);
		RTSPPlayer_API::checkCurlTotalTime($curl, $opt);
		RTSPPlayer_API::getHttpCodeAndCheck($curl, $opt, array(204));
		curl_close($curl);

		if ($opt['response'] != '') {
			Log::err("RTSPPlayer_API", '[DELETE] Wrong response on request '.json_encode($opt));
		}
		return $opt['httpcode'];
	}
}
