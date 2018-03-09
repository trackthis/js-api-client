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
//   user : {
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
