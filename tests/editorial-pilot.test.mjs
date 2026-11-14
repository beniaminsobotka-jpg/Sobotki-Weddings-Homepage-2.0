import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../api/lead.js';
import { readOfferAccessToken } from '../server/offer-access-token.js';

test('pilot is opt-in and freezes editorial prices in a working classic access token', async t => {
  process.env.BREVO_API_KEY = 'test-only';
  process.env.BREVO_LIST_ID_PORTRAITS_WEDDING = '12';
  const messages = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    messages.push(JSON.parse(options.body));
    return new Response('{}');
  });
  for (const flag of [undefined, 'editorial-p1']) {
    messages.length = 0;
    const res = { status(code) { this.code = code; return this; }, setHeader() {}, end(body) { this.body = JSON.parse(body); } };
    await handler({ method: 'POST', body: {
      formType: 'portraits_wedding', fullName: 'Test lokalny', email: 'test@example.invalid',
      weddingDate: '2027-06-01', venue: 'Sala testowa', serviceType: 'Fotostacja ślubna',
      source: 'Inne', pricingTier: 'up-to-150', portraitPilot: flag,
    } }, res);
    assert.equal(res.code, 200);
    const url = new URL(res.body.offerPath, 'https://www.sobotkiweddings.pl');
    assert.equal(url.pathname, flag ? '/studio-7m4q/' : '/oferta-portrety/');
    const snapshot = readOfferAccessToken(url.searchParams.get('access'));
    assert.equal(snapshot.kind, 'portraits_wedding');
    assert.deepEqual(snapshot.lead.packagePrices, { essential: 3200, exclusive: 4200 });
    assert.deepEqual(snapshot.lead.editorialPilot, flag ? { id: flag, essential: 3900, exclusive: 4800 } : undefined);
    const internal = messages.find(message => message.to?.[0]?.email === 'kontakt@sobotkiweddings.pl');
    const customer = messages.find(message => message.to?.[0]?.email === 'test@example.invalid');
    assert.ok(internal.textContent.includes(url.href));
    assert.ok(customer.textContent.includes(url.href));
    if (flag) assert.match(internal.textContent, /Edytorialna Exclusive: 4\s*800 zł/);
  }
});
