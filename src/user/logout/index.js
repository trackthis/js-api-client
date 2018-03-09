module.exports = function (scope) {
  /**
   * Logs out the user inside this browser
   *
   * Simply destroys the data we have to authenticate to the server
   *
   * @returns {Promise}
   */
  return function () {
    scope.token         = undefined;
    scope.refresh_token = undefined;
    scope.user          = undefined;
    scope.api.emit('logout');
    return Promise.resolve();
  };
};
