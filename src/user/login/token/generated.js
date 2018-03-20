var base64url = require('base64url');

module.exports = function (scope) {

  // Try a self-generated token
  return function (data, next, fail) {
    if (!data) { return fail('No data passed'); }
    if (!scope.rawApi.user.getLogin) { return next(data); }
    if ('string' !== typeof data.username) { return next(data); }
    if ('string' !== typeof data.password) { return next(data); }

    // Generate the keypair
    scope.ec.kp.setPrivate(scope.generateSecret(data.username, data.password));

    // Generate the part of the token we'll sign
    // This one expires in 5 minutes to prevent abuse
    var token = base64url.encode(JSON.stringify({
      "alg" : "ES256",
      "typ" : "JWT",
      "exp" : Math.round((new Date()).getTime() / 1000) + 300
    })) + '.' + base64url.encode(JSON.stringify({
      username : data.username
    }));

    // Generate it's signature
    var rawsig    = scope.ec.sign(token),
        signature = base64url.encode(rawsig);

    // Self-verify the signature
    if (!scope.ec.verify( token, rawsig )) {
      return next(data);
    }

    token += '.' + signature;

    // Send the request
    return scope
      .rawApi.user.getLogin({data : {token : token}})
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
