module.exports = function (api) {

  // The variables that we can 'initialize' to a default without other modules
  var scope = {
    api               : api,
    rawApi            : {}, // The actual calls, built by the manifest,
    supportedVersions : [1],
    skipManifestKeys  : [
      'baseuri', 'formats'
    ],
    chosenVersion     : null,
    protocol          : 'https',
    hostname          : null,
    port              : null,
    basePath          : null,
    transport         : null,
    redirect_uri      : undefined,
    client_id         : undefined,
    client_secret     : undefined,
    token             : undefined,
    refresh_token     : undefined,
    user              : undefined,
    keypair           : undefined,
    ec                : undefined,
    signature         : {
      pubkey     : undefined, // the server's public key,
      curve      : 'secp256k1',
      label      : 'ecdsa-sha2-secp256k1',
      keylen     : 32,
      digest     : 'sha256',
      format     : 'base64',
      iterations : {
        base   : 1000,
        hash   : 'sha256',
        modulo : 9000
      }
    }
  };

  // Static helpers
  scope.cbq       = require('./helper/cbq');
  scope.intersect = require('./helper/intersect');

  // Active helpers
  scope.catchRedirect         = require('./helper/catch-redirect')(scope);
  scope.checkTransport        = require('./helper/check-transport')(scope);
  scope.deserialize           = require('./helper/deserialize')(scope);
  scope.ensureManifest        = require('./helper/ensure-manifest')(scope);
  scope.ensureSignatureConfig = require('./helper/ensure-signature-config')(scope);
  scope.fetchManifest         = require('./helper/fetch-manifest')(scope);
  scope.generateSecret        = require('./helper/generate-secret')(scope);
  scope.noop                  = require('./helper/noop')(scope);
  scope.serialize             = require('./helper/serialize')(scope);
  scope.set_deep              = require('./helper/set-deep')(scope);
  scope.transports            = require('./transport')(scope);

  return scope;
};
