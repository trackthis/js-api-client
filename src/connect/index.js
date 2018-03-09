var url = require('url');

module.exports = function (scope) {
  /**
   * Connect the api client to the (default) remote
   *
   * Optionally takes a callback function for when it's ready
   * Returns a promise that will resolve when connected or reject on a failure to connect
   *
   * @param {void | string   | object} options
   * @param {void | function }         callback
   *
   * @return {Promise}
   */
  return function (options, callback) {
    if ('function' === typeof options) {
      callback = options;
      options  = {};
    }
    if ('string' === typeof options) { options = {remote : options}; }
    options = options || {};
    if ('object' !== typeof options) { throw "Given options was neither a string, an object or undefined"; }
    options.remote = options.remote || 'https://trackthis.nl/api';
    var parsed     = url.parse(options.remote);
    scope.protocol = options.protocol || parsed.protocol || 'http';
    if (scope.protocol.slice(-1) === ':') { scope.protocol = scope.protocol.slice(0, -1); }
    if (!scope.transports[scope.protocol]) { return Promise.reject('Given protocol not supported'); }
    scope.hostname  = options.hostname || parsed.hostname || 'trackthis.nl';
    scope.port      = options.port || parsed.port || (scope.transports[scope.protocol] && scope.transports[scope.protocol].defaultPort) || 8080;
    scope.basePath  = options.basePath || parsed.pathname || '/api/';
    scope.transport = scope.transports[scope.protocol].transport;
    if (scope.basePath.slice(-1) !== '/') { scope.basePath += '/'; }
    return scope
      .checkTransport()
      .then(function () {
        return scope
          .transport(Object.assign({name : 'versions'}, options))
          .then(scope.catchRedirect)
          .then(function (response) {
            var serverVersions  = response.data.map(function (v) {
              return (v.substr(0, 1) === 'v') ? parseInt(v.substr(1)) : v;
            });
            scope.chosenVersion = scope.intersect(serverVersions, scope.supportedVersions).pop();
            if (!scope.chosenVersion) {
              throw 'We do not support any versions supported by the server';
            }
          });
      })
      .then(('function' === (typeof callback)) ? callback : scope.noop);
  };
};
