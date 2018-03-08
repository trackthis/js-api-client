module.exports = function(scope) {
  /**
   * Deserialize an url-encoded object
   *
   * Returns the object
   *
   * @param {string} encoded
   *
   * @returns {object}
   */
  module.exports = function deserializeObject(encoded) {
    var output = {};
    if ( 'string' !== typeof encoded ) { throw "Object could not be decoded"; }
    decodeURIComponent(encoded)                                                                  // "a[b]=c&a[d]=e&f=g,h"
      .split('&')                                                                                // [ "a[b]=c", "a[d]=e', "f=g,h" ]
      .map(function (token) { return token.split('=',2); })                                      // [ ["a[b]","c"], ["a[d]","e"], ["f","g,h"] ]
      .map(function (token) { return [ (token[0] || '').replace(/]/g,''), token[1] || null ]; }) // [ ["a[b","c"], ["a[d","e"], ["f","g,h"] ]
      .map(function (token) { return [ token[0].split('[') , token[1] ]; })                      // [ [["a","b"],"c"], [["a","d"],"e"], [["f"],"g,h"] ]
      .forEach(function (token) { scope.set_deep(output,token[0],token[1]); });                        // { a: { b: "c", d: "e" }, f: "g,h" }
    return output;
  };
};
