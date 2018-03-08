// Try an existing token
module.exports = function(d,next,fail) {
  if (!d.rawApi.user.getLogin) return next();
  if (!d.data) return next();
  if (!d.data.token) return next();

  // Send the request
  return d.rawApi
    .user.getLogin({data : {token : d.data.token, username : d.username }})
    .then(d.catchRedirect)
    .then(function (response) {
      if (response.data && response.data.token) {
        console.log(response);
        console.log('Authenticated through existing token');
        d.api.setToken( response.data.token || d.settings.token );
        d.api.setRefreshToken( response.data.refreshToken || response.data.refresh_token || d.settings.refreshToken );
        resolve();
      } else {
        next();
      }
    });
};
