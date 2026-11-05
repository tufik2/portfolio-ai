import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';

// All JWT code lives here; `jsonwebtoken` is not imported anywhere else.
const ISSUER = 'portfolio-ai';
const ALGORITHM = 'HS256';

function authError(message, code) {
  return new GraphQLError(message, { extensions: { code } });
}

function secret(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set in server/.env.`);
  return value;
}

// Signs a JWT and returns it with its expiry as a Date.
function sign(payload, { secretName, expiresIn, subject, jwtid }) {
  const token = jwt.sign(payload, secret(secretName), {
    algorithm: ALGORITHM,
    issuer: ISSUER,
    expiresIn,
    subject,
    ...(jwtid ? { jwtid } : {}),
  });
  const { exp } = jwt.decode(token);
  return { token, expiresAt: new Date(exp * 1000) };
}

// Verifies signature, algorithm, issuer and expiry; maps failures to codes.
function verify(token, { secretName, typ, expiredCode, invalidCode, invalidMessage }) {
  const key = secret(secretName);
  let claims;
  try {
    claims = jwt.verify(String(token ?? ''), key, {
      algorithms: [ALGORITHM],
      issuer: ISSUER,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw authError('Your session has expired.', expiredCode);
    }
    throw authError(invalidMessage, invalidCode);
  }
  if (claims.typ !== typ || !claims.sub || !claims.sid) {
    throw authError(invalidMessage, invalidCode);
  }
  return claims;
}

export default class TokenCtrl {
  /**
   * Access token: `sub` = user uuid, `sid` = session id, `typ` = access.
   * @returns {{token: string, expiresAt: Date}}
   */
  static signAccessToken({ userUuid, sessionId }) {
    return sign(
      { sid: sessionId, typ: 'access' },
      {
        secretName: 'JWT_SECRET',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        subject: userUuid,
      },
    );
  }

  /**
   * Refresh token: `sub` = user uuid, `sid` = session id, `typ` = refresh,
   * `jti` = random id tracked (hashed) in the session row.
   * @returns {{token: string, expiresAt: Date}}
   */
  static signRefreshToken({ userUuid, sessionId, jti }) {
    return sign(
      { sid: sessionId, typ: 'refresh' },
      {
        secretName: 'JWT_REFRESH_SECRET',
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
        subject: userUuid,
        jwtid: jti,
      },
    );
  }

  /**
   * @returns {{sub: string, sid: number}} claims of a valid access token
   * @throws TOKEN_EXPIRED / UNAUTHENTICATED
   */
  static verifyAccessToken(token) {
    return verify(token, {
      secretName: 'JWT_SECRET',
      typ: 'access',
      expiredCode: 'TOKEN_EXPIRED',
      invalidCode: 'UNAUTHENTICATED',
      invalidMessage: 'You need to sign in.',
    });
  }

  /**
   * @returns {{sub: string, sid: number, jti: string}} claims of a valid refresh token
   * @throws INVALID_REFRESH_TOKEN (also when expired)
   */
  static verifyRefreshToken(token) {
    const claims = verify(token, {
      secretName: 'JWT_REFRESH_SECRET',
      typ: 'refresh',
      expiredCode: 'INVALID_REFRESH_TOKEN',
      invalidCode: 'INVALID_REFRESH_TOKEN',
      invalidMessage: 'Your session has ended. Sign in again.',
    });
    if (!claims.jti) {
      throw authError('Your session has ended. Sign in again.', 'INVALID_REFRESH_TOKEN');
    }
    return claims;
  }
}
