var base64url = require('base64url');

// Try a self-generated token
module.exports = function (d, next, fail) {
  if (!d) { return fail('No data passed'); }
  if (!d.rawApi.user.getLogin) { return next(d); }
  if ('string' !== typeof d.username) { return next(d); }
  if ('string' !== typeof d.password) { return next(d); }

  // Generate the keypair
  d.ec.kp.setPrivate(d.generateSecret(d.username, d.password));

  // Generate the part of the token we'll sign
  // This one expires in 5 minutes to prevent abuse
  var token = base64url.encode(JSON.stringify({
    "alg" : "ES256",
    "typ" : "JWT",
    "exp" : Math.round((new Date()).getTime() / 1000) + 300
  })) + '.' + base64url.encode(JSON.stringify({
    username : d.username
  }));

  // Generate it's signature
  var rawsig    = d.ec.sign(token),
      signature = base64url.encode(rawsig);
  token += '.' + signature;

  // Send the request
  return d.rawApi
    .user.getLogin({ data : {token : token }})
    .then(d.catchRedirect)
    .then(function (response) {
      if (response.data && response.data.token) {
        d.api.user.setToken(response.data.token || d.settings.token);
        d.api.user.setRefreshToken(response.data.refreshToken || response.data.refresh_token || d.settings.refreshToken);
        d.resolve(response.data);
      } else {
        next(d);
      }
    });
};
