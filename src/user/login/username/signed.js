var base64url = require('base64url');

// Try a signed username
module.exports = function(d,next,fail) {
  if (!d) { return fail('No data passed'); }
  if (!d.rawApi.user.getLogin) { return next(); }
  if ( 'string' !== typeof d.username ) { return next(); }
  if ( 'string' !== typeof d.password ) { return next(); }

  // Generate the keypair
  d.ec.kp.setPrivate(generateSecret(d.username,d.password));

  // Generate the signature for the username
  var signature = base64url.encode(d.ec.sign(d.username));

  // Send the request
  return d.rawApi
    .user.getLogin({ data: { username: d.username, signature: signature } })
    .then(d.catchRedirect)
    .then(function (response) {
      if (response.data && response.data.token) {
        d.api.user.setToken( response.data.token || d.settings.token );
        d.api.user.setRefreshToken( response.data.refreshToken || response.data.refresh_token || d.settings.refreshToken );
        resolve();
      } else {
        next();
      }
    });
};
