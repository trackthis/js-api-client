module.exports = function (scope) {
  return function fetchManifest(callback) {
    return scope
      .checkTransport()
      .then(function () {
        return scope.transport('manifest');
      })
      .then(function (response) {
        if ( 'object' !== typeof response.data ) {
          throw 'Manifest response is not valid';
        }
        (function processManifest(data, apiref, path) {
          Object.keys(data)
                .forEach(function(key) {
                  if (scope.skipManifestKeys.indexOf(key)>=0) { return; }
                  if('object'!==(typeof data[key])) { return; }
                  if ( data[key].url ) {
                    Object.keys(data[key])
                          .forEach(function(method) {
                            if ( method === 'url' || method === 'description' ) { return; }
                            apiref[method.toLowerCase() + key.slice(0, 1).toUpperCase() + key.slice(1)] = function (options) {
                              var returnType = ( data[key][method] && data[key][method].return && data[key][method].return.type ) || 'Object';
                              options = options || {};
                              options.data = options.data || {};
                              switch(returnType) {
                                case 'Page':
                                  var protocol = scope.protocol;
                                  if (['http','https'].indexOf(protocol) < 0) { protocol = 'http'; }
                                  protocol += ':';
                                  var uri = url.format({
                                    protocol : protocol,
                                    hostname : scope.hostname,
                                    port     : scope.port,
                                    pathname : options.data.pathname || ( scope.basePath + ((options.name==='versions')?'':('v'+ scope.chosenVersion +'/')) + path.concat([key]).join('/') ),
                                    search   : '?' + scope.serialize(options.data)
                                  });
                                  var response = {
                                    status: 302,
                                    data  : { location: uri }
                                  };
                                  response.text = JSON.stringify(response.data);
                                  return Promise.resolve(response);
                                default:
                                  options.data.token = options.data.token || scope.token;
                                  return scope.checkTransport()
                                    .then(function() {
                                      return scope.transport(Object.assign({
                                        method : method.toUpperCase(),
                                        name   : path.concat([key]).join('.')
                                      },options));
                                    });
                              }
                            };
                          });
                  } else {
                    processManifest(data[key], apiref[key]=apiref[key]||{}, path.concat([key]));
                  }
                });
        })(response.data, scope.rawApi, []);
        return response.data;
      })
      .then(('function'===(typeof callback))?callback:scope.noop);
  };
};
