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
      .then(scope.rawApi.user.getMe)
      .then(function (response) {
        // Convert the user from minified into long names
        return {
          created_at : response && response.data && response.data.iat || 0,
          username   : response && response.data && response.data.nam || null
        };
      });
  };
};
