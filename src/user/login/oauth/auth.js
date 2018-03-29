module.exports = function (scope) {

  // Try oauth init
  return function (data, next, fail) {
    if (!data) { return fail('No data passed'); }
    if (!scope.rawApi.oauth.getAuth) { return next(data); }

    // Convert the username(s) into csv
    if (Array.isArray(data.username)) {
      /** global: encodeURIComponent */
      data.username = data.username.map(encodeURIComponent).map(function (name) {
        return name.replace(/,/g, '%2C');
      }).join(',');
    }

    // Send the request
    return scope
      .rawApi.oauth.getAuth({
        data : {
          account       : data.username,
          response_type : 'code',
          client_id     : scope.clientId     || 'APP-00',
          redirect_uri  : scope.redirect_uri || 'http://trackthis.nl/',
          scope         : ''
        }
      })
      .then(scope.catchRedirect)
      .then(function () {
        fail('We should\'ve gotten a redirect');
      });
  };

};
