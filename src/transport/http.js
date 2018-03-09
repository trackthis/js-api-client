module.exports = function(scope) {
  /**
   * HTTP protocol handler
   *
   * The ajax-request supports both HTTP and HTTPS, so simply redirect to the HTTPS handler
   */
  return {
    defaultPort : 80,
    transport   : function (options) {
      if ('string' === typeof options) { options = {name : options}; }
      options = options || {};
      if (!options.name) { return Promise.reject('No name given'); }
      options.protocol = 'http';
      options.port     = options.port || scope.port || scope.transports.http.defaultPort;
      return this.transports.https.transport(options);
    }
  };
};
