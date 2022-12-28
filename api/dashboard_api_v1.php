<?php
$curdir_api = dirname(__FILE__);
require_once $curdir_api.'/static_lib.php';

class DashBoard_API_V1 {
	//static $mBaseURL = 'https://dev-dash.vxg.io/';
	static $mBaseURL = 'http://10.20.16.128:10001/';
	static $SvcpAdminApiToken = null;
	static $mRequestData = null;
	static $mRequestLoginData = null;

	// We need to use Login becasue we do not if there is this user on the Dashboard
	static function Login($auth_token) {
		return DashBoard_API_V1::requestPost(
		array(
			'url' => DashBoard_API_V1::$mBaseURL,
			'path' => 'api/v1/users/login_firebase/',
			'acc' => $auth_token,
		));
    }

	static function GetLicense($auth_token) {
		return DashBoard_API_V1::requestPost(
		array(
			'url' => DashBoard_API_V1::$mBaseURL,
			'path' => 'admin/api/v1/users/licenses/',
			'get_params' => array(),
			'acc' => $auth_token,
		));
    }


	


	static private function checkCurlTotalTime($curl, $opt) {
		if (!curl_errno($curl)) {
			$info = curl_getinfo($curl);
			if ($info['total_time'] > 1) {
				Log::warn("DashBoard_API_V1", 'checkCurlTotalTime ['.$opt['type'].'] '
					.' Total time '.$info['total_time'].' second(s) for execute on request: '.json_encode($opt));
			}
		}
	}

	static private function getHttpCodeAndCheck($curl, $opt, $httpcodes_expected) {
		$type = $opt['type'];
		if (!in_array($opt['httpcode'], $httpcodes_expected)) {
			Log::err("DashBoard_API_V1", 'getHttpCodeAndCheck ['.$type.'] HTTP Code not ['.implode(',', $httpcodes_expected).'] for '.json_encode($opt));
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

		if (in_array(StaticLib::$CONFIG['vxg_dashboard'],['caminfo']))
		{
			$curl_options[CURLOPT_CAINFO] = StaticLib::$CONFIG['vxg_dashboard']['caminfo'];
			$curl_options[CURLOPT_SSL_VERIFYPEER] = true;
		}



		// Add authorization
		if (isset($opt['acc'])) {
			$curl_options[CURLOPT_HTTPHEADER][] = 'Authorization: FB '.$opt['acc'];
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
		$curl = DashBoard_API_V1::curlInit($opt);
		DashBoard_API_V1::curlExecute($curl, $opt);
		DashBoard_API_V1::checkCurlTotalTime($curl, $opt);
		DashBoard_API_V1::getHttpCodeAndCheck($curl, $opt, array(200,201));
		curl_close($curl);

		if(!$opt['response_json']){
			Log::err("DashBoard_API_V1", '[GET] Wrong response on request '.json_encode($opt));
			exit;
		}
		
		return $opt['response_json'];
	}

	static private function requestPost($opt) {
		$opt['type'] = 'POST';
		$curl = DashBoard_API_V1::curlInit($opt);
		DashBoard_API_V1::curlExecute($curl, $opt);
		DashBoard_API_V1::checkCurlTotalTime($curl, $opt);
		DashBoard_API_V1::getHttpCodeAndCheck($curl, $opt, array(200,201));
		curl_close($curl);

		if (!$opt['response_json']) {
			Log::err("DashBoard_API_V1", '[POST] Wrong response on request: '.json_encode($opt));
			exit;
		}
		return $opt['response_json'];
	}

	// new api
	static private function requestPut($streamland_url, $opt) {
		$opt['type'] = 'PUT';
		$curl = DashBoard_API_V1::curlInit($opt);
		DashBoard_API_V1::curlExecute($curl, $opt);
        DashBoard_API_V1::checkCurlTotalTime($curl, $opt);
		DashBoard_API_V1::getHttpCodeAndCheck($curl, $opt, array(200,201));
		curl_close($curl);

        if (!$opt['response_json']) {
			Log::err("DashBoard_API_V1", '[PUT] Wrong response on request '.json_encode($opt));
            exit;
        }
        return $opt['response_json'];
	}

	static private function requestDelete($opt) {
		$opt['type'] = 'DELETE';
		$curl = DashBoard_API_V1::curlInit($opt);
		DashBoard_API_V1::curlExecute($curl, $opt);
		DashBoard_API_V1::checkCurlTotalTime($curl, $opt);
		DashBoard_API_V1::getHttpCodeAndCheck($curl, $opt, array(204));
		curl_close($curl);

		if ($opt['response'] != '') {
			Log::err("DashBoard_API_V1", '[DELETE] Wrong response on request '.json_encode($opt));
		}
		return $opt['httpcode'];
	}
}
