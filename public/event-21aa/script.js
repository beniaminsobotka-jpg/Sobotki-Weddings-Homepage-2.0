import { getEventQuote, EVENT_OFFER, EVENT_TIERS } from './pricing.js';

const byId = (id) => document.getElementById(id);
const money = (value) => `${value.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} zł`;
const guests = byId('eventGuests');
const slider = byId('eventGuestsSlider');
const prints = byId('eventPrints');
const film = byId('eventFilm');
const book = byId('eventBook');
const hour = byId('eventHour');
const reserve = byId('reserveCta');
const modal = byId('inquiryModal');
const form = byId('inquiryForm');
let quote;

function quoteText(includeMetadata = true) {
  const metadata = includeMetadata ? `Oferta eventowa ${EVENT_OFFER.version} · ${EVENT_OFFER.id}\n` : '';
  return `${metadata}${quote.guests} uczestników · ${quote.hours}h · ${quote.photographers} fotografów\nPakiet: ${money(quote.base)}\nFilmowe kółko: ${film.checked ? '+300 zł' : 'nie wybrano'}\nKsięga gości: ${book.checked ? '+600 zł' : 'nie wybrano'}\nDodatkowa godzina: ${hour.checked ? '+500 zł' : 'nie wybrano'}\n200 odbitek w cenie; planowane dodatkowe: ${quote.extraPrints} × 1,75 zł = ${money(quote.printCost)}\nRazem bez transportu: ${money(quote.total)}\nTransport: 1 zł/km od Gliwic, do ustalenia po otrzymaniu lokalizacji.\nOdbitki ponad 200 rozliczane według faktycznego wydruku.`;
}

function update() {
  try {
    quote = getEventQuote(guests.value, { film: film.checked, book: book.checked, hour: hour.checked, extraPrints: prints.value });
    byId('eventPriceError').textContent = '';
    slider.value = Math.min(quote.guests, Number(slider.max));
    slider.setAttribute('aria-valuetext', `${slider.value} uczestników`);
    byId('eventTierLabel').textContent = `${quote.guests.toLocaleString('pl-PL')} uczestników · ${quote.tier}`;
    byId('eventTotal').textContent = money(quote.total);
    byId('eventMobileTotal').textContent = money(quote.total);
    byId('eventBase').textContent = money(quote.base);
    byId('eventExtras').textContent = money(quote.extras);
    byId('eventPrintCost').textContent = money(quote.printCost);
    byId('eventHours').textContent = `${quote.hours} godziny pracy`;
    byId('eventTeam').textContent = `${quote.photographers} fotografów na miejscu`;
    byId('eventHourSuggestion').hidden = !quote.recommendHour || hour.checked;
    const tierIndex = EVENT_TIERS.findIndex((tier) => quote.guests <= tier.max);
    document.querySelectorAll('[data-event-tier]').forEach((row, index) => row.classList.toggle('is-selected', index === tierIndex));
    byId('eventInquiryQuote').textContent = quoteText(false);
    reserve.disabled = false;
    return true;
  } catch (error) {
    byId('eventPriceError').textContent = error.message;
    byId('eventTotal').textContent = '—';
    byId('eventMobileTotal').textContent = '—';
    byId('eventInquiryQuote').textContent = 'Poprawcie dane w kalkulatorze przed wysłaniem zapytania.';
    reserve.disabled = true;
    return false;
  }
}
slider.addEventListener('input', () => { guests.value = slider.value; update(); });
[guests, prints, film, book, hour].forEach((input) => input.addEventListener('input', update));
update();

function closeModal() {
  modal.classList.add('is-hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  reserve.focus();
}
reserve.addEventListener('click', () => {
  if (!update()) return;
  modal.classList.remove('is-hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  form.querySelector('input').focus();
});
document.querySelectorAll('[data-close-inquiry-modal]').forEach((element) => element.addEventListener('click', closeModal));
document.addEventListener('keydown', (event) => {
  if (modal.classList.contains('is-hidden')) return;
  if (event.key === 'Escape') closeModal();
  if (event.key !== 'Tab') return;
  const items = [...modal.querySelectorAll('button,input,select,textarea,a[href]')].filter((item) => !item.disabled);
  if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
  else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
});
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity() || !update()) return;
  const button = form.querySelector('[type=submit]');
  button.disabled = true;
  button.textContent = 'Wysyłamy zapytanie…';
  byId('inquiryError').textContent = '';
  const data = Object.fromEntries(new FormData(form));
  const selected = ['Fotostacja eventowa'];
  if (film.checked) selected.push('Filmowe kółko - dodatek');
  if (book.checked) selected.push('Drukowana księga gości - dodatek');
  if (hour.checked) selected.push('Dodatkowa godzina pracy');
  const timestamp = new Date().toISOString();
  try {
    const response = await fetch('/api/offer-lead', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...data, guestsCount: String(quote.guests), source: 'event_offer_portraits', eventName: 'zapytanie_o_termin',
        timestamp, eventTimestamp: timestamp, interestedOffers: selected,
        inquiryMessage: `${data.inquiryMessage || ''}\n\n${quoteText()}\nLink do tej wersji: ${location.origin}${location.pathname}` }),
    });
    const result = await response.json();
    if (!response.ok || !result.notificationSent) throw new Error('Notification not confirmed');
    closeModal();
    byId('ctaStatus').textContent = 'Dziękujemy! Otrzymaliśmy dane eventu i wybraną wycenę. Potwierdzimy dostępność terminu mailowo.';
    reserve.textContent = 'Zapytanie wysłane';
    reserve.disabled = true;
  } catch {
    byId('inquiryError').textContent = 'Nie udało się wysłać zapytania. Spróbujcie ponownie lub napiszcie na kontakt@sobotkiweddings.pl.';
  } finally {
    button.disabled = false;
    button.textContent = 'Wyślij zapytanie o termin';
  }
});
