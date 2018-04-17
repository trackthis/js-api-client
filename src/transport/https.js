/**
 * HTTPS protocol handler
 *
 * Converts our raw named calls into AJAX request based on settings like the hostname, port & basePath
 */

var ajax = require('ajax-request'),
    url  = require('url');

module.exports = function(scope) {
  return {
    defaultPort : 443,
    transport   : function _transport(options, tries) {
      tries = tries || 0;
      if ('string' === typeof options) { options = {name : options}; }
      options = options || {};
      if (!options.name) { return Promise.reject('No name given'); }
      scope.basePath = scope.basePath || '/';
      if (scope.basePath.slice(-1) !== '/') { scope.basePath += '/'; }
      var parsed       = options.url && url.parse(options.url) || {};
      options.name     = options.name.replace(/\./g, '/');
      options.method   = (options.method || 'get').toUpperCase();
      options.protocol = options.protocol || parsed.protocol || scope.protocol || (document && document.location && document.location.protocol);
      if (options.protocol.slice(-1) !== ':') { options.protocol += ':'; }
      options.hostname = options.hostname || parsed.hostname || scope.hostname || (document && document.location && document.location.hostname);
      options.port     = options.port || parsed.port || scope.port || (document && document.location && document.location.port);
      options.pathname = options.pathname || (scope.basePath + ((options.name === 'versions') ? '' : ('v' + scope.chosenVersion + '/')) + options.name + '.json');
      options.url      = url.format(options);
      options.data     = options.data || {};
      Object.keys(options.data).forEach(function(key) {
        if ( 'undefined' === typeof options.data[key] ) {
          delete options.data[key];
        }
      });
      return new Promise(function (resolve, reject) {
        if ( options.token && 'string' === typeof options.token ) {
          options.headers = options.headers || {};
          options.headers.Authorization = 'Bearer ' + options.token;
        }
        ajax(options, function (err, res, body) {
          if ( (tries<8) && res && (res.statusCode === 500) && (options.method ==='GET') ) {
            setTimeout(function() {
              resolve(_transport(options,tries+1));
            }, 15 * Math.pow(2,tries) );
            return;
          }
          var output = {
            status : res.statusCode,
            text   : body,
            data   : null
          };
          try {
            output.data = JSON.parse(output.text);
          } catch (e) {
            output.data = null;
          }
          if (err) { return reject(Object.assign({error : err}, output)); }
          resolve(output);
          return undefined;
        });
      });
    }
  };
};
