(function (factory) {

  // Try to detect the promise library
  // Fall back to a simple custom one
  var Promise = false;
  Promise = Promise || ( 'undefined' !== typeof window ) && window.Promise || false;
  Promise = Promise || ( 'undefined' !== typeof global ) && global.Promise || false;
  Promise = Promise || function MiniPromise(cb) {
    var self       = this;
    this.__next    = null;
    this.__started = false;
    this.start     = function (data) {
      this.__started = true;
      var result     = undefined;
      if ( 'function' !== typeof cb ) {
        return console.error('Given callback was not a function:', cb);
      }
      if (data === undefined) {
        result = cb(this.__next && this.__next.start || function () {}, console.error);
      } else {
        result = cb(data);
      }
      if (result instanceof MiniPromise) {
        result.then(this.__next && this.__next.start || function () {});
        if (!result.__started) result.start();
      } else if (result !== undefined) {
        this.__next && this.__next.start && this.__next.start(result);
      }
    };
    this.then      = function (cb) {
      this.__next           = new MiniPromise(cb);
      this.__next.__started = true;
      this.then             = this.then.bind(this.__next);
      return this;
    };
    setTimeout(function () {
      if (!self.__started) self.start();
    }, 0);
  };

  if (('undefined' !== typeof module) && ('undefined' !== typeof module.exports)) {
    module.exports = factory(Promise);
  } else if (('function' === typeof define) && define.amd) {
    define([], function () {
      return factory(Promise);
    });
  } else {
    window.ttapi = factory(Promise);
  }
})(function (Promise) {


  console.log(Promise)
});