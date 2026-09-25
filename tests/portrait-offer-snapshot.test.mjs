import assert from 'node:assert/strict';
import test from 'node:test';
import leadHandler from '../api/lead.js';
import travelDistanceHandler from '../api/travel-distance.js';
import { createOfferAccessToken, readOfferAccessToken } from '../server/offer-access-token.js';

const makeResponse = () => ({
  statusCode: 200,
  headers: {},
  status(code) { this.statusCode = code; return this; },
  setHeader(name, value) { this.headers[name] = value; return this; },
  end(body) { this.body = JSON.parse(body); return this; },
});

const baseLead = {
  formType: 'portraits_wedding',
  email: 'client@example.com',
  fullName: 'Anna Kowalska',
  weddingDate: '2027-07-10',
  venue: 'Sala Testowa, Kraków',
  serviceType: 'Fotostacja ślubna',
  source: 'Strona WWW',
  pricingTier: 'up-to-150',
  distanceKm: 10,
};

test('signed quote freezes the same prices and offer URL in both emails', async () => {
  const previousFetch = global.fetch;
  const previousKey = process.env.BREVO_API_KEY;
  const previousList = process.env.BREVO_LIST_ID_PORTRAITS_WEDDING;
  process.env.BREVO_API_KEY = 'test-secret';
  process.env.BREVO_LIST_ID_PORTRAITS_WEDDING = '12';
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return { ok: true };
  };

  try {
    const pricingQuote = createOfferAccessToken({
      kind: 'portraits_pricing_quote',
      expiresAt: Date.now() + 60_000,
      quote: {
        venue: baseLead.venue,
        tier: 'up-to-250',
        distanceKm: 172.3,
        resolvedLocation: 'Sala Testowa, Kraków, Polska',
        prices: { essential: 3277, exclusive: 4277 },
        quotedAt: '2026-09-25T10:00:00.000Z',
      },
    });
    const response = makeResponse();
    await leadHandler({ method: 'POST', body: { ...baseLead, pricingQuote } }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(calls.length, 3);
    const [, internal, customer] = calls.map((call) => call.body);
    const offerUrl = `https://www.sobotkiweddings.pl${response.body.offerPath}`;
    assert.equal(internal.to[0].email, 'kontakt@sobotkiweddings.pl');
    assert.equal(customer.to[0].email, baseLead.email);
    assert.match(internal.textContent, /Cena Essential: 3\s*277 zł/);
    assert.match(internal.textContent, /Cena Exclusive: 4\s*277 zł/);
    assert.ok(internal.textContent.includes(offerUrl));
    assert.ok(internal.htmlContent.includes(offerUrl.replaceAll('&', '&amp;')));
    assert.ok(customer.textContent.includes(offerUrl));
    assert.ok(customer.htmlContent.includes(offerUrl.replaceAll('&', '&amp;')));

    const access = new URL(offerUrl).searchParams.get('access');
    const saved = readOfferAccessToken(access);
    assert.deepEqual(saved.lead.packagePrices, { essential: 3277, exclusive: 4277 });
    assert.equal(saved.lead.pricingTier, 'up-to-250');
    assert.equal(saved.lead.distanceKm, 172.3);
    assert.ok(saved.expiresAt > Date.now() + 4 * 365 * 24 * 60 * 60 * 1000);
  } finally {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.BREVO_API_KEY;
    else process.env.BREVO_API_KEY = previousKey;
    if (previousList === undefined) delete process.env.BREVO_LIST_ID_PORTRAITS_WEDDING;
    else process.env.BREVO_LIST_ID_PORTRAITS_WEDDING = previousList;
  }
});

test('a quote for a different venue is rejected before sending mail', async () => {
  const previousFetch = global.fetch;
  const previousKey = process.env.BREVO_API_KEY;
  const previousList = process.env.BREVO_LIST_ID_PORTRAITS_WEDDING;
  process.env.BREVO_API_KEY = 'test-secret';
  process.env.BREVO_LIST_ID_PORTRAITS_WEDDING = '12';
  let calls = 0;
  global.fetch = async () => { calls++; throw new Error('Unexpected network call'); };

  try {
    const pricingQuote = createOfferAccessToken({
      kind: 'portraits_pricing_quote',
      expiresAt: Date.now() + 60_000,
      quote: {
        venue: 'Inna sala', tier: 'up-to-150', distanceKm: 10,
        prices: { essential: 3200, exclusive: 4200 },
      },
    });
    const response = makeResponse();
    await leadHandler({ method: 'POST', body: { ...baseLead, pricingQuote } }, response);
    assert.equal(response.statusCode, 400);
    assert.equal(calls, 0);
  } finally {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.BREVO_API_KEY;
    else process.env.BREVO_API_KEY = previousKey;
    if (previousList === undefined) delete process.env.BREVO_LIST_ID_PORTRAITS_WEDDING;
    else process.env.BREVO_LIST_ID_PORTRAITS_WEDDING = previousList;
  }
});

test('distance lookup returns a signed snapshot matching displayed prices', async () => {
  const previousFetch = global.fetch;
  const previousKey = process.env.BREVO_API_KEY;
  process.env.BREVO_API_KEY = 'test-secret';
  global.fetch = async (url) => ({
    ok: true,
    json: async () => String(url).includes('nominatim')
      ? [{ lat: '50.1', lon: '19.1', display_name: 'Sala Testowa, Kraków, Polska' }]
      : { code: 'Ok', routes: [{ distance: 172_300 }] },
  });

  try {
    const response = makeResponse();
    await travelDistanceHandler({ method: 'GET', query: { venue: baseLead.venue } }, response);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body.prices, { essential: 3500, exclusive: 4500 });
    assert.equal(response.body.tier, 'up-to-250');
    const saved = readOfferAccessToken(response.body.pricingQuote);
    assert.deepEqual(saved.quote.prices, response.body.prices);
    assert.equal(saved.quote.venue, baseLead.venue);
  } finally {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.BREVO_API_KEY;
    else process.env.BREVO_API_KEY = previousKey;
  }
});
