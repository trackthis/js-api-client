module.exports = function (api) {

  // The variables that we can 'initialize' to a default without other modules
  var scope = {
    api               : api,
    rawApi            : {}, // The actual calls, built by the manifest,
    supportedVersions : [1],
    skipManifestKeys  : [
      'baseuri', 'formats'
    ],
    protocol          : 'https',
    chosenVersion     : null,
    basePath          : null,
    hostname          : null,
    port              : null,
    transport         : null,
    client_id         : undefined,
    client_secret     : undefined,
    ec                : undefined,
    keypair           : undefined,
    redirect_uri      : undefined,
    refresh_token     : undefined,
    token             : undefined,
    token_expires     : undefined,
    user              : undefined,
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

  // Add getters/setters for some stuff we want to make public

  /**
   * Sets the token used for identifying the client/user to the server
   *
   * Only use this if you know to use a certain token
   * Ordinarily, the client itself handles this
   *
   * @param {string} newToken
   *
   * @returns {Promise}
   */
  api.setToken = function(newToken) {
    if (!newToken) { return Promise.resolve(); }
    if ('string' !== typeof newToken) { return Promise.reject('The new token is not a string'); }
    if (!newToken.length) { return Promise.reject('The new token is an empty string'); }
    scope.token = newToken;
    scope.user  = undefined;
    return Promise.resolve();
  };

  /**
   * Sets the refresh token used for updating the API token
   *
   * Only use this if you know to use a certain token
   * Ordinarily, the client itself handles this
   *
   * @param {string} refreshToken
   * @returns {Promise}
   */
  api.setRefreshToken = function (refreshToken) {
    if (!refreshToken) { return Promise.resolve(); }
    if ('string' !== typeof refreshToken) { return Promise.reject('The new token is not a string'); }
    if (!refreshToken.length) { return Promise.reject('The new token is an empty string'); }
    scope.refreshToken = refreshToken;
    return Promise.resolve();
  };

  /**
   * Sets the client id used for identifying the application to the server
   *
   * @param {string} id
   *
   * @returns {EE} api
   */
  api.setClientId = function (id) {
    scope.client_id = id;
    return api;
  };

  /**
   * Sets the client secret used for identifying the application to the server
   *
   * @param {string} secret
   *
   * @returns {EE} api
   */
  api.setClientSecret = function (secret) {
    scope.client_secret = secret;
    return api;
  };

  /**
   * Sets the client redirect uri to pass to the server so it knows where to send the client
   *
   * @param {string} uri
   *
   * @returns {EE}
   */
  api.setRedirectUri = function(uri) {
    scope.redirect_uri = uri;
    return api;
  };

  return scope;
};
