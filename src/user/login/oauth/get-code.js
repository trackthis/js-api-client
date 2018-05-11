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

    console.log('get-code');

    // account=admin
    // response_type=code
    // client_id=APP-00
    // redirect_uri=https%3A%2F%2Ftrackthis-frontend.herokuapp.com
    // username=admin
    // password=admin

    // trusted:
    //   {
    //     code
    //     state
    //     redirect_uri
    //   }

    // untrusted:
    //   {
    //     token   : token to use for confirmation,
    //     scope   : scope,
    //     version : 'v1'
    //     app     : remote_app data
    //   }

    // Build request
    var options = {
      noRedirect : true,
      retry      : false,
      data       : {
        account       : data.username,
        response_type : 'code',
        client_id     : data.client_id || data.clientId || scope.clientId || 'APP-00', // TODO: make this nicer
        redirect_uri  : scope.redirect_uri || 'http://trackthis.nl/',
        username      : data.username,
        password      : data.password
      }
    };

    if ( data.token || data.grant_code ) {
      options.data.token = data.token || data.grant_code;
    }

    // Send the request
    return scope
      .rawApi.oauth.getAuth(options)
      .then(function(response) {
        if (!response.data) { return data.reject('Invalid response'); }

        // Trusted catch
        if ( response.data.code && response.data.redirect_uri ) {
          if ( 'undefined' !== typeof window && window.location ) {
            window.location.href = response.data.redirect_uri + '?code=' + response.data.code;
          } else {
            data.resolve(response.data);
          }
        }

        // Untrusted
        return data.resolve(response.data);
      });
  };

};
