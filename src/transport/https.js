/**
 * HTTPS protocol handler
 *
 * Converts our raw named calls into AJAX request based on settings like the hostname, port & basePath
 */

var ajax = require('ajax-request'),
    url  = require('url');

module.exports = {
  defaultPort : 443,
  transport   : function (options) {
    if ('string' === typeof options) { options = {name : options}; }
    options = options || {};
    if (!options.name) { return Promise.reject('No name given'); }
    this.basePath = this.basePath || '/';
    if (this.basePath.slice(-1) !== '/') { this.basePath += '/'; }
    var parsed       = options.url && url.parse(options.url) || {};
    options.name     = options.name.replace(/\./g, '/');
    options.method   = (options.method || 'get').toUpperCase();
    options.protocol = options.protocol || parsed.protocol || this.protocol || (document && document.location && document.location.protocol);
    if (options.protocol.slice(-1) !== ':') { options.protocol += ':'; }
    options.hostname = options.hostname || parsed.hostname || this.hostname || (document && document.location && document.location.hostname);
    options.port     = options.port || parsed.port || this.port || (document && document.location && document.location.port);
    options.pathname = options.pathname || (this.basePath + ((options.name === 'versions') ? '' : ('v' + this.chosenVersion + '/')) + options.name + '.json');
    options.url      = url.format(options);
    return new Promise(function (resolve, reject) {
      ajax(options, function (err, res, body) {
        var output = {
          status : res.statusCode,
          text   : body,
          data   : null
        };
        try {
          output.data = JSON.parse(output.text);
        } catch (e) {
          output.data = null;
        }
        if (err) { return reject(Object.assign({error : err}, output)); }
        resolve(output);
        return undefined;
      });
    });
  }
};
