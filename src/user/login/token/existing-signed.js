var base64url = require('base64url');

module.exports = function (scope) {

  // Try an existing token
  return function (data, next, fail) {
    if (!data) { return fail('No data passed'); }
    if (!scope.rawApi.user.getLogin) { return next(data); }
    if (!data.token) { return next(data); }

    // Fetch the signature & it's signer
    var signature = data.signature || undefined,
        signer    = data.signer || data.username || undefined;

    // Generate signature if none present
    if (!signature) {
      if ('string' !== typeof data.username) { return next(data); }
      if ('string' !== typeof data.password) { return next(data); }
      scope.ec.kp.setPrivate(scope.generateSecret(data.username, data.password));
      signature = base64url.encode(scope.ec.sign(data.token));
      signer    = data.username;
    }

    // Add the signature to the token
    var tmpToken = data.token + '.' + signature;

    // Send the request
    return scope
      .rawApi.user.getLogin({data : {token : tmpToken, username : data.username, signer : signer}})
      .then(scope.catchRedirect)
      .then(function (response) {
        if (response.data && response.data.token) {
          scope.api.setToken(response.data.token || scope.token);
          scope.api.setRefreshToken(response.data.refreshToken || response.data.refresh_token || scope.refresh_token);
          data.resolve(response.data);
        } else {
          next(data);
        }
      });
  };
};
