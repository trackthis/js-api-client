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
    window.getContents = result;
  }
})(function () {
  var factories = [
    function () {return new XMLHttpRequest();},
    function () {return new ActiveXObject("Msxml2.XMLHTTP");},
    function () {return new ActiveXObject("Msxml3.XMLHTTP");},
    function () {return new ActiveXObject("Microsoft.XMLHTTP");}
  ];

  function httpObject() {
    var xmlhttp = false;
    factories.forEach(function (factory) {
      try {
        xmlhttp = xmlhttp || factory();
      } catch (e) {
        return;
      }
    });
    return xmlhttp;
  }

  return function( uri, cb ) {
    var req = httpObject();
    if(!req) return;
    req.open('GET',uri,true);
    req.onreadystatechange = function() {
      if(req.readyState!==4) return;
      var response = {
        status : req.status,
        text   : req.responseText,
        data   : undefined
      };
      try {
        response.data = JSON.parse(reponse.text);
      } catch(e) {
        response.data = undefined;
      }
      cb(response);
    };
    req.send();
  };
});
