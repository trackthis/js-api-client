module.exports = function (scope) {
  /**
   * Returns whether OTP is required/optional for the user
   */
  return function (data) {
    data         = data || {};

    // Fetch the username
    var username = false;
    username = username || data.username;
    username = username || data.usr;
    username = username || data.username;
    username = username || ( scope.user && scope.user.username );
    if(!username) {
      return Promise.reject('No username was given');
    }

    // Make the call
    return scope
      .checkTransport()
      .then(scope.ensureManifest)
      .then(function() {
        return scope.rawApi.oauth['getOtp-required']();
      })
      .then(function (response) {
        return response.data;
      });
  };
};
