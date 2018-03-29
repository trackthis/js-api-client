module.exports = function (scope) {
  /**
   * Returns a promise to the current logged-in user
   */
  return function (data) {
    if (scope.user) {
      return Promise.resolve(scope.user);
    }
    return scope
      .checkTransport()
      .then(scope.ensureManifest)
      .then(function() {
        return scope.rawApi.user.getMe();
      })
      .then(function (response) {
        scope.user = response.data;
        return response.data;
      });
  };
};
