var ajax    = require('ajax-request'),
    Promise = require('bluebird'),
    url     = require('url');

var noop              = function(){},
    supportedVersions = [ 1 ],
    chosenVersion     = null,
    rawApi            = {},
    skipManifestKeys  = [
      'baseuri','formats'
    ],
    hiddenSettings    = {
      callback : null,
      clientId : null,
      token    : null
    };

function intersect( left, right ) {
  return left
    .slice()
    .filter(function(entry) {
      return right.indexOf(entry) >= 0;
    });
}

function checkTransport() {
  return new Promise(function(resolve,reject) {
    if ( 'function' === typeof api.transport ) {
      resolve();
    } else {
      reject('The api is not connected to the remote yet');
    }
  });
}

function ensureManifest() {
  return new Promise(function(resolve) {
    if ( Object.keys(rawApi).length ) return resolve();
    resolve(api.manifest);
  }).then(noop);
}

var api = module.exports = {
  protocol  : 'https',
  hostname  : null,
  port      : null,
  basePath  : null,
  format    : 'json',
  transport : null,

  protocolHandlers: {
    http: {
      defaultPort: 80,
      transport : function( options ) {
        if ( 'string' === typeof options ) options = { name: options };
        options = options || {};
        if ( !options.name ) return Promise.reject('No name given');
        options.protocol = 'http';
        options.port     = options.port || api.port || api.protocolHandlers.http.defaultPort;
        return api.protocolHandlers.https.transport(options);
      }
    },
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
        options.pathname = options.pathname || ( api.basePath + ((options.name==='versions')?'':('v'+chosenVersion+'/')) + options.name + '.' + api.format );
        options.url      = url.format(options);
        return new Promise(function(resolve,reject) {
          ajax(options, function(err, res, body) {
            if ( err ) return reject(err);
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
            resolve(output);
          });
        });
      }
    }
  },

  /**
   * Sets the token used for identifying the client to the server
   *
   * @param {string} token
   * @returns api
   */
  setToken: function( token ) {
    hiddenSettings.token = token;
    return api;
  },

  /**
   * Sets the client id used for identifying the application to the server
   *
   * @param {string} id
   * @returns api
   */
  setClientId: function( id ) {
    hiddenSettings.clientId = id;
    return api;
  },

  /**
   * Sets the callback url to be included in calls which require a callback
   *
   * @param {string} url
   * @returns api
   */
  setCallback: function( url ) {
    hiddenSettings.callback = url;
    return api;
  },

  /**
   * Connect the api client to the remote
   *
   * Optionally takes a callback function for when it's ready
   * Returns a promise that will resolve when connected or reject on a failure to connect
   *
   * @param {void | string   | object} options
   * @param {void | function }         callback
   *
   * @return Promise
   */
  connect: function( options, callback ) {
    if ( 'function' === typeof options ) { callback = options ; options = {} ; }
    if ( 'string' === typeof options ) options = { remote: options };
    options = options || {};
    if ( 'object' !== typeof options ) throw "Given options was neither a string or an object";
    options.remote = options.remote || 'https://trackthis.nl/api';
    var parsed = url.parse( options.remote );
    api.protocol = options.protocol || parsed.protocol || 'http';
    if ( api.protocol.slice(-1) === ':') api.protocol = api.protocol.slice(0,-1);
    if ( !api.protocolHandlers[api.protocol] ) return Promise.reject('Given protocol not supported');
    api.hostname  = options.hostname || parsed.hostname || 'trackthis.nl';
    api.port      = options.port     || parsed.port     || ( api.protocolHandlers[api.protocol] && api.protocolHandlers[api.protocol].defaultPort ) || 8080;
    api.basePath  = options.basePath || parsed.pathname || '/api/';
    api.transport = api.protocolHandlers[api.protocol].transport;
    if ( api.basePath.slice(-1) !== '/' ) api.basePath += '/';
    return new Promise(function(resolve, reject) {
      api.versions()
        .then(function(response) {
          var serverVersions = response.data.map(function(v) {
            return (v.substr(0,1)==='v') ? parseInt(v.substr(1)) : v;
          });
          chosenVersion = intersect(serverVersions, supportedVersions).pop();
          if (!chosenVersion) {
            reject('We do not support any versions supported by the server');
          }
          resolve();
        })
    }).then(('function'===(typeof callback))?callback:noop);
  },

  /**
   * Fetch the available versions from the server
   *
   * @returns Promise
   */
  versions : function () {
    return checkTransport()
      .then(function() {
        return api.transport('versions');
      })
  },

  manifest : function() {
    return checkTransport()
      .then(function() {
        return api.transport('manifest');
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
                              return api.transport(Object.assign({
                                method : method.toUpperCase(),
                                name   : path.join('.')
                              },options))
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
  },

  user: {
    me: function () {
      return checkTransport()
        .then(ensureManifest)
        .then(function() {
          // do stuff
        })
    }
  }
};


function oldVersion(global) {

  // Convert object to url encoded data
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

  // A list of root keys that should not
  //   be updated by a call to the manifest
  var fixedElements = [
    'baseuri',   // May not be changed in this client, fetched through the 'versions' call
    'format',    // Let's not have the server instruct us which format to use
    'formats',   // We know perfectly fine which formats we support
    'manifest',  // This function is complex & constructs the rest of the API
    'supported', // We know which API version we support, the server doesn't
    'raw',       // Function for programmer efficiency, not server automation
    'versions'   // The only fixed call in the whole API, let's not overwrite this
  ];

  // Our base API
  var api = {

    serialize : serializeObject, // Make this function public

    // Fetch the manifest
    // Updates the API calls
    manifest : function () {
      return api
        .raw('GET', 'manifest')
        .then(function (response) {

          // Make sure it was data
          if (!response.responseData) {
            throw response.parseError;
          }

          // Return the data we used
          return response.responseData;
        });
    }
  };

  return api;
}