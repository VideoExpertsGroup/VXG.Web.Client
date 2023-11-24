<?php
/**
 * Class with constants for VXG project
 * 
 * Sample of use:
 * 
 * include_once('MCore.php');
 * 
 * $var = MConstant::CONFIG_FILE;
 */
class MConstants{
    /** Path to config file */
    const CONFIG_FILE = __DIR__."../../../conf.d/config.php";
    const SKIN_CONFIG_FILE = __DIR__."../../../../skin/config.php";

    /** Set true, for include backtrace info into log and into response in debug mode */
    const DEBUG_BACKTRACE_ENABLE = true;

    /** Default HTTP code, returned by core when script exit */
    const DEFAULT_RETURN_HTTP_CODE = 200;

    /** Default HTTP code that is returned when database errors */
    const DEFAULT_PDO_ERROR_HTTP_CODE = 520;
    const DEFAULT_PDO_ERROR_MESSAGE = 'Error on request to DB';

    const DEFAULT_EVENTHOOK_SECRET_KEY = "hookkey";

    const MAX_CAMERAS_PER_USER = 5000;

    const DEFAULT_PLAN = [
        'storage_size' => null, // GB
        'download_size' => null, // GB 
        'live_size' => null, // GB
        'records_max_age' => 0, // hours , retention time
        'meta_max_age' => 0, // hours , retention time
        'gen_images_size' => null, // GB 
        'gen_images_amount' => null,   // We do not generate images from storage  
        'gen_liveimages_size' => null, // GB
        'gen_liveimages_amount' => null, // max number 
        'gen_liveimages_period' => null, // seconds
        'ai_process_amount' => 0, //  max number monthly
        'ai_process_period' => 0, //  seconds 
        'expired' => "2200-01-01T00:00:00" //
    ];

    /** Protective time. Time between the expiration of the plan for the camera and the disconnection of the camera */
    const PROTECTIVE_TIME = 60*60*12;
}