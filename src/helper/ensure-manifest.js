module.exports = function(scope) {
  /**
   * Ensure we have called the manifest at least once
   *
   * The manifest is a special call which builds the raw api calls
   * Raw api calls are used inside the simplified API that we export
   *
   * @returns {Promise}
   */
  return function ensureManifest() {
    return new Promise(function(resolve) {
      if ( Object.keys(scope.rawApi).length ) { return resolve(); }
      return scope.fetchManifest(resolve);
    }).then(scope.noop);
  };
};

