module.exports = (window && window.localStorage) || {
  getItem    : function (key) {
    var nameEQ = encodeURIComponent(key) + '=';
    var i,ca   = document.cookie.split(';');

    for ( i in ca ) {
      var c = ca[i].trim();
      if (c.indexOf(nameEQ)===0) {
        try {
          return JSON.parse(decodeURIComponent(c.substr(nameEQ.length)));
        } catch(e) {
          return undefined;
        }
      }
    }
  },
  setItem    : function (key, value) {
    document.cookie = encodeURIComponent(key) + "=" + encodeURIComponent(JSON.stringify(value)).replace(/;/g,'%3B') + "; path=/";
  },
  removeItem : function (key) {
    document.cookie = encodeURIComponent(key) + "=null; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  }
};
