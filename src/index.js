var base64url    = require('base64url'),
    cbq          = require('./cbq'),
    crypto       = require('crypto'),
    EC           = require('trackthis-ecdsa'),
    extend       = require('extend'),
    localstorage = require('./localstorage'),
    Promise      = require('bluebird'),
    url          = require('url');

/* "global" variables we'll use */

var noop              = function(data){return data;},
    supportedVersions = [ 1 ],
    chosenVersion     = null, // The chosen API version
    transport         = null, // The chosen transport
    scope             = {},   // Scope (this) for the transport
    rawApi            = {},   // The 'raw' api requests
    skipManifestKeys  = [
      'baseuri','formats'
    ],
    settings          = {
      callback     : undefined, // Callback URL for requests
      clientId     : undefined, // Our client ID
      clientSecret : undefined, // Our client secret
      user         : undefined, // Our logged in account
      token        : undefined, // The token we'll use for identifying ourselves
      refreshToken : undefined, // A token to refresh the main token
      kp           : undefined  // Our keypair
    },
    sigConfig =  {

      // The server's public key
      pubkey : undefined,

      // Default settings
      curve     : 'secp256k1',
      label     : 'ecdsa-sha2-secp256k1',
      keylen    : 32,
      digest    : 'sha256',
      format    : 'base64',
      iterations : {
        base   : 1000,
        hash   : 'sha256',
        modulo : 9000
      }
    },

    /**
     * A named list of protocol handlers
     *
     * Each contains a default port (we're networking) and a transport which knows how to talk to the remote endpoint.
     */
    transports = {
      http  : require('./transport/http'),
      https : require('./transport/https')
    };

/* Helper functions */

/**
 * Intersect 2 or more arrays
 *
 * Returns a new array representing the intersection of arrays
 * You should not assume that keys are preserved

 * @param {...array}
 *
 * @returns {array}
 */
function intersect() {

  // Convert the arguments special to an array
  var args = arguments;
  args = Object.keys(args).map(function(key) {
    return args[key];
  });
  if ( !args.length ) { return []; }

  // Fetch the first argument & make sure it's an array
  var output = args.shift();
  if (!Array.isArray(output)) { return []; }
  output = output.slice();

  // Intersect it with all the other arguments
  // Also makes sure only arrays are used
  args.forEach(function(subject) {
    if (!Array.isArray(subject)) { return; }
    output = output.filter(function(entry) {
      return subject.indexOf(entry) >= 0;
    });
  });

  return output;
}

/**
 * Check if we have a transport adapter registered
 *
 * Returns a promise which resolves if we have a transport
 * Having a transport means we're supposed to be connected to an endpoint.
 *
 * Updates the 'this' element for the transport as well
 *
 * @return {Promise}
 */
function checkTransport() {
  return new Promise(function(resolve,reject) {
    if ( 'function' === typeof transport ) {
      Object.assign(scope,api);
      scope.chosenVersion = chosenVersion;
      scope.settings      = settings;
      scope.transports    = transports;
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
                            var returnType = ( data[key][method] && data[key][method].return && data[key][method].return.type ) || 'Object';
                            switch(returnType) {
                              case 'Page':
                                var protocol = api.protocol;
                                if (['http','https'].indexOf(protocol) < 0) protocol = 'http';
                                protocol += ':';
                                var uri = url.format({
                                  protocol : protocol,
                                  hostname : api.hostname,
                                  port     : api.port,
                                  pathname : options.data.pathname || ( api.basePath + ((options.name==='versions')?'':('v'+chosenVersion+'/')) + path.concat([key]).join('/') ),
                                  search   : '?' + serializeObject(options.data)
                                });
                                var response = {
                                  status: 302,
                                  data  : { location: uri }
                                };
                                response.text = JSON.stringify(response.data);
                                return Promise.resolve(response);
                              default:
                                options            = options            || {};
                                options.data       = options.data       || {};
                                options.data.token = options.data.token || settings.token;
                                return checkTransport()
                                  .then(function() {
                                    return transport(Object.assign({
                                      method : method.toUpperCase(),
                                      name   : path.concat([key]).join('.')
                                    },options));
                                  });
                            }
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
    if ( sigConfig.pubkey ) return resolve();
    ensureManifest()
      .then(rawApi.signature.getConfig)
      .then(function(response) {
        sigConfig.curve     = response.data.curve      || sigConfig.curve;
        sigConfig.digest    = response.data.digest     || sigConfig.digest;
        sigConfig.format    = response.data.format     || sigConfig.format;
        sigConfig.signature = response.data.iterations || sigConfig.signature;
        sigConfig.keylen    = response.data.keylen     || sigConfig.keylen;
        sigConfig.pubkey    = response.data.pubkey     || sigConfig.pubkey;
      })
      .then(resolve);
  }).then(noop);
}

function set_deep( obj, key, value, separator ) {
  separator = separator || '.';
  if ( 'string' === typeof key ) {
    key = key.split(separator);
  }
  if (!Array.isArray(key)) {
    return;
  }
  var token;
  while(key.length) {
    token = key.shift();
    if ( key.length ) {
      obj = obj[token] = obj[token] || {};
    } else {
      if ( obj[token] && 'object' == typeof value ) {
        extend( obj[token], value );
      } else {
        obj[token] = value;
      }
    }
  }
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
    if (!obj.hasOwnProperty(p)) continue;
    if ('undefined' === typeof obj[p]) continue;
    if ( ('string' === typeof obj[p]) && (!obj[p].length)) continue;
    var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
    str.push((v !== null && typeof v === "object") ?
             serializeObject(v, k) :
             encodeURIComponent(k) + "=" + encodeURIComponent(v));
  }
  return str.join("&");
}

/**
 * Deserialize an url-encoded object
 *
 * Returns the object
 *
 * @param {string} encoded
 * @param {string} [prefix]
 *
 * @returns {object}
 */
function deserializeObject(encoded, prefix) {
  var output = {};
  if ( 'string' !== typeof encoded ) throw "Object could not be decoded";
  decodeURIComponent(encoded)                                                              // "a[b]=c&a[d]=e&f=g,h"
    .split('&')                                                                                // [ "a[b]=c", "a[d]=e', "f=g,h" ]
    .map(function (token) { return token.split('=',2); })                                      // [ ["a[b]","c"], ["a[d]","e"], ["f","g,h"] ]
    .map(function (token) { return [ (token[0] || '').replace(/]/g,''), token[1] || null ]; }) // [ ["a[b","c"], ["a[d","e"], ["f","g,h"] ]
    .map(function (token) { return [ token[0].split('[') , token[1] ]; })                      // [ [["a","b"],"c"], [["a","d"],"e"], [["f"],"g,h"] ]
    .forEach(function (token) { set_deep(output,token[0],token[1]); });                        // { a: { b: "c", d: "e" }, f: "g,h" }
  return output;
}

function generateSecret( username, password ) {
  var ec = new EC(sigConfig.curve);
  var _hash  = ec.H(username).toString('hex');
  var result = 0;
  while (_hash.length) {
    result = ((result * 16) + parseInt(_hash.substr(0, 1), 16)) % sigConfig.iterations.modulo;
    _hash  = _hash.substr(1);
  }
  var iterations = result + sigConfig.iterations.base;
  return crypto.pbkdf2Sync(password, username, iterations, sigConfig.keylen, sigConfig.digest);
}

function catchRedirect( response ) {
  if ( window && window.location && window.location.href ) {
    switch( response.status ) {
      case 302:
        if (!response.data.location) return response;
        window.location.href = response.data.location;
        break;
      default:
        return response;
    }
  }
  return response;
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
  registerTransport : function (protocol, options, callback) {
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
    transports[protocol] = options;
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
    if (!transports[api.protocol]) return Promise.reject('Given protocol not supported');
    api.hostname = options.hostname || parsed.hostname || 'trackthis.nl';
    api.port     = options.port     || parsed.port     || ( transports[api.protocol] && transports[api.protocol].defaultPort ) || 8080;
    api.basePath = options.basePath || parsed.pathname || '/api/';
    transport    = transports[api.protocol].transport.bind(scope);
    if (api.basePath.slice(-1) !== '/') api.basePath += '/';
    return checkTransport()
      .then(function() {
        return transport(Object.assign({name : 'versions'}, settings, options))
          .then(catchRedirect)
          .then(function (response) {
            var serverVersions = response.data.map(function (v) {
              return (v.substr(0, 1) === 'v') ? parseInt(v.substr(1)) : v;
            });
            chosenVersion = intersect(serverVersions, supportedVersions).pop();
            if (!chosenVersion) {
              throw 'We do not support any versions supported by the server';
            }
          });
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

    me: function() {

    },

    /**
     * Try to login through all the methods we know
     */
    login: function (data) {
      data = data || {};
      return checkTransport()
        .then(ensureManifest)
        .then(ensureSignatureConfig)
        .then(function() {

          // For the resolve/reject functions
          return new Promise(function(resolve,reject) {cbq([

            // Insert data into the queue
            function(d,next) {
              var user     = data.username || data.user || data.usr || data.account || data.acc || false,
                  username = ( user && user.username ) || ( user && user.name ) || user || undefined,
                  password = data.password || data.pass || data.passwd || data.pwd  || data.pw || undefined;
              d = {
                api            : api,
                rawApi         : rawApi,
                settings       : settings,
                data           : data,
                ec             : new EC(sigConfig.curve),
                resolve        : resolve,
                reject         : reject,
                deserialize    : deserializeObject,
                serialize      : serializeObject,
                catchRedirect  : catchRedirect,
                generateSecret : generateSecret,
                username       : username,
                password       : password
              };
              next(d);
            },

            require('./user/login/oauth/token'),
            require('./user/login/token/existing'),
            require('./user/login/token/existing-signed'),
            require('./user/login/username/signed'),

            // // Try a self-generated token
            // function(d,next,fail) {
            //   if (!rawApi.user.getLogin) return next();
            //   if ( 'string' !== typeof data.password ) return next();
            //
            //   // Generate the keypair if needed
            //   ec.kp.setPrivate(generateSecret(username,data.password));
            //
            //   // Generate the part of the token we'll sign
            //   var token = base64url.encode(JSON.stringify({
            //     "alg": "ES256",
            //     "typ": "JWT",
            //     "exp": Math.round((new Date()).getTime()/1000) + 300
            //   })) + '.' + base64url.encode(JSON.stringify({
            //     username: username
            //   }));
            //
            //   // Generate it's signature
            //   var rawsig = ec.sign(token);
            //   signature  = base64url.encode(rawsig);
            //   token     += '.' + signature;
            //
            //   // Send the request
            //   return rawApi
            //     .user.getLogin({ data: { token: token } })
            //     .then(catchRedirect)
            //     .then(function (response) {
            //       if (response.data && response.data.token) {
            //         console.log('Authenticated through self-signed generated token');
            //         api.user.setToken( response.data.token || settings.token );
            //         api.user.setRefreshToken( response.data.refreshToken || response.data.refresh_token || settings.refreshToken );
            //         resolve();
            //       } else {
            //         next();
            //       }
            //     });
            // },

            // // Try oauth init
            // function(d,next,fail) {
            //   if (!rawApi.oauth.getAuth) return next();
            //   var usernameList = username;
            //   if (Array.isArray(usernameList)) {
            //     usernameList = usernameList.map(encodeURIComponent).map(function (name) {
            //       return name.replace(/,/g, '%2C');
            //     }).join(',');
            //   }
            //
            //   return rawApi
            //     .oauth.getAuth({
            //       data : {
            //         account       : usernameList,
            //         response_type : 'code',
            //         client_id     : settings.clientId || 'APP-00',
            //         redirect_uri  : settings.callback || 'http://localhost:5000/',
            //         scope         : ''
            //       }
            //     })
            //     .then(catchRedirect)
            //     .then(function (response) {
            //       fail('We should\'ve gotten a redirect');
            //     });
            // },

          ],reject.bind(undefined,'None of our supported authentication methods is supported by the server'),reject);});
        });

    }

  }
};
