module.exports = function() {
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
  return function serializeObject(obj, prefix) {
    var str = [], p;
    for (p in obj) {
      if (!obj.hasOwnProperty(p)) { continue; }
      if ('undefined' === typeof obj[p]) { continue; }
      if ( ('string' === typeof obj[p]) && (!obj[p].length)) { continue; }
      var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
      str.push((v !== null && typeof v === "object") ?
               serializeObject(v, k) :
               encodeURIComponent(k) + "=" + encodeURIComponent(v));
    }
    return str.join("&");
  };
};
