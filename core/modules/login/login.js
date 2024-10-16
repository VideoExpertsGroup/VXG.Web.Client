window.screens = window.screens || {};

var path = window.core.getPath('login.js');

let auth;

class KeycloakAdapter {
  constructor(config) {
    this.config = config;
  }

  login() {
    window.location.href = `${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/auth` +
      `?response_type=code` +
      `&scope=openid+email` +
      `&client_id=${this.config.clientId}` +
      `&redirect_uri=${encodeURIComponent(this.config.redirectUri)}`;
  }

  logout() {
    this.clearTokens();
    window.location.href = `${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/logout` +
      `?client_id=${this.config.clientId}` +
      `&redirect_uri=${encodeURIComponent(this.config.redirectUri)}`;
  }

  async init(authInitCallback) {
    try {
			const isAuthenticated = await this.isAuthenticated();
      if (!isAuthenticated) await this.handleLoginCallback();
      const user = await this.getUserInfo();
			authInitCallback(user)
    } catch (error) {
      console.error('Error during initialization:', error);
      this.login();
    }
  }

  async isAuthenticated() {
    try {
      const token = await this.getToken();
      return !!token;
    } catch (error) {
      return false;
    }
  }

  async fetchTokens(code) {
    const tokenUrl = `${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/token`;
    const params = new URLSearchParams();
    params.append('client_id', this.config.clientId);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', this.config.redirectUri);
    params.append('client_secret', this.config.clientSecret);

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      });

      if (!response.ok) throw new Error('Failed to obtain access token');

      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
        idToken: data.id_token,
      };
    } catch (error) {
      console.error('Error fetching tokens:', error);
      throw error;
    }
  }

  async refreshToken() {
    const tokens = this.getTokens();
    const refreshToken = tokens.refreshToken;
    const tokenUrl = `${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/token`;
    const params = new URLSearchParams();
    params.append('client_id', this.config.clientId);
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);
    params.append('client_secret', this.config.clientSecret);

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      });

      if (!response.ok) throw new Error('Failed to refresh access token');

      const data = await response.json();

      const newTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
        idToken: data.id_token,
      };

      this.storeTokens(newTokens);

      return newTokens;
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      throw error;
    }
  }

  getTokens() {
    const tokens = JSON.parse(localStorage.getItem('tokens'));
    if (!tokens) throw new Error('No tokens found');
    return tokens;
  }

  async getToken() {
    try {
      let tokens = this.getTokens();
      const isExpired = this.isTokenExpired(tokens.accessToken);
			const isTokenActive = await this.isTokenActive(tokens.accessToken);
      if (isExpired || !isTokenActive) tokens = await this.refreshToken();
      return tokens.accessToken;
    } catch (error) {
      throw new Error('No tokens found or failed to refresh token');
    }
  }

  storeTokens(tokens) {
    localStorage.setItem('tokens', JSON.stringify(tokens));
    console.log('Tokens stored:', tokens);
  }

  clearTokens() {
    localStorage.removeItem('tokens');
  }

  async handleLoginCallback() {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return false;

    try {
      const tokens = await this.fetchTokens(code);
      this.storeTokens(tokens);
      this.removeAuthorizationCodeFromUrl();

      const isAuthenticated = await this.isAuthenticated();
      if (!isAuthenticated) throw new Error('Authentication failed');
    } catch (error) {
      console.error('Error handling login callback:', error);
      throw error;
    }
  }

  async getUserInfo() {
    const { accessToken } = this.getTokens();
    if (!accessToken) throw new Error('No access token found');

    const url = `${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/userinfo`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch user info');

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }

  removeAuthorizationCodeFromUrl() {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('code');
    newUrl.searchParams.delete('session_state');
    newUrl.searchParams.delete('iss');
    window.history.replaceState({}, document.title, newUrl.toString());
  }

  async isTokenActive(token) {
    const introspectUrl = `${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/token/introspect`;
    const params = new URLSearchParams();
    params.append('client_id', this.config.clientId);
    params.append('client_secret', this.config.clientSecret);
    params.append('token', token);

    try {
      const response = await fetch(introspectUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      });

      if (!response.ok) throw new Error('Failed to introspect token');

      const data = await response.json();
      return data.active;
    } catch (error) {
      console.error('Error introspecting token:', error);
      return false;
    }
  }

  parseJWT(token) {
    try {
      const [, payloadBase64] = token.split('.');
      const decodedPayload = atob(payloadBase64);
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  }

  isTokenExpired(token) {
    if (!token) return true;

    const decodedToken = this.parseJWT(token);
    const currentTimestamp = Math.floor(Date.now() / 1000);

    return decodedToken && decodedToken.exp < currentTimestamp;
  }
}

class FirebaseAdapter {
	constructor(config) {
		if (!firebase.apps.length) firebase.initializeApp(config);
		this.auth = firebase.auth();
	}

	init(authInitCallback) {
		return new Promise((resolve, reject) => {
			this.auth.onAuthStateChanged((user) => {
				authInitCallback(user);
				this.getToken().then(token => resolve(token));
			});
		});
	}

	async login(username, password) {
		this.auth.signInWithEmailAndPassword(username, password).then(function(user) {
			core.elements['global-loader'].hide();
			$('body').removeClass('loginprocess');
			// TODO: check email verification
			// if (no_check_mail_auth !== true && user && user.user && !user.user.emailVerified) {
			// 	//   alert('Email '+user.user.email+' has not been verified. Use the link from the verification email or use the "forgot password" link to send a verification email.');
			// 	this.auth.signOut();
			// }
		}, () => {
			alert('Authentication failed. Try Again...');
			core.elements['global-loader'].hide();
			$('body').removeClass('loginprocess');
		});
	}

	logout() {
		  core.elements['global-loader'].hide();
		  $('body').removeClass('loginprocess');
			this.auth.signOut().then(() => location.reload());
	}

	async getToken() {
		const user = this.auth.currentUser;
		return user ? user.getIdToken() : null;
	}

	isAuthenticated() {
		return !!this.auth.currentUser;
	}

	createUserWithEmailAndPassword({ username, password }){
		return this.auth.createUserWithEmailAndPassword(username, password);
	}

	sendEmailVerification(settings){
		return this.auth.currentUser.sendEmailVerification(settings);
	}

	resetPassword(username, settings){
		return this.auth.sendPasswordResetEmail(username, settings);
	}
}

class AuthFactory {
	static create(auth) {
		switch (auth.identity) {
			case 'keycloak':
				return new KeycloakAdapter(auth.config);
			case 'firebase':
				return new FirebaseAdapter(auth.config);
			default:
				throw new Error('Invalid auth provider');
		}
	}
}

class Auth {
	constructor(auth) {
		this.identity = auth.identity;
		this.auth = AuthFactory.create(auth);
	}

	init(authInitCallback) {
		return this.auth.init(authInitCallback);
	}

	login(email, password) {
		return this.auth.login(email, password);
	}

	logout() {
		this.auth.logout();
	}

	getToken() {
		return this.auth.getToken();
	}

	isAuthenticated() {
		return this.auth.isAuthenticated();
	}

	createUserWithEmailAndPassword(credentials){
		return this.auth.createUserWithEmailAndPassword(credentials);
	}

	sendEmailVerification(settings){
		return this.auth.sendEmailVerification(settings);
	}

	resetPassword(username, settings){
		return this.auth.resetPassword(username, settings);
	}
}

window.screens['login'] = {
	'menu_weight': 1000000,
	'attrlistener': {
		click: {
			onclick_logout: "window.screens['login'].logout"
		}
	},
	'html': path + 'login.html',
	'css': [path + 'login.css'],
	'on_show': function(r) {
		return defaultPromise();
	},
	'on_hide': function() {},
	'on_ready': function() {
		if (window.skin && window.skin.login_bottom_line) $('.loginbottomline').html(window.skin.login_bottom_line);
	},
	'on_init': function() {
		function onLogin(r) {
			vxg.user.src = r;
			sessionStorage.removeItem("backToCam");
			localStorage.removeItem('locPath');

			if (!window.vxgstripe)
				window.vxgstripe = {};

			window.vxgstripe.vxgstripe_url = r['vxgstripe_url'];
			vxg.api.cloud.setAllCamsToken(r['allCamsToken']);
			vxg.api.cloud.apiSrc = r['cloud_url'];

			//core.elements['global-loader'].show();
			return vxg.user.getAllCamsTokenMeta().then(function() {
				return window.core.loadControls(r['scripts']).then(async function() {
					let p;
					var token = null;
					if (!core.isMobile()) p = 'home';
					else p = 'cameras';
					var localStorage_fromtagsview = localStorage.getItem("from_tagsview");
					var from_tagsview = (typeof localStorage_fromtagsview === "string");
					if (from_tagsview) {
						p = "tagsview";
						token = localStorage_fromtagsview;
						localStorage.removeItem('from_tagsview');
					}
					let url = window.location.href;
					let regexCameraId = /#camera\?camera_id=(\d+)/;
					let regexMetaId = /#camera\?meta=(\d+)/;
					let matchCameraId = url.match(regexCameraId);
					let matchMetaId = url.match(regexMetaId);
					if (matchCameraId && matchCameraId[1]) {
						let cameraId = matchCameraId[1];
						p = 'tagsview';
						token = cameraId;
					} else if (matchMetaId && matchMetaId[1]) {
						let metaId = matchMetaId[1];
						let camera = await vxg.cameras.getCameraFromMetaid(metaId);
						if (camera?.objects.length > 0) {
							p = 'tagsview';
							token = camera?.objects[0].id;
						}
					}
					return window.core.activateFirstScreen(p, token).then(function() {
						for (let i in window.core.screen_order)
							if (window.core.screen_order[i] == "login" || window.core.screen_order[i] == "signup" || window.core.screen_order[i] == "forgot")
								delete window.core.screen_order[i];
						if (localStorage.menuState == "closed") $('.close-menu').trigger("click");
						core.elements['global-loader'].hide();
						$('body').removeClass('loginprocess');
					}, function() {
						if (window.core.screen_order[0] == "login") window.core.screen_order.shift();
						if (localStorage.menuState == "closed") $('.close-menu').trigger("click");
						core.elements['global-loader'].hide();
						$('body').removeClass('loginprocess');
					});
				});
			}, function(r) {
				alert('Error on get AllCamsTokenMeta');
				auth.logout();
			});
		};

		const authInitCallback = async (user) => {
			if (!user) {
				if (auth.identity === 'firebase') {
					$('body').removeClass('loginprocess');
					this.wrapper.find('.bod').show();
					return;
				} else if (auth.identity === 'keycloak') {
					auth.logout();
				}

			}
			$('body').addClass('loginprocess');
			core.elements['global-loader'].show();

			const token = await auth.getToken();

			vxg.api.cloudone.user.login({ token })
				.then(onLogin, (r) => {
					if (r && r.responseJSON && r.responseJSON.errorDetail) alert(r.responseJSON.errorDetail);
					else alert($.t('toast.loginFailed'));

					// core.elements['global-loader'].hide();
					// $('body').removeClass('loginprocess');
					auth.logout();

				})
				.catch(() => { 
					alert('Authentication failed. Try Again...');
					auth.logout() 
				});
		};

		const authProvider = window.useAuthConfig ? authConfig : { identity: 'firebase', config: firebaseConfig };
		auth = new Auth(authProvider);
		auth.init(authInitCallback);


		let self = this;

		const addBtn = document.querySelector('.add-pwa-button');
		addBtn.style.display = 'none';

		if (window.core.isIos()) {
			var isWarn = window.localStorage.getItem('isIosWarn');

			if (isWarn === undefined || isWarn == null) {
				const customAlert = document.querySelector('.customAlert');
				const alertSolution = document.querySelector('.alertSolution');
				customAlert.style.display = "block";

				alertSolution.addEventListener('click', () => {
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

		if (location.hash.substr(0, 6) == '#login') {
			this.wrapper.find('[name="username"]').val(location.hash.substr(7));
			setTimeout(function() {
				self.wrapper.find('[name="password"]').focus();
			}, 1000);
			location.hash = '';
		} else setTimeout(function() {
			self.wrapper.find('[name="username"]').focus();
		}, 1000);

		core.elements['header-right'].append('<span class="signout" style="white-space: nowrap;" onclick_logout><svg class="inline-svg-icon icon-signout">' +
			'       <use xlink:href="#mouseout"></use>' +
			'    </svg><span class="font-md">' + $.t('auth.signOut') + '</span></span>');

		this.wrapper.find('form').submit(function(e) {
			e.preventDefault();
			let username = $(e.target).find('[name="username"]').val();
			let password = $(e.target).find('[name="password"]').val();

			core.elements['global-loader'].show();
			$('body').addClass('loginprocess');

			auth.login(username, password);
		});



		function displayVersion() {
			var file = "../../../version";
			var rawFile = new XMLHttpRequest();
			rawFile.open("GET", file, false);
			rawFile.onreadystatechange = function() {
				if (rawFile.readyState === 4) {
					if (rawFile.status === 200 || rawFile.status == 0) {
						var versionText = rawFile.responseText;
						$('#cloudone-version').html(versionText.trim());
					}
				}
			}
			rawFile.send(null);
		}

		return defaultPromise();
	},
	logout: function() {
		auth.logout();
		// firebase.auth().signOut().then(function(){
		sessionStorage.removeItem("backToCam");
		sessionStorage.removeItem("aiCams");
		sessionStorage.removeItem("cameraUrls");
		localStorage.removeItem("cameraList");
		localStorage.removeItem("cameraList_expiry");
		localStorage.removeItem("locPath");
		localStorage.removeItem("locationHierarchy");
		localStorage.removeItem("locationHierarchyCams");
		localStorage.removeItem("noLocCams");

		localStorage.removeItem("menuState");

		// sessionStorage.clear();
		// localStorage.clear();

		// window.location.href = '/#';  
		// });
	}
};

window.screens['signup'] = {
	'menu_weight': 1000001,
	'html': path + 'signup.html',
	'css': [path + 'login.css'],
	'on_show': function(r) {
		return defaultPromise();
	},
	'on_hide': function() {},
	'on_ready': function() {
		if (window.skin && window.skin.login_bottom_line) $('.loginbottomline').html(window.skin.login_bottom_line);
	},
	'on_init': function() {

		this.wrapper.find('form').submit(function(e) {
			e.preventDefault();
			let username = $(e.target).find('[name="email"]').val();
			let password = $(e.target).find('[name="password"]').val();
			core.elements['global-loader'].show();

			// auth = new Auth(firebaseConfig);
			auth.createUserWithEmailAndPassword({ username, password })
				.then(authData => {
					var actionCodeSettings = {
						url: (window.location.href.indexOf('#') === -1 ? window.location.href : window.location.href.substr(0, window.location.href.indexOf('#'))) + '#login=' + username
					};

					auth.sendEmailVerification(actionCodeSettings).then(function() {
						if (no_check_mail_auth !== true) auth.logout();
						console.log('Email Verification Sent!');
						alert('An e-mail verification link has been sent. Check your e-mail.');
						screens['login'].activate();
					}, function(r) {
						alert(r.message);
					});

					console.log("User created successfully with payload-", authData);
					core.elements['global-loader'].hide();
				})
				.catch(_error => {
					console.log("Login Failed!", _error);
					core.elements['global-loader'].hide();
					alert(_error.message);				
				})
		});



		return defaultPromise();
	},
};

window.screens['forgot'] = {
	'menu_weight': 1000002,
	'html': path + 'forgot.html',
	'css': [path + 'login.css'],
	'on_show': function(r) {
		return defaultPromise();
	},
	'on_hide': function() {},
	'on_ready': function() {
		if (window.skin && window.skin.login_bottom_line) $('.loginbottomline').html(window.skin.login_bottom_line);
	},
	'on_init': function() {

		this.wrapper.find('form').submit(function(e) {
			e.preventDefault();
			let username = $(e.target).find('[name="email"]').val();



			if (window.firebase) {
				var actionCodeSettings = {
					url: (window.location.href.indexOf('#') === -1 ? window.location.href : window.location.href.substr(0, window.location.href.indexOf('#'))) + '#login=' + username
				};

				core.elements['global-loader'].show();
				auth.resetPassword(username, actionCodeSettings)
					.then(() => alert('Password recovery email has been sent'))
					.catch(e => alert(`Error: ${e}`))
					.finally(() => core.elements['global-loader'].hide());
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