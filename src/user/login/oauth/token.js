module.exports = function (scope) {

  // Try oauth code from current query
  return function (data, next, fail) {
    if (!data) { return fail('No data passed'); }
    if (!scope.rawApi.oauth.postToken) { return next(data); }

    // Try to fetch the code
    var code = data.code || false;
    if ( (!code) && window && window.location && window.location.search) {
      var query = scope.deserialize(window.location.search.slice(1));
      code      = query.code || false;
    }

    // If we don't have a code by now, cancel
    if (!code) { return next(data); }

    // Send the request
    return scope
      .rawApi.oauth.postToken({
        data : {
          grant_type    : 'authorization_code',
          code          : code,
          redirect_uri  : scope.redirect_uri  || 'http://trackthis.nl/',
          client_id     : scope.client_id     || 'APP-00',
          client_secret : scope.client_secret || '8509203eb2b2dc05d71d382bbe9cbbfe409ddd13c6827c5ca477f6251ad9d7a9',
        }
      })
      .then(scope.catchRedirect)
      .then(function (response) {
        if (response.status === 200) {
          scope.api.setToken(response.data && response.data.access_token || scope.token);
          scope.api.setRefreshToken(response.data && response.data.refresh_token || scope.refresh_token);
          scope.api.setTokenExpires(response.data.expires_in   || response.data.expires || response.data.expires_at || response.data.exp || scope.token_expires);
          return data.resolve(response.data);
        }
        return next(data);
      });
  };


};
