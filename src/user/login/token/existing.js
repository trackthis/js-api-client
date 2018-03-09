module.exports = function (scope) {
  // Try an existing token
  return function (data, next, fail) {
    if (!data) { return fail('No data passed'); }
    if (!scope.rawApi.user.getLogin) { return next(data); }
    if (!data.token) { return next(data); }

    // Send the request
    return scope
      .rawApi.user.getLogin({data : {token : data.token, username : data.username}})
      .then(scope.catchRedirect)
      .then(function (response) {
        if (response.data && response.data.token) {
          scope.api.setToken(response.data.token || scope.token);
          scope.api.setRefreshToken(response.data.refreshToken || response.data.refresh_token || scope.refreshToken);
          data.resolve(response.data);
        } else {
          next(data);
        }
      });
  };
};
