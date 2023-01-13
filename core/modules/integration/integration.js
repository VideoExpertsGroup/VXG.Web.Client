// Array of screens
window.screens = window.screens || {};

// Array of controls - custom DOM elements
window.controls = window.controls || {};

// Array of dialogs
window.dialogs = window.dialogs || {};

// URL patch to this script
var path = window.core.getPath('integration.js');

window.screens['integration'] = {
    'menu_weight': 1000,
    'menu_name':'Integrations',
    'menu_icon': path+'reports.svg',
    'menu_icon_hover': path+'reportsh.svg',

    // URL link to script page
    'html': path+'integration.html',

     // Array of url links to script files, include into the page header
    'js':[],

     // Styles that are not used when the screen is inactive
    'css':[path+'integration.css'],

    // Array of url links to css files, include into the page header
    'stablecss':[],

    // Array of url links to css files in 'common' directory, include into the page header
    'commonjs':[],

    // Array of url links to css files in 'common' directory, include into the page header
    'commoncss':[],

    // When the screen is "activated" - for example, by pressing a menu
    'on_show':function(r){		
		$("#rest_api").html("");
		$("#rest_api").append( "<a href='"+vxg.api.cloud.apiSrc + "/docs/v2.html' target='_blank'>"+vxg.api.cloud.apiSrc+"/docs/v2.html</a><span> (Legacy API, Authorization: LKey 'cloud key')</span><br><br>");
		$("#rest_api").append( "<a href='"+vxg.api.cloud.apiSrc + "/docs/v3.html' target='_blank'>"+vxg.api.cloud.apiSrc+"/docs/v3.html</a><span> (Authorization: LKey 'cloud key')</span>&nbsp&nbsp&nbsp<button onclick='myFunction()'>Request LKey 'cloud key'</button> <br><br>");
		$("#rest_api").append( "<a href='"+vxg.api.cloud.apiSrc + "/docs/v4.html' target='_blank'>"+vxg.api.cloud.apiSrc+"/docs/v4.html</a><span> (Authorization: Acc 'camera access token')</span><br><br>");
		$("#rest_api").append( "<a href='"+vxg.api.cloud.apiSrc + "/docs/v5.html' target='_blank'>"+vxg.api.cloud.apiSrc+"/docs/v5.html</a><span> (Authorization: SI 'group access token')</span><br><br>");
		$("#rest_api").append( "<p>To authorize the above API calls. click on 'Authorize' button, insert the value of the 'Authorization' header and then click 'Authorize' in the pop-up dialog. For example,<br>\
			<ul><li>For v3 API the value will look like 'LKey co.3289a20cf73bf94a1fc9'<br><br></li>\
			<li>For v4 API the value will look like 'Acc eyJjYW1pZCI6IDMwNDA.....tIn0='</li></ul></p><br><br>");
		
		
		

		$("#admin_api").html("");
		$("#admin_api").append( "<a href='"+vxg.api.cloud.apiSrc + "/docs/v2_admin.html' target='_blank'>"+vxg.api.cloud.apiSrc+"/docs/v2_admin.html</a><span> (Authorization requires SSL key and certificate)</span><br><br>");

		$("#web_sdk").html("");
		$("#web_sdk").append( "<a href='./core/common/sdk/' target='_blank'>Web SDK samples</a><br><br>");


		$("#camera_at").html("");
		$("#camera_at").append( "<p><span>Group access token: </span><br><span class='acc_token'>" + vxg.api.cloud.allCamsToken + "</span></p>");

/*		
		fetch(vxg.api.cloud.apiSrc + '/api/v5/channels/', {
		  headers: {
			Accept: 'application/json',
			Authentication: 'SI ' + vxg.api.cloud.allCamsToken
		  }
		})
		   .then(resp => resp.json())
		   .then(json => console.log(json))
*/	
		button_more();
		
        return defaultPromise();
    },

    // When the screen "hides" - for example, due to the activation of another screen
    'on_hide':function(){
        return defaultPromise();
    },

    // When all scripts and styles are loaded. Called once
    'on_ready':function(){
        return defaultPromise();
    },

    // When the screen is initialized for the first time. In order not to do unnecessary work, perhaps not even needed by the user
    'on_init':function(){
		$(this).find('.more_acc_tok').click(function(el){
			e = el;
        });

        return defaultPromise();
    }
};

window.controls['timer'] = {
     // Array of url links to script files, include into the page header
    'js':[],

    // Array of url links to css files, include into the page header
    'css':[],

    // When all scripts and styles are loaded. Called once
    'on_ready':function(){
        return defaultPromise();
    },

    // Control initialization required. Called once for each control
    // variable 'this' is reference to DOM element
    'on_init':function(){
        this.timer = setInterval(function(element){
 //           $(element).html((new Date).toISOString());
        },100,this);
        return defaultPromise();
    },

    // When control removed
    'disconnectedCallback':function(){
        clearInterval(this.timer);
        return defaultPromise();
    },

    // When control attribute updated
    'attributeChangedCallback':function(name, value){
        return defaultPromise();
    }
}

function myFunction()
{
	vxg.api.cloudone.license().then(function(obj){
		if (Object.keys(obj).length === 0)
			alert("An e-mail was sent to your registered e-mail address!");
		else		
			dialogs['mdialog'].activate('<h7>Your LKey is</h7><p><br/>\
						' +obj.data+'\
						</p><p style="padding-top: 15px;">\
						<button name="cancel" class="vxgbutton">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;\
						</p>').then(function(r){});

	}, function(){
		alert("An e-mail was sent to your registered e-mail address");});
}

function button_more(el)
{
	let api_call = '/api/v5/channels/';
	if (el && el.getAttribute('data-attr'))
	{
		api_call = el.getAttribute('data-attr');
	}

	var data = {};
	let headers = vxg.api.cloud.getHeader();	
	
	$.ajax({
	type: 'GET',
	url: vxg.api.cloud.apiSrc + api_call,
	headers: headers,
	contentType: "application/json",
	data: data
	}).then(function(r){
		$(".more_acc_tok").remove();
		if (r.objects){
			r.objects.forEach(function(item){
				$("#camera_at").append( "<p><span>Camera "+ item.name + " id: </span>\
										<span class='acc_token'>" + item.id + "</span><span> access token:</span><br>\
										<span class='acc_token'>"+ item.token + "</span></p>");
			});
		}
		if (r.meta.next) {
			$("#camera_at").append( "<button type='button' class='vxgbutton more_acc_tok' data-attr="+r.meta.next+" onclick='button_more(this)'>More</button>" );
		}
	});
}