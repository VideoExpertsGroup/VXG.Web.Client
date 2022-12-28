<?php

//namespace PHPMailer\PHPMailer;

$curdir_static_lib_mail = dirname(__FILE__);
$path_to_phpmailer = $curdir_static_lib_mail.'/vendor/phpmailer/phpmailer/';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\OAuth;


require_once $curdir_static_lib_mail.'/static_lib.php';
require $path_to_phpmailer.'src/Exception.php';
require $path_to_phpmailer.'src/PHPMailer.php';
require $path_to_phpmailer.'src/SMTP.php';
require $path_to_phpmailer.'src/OAuth.php';



/**
 * Aliases for League Provider Classes
 * Make sure you have added these to your composer.json and run `composer install`
 * Plenty to choose from here:
 * @see http://oauth2-client.thephpleague.com/providers/thirdparty/
 */
// @see https://github.com/thephpleague/oauth2-google
use League\OAuth2\Client\Provider\Google;

require_once $curdir_static_lib_mail.'/static_lib.php';
require_once $curdir_static_lib_mail.'/vendor/autoload.php';
		
class StaticLibMail {

	static function isConfigured() {
		return (isset(StaticLib::$CONFIG['email']) && isset(StaticLib::$CONFIG['email']['host']) && StaticLib::$CONFIG['email']['host'] != "");
	}

	static function send($email, $email_subject, $email_text, $email_text_html = "") {
		//if($email_text_html == "" || $email_text_html == null){
		//	$email_text_html = str_replace(array("\n"), array("<br>"), $email_text);
		//}

		$conn = StaticLib::db_connection();
		$email_host = StaticLib::$CONFIG['email']['host'];
        $email_port = StaticLib::$CONFIG['email']['port'];
		$email_address = StaticLib::$CONFIG['email']['address'];
		$email_password = StaticLib::$CONFIG['email']['password'];
		$email_name = StaticLib::$CONFIG['email']['from_name'];
		$email_smtp_secure = StaticLib::$CONFIG['email']['smtp_secure'];

		$email_auth_type = isset(StaticLib::$CONFIG['email']['auth_type']) ? StaticLib::$CONFIG['email']['auth_type'] : '';
		$email_client_id = StaticLib::$CONFIG['email']['client_id'];
		$email_client_secret = StaticLib::$CONFIG['email']['client_secret'];
		$email_client_token = StaticLib::$CONFIG['email']['client_token'];


        error_log('Mailer: ' . join(', ', array($email_host,$email_port,$email_address,$email_password)));

		$mail = new PHPMailer;
		
		$mail->SMTPDebug = 3;                               // Enable verbose debug output

		$mail->isSMTP();                                      // Set mailer to use SMTP
		$mail->Host = $email_host;                            // Specify main and backup SMTP servers
		$mail->SMTPAuth = true;                               // Enable SMTP authentication
		$mail->Username = $email_address;                     // SMTP username
		$mail->Password = $email_password;                    // SMTP password
		$mail->SMTPSecure = $email_smtp_secure;               // Enable TLS encryption, `ssl` also accepted
		$mail->Port = $email_port;                            // TCP port to connect to


		if ($email_auth_type == 'XOAUTH2')
		{
				//Set AuthType to use XOAUTH2

				$mail->AuthType = 'XOAUTH2';
				// Fill in authentication details here
				$clientId	 	= $email_client_id;
				$clientSecret 	= $email_client_secret;
				//Obtained by configuring and running get_oauth_token.php
				//after setting up an app in Google Developer Console.
				$refreshToken	= $email_client_token;
				//Create a new OAuth2 provider instance
				$provider = new Google(
					[
					'clientId' => $clientId,
					'clientSecret' => $clientSecret,
					]
				);
				//Pass the OAuth provider instance to PHPMailer
				$mail->setOAuth(
					new OAuth(
					[
						'provider' => $provider,
						'clientId' => $clientId,
						'clientSecret' => $clientSecret,
						'refreshToken' => $refreshToken,
						'userName' => $email_address,
						]
					)
				);

				if ($clientSecret == '' or $email_client_secret == '' or $email_client_token == '')
					error_log('clientId, clientSecret, or refreshToken is not set in config file' );
		}

		$mail->setFrom($email_address, $email_name);

		
		$email_db = '';
		if(!is_array($email)){
			$mail->addAddress($email);     // Add a recipient
			$email_db = $email;
		}else{
			foreach($email as $k => $v){
				if($v != ''){
					$mail->addAddress($v);     // Add a recipient
					$email_db .= $v.";";
				}
			}
		}

		// $mail->addReplyTo('expert@videoexpertsgroup.com', 'Information');
		// $mail->addCC('cc@example.com');
		// $mail->addBCC('bcc@example.com');

		// $mail->addAttachment('/var/tmp/file.tar.gz');         // Add attachments
		// $mail->addAttachment('/tmp/image.jpg', 'new.jpg');    // Optional name
		$mail->isHTML(false);                                  // Set email format to HTML

		$mail->Subject = $email_subject;
		$mail->Body    = $email_text_html; // 'This is the HTML message body <b>in bold!</b>';
		$mail->AltBody = $email_text; // 'This is the body in plain text for non-HTML mail clients';

		/*$stmt = $conn->prepare('INSERT INTO email(to,from,message,created) VALUES(?,?,?,NOW())');
		$stmt->execute(array($email_db, $email_address, $email_text));
        $emailid = $conn->lastInsertId();*/

		if(!$mail->send()) {
			error_log('Mailer Error: ' . $mail->ErrorInfo);
			//StaticLib::addDashboardEvent('send_mail_failed', 'Failed mailer. Message could not be sent.. email: '.$email_db);
			StaticLib::error(500, "Message could not be sent.. Try again.");
		}

		// $stmt = $conn->prepare('UPDATE emails SET sended = NOW() WHERE id = ?');
		// $stmt->execute(array($emailid));
	}
}
