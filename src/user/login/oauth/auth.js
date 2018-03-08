// Try oauth init
module.exports = function(d,next,fail) {
  if (!d) { return fail('No data passed'); }
  if (!d.rawApi.oauth.getAuth) { return next(d); }

  // Convert the username(s) into csv
  if (Array.isArray(d.username)) {
    d.username = d.username.map(encodeURIComponent).map(function(name) {
      return name.replace(/,/g, '%2C');
    }).join(',');
  }

  // Send the request
  return d.rawApi
    .oauth.getAuth({
      data : {
        account       : d.username,
        response_type : 'code',
        client_id     : d.settings.clientId || 'APP-00',
        redirect_uri  : d.settings.callback || 'http://localhost:5000/',
        scope         : ''
      }
    })
    .then(d.catchRedirect)
    .then(function() {
      fail('We should\'ve gotten a redirect');
    });
};
