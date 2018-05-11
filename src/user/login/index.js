// TODO: move this to auth instead of user?

module.exports = function (scope) {
  var cbq = scope.cbq;

  /**
   * Try to login through all available methods
   *
   * @param {object} [data]
   * @param {object} [options]
   *
   * @return {Promise}
   */
  return function (data, options) {
    data    = data    || {};
    options = options || {};
    return scope
      .checkTransport()
      .then(scope.ensureManifest)
      .then(scope.ensureSignatureConfig)
      .then(scope.api.user.isLoggedIn)
      .then(function (isLoggedIn) {

        var user      = data.username || data.user || data.usr || data.account || data.acc || false,
            username  = (user && user.username) || (user && user.name) || user || undefined,
            password  = data.password || data.pass || data.passwd || data.pwd || data.pw || undefined;

        if (isLoggedIn && ( scope.user.username === username ) ) {
          return Promise.resolve({});
        }

        // Detect which methods to (not) use
        options.methods = options.methods || {};
        var methods = Object.assign({
          oauth          : true,
          oauthAuthCode  : false,
          tokenExisting  : true,
          tokenSigned    : true,
          tokenGenerated : true,
          usernameSigned : true
        }, options.methods);

        // Always return a promise
        return new Promise(function (resolve, reject) {

          // Queue init
          var queue = [function(d, next) {
            data.username = username;
            data.password = password;
            data.reject   = reject;
            data.resolve  = function (response) {
              scope.api.emit('login', response);
              return resolve(response);
            };
            next(data);
          }];

          // Maybe fetch the authorization code
          if ( methods.oauthAuthCode ) {
            queue.push(require('./oauth/get-code')(scope));
          }

          // Oauth access_code catch
          if ( methods.oauth ) {
            queue.push(require('./oauth/token')(scope));
          }

          // Tokens
          if ( methods.tokenExisting ) {
            queue.push(require('./token/existing')(scope));
          }
          if ( methods.tokenSigned ) {
            queue.push(require('./token/existing-signed')(scope));
          }

          // Signed username
          if ( methods.usernameSigned ) {
            queue.push(require('./username/signed')(scope));
          }

          // Self-generated token
          if ( methods.tokenGenerated ) {
            queue.push(require('./token/generated')(scope));
          }

          // Actual oauth
          if ( methods.oauth ) {
            queue.push(require('./oauth/auth')(scope));
          }

          cbq(queue, reject.bind(undefined, 'None of our supported authentication methods is supported by the server'), reject);
        });
      });
  };
};
