<?php
$curdir_streamland_api = dirname(__FILE__);
require_once $curdir_streamland_api.'/static_lib.php';
date_default_timezone_set('UTC');


	// DashBoard format 
	// {"token":"share.eyJ","camid":217281,"cmngrid":217705,"access":"all","api_p":80,"api_sp":443,"cam":"cam.skyvr.videoexpertsgroup.com","cam_p":8888,"cam_sp":8883}
	// Admin API format
	// {"camid": 217281, "cmngrid": 217705, "access": "all", "token": "share.eyJ", "api": "web.skyvr.videoexpertsgroup.com", "cam": "cam.skyvr.videoexpertsgroup.com"}
	// Admin API server
	// {"camid": 41, "api_sp": 86, "cmngrid": 41, "access": "all", "token": "share.eyJ", "api": "10.20.16.128", "api_p": 83}

function parseAccessToken($access_token)
{
		
	$at_str =  base64_decode($access_token); 
	if ($at_str === FALSE)
	{
		
		// INLAID token
		return;
	}
	
	return json_decode($at_str, true);
}

function getApiURL($access_token)
{
	$at = parseAccessToken($access_token);
	if (!$at)
		return FALSE;

	
	$srv     = "web.skyvr.videoexpertsgroup.com";
	$api_sp  = 0;
	$api_p   = 0;
	$port    = 0;
	$prot    = 0; 
	if ( property_exists( 'at' ,'api') )
		$srv = $at['api'];

	if ( property_exists( 'at' ,'api_sp'))
		$api_sp = $at['api_sp'];
	else 
		$api_sp = 443;

	// We will use HTTPS only
	//if (!$at->{'api_p'})
	//	$api_sp = $at->{'api_p'};
	
	//echo ("https://".$srv.":".$api_sp."/"."\n"); 

	return "https://".$srv.":".$api_sp."/"; 
}


class StreamLandAPI_V4 {
	static $mBaseSvcpURL = 'https://web.skyvr.videoexpertsgroup.com/';
	static $SvcpAdminApiToken = null;
	static $mRequestData = null;
	static $mRequestLoginData = null;

	// V4 Channel API
	static function createClip($params, $access_token) {
		$url = getApiURL($access_token);
		return StreamLandAPI_V4::requestPost($streamland_url,
		array(
			'url' => $url,
			'path' => 'api/v4/clips/',
			'get_params' => array(),
			'json_data' => $params,
			'acc' => $access_token,
		));
    }
	
	static function deleteClip($clipID, $access_token) {
		$url = getApiURL($access_token);
        return StreamLandAPI_V4::requestDelete(array(
			'url' => $url,
			'path' => 'api/v4/clips/'.$clipID.'/',
			'get_params' => array(),
			'acc' => $access_token,
		));
    }


	static private function checkCurlTotalTime($curl, $opt) {
		if (!curl_errno($curl)) {
			$info = curl_getinfo($curl);
			if ($info['total_time'] > 1) {
				Log::warn("StreamLandAPI_V4", 'checkCurlTotalTime ['.$opt['type'].'] '
					.' Total time '.$info['total_time'].' second(s) for execute on request: '.json_encode($opt));
			}
		}
	}

	static private function getHttpCodeAndCheck($curl, $opt, $httpcodes_expected) {
		$type = $opt['type'];
		if (!in_array($opt['httpcode'], $httpcodes_expected)) {
			Log::err("StreamLandAPI_V4", 'getHttpCodeAndCheck ['.$type.'] HTTP Code not ['.implode(',', $httpcodes_expected).'] for '.json_encode($opt));
		}
	}

	static private function curlInit(&$opt) {
		$params_ = array();

		if (isset($opt['get_params'])) {
			foreach ($opt['get_params'] as $v => $k) {
				$params_[] = urlencode($v).'='.urlencode($k);
			}
		}

		/// TODO redesing find host/port by key in database
		$url = $opt['url'].$opt['path'].'?'.implode('&',$params_);

		$curl = curl_init();
		$curl_options = array(
			CURLOPT_URL => $url,
			CURLOPT_CUSTOMREQUEST => $opt['type'],
			CURLOPT_HTTPHEADER => array(),
			CURLOPT_RETURNTRANSFER => '1',
			CURLOPT_SSL_VERIFYPEER => false,
			CURLOPT_SSL_VERIFYHOST => false,
		);
		if (isset($opt['lkey'])) {
			$curl_options[CURLOPT_HTTPHEADER][] = 'Authorization: LKey '.$opt['lkey'];
		}
		if (isset($opt['acc'])) {
			$curl_options[CURLOPT_HTTPHEADER][] = 'Authorization: Acc '.$opt['acc'];
		}
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
		$curl = StreamLandAPI_V4::curlInit($opt);
		StreamLandAPI_V4::curlExecute($curl, $opt);
		StreamLandAPI_V4::checkCurlTotalTime($curl, $opt);
		StreamLandAPI_V4::getHttpCodeAndCheck($curl, $opt, array(200,201));
		curl_close($curl);

		if(!$opt['response_json']){
			Log::err("StreamLandAPI_V4", '[GET] Wrong response on request '.json_encode($opt));
			exit;
		}
		
		return $opt['response_json'];
	}

	static private function requestPost($opt) {
		$opt['type'] = 'POST';
		$curl = StreamLandAPI_V4::curlInit($opt);
		StreamLandAPI_V4::curlExecute($curl, $opt);
		StreamLandAPI_V4::checkCurlTotalTime($curl, $opt);
		StreamLandAPI_V4::getHttpCodeAndCheck($curl, $opt, array(200,201));
		curl_close($curl);

		if (!$opt['response_json']) {
			Log::err("StreamLandAPI_V4", '[POST] Wrong response on request: '.json_encode($opt));
			exit;
		}
		return $opt['response_json'];
	}

	// new api
	static private function requestPut($streamland_url, $opt) {
		$opt['type'] = 'PUT';
		$curl = StreamLandAPI_V4::curlInit($opt);
		StreamLandAPI_V4::curlExecute($curl, $opt);
        StreamLandAPI_V4::checkCurlTotalTime($curl, $opt);
		StreamLandAPI_V4::getHttpCodeAndCheck($curl, $opt, array(200,201));
		curl_close($curl);

        if (!$opt['response_json']) {
			Log::err("StreamLandAPI_V4", '[PUT] Wrong response on request '.json_encode($opt));
            exit;
        }
        return $opt['response_json'];
	}

	static private function requestDelete($opt) {
		$opt['type'] = 'DELETE';
		$curl = StreamLandAPI_V4::curlInit($opt);
		StreamLandAPI_V4::curlExecute($curl, $opt);
		StreamLandAPI_V4::checkCurlTotalTime($curl, $opt);
		StreamLandAPI_V4::getHttpCodeAndCheck($curl, $opt, array(204));
		curl_close($curl);

		if ($opt['response'] != '') {
			Log::err("StreamLandAPI_V4", '[DELETE] Wrong response on request '.json_encode($opt));
		}
		return $opt['httpcode'];
	}
}
