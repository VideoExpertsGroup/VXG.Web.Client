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
    'menu_name': $.t('integration.title'),
    'menu_icon': '<i class="fa fa-cogs" aria-hidden="true"></i>',

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
		$("#rest_api").append( "<a href='"+vxg.api.cloud.apiSrc + "/docs/v2.html' target='_blank'>"+vxg.api.cloud.apiSrc+`/docs/v2.html</a><span> (${$.t('integration.restApi.legacyApi')})</span><br><br>`);
		$("#rest_api").append( "<a href='"+vxg.api.cloud.apiSrc + "/docs/v3.html' target='_blank'>"+vxg.api.cloud.apiSrc+`/docs/v3.html</a><span> (${$.t('integration.restApi.cloudKeyAuthorization')})</span>&nbsp&nbsp&nbsp<button onclick='myFunction()'>${$.t('integration.restApi.requestLKey')}</button> <br><br>`);
		$("#rest_api").append( "<a href='"+vxg.api.cloud.apiSrc + "/docs/v4.html' target='_blank'>"+vxg.api.cloud.apiSrc+`/docs/v4.html</a><span> (${$.t('integration.restApi.accAuthorization')})</span><br><br>`);
		$("#rest_api").append( "<a href='"+vxg.api.cloud.apiSrc + "/docs/v5.html' target='_blank'>"+vxg.api.cloud.apiSrc+`/docs/v5.html</a><span> (${$.t('integration.restApi.siAuthorization')})</span><br><br>`);
		$("#rest_api").append( `<p>${$.t('integration.restApi.authorizeDescription')}<br>
			<ul><li>${$.t('integration.restApi.authorizeExample1')}<br><br></li>
			<li>${$.t('integration.restApi.authorizeExample2')}</li></ul></p><br><br>`);
		
		
		

		$("#admin_api").html("");
		$("#admin_api").append( "<a href='"+vxg.api.cloud.apiSrc + "/docs/v2_admin.html' target='_blank'>"+vxg.api.cloud.apiSrc+`/docs/v2_admin.html</a><span> (${$.t('integration.adminApi.authorizationDescription')})</span><br><br>`);

		$("#web_sdk").html("");
		$("#web_sdk").append( `<a href='./core/common/sdk/' target='_blank'>${$.t('integration.webSdk.examples')}</a><br><br>`);


		$("#camera_at").html("");
		$("#camera_at").append( `<p><span>${$.t('integration.cameraAccessTokens.groupAccessToken')}: </span><br><span class='acc_token'>` + vxg.api.cloud.allCamsToken + "</span></p>");

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
			alert($.t('toast.emailSentToRegisteredEmailAddress'));
		else		
			dialogs['mdialog'].activate(`<h7>${$.t('integration.yourLKeyIs')}</h7><p><br/>${obj.data}</p>
				<p style="padding-top: 15px;">
				<button name="cancel" class="vxgbutton">${$.t('action.cancel')}</button>&nbsp;&nbsp;&nbsp;&nbsp;</p>`
			).then(function(r){});

	}, function(){
		alert($.t('toast.emailSentToRegisteredEmailAddress'));
	});
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
				$("#camera_at").append( `<p><span>${$.t('common.camera')} ${item.name} id: </span>
										<span class='acc_token'> ${item.id} </span><span> ${$.t('integration.accessToken')}:</span><br>
										<span class='acc_token'> ${item.token} </span></p>`);
			});
		}
		if (r.meta.next) {
			$("#camera_at").append( `<button type='button' class='vxgbutton more_acc_tok' data-attr="${r.meta.next}" onclick='button_more(this)'>${$.t('common.more')}</button>` );
		}
	});
}