module.exports = function (scope) {

  /**
   * Try to login through all available methods
   *
   * @param {object} [data]
   *
   * @return {Promise}
   */
  return function (data) {
    data = data || {};
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

        return new Promise(function (resolve, reject) {
          cbq([
            function (d, next) {
              data.username = username;
              data.password = password;
              data.reject   = reject;
              data.resolve  = function (response) {
                scope.api.emit('login', response);
                return resolve(response);
              };
              next(data);
            },

            require('./oauth/token')(scope),
            require('./token/existing')(scope),
            require('./token/existing-signed')(scope),
            require('./username/signed')(scope),
            require('./token/generated')(scope),
            require('./oauth/auth')(scope),
          ], reject.bind(undefined, 'None of our supported authentication methods is supported by the server'), reject);
        });
      });
  };
};
