<?php
include_once('MCore.php');
include_once('MUser.php');
//include_once('MServer.php');
include_once(dirname(dirname(dirname(__FILE__))).'/streamland_api.php');


/**
 * Class for working cameras.
 * Used "camera" and "userCamera" tables
 */

class MCamera{

    public $user = null;
    /*************************************************************************************************************/
    /* Static methods area                                                                                       */
    /*************************************************************************************************************/

    /**
     * Get camera by camera id. If $user exist, then will be loaded correspond 'userCamera' row
     * 
     * @param integer|array $camera_id id of camera from 'camera' table, or array with ids
     * @param MUser $user user for cameras, or null
     * @return boolean|array|MCamera array of MCamera or one MCamera object or false
     */
    public static function getCameraByChannelIdAndUser($camera_id, $user = null){
        if (!$camera_id) return false;
        $cams = [];
        if (is_numeric($camera_id) && 0+$camera_id>0)
            $cams[] = 0+$camera_id;
        else if (is_array($camera_id))
            foreach($camera_id as $cid)
                $cams[] = 0+$cid;
        if (!count($cams)) return false;
        $ret = [];
        $c = MCore::$core->pdo->fetchAll('SELECT * FROM "camera" WHERE "channelID" in ('.implode(',',$cams).')');
        if (!$c || !isset($c[0]))
            return false;
        $camids=[];
        if ($user) $parent_user = $user->getParentUser();
        foreach($c as $cm){
            if (($user && $user->isDealer() && $cm['userID']!=$user->id) || ($user && $user->isUser() && (!$parent_user || $cm['userID']!=$parent_user->id))) continue;
            $camids[] = $cm['id'];
            $ret[$cm['channelID']] = new MCamera();
            $ret[$cm['channelID']]->camera = $cm;
            $ret[$cm['channelID']]->owner = MUser::getUserById($cm['userID']);
        }

        if ($user instanceof MUser){
            $uc = MCore::$core->pdo->fetchAll('SELECT uc.* FROM "userCamera" uc
                WHERE uc."userID" = ? AND uc."cameraCHID" in ('.implode(',',$cams).')',[$user->id]);
            if ($uc && isset($uc[0]))
                foreach($uc as $c){
                    $ret[$c['cameraCHID']]->userCamera = $c;
                    $ret[$c['cameraCHID']]->user = $user;
                }
        }
        if (!is_array($camera_id))
            return array_shift($ret);
        return $ret;
    }
 
    /**
     * Return count of cameras with selected stripe plan id for dealer
     * 
     * @param string $plan_id stripe plan (price) id
     * @param MUser $user dealer
     * @return int count of cameras
     */
    public static function getCountOfCamerasByPlanID($plan_id, $user){
        if (!$user || !$user->isDealer()) return 0;
        return fetchOne('select count(*) as count from "camera" WHERE "planID"=? and "userID"=?',[$plan_id,$user->id]);
    }

    /**
     * Return count of cameras with selected stripe plan id for dealer
     * 
     * @param string $plan_id stripe plan (price) id
     * @param MUser $user dealer
     * @return int count of cameras
     */
    public static function getCamerasByPlanIdAndOwner($plan_id, $user){
        if (!$user || !$user->isDealer()) return [];
        if (!$plan_id) return [];
        $ret = [];
        $c = MCore::$core->pdo->fetchAll('SELECT * FROM "camera" WHERE "planID"=? and "userID"=?',[$plan_id, $user->id]);
        if (!$c || !isset($c[0]))
            return [];
        foreach($c as $cm){
            $ret[$cm['id']] = new MCamera();
            $ret[$cm['id']]->camera = $cm;
            $ret[$cm['id']]->owner = $user;
        }
        return $ret;
    }

    /**
     * Get all cameras for dealer
     * 
     * @param MUser user for cameras
     * @return boolean|array array of MCamera or one MCamera object or false
     */
    public static function getAllCamerasByDealer(MUser $dealer, $limit, $offset, $filter, &$total){
        $req = [$dealer->id];
        
        if (is_array($filter)&&count($filter)>0){
            $req[] = implode ('~@~',$filter);
            $filter =  " and location in (select regexp_split_to_table(?, '~@~'))";
        } else $filter = '';

        $total = MCore::$core->pdo->fetchOne('SELECT count(*) FROM "camera" WHERE "userID"=?'.$filter,$req);
        $req[] = $limit;
        $req[] = $offset;
        $c = MCore::$core->pdo->fetchAll('SELECT * FROM "camera" WHERE "userID"=? '.$filter.' order by "id" DESC limit ? offset ?',
            $req);
        if (!$c || !isset($c[0]))
            return [];
        $ret = [];
        foreach($c as $cam){
            $ret[$cam['id']] = new MCamera();
            $ret[$cam['id']]->camera = $cam;
            $ret[$cam['id']]->owner = $dealer;
        }        
        return $ret;
    }

    /**
     * Get all cameras with expired subscription for user
     * 
     * @param MUser user for cameras
     * @return boolean|array array of MCamera or one MCamera object or false
     */
    public static function getAllCamerasByUser(MUser $user, $filter){
        if (!$user->isUser()) return [];

        $req = [$user->id];

        if (is_array($filter)&&count($filter)>0){
            $req[] = implode ('~@~',$filter);
            $filter =  "and uc.\"cameraCHID\" in (select \"channelID\" from camera cam where cam.location in (select regexp_split_to_table(?, '~@~')))";
        } else $filter = '';

        $userCamera = MCore::$core->pdo->fetchAll('SELECT uc.* FROM "userCamera" uc WHERE uc."userID" = ? '.$filter.' order by uc."id" desc',$req);
        if (!$userCamera || !isset($userCamera[0]))
            return [];
        $ret = [];
        foreach($userCamera as $uc){
            $ret[$uc['cameraCHID']] = new MCamera();
            $ret[$uc['cameraCHID']]->userCamera = $uc;
            $ret[$uc['cameraCHID']]->owner = $user->getParentUser();
        }        
        $c = MCore::$core->pdo->fetchAll('SELECT * FROM "camera" WHERE "channelID" in ('.implode(',',array_keys($ret)).')');
        if ($c) foreach($c as $cm){
            $ret[$cm['channelID']]->camera = $cm;
        }
        return $ret;
    }

    /**
     * Return a list of plans with IDs not in the given list
     * 
     * @param array $plan_ids array with plan identifiers
     * @param MUser $user dealer
     * @return array list of MCamera
     */
    public static function getCamerasWithOtherPlanIdAndOwner($plan_ids, $user){
        if (!$user || !$user->isDealer()) return [];
        $plan_ids[]='';
        $ps ="'". implode("','", $plan_ids)."'";
        $c = MCore::$core->pdo->fetchAll('SELECT * FROM "camera" WHERE "planID" not in ('.$ps.') and "userID"=?',[$user->id]);
        if (!$c || !isset($c[0]))
            return [];
        foreach($c as $cm){
            $ret[$cm['id']] = new MCamera();
            $ret[$cm['id']]->camera = $cm;
            $ret[$cm['id']]->owner = $user;
        }
        return $ret;
    }
/*
    public function updateLimits($expired=null){
        if ($expired===null) $expired = time()+60*60*24*31;
        $param['expire'] = $expired ? date("Y-m-d\TH:i:s.000", $expired) : null;
        $server = $this->owner->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed generateServicesURLs');

//        error_log('Set limits for camera '.$this->camera['channelID']. json_encode($param));
        $ret = StreamLandAPI::setLimits($this->camera['channelID'], $param);
        if (isset($ret['status']) && $ret['status']!=200)
            error(550, $ret['errorDetail']);
        if (!isProduction()){
            if (!isset(MCore::$core->response['clouddebug'])) MCore::$core->response['clouddebug'] = [];
            MCore::$core->response['clouddebug'][] = ['lkey'=>$server['serverLkey'], 'link'=>$server['serverHost'].':'.$server['serverPort'].'/api/v3/channels/'.$this->camera['channelID'].'/limits/', 'request'=>$param, 'response'=>$ret];
        }

        openlog("*** Limits for camera ".$this->camera['channelID']." ", LOG_PID | LOG_PERROR, LOG_LOCAL0);
        syslog(LOG_NOTICE, (isset($this->owner) ? $this->owner->email : '').' '.json_encode($param));
        closelog();
    }
*/
    public static function createCamera($owneruser, $camera_name, $location,  $recording, $timezone, $url, $username, $password, $lat, $lon, $onvif_rtsp_port_fwd=0, $as_storage=false, $rsid=0){
        if (strlen($camera_name)>64)
            error(501,'Camera name too long');
        if (strlen($location)>64)
            error(501,'Location too long');
        if (strlen($username)>64)
            error(501,'User name too long');
        $channelData = array(
            'name' => $camera_name,
            'rec_mode' => 'on', //$recording ? 'on' : 'off',
            'timezone' => $timezone
            //'source' => []
        );
        if ($url || $onvif_rtsp_port_fwd) {
            $channelData['source'] = array(); 
            if ($url){
                    $channelData['source']['url'] = $url;
                if ($username)
                    $channelData['source']['login'] = $username;
                if ($password) 
                    $channelData['source']['password'] = $password;
            }
            if ($onvif_rtsp_port_fwd) $channelData['source']['onvif_rtsp_port_fwd'] = 0+$onvif_rtsp_port_fwd;
        }
        $channelData['meta'] = ['capture_id' => MCore::$core->config['capture_id']];
        if ($as_storage) $channelData['meta']['isstorage']='isstorage';
        if ($rsid) $channelData['meta']['rsid']=$rsid;
//        if ($location)
//            $channelData['meta']['L+'.$location] = $location;

// TODO: support isMobileStream flag
//        function rand_s4() {return substr(('0000' . intval(mt_srand((double)microtime()*0x10000), 16)), -4);}
//        if (isset(StaticLib::$REQUEST['isMobileStream']))
//        $channelData['uuid'] = 'webcam-'.rand_s4() . rand_s4() . '-' . rand_s4() . '-' . rand_s4() . '-' . rand_s4() . '-' . rand_s4() . rand_s4() . rand_s4();

        $server = $owneruser->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed generateServicesURLs');

        $response_cloud = StreamLandAPI::createChannel($channelData);
        if (isset($response_cloud['errorDetail'])) 
            error(556, 'Failed to create channel error : '. $response_cloud['errorDetail']);

        // Check rtsp port, for server (not a cloud)
        if ($onvif_rtsp_port_fwd && !isset($response_cloud['source']['onvif_rtsp_port_fwd'])){
            $req = ['url'=>$url,'name'=>$camera_name,'login'=>$username,'password'=>$password,'onvif_rtsp_port_fwd'=>0+$onvif_rtsp_port_fwd];
            $resp = StreamLandAPI::updateChannelV2($response_cloud['id'], $req);
        }
        if ($lat || $lon){
            $req = ['latitude'=>$lat,'longitude'=>$lon];
            $resp = StreamLandAPI::updateChannelV2($response_cloud['id'], $req);
        }
    
        if ($location)
            MCamera::updateLocationByChannelID($response_cloud['id'], $owneruser, $location);

        if (isset(MCore::$core->config['no_local_add_camera']) && MCore::$core->config['no_local_add_camera']) {
            $ret = new MCamera();
            $ret->camera = ['channelID'=>$response_cloud['id'],'tz'=>$response_cloud['timezone'],'rwToken'=>$response_cloud['access_tokens']['all'],'roToken'=>$response_cloud['access_tokens']['watch']];
            $ret->owner = $owneruser;
            $ret->setLimits(MConstants::DEFAULT_PLAN, $as_storage);
            return $ret;
        }

        query('INSERT INTO camera '.
            '("userID","channelID",name,location,url,username,password,tz,"rwToken","roToken","isRecording",lat,lon,"onvifRtspPort")'.
            ' VALUES(?,?,?,?,?,?,?,?,?,?,'.($recording?'TRUE':'FALSE').',?,?,?)',
            [$owneruser->id, $response_cloud['id'], $camera_name, $location, ''.$url, ''.$username, ''.$password, $timezone,
                $response_cloud['access_tokens']['all'], $response_cloud['access_tokens']['watch'], $lat ? 0+$lat : 0, $lon ? 0+$lon : 0, $onvif_rtsp_port_fwd]);

        $camera = MCamera::getCameraByChannelIdAndUser($response_cloud['id'], $owneruser);

        if (!$camera) return $camera;
        $camera->setLimits(MConstants::DEFAULT_PLAN, $as_storage);
//TODO: REMOVE IT
//        $camera->createAIToken();
//        $camera->setAITokenLimit();
        return $camera;
    }

    public static function getCameraType($channel_id) {
        if (!$channel_id) return false;
        $type = MCore::$core->pdo->fetchOne('SELECT "type" FROM "camera" WHERE "channelID"=?', [$channel_id]);
        return $type;
    }

    public static function getRetention($channel_id, $user_from){
        $server = $user_from->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed generateServicesURLs');


        $channel = StreamLandAPI::getChannel($channel_id);
        if (isset($channel['errorDetail'])) 
            error(556, 'Failed to get channel: '. $channel['errorDetail']);

        $response_cloud = StreamLandAPI::getChannelV2($channel_id);
        $cameraType = MCamera::getCameraType($channel_id);
        $sdCardEnabled = $cameraType == 1? true : false;
        if (isset($response_cloud['errorDetail'])) 
            error(556, 'Failed to get channel: '. $response_cloud['errorDetail']);
        $limits = StreamLandAPI::getLimits($channel_id);
        if (isset($limits['errorDetail'])) 
            error(556, 'Failed to get limits: '. $limits['errorDetail']);
        if ($channel['rec_mode']=='server_by_event') $channel['rec_mode']='by_event';
        return ['type'=>$channel['rec_mode'], 'recording'=> (isset($response_cloud['memorycard_recording']) && $response_cloud['memorycard_recording']?1:0), 'sdCardEnabled'=> $sdCardEnabled, 'time'=>$limits['records_max_age']];
    }

    public static function setRetention($channel_id, $user_from, $rec_mode, $recording, $time){
        $server = $user_from->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed generateServicesURLs');

        $data = ['rec_mode'=>$rec_mode];

        if ($rec_mode=='by_event'){
            $channel = StreamLandAPI::getChannel($channel_id);
            if (isset($channel['errorDetail'])) 
                error(556, 'Failed to get channel: '. $channel['errorDetail']);
            if (substr($channel['source']['url'],0,4)=='onvi' || substr($channel['source']['url'],0,4)=='http')
                $data = ['rec_mode'=>'server_by_event'];
        }

        $channel = StreamLandAPI::updateChannel($channel_id,$data);
        if (isset($channel['errorDetail'])) 
            error(556, 'Failed to update channel: '. $channel['errorDetail']);

        $data = ['memorycard_recording'=>($recording?true:false)];
        // types 1 -> sd 0 -> cloud
        $type = $recording?1:0;
        query('UPDATE camera SET "type"=? WHERE "channelID"=?', [$type, $channel_id]);

        $response_cloud = StreamLandAPI::updateChannelV2($channel_id, $data);
        if (isset($response_cloud['errorDetail'])) 
            error(556, 'Failed to update channel2: '. $response_cloud['errorDetail']);

        $data = ['records_max_age'=>$time,'meta_max_age'=>$time,'storage_size'=>null,'download_size'=>null, 'live_size'=>null];
        if ($time<=0){
            $data['records_max_age']=720;
            $data['meta_max_age']=720;
            $data['download_size']=20;
        }


        $limits = StreamLandAPI::setLimits($channel_id, $data);
        if (isset($limits['errorDetail'])) 
            error(556, 'Failed to get limits: '. $limits['errorDetail']);
    }

    public static function updateLocationByChannelID($channel_id, $user_from, $location){

        if (strlen($location)>64)
            error(501,'Location too long');
        $server = $user_from->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed generateServicesURLs');

        $response_cloud = StreamLandAPI::getChannel($channel_id);
        if (isset($response_cloud['errorDetail'])) 
            error(556, 'Failed to get channel: '. $response_cloud['errorDetail']);
        $meta = isset($response_cloud['meta']) ? $response_cloud['meta'] : [];

// to remove old locations
        $user_from->removeAllLocationFromAllCamsTokenMeta();
        foreach ($meta as $i=>$m)
            if (substr($i,0,2)=='L+'){
// used new location method                
//                $user_from->removeLocationFromAllCamsTokenMeta($meta[$i]);
                unset($meta[$i]);
            }
        unset($meta['location']);
        if ($location){
            $meta['L+'.md5($location)] = $location;
            $meta['location'] = $location;
        }

        if (!$meta) $meta = null;
        $response_cloud = StreamLandAPI::updateChannel($channel_id, ['meta'=>$meta]);
        if (isset($response_cloud['errorDetail'])) 
            error(556, 'Failed to update channel: '. $response_cloud['errorDetail']);

// used new location method                
//        if ($location)
//            $user_from->addLocationToAllCamsTokenMeta($location);
    }

    public function updateCamera($camera_name, $location,  $recording, $timezone, $url, $username, $password, $lat, $lon, $onvif_rtsp_port_fwd=0){
        MCamera::updateCameraByChannelID($this->camera['channelID'], $this->owner, $camera_name, $recording, $timezone, $url, $username, $password, $onvif_rtsp_port_fwd=0);
    
        query('UPDATE camera SET "name"=?,"location"=?,"url"=?,"username"=?,"password"=?,"tz"=?,"lat"=?,"lon"=?,"onvifRtspPort"=? WHERE "channelID"=?',
            [$camera_name, $location, ''.$url, ''.$username, ''.$password, $timezone, $lat ? 0+$lat : 0, $lon ? 0+$lon : 0, $onvif_rtsp_port_fwd ? 0+$onvif_rtsp_port_fwd : 0, $this->camera['channelID']]);
        MCamera::updateLocationByChannelID($this->camera['channelID'], $this->owner, $location);
    }

    public static function updateCameraByChannelID($channel_id, $user_from, $camera_name, $recording, $timezone, $url, $username, $password, $onvif_rtsp_port_fwd=0){
        if (strlen($camera_name)>64)
            error(501,'Camera name too long');
        if (strlen($username)>64)
            error(501,'User name too long');
        $channelData = array(
            'name' => $camera_name,
            'rec_mode' => 'on', //$recording ? 'on' : 'off',
            'timezone' => $timezone,
            'source' => []
        );
        if ($onvif_rtsp_port_fwd) $channelData['source']['onvif_rtsp_port_fwd'] = 0+$onvif_rtsp_port_fwd;
        if ($url) {
            $channelData['source']['url'] = $url;
            if ($username)
                $channelData['source']['login'] = $username;
            if ($password) 
                $channelData['source']['password'] = $password;
        }
        if (!$channelData['source']) unset($channelData['source']);

        $server = $user_from->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed generateServicesURLs');
/*
        $response_cloud = StreamLandAPI::getChannel($channel_id);
        $meta = is_array($response_cloud['meta']) ? $response_cloud['meta'] : [];
        foreach ($meta as $i=>$m)
            if (substr($m,0,2)=='L+')
                unset($meta[$i]);
        $meta['L+'.md5($location)] = $location;
*/

        $response_cloud = StreamLandAPI::updateChannel($channel_id, $channelData);
        if (isset($response_cloud['errorDetail'])) 
            error(556, 'Failed to update channel error : '. $response_cloud['errorDetail']);


//        $m = StreamLandAPI::getAllCamsToken($user_from->allCamsTokenID);
    }

    public function setLimits($limits = MConstants::DEFAULT_PLAN, $as_storage=false){
        if (!isset($limits['expired'])){
            $expired_date = new DateTime();
            $expired_date->add(new DateInterval('P1M'));
            $expired = $expired_date->getTimestamp();
            $limits['expired'] = date("Y-m-d\TH:i:s.000", $expired);
        } else
            $expired = strtotime($limits['expired']);
    
        $server = $this->owner->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed generateServicesURLs');
        $param = MConstants::DEFAULT_PLAN;
        if (isset($limits["storage_size"])) $param["storage_size"] = $limits["storage_size"];
        if (isset($limits["download_size"])) $param["download_size"] = $limits["download_size"];
        if (isset($limits["live_size"])) $param["live_size"] = $limits["live_size"];
        if (isset($limits["records_max_age"])) $param["records_max_age"] = $limits["records_max_age"];
        if (isset($limits["gen_images_size"])) $param["gen_images_size"] = $limits["gen_images_size"];
        if (isset($limits["gen_images_amount"])) $param["gen_images_amount"] = $limits["gen_images_amount"];
        if (isset($limits["gen_liveimages_size"])) $param["gen_liveimages_size"] = $limits["gen_liveimages_size"];
        if (isset($limits["gen_liveimages_amount"])) $param["gen_liveimages_amount"] = $limits["gen_liveimages_amount"];
        if (isset($limits["expired"])) $param["expire"] = $limits["expired"];
        if (!$as_storage) $param["meta_max_age"] = $param["records_max_age"];
        else {
            $param["meta_max_age"]=0;
            $param["records_max_age"]=null;
            $param["storage_size"]=3;
        }

        foreach($param as $i=>$v){
            if (''.floatval($v) == $v)
                $param[$i] = floatval($v);
            if ($v=="null")
                $param[$i] = null;
        }


//        error_log('Set limits for  camera '.$this->camera['channelID']. json_encode($param));        
        $ret = StreamLandAPI::setLimits($this->camera['channelID'], $param);
        if (isset($ret['status']) && $ret['status']!=200) {
            if ($ret['errorType']!="invalid_auth")
                error_log('Fail to set limit for camera '.$this->camera['channelID'].': '.$ret['errorDetail']);
            else 
                error_log('invalid server key '.$server['serverLkey'].' from user '.$this->owner->email.' Set expired for camera '.$this->camera['channelID'].' to '.$expired);

            openlog("*** Limits for camera ".$this->camera['channelID']." ", LOG_PID | LOG_PERROR, LOG_LOCAL0);
            syslog(LOG_NOTICE, 'FAILED '.(isset($this->owner) ? $this->owner->email : '').' '.json_encode($ret));
            closelog();
            if ($ret['status']==500)
                return false;
        } else {
            openlog("*** Limits for camera ".$this->camera['channelID']." ", LOG_PID | LOG_PERROR, LOG_LOCAL0);
            syslog(LOG_NOTICE, (isset($this->owner) ? $this->owner->email : '').' '.json_encode($param));
            closelog();
        }

        query('UPDATE "camera" set "planExpired"=? WHERE "channelID"=?', [$expired, $this->camera['channelID']]);

        if (!isProduction()){
            if (!isset(MCore::$core->response['clouddebug'])) MCore::$core->response['clouddebug'] = [];
            MCore::$core->response['clouddebug'][] = ['lkey'=>$server['serverLkey'], 
            'link'=>$server['serverHost'].':'.$server['serverPort'].'/api/v3/channels/'.$this->camera['channelID'].'/limits/', 
            'request'=>$param, 'response'=>$ret];
        }
        return true;
        //$this->setAITokenLimit($limits);   
    }

    public function removeAIToken(){
        if (!isset($this->camera['aiGroupTokenID']) || !$this->camera['aiGroupTokenID'])
            return;

        $server = $this->owner->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed generateServicesURLs');
        $rc = StreamLandAPI::deleteGroupToken($this->camera['aiGroupTokenID']);
        if (!($rc == 200 || $rc == 204 || $rc == 404))
            error_log('Failed to delete group token with id '.$this->camera['aiGroupTokenID']);

        $this->camera['aiGroupToken'] = '';
        $this->camera['aiGroupTokenID'] = 0;
        query('UPDATE "camera" set "aiGroupToken"=?,"aiGroupTokenID"=? WHERE "channelID"=?', ['', 0 , $this->camera['channelID']]);
    }

    public function createAIToken($limits = null, $type = null){
        if (!$limits) $limits = MConstants::DEFAULT_PLAN['ai_process_period'];

        $name = $type ? $type . "_ai" : (string) $this->camera['channelID'];
        $aiAccessKey = MCore::$core->config['ai_access_key'];
        $aiSecretKey = MCore::$core->config['ai_secret_key'];
        $aiDetThresh = MCore::$core->config['ai_det_threshold'];

        if (!$aiAccessKey || !$aiSecretKey || !$aiDetThresh) {
            error(550, "Ai params not set.");
        }

        $ai_params = $type == "by_event" ? 
        '{"poll_method": "one_token_many_cam", "filter": "undefined", "access_key":"'.$aiAccessKey.'","secret_key":"'.$aiSecretKey.'","det_threshold":'.$aiDetThresh.'}' :
        '{"access_key":"'.$aiAccessKey.'","secret_key":"'.$aiSecretKey.'", "det_threshold":'.$aiDetThresh.', "poll_method": "one_token_many_cam", "filter": "recording_thumbnail"}';

        $GroupToken = array(
            'name' => $name,
            'max_channels_amount' => null,
            'channels' => array($this->camera['channelID']),
            'ai_targeted' => true,
            'meta'=>
            array(
                'ai_engine' => 'aws',
                'ai_period' => $limits, 
                'ai_type'   => 'object_and_scene_detection',   
                'ai_params' => $ai_params,
            ),
        );

        $imagePeriod = $type != 'continuous' ? null : 180;
        $imageGenParam = array(
            'image_generation_period' => $imagePeriod
        );

        $channel = StreamLandAPI::getChannel($channel_id);
        $access_token = $channel['access_tokens']['all'];

        $ret = StreamLandAPI::SetChannelParams($imageGenParam,$access_token);
        if (isset($ret['image_generation_period']) && $ret['image_generation_period'] != $imagePeriod)
            error(550, $ret['errorDetail']);

        if (isset(MCore::$core->config['ai_adapter']['dev']) && MCore::$core->config['ai_adapter']['dev'] === true)
            $GroupToken['meta']['ai_development'] = true;
	
        $ret = StreamLandAPI::CreateGroupToken($GroupToken);
        if (isset($ret['status']) && $ret['status']!=200)
            error(550, $ret['errorDetail']);

        // Add the group token for AI to the current camera 
        // Our relation is One camera to one Group token     
        $group_token = $ret['token'];
        $group_token_id = $ret['id'];
        $this->camera['aiGroupToken'] = $group_token;
        // TODO Story aiGroupTokenID to data base
        $this->camera['aiGroupTokenID'] = $group_token_id;
        query('UPDATE "camera" set "aiGroupToken"=?,"aiGroupTokenID"=? WHERE "channelID"=?', [$group_token, $group_token_id , $this->camera['channelID']]);
        // TODO , we do not handle this error 

        return true;
    }

    public function createAITokenByChannelId($channel_id, $user_from, $limits = null, $type = null) {
        $server = $user_from->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed to creating camera channel. reason: generateServicesURLs');
            
        if (!$limits) $limits = MConstants::DEFAULT_PLAN['ai_process_period'];

        $name = $type ? $type . "_ai" : (string) $channel_id;
        $aiAccessKey = MCore::$core->config['ai_access_key'];
        $aiSecretKey = MCore::$core->config['ai_secret_key'];
        $aiDetThresh = MCore::$core->config['ai_det_threshold'];

        if (!$aiAccessKey || !$aiSecretKey || !$aiDetThresh) {
            error(550, "Ai params not set.");
        }

        $ai_params = $type == "by_event" ? 
        '{"poll_method": "one_token_many_cam", "filter": "undefined", "access_key":"'.$aiAccessKey.'","secret_key":"'.$aiSecretKey.'","det_threshold":'.$aiDetThresh.'}' :
        '{"access_key":"'.$aiAccessKey.'","secret_key":"'.$aiSecretKey.'", "det_threshold":'.$aiDetThresh.', "poll_method": "one_token_many_cam", "filter": "recording_thumbnail"}';

        $GroupToken = array(
            'name' => $name,
            'max_channels_amount' => null,
            'channels' => array($channel_id),
            'ai_targeted' => true,
            'meta'=>
            array(
                'ai_engine' => 'aws',
                'ai_period' => $limits, 
                'ai_type'   => 'object_and_scene_detection',   
                'ai_params' => $ai_params,
            ),
        );

        $imagePeriod = $type != 'continuous' ? null : 180;
        $imageGenParam = array(
            'image_generation_period' => $imagePeriod
        );

        $channel = StreamLandAPI::getChannel($channel_id);
        $access_token = $channel['access_tokens']['all'];

        $ret = StreamLandAPI::SetChannelParams($imageGenParam,$access_token);
        if (isset($ret['image_generation_period']) && $ret['image_generation_period'] != $imagePeriod)
            error(550, $ret['errorDetail']);

        // TODO: find out where we get the AI params from

        if (isset(MCore::$core->config['ai_adapter']['dev']) && MCore::$core->config['ai_adapter']['dev'] === true)
            $GroupToken['meta']['ai_development'] = true;
	
	
        $ret = StreamLandAPI::CreateGroupToken($GroupToken);
        if (isset($ret['status']) && $ret['status']!=200)
            error(550, $ret['errorDetail']);
        
        $group_token = $ret['token'];
        $group_token_id = $ret['id'];
        query('UPDATE "camera" set "aiGroupToken"=?,"aiGroupTokenID"=? WHERE "channelID"=?', [$group_token, $group_token_id , $channel_id]);
 
        return true;
    }

    
    public function setAITokenLimit($limits = null, $expired = '2099-12-31T00:00:00.000000'){
        // We takes expired from limits 

        // $this->camera['channelID']
        // Update group token
        //error_log("1.".isset($this->camera['aiGroupTokenID'])."   2.".($this->camera['aiGroupTokenID']==0)." 3. ".$this->camera['aiGroupTokenID']);
        if (!isset($this->camera['aiGroupTokenID']) || !$this->camera['aiGroupTokenID']){
            if (!$limits) return;
            $this->createAIToken($limits);
        } else if (!$limit){
            $this->removeAIToken();
            return;
        }

        $GroupToken = array(
            'ai_targeted' => true,
            'meta'=>
            array(
                'ai_period' => $limits['ai_process_period'], 
                'ai_engine' => 'aws',
                'ai_type'   => 'object_and_scene_detection', 
                'ai_params' => '{"access_key":"","secret_key":"","det_threshold":0.5}',
                //array (
                //    'access_key' => '',  
                //    'secret_key' => '', 
                //    'det_threshold' => 0.5,
                //),
              ),
        );

        if (!isset($limits['expired']))
        {
            $expired_date = new DateTime();
            $expired_date->add(new DateInterval('P1M'));
            $expired_date->add(new DateInterval('P1D'));
            $limits['expired'] = date("Y-m-d\TH:i:s", $expired_date->getTimestamp());
        }
        

        if (isset(MCore::$core->config['ai_adapter']['dev']) && MCore::$core->config['ai_adapter']['dev'] === true)
            $GroupToken['meta']['ai_development'] = true;


        $ret = StreamLandAPI::UpdateGroupToken($this->camera['aiGroupTokenID'],$GroupToken);
        if (isset($ret['status']) && $ret['status']!=200)
            error(550, $ret['errorDetail']);

        // Step 2
        // Set production mode for this camera 
        $GroupToken = array(
            'group_token'   => $this->camera['aiGroupToken'],
            'attempt_limit' => $limits['ai_process_amount'],
            'key_type'      => "prod",
            'time_limit'   =>  $limits['expired'], // We do not have limit dev
        );

        $url =  "http://18.234.111.159:1111/v2/settings/tokens/";
        if (MCore::$core->config['ai_adapter']['host'])
            $url =  MCore::$core->config['ai_adapter']['host']."/v2/settings/tokens/";

        $ret =  json_encode($GroupToken);
        $ch=curl_init($url);
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $ret, CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true,
            CURLOPT_HTTPHEADER => ['Content-Type:application/json', 'Content-Length: ' . strlen($ret)]]);
        $result = curl_exec($ch);
        curl_close($ch);

        // Step 3
        // Set Image generation for defined camera
        // https://web.skyvr.videoexpertsgroup.com/api/v4/channel/
        //image_generation_period: 60
        $ChannelParams = array(
            'image_generation_period' => $limits['gen_liveimages_period'],
        );

        $ret = StreamLandAPI::SetChannelParams($ChannelParams,$this->camera['rwToken']);
        if (isset($ret['image_generation_period']) && $ret['image_generation_period'] != $limits['gen_liveimages_period'])
            error(550, $ret['errorDetail']);
    }
    
    public function setAIConfigByChannelID($channel_id, $type, $targetToken, $currentToken) {
        if (!$targetToken) {
            if ($type != 'off') {
                $aiPeriod = $type == 'continuous' ? 180 : 10;
                if(!MCamera::createAITokenByChannelId($channel_id, MCore::$core->current_user, $aiPeriod, $type))
                    error(500, 'Error creating AI token for this camera');
            }
        } else {
            if ($type != 'off' ) {
                if ($currentToken) {
                    if ($targetToken['id'] != $currentToken['id']) {
                        $tokenChannels = $currentToken['channels'];
                        $key = array_search($channel_id, $tokenChannels);
                        unset($tokenChannels[$key]);
                        $params = ['channels' => $tokenChannels];
                        if(!MCamera::addChannelToGroupTokenByID($currentToken['id'], $channel_id, MCore::$core->current_user, $params, $type, true)) 
                            error(500, 'Error removing this camera from AI token');
                    } 
                }

                $tokenChannels = $targetToken['channels'];
                if (!in_array($channel_id, $tokenChannels)) {
                    array_push($tokenChannels, $channel_id);
                    $params = ['channels' => $tokenChannels];
                    if(!MCamera::addChannelToGroupTokenByID($targetToken['id'], $channel_id, MCore::$core->current_user, $params, $type)) 
                        error(500, 'Error adding this camera to AI token');
                }
            } else {
                $tokenChannels = $targetToken['channels'];
                if (($key = array_search($channel_id, $tokenChannels)) !== false) {
                    unset($tokenChannels[$key]);
                    $params = ['channels' => $tokenChannels];
                    if(!MCamera::addChannelToGroupTokenByID($targetToken['id'], $channel_id, MCore::$core->current_user, $params, $type)) 
                        error(500, 'Error removing this camera from AI token');
                }
            }
        }

        return true;
    }

    public function addChannelToGroupTokenByID($tokenid, $channel_id, $user_from, $params, $type, $toggling = false) {
        $server = $user_from->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed to creating camera channel. reason: generateServicesURLs');
        
        // if we're switching from one ai type to another, no need to reset these params
        if (!$toggling) {
            $imagePeriod = $type == 'off' ? null : 180;
            $imageGenParam = array(
                'image_generation_period' => $imagePeriod
            );
    
            $channel = StreamLandAPI::getChannel($channel_id);
            $access_token = $channel['access_tokens']['all'];
    
            $ret = StreamLandAPI::SetChannelParams($imageGenParam,$access_token);
            if (isset($ret['image_generation_period']) && $ret['image_generation_period'] != $imagePeriod)
                error(550, $ret['errorDetail']);    
        }
        
        $ret = StreamLandAPI::UpdateGroupToken($tokenid, $params);
        if (count(array_diff($ret['channels'],$params['channels'])) != 0) {
            error(550, "Error updating group token");
        }

        $group_token = $type == 'off' || $toggling == true ? null : $ret['token'];
        $group_token_id = $type == 'off' || $toggling == true ? null : $ret['id'];

        query('UPDATE "camera" set "aiGroupToken"=?,"aiGroupTokenID"=? WHERE "channelID"=?', [$group_token, $group_token_id , $channel_id]);

        return true;
    }

    public function getCameraGroupToken() {
        $server = $this->owner->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed generateServicesURLs');

        $token = $this->camera['aiGroupTokenID'];
        $ret = StreamLandAPI::getAllCamsToken($token);
        if (!$ret) error(500, "Error getting group token");
        return $ret;
    }

    public function setPlanID($plan_id, $plan_name, $from_subscribtion_cancel=false){
        $metadata=MConstants::DEFAULT_PLAN;
//        $expired=time()+60*60*24*31;
        $expired_date = new DateTime();
        $expired_date->add(new DateInterval('P1M'));
        $expired = $expired_date->getTimestamp();

        if ($plan_id){
            $maxquantity=0;
            foreach($this->owner->plans as $p){
                if ($p['stripe_plan_id']==$plan_id){
                    $expired = $p['expired'];
                    $maxquantity = $p['paid_quantity'];
                    $metadata = $p['metadata'];
                    break;
                }
            }
            $cameras_count = MCamera::getCountOfCamerasByPlanID($plan_id, $this->owner);
            if ($maxquantity <= $cameras_count)
                error(550, 'This plan is full');
        }
        $metadata['expired'] = date("Y-m-d\TH:i:s.000", $expired);
        $this->setLimits($metadata);
        $this->setAITokenLimit($metadata);
        if ($from_subscribtion_cancel)
            query('UPDATE "camera" set "cancelledPlanID"="planID" WHERE "channelID"=? and "userID"=?', [$this->camera['channelID'], $this->owner->id]);

        query('UPDATE "camera" set "planID"=?, "planExpired"=?, "planName"=? WHERE "channelID"=? and "userID"=?', 
            [$plan_id, $expired, $plan_name, $this->camera['channelID'], $this->owner->id]);
    }

    public static function updateNextExpiredCamera(){
        $cam = MCore::$core->pdo->fetchOne(
            'SELECT "channelID" FROM "camera" WHERE ("planID"=\'\' and "planExpired"<?) or ("planID"<>\'\' and "planExpired"<?) limit 1',
            [time(), time()-MConstants::PROTECTIVE_TIME]);
        if (!$cam) return false;
        $camera = MCamera::getCameraByChannelIdAndUser($cam);
        if ($camera->camera['planID'])
            $camera->setPlanID('','');
        else
            if ($camera->setLimits())
                $camera->setAITokenLimit();
        return true;
    }

    public function checkResolverServiceSerial($serialnumber) {
        $url = MCore::$core->config['camera_resolver_service'] ? MCore::$core->config['camera_resolver_service'] . 's' : 'https://camera.vxg.io/v1/tokens';
        $username = MCore::$core->config['camera_resolver_service_username'];
        $password = MCore::$core->config['camera_resolver_service_password'];

        $ch=curl_init($url);
        curl_setopt_array($ch, [CURLOPT_POST => false, CURLOPT_CUSTOMREQUEST=>'GET', CURLOPT_RETURNTRANSFER => true, CURLOPT_VERBOSE => true,
            CURLOPT_HTTPHEADER => ['Content-Type:application/json', 'Authorization: Basic '. base64_encode($username.':'.$password)]]);

        $result = curl_exec($ch);
        $r = json_decode($result, JSON_OBJECT_AS_ARRAY);
        $code = curl_getinfo($ch,CURLINFO_RESPONSE_CODE);

        if ($code != 200 && $code != 201) return $code;

        $allSerials = array_map(function($s) { return $s['serial_id']; }, $r['tokens']);
        if (in_array($serialnumber, $allSerials)) return false;
        return true;
    }

    public function addToResolverService($serialnumber, $uplinkpassword){
        $url = MCore::$core->config['camera_resolver_service'] ? MCore::$core->config['camera_resolver_service'] : 'https://camera.vxg.io/v1/token';
        $username = MCore::$core->config['camera_resolver_service_username'];
        $password = MCore::$core->config['camera_resolver_service_password'];

        $params =  json_encode(['serial_id'=>$serialnumber, 'password'=>$uplinkpassword, 'access_token'=>$this->camera['rwToken']]);
        $ch=curl_init($url);
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $params, /*CURLOPT_CUSTOMREQUEST=>'PUT',*/ CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true,
            CURLOPT_HTTPHEADER => ['Content-Type:application/json', 'Authorization: Basic '. base64_encode($username.':'.$password), 'Content-Length: ' . strlen($params)]]);
        $result = curl_exec($ch);
        $code = curl_getinfo($ch,CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        if ($code==200 || $code==201)
            return true;
        return false;
    }

    /**
     * Remove this camera
     */
    public function remove(){
        $server = $this->owner->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed to delete camera channel. reason: generateServicesURLs');
        
        $response_cloud = StreamLandAPI::getChannel($this->camera['channelID']);
        if (isset($response_cloud,$response_cloud['meta'],$response_cloud['meta']['rsid'])){
            $url = MCore::$core->config['camera_resolver_service'] ? MCore::$core->config['camera_resolver_service'] : 'https://camera.vxg.io/v1/token';
            $username = MCore::$core->config['camera_resolver_service_username'];
            $password = MCore::$core->config['camera_resolver_service_password'];
    
            $ch=curl_init($url.'?serial_id='.$response_cloud['meta']['rsid']);
            curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST=>'DELETE', CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true,
                CURLOPT_HTTPHEADER => ['Content-Type:application/json', 'Authorization: Basic '. base64_encode($username.':'.$password)]]);
            $result = curl_exec($ch);
            $code = curl_getinfo($ch,CURLINFO_RESPONSE_CODE);
            if ($code != 204) error(554, $code . ": Error removing camera serial number");
            curl_close($ch);
        }

        //$this->removeAIToken();
        // don't remove token because there could be other cameras attached to it
        if (isset($this->camera['aiGroupTokenID']) && $this->camera['aiGroupTokenID'] != 0) {
            // have to remove it from the 
            $channelGroupToken = StreamLandAPI::getAllCamsToken($this->camera['aiGroupTokenID']);
            $tokenChannels = $channelGroupToken['channels'];
            $key = array_search($this->camera['channelID'], $tokenChannels);
            unset($tokenChannels[$key]);
            $ret = StreamLandAPI::UpdateGroupToken($this->camera['aiGroupTokenID'],["channels" => $tokenChannels]);
            if (isset($ret['status']) && $ret['status']!=200)
                error(550, $ret['errorDetail']);
        }

        $rc = StreamLandAPI::deleteChannel($this->camera['channelID']);
        if (!($rc == 200 || $rc == 204 || $rc == 404))
            error(554, 'Failed to delete channel with id '.$this->camera['channelID'].', rc='.$rc);

/*        
        if ($this->camera['aiGroupTokenID']){
            $rc = StreamLandAPI::deleteGroupToken($this->camera['aiGroupTokenID']);
            if (!($rc == 200 || $rc == 204 || $rc == 404))
                error_log('Failed to delete group token with id '.$this->camera['aiGroupTokenID']);
        }
*/
        $uids = MCore::$core->pdo->fetchAll('select "userID" from "userCamera" WHERE "cameraCHID"=?', [$this->camera['channelID']]);

        MCore::$core->pdo->query('DELETE FROM "userCamera" WHERE "cameraCHID"=?', [$this->camera['channelID']]);
        MCore::$core->pdo->query('DELETE FROM "camera" WHERE "channelID"=?', [$this->camera['channelID']]);

        if ($uids) foreach($uids as $uid){
            $user = MUser::getUserById($uid['userID']);
            if (!$user) continue;
            $user->updateAllCamsToken();
        }
        $server = $this->owner->updateAllCamsToken();
    }

    public static function removeByChannelID($channel_id, $user_from){
        $server = $user_from->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed to creating camera channel. reason: generateServicesURLs');
        
        $response_cloud = StreamLandAPI::getChannel($channel_id);
        if (isset($response_cloud,$response_cloud['meta'],$response_cloud['meta']['rsid'])){
            $url = MCore::$core->config['camera_resolver_service'] ? MCore::$core->config['camera_resolver_service'] : 'https://camera.vxg.io/v1/token';
            $username = MCore::$core->config['camera_resolver_service_username'];
            $password = MCore::$core->config['camera_resolver_service_password'];
    
            $ch=curl_init($url.'?serial_id='.$response_cloud['meta']['rsid']);
            curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST=>'DELETE', CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true,
                CURLOPT_HTTPHEADER => ['Content-Type:application/json', 'Authorization: Basic '. base64_encode($username.':'.$password)]]);
            $result = curl_exec($ch);
            $code = curl_getinfo($ch,CURLINFO_RESPONSE_CODE);
            if ($code != 204) error(554, $code . ": Error removing camera serial number");
            curl_close($ch);
        }

        $rc = StreamLandAPI::deleteChannel($channel_id);
        if (!($rc == 200 || $rc == 204 || $rc == 404))
            error(554, 'Failed to delete channel with id '.$channel_id.', rc='.$rc);
       
        $uids = MCore::$core->pdo->fetchAll('select "userID" from "userCamera" WHERE "cameraCHID"=?', [$channel_id]);
        MCore::$core->pdo->query('DELETE FROM "userCamera" WHERE "cameraCHID"=?', [$channel_id]);
        if ($uids) foreach($uids as $uid){
            $user = MUser::getUserById($uid['userID']);
            if (!$user) continue;
            $user->updateAllCamsToken();
        }
    }

    public function getEventsStates(){
        $server = $this->owner->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed to getEventsStates camera channel. reason: generateServicesURLs');

        $rc = StreamLandAPI::getEventProcessingEvents($this->camera['channelID']);
        return $rc;
    }
    public static function getEventsStatesForChannelID($channel_id){
        $server = MCore::$core->current_user->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed to getEventsStates camera channel. reason: generateServicesURLs');

        $rc = StreamLandAPI::getEventProcessingEvents($channel_id);
        return $rc;
    }
    
    public function setEventState($event_name, $state){
        $server = $this->owner->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed to getEventsStates camera channel. reason: generateServicesURLs');

        $rc = StreamLandAPI::setEventProcessingEvents($this->camera['channelID'], $event_name, ['notify'=>$state]);
        return $rc;
    }

    public static function setEventStateForChannelID($channel_id, $event_name, $state){
        $server = MCore::$core->current_user->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed to getEventsStates camera channel. reason: generateServicesURLs');

        $rc = StreamLandAPI::setEventProcessingEvents($channel_id, $event_name, $state);
        return $rc;
    }

    public function createEventState($event_name, $state){
        $server = $this->owner->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed to getEventsStates camera channel. reason: generateServicesURLs');

        $rc = StreamLandAPI::createEventProcessingEvents($this->camera['channelID'], $event_name, $state);
        return $rc;
    }

    public static function createEventStateForChannelID($channel_id, $event_name, $state){
        $server = MCore::$core->current_user->getServerData();
        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed to getEventsStates camera channel. reason: generateServicesURLs');

        $rc = StreamLandAPI::createEventProcessingEvents($channel_id, $event_name, $state);
        return $rc;
    }
}