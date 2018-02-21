var ajax    = require('ajax-request'),
    Promise = require('bluebird'),
    url     = require('url');

var api = module.exports = {
  protocol : 'https',
  hostname : null,
  port     : null,
  basePath : null,
  format   : 'json',

  protocolHandlers: {
    http: {
      defaultPort: 80
    },
    https: {
      defaultPort: 80
    }
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
    api.protocol = options.protocol || parsed.protocol || 'https';
    api.hostname = options.hostname || parsed.hostname || 'trackthis.nl';
    api.port     = options.port     || parsed.port     || ( api.protocolHandlers[api.protocol] && api.protocolHandlers[api.protocol].defaultPort ) || 8080;
    api.basePath = options.basePath || parsed.pathname || '/api/';
  },

  /**
   * Run a basic api call to the remote.
   * This method passes your call to the correct protocol handler for the given options
   *
   * @param options
   * @returns {void | string | object}
   */
  raw: function( options ) {
    if ( 'string' === typeof options ) options = { url: options };
    if ( !options.url ) return Promise.reject('No url given');
    options.method = (options.method || 'get').toUpperCase();
    var parsed = url.parse(options.url);
    parsed.href = parsed.path = parsed.search = null;
    parsed.hostname = parsed.hostname || api.hostname;
    parsed.port = parsed.port || api.port;
    if ( parsed.pathname.charAt(0) !== '/' && api.basePath ) {
      if ( api.basePath.slice(-1) !== '/' ) api.basePath += '/';
      parsed.pathname = api.basePath + parsed.pathname;
    }
    options.url = parsed.format();
    return new Promise(function(resolve,reject) {
      ajax(options, function( err, res, body ) {
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
  },

  // Fetch the available versions from the server
  // The only non-versioned call, fixed throughout the ages
  versions : function () {
    return api.raw('/api/versions.json');
    // return api
    //   .raw('GET', '/api/versions.json')
    //   .then(function (response) {
    //     if (response.responseData.indexOf('v' + api.supported) < 0) {
    //       throw "The loaded API client is not supported anymore";
    //     }
    //     api.baseuri = '/api/v' + api.supported + '/';
    //     return response.responseData;
    //   });
  },
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

    baseuri   : null,            // The base url for the API
    format    : 'json',          // The default request format
    supported : 1,               // The supported API version supported
    serialize : serializeObject, // Make this function public

    // Perform raw calls with this
    // Saves code repetition
    raw : function (method, name, data) {
      if (name === undefined) {
        name   = method;
        method = 'GET';
      }
      var uri;
      if (name.slice(0, 1) === '/') {
        uri = name;
      } else {
        uri = (api.baseuri || '/') + name.replace('.', '/') + '.' + api.format;
      }
      return ajax(uri, {
        method : method || 'GET',
        data   : data || {}
      });
    },

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

          // Recursively scan the manifest
          // Build the API as we go
          (function processManifest(data, apiref, path) {
            Object
              .keys(data)
              .forEach(function (key) {

                // Do NOT change elements/calls that are marked as fixed
                if (apiref === api && fixedElements.indexOf(key) >= 0) {
                  return;
                }

                // Is the current key an API call?
                if (data[key].url) {
                  // Jup
                  // Generate a function matching the call
                  Object
                    .keys(data[key])
                    .forEach(function (method) {
                      if (method === 'url') return;
                      if (method === 'description') return;
                      apiref[method.toLowerCase() + key.slice(0, 1).toUpperCase() + key.slice(1)] = function (options) {
                        return api.raw(method.toUpperCase(), data[key].url, options);
                      };
                    });
                } else {
                  // Nope
                  // Iterate down the rabbit hole
                  processManifest(data[key], apiref[key] = apiref[key] || {});
                }
              });
          })(response.responseData, api, []);

          // Return the data we used
          return response.responseData;
        });
    }
  };

  return api;
}