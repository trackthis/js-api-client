module.exports = function () {
  return function catchRedirect(response) {
    // if (window && window.location && window.location.href) {
    //   switch (response.status) {
    //     case 302:
    //       if (!response.data.location) { return response; }
    //       window.location.href = response.data.location;
    //       break;
    //     default:
    //       return response;
    //   }
    // }
    return response;
  };
};

