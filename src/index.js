(function (factory) {
  var result = factory();

  // Register to node if possible
  if (('undefined' !== typeof module) && ('undefined' !== typeof module.exports)) {
    module.exports = result;
  }

  // Register to AMD or attach to the window
  if (('function' === typeof define) && define.amd) {
    define([], function () {
      return result;
    });
  } else if ('undefined' !== typeof window) {
    window.ttapi = result;
  }
})(require('./factory'));