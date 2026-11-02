import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';

const attempts = new Map();
const duration = 30 * 24 * 60 * 60;
const cookieName = (gallery) => `sw_couple_${gallery.slug.replace(/-/g, '_')}`;
const signature = (gallery, value) =>
  createHmac('sha256', `${process.env.GALLERY_ADMIN_SESSION_SECRET || process.env.DROPBOX_APP_SECRET || ''}:${gallery.selectionPinHash}`)
    .update(`${gallery.slug}:${value}`).digest('hex');
const equal = (a, b) => {
  const first = Buffer.from(String(a));
  const second = Buffer.from(String(b));
  return first.length === second.length && timingSafeEqual(first, second);
};

export const hashSelectionPin = (pin) => {
  if (!/^\d{6}$/.test(String(pin))) throw new Error('PIN musi mieć dokładnie 6 cyfr.');
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(String(pin), salt, 32).toString('hex')}`;
};

export const verifySelectionPin = (request, gallery, pin) => {
  const key = `${gallery.slug}:${String(request.headers?.['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown').split(',')[0]}`;
  const now = Date.now();
  const current = attempts.get(key);
  const entry = current && current.until > now ? current : { count: 0, until: now + 15 * 60_000 };
  entry.count += 1;
  attempts.set(key, entry);
  if (entry.count > 8 || !/^\d{6}$/.test(String(pin))) return false;
  const [salt, expected] = String(gallery.selectionPinHash || '').split(':');
  if (!salt || !expected) return false;
  const valid = equal(scryptSync(String(pin), salt, 32).toString('hex'), expected);
  if (valid) attempts.delete(key);
  return valid;
};

export const hasCoupleSession = (request, gallery) => {
  if (!gallery.selectionPinHash) return false;
  const cookie = String(request.headers?.cookie || '').split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName(gallery)}=`));
  if (!cookie) return false;
  const [expires, signed] = cookie.slice(cookie.indexOf('=') + 1).split('.');
  return Number(expires) > Date.now() && equal(signed, signature(gallery, expires));
};

export const coupleSessionCookie = (gallery, clear = false) => {
  const expires = String(Date.now() + duration * 1000);
  const token = clear ? '' : `${expires}.${signature(gallery, expires)}`;
  return `${cookieName(gallery)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : duration}${process.env.VERCEL ? '; Secure' : ''}`;
};
