import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getEventQuote as baseQuote, EVENT_OFFER as baseOffer } from '../public/event-21aa/pricing.js';

for (const [id, uplift] of [['event-6f82',300],['event-5990',600]]) {
  test(`${id}: consistent location uplift at every participant boundary`, async () => {
    const { getEventQuote, EVENT_OFFER } = await import(`../public/${id}/pricing.js`);
    for (const count of [20,45,46,60,61,150,151,250,251,400,401,1000]) {
      for (const options of [{},{film:true,book:true,hour:true,extraPrints:100}]) {
        const base = baseQuote(count,options);
        const actual = getEventQuote(count,options);
        assert.equal(actual.base,base.base+uplift);
        assert.equal(actual.total,base.total+uplift);
        for(const key of ['hours','baseHours','photographers','recommendHour','extras','printCost']) assert.equal(actual[key],base[key]);
      }
    }
    assert.equal(EVENT_OFFER.id,id);
    assert.equal(EVENT_OFFER.version,'V1');
    for (const key of ['film','book','hour','transport','prints','extraPrint']) assert.equal(EVENT_OFFER[key],baseOffer[key]);
    const html = await readFile(new URL(`../public/${id}/index.html`,import.meta.url),'utf8');
    assert.doesNotMatch(html,/event-21aa|ślub|wesel|młod|Essential|Exclusive/i);
    assert.ok(html.includes(`${2800+uplift} zł`));
    assert.ok(html.includes(`${3200+uplift} zł`));
    assert.match(html,new RegExp(`data-offer-snapshot="${id}"`));
    assert.match(html,new RegExp(`data-offer-archive="/${id}/"`));
    assert.match(html,new RegExp(`src="/${id}/script.js"`));
    const script=await readFile(new URL(`../public/${id}/script.js`,import.meta.url),'utf8');
    assert.match(script,/quoteText\(false\)/);
    assert.match(script,/EVENT_OFFER\.id/);
    assert.match(script,/location\.origin\}\$\{location\.pathname/);
  });
}
