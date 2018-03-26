(function (factory) {
  var result = factory();

  // Register to node if possible
  /** global: define */
  if (('undefined' !== typeof module) && ('undefined' !== typeof module.exports)) {
    module.exports = result;
  }

  // Register to AMD or attach to the window
  if (('function' === typeof define) && define.amd) {
    define([], function () {
      return result;
    });
  } else if ('undefined' !== typeof window) {
    window.cbq = result;
  }
})(function() {
  return function cbq(list,resolve,reject) {
    var q = list.slice();
    return (function next(data) {
      var f = q.shift();
      if (!f) { return ( 'function' === typeof resolve ) ? resolve(data) : data; }
      setTimeout( function () { f( data, next, reject ); },0 );
      return undefined;
    })();
  };
});
