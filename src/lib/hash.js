const crypto = require('crypto');

// scrypt is built into Node's core `crypto` module — no external package needed,
// and it maps cleanly onto what PHP's password_hash() does under the hood.

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      // store salt alongside the hash, separated by a delimiter
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

function verifyPassword(password, storedHash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = storedHash.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      const keyBuffer = Buffer.from(key, 'hex');
      // timingSafeEqual prevents timing attacks — compares in constant time
      // instead of returning early on the first mismatched byte
      const match = keyBuffer.length === derivedKey.length &&
        crypto.timingSafeEqual(keyBuffer, derivedKey);
      resolve(match);
    });
  });
}

module.exports = { hashPassword, verifyPassword };