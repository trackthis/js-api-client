var crypto      = require('crypto'),
    KeyEncoder  = require('key-encoder'),
    keyEncoder  = undefined;

var keyservice = module.exports = {

  // The server's public key
  pubkey : undefined,

  // Default settings
  curve  : 'secp256k1',
  label  : 'ecdsa-sha2-secp256k1',
  keylen : 32,
  digest : 'sha256',
  format : 'base64',
  signature : {
    base    : 1000,
    hash    : 'sha256',
    modulo  : 9000
  },

  /**
   * generate a int number based on hash of username
   *
   * @param   {string}    value     string used to create the number
   *
   * @return  {number}              value between limits inside configuration file
   */
  iterations : function (value) {
    var _hash  = crypto.createHash(keyservice.signature.hash).update(value).digest('hex');
    var result = 0;
    while (_hash.length) {
      result = ((result * 16) + parseInt(_hash.substr(0, 1), 16)) % keyservice.signature.modulo;
      _hash  = _hash.substr(1);
    }

    return result + keyservice.signature.base;
  },

  /**
   * decode a Key or a Signature
   * @param   {string}  value     key or signature
   * @return  {string}            value decoded
   */
  decode : function (value) {
    keyEncoder = keyEncoder || new KeyEncoder(keyservice.curve);
    var regex_from = {
      'base64' : /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/
    };
    var re         = regex_from[keyservice.format];
    var tokens     = value.split('\n').filter(function(line) {
      return line.substr(0,1) !== '-';
    }).join('').split(' ');
    if (tokens.length === 1 && re.test(tokens[0])) return tokens[0];
    if (re.test(tokens[1])) return tokens[1];
    return false;
  },

  /**
   * encode a Key or a Signature adding information
   *
   * @param   {string}  value     value already formatted
   * @param   {string}  [comment] optional comment
   * @param   {string}  [label]   optionally overwrite the  default label
   *
   * @return  {string}            value encoded
   */
  encode : function (value, comment, label) {
    keyEncoder = keyEncoder || new KeyEncoder(keyservice.curve);
    output = [label || keyservice.label];
    output.push(value);
    if (comment) {
      output.push(comment);
    }
    return output.join(' ').split('\n').map(function(line) {
      return line.trim();
    }).join('\n');
  },

  /**
   * generate a new couple of keys
   * @param   {string}    username    username of account
   * @param   {string}    password    password of account
   * @return  {object}                contains private key and public key in keyservice.format format
   */
  generateKeys : function (username, password) {
    keyEncoder = keyEncoder || new KeyEncoder(keyservice.curve);
    try {
      var ecdh          = crypto.createECDH(keyservice.curve),
          privateKeyBuf = crypto.pbkdf2Sync(password, username, keyservice.iterations(username), keyservice.keylen, keyservice.digest);
      ecdh.generateKeys('base64','uncompressed');
      ecdh.setPrivateKey(privateKeyBuf);
      return {
        private_key : keyservice.encode(privateKeyBuf.toString(keyservice.format),'\n-----END EC PRIVATE KEY-----\n','-----BEGIN EC PRIVATE KEY-----\n').match(/.{1,64}/g).join('\n'),
        public_key  : keyservice.encode(ecdh.getPublicKey().toString(keyservice.format))
      };
    } catch (err) {
      console.error(err);
      throw new Error({
        code        : '',
        description : ''
      });
    }
  },

  /**
   * hash password
   * @param   {string}    username    username of account
   * @param   {string}    password    password of account
   * @return  {string}                hashed password
   */
  hashPassword : function (username, password) {
    keyEncoder = keyEncoder || new KeyEncoder(keyservice.curve);
    try {
      return crypto.createHmac(keyservice.digest, password).update(username).digest(keyservice.format);
    } catch (err) {
      console.error(err);
      throw new Error({
        code        : '',
        description : ''
      });
    }
  },

  /**
   * sign data
   * @param   {string}            private_key   private key in keyservice.format format
   * @param   {(string|object)}   data          data to sign
   * @return  {string}                          signature in keyservice.format format
   */
  sign : function (private_key, data) {
    keyEncoder  = keyEncoder || new KeyEncoder(keyservice.curve);
    private_key = private_key && private_key.private_key || private_key;
    try {
      var cryptoSign = crypto.createSign(keyservice.digest);
      if ( 'string' !== typeof data ) data = JSON.stringify(data, Object.keys(data).sort());
      cryptoSign.write(data);
      cryptoSign.end();
      var private_key_pem = keyEncoder.encodePrivate(keyservice.toHex(keyservice.decode(private_key)), 'raw', 'pem');
      return cryptoSign.sign(private_key_pem, keyservice.format);
    } catch (err) {
      console.error(err);
      throw new Error({
        code        : '',
        description : ''
      });
    }
  },

  /**
   * decode from base64 or other format used in keyservice.format
   * @param   {string}  encoded_string    value encoded
   * @return  {string}                    value decoded
   */
  toHex : function (encoded_string) {
    switch (keyservice.format) {
      case 'base64' :
        encoded_string = Buffer.from(encoded_string, 'base64').toString('hex');
        break;
    }
    return encoded_string;
  },

  /**
   * verify if signature is valid
   * @param   {string}          public_key  public key in keyservice.format format
   * @param   {(string|object)} data        data signed
   * @param   {string}          signature   signature to be verified
   * @return  {boolean}                     true if signature is verified
   */
  verify : function (public_key, data, signature) {
    keyEncoder = keyEncoder || new KeyEncoder(keyservice.curve);
    public_key = public_key && public_key.public_key || public_key;
    try {
      var cryptoVerify = crypto.createVerify(keyservice.digest);
      if ( 'string' !== typeof data ) data = JSON.stringify(data, Object.keys(data).sort());
      cryptoVerify.write(data);
      cryptoVerify.end();
      var public_key_pem = keyEncoder.encodePublic(keyservice.toHex(keyservice.decode(public_key)), 'raw', 'pem');
      return cryptoVerify.verify(public_key_pem, keyservice.decode(signature), keyservice.format);
    } catch (err) {
      console.error(err);
      throw new Error({
        code        : '',
        description : ''
      });
    }
  }
};
