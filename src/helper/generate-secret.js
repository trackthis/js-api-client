var crypto = require('crypto'),
    EC     = require('trackthis-ecdsa');

module.exports = function (scope) {
  module.exports = function generateSecret(username, password) {
    var ec     = scope.ec || new EC(scope.signature.curve);
    var _hash  = ec.H(username).toString('hex');
    var result = 0;
    while (_hash.length) {
      result = ((result * 16) + parseInt(_hash.substr(0, 1), 16)) % scope.signature.iterations.modulo;
      _hash  = _hash.substr(1);
    }
    var iterations = result + scope.signature.iterations.base;
    return crypto.pbkdf2Sync(password, username, iterations, scope.signature.keylen, scope.signature.digest);
  };
};
