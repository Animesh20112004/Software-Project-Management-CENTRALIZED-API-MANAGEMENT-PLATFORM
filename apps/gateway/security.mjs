import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const hash = (value) => createHash('sha256').update(value).digest('hex');

export const secret = () => randomBytes(32).toString('base64url');

export function passwordVerifier(password) {
  const salt = randomBytes(16);
  const expected = scryptSync(password, salt, 32);
  return (candidate) => timingSafeEqual(expected, scryptSync(candidate, salt, 32));
}

export function sessionToken(request) {
  return (
    request.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('platform_session='))
      ?.slice('platform_session='.length) || ''
  );
}

export function cookie(token, maxAge = 28800) {
  const isSecure =
    process.env.COOKIE_SECURE === 'true' ||
    (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false');
  const sameSite = process.env.COOKIE_SAMESITE || 'Strict';
  return `platform_session=${token}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAge}${isSecure ? '; Secure' : ''}`;
}
