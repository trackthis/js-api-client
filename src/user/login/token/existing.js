// Try an existing token
module.exports = function(d,next,fail) {
  if (!d.rawApi.user.getLogin) return next(d);
  if (!d.data) return next(d);
  if (!d.data.token) return next(d);

  // Send the request
  return d.rawApi
    .user.getLogin({data : {token : d.data.token, username : d.username }})
    .then(d.catchRedirect)
    .then(function (response) {
      if (response.data && response.data.token) {
        console.log('Authenticated through existing token');
        d.api.setToken( response.data.token || d.settings.token );
        d.api.setRefreshToken( response.data.refreshToken || response.data.refresh_token || d.settings.refreshToken );
        d.resolve();
      } else {
        next(d);
      }
    });
};
