// Try oauth code from current query
module.exports = function(d,next,fail) {
  if (!d) { return fail('No data passed'); }
  if (!d.rawApi.oauth.postToken) { return next(d); }

  // Try to fetch the code
  var code = false;
  if (d.data.code) { code = code || d.data.code; }
  if (window && window.location && window.location.search) {
    var query = d.deserialize(window.location.search.slice(1));
    code      = code || query.code || code || false;
  }

  // If we don't have a code by now, cancel
  if (!code) { return next(d); }

  // Send the request
  return d.rawApi
    .oauth.postToken({
      data : {
        grant_type    : 'authorization_code',
        code          : code,
        redirect_uri  : d.settings.callback     || 'http://localhost:5000/',
        client_id     : d.settings.clientId     || 'APP-00',
        client_secret : d.settings.clientSecret || '8509203eb2b2dc05d71d382bbe9cbbfe409ddd13c6827c5ca477f6251ad9d7a9',
      }
    })
    .then(d.catchRedirect)
    .then(function(response) {
      if ( response.status === 200 ) {
        d.api.user.setToken( response.data && response.data.access_token || d.settings.token );
        d.api.user.setRefreshToken( response.data && response.data.refresh_token || d.settings.refreshToken );
        return d.resolve();
      }
      return next(d);
    });
};
