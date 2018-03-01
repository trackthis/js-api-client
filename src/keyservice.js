var crypto     = require('crypto'),
    KeyEncoder = require('key-encoder'),
    keyEncoder = null;

// Initialize the most base version of the key service
var keyservice = module.exports = {

  // The server's public key
  pubkey : undefined,

  // Default settings
  curve     : 'secp256k1',
  label     : 'ecdsa-sha2-secp256k1',
  keylen    : 32,
  digest    : 'sha256',
  format    : 'base64',
  signature : {
    base   : 1000,
    hash   : 'sha256',
    modulo : 9000
  }
};

/**
 * generate a int number based on hash of username
 *
 * @param   {string}    value     string used to create the number
 *
 * @return  {number}              value between limits inside configuration file
 */
keyservice.iterations = function (value) {
  try {
    var _hash  = crypto.createHash(keyservice.signature.hash).update(value).digest('hex');
    var result = 0;
    while (_hash.length) {
      result = ((result * 16) + parseInt(_hash.substr(0, 1), 16)) % keyservice.signature.modulo;
      _hash  = _hash.substr(1);
    }

    return result + keyservice.signature.base;
  } catch (err) {
    // /**
    //  * Error occurred while calculating sugnature iterations
    //  *
    //  * @scope [relpath]
    //  * @description Error occurred while calculating sugnature iterations
    //  */
    // reporter.err('Error occurred while calculating sugnature iterations');
    throw new Error('Error occurred while calculating sugnature iterations');
  }
};

/**
 * decode a Key or a Signature
 *
 * @param   {string}  value     key or signature
 *
 * @return  {string}            value decoded
 */
keyservice.decode = function (value) {
  try {
    var regex_from = {
      'base64' : /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/
    };
    var re         = regex_from[keyservice.format];
    var tokens     = value.split('\n').filter(function (line) {
      return line.substr(0, 1) !== '-';
    }).join('').split(' ');
    if (tokens.length === 1 && re.test(tokens[0])) {
      return tokens[0];
    }
    if (tokens.length < 2) {
      return false;
    }
    if (re.test(tokens[1])) {
      return tokens[1];
    }
    return false;
  } catch (err) {
    // /**
    //  * Error occurred while decoding signature value
    //  *
    //  * @scope [relpath]
    //  * @description Error occurred while decoding signature value
    //  */
    // reporter.err('Error occurred while decoding signature value');
    throw new Error('Error occurred while decoding signature value');
  }
};

/**
 * encode a Key or a Signature adding information
 *
 * @param   {string}  value     value already formatted
 * @param   {string}  [comment] optional comment
 * @param   {string}  [label]   optionally overwrite the default label
 *
 * @return  {string}            value encoded
 */
keyservice.encode = function (value, comment, label) {
  try {
    output = [label || keyservice.label];
    output.push(value);
    if (comment) {
      output.push(comment);
    }
    return output.join(' ').split('\n').map(function (line) {
      return line.trim();
    }).join('\n');
  } catch (err) {
    // /**
    //  * Error occurred while encoding signature value
    //  *
    //  * @scope [relpath]
    //  * @description Error occurred while encoding signature value
    //  */
    // reporter.err('Error occurred while encoding signature value');
    throw new Error('Error occurred while encoding signature value');
  }
};

/**
 * generate a new key pair
 *
 * @param   {string}    username    Username of the account
 * @param   {string}    password    Password of the account
 *
 * @return  {object}                Contains private key and public key in keyservice.format encoding
 *                                  The public key is in ssh public key format
 *                                  The private key is in PEM format
 */
keyservice.generateKeys = function (username, password) {
  try {
    keyEncoder        = keyEncoder || new KeyEncoder(keyservice.curve);
    var ecdh          = crypto.createECDH(keyservice.curve),
        privateKeyBuf = crypto.pbkdf2Sync(password, username, keyservice.iterations(username), keyservice.keylen, keyservice.digest);
    ecdh.generateKeys('base64', 'uncompressed');
    ecdh.setPrivateKey(privateKeyBuf);
    return {
      private_key : this.encode(privateKeyBuf.toString(keyservice.format), '\n-----END EC PRIVATE KEY-----\n', '-----BEGIN EC PRIVATE KEY-----\n').match(/.{1,64}/g).join('\n'),
      public_key  : this.encode(ecdh.getPublicKey().toString(keyservice.format))
    };
  } catch (err) {
    // /**
    //  * Error occurred while generating user keys
    //  *
    //  * @scope [relpath]
    //  * @description Error occurred while generating user keys
    //  */
    // reporter.err('Error occurred while generating user keys');
    throw new Error('Error occurred while generating user keys');
  }
};

/**
 * hash password
 *
 * @param   {string}    username    username of account
 * @param   {string}    password    password of account
 *
 * @return  {string}                hashed password
 */
keyservice.hashPassword = function (username, password) {
  try {
    return crypto.createHmac(keyservice.digest, password).update(username).digest(keyservice.format);
  } catch (err) {
    // /**
    //  * Error occurred while hashing password
    //  *
    //  * @scope [relpath]
    //  * @description Error occurred while hashing password
    //  */
    // reporter.err('Error occurred while hashing password');
    throw new Error('Error occurred while hashing password');
  }
};

/**
 * sign data
 *
 * @param   {string}            private_key   private key in keyservice.format format
 * @param   {(string|object)}   data          data to sign
 *
 * @return  {string}                          signature in keyservice.format format
 */
keyservice.sign = function (private_key, data) {
  try {
    keyEncoder     = keyEncoder || new KeyEncoder(keyservice.curve);
    private_key    = private_key && private_key.private_key || private_key;
    var cryptoSign = crypto.createSign(keyservice.digest);
    cryptoSign.write(JSON.stringify(data));
    cryptoSign.end();
    var private_key_pem = keyEncoder.encodePrivate(keyservice.toHex(keyservice.decode(private_key)), 'raw', 'pem');
    return cryptoSign.sign(private_key_pem, keyservice.format);
  } catch (err) {
    // /**
    //  * Error occurred while signing data
    //  *
    //  * @scope [relpath]
    //  * @description Error occurred while signing data
    //  */
    // reporter.err('Error occurred while signing data');
    throw new Error('Error occurred while signing data');
  }
};

keyservice.toHex = function (encoded_string) {
  try {
    switch (keyservice.format) {
      case 'base64' :
        encoded_string = Buffer.from(encoded_string, 'base64').toString('hex');
        break;
    }
    return encoded_string;
  } catch (err) {
    /**
     * Error occurred while decoding to Hex
     *
     * @scope [relpath]
     * @description Error occurred while decoding to Hex
     */
    reporter.err('Error occurred while decoding to Hex');
    throw new Error('Error occurred while decoding to Hex');
  }
};

keyservice.verify = function (public_key, data, signature) {
  keyEncoder = keyEncoder || new KeyEncoder(keyservice.curve);
  public_key = public_key && public_key.public_key || public_key;
  try {
    var cryptoVerify = crypto.createVerify(keyservice.digest);
    if ('string' !== typeof data) {
      data = JSON.stringify(data, Object.keys(data).sort());
    }
    cryptoVerify.write(data);
    cryptoVerify.end();
    var public_key_pem = keyEncoder.encodePublic(this.toHex(this.decode(public_key)), 'raw', 'pem');
    return cryptoVerify.verify(public_key_pem, signature, keyservice.format);
  } catch (e) {
    // /**
    //  * Error occurred while verifying signature
    //  *
    //  * @scope [relpath]
    //  * @description Error occurred while verifying signature
    //  */
    // reporter.err('Error occurred while verifying signature');
    throw new Error('Error occurred while verifying signature');
  }
};
