var EE           = require('simple-ee');

// Initialize the api as an event emitter
var api = module.exports = new EE();

// The default scope for transports, login methods, etc
// a.k.a. hidden settings
var scope = require('./scope')(api);

/* * * * * * * * * * * * * * *\
 * Initialize public methods *
\* * * * * * * * * * * * * * */

// From modules
api.user    = require('./user')(scope);
api.connect = require('./connect')(scope);

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


// /* "global" variables we'll use */
//
//     /**
//      * A named list of protocol handlers
//      *
//      * Each contains a default port (we're networking) and a transport which knows how to talk to the remote endpoint.
//      */
//
// /* Helper functions */
//
//
//
// var api = module.exports = {
//
//
//   /**
//    * Connect the api client to the (default) remote
//    *
//    * Optionally takes a callback function for when it's ready
//    * Returns a promise that will resolve when connected or reject on a failure to connect
//    *
//    * @param {void | string   | object} options
//    * @param {void | function }         callback
//    *
//    * @return {Promise}
//    */
//   connect: function( options, callback ) {
//     if ('function' === typeof options) { callback = options ; options = {} ; }
//     if ('string'   === typeof options) { options = { remote: options }; }
//     options = options || {};
//     if ('object' !== typeof options) { throw "Given options was neither a string, an object or undefined"; }
//     options.remote = options.remote || 'https://trackthis.nl/api';
//     var parsed     = url.parse(options.remote);
//     api.protocol   = options.protocol || parsed.protocol || 'http';
//     if (api.protocol.slice(-1) === ':') { api.protocol = api.protocol.slice(0, -1); }
//     if (!transports[api.protocol]) { return Promise.reject('Given protocol not supported'); }
//     api.hostname = options.hostname || parsed.hostname || 'trackthis.nl';
//     api.port     = options.port     || parsed.port     || ( transports[api.protocol] && transports[api.protocol].defaultPort ) || 8080;
//     api.basePath = options.basePath || parsed.pathname || '/api/';
//     transport    = transports[api.protocol].transport.bind(scope);
//     if (api.basePath.slice(-1) !== '/') { api.basePath += '/'; }
//     return checkTransport()
//       .then(function() {
//         return transport(Object.assign({name : 'versions'}, settings, options))
//           .then(catchRedirect)
//           .then(function (response) {
//             var serverVersions = response.data.map(function (v) {
//               return (v.substr(0, 1) === 'v') ? parseInt(v.substr(1)) : v;
//             });
//             chosenVersion = intersect(serverVersions, supportedVersions).pop();
//             if (!chosenVersion) {
//               throw 'We do not support any versions supported by the server';
//             }
//           });
//       })
//       .then(('function'===(typeof callback))?callback:noop);
//   },
//
//   user : {
//
//     /**
//      * Logs out the user inside this browser
//      *
//      * Simply destroys the data we have to authenticate to the server
//      *
//      * @returns {Promise}
//      */
//     logout : function () {
//       settings.token        = undefined;
//       settings.refreshToken = undefined;
//       settings.user         = undefined;
//       localstorage.removeItem('token');
//       localstorage.removeItem('refreshToken');
//       return Promise.resolve();
//     },
//
//     /**
//      * Sets the token used for identifying the client/user to the server
//      *
//      * Only use this if you know to use a certain token
//      * Ordinarily, the client itself handles this
//      *
//      * @param {string} newToken
//      *
//      * @returns {Promise}
//      */
//     setToken : function (newToken) {
//       if (!newToken) { return Promise.resolve(); }
//       if ('string' !== typeof newToken) { return Promise.reject('The new token is not a string'); }
//       if (!newToken.length) { return Promise.reject('The new token is an empty string'); }
//       settings.token = newToken;
//       settings.user  = undefined;
//       localstorage.setItem('token', newToken);
//       return Promise.resolve();
//     },
//
//     /**
//      * Sets the refresh token used for updating the API token
//      *
//      * Only use this if you know to use a certain token
//      * Ordinarily, the client itself handles this
//      *
//      * @param {string} refreshToken
//      * @returns {Promise}
//      */
//     setRefreshToken : function (refreshToken) {
//       if (!refreshToken) { return Promise.resolve(); }
//       if ('string' !== typeof refreshToken) { return Promise.reject('The new token is not a string'); }
//       if (!refreshToken.length) { return Promise.reject('The new token is an empty string'); }
//       settings.refreshToken = refreshToken;
//       localstorage.setItem('refreshToken', refreshToken);
//       return Promise.resolve();
//     },
//
//     me: function() {
//
//     },
//
//     /**
//      * Try to login through all the methods we know
//      */
//     login: function (data) {
//       data = data || {};
//       return checkTransport()
//         .then(ensureManifest)
//         .then(ensureSignatureConfig)
//         .then(function() {
//
//           // For the resolve/reject functions
//           return new Promise(function(resolve,reject) {cbq([
//
//             // Insert data into the queue
//             function(d,next) {
//               var user     = data.username || data.user || data.usr || data.account || data.acc || false,
//                   username = ( user && user.username ) || ( user && user.name ) || user || undefined,
//                   password = data.password || data.pass || data.passwd || data.pwd  || data.pw || undefined;
//               d = {
//                 api            : api,
//                 rawApi         : rawApi,
//                 settings       : settings,
//                 data           : data,
//                 ec             : new EC(sigConfig.curve),
//                 resolve        : resolve,
//                 reject         : reject,
//                 deserialize    : deserializeObject,
//                 serialize      : serializeObject,
//                 catchRedirect  : catchRedirect,
//                 generateSecret : generateSecret,
//                 username       : username,
//                 password       : password
//               };
//               next(d);
//             },
//
//             require('./user/login/oauth/token'),
//             require('./user/login/token/existing'),
//             require('./user/login/token/existing-signed'),
//             require('./user/login/username/signed'),
//             require('./user/login/token/generated'),
//             require('./user/login/oauth/auth'),
//
//           ],reject.bind(undefined,'None of our supported authentication methods is supported by the server'),reject);});
//         });
//
//     }
//
//   }
// };
