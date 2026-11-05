import crypto from 'node:crypto';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default class UtilsCtrl {
  /**
   * True when `value` looks like an email address (something@domain.tld).
   * @param {string} value
   * @returns {boolean}
   */
  static isEmail(value) {
    return typeof value === 'string' && EMAIL_PATTERN.test(value);
  }

  /**
   * True when `value` is a canonical UUID (8-4-4-4-12 hex, any case).
   * @param {string} value
   * @returns {boolean}
   */
  static isUUID(value) {
    return typeof value === 'string' && UUID_PATTERN.test(value);
  }

  /**
   * SHA-256 (hex, 64 characters) of a token. Only this hash is stored,
   * never the token itself.
   * @param {string} token
   * @returns {string}
   */
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * New random one-time verification token: 32 bytes, base64url (43
   * characters, URL-safe).
   * @returns {string}
   */
  static newVerificationToken() {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * New 6-digit sign-in code, zero-padded (e.g. "004821").
   * @returns {string}
   */
  static newLoginCode() {
    return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  }

  /**
   * Hash stored for a sign-in code: SHA-256 of "<user uuid>:<code>", so the
   * same code for two users gives different hashes.
   * @param {string} userUuid
   * @param {string} code
   * @returns {string}
   */
  static hashLoginCode(userUuid, code) {
    return UtilsCtrl.hashToken(`${userUuid}:${code}`);
  }

  /**
   * Compares two hex hashes without leaking timing information.
   * @param {string} a
   * @param {string} b
   * @returns {boolean}
   */
  static hashesEqual(a, b) {
    const left = Buffer.from(String(a ?? ''));
    const right = Buffer.from(String(b ?? ''));
    return left.length === right.length && crypto.timingSafeEqual(left, right);
  }

  /**
   * Link to the app's /verify-email page for a token, based on APP_URL.
   * @param {string} token
   * @returns {string} e.g. http://localhost:5173/verify-email?token=…
   */
  static verifyEmailUrl(token) {
    const base = (process.env.APP_URL || '').replace(/\/+$/, '');
    return `${base}/verify-email?token=${encodeURIComponent(token)}`;
  }
}
