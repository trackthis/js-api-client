(function (factory) {
  var result = factory();
  // Register to AMD or attach to the window
  if (('function' === typeof define) && define.amd) {
    define([], function () {
      return result;
    });
  } else if ('undefined' !== typeof window) {
    window.trackthisApi = result;
  }
})(require('./factory'));