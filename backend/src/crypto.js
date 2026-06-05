import crypto from 'crypto';

const DEFAULT_KEY_SIZE = 32;

export function hashText(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

export function createRandomToken(size = DEFAULT_KEY_SIZE) {
  return crypto.randomBytes(size).toString('hex');
}

export function createOtp(length = 6) {
  const max = 10 ** length;
  const value = crypto.randomInt(max - 10 ** (length - 1)) + 10 ** (length - 1);
  return String(value);
}

export function verifyHash(value, expectedHash) {
  const hash = hashText(value);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(String(expectedHash), 'hex'));
}
