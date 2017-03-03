LinkedIn = {};

// Request LinkedIn credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
LinkedIn.requestCredential = function (options, credentialRequestCompleteCallback) {
  console.log('🔑', 'LinkedIn.requestCredential');
  // support both (options, callback) and (callback).
  if (!credentialRequestCompleteCallback && typeof options === 'function') {
    credentialRequestCompleteCallback = options;
    options = {};
  }

  const config = ServiceConfiguration.configurations.findOne({service: 'linkedin'});
  console.log('🔑 config', config);
  if (!config) {
    credentialRequestCompleteCallback && credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError("Service not configured"));
    console.log('🔑', 'returning no config');
    return;
  }

  const credentialToken = Random.secret();

  let scope = [];
  if (options && options.requestPermissions) {
      scope = options.requestPermissions.join('+');
  }

  const loginStyle = OAuth._loginStyle('linkedin', config, options);

  const loginUrl =
        'https://www.linkedin.com/uas/oauth2/authorization' +
        '?response_type=code' + '&client_id=' + config.clientId +
        '&redirect_uri=' + OAuth._redirectUri('linkedin', config) +
        '&scope=' + scope +
        '&state=' + OAuth._stateParam(loginStyle, credentialToken);

  OAuth.launchLogin({
    loginService: "linkedin",
    loginStyle: loginStyle,
    loginUrl: loginUrl,
    credentialRequestCompleteCallback: credentialRequestCompleteCallback,
    credentialToken: credentialToken
  });
};
