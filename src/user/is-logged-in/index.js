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
      .then(scope.rawApi.user.getMe)
      .then(function (response) {
        return !!(response && response.username);
      }, function () {
        return false;
      });
  };
};
