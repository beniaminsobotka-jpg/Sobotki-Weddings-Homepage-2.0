export const EVENT_OFFER = Object.freeze({ version: 'V1', id: 'event-5990', transport: 1, prints: 200, extraPrint: 1.75, film: 300, book: 600, hour: 500 });
export const EVENT_TIERS = Object.freeze([
  { max: 45, price: 3400, label: '20–45 osób', hours: 2 },
  { max: 60, price: 3800, label: '46–60 osób' },
  { max: 150, price: 4100, label: '61–150 osób' },
  { max: 250, price: 4400, label: '151–250 osób' },
  { max: 400, price: 4700, label: '251–400 osób' },
  { max: Infinity, price: 5600, label: 'Powyżej 400 osób' },
]);
export function getEventQuote(guests, options = {}) {
  const count = Number(guests);
  if (!Number.isInteger(count) || count < 20 || count > 100000) throw new RangeError('Podaj liczbę uczestników od 20 do 100 000.');
  const extraPrints = Number(options.extraPrints ?? 0);
  if (!Number.isInteger(extraPrints) || extraPrints < 0 || extraPrints > 100000) throw new RangeError('Podaj liczbę dodatkowych odbitek od 0 do 100 000.');
  const tier = EVENT_TIERS.find((item) => count <= item.max);
  const extras = (options.film ? EVENT_OFFER.film : 0) + (options.book ? EVENT_OFFER.book : 0) + (options.hour ? EVENT_OFFER.hour : 0);
  return { guests: count, base: tier.price, tier: tier.label, photographers: count > 400 ? 3 : 2,
    hours: (tier.hours ?? 3) + (options.hour ? 1 : 0), baseHours: tier.hours ?? 3, recommendHour: count > 250, extraPrints,
    printCost: extraPrints * EVENT_OFFER.extraPrint, extras,
    total: tier.price + extras + extraPrints * EVENT_OFFER.extraPrint };
}
