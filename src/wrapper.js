(function (apiObject) {
  // Register to AMD or attach to the window
  /** global: define */
  if (('function' === typeof define) && define.amd) {
    define([], function () {
      return apiObject;
    });
  } else if ('undefined' !== typeof window) {
    window.trackthisApi = apiObject;
  }
})(require('./index'));
