module.exports = function (scope) {
  /**
   * Returns a promise to the current logged-in user
   */
  return function ( data ) {
    data = data || {};
    if ( 'string' === typeof data ) {
      data = { username: data };
    }
    return scope
      .checkTransport()
      .then(scope.ensureManifest)
      .then(function() {
        return scope.rawApi.user['getReset-password']({ retry: false, data: data });
      })
      .then(function (response) {
        return !!response.data;
      }, function () {
        return false;
      });
  };
};
