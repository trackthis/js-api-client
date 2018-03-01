var ajax         = require('ajax-request'),
    base64url    = require('base64url'),
    cbq          = require('./cbq'),
    keyservice   = require('./keyservice'),
    localstorage = require('./localstorage'),
    Promise      = require('bluebird'),
    url          = require('url');

/* "global" variables we'll use */

var noop              = function(data){return data;},
    supportedVersions = [ 1 ],
    chosenVersion     = null,
    transport         = null,
    rawApi            = {},
    skipManifestKeys  = [
      'baseuri','formats'
    ],
    settings          = {
      callback     : undefined,
      clientId     : undefined,
      user         : undefined,
      token        : undefined,
      refreshToken : undefined,
      jwt          : undefined,
      kp           : undefined
    },


    /**
     * A named list of protocol handlers
     *
     * Each contains a default port (we're networking) and a transport which knows how to talk to the remote endpoint.
     */
    protocolHandlers = {

      /**
       * HTTP protocol handler
       *
       * The ajax-request supports both HTTP and HTTPS, so simply redirect to the HTTPS handler
       */
      http: {
        defaultPort: 80,
        transport : function( options ) {
          if ( 'string' === typeof options ) options = { name: options };
          options = options || {};
          if ( !options.name ) return Promise.reject('No name given');
          options.protocol = 'http';
          options.port     = options.port || api.port || protocolHandlers.http.defaultPort;
          return protocolHandlers.https.transport(options);
        }
      },

      /**
       * HTTPS protocol handler
       *
       * Converts our raw named calls into AJAX request based on settings like the hostname, port & basePath
       */
      https: {
        defaultPort: 443,
        transport  : function( options ) {
          if ( 'string' === typeof options ) options = { name: options };
          options = options || {};
          if ( !options.name ) return Promise.reject('No name given');
          api.basePath = api.basePath || '/';
          if ( api.basePath.slice(-1) !== '/' ) api.basePath += '/';
          var parsed = options.url && url.parse(options.url) || {};
          options.name     = options.name.replace(/\./g,'/');
          options.method   = (options.method || 'get').toUpperCase();
          options.protocol = options.protocol || parsed.protocol || api.protocol || (document && document.location && document.location.protocol);
          if ( options.protocol.slice(-1) !== ':' ) options.protocol += ':';
          options.hostname = options.hostname || parsed.hostname || api.hostname || (document && document.location && document.location.hostname);
          options.port     = options.port     || parsed.port     || api.port     || (document && document.location && document.location.port    );
          options.pathname = options.pathname || ( api.basePath + ((options.name==='versions')?'':('v'+chosenVersion+'/')) + options.name + '.json' );
          options.url      = url.format(options);
          return new Promise(function(resolve,reject) {
            ajax(options, function(err, res, body) {
              var output = {
                status : res.statusCode,
                text   : body,
                data   : null
              };
              try {
                output.data = JSON.parse(output.text);
              } catch(e) {
                output.data = null;
              }
              if ( err ) return reject(Object.assign({ error: err }, output));
              resolve(output);
            });
          });
        }
      }
    };

/* Helper functions */

/**
 * Intersect 2 or more arrays
 *
 * Returns a new array representing the intersection of arrays
 * You should not assume that keys are preserved

 * @param   {...array} arr
 *
 * @returns {array}
 */
function intersect(arr) {

  // Convert the arguments special to an array
  var args = arguments;
  args = Object.keys(args).map(function(key) {
    return args[key];
  });
  if ( !args.length ) return [];

  // Fetch the first argument & make sure it's an array
  var intermediate, output = args.shift();
  if (!Array.isArray(output)) return [];
  output = output.slice();

  // Intersect it with all the other arguments
  // Also makes sure only arrays are used
  while ( args.length ) {
    intermediate = args.shift();
    if (!Array.isArray(intermediate)) continue;
    output = output.filter(function(entry) {
      return intermediate.indexOf(entry) >= 0;
    });
  }

  return output;
}

/**
 * Check if we have a transport adapter registered
 *
 * Returns a promise which resolves if we have a transport
 * Having a transport means we're supposed to be connected to an endpoint.
 *
 * @return {Promise}
 */
function checkTransport() {
  return new Promise(function(resolve,reject) {
    if ( 'function' === typeof transport ) {
      resolve();
    } else {
      reject('The api is not connected to the remote yet');
    }
  });
}

/**
 * Loads the manifest from the remote and builds/updates the internal raw api
 *
 * @returns {Promise}
 */
function fetchManifest(callback) {
  return checkTransport()
    .then(function() {
      return transport('manifest');
    })
    .then(function(response) {
      if ( 'object' !== typeof response.data ) {
        throw 'Manifest response is not valid';
      }
      (function processManifest(data, apiref, path) {
        Object.keys(data)
              .forEach(function(key) {
                if (skipManifestKeys.indexOf(key)>=0) return;
                if('object'!==(typeof data[key])) return;
                if ( data[key].url ) {
                  Object.keys(data[key])
                        .forEach(function(method) {
                          if ( method === 'url' || method === 'description' ) return;
                          apiref[method.toLowerCase() + key.slice(0, 1).toUpperCase() + key.slice(1)] = function (options) {
                            return checkTransport()
                              .then(function() {
                                return transport(Object.assign({
                                  method : method.toUpperCase(),
                                  name   : path.concat([key]).join('.')
                                },options));
                              });
                          };
                        });
                } else {
                  processManifest(data[key], apiref[key]=apiref[key]||{}, path.concat([key]));
                }
              });
      })(response.data, rawApi, []);
      return response;
    })
    .then(('function'===(typeof callback))?callback:noop);
}

/**
 * Ensure we have called the manifest at least once
 *
 * The manifest is a special call which builds the raw api calls
 * Raw api calls are used inside the simplified API that we export
 *
 * @returns {Promise}
 */
function ensureManifest() {
  return new Promise(function(resolve) {
    if ( Object.keys(rawApi).length ) return resolve();
    fetchManifest(resolve);
  }).then(noop);
}

/**
 * Ensure we have the configuration we need for building signatures
 *
 * @returns {Promise}
 */
function ensureSignatureConfig() {
  return new Promise(function(resolve) {
    if ( keyservice.pubkey ) return resolve();
    ensureManifest()
      .then(rawApi.signature.getConfig)
      .then(function(response) {
        keyservice.curve = response.data.curve || keyservice.curve;
        keyservice.digest = response.data.digest || keyservice.digest;
        keyservice.format = response.data.format || keyservice.format;
        keyservice.signature = response.data.iterations || keyservice.signature;
        keyservice.keylen = response.data.keylen || keyservice.keylen;
        keyservice.pubkey = response.data.pubkey || keyservice.pubkey;
      })
      .then(resolve);
  }).then(noop);
}

/**
 * Serialize (almost) any object into url-encoding
 *
 * Returns a url-encoded object, usable as a query for a GET or POST request
 *
 * @param {object} obj
 * @param {string} prefix
 *
 * @returns {string}
 */
function serializeObject(obj, prefix) {
  var str = [], p;
  for (p in obj) {
    if (obj.hasOwnProperty(p)) {
      var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
      str.push((v !== null && typeof v === "object") ?
               serializeObject(v, k) :
               encodeURIComponent(k) + "=" + encodeURIComponent(v));
    }
  }
  return str.join("&");
}

/* The actual exported api object */

var api = module.exports = {

  /**
   * Basic settings for our transport on how to connect/talk to the remote
   */
  protocol : 'https',
  hostname : null,
  port     : null,
  basePath : null,

  /**
   * Sets the client id used for identifying the application to the server
   *
   * @param {string} id
   *
   * @returns {object} api
   */
  setClientId : function (id) {
    settings.clientId = id;
    return api;
  },

  /**
   * Sets the callback url to be included in calls which require a callback
   *
   * @param {string} url
   *
   * @returns {object} api
   */
  setCallback : function (url) {
    settings.callback = url;
    return api;
  },

  /**
   * Register a new protocol handler
   *
   * @param {string}   protocol
   * @param {object}   options
   * @param {function} [callback]
   *
   * @returns {Promise}
   */
  registerProtocolHandler : function (protocol, options, callback) {
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
    protocolHandlers[protocol] = options;
    return Promise.resolve().then('function'===(typeof callback)?callback:noop);
  },

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
  connect: function( options, callback ) {
    if ('function' === typeof options) { callback = options ; options = {} ; }
    if ('string'   === typeof options) options = { remote: options };
    options = options || {};
    if ('object' !== typeof options) throw "Given options was neither a string, an object or undefined";
    options.remote = options.remote || 'https://trackthis.nl/api';
    var parsed     = url.parse(options.remote);
    api.protocol   = options.protocol || parsed.protocol || 'http';
    if (api.protocol.slice(-1) === ':') api.protocol = api.protocol.slice(0, -1);
    if (!protocolHandlers[api.protocol]) return Promise.reject('Given protocol not supported');
    api.hostname = options.hostname || parsed.hostname || 'trackthis.nl';
    api.port     = options.port     || parsed.port     || ( protocolHandlers[api.protocol] && protocolHandlers[api.protocol].defaultPort ) || 8080;
    api.basePath = options.basePath || parsed.pathname || '/api/';
    transport    = protocolHandlers[api.protocol].transport;
    if (api.basePath.slice(-1) !== '/') api.basePath += '/';
    return transport(Object.assign({name : 'versions'}, settings, options))
      .then(function (response) {
        var serverVersions = response.data.map(function (v) {
          return (v.substr(0, 1) === 'v') ? parseInt(v.substr(1)) : v;
        });
        chosenVersion = intersect(serverVersions, supportedVersions).pop();
        if (!chosenVersion) {
          throw 'We do not support any versions supported by the server';
        }
      })
      .then(('function'===(typeof callback))?callback:noop);
  },

  user : {

    /**
     * Logs out the user inside this browser
     *
     * Simply destroys the data we have to authenticate to the server
     *
     * @returns {Promise}
     */
    logout : function () {
      settings.token        = undefined;
      settings.refreshToken = undefined;
      settings.user         = undefined;
      localstorage.removeItem('token');
      localstorage.removeItem('refreshToken');
      return Promise.resolve();
    },

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
    setToken : function (newToken) {
      if ('string' !== typeof newToken) return Promise.reject('The new token is not a string');
      if (!newToken.length) return Promise.reject('The new token is an empty string');
      settings.token = newToken;
      settings.user  = undefined;
      localstorage.setItem('token', newToken);
      return Promise.resolve();
    },

    /**
     * Sets the refresh token used for updating the API token
     *
     * Only use this if you know to use a certain token
     * Ordinarily, the client itself handles this
     *
     * @param {string} refreshToken
     * @returns {Promise}
     */
    setRefreshToken : function (refreshToken) {
      if ('string' !== typeof refreshToken) return Promise.reject('The new token is not a string');
      if (!refreshToken.length) return Promise.reject('The new token is an empty string');
      settings.refreshToken = refreshToken;
      localstorage.setItem('refreshToken', refreshToken);
      return Promise.resolve();
    },

    /**
     *
     */
    login: function (data) {
      if ( 'string' !== typeof data.username ) return Promise.reject("Username is required");
      return checkTransport()
        .then(ensureManifest)
        .then(ensureSignatureConfig)
        .then(function() {

          // Make the data quick-to-access
          var username  = data.username  || (settings.user&&settings.user.username) || undefined,
              token     = data.token     || settings.jwt || undefined,
              password  = data.password  || undefined,
              signature = data.signature || undefined,
              kp        = data.kp        || settings.kp || undefined,
              signer    = data.signer    || username || undefined;

          // We must have a username
          if (!username) {
            throw "No username known or given";
          }

          // For the resolve/reject functions
          return new Promise(function(resolve,reject) {cbq([

            // Try an existing token
            function(d,next,fail) {
              if (!rawApi.user.getLogin) return next();
              if (!token) return next();

              // Send the request
              return rawApi.user.getLogin({ data: { token: token, username: username } })
                           .then(function(response) {
                             console.log('PRE-EXISTING-TOKEN:', token, response);
                             next();
                           });
            },

            // Try an existing token with added signature
            function(d,next,fail) {
              if (!rawApi.user.getLogin) return next();
              if (!token) return next();

              // Generate signature if none present
              if (!signature) {
                if (!password) return fail("No password given");
                kp = kp || keyservice.generateKeys(username,password);
                signature = base64url.encode(new Buffer(keyservice.sign(kp,token),keyservice.format));
                signer    = username;
              }

              // Try the token with a signature added
              token += '.' + signature;

              // Send the request
              return rawApi.user.getLogin({ data: { token: token, username: username, signer: signer } })
                           .then(function(response) {
                             console.log('SIGNED-TOKEN:', token, response);
                             next();
                           });
            },

            // Try a signed username
            function(d,next,fail) {
              if (!rawApi.user.getLogin) return next();
              if (!password) return fail("No password given");

              // Generate the keypair if needed
              kp = kp || keyservice.generateKeys(username,password);

              // Generate the signature for the username
              signature = base64url.encode(new Buffer(keyservice.sign(kp,username),keyservice.format));

              // Send the request
              return rawApi.user.getLogin({ data: { username: username, signature: signature } })
                           .then(function(response) {
                             console.log('SIGNED-USERNAME:', { username: username, signature: signature }, response);
                             next();
                           });
            },

            // Try a self-generated token
            function(d,next,fail) {
              if (!rawApi.user.getLogin) return next();
              if (!password) return fail("No password given");

              // Generate the keypair if needed
              kp = kp || keyservice.generateKeys(username,password);
              console.log(kp);

              // Generate the part of the token we'll sign
              token = base64url.encode(JSON.stringify({
                "alg": "ES256",
                "typ": "JWT"
              })) + '.' + base64url.encode(JSON.stringify({
                username: username
              }));

              // Generate it's signature
              signature  = base64url.encode(new Buffer(keyservice.sign(kp,token),keyservice.format));
              signer     = username;
              token     += '.' + signature;

              // Send the request
              return rawApi.user.getLogin({ data: { token: token, signer: signer } })
                           .then(function(response) {
                             console.log('GENERATED-TOKEN:',token, response);
                             next();
                           });
            },

            // Try oauth
            function(d,next,fail) {
              if (!rawApi.oauth.getAuth) return next();

              // TODO: build this
              return next();
            },

          ],console.error.bind(undefined,'None of our supported authentication methods is supported by the server'),reject);});

          // if ( rawApi.user.getLogin ) {
          //   // JWT supported
          //
          //   // try to pry a token out of the server
          //   return rawApi.user.getLogin({ data: data })
          //     .then(function(response) {
          //       console.log('RESPONSE:',response);
          //       if ( !response.data ) throw "Invalid data returned";
          //     })
          //     .catch(function() {
          //       console.log('ARGS:', arguments);
          //     })
          // } else if ( rawApi.oauth.getAuth ) {
          //   // oauth supported
          //
          //   // redirect the client to the login page
          //   window.document.location = url.format({
          //     protocol : api.protocol + ((api.protocol.slice(-1) !== ':') ? ':' : ''),
          //     hostname : api.hostname || (document && document.location && document.location.hostname),
          //     port     : api.port || (document && document.location && document.location.port),
          //     pathname : ( api.basePath + 'v' + chosenVersion + '/' + 'oauth/auth' ),
          //     query    : serializeObject(data||{})
          //   });
          //
          //   // Just in case the JS engine decides to continue
          //   return Promise.resolve();
          // } else {
          //   throw 'None of our supported authentication methods is supported by the server';
          // }
        });

    }

  }
};
