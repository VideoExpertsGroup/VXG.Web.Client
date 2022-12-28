<html>
<head>
    <meta http-equiv="Content-type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <meta http-equiv="Access-Control-Allow-Origin" content="*" />
    <title>VXG Cloud One</title>
        <script src="https://cdn.polyfill.io/v2/polyfill.min.js"></script>
	<script src="../core/jquery-3.5.1.js"></script>
	<script src="../core/jquery-ui.js"></script>

	<link rel="stylesheet" type="text/css" href="../core/core.css" />
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<meta http-equiv="Cache-Control" content="no-cache">
        <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet">
	<link rel="stylesheet" type="text/css" href="../skin/colors.css" />
	<link rel="stylesheet" type="text/css" href="../skin/skin.css" />
	<link rel="stylesheet" type="text/css" href="../skin/skin2.css" />
        <script src="../skin/skin.js"></script>
	<script src="../skin/skin1.js"></script>
</head>
<body class="">
<div class="dialogs"></div>
<div class="body">
<div id="loader" class="global-loader" style="display: none;"></div>
    <div class="rightblock">

        <div class="screens-wrapper screens">

<div class="login" style="display: block;"><div class="wrp">
<div class="logo"></div>
<div class="bod json" style="width:auto;display:none;color:white;max-width: 95%;">
<div class="span">Example of 'admin_channel'</div>
<pre  style="user-select: all;">
{
  "adminurl": "https://web.admin-opt.pre.cloud-svcp.com:9000/api/v2/admin/",
  "certkey": "-----BEGIN CERTIFICATE-----\nMII...\n-----END ENCRYPTED PRIVATE KEY-----\n\n",
  "certpass": "password",
  "certcompany": "MTS",
  "maxcameras": 10,
  "cloudhost": "https://web.admin-opt.pre.cloud-svcp.com/",
  "cloudport": "443",
  "dontverifyhost": "1"
}
</pre>
Description of the fields used:
<ul>
<li>adminurl - link to cloud admin channel</li>
<li>certkey - certificate and key in PEM format</li>
<li>certpass - PEM pass phrase</li>
<li>certcompany - using company name</li>
<li>maxcameras - maximum number of cameras</li>
<li>cloudhost - url to VXG cloud</li>
<li>cloudport - port number for VXG cloud</li>
<li>dontverifyhost - a value of "1" allows you to check the name of the certificate relative to the host</li>
</ul>
<br/>
To create required certificate ('certkey' and 'certpass' fields) in PEM format use this commands:
<pre style="user-select: all;">
openssl pkcs12 -export -out company.pfx -inkey company.key -in company.crt
</pre>
<pre style="user-select: all;">
openssl pkcs12 -in company.pfx -out company.pem
</pre>
don't forget that when embedding the contents of a PEM file into json, you need to convert <br/>
all line breaks to "\n"
<br/><br/>
<button id="btn4" class="block-additional-control2 span">Back</button>

</div>
<div class="bod main" style="width:auto">
<div class="span">This is a setup page. </div>
<br/><br/>
<button id="btn3" class="block-additional-control2 span" style="width:200px;">Example of admin channel</button>
<input id="aws_secret" type="checkbox" Style="display: inline-flex; height: auto; width: auto;">
<label>Use AWS Secret Manager</label>

<br/><br/>
<div id="aws_secret_section" style="border: 1px dashed #ced4da;padding: 10px; display:none;">
<div style="color: #8c8c8c;margin: -16px 0 7px -5px;background: rgb(41 42 46);padding: 0 5px;width: fit-content;">Use AWS Secret for admin channel</div>
<div class="ltitle">To use AWS Secret Manager, you need to create a secret named 'admin_channel'</div> 
<div class="ltitle">AWS access key id (optional)</div>
<input class="notlast" type="text" name="aws_access_key_id" placeholder="" value="">
<div class="ltitle">AWS secret access key (optional)</div>
<input class="notlast" type="text" name="aws_secret_access_key" placeholder="" value="">
<div class="ltitle">AWS region (optional)</div>
<input class="notlast" type="text" name="aws_region" placeholder="us-east-1" value="">
<div class="ltitle">Check if the AWS secret is configured correctly 
<button id="btn2" class="block-additional-control2 span" style="margin-bottom: 0;">Check AWS Secret</button></div>
</div>

<br/><br/>


<form id="info" method="post" action="" style="min-width:500px;">
<div style="border: 1px dashed #ced4da;padding: 10px;">
<div style="color: #8c8c8c;margin: -16px 0 7px -5px;background: rgb(41 42 46);padding: 0 5px;width: fit-content;">Firebase settings</div>
<div class="ltitle">Firebase config</div>
<textarea class="notlast" rows=9 name="firebase">const firebaseConfig = {
  apiKey: "AIza....",
  authDomain: "...firebaseapp.com",
  databaseURL: "https://...",
  projectId: "test-...-aa596",
  storageBucket: "...appspot.com",
  messagingSenderId: "59437538",
  appId: "1:59437537:web:...1ba"
};</textarea>
<div class="ltitle">Firebase private key</div>
<textarea class="" rows=12 name="secret">{
  "type": "service_account",
  "project_id": "clo...",
  "private_key_id": "909...",
  "private_key": "-----BEGIN...",
  "client_email": "firebase-.....com",
  "client_id": "112...",
  "auth_uri": "https://accounts...",
  "token_uri": "https://oauth2...",
  "auth_provider...": "https://...",
  "client_x509_cert_url": "https..."
}</textarea>
</div>
<br/><br/>

<button id="btn1" class="block-additional-control2 span" onclick_toscreen="signup">Configure</button>
<input id="advanced" type="checkbox" Style="display: inline-flex; height: auto; width: auto;">
<label>Advanced settings</label>

<div id="advanced_section" style="display:none;">
<div class="ltitle">GoogleMap api key</div>
<input class="notlast" type="text" name="googlemap" placeholder="" value="">
<div class="ltitle">IpWorld api key</div>
<input class="notlast" type="text" name="ipworld" placeholder="" value="">


<div class="ltitle">E-mail</div>
<input class="notlast" type="email" name="email" placeholder="Email" required="" value="" autocomplete="email">
<div class="ltitle">LKey</div>
<input class="notlast" type="text" name="lkey" placeholder="LKey" required="" value="" autocomplete="current-password">
<div class="ltitle">Host</div>
<input class="notlast" type="text" name="host" placeholder="Host" required="" value="https://web.skyvr.videoexpertsgroup.com" autocomplete="current-password">
<div class="ltitle">Port</div>
<input class="notlast" type="number" name="port" placeholder="Port" required="" value="443" autocomplete="current-password">

<button id="btn2" class="button-ext" vxgsubmit="">Add user and configure</button><br>
</div>
</form>
</div>
</div>
<div class="customAlert">
<div class="alertHeader"><span class="alertHeaderSpan"></span></div>
<div class="alertBody">Install this application on your home screen for quick and easy access when you're on the go. Just tap the <img class="alertBodyImg" src="core/modules/login/share.png"> then <img class="alertBodyImg" src="core/modules/login/addToHome.png">(Add to Home Screen)</div>
<div class="alertSolution"><span class="alertButton">OK</span></div>
</div></div>

        </div>
    </div>
</div>

<script>

$( document ).ready(function() {
function gd(){
  var data = $('#info').serializeArray();
  var nd={};
  for(let i in data)
      nd[data[i]['name']]=data[i]['value'];
  return nd;
}

$( "#aws_secret" ).click(function( event ) {
$( "#aws_secret_section" ).toggle();
return true;
});

$( "#advanced" ).click(function( event ) {
$( "#advanced_section" ).toggle();
return true;
});


$( "#btn1" ).click(function( event ) {
  var data = gd();
  delete data['email'];
  delete data['lkey'];
  delete data['host'];
  delete data['port'];
  $('#loader').show();
  $.ajax({
    type: 'POST',
    url: '/init/init.php',
    data: data,
    dataType: 'text'
  }).done(function(data) {
    document.location.reload();
  }).fail(function(){
    $('#loader').hide();
    alert('Unknown error on backend side');
  });
  event.preventDefault();
});
$( "#btn3" ).click(function( event ) {
$('.bod.json').show();
$('.bod.main').hide();
return false;
});
$( "#btn4" ).click(function( event ) {
$('.bod.json').hide();
$('.bod.main').show();
return false;
});
$( "#btn2" ).click(function( event ) {
  var data = gd();
  delete data['email'];
  delete data['lkey'];
  delete data['host'];
  delete data['port'];
  delete data['googlemap'];
  delete data['ipworld'];
  delete data['firebase'];
  delete data['secret'];
  data['checkaws']=true;
  $('#loader').show();
  $.ajax({
    type: 'POST',
    url: '/init/init.php',
    data: data,
    dataType: 'text'
  }).done(function(data) {
    $('#loader').hide();
    alert(data);
  }).fail(function(data){
    $('#loader').hide();
    if (data && data.responseText) alert(data.responseText); else
    alert('Unknown error on backend side');
  });
  event.preventDefault();
});
$( "#info" ).submit(function( event ) {
  var data = gd();
  $('#loader').show();
  $.ajax({
    type: 'POST',
    url: '/init/init.php',
    data: data,
    dataType: 'text'
  }).done(function(data) {
    document.location.reload();
  }).fail(function(){
    $('#loader').hide();
    alert('Unknown error on backend side');
  });
  event.preventDefault();
  return false;
});
});

</script>

        <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" display="none">
            <symbol opacity=".6" id="mouseout">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M7.88797 1.5C5.24676 1.5 2.97041 3.02161 1.91065 5.21734C1.79061 5.46603 1.49171 5.57033 1.24302 5.45029C0.994324 5.33026 0.890025 5.03136 1.01006 4.78266C2.23318 2.24849 4.85501 0.5 7.88797 0.5C12.0845 0.5 15.5 3.85041 15.5 8C15.5 12.1496 12.0845 15.5 7.88797 15.5C4.85501 15.5 2.23318 13.7515 1.01006 11.2173C0.890025 10.9686 0.994324 10.6697 1.24302 10.5497C1.49171 10.4297 1.79061 10.534 1.91065 10.7827C2.97041 12.9784 5.24676 14.5 7.88797 14.5C11.5472 14.5 14.5 11.5824 14.5 8C14.5 4.4176 11.5472 1.5 7.88797 1.5Z"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M0.5 8C0.5 7.72386 0.723858 7.5 1 7.5H10C10.2761 7.5 10.5 7.72386 10.5 8C10.5 8.27614 10.2761 8.5 10 8.5H1C0.723858 8.5 0.5 8.27614 0.5 8Z"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M6.81802 11.182C7.01328 11.3772 7.32986 11.3772 7.52512 11.182L10.3536 8.35354C10.5488 8.15828 10.5488 7.8417 10.3536 7.64644C10.1583 7.45117 9.84171 7.45117 9.64644 7.64644L6.81802 10.4749C6.62275 10.6701 6.62275 10.9867 6.81802 11.182Z"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M10.3536 8.3536C10.1583 8.54886 9.84171 8.54886 9.64645 8.3536L6.81802 5.52517C6.62276 5.32991 6.62276 5.01333 6.81802 4.81807C7.01328 4.6228 7.32986 4.6228 7.52513 4.81807L10.3536 7.64649C10.5488 7.84176 10.5488 8.15834 10.3536 8.3536Z"/>
            </symbol>
        </svg>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" display="none">
            <symbol id="camera">
            <path stroke="none" fill-rule="evenodd" clip-rule="evenodd" d="M1 9.02941C1 7.18057 2.42117 5.5 4.61417 5.5H12.6063C13.9082 5.5 14.8365 6.04553 15.4238 6.84327C15.9952 7.61934 16.22 8.59855 16.2205 9.46788L16.2481 12.0882L16.248 14.5294C16.248 15.4942 15.9501 16.4805 15.323 17.235C14.6861 18.0013 13.7316 18.5 12.4961 18.5H4.75197C4.73997 18.5 4.72797 18.4996 4.71601 18.4987C2.46369 18.3363 1 16.8671 1 14.9706V9.02941ZM4.61417 6.5C3.00402 6.5 2 7.70178 2 9.02941V14.9706C2 16.2465 2.95536 17.3624 4.77042 17.5H12.4961C13.4377 17.5 14.1092 17.131 14.554 16.5958C15.0085 16.0489 15.248 15.3 15.248 14.5294V12.0909L15.2204 9.47059C15.2204 8.75235 15.0318 7.9975 14.6185 7.43614C14.2206 6.89564 13.5918 6.5 12.6063 6.5H4.61417ZM22 9.33636C22 8.93435 21.5496 8.69671 21.2178 8.92362L17.6233 11.3814C17.333 11.5799 17.333 12.0083 17.6233 12.2069L21.2178 14.6646C21.5496 14.8915 22 14.6539 22 14.2519V9.33636ZM20.6534 8.09814C21.6489 7.41741 23 8.13032 23 9.33636V14.2519C23 15.4579 21.6489 16.1708 20.6534 15.4901L17.0589 13.0323C16.1878 12.4367 16.1878 11.1515 17.0589 10.5559L20.6534 8.09814Z"/>
            </symbol>
        </svg>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" display="none">
            <symbol id="delete">
                <path stroke="none" fill-rule="evenodd" clip-rule="evenodd" d="M18.375 6.83333H5.87496V19.3333C5.87496 19.7936 6.24806 20.1667 6.70829 20.1667H17.5416C18.0019 20.1667 18.375 19.7936 18.375 19.3333V6.83333ZM5.04163 6V19.3333C5.04163 20.2538 5.78782 21 6.70829 21H17.5416C18.4621 21 19.2083 20.2538 19.2083 19.3333V6H5.04163Z"/>
                <path stroke="none" fill-rule="evenodd" clip-rule="evenodd" d="M18.375 4.33333H5.87504C5.4148 4.33333 5.04171 4.70643 5.04171 5.16667C5.04171 5.6269 5.4148 6 5.87504 6H18.375C18.8353 6 19.2084 5.6269 19.2084 5.16667C19.2084 4.70643 18.8353 4.33333 18.375 4.33333ZM5.87504 3.5C4.95457 3.5 4.20837 4.24619 4.20837 5.16667C4.20837 6.08714 4.95457 6.83333 5.87504 6.83333H18.375C19.2955 6.83333 20.0417 6.08714 20.0417 5.16667C20.0417 4.24619 19.2955 3.5 18.375 3.5H5.87504Z"/>
                <path stroke="none" fill-rule="evenodd" clip-rule="evenodd" d="M8.79167 9.75C9.02179 9.75 9.20833 9.93655 9.20833 10.1667V16.8333C9.20833 17.0635 9.02179 17.25 8.79167 17.25C8.56155 17.25 8.375 17.0635 8.375 16.8333V10.1667C8.375 9.93655 8.56155 9.75 8.79167 9.75Z"/>
                <path stroke="none" fill-rule="evenodd" clip-rule="evenodd" d="M12.125 9.75C12.3552 9.75 12.5417 9.93655 12.5417 10.1667V16.8333C12.5417 17.0635 12.3552 17.25 12.125 17.25C11.8949 17.25 11.7084 17.0635 11.7084 16.8333V10.1667C11.7084 9.93655 11.8949 9.75 12.125 9.75Z"/>
                <path stroke="none" fill-rule="evenodd" clip-rule="evenodd" d="M15.4583 9.75C15.6884 9.75 15.875 9.93655 15.875 10.1667V16.8333C15.875 17.0635 15.6884 17.25 15.4583 17.25C15.2282 17.25 15.0416 17.0635 15.0416 16.8333V10.1667C15.0416 9.93655 15.2282 9.75 15.4583 9.75Z"/>
                <path stroke="none" fill-rule="evenodd" clip-rule="evenodd" d="M14.625 1.83333H10.0417C9.58143 1.83333 9.20833 2.20643 9.20833 2.66667C9.20833 3.1269 9.58143 3.5 10.0417 3.5H14.625C15.0852 3.5 15.4583 3.1269 15.4583 2.66667C15.4583 2.20643 15.0852 1.83333 14.625 1.83333ZM10.0417 1C9.12119 1 8.375 1.74619 8.375 2.66667C8.375 3.58714 9.12119 4.33333 10.0417 4.33333H14.625C15.5455 4.33333 16.2917 3.58714 16.2917 2.66667C16.2917 1.74619 15.5455 1 14.625 1H10.0417Z"/>
            </symbol>
        </svg>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" display="none">
            <symbol id="edit">
                <path stroke="none" fill-rule="evenodd" clip-rule="evenodd" d="M20.0313 6.94975L17.2028 4.12132C16.8123 3.7308 16.1791 3.7308 15.7886 4.12132L6.42681 13.4831C6.25363 13.6563 6.15002 13.887 6.13564 14.1315L5.8928 18.2598L10.0211 18.0169C10.2656 18.0026 10.4963 17.899 10.6694 17.7258L20.0313 8.36396C20.4218 7.97344 20.4218 7.34027 20.0313 6.94975ZM17.9099 3.41421C17.1289 2.63317 15.8626 2.63317 15.0815 3.41421L5.7197 12.776C5.37334 13.1224 5.16613 13.5838 5.13737 14.0728L4.89453 18.2011C4.85937 18.7988 5.3538 19.2932 5.95152 19.2581L10.0798 19.0152C10.5688 18.9865 11.0302 18.7792 11.3766 18.4329L20.7384 9.07107C21.5194 8.29002 21.5194 7.02369 20.7384 6.24264L17.9099 3.41421Z"/>
                <path d="M13.6673 4.82849L19.3242 10.4853"/>
            </symbol>
        </svg>

        <svg width="20" height="4" viewBox="0 0 20 4" fill="none" xmlns="http://www.w3.org/2000/svg">
            <symbol id="action">
                <circle cx="2" cy="2" r="2"/>
                <circle cx="10" cy="2" r="2"/>
                <circle cx="18" cy="2" r="2"/>
            </symbol>
        </svg>


<style>
.screens > .login, .screens > .signup, .screens > .forgot{
background-image:url(/core/modules/login/background.jpg);
position:fixed;
left:0;
top:0;
right:0;
bottom:0;
background-color:white;
    background-size: cover;
    background-position: center center;
}

.screens > .login .before, .screens > .signup .before, .screens > .forgot .before{
font-size: 18px;
color:white;
text-align: center;
    text-transform: uppercase;
}

.screens > .login .wrp, .screens > .signup .wrp, .screens > .forgot .wrp{
position:fixed;
width:680px;
top:0;
bottom:0;
background-color:rgba(33,34,38,0.95);
    left: 50%;
    margin-left: -357px;
display: flex;
    flex-direction: column;
align-items: center;
}
.screens > .login .wrp > div, .screens > .signup .wrp > div, .screens > .forgot .wrp > div{
position:relative!important;
left:0!important;
flex: 10 10;
}

.screens > .login .logo, .screens > .signup .logo, .screens > .forgot .logo{
    cursor:pointer;
    background-image: url(/core/modules/login/vxg-logo.png);
    background-repeat:no-repeat;
    width: 286px;
    height: 48px;
    background-position: center;
    background-size: inherit!important;
flex: 5 5 48px!important;
}
body.mobile .screens > .login .logo, body.mobile .screens > .signup .logo, body.mobile .screens > .forgot .logo{
flex: 3 3!important;
}

.screens > .login .title, .screens > .signup .title, .screens > .forgot .title{
font-size: 53px;
    line-height: 62px;
color:white;
flex:4 4!important;
    width: 286px;
    height: 48px;
}

@media (max-height: 550px) {
.screens > .login .title, .screens > .signup .title, .screens > .forgot .title{
display:none;
}
}

.screens > .login .footer, .screens > .signup .footer, .screens > .forgot .footer{
width: 286px;
    left: 50%;
}
.screens > .login .bod, .screens > .signup .bod, .screens > .forgot .bod{
    width: 286px;
    vertical-align: bottom;
    max-height: 100%;
    overflow-y: scroll;
    overflow-x: hidden;
}
.screens > .login button, .screens > .signup button, .screens > .forgot button{
    cursor:pointer;
    border:none;
    border-radius: 50px;
font-size: 12px;
    height: 32px;
width:176px;
text-align:center;
    background: var(--main-color);
    /*background: linear-gradient(86.33deg, #69993C 20.67%, #A2F257 90.51%);*/
    /*-webkit-box-shadow: 0 10px 20px rgba(123, 178, 71, 0.3);*/
    /*box-shadow: 0 10px 20px rgba(123, 178, 71, 0.3);*/
    opacity: 1;
    margin-bottom: 1.48vh;
}

.screens > .login .add-pwa-button{
    background-color: transparent;
    border-radius: 15px;
    width: 100px;
    height: 30px;
    padding: 0px 15px 0px 15px;
    color: var(--main-color);
    font-size: 12px;
    text-align: center;
    cursor:pointer;
    border:1px solid var(--main-color);
    outline:none!important;
    left: 50%;
    position: relative;
    margin-left: -50px;
}
body.mobile.landscape .screens > .login .add-pwa-button{
    position: fixed;
    left: 5%;
    top: 5%;
    margin-left: 0px;
}
.screens > .login button:after, .screens > .signup button:after, .screens > .forgot button:after{
    /*content: "\FFEB";*/
    /*float: right;*/
    /*background-color: rgba(0,0,0,0.2);*/
    /*width: 50px;*/
    /*height: 50px;*/
    /*position: absolute;*/
    /*right: 70px;*/
    /*margin-top: -17px;*/
    /*border-radius: 25px;*/
    /*line-height: 42px;*/
    /*text-align: center;*/
    /*font-size: 40px;*/
}


.screens > .login button:hover, .screens > .signup button:hover, .screens > .forgot button:hover{
    background: var(--main-color);
}
.screens > .login input,.screens > .login textarea, .screens > .signup input, .screens > .forgot input{
width:100%;
background: none;
    color: #8c8c8c;
}
.screens > .forgot input{
margin-top:17px;
}
.screens > .login .notlast,.screens > .signup .notlast{
margin-bottom: 2.22vh;
}
.screens > .login .last, .screens > .signup .last{
margin-bottom: .74vh;
}

.screens > .login  span.block-additional-control2, 
.screens > .signup  span.block-additional-control2, 
.screens > .forgot  span.block-additional-control2{
color:white;
cursor:pointer;
    line-height: 15px
}
.screens > .login  span.block-additional-control, 
.screens > .signup  span.block-additional-control, 
.screens > .forgot  span.block-additional-control{
color:var(--main-color);
cursor:pointer;
    line-height: 15px
}
.screens > .login  span.block-additional-control:hover, 
.screens > .signup  span.block-additional-control:hover, 
.screens > .forgot  span.block-additional-control:hover{
color:var(--main-color);
}

.screens > .login .customAlert {
position: absolute;
z-index: 1;
width: 85%;
padding: 5px;
font-size: 14px;
border-radius: 5px;
background-color: white;
display: none;
bottom: 6%;
left: 6%;
}
.screens > .login .customAlert .alertHeader{
}
.screens > .login .customAlert .alertHeader .alertHeaderSpan{
}
.screens > .login .customAlert .alertBody{
padding: 5px;
text-align: justify;
}
.screens > .login .customAlert .alertBody .alertBodyImg{
width:15px;
vertical-align: middle;
}
.screens > .login .customAlert .alertSolution{
padding: 10px 5px 5px 10px;
text-align: center;
color: var(--main-color);
}
.screens > .login .ltitle, .screens > .signup .ltitle, .screens > .forgort .ltitle{
color: #8c8c8c;
    padding-bottom: 0.74vh;
}

.screens > .login input:-webkit-autofill, .screens > .login input:-webkit-autofill:hover, .screens > .login input:-webkit-autofill:focus, .screens > .login input:-webkit-autofill:active,
.screens > .signup input:-webkit-autofill, .screens > .signup input:-webkit-autofill:hover, .screens > .signup input:-webkit-autofill:focus, .screens > .signup input:-webkit-autofill:active,
.screens > .forgort input:-webkit-autofill, .screens > .forgort input:-webkit-autofill:hover, .screens > .forgort input:-webkit-autofill:focus, .screens > .forgort input:-webkit-autofill:active {
    -webkit-text-fill-color: #8c8c8c !important;
    -webkit-background-clip: text!important;
}

#mobile-menu-btn{
display:none!important;
}

.loginbottomline{
margin-top:auto;
position:absolute;bottom: 0;left: calc(50% - 10.5em);line-height: 7px;font-size: 10px;;color: black;text-align: right;padding: 7px 7px;
flex:1 1 1px!important;
}
body.mobile.landscape .loginbottomline{
display:flex;
}
.loginbottomline > div:first-child{
text-align: center;
}
.loginbottomline > div:last-child{
color:#808080;text-align:center;
}
body:not(.mobile) .loginbottomline > div:first-child,
body:not(.mobile) .loginbottomline > div:last-child,
body:not(.landscape) .loginbottomline > div:first-child,
body:not(.landscape) .loginbottomline > div:last-child{
padding-bottom:14px;
}
body.mobile.landscape .loginbottomline > div:last-child{
margin-left:30px;
}
div.span{color:white;}

.screens-wrapper.screens > .login .logo, .screens-wrapper.screens > .signup .logo, .screens-wrapper.screens > .forgot .logo {
    cursor: inherit;
}
.screens > .login .logo, .screens > .signup .logo, .screens > .forgot .logo {
    flex: 2 2 48px!important;
}
.screens > .login div.logo{
    flex: 1!important;
}
</style>

</body>
</html>