module.exports = function (scope) {
  return {
    login  : require('./login')(scope),
    logout : require('./logout')(scope)
  };
};
