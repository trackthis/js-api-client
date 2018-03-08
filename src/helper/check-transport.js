module.exports = function(scope) {
  /**
   * Check if we have a transport adapter registered
   *
   * Returns a promise which resolves if we have a transport
   * Having a transport means we're supposed to be connected to an endpoint.
   *
   * @return {Promise}
   */
  return function checkTransport() {
    return new Promise(function (resolve, reject) {
      if ('function' === typeof scope.transport) {
        resolve();
      } else {
        reject('The api is not connected to the remote yet');
      }
    });
  };
};
