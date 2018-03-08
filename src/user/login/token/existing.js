// Try an existing token
module.exports = function(d,next,fail) {
  if (!d) { return fail('No data passed'); }
  if (!d.rawApi.user.getLogin) { return next(d); }
  if (!d.data.token) { return next(d); }

  // Send the request
  return d.rawApi
    .user.getLogin({data : {token : d.data.token, username : d.username }})
    .then(d.catchRedirect)
    .then(function (response) {
      if (response.data && response.data.token) {
        d.api.user.setToken( response.data.token || d.settings.token );
        d.api.user.setRefreshToken( response.data.refreshToken || response.data.refresh_token || d.settings.refreshToken );
        d.resolve(response.data);
      } else {
        next(d);
      }
    });
};
