module.exports = function(scope) {
  return {
    login: require('./login')(scope),
  };
};
