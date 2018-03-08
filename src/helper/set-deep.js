var extend = require('extend');

module.exports = function(scope) {
  return function set_deep( obj, key, value, separator ) {
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
        if ( obj[token] && 'object' === typeof value ) {
          extend( obj[token], value );
        } else {
          obj[token] = value;
        }
      }
    }
  };
};
