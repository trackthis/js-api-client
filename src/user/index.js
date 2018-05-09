module.exports = function (scope) {
  return {
    isLoggedIn : require('./is-logged-in')(scope),
    login      : require('./login')(scope),
    logout     : require('./logout')(scope),
    me         : require('./me')(scope),
    otp        : require('./otp')(scope),
    oauth      : require('./otp')(scope)
  };
};
