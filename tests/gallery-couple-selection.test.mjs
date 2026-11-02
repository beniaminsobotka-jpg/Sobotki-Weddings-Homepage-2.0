import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hashSelectionPin, coupleSessionCookie, hasCoupleSession } from '../server/gallery-couple-auth.js';
import handler from '../api/gallery-favorites.js';
import galleryHandler from '../api/gallery.js';
import { getGalleryFavoriteSummary } from '../server/dropbox-gallery.js';

process.env.DROPBOX_ACCESS_TOKEN = 'mock-token';
process.env.DROPBOX_APP_SECRET = 'test-only-session-secret';
process.env.GALLERY_ADMIN_PASSWORD = 'test-admin';
const gallery = {
  slug: 'weddings-test', title: 'Test', kind: 'weddings', folder: '/Galerie/WEDDINGS Test',
  active: true, selectionPinHash: hashSelectionPin('123456'),
};
let favorites = { selections: { 'old-guest-123': ['guest.jpg'] } };
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options = {}) => {
  const path = String(options.headers?.['Dropbox-API-Arg'] || '');
  if (String(url).endsWith('/files/download')) {
    return Response.json(path.includes('_sobotki-galleries') ? { galleries: [gallery] } : favorites);
  }
  if (String(url).endsWith('/files/upload')) {
    favorites = JSON.parse(options.body);
    return Response.json({});
  }
  if (String(url).endsWith('/files/list_folder')) {
    return Response.json({ entries: ['one.jpg', 'two.jpg'].map((name) => ({ '.tag': 'file', name, rev: 'r1' })), has_more: false });
  }
  throw new Error(`Unexpected request ${url}`);
};
const call = async (method, body = {}, cookie = '') => {
  const response = {
    headers: {}, statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; return this; },
    end(value) { this.body = JSON.parse(value); return this; },
  };
  await handler({ method, query: { slug: gallery.slug }, body: { slug: gallery.slug, ...body }, headers: { cookie } }, response);
  return response;
};

test('PIN protects a shared couple list and keeps guest selections private', async () => {
  try {
    assert.equal(hasCoupleSession({ headers: {} }, gallery), false);
    const guest = await call('GET');
    assert.deepEqual(guest.body, { unlocked: false, configured: true, counts: {}, selected: [] });
    assert.equal(guest.headers['Cache-Control'], 'private, no-store');
    assert.equal((await call('POST', { photoName: 'one.jpg', liked: true })).statusCode, 403);
    assert.equal((await call('POST', { action: 'unlock', pin: '000000' })).statusCode, 401);
    const unlock = await call('POST', { action: 'unlock', pin: '123456' });
    assert.equal(unlock.body.unlocked, true);
    assert.deepEqual(unlock.body.selected, []);
    const cookie = unlock.headers['Set-Cookie'].split(';')[0];
    assert.ok(unlock.headers['Set-Cookie'].includes('HttpOnly'));
    assert.equal((await call('POST', { photoName: 'one.jpg', liked: true }, cookie)).statusCode, 200);
    const secondDeviceCookie = coupleSessionCookie(gallery).split(';')[0];
    assert.deepEqual((await call('GET', {}, secondDeviceCookie)).body.selected, ['one.jpg']);
    await call('POST', { photoName: 'two.jpg', liked: true }, secondDeviceCookie);
    assert.deepEqual((await getGalleryFavoriteSummary(gallery)).selected, ['one.jpg', 'two.jpg']);
    assert.deepEqual((await call('GET')).body.counts, {});
    assert.equal(hasCoupleSession({ headers: { cookie } }, { ...gallery, slug: 'other-gallery' }), false);
    assert.equal(hasCoupleSession({ headers: { cookie } }, { ...gallery, selectionPinHash: hashSelectionPin('654321') }), false);
    const publicResponse = {
      status() { return this; }, setHeader() { return this; }, end(value) { this.body = value; },
    };
    await galleryHandler({ method: 'GET', query: { slug: gallery.slug } }, publicResponse);
    assert.ok(!publicResponse.body.includes(gallery.selectionPinHash));
    assert.ok(!publicResponse.body.includes('couple-selection'));
    const locked = await call('POST', { action: 'lock' }, cookie);
    assert.ok(locked.headers['Set-Cookie'].includes('Max-Age=0'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
