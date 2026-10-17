import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getEventQuote } from '../public/event-21aa/pricing.js';
import handler from '../api/offer-lead.js';

test('event prices, recommendations and team size at every boundary', () => {
  for (const [guests, price, photographers, recommendation] of [
    [20,3200,2,false],[60,3200,2,false],[61,3500,2,false],[150,3500,2,false],
    [151,3800,2,false],[250,3800,2,false],[251,4100,2,true],[400,4100,2,true],
    [401,5000,3,true],[1000,5000,3,true],[100000,5000,3,true],
  ]) {
    const quote = getEventQuote(guests);
    assert.equal(quote.base, price);
    assert.equal(quote.total, price, 'recommended hour is never silently charged');
    assert.equal(quote.hours, 3);
    assert.equal(quote.photographers, photographers);
    assert.equal(quote.recommendHour, recommendation);
  }
});
test('extras and prints add up, transport stays separate', () => {
  const quote = getEventQuote(401, {film:true,book:true,hour:true,extraPrints:100});
  assert.equal(quote.total, 6575);
  assert.equal(quote.hours, 4);
  assert.equal(quote.printCost, 175);
  assert.equal(getEventQuote(20,{extraPrints:1}).total,3201.75);
  for (const guests of [0,19,20.5,'',NaN,Infinity,100001]) assert.throws(() => getEventQuote(guests));
  for (const extraPrints of [-1,1.5,NaN,100001]) assert.throws(() => getEventQuote(20,{extraPrints}));
});
test('event copy has no wedding-only wording or package promises', async () => {
  const html = await readFile(new URL('../public/event-21aa/index.html',import.meta.url),'utf8');
  assert.doesNotMatch(html,/ślub|wesel|młod|Essential|Exclusive/i);
  assert.match(html,/Wersja V1/);
  assert.match(html,/1,75 zł\/szt/);
  assert.equal((html.match(/<figure[^>]*><img src="\/offers\/v1\/assets\/mosaic/g)||[]).length >= 34,true);
});
test('event enquiry notifies owner only, without wedding automation or PDF (mocked network)', async () => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.BREVO_API_KEY;
  const calls = [];
  globalThis.fetch = async (url,options) => {
    calls.push({url,body:JSON.parse(options.body)});
    return new Response(JSON.stringify({messageId:'local-test'}),{status:201});
  };
  process.env.BREVO_API_KEY = 'local-test-only';
  const response = { status(code){this.code=code;return this},setHeader(){return this},end(body){this.body=JSON.parse(body)} };
  try {
    await handler({method:'POST',body:{source:'event_offer_portraits',eventName:'zapytanie_o_termin',name:'Test lokalny',email:'test@example.com',weddingDate:'2027-01-15',venue:'Event testowy',guestsCount:'401',interestedOffers:['Fotostacja eventowa','Filmowe kółko - dodatek'],inquiryMessage:'Wersja V1 · event-21aa\n5000 zł + 300 zł\nLink: /event-21aa/'}},response);
    assert.equal(response.code,200);
    assert.equal(response.body.notificationSent,true);
    assert.equal(calls.length,1);
    assert.match(calls[0].url,/smtp\/email$/);
    assert.match(calls[0].body.textContent,/Data eventu/);
    assert.match(calls[0].body.textContent,/event-21aa/);
    assert.doesNotMatch(calls[0].body.textContent,/ślub/i);
    assert.equal(calls[0].body.attachment,undefined);
  } finally {
    globalThis.fetch=originalFetch;
    if(previousKey===undefined)delete process.env.BREVO_API_KEY;else process.env.BREVO_API_KEY=previousKey;
  }
});
