var base64url = require('base64url');

// Try an existing token
module.exports = function(d,next) {
  if (!d.rawApi) { return next(d); }
  if (!d.rawApi.user) { return next(d); }
  if (!d.rawApi.user.getLogin) { return next(d); }
  if (!d.data) { return next(d); }
  if (!d.data.token) { return next(d); }

  // Fetch the signature & it's signer
  var signature = d.signature   || d.data.signature || undefined,
      signer    = d.data.signer || d.username       || undefined;

  // Generate signature if none present
  if (!signature) {
    if ( 'string' !== typeof d.username ) { return next(d); }
    if ( 'string' !== typeof d.password ) { return next(d); }
    d.ec.kp.setPrivate(d.generateSecret(d.username,d.password));
    signature = base64url.encode(d.ec.sign(d.data.token));
    signer    = d.data.signer || d.username;
  }

  // Add the signature to the token
  var tmpToken = d.data.token + '.' + signature;

  // Send the request
  return d.rawApi
    .user.getLogin({data : {token : tmpToken, username : d.username, signer: signer }})
    .then(d.catchRedirect)
    .then(function (response) {
      if (response.data && response.data.token) {
        d.api.setToken( response.data.token || d.settings.token );
        d.api.setRefreshToken( response.data.refreshToken || response.data.refresh_token || d.settings.refreshToken );
        d.resolve();
      } else {
        next(d);
      }
    });
};
