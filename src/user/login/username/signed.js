var base64url = require('base64url');

module.exports = function (scope) {

// Try a signed username
  return function (data, next, fail) {
    if (!data) { return fail('No data passed'); }
    if (!scope.rawApi.user.getLogin) { return next(data); }
    if ('string' !== typeof data.username) { return next(data); }
    if ('string' !== typeof data.password) { return next(data); }

    // Generate the keypair
    scope.ec.kp.setPrivate(scope.generateSecret(data.username, data.password));

    // Generate the signature for the username
    var signature = base64url.encode(scope.ec.sign(data.username));

    // Send the request
    return scope
      .rawApi.user.getLogin({data : {username : data.username, signature : signature}})
      .then(scope.catchRedirect)
      .then(function (response) {
        if (response.data && response.data.token) {
          scope.api.setToken(response.data.token || scope.token);
          scope.api.setRefreshToken(response.data.refreshToken || response.data.refresh_token || scope.refreshToken);
          scope.api.setTokenExpires(response.data.expires_in   || response.data.expires || response.data.expires_at || response.data.exp || scope.token_expires);
          data.resolve(response.data);
        } else {
          next(data);
        }
      });
  };


};
