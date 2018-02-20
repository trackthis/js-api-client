var ajax = require('ajax-request');

module.exports = function() {

};


function oldVersion(global) {

  // Simple fallback on failure
  // https://gist.github.com/unscriptable/814052
  var Promise = global.Promise || function MiniPromise(cb) {
    var q = [], v, u, ok, complete = function (m, r) {
      if (q) {
        var i = -1, l = q;
        ok    = !m;
        v     = r;
        q     = null;
        while (++i < l.length) l[i][m](v);
      }
    };

    cb(complete.bind(u, 0), complete.bind(u, 1));

    this.then  = then;
    this.catch = then.bind(u, u);

    function then(success, error) {
      return new MiniPromise(function (resolve, reject) {
        if (q) q.push([done.bind(u, success), done.bind(u, error)]);
        else done(ok ? success : error);

        function done(cb) {
          try {
            let val = cb ? cb(v) : u;
            if (val && val.then) val.then(resolve, reject);
            else (cb || ok ? resolve : reject)(val);
          } catch (e) { reject(e); }
        }
      });
    }
  };

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

  // Perform ajax calls
  function ajax(uri, options) {
    var factories = [
      function () { return new XMLHttpRequest(); },
      function () { return new ActiveXObject("Msxml2.XMLHTTP"); },
      function () { return new ActiveXObject("Msxml3.XMLHTTP"); },
      function () { return new ActiveXObject("Microsoft.XMLHTTP"); }
    ];

    function httpObject() {
      let xmlhttp = false;
      factories.forEach(function (factory) {
        try {
          xmlhttp = xmlhttp || factory();
        } catch (e) {
        }
      });
      return xmlhttp;
    }

    return new Promise(function (resolve, reject) {
      options        = options || {};
      options.method = (options.method || 'GET').toUpperCase();
      options.data   = options.data || {};
      var req        = httpObject();
      if (!req) return reject('No supported xmlhttp factory available');
      if (Object.keys(options.data).length) {
        var serializedData = serializeObject(options.data);
        switch (options.method) {
          case 'GET':
            uri += ((uri.indexOf('?') === -1) ? '?' : '&') + serializedData;
            options.data = {};
            break;
          case 'POST':
            req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            break;
        }
      }

      req.open(options.method, uri, true);
      req.onreadystatechange = function () {
        if (req.readyState !== 4) return;
        var output = {
          responseText : req.responseText,
          responseType : req.responseType,
          status       : req.status,
          statusText   : req.statusText
        };

        try {
          output.responseData = JSON.parse(req.responseText);
        } catch (e) {
          output.parseError = e;
        }

        resolve(output);
      };
      req.send(options.data);
    });
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

    // Fetch the available versions from the server
    // The only non-versioned call, fixed throughout the ages
    versions : function () {
      return api
        .raw('GET', '/api/versions.json')
        .then(function (response) {
          if (response.responseData.indexOf('v' + api.supported) < 0) {
            throw "The loaded API client is not supported anymore";
          }
          api.baseuri = '/api/v' + api.supported + '/';
          return response.responseData;
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