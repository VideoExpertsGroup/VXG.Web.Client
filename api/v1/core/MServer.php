<?php
include_once('MCore.php');
include_once('MUser.php');
include_once('MCamera.php');
include_once(dirname(dirname(dirname(__FILE__))).'/streamland_api.php');

class MServer{
    public static function getServerListByUser($user){
        $server = $user->getServerData();

        if (!StreamLandAPI::generateServicesURLs($server['serverHost'], $server['serverPort'], $server['serverLkey']))
            error(555, 'Failed generateServicesURLs');

        $response_cloud = StreamLandAPI::getServerList();
        if (isset($response_cloud['errorDetail'])) 
            error(556, 'Failed to get servers list : '. $response_cloud['errorDetail']);

        $ret = [];
        foreach($response_cloud['objects'] as $server){
            $ret[$server['id']] = new MServer();
            $ret[$server['id']]->server = $server;
            $ret[$server['id']]->owner = $user;
        }
        return $ret;
    }

    public static function getCamerasListByUser($server_id, $user){
        $servers = MServer::getServerListByUser($user);
        $ret = [];
        foreach($servers as $server){
            if ($server->server['online'] && $server->server['id']==$server_id) {
                if (!StreamLandAPI::generateServicesURLs($server->server['api_endpoint'], null, $server->server['l_key']))
                    error(555, 'Failed generateServicesURLs');

                $cameras = StreamLandAPI::getCamerasList();
                if (!$cameras || !$cameras['objects']) return;
                foreach($cameras['objects'] as $c){
                    $ret[$c['id']] = new MCamera();
                    $ret[$c['id']]->camera = $c;
                    $ret[$c['id']]->owner = $user;
                }
                return $ret;
            }
        }

    }
}
