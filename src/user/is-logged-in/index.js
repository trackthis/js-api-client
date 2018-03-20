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
      .then(scope.rawApi.user.getMe)
      .then(function (response) {
        return !!(response && response.data && response.data.username);
      }, function () {
        return false;
      });
  };
};
