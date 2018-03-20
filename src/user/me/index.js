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
      .then(scope.rawApi.user.getMe)
      .then(function (response) {
        return scope.user = response.data;
      });
  };
};
