module.exports = function (scope) {
  /**
   * Returns whether OTP is required/optional for the user
   */
  return function (data) {
    data = data || {};
    if ( 'string' === typeof data ) {
      data = { username: data };
    }

    if ( 'object' !== typeof data ) {
      return Promise.reject('No valid data was given');
    }

    // Fetch the username
    var username = false;
    username = username || data.username;
    username = username || data.usr;
    username = username || data.user;
    username = username || ( scope.user && scope.user.username );
    if(!username) {
      return Promise.reject('No username was given');
    }

    // Make the call
    return scope
      .checkTransport()
      .then(scope.ensureManifest)
      .then(function() {
        return scope.rawApi.oauth['getOtp-required']({
          data : {
            username : username
          }
        });
      })
      .then(function (response) {
        return response.data;
      });
  };
};
