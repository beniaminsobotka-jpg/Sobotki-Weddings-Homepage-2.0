import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/best-of-share.js';
import adminHandler from '../api/admin-galleries.js';
import { getBestOfShareToken } from '../server/gallery-admin-auth.js';
import { getBestOfGallery } from '../server/dropbox-gallery.js';

test('only the shared link gives guests access to Best Of previews, without exposing source labels or administration', async (t) => {
  process.env.DROPBOX_ACCESS_TOKEN = 'test-token';
  process.env.GALLERY_ADMIN_SESSION_SECRET = 'test-session-secret';
  const token = getBestOfShareToken();
  const folder = getBestOfGallery().folder;
  const name = 'private-slug__Łódź.jpg';
  const dropbox = t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.endsWith('/files/list_folder')) {
      assert.equal(JSON.parse(options.body).path, folder);
      return Response.json({ entries: [{ '.tag': 'file', name, id: 'id:best-of' }], has_more: false });
    }
    assert.ok(url.endsWith('/files/get_thumbnail_v2'));
    assert.equal(JSON.parse(options.headers['Dropbox-API-Arg']).resource.path, `${folder}/${name}`);
    return new Response(Uint8Array.of(255, 216, 255));
  });
  const run = async (query, method = 'GET', route = handler) => {
    const result = {
      headers: {},
      setHeader(key, value) { this.headers[key] = value; return this; },
      status(code) { this.code = code; return this; },
      end(body) { this.body = body; },
    };
    await route({ method, query, headers: {} }, result);
    return result;
  };

  assert.equal((await run({})).code, 404);
  assert.equal((await run({ token: 'wrong' })).code, 404);
  assert.equal(dropbox.mock.callCount(), 0);
  const listing = await run({ token });
  assert.equal(listing.code, 200);
  assert.match(listing.headers['X-Robots-Tag'], /noindex/);
  assert.ok(!listing.body.includes('private-slug'));
  const { gallery, photos } = JSON.parse(listing.body);
  assert.equal(gallery.photoCount, 1);
  assert.equal(photos[0].downloadUrl, undefined);
  const query = Object.fromEntries(new URL(photos[0].largeUrl, 'https://example.test').searchParams);
  const preview = await run(query);
  assert.equal(preview.code, 200);
  assert.equal(preview.headers['Content-Type'], 'image/jpeg');
  assert.equal((await run({ ...query, photo: name })).code, 404);
  assert.equal((await run({ ...query, token: '' })).code, 404);
  assert.equal((await run({ token }, 'POST')).code, 405);
  assert.equal((await run({ token, photosFor: 'best-of' }, 'GET', adminHandler)).code, 401);
  assert.equal(dropbox.mock.callCount(), 2);
});
