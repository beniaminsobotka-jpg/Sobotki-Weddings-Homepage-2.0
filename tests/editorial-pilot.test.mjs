import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../api/lead.js';
import { createOfferAccessToken, readOfferAccessToken } from '../server/offer-access-token.js';
import { getPricingForDistance } from '../server/portrait-pricing.js';

test('pilot is opt-in and freezes editorial prices in a working classic access token', async t => {
  process.env.BREVO_API_KEY = 'test-only';
  process.env.BREVO_LIST_ID_PORTRAITS_WEDDING = '12';
  const messages = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    messages.push(JSON.parse(options.body));
    return new Response('{}');
  });
  for (const [flag, distance, uplift, guestCount] of [
    [undefined, 150_000, 0, ''],
    ['editorial-p1', 150_000, 0, '120'],
    ['editorial-p1', 150_001, 300, '120'],
    ['editorial-p1', 250_000, 300, '120'],
    ['editorial-p1', 250_001, 600, '120'],
    ['editorial-p1', 350_000, 600, '121'],
  ]) {
    messages.length = 0;
    const pricing = getPricingForDistance(distance);
    const pricingQuote = createOfferAccessToken({
      kind: 'portraits_pricing_quote', expiresAt: Date.now() + 60_000,
      quote: { ...pricing, venue: 'Sala testowa', distanceKm: Math.round(distance / 100) / 10 },
    });
    const res = { status(code) { this.code = code; return this; }, setHeader() {}, end(body) { this.body = JSON.parse(body); } };
    await handler({ method: 'POST', body: {
      formType: 'portraits_wedding', fullName: 'Test lokalny', email: 'test@example.invalid',
      weddingDate: '2027-06-01', venue: 'Sala testowa', serviceType: 'Fotostacja ślubna',
      source: 'Inne', pricingQuote, portraitPilot: flag, guestCount,
    } }, res);
    assert.equal(res.code, 200);
    const url = new URL(res.body.offerPath, 'https://www.sobotkiweddings.pl');
    assert.equal(url.pathname, flag ? '/studio-7m4q/' : '/oferta-portrety/');
    const snapshot = readOfferAccessToken(url.searchParams.get('access'));
    assert.equal(snapshot.kind, 'portraits_wedding');
    assert.deepEqual(snapshot.lead.packagePrices, pricing.prices);
    assert.equal(snapshot.lead.guestsCount, guestCount);
    assert.deepEqual(snapshot.lead.editorialPilot, flag ? { id: flag, essential: 3900 + uplift, exclusive: 4800 + uplift } : undefined);
    const internal = messages.find(message => message.to?.[0]?.email === 'kontakt@sobotkiweddings.pl');
    const customer = messages.find(message => message.to?.[0]?.email === 'test@example.invalid');
    assert.ok(internal.textContent.includes(url.href));
    assert.ok(customer.textContent.includes(url.href));
    if (flag && guestCount === '120') assert.ok(internal.textContent.replace(/\s/g, '').includes('EdytorialnaExclusive:' + (4800 + uplift) + 'zł'));
    else assert.doesNotMatch(internal.textContent, /Edytorialna Exclusive/);
  }
});
