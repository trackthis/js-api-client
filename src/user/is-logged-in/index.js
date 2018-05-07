module.exports = function (scope) {
  /**
   * Returns a promise to the current logged-in user
   */
  return function () {
    if (scope.user) {
      return Promise.resolve(true);
    }
    return scope
      .checkTransport()
      .then(scope.ensureManifest)
      .then(function() {
        if (!(scope.token || scope.refresh_token)) {
          return false;
        }
        return scope.rawApi.user.getMe({ retry: 1 });
      })
      .then(function (response) {
        if ( 'boolean' === typeof response ) {
          return response;
        }
        return !!(response && response.data && response.data.username);
      }, function () {
        return false;
      });
  };
};
