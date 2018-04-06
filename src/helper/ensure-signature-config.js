var EC = require('trackthis-ecdsa');

module.exports = function (scope) {
  /**
   * Ensure we have the configuration we need for building signatures
   *
   * @returns {Promise}
   */
  return function ensureSignatureConfig() {
    return new Promise(function (resolve, reject) {
      if (scope.signature.pubkey) { return resolve(); }
      return scope
        .ensureManifest()
        .then(scope.rawApi.signature.getConfig)
        .then(function (response) {
          if (! (response && response.data)) {
            return Promise.reject('No data was given');
          }
          scope.signature.curve     = response.data.curve      || scope.signature.curve;
          scope.signature.digest    = response.data.digest     || scope.signature.digest;
          scope.signature.format    = response.data.format     || scope.signature.format;
          scope.signature.signature = response.data.iterations || scope.signature.signature;
          scope.signature.keylen    = response.data.keylen     || scope.signature.keylen;
          scope.signature.pubkey    = response.data.pubkey     || scope.signature.pubkey;
          if ( (!scope.ec) || ( scope.ec.curve !== scope.signature.curve ) ) {
            scope.ec = new EC(scope.signature.curve);
          }
        })
        .then(resolve, reject);
    }).then(scope.noop);
  };

};
