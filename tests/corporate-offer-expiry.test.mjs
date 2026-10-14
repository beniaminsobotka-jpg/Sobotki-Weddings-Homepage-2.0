import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../api/corporate-offer.js';
import { warszawiankaOffer } from '../server/offer-archive/warszawianka-2026.js';

function callOffer({ slug = warszawiankaOffer.slug, method = 'GET', now }) {
  const headers = {};
  const response = {
    statusCode: 200,
    setHeader(name, value) { headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    end(body = '') { this.body = body; return this; },
  };
  const originalNow = Date.now;
  Date.now = () => now;
  try {
    handler({ method, query: { slug } }, response);
  } finally {
    Date.now = originalNow;
  }
  return { ...response, headers };
}

test('private offer renders frozen corporate scope before expiry', () => {
  const response = callOffer({ now: Date.parse(warszawiankaOffer.expiresAt) - 1 });
  assert.equal(response.statusCode, 200);
  assert.match(response.body, /Hotel Warszawianka/);
  assert.match(response.body, /6\s?500 zł/);
  assert.match(response.body, /BRANDING W CENIE/);
  assert.doesNotMatch(response.body, /ślubna|weselna|para młoda/i);
  assert.equal(response.headers['Cache-Control'], 'private, no-store, max-age=0');
});

test('offer is gone for client at the two-week deadline but archived record remains', () => {
  assert.equal(Date.parse(warszawiankaOffer.expiresAt) - Date.parse(warszawiankaOffer.issuedAt), 14 * 24 * 60 * 60 * 1000);
  const response = callOffer({ now: Date.parse(warszawiankaOffer.expiresAt) });
  assert.equal(response.statusCode, 410);
  assert.match(response.body, /TA OFERTA/);
  assert.doesNotMatch(response.body, /6\s?500 zł/);
  assert.equal(warszawiankaOffer.pricePln, 6500);
});

test('unguessable slug is required', () => {
  assert.equal(callOffer({ slug: 'warszawianka', now: Date.now() }).statusCode, 404);
});

test('HEAD does not return offer content', () => {
  const response = callOffer({ method: 'HEAD', now: Date.parse(warszawiankaOffer.expiresAt) - 1 });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body, '');
});
