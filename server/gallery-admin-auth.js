import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'sw_gallery_admin';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const loginAttempts = new Map();

const getSessionSecret = () =>
  process.env.GALLERY_ADMIN_SESSION_SECRET || process.env.DROPBOX_APP_SECRET || '';

const hash = (value) => createHash('sha256').update(String(value)).digest();

const safeEqual = (first, second) => {
  const firstHash = hash(first);
  const secondHash = hash(second);
  return timingSafeEqual(firstHash, secondHash);
};

const sign = (payload) =>
  createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');

const parseCookies = (cookieHeader = '') =>
  String(cookieHeader)
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf('=');

      if (separatorIndex > 0) {
        cookies[part.slice(0, separatorIndex)] = decodeURIComponent(
          part.slice(separatorIndex + 1)
        );
      }

      return cookies;
    }, {});

const getClientKey = (request) => {
  const forwardedFor = request.headers?.['x-forwarded-for'];
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : String(forwardedFor || request.socket?.remoteAddress || 'unknown').split(',')[0];

  return ip.trim();
};

const canAttemptLogin = (request) => {
  const key = getClientKey(request);
  const now = Date.now();
  const existing = loginAttempts.get(key);

  if (!existing || existing.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }

  existing.count += 1;
  return existing.count <= 8;
};

const clearLoginAttempts = (request) => {
  loginAttempts.delete(getClientKey(request));
};

export const isGalleryAdminConfigured = () =>
  Boolean(process.env.GALLERY_ADMIN_PASSWORD && getSessionSecret());

export const verifyAdminPassword = (request, password) => {
  if (!isGalleryAdminConfigured() || !canAttemptLogin(request)) {
    return false;
  }

  const valid = safeEqual(password || '', process.env.GALLERY_ADMIN_PASSWORD);

  if (valid) {
    clearLoginAttempts(request);
  }

  return valid;
};

export const createAdminSessionCookie = () => {
  const payload = Buffer.from(
    JSON.stringify({ expiresAt: Date.now() + SESSION_DURATION_MS })
  ).toString('base64url');
  const token = `${payload}.${sign(payload)}`;
  const secure = process.env.VERCEL ? '; Secure' : '';

  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(
    SESSION_DURATION_MS / 1000
  )}${secure}`;
};

export const clearAdminSessionCookie = () => {
  const secure = process.env.VERCEL ? '; Secure' : '';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
};

export const isGalleryAdmin = (request) => {
  if (!isGalleryAdminConfigured()) {
    return false;
  }

  const token = parseCookies(request.headers?.cookie)[COOKIE_NAME];

  if (!token) {
    return false;
  }

  const [payload, signature] = token.split('.');

  if (!payload || !signature || !safeEqual(signature, sign(payload))) {
    return false;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number(session.expiresAt) > Date.now();
  } catch {
    return false;
  }
};
