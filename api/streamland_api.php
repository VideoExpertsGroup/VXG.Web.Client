<?php
$curdir_streamland_api = dirname(__FILE__);
require_once $curdir_streamland_api.'/static_lib.php';
date_default_timezone_set('UTC');

class StreamLandAPI {
	static $mBaseAccpURL = 'https://cnvrclient2.videoexpertsgroup.com/';
	static $mBaseSvcpURL = 'https://web.skyvr.videoexpertsgroup.com/';
	static $SvcpAdminApiToken = null;
	static $mRequestData = null;
	static $mRequestLoginData = null;
	static $streamland_key = null;

	static function generateServicesURLs($host=null, $port=null, $lkey=null,$skiperror=false) {
		StreamLandAPI::$streamland_key = $lkey;
		if (!$host || !$lkey){
			error(501,'host, port, lkey required');
// host, port, lkey required!!!!			
			return;
			$sd = StaticLib::getServerData();
			$host = $sd['serverHost'];
			$port = $sd['serverPort'];
			StreamLandAPI::$streamland_key = $sd['serverLkey'];
		}
/*		
        if (strpos($host, '.videoexpertsgroup.com') !== false) {
            StreamLandAPI::$mBaseAccpURL = 'https://cnvrclient2.videoexpertsgroup.com/';
            StreamLandAPI::$mBaseSvcpURL = 'https://web.skyvr.videoexpertsgroup.com/';
            return 1;
		}
*/		
		if (substr($host,-1)=='/')
			$host = substr($host,0, strlen($host)-1);
		if ($port)
			StreamLandAPI::$mBaseSvcpURL = $host.':'.$port.'/';
		else
			StreamLandAPI::$mBaseSvcpURL = $host.'/';

	/*
	We story the cloud key , the address and the port in the database.
        We do not do this reauest every time to get a port
        ///
	--------------------------------------------------
        $r = StreamLandAPI::requestPost(array(
			'path' => '/api/v1/users/settings/', 
			'get_params' => array(),
			'json_data' => array("ports"=> "only"),
		),$skiperror);
        if (!isset($r['data'], $r['data']['ports'])) {
			Log::err('streamlandapi', "generateServicesURLs, URL Request: ".StreamLandAPI::$mBaseSvcpURL);
            Log::err('streamlandapi', "generateServicesURLs, resp: ".json_encode($r));
            return 0;
        }
        $ports = $r['data']['ports'];
        $is_accps = 0; //isset($ports['accps']);  TODO: just do not work by ssl
        $is_svcps = 0; //isset($ports['svcps']);  TODO: just do not work by ssl
        StreamLandAPI::$mBaseAccpURL = ($is_accps ? 'https://' : 'http://') . $host . ':' . ($is_accps ? $ports['accps'] : $ports['accp']) . '/';
        StreamLandAPI::$mBaseSvcpURL = ($is_svcps ? 'https://' : 'http://') . $host . ':' . ($is_svcps ? $ports['svcps'] : $ports['svcp']) . '/';
	*/
        return 1;
    }

	static function createChannelV2($channelData){
				return StreamLandAPI::requestPost(array(
					'path' => 'api/v2/cameras/',
					'lkey' => StreamLandAPI::$streamland_key,
					'get_params' => array(
						'detail' => 'detail',
					),
					'json_data' => $channelData,
				));
			}

	static function updateChannelV2($channel_id, $channelData){
		return StreamLandAPI::requestPut(array(
			'path' => 'api/v2/cameras/'.$channel_id.'/',
			'lkey' => StreamLandAPI::$streamland_key,
			'json_data' => $channelData
		));
	}

	static function getChannelV2($channel_id){
		return StreamLandAPI::requestGet(array(
			'path' => 'api/v2/cameras/'.$channel_id.'/',
			'lkey' => StreamLandAPI::$streamland_key
		));
	}

	static function createChannel($channelData, $streamland_key=false){
//		$streamland_key = $streamland_key ? $streamland_key : StaticLib::getSett('streamland_key');
		return StreamLandAPI::requestPost(array(
			'path' => 'api/v3/channels/',
			'lkey' => StreamLandAPI::$streamland_key,
			'get_params' => array(
				'detail' => 'detail',
			),
			'json_data' => $channelData,
		));
	}

    static function setLimits($channel_id, $params) {
        return StreamLandAPI::requestPut(array(
			'path' => 'api/v3/channels/'.$channel_id.'/limits/',
			'lkey' => StreamLandAPI::$streamland_key,
			'json_data' => $params,
		));
    }

    static function getLimits($channel_id) {
        return StreamLandAPI::requestGet(array(
			'path' => 'api/v3/channels/'.$channel_id.'/limits/',
			'lkey' => StreamLandAPI::$streamland_key
		));
    }

    static function getChannel($channel_id) {
		return StreamLandAPI::requestGet(array(
			'path' => 'api/v3/channels/'.$channel_id.'/',
			'lkey' => StreamLandAPI::$streamland_key,
			'get_params' =>['include_meta'=>'true']
		));
	}
		
    static function getEventProcessingEvents($channel_id) {
		return StreamLandAPI::requestGet(array(
			'path' => 'api/v2/cameras/'.$channel_id.'/event_processing/events/',
			'lkey' => StreamLandAPI::$streamland_key
		));
	}
		
    static function setEventProcessingEvents($channel_id, $name, $params) {
		return StreamLandAPI::requestPut(array(
			'path' => 'api/v2/cameras/'.$channel_id.'/event_processing/events/'.$name.'/',
			'lkey' => StreamLandAPI::$streamland_key,
			'json_data' => $params,
		));
	}
    static function createEventProcessingEvents($channel_id, $name, $notify) {
		$params = ['name'=>$name, 'notify'=>$notify];
		return StreamLandAPI::requestPost(array(
			'path' => 'api/v2/cameras/'.$channel_id.'/event_processing/events/',
			'lkey' => StreamLandAPI::$streamland_key,
			'json_data' => $params,
		));
	}

	static function updateChannel($channel_id, $params, $streamland_key=false) {
//        $streamland_key = $streamland_key ? $streamland_key : StaticLib::getSett('streamland_key');
        return StreamLandAPI::requestPut(array(
			'path' => 'api/v3/channels/'.$channel_id.'/',
			'lkey' => StreamLandAPI::$streamland_key,
			'json_data' => $params,
		));
    }

			static function deleteChannel($channel_id, $streamland_key=false){
//        $streamland_key = $streamland_key ? $streamland_key : StaticLib::getSett('streamland_key');
		return StreamLandAPI::requestDelete(array(
			'path' => 'api/v3/channels/'.$channel_id.'/',
			'lkey' => StreamLandAPI::$streamland_key,
			'get_params' => array(),
		));
	}


    static function getChannelStat($channel_id, $streamland_key=false, $paramsArray){
//        $streamland_key = $streamland_key ? $streamland_key : StaticLib::getSett('streamland_key');
        return StreamLandAPI::requestGet(array(
			'path' => 'api/v3/statistics/'.$channel_id.'/',
			'lkey' => StreamLandAPI::$streamland_key,
			'get_params' => $paramsArray,
		));
    }

	static function getAccountStats($streamland_key=false, $paramsArray=array()){
	//        $streamland_key = $streamland_key ? $streamland_key : StaticLib::getSett('streamland_key');
		return StreamLandAPI::requestGet(array(
			'path' => 'api/v3/statistics/',
			'lkey' => StreamLandAPI::$streamland_key,
			'get_params' => $params,
		));
	}
	
	static function getChannelEvents($streamland_key=false, $paramsArray){
//        $streamland_key = $streamland_key ? $streamland_key : StaticLib::getSett('streamland_key');
        return StreamLandAPI::requestGet(array(
			'path' => 'api/v2/storage/events/',
			'lkey' => StreamLandAPI::$streamland_key,
			'get_params' => $paramsArray,
		));
    }

		
	static function createMemoryCardBackup($channel_id, $access_token, $data){
				return StreamLandAPI::requestPost(array(
					'path' => 'api/v2/storage/memory_card/'.strval ($channel_id).'/synchronize',
					'acc' => $access_token,
					'json_data' => $data,
				));
			}

		//https://web.skyvr.videoexpertsgroup.com/api/v3/channel_groups/
		static function CreateGroupToken($params) {
			return StreamLandAPI::requestPost(array(
				'path' => 'api/v3/channel_groups/',
				'lkey' => StreamLandAPI::$streamland_key,
				'json_data' => $params,
			));
		}
	
		static function UpdateGroupToken($groupTokenID,$params) {
			return StreamLandAPI::requestPut(array(
				'path' => 'api/v3/channel_groups/'.strval ($groupTokenID).'/',
				'lkey' => StreamLandAPI::$streamland_key,
				'json_data' => $params,
			));
		}
		static function getGroupTokensList($params = null) {
			//$params = ['include_all_channels'=>'true', 'ai_targeted'=>$ai_targeted];
			if (!$params) $params = ['include_all_channels'=>'true'];
			return StreamLandAPI::requestGet(array(
				'path' => 'api/v3/channel_groups/',
				'lkey' => StreamLandAPI::$streamland_key,
				'get_params' =>$params
			));
		}

		static function getAllCamsToken($token_id){
			return StreamLandAPI::requestGet(array(
				'path' => 'api/v3/channel_groups/'.$token_id.'/',
				'lkey' => StreamLandAPI::$streamland_key,
				'get_params' =>['include_meta'=>'true']
			));
		}		
		
		static function createAllCamsToken($data){
			return StreamLandAPI::requestPost(array(
				'path' => 'api/v3/channel_groups/',
				'lkey' => StreamLandAPI::$streamland_key,
				'json_data' => $data
			));
		}		
		
			static function updateAllCamsToken($group_token_id, $data){
		return StreamLandAPI::requestPut(array(
			'path' => 'api/v3/channel_groups/'.$group_token_id.'/',
			'lkey' => StreamLandAPI::$streamland_key,
			'json_data' => $data
		));
	}		

	static function deleteGroupToken($group_token_id){
		return StreamLandAPI::requestDelete(array(
			'path' => 'api/v3/channel_groups/'.$group_token_id.'/',
			'lkey' => StreamLandAPI::$streamland_key
		));
	}		
	
	static function getCamerasListV2(){
			return StreamLandAPI::requestGet(array(
				'path' => 'api/v2/cameras/',
				'lkey' => StreamLandAPI::$streamland_key,
				'get_params' => array(
					'include_meta' => 'true',
					'detail'=>'detail'
				),
			));
		}

	static function subscribeNotification($channel_id, $data, $streamland_key=false){
//        $streamland_key = $streamland_key ? $streamland_key : StaticLib::getSett('streamland_key');
        return StreamLandAPI::requestPost(array(
			'path' => 'api/v2/cameras/'.$channel_id.'/notifications/push/devices/',
			'lkey' => StreamLandAPI::$streamland_key,
			'get_params' => array(),
			'json_data' => $data,
		));
    }
	
	static function unsubscribeNotification($channel_id, $device_id ,$streamland_key=false){
//        $streamland_key = $streamland_key ? $streamland_key : StaticLib::getSett('streamland_key');
        return StreamLandAPI::requestDelete(array(
			'path' => 'api/v2/cameras/'.$channel_id.'/notifications/push/devices/'.$device_id.'/',
			'lkey' => StreamLandAPI::$streamland_key,
			'get_params' => array(),
		));
    }

    static function createClip($params, $access_token) {
        return StreamLandAPI::requestPost(array(
			'path' => 'api/v4/clips/',
			'get_params' => array(),
			'json_data' => $params,
			'acc' => $access_token,
		));
    }
	
	static function deleteClip($clipID, $access_token) {
        return StreamLandAPI::requestDelete(array(
			'path' => 'api/v4/clips/'.$clipID.'/',
			'get_params' => array(),
			'acc' => $access_token,
		));
	}
	
	static function SetChannelParams($params, $access_token) {
        return StreamLandAPI::requestPut(array(
			'path' => 'api/v4/channel/',
			'json_data' => $params,
			'acc' => $access_token,
		));
    }

    static function createGroupSharedToken($data, $streamland_key=false){
//        $streamland_key = $streamland_key ? $streamland_key : StaticLib::getSett('streamland_key');
        return StreamLandAPI::requestPost(array(
			'path' => 'api/v2/sharings/',
			'lkey' => StreamLandAPI::$streamland_key,
			'get_params' => array(),
			'json_data' => $data
		));
	}
	
    static function getServerList(){
        return StreamLandAPI::requestGet(array(
			'path' => 'api/v6/servers/',
			'lkey' => StreamLandAPI::$streamland_key,
			// TODO PARAMS should be formed on the upper level
			'get_params' => array(
				'detail' => 'detail',
				'limit' => 1000,
				'is_owner' => true
			),
		));
	}

	static function getCamerasList($meta = null){
		$params = ['include_meta' => 'true', 'limit' => 1000];
		if ($meta) $params["meta"] = $meta;
        return StreamLandAPI::requestGet(array(
			'path' => 'api/v3/channels/',
			'lkey' => StreamLandAPI::$streamland_key,
			'get_params' => $params
		));
	}
	
    static function shareChannel($channel_id, $expired_seconds, $streamland_key=false){
//        $streamland_key = $streamland_key ? $streamland_key : StaticLib::getSett('streamland_key');
		$data = [
//			"name"=> "Share with Bigandre",
			"enabled"=> true,
			"include_public"=> false,
			"expire"=> date("Y-m-d\TH:i:s", time()+$expired_seconds),
			"access"=> ["live", "play"]
		];

        return StreamLandAPI::requestPost(array(
			'path' => 'api/v2/cameras/'.$channel_id.'/sharings/',
			'lkey' => StreamLandAPI::$streamland_key,
			'json_data' => $data
		));
    }
	
    static function updateGroupSharedToken($token_id, $data, $streamland_key=false){
		//        $streamland_key = $streamland_key ? $streamland_key : StaticLib::getSett('streamland_key');
				return StreamLandAPI::requestPut(array(
					'path' => 'api/v2/sharings/'.$token_id.'/',
					'lkey' => StreamLandAPI::$streamland_key,
					'json_data' => $data
				));
			}
			
	static function deleteGroupSharedToken($token_id, $streamland_key=false){
//        $streamland_key = $streamland_key ? $streamland_key : StaticLib::getSett('streamland_key');
        return StreamLandAPI::requestDelete(array(
			'path' => 'api/v2/sharings/'.$token_id.'/',
			'lkey' => StreamLandAPI::$streamland_key,
			'get_params' => array(),
		));
    }

	static private function checkCurlTotalTime($curl, $opt) {
		if (!curl_errno($curl)) {
			$info = curl_getinfo($curl);
			if ($info['total_time'] > 1) {
				Log::warn("streamlandapi", 'checkCurlTotalTime ['.$opt['type'].'] '
					.' Total time '.$info['total_time'].' second(s) for execute on request: '.json_encode($opt));
			}
		}
	}

	static private function getHttpCodeAndCheck($curl, $opt, $httpcodes_expected) {
		$type = $opt['type'];
		if (!in_array($opt['httpcode'], $httpcodes_expected)) {
			Log::err("streamlandapi", 'getHttpCodeAndCheck ['.$type.'] HTTP Code not ['.implode(',', $httpcodes_expected).'] for '.json_encode($opt));
		}
	}

	static private function curlInit(&$opt) {
		$params_ = array();

		if (isset($opt['get_params'])) {
			foreach ($opt['get_params'] as $v => $k) {
				$params_[] = urlencode($v).'='.urlencode($k);
			}
		}

		// TODO redesing find host/port by key in database
		$opt['url'] = StreamLandAPI::$mBaseSvcpURL.$opt['path'].($params_ ? '?'.implode('&',$params_) : '');
//		$opt['url'] = StreamLandAPI::$mBaseSvcpURL.$opt['path'].'?'.implode('&',$params_);

		$curl = curl_init();
		$curl_options = array(
			CURLOPT_URL => $opt['url'],
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
		if (isset($opt['si'])) {
			$curl_options[CURLOPT_HTTPHEADER][] = 'Authorization: SI '.$opt['si'];
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
		$curl = StreamLandAPI::curlInit($opt);
		StreamLandAPI::curlExecute($curl, $opt);
		StreamLandAPI::checkCurlTotalTime($curl, $opt);
		StreamLandAPI::getHttpCodeAndCheck($curl, $opt, array(200,201));
		curl_close($curl);

		if(!$opt['response_json']){
			Log::err("streamlandapi", '[GET] Wrong response on request '.json_encode($opt));
			exit;
		}
		
		return $opt['response_json'];
	}

	static private function requestPost($opt, $skiperror=false) {
		$opt['type'] = 'POST';
		$curl = StreamLandAPI::curlInit($opt);
		StreamLandAPI::curlExecute($curl, $opt);
		StreamLandAPI::checkCurlTotalTime($curl, $opt);
		StreamLandAPI::getHttpCodeAndCheck($curl, $opt, array(200,201));
		curl_close($curl);

		if (!$opt['response_json']) {
			Log::err("streamlandapi", '[POST] Wrong response on request: '.json_encode($opt));
			if ($skiperror) return false;
			exit;
		}
		return $opt['response_json'];
	}

	// new api
	static private function requestPut($opt) {
		$opt['type'] = 'PUT';
		$curl = StreamLandAPI::curlInit($opt);
		StreamLandAPI::curlExecute($curl, $opt);
        StreamLandAPI::checkCurlTotalTime($curl, $opt);
		StreamLandAPI::getHttpCodeAndCheck($curl, $opt, array(200,201));
		curl_close($curl);

        if (!$opt['response_json']) {
			Log::err("streamlandapi", '[PUT] Wrong response on request '.json_encode($opt));
            exit;
        }
        return $opt['response_json'];
	}

	static private function requestDelete($opt) {
		$opt['type'] = 'DELETE';
		$curl = StreamLandAPI::curlInit($opt);
		StreamLandAPI::curlExecute($curl, $opt);
		StreamLandAPI::checkCurlTotalTime($curl, $opt);
		StreamLandAPI::getHttpCodeAndCheck($curl, $opt, array(204));
		curl_close($curl);

		if ($opt['response'] != '') {
			Log::err("streamlandapi", '[DELETE] Wrong response on request '.json_encode($opt));
		}
		return $opt['httpcode'];
	}

    static function getAllCamsTokenMeta($token) {
        return StreamLandAPI::requestGet(array(
			'path' => 'api/v5/meta/',
			'get_params' => array(),
 			'si' => $token
		));
    }

    static function cameraResolverService($url, $serialnumber, $gspassword, $token, $username, $password) {
        $params = ['serial_id'=>$serialnumber, 'password'=>$gspassword, 'access_token'=>$token];
        return StreamLandAPI::requestPut(array(
		'path' => $url,
		'json_data' => $params
	));
    }

}
