<?php
use Aws\SecretsManager\SecretsManagerClient; 
use Aws\Sns\SnsClient; 
use Aws\Exception\AwsException;
use Aws\Credentials\CredentialProvider;

if (file_exists("../api/conf.d/config.php")) 
    exit;


if (isset($_POST['checkaws']) && $_POST['checkaws']){
    $a = dirname(dirname(__FILE__));
    include_once($a.'/api/vendor/autoload.php');

    $credentials = new Aws\Credentials\Credentials($_POST['aws_access_key_id'],$_POST['aws_secret_access_key']);
    $region = $_POST['aws_region'] ? $_POST['aws_region'] : 'us-east-1';
    
    $client = new SecretsManagerClient([
        'region' => $region,
        'version' => '2017-10-17',
        'credentials' => $credentials
    ]);

    try {
        $result = $client->getSecretValue(['SecretId' => 'admin_channel']);
        $admin_channel = json_decode($result['SecretString'],true);
    } catch (AwsException $e) {
        if ($e->getAwsErrorCode() === 'InvalidSignatureException' || $e->getAwsErrorCode() === 'UnrecognizedClientException'){
            print "Invalid access key id or secret access key";http_response_code(501);exit;
        }
        if ($e->getAwsErrorCode() === 'ResourceNotFoundException'){
            print "No 'admin_channel' secret";http_response_code(501);exit;
        }
        print_r($e->getAwsErrorCode());
        http_response_code(501);
        exit;
    }        
    if (!isset($admin_channel['certpass'])) {print "No 'certpass' value in 'admin_channel' secret";http_response_code(501);exit;}
    if (!isset($admin_channel['certkey'])) {print "No 'certkey' value in 'admin_channel' secret";http_response_code(501);exit;}
    if (!isset($admin_channel['certcompany'])) {print "No 'certcompany' value in 'admin_channel' secret";http_response_code(501);exit;}
    if (!isset($admin_channel['cloudport'])) {print "No 'cloudport' value in 'admin_channel' secret";http_response_code(501);exit;}
    if (!isset($admin_channel['cloudhost'])) {print "No 'cloudhost' value in 'admin_channel' secret";http_response_code(501);exit;}
    if (!isset($admin_channel['adminurl'])) {print "No 'adminurl' value in 'admin_channel' secret";http_response_code(501);exit;}
    if (!isset($admin_channel['maxcameras'])) {print "No 'maxcameras' value in 'admin_channel' secret";http_response_code(501);exit;}

    $verifyhost = $admin_channel['dontverifyhost'] ? false : true;
    $cloudhost = $admin_channel['cloudhost'];
    $adminurl = $admin_channel['adminurl'];
    if (substr($cloudhost,0,8)!=='https://') $cloudhost = 'https://'.$cloudhost;
    if (substr($cloudhost,-1)!=='/') $cloudhost.= '/';
    if (substr($adminurl,-1)!=='/') $adminurl.= '/';

    $certfile = tmpfile();
    fwrite($certfile, $admin_channel['certkey']);
    $certfilepath = stream_get_meta_data($certfile);
    $certfilepath = $certfilepath['uri'];
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $adminurl.'api/v2/admin/users/');
    curl_setopt($ch, CURLOPT_SSLCERT, $certfilepath);
    curl_setopt($ch, CURLOPT_SSLCERTPASSWD, $admin_channel['certpass']);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('accept: application/json'));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, $verifyhost);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_VERBOSE, true);
    $result = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    fclose($certfile);
    if ($httpcode!==200){
        if (strpos($result,'The SSL certificate error')!==false){
            print "The SSL certificate error";http_response_code(501);exit;
        }
        $err = curl_error($ch);
        if (strpos($err,'unable to set private key file:')!==false){
            print '[unable to set private key file]: possibly invalid value in certkey or certpass fields';http_response_code(501);exit;
        }
        if ($result) print $result; else print $err;
        http_response_code(501);exit;
    }
    print 'Verification successfully completed';
    http_response_code(200);exit;
}


// Config
$base_config = array();
$base_config['db'] = array();
$base_config['db']['host'] = 'localhost';
$base_config['db']['dbname'] = 'webclient';
$base_config['db']['username'] = 'webclient';
$base_config['db']['userpass'] = 'webclient';

$base_config['email'] = array();
$base_config['email']['host'] = '';
$base_config['email']['port'] = '';
$base_config['email']['address'] = '';
$base_config['email']['password'] = '';
$base_config['email']['from_name'] = '';
$base_config['email']['smtp_secure'] = ''; // or tls
// Please set random digit
$base_config['capture_id'] = 'cloudone'.rand(1000000,9999999);
$base_config['vxg_service'] = array();
$base_config['vxg_service']['host'] = '';
$base_config['vxg_service']['port'] = '';
$base_config['vxg_service']['key']  = '';
$base_config['admin_channel'] = array();
$base_config['admin_channel']['aws_access_key_id'] = '';
$base_config['admin_channel']['aws_secret_access_key'] = '';
$base_config['admin_channel']['aws_region'] = '';

if ($_POST['aws_access_key_id'] && $_POST['aws_secret_access_key']){
    $base_config['admin_channel']['aws_access_key_id'] = $_POST['aws_access_key_id'];
    $base_config['admin_channel']['aws_secret_access_key'] = $_POST['aws_secret_access_key'];
    $base_config['admin_channel']['aws_region'] = $_POST['aws_region'];
}

file_put_contents("test.txt","Hello World. Testing!");

$cnf = var_export($base_config, true);
file_put_contents("../api/conf.d/config.php", "<?php \$config = ".$cnf.";");
chmod("../api/conf.d/config.php",0755);

file_put_contents("../api/conf.d/config.js",
$_POST['firebase']."
window.no_check_mail_auth = window.no_check_mail_auth || false;
window.no_check_local_addresses = window.no_check_local_addresses || false;
window.ipworld_api_key = '".(isset($_POST['ipworld'])?$_POST['ipworld']:'')."';
window.googlemap_api_key = '".(isset($_POST['googlemap'])?$_POST['googlemap']:'')."';");
chmod("../api/conf.d/config.js",0755);

file_put_contents("../api/conf.d/firebase.php", "<?php".$_POST['secret']);
chmod("../api/conf.d/firebase.php",0755);

shell_exec('php ../api/v1/db/update/index.php');

include_once ('../api/v1/core/MCore.php');
MCore::init();  
$r=fetchRow('SELECT * from "user" where role=\'superadmin\'');
if (!$r)
    query('INSERT INTO "user" ("password_sha3","parentUserID", "role", "email",  "name", "serverLkey","serverHost","serverPort") 
        VALUES(\'\',0,\'superadmin\',\'superadmin\',\'superadmin\',\'\',\'\',0)');

if (isset($_POST['email'])){
    query('DELETE FROM "user" where "email"=?',[$_POST['email']]);
    query('INSERT INTO "user" ("password_sha3","parentUserID", "role", "email",  "name", "serverLkey","serverHost","serverPort") 
        VALUES(\'\',(select "id" from "user" where "name"=\'superadmin\'),\'partner\',?,?,?,?,?)',
        [$_POST['email'], $_POST['email'], isset($_POST['lkey'])?$_POST['lkey']:'', isset($_POST['host'])?$_POST['host']:'', isset($_POST['port'])?0+$_POST['port']:0]);
}
