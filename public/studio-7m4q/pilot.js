const byId = id => document.getElementById(id);
const access = new URLSearchParams(location.search).get('access');
const money = value => value.toLocaleString('pl-PL') + ' zł';
let lead;

async function json(url, body) {
  const options = { headers: { Accept: 'application/json' }, cache: 'no-store' };
  if (body) {
    options.method = 'POST';
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Nie udało się połączyć. Spróbujcie ponownie.');
  return result;
}

function showStatus(message) {
  byId('status').textContent = message;
  byId('status').hidden = !message;
}

function route() {
  if (!lead) return;
  const hash = location.hash;
  const isEditorial = hash === '#edytorialna' || hash === '#pakiety';
  byId('choice').hidden = isEditorial;
  byId('editorial').hidden = !isEditorial;
  if (hash === '#pakiety') byId('pakiety').scrollIntoView();
  else window.scrollTo(0, 0);
  const title = document.querySelector(isEditorial ? '#editorial h1' : '#choice h1');
  title.tabIndex = -1;
  title.focus({ preventScroll: true });
}

async function unlock() {
  if (!access) {
    byId('entry').hidden = false;
    return;
  }
  showStatus('Otwieramy ofertę…');
  try {
    const result = await json('/api/offer-lead?access=' + encodeURIComponent(access));
    const pilot = result.lead?.editorialPilot;
    if (pilot?.id !== 'editorial-p1' || !Number.isFinite(pilot.essential) || !Number.isFinite(pilot.exclusive)) {
      throw new Error('Ten link nie odblokowuje pilotażowej oferty.');
    }
    lead = result.lead;
    const classic = '/oferta-portrety/?access=' + encodeURIComponent(access);
    byId('classic').href = classic;
    byId('classicCta').href = classic;
    byId('essential').textContent = money(pilot.essential);
    byId('exclusive').textContent = money(pilot.exclusive);
    showStatus('');
    route();
  } catch (error) {
    showStatus(error.message);
    byId('entry').hidden = false;
  }
}

byId('lead').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button');
  button.disabled = true;
  showStatus('Przygotowujemy ofertę…');
  try {
    const data = Object.fromEntries(new FormData(form));
    const distance = await json('/api/travel-distance?venue=' + encodeURIComponent(data.venue));
    if (distance.overLimit) throw new Error(distance.message || 'Ta lokalizacja jest poza naszym zasięgiem.');
    const result = await json('/api/lead', {
      ...data, formType: 'portraits_wedding', serviceType: 'Fotostacja ślubna',
      portraitPilot: 'editorial-p1', pricingQuote: distance.pricingQuote,
      distanceKm: distance.distanceKm, pricingTier: distance.tier,
    });
    const next = new URL(result.offerPath || '/', location.origin);
    if (next.origin !== location.origin || next.pathname !== location.pathname || !next.searchParams.has('access')) {
      throw new Error('Nie udało się odblokować pilotażu. Skontaktujcie się z nami.');
    }
    location.assign(next.href);
  } catch (error) {
    showStatus(error.message);
    button.disabled = false;
  }
});

byId('inquiry').addEventListener('submit', async event => {
  event.preventDefault();
  if (!lead) return;
  const form = event.currentTarget;
  const button = form.querySelector('button');
  const status = byId('inquiryStatus');
  const data = new FormData(form);
  const pilot = lead.editorialPilot;
  const packageName = data.get('package') === 'exclusive' ? 'Exclusive' : 'Essential';
  const amount = pilot[packageName.toLowerCase()];
  const timestamp = new Date().toISOString();
  button.disabled = true;
  status.textContent = 'Wysyłamy zapytanie…';
  try {
    const result = await json('/api/offer-lead', {
      name: lead.name, email: lead.email, weddingDate: lead.weddingDate,
      venue: lead.venue, guestsCount: lead.guestsCount, howDidYouHear: lead.howDidYouHear,
      pricingTier: lead.pricingTier, distanceKm: lead.distanceKm, resolvedLocation: lead.resolvedLocation,
      source: 'hidden_offer_portraits', eventName: 'zapytanie_o_termin',
      timestamp, eventTimestamp: timestamp, interestedOffers: ['Fotostacja portretowa'],
      inquiryMessage: [
        'Fotostacja Edytorialna · Pilotaż P1 · ' + pilot.id,
        packageName + ': ' + money(amount), 'Odbitki: ' + data.get('prints'),
        'Essential: ' + money(pilot.essential) + '; Exclusive: ' + money(pilot.exclusive),
        'Link do wyceny: ' + location.origin + location.pathname + location.search + '#edytorialna',
      ].join('\n'),
    });
    if (!result.notificationSent) throw new Error('Wysyłka nie została potwierdzona. Spróbujcie ponownie.');
    status.textContent = 'Dziękujemy! Potwierdzimy dostępność terminu mailowo.';
  } catch (error) {
    status.textContent = error.message;
    button.disabled = false;
  }
});

window.addEventListener('hashchange', route);
unlock();
