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
