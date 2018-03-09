module.exports = function (scope) {

  /**
   * Register a new protocol handler
   *
   * @param {string}   protocol
   * @param {object}   options
   * @param {function} [callback]
   *
   * @returns {Promise}
   */
  scope.api.registerTransport = function (protocol, options, callback) {
    if ('function' === typeof callback) {
      return scope
        .api.registerTransport(protocol, options)
        .then(function (data) {
          callback(undefined, data);
        }, function (err) {
          callback(err);
        });
    }
    options = options || {};
    if ('object' === typeof protocol) {
      options  = protocol;
      protocol = options.protocol || options.proto || options.name || '';
    }
    if ('string' !== protocol) {
      return Promise.reject('Protocol not given or not a string');
    }
    if ('function' !== options.transport) {
      return Promise.reject('Transport not given or not a function');
    }
    options.defaultPort        = options.defaultPort || options.port || 80;
    scope.transports[protocol] = options;
    return Promise.resolve();
  };

  return {
    http  : require('./http')(scope),
    https : require('./https')(scope)
  };
};
