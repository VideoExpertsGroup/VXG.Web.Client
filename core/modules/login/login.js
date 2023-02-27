window.screens = window.screens || {};

var path = window.core.getPath('login.js');

window.screens['login'] = {
    'menu_weight': 1000000,
    'attrlistener': {
        click: {onclick_logout: "window.screens['login'].logout"}
    },
    'html': path+'login.html',
    'css':[path+'login.css'],
    'on_show':function(r){
        return defaultPromise();
    },
    'on_hide':function(){
    },
    'on_ready':function(){
        if (window.skin && window.skin.login_bottom_line) $('.loginbottomline').html(window.skin.login_bottom_line);
    },
    'on_init':function(){
        let self=this;
        
	const addBtn = document.querySelector('.add-pwa-button');
	addBtn.style.display = 'none';
	
	if (window.core.isIos()) {
		var isWarn = window.localStorage.getItem('isIosWarn');
		
		if( isWarn === undefined || isWarn == null) {
			const customAlert = document.querySelector('.customAlert');
			const alertSolution = document.querySelector('.alertSolution');
			customAlert.style.display = "block";
		
			alertSolution.addEventListener('click', ()=>{
				window.localStorage.setItem('isIosWarn', true);
				customAlert.style.display = "none";
			});
		}
	} else {
		let deferredPrompt;
		window.addEventListener('beforeinstallprompt', (e) => {
// Hide button installing app for windows
			if (window.core.isWindows()) {
				deferredPrompt = null;
				return;
			}
			e.preventDefault();
// Stash the event so it can be triggered later.
			deferredPrompt = e;
// Update UI to notify the user they can add to home screen
			addBtn.style.display = 'block';
			addBtn.addEventListener('click', () => {
// Show the prompt
				deferredPrompt.prompt();
// Wait for the user to respond to the prompt
				deferredPrompt.userChoice.then((choiceResult) => {
					if (choiceResult.outcome === 'accepted') {
// hide our user interface that shows our PWA-install button
						addBtn.style.display = 'none';
						console.log('User accepted');
					} else {
						console.log('User dismissed');
					}
					deferredPrompt = null;
				});
			});
		});
	}


    displayVersion();

        if (location.hash.substr(0,6)=='#login'){
            this.wrapper.find('[name="username"]').val(location.hash.substr(7));
            setTimeout(function(){self.wrapper.find('[name="password"]').focus();},1000);
            location.hash = '';
        } else
            setTimeout(function(){self.wrapper.find('[name="username"]').focus();},1000);
        core.elements['header-right'].append('<span class="signout" style="white-space: nowrap;" onclick_logout><svg class="inline-svg-icon icon-signout">' +
            '       <use xlink:href="#mouseout"></use>' +
            '    </svg><span>Sign Out</span></span>');
        this.wrapper.find('form').submit(function(e){
            e.preventDefault();
            let username = $(e.target).find('[name="username"]').val();
            let password = $(e.target).find('[name="password"]').val();

            core.elements['global-loader'].show();
            $('body').addClass('loginprocess');

            if (window.firebase){
                firebase.auth().signInWithEmailAndPassword(username, password).then(function(user){
                    core.elements['global-loader'].hide();
                    $('body').removeClass('loginprocess');
// TODO: check email verification
                    if (no_check_mail_auth!==true && user && user.user && !user.user.emailVerified) {
//                        alert('Email '+user.user.email+' has not been verified. Use the link from the verification email or use the "forgot password" link to send a verification email.');
                        firebase.auth().signOut();
                    }
                },onError);
            } else {
                alert('only firebase support!');
//                window.vxgcore.user.login(username, password).then(onLogin, onError);
            }
        });
        if (window.firebase){
            if (!firebase.apps.length)
                firebase.initializeApp(firebaseConfig);
            firebase.auth().onAuthStateChanged(function(user) {
                if (!user) {
                    $('body').removeClass('loginprocess');
                    self.wrapper.find('.bod').show();
                    if (vxg.user.src)
                        firebase.auth().signOut().then(function(){location.reload();});
                    return;
                }
// TODO: check email verification
                if (!window.is_new_user && no_check_mail_auth!==true && !user.emailVerified) {
                    $('body').removeClass('loginprocess');
                    self.wrapper.find('.bod').show();
//                    if (user && !user.emailVerified) firebase.auth().signOut();
                    alert('Email '+user.email+' has not been verified. Use the "forgot password" link to send a verification email.');
                    return;
                }
                if (window.is_new_user){
                    delete window.is_new_user;
                    return;
                }
                $('body').addClass('loginprocess');
                core.elements['global-loader'].show();
                user.getIdToken().then(function(r){
                    vxg.api.cloudone.user.login({token: r}).then(onLogin,function(r){
                        if (r && r.responseJSON && r.responseJSON.errorDetail)
                            alert(r.responseJSON.errorDetail);
                        else
                            alert('Login failed');

                        core.elements['global-loader'].hide();
                        $('body').removeClass('loginprocess');
                        firebase.auth().signOut().then(function(){location.reload();});
                    });
                },function(){
                    core.elements['global-loader'].hide();
                    $('body').removeClass('loginprocess');
                });
            });
            //firebase.auth().onError(function(user) {
            //    core.elements['global-loader'].hide();
            //});

        } else {
/*
TODO: add auth without firebase
            if (vs_api.isAuth()) {
                core.elements['global-loader'].show();
                $('body').addClass('loginprocess');
                vxg.api.cloudone.user.login({}).then(onLogin,function(r){
                    core.elements['global-loader'].hide();
                    $('body').removeClass('loginprocess');
                });
            } else
                self.wrapper.find('.bod').show();
*/
        }

        function displayVersion() {
            var file = "../../../version";
            var rawFile = new XMLHttpRequest();
            rawFile.open("GET", file, false);
            rawFile.onreadystatechange = function ()
            {
                if(rawFile.readyState === 4)
                {
                    if(rawFile.status === 200 || rawFile.status == 0)
                    {
                        var versionText = rawFile.responseText;
                        $('#cloudone-version').html(versionText.trim());
                    }
                }
            }
            rawFile.send(null);
        }

        function onLogin(r){
            vxg.user.src = r;

            if (!window.vxgstripe)
                    window.vxgstripe={};

                window.vxgstripe.vxgstripe_url = r['vxgstripe_url'];
                vxg.api.cloud.setAllCamsToken(r['allCamsToken']);
                vxg.api.cloud.apiSrc = r['cloud_url'];

              //core.elements['global-loader'].show();
              return vxg.user.getAllCamsTokenMeta().then(function(){
                  return window.core.loadControls(r['scripts']).then(function(){
                      let p;
                      if (!core.isMobile()) p = 'reports'; else p='cameras';
                      return window.core.activateFirstScreen(p).then(function(){
                          for (let i in window.core.screen_order)
                              if (window.core.screen_order[i]=="login" || window.core.screen_order[i]=="signup" || window.core.screen_order[i]=="forgot") 
                                   delete window.core.screen_order[i];
                          core.elements['global-loader'].hide();
                          $('body').removeClass('loginprocess');
                      }, function(){
                          if (window.core.screen_order[0]=="login") window.core.screen_order.shift();
                          core.elements['global-loader'].hide();
                          $('body').removeClass('loginprocess');
                      });
                  });
              },function(r){
                  alert('Error on get AllCamsTokenMeta');
                  core.elements['global-loader'].hide();
                  $('body').removeClass('loginprocess');
              });
        };
        function onError(r){
            alert('Authentication failed. Try Again...');
            core.elements['global-loader'].hide();
            $('body').removeClass('loginprocess');
        };

        return defaultPromise();
    },
    logout: function(){
        firebase.auth().signOut().then(function(){
	    window.location.href = '/#';  
        });
    }
};

window.screens['signup'] = {
    'menu_weight': 1000001,
    'html': path+'signup.html',
    'css':[path+'login.css'],
    'on_show':function(r){
        return defaultPromise();
    },
    'on_hide':function(){
    },
    'on_ready':function(){
        if (window.skin && window.skin.login_bottom_line) $('.loginbottomline').html(window.skin.login_bottom_line);
    },
    'on_init':function(){

        this.wrapper.find('form').submit(function(e){
            e.preventDefault();
            let username = $(e.target).find('[name="email"]').val();
            let password = $(e.target).find('[name="password"]').val();
            core.elements['global-loader'].show();

            if (window.firebase){
                window.is_new_user = true;
                firebase.auth().createUserWithEmailAndPassword(username, password)
                .then(function(authData){
                    var actionCodeSettings = {
                        url: (window.location.href.indexOf('#')===-1 ? window.location.href : window.location.href.substr(0,window.location.href.indexOf('#'))) + '#login='+username
                    };

                    firebase.auth().currentUser.sendEmailVerification(actionCodeSettings).then(function() {
                        if (no_check_mail_auth!==true) firebase.auth().signOut();
                        console.log('Email Verification Sent!');
                        alert('An e-mail verification link has been sent. Check your e-mail.');
                        screens['login'].activate();
                    }, function(r){
                        alert(r.message);
                    });

                    console.log("User created successfully with payload-", authData);
                    core.elements['global-loader'].hide();
                }).catch(function(_error){

                    console.log("Login Failed!", _error);
                    core.elements['global-loader'].hide();
                    alert(_error.message);
                })
            } else {
                alert('Only firebase support!');
//                window.vxgcore.user.login(username, password).then(onLogin, onError);
            }
        });



        return defaultPromise();
    },
};

window.screens['forgot'] = {
    'menu_weight': 1000002,
    'html': path+'forgot.html',
    'css':[path+'login.css'],
    'on_show':function(r){
        return defaultPromise();
    },
    'on_hide':function(){
    },
    'on_ready':function(){
        if (window.skin && window.skin.login_bottom_line) $('.loginbottomline').html(window.skin.login_bottom_line);
    },
    'on_init':function(){

        this.wrapper.find('form').submit(function(e){
            e.preventDefault();
            let username = $(e.target).find('[name="email"]').val();
            if (window.firebase){
                var actionCodeSettings = {
                    url: (window.location.href.indexOf('#')===-1 ? window.location.href : window.location.href.substr(0,window.location.href.indexOf('#'))) + '#login='+username
                };

                core.elements['global-loader'].show();
                window.firebase.auth().sendPasswordResetEmail(username, actionCodeSettings).then(function(){
                    alert('Password recovery email has been sent');
                    core.elements['global-loader'].hide();
                },function(){
                    alert('Fail to send password recovery email');
                    core.elements['global-loader'].hide();
                });
                
            }
/*
            let password = $(e.target).find('[name="password"]').val();
            core.elements['global-loader'].show();

            if (window.firebase){
                firebase.auth().createUserWithEmailAndPassword(username, password)
                .then((authData) => {
                    firebase.auth().currentUser.sendEmailVerification().then(function() {
                        // Email Verification sent!
                        console.log('Email Verification Sent!');
                      });

                    console.log("User created successfully with payload-", authData);
                    core.elements['global-loader'].hide();
                }).catch((_error) => {

                    console.log("Login Failed!", _error);
                    core.elements['global-loader'].hide();
                    alert(_error.message);
                })
            } else {
                window.vxgcore.user.login(username, password).then(onLogin, onError);
            }
*/
        });


        return defaultPromise();
    },
};

