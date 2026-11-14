const byId = id => document.getElementById(id);
const access = new URLSearchParams(location.search).get('access');
const money = value => value.toLocaleString('pl-PL') + ' zł';
let lead;
const COLOR_PRICE = 300;
const editorialAvailable = () => {
  const count = Number(lead?.guestsCount);
  return Number.isSafeInteger(count) && count >= 1 && count <= 120;
};

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
  const isEditorial = editorialAvailable() && (hash === '#edytorialna' || hash === '#pakiety');
  byId('choice').hidden = isEditorial;
  byId('editorial').hidden = !isEditorial;
  if (isEditorial && hash === '#pakiety') byId('pakiety').scrollIntoView();
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
    byId('editorialCta').hidden = !editorialAvailable();
    byId('editorialUnavailable').hidden = editorialAvailable();
    if (!editorialAvailable()) {
      byId('editorialCover').removeAttribute('href');
      byId('editorialCover').removeAttribute('aria-label');
    }
    updateInquiry();
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

const inquiry = byId('inquiry');
const printLimits = { essential: { '15x20': 100, '10x15': 200 }, exclusive: { '15x20': 200, '10x15': 400 } };
const printLabel = (packageKey, format) =>
  'Do ' + printLimits[packageKey][format] + ' odbitek ' + format.replace('x', ' × ') + ' cm';
function updateInquiry() {
  if (!lead) return;
  const exclusive = inquiry.elements.package.value === 'exclusive';
  const packageKey = exclusive ? 'exclusive' : 'essential';
  for (const option of inquiry.elements.prints.options) {
    option.textContent = printLabel(packageKey, option.value);
  }
  byId('colorOption').hidden = exclusive;
  inquiry.elements.color.disabled = exclusive;
  const total = lead.editorialPilot[exclusive ? 'exclusive' : 'essential'] +
    (!exclusive && inquiry.elements.color.checked ? COLOR_PRICE : 0);
  byId('inquiryTotal').textContent = 'Razem przed kosztem transportu: ' + money(total);
}
inquiry.addEventListener('change', updateInquiry);
inquiry.addEventListener('submit', async event => {
  event.preventDefault();
  if (!editorialAvailable()) return;
  const form = event.currentTarget;
  const button = form.querySelector('button');
  const status = byId('inquiryStatus');
  const data = new FormData(form);
  const pilot = lead.editorialPilot;
  const packageName = data.get('package') === 'exclusive' ? 'Exclusive' : 'Essential';
  const amount = pilot[packageName.toLowerCase()];
  const hasColorAddon = packageName === 'Essential' && data.has('color');
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
        packageName + ': ' + money(amount), 'Odbitki: ' + printLabel(packageName.toLowerCase(), data.get('prints')),
        'Kolor cyfrowy: ' + (packageName === 'Exclusive' ? 'w cenie' : hasColorAddon ? '+300 zł' : 'nie wybrano'),
        'Razem bez transportu: ' + money(amount + (hasColorAddon ? COLOR_PRICE : 0)),
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

const motion = matchMedia('(prefers-reduced-motion: reduce)');
const mosaic = byId('editorialMosaic');
const viewport = mosaic.parentElement;
const tiles = Array.from(mosaic.children);
const copies = tiles.map(tile => {
  const copy = tile.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  copy.classList.add('mosaic-loop-copy');
  copy.firstElementChild.alt = '';
  copy.hidden = true;
  mosaic.append(copy);
  return copy;
});

function layoutMosaic() {
  const width = mosaic.clientWidth;
  if (!width) return;
  const columns = width < 560 ? 3 : width < 900 ? 4 : 6;
  const gap = width < 560 ? 10 : width < 900 ? 14 : 18;
  const unit = (width - (columns - 1) * gap) / columns;
  const bottoms = Array(columns).fill(0);
  const positions = tiles.map(tile => {
    const span = tile.hasAttribute('data-large') ? 2 : 1;
    const w = unit * span + gap * (span - 1);
    const image = tile.firstElementChild;
    const h = w * Number(image.getAttribute('height')) / Number(image.getAttribute('width'));
    let column = 0, top = Infinity;
    for (let i = 0; i <= columns - span; i++) {
      const candidate = Math.max(...bottoms.slice(i, i + span));
      if (candidate < top) { column = i; top = candidate; }
    }
    bottoms.fill(top + h + gap, column, column + span);
    return { x: column * (unit + gap), top, w, h };
  });
  const cycle = Math.max(...bottoms);
  const place = (tile, p, offset = 0) => Object.assign(tile.style, {
    left: p.x + 'px', top: p.top + offset + 'px', width: p.w + 'px', height: p.h + 'px',
  });
  tiles.forEach((tile, i) => place(tile, positions[i]));
  copies.forEach((tile, i) => {
    place(tile, positions[i], cycle);
    tile.hidden = motion.matches;
  });
  mosaic.style.height = cycle * (motion.matches ? 1 : 2) - gap + 'px';
  mosaic.style.setProperty('--mosaic-loop-distance', cycle + 'px');
  mosaic.style.setProperty('--mosaic-loop-duration', cycle / 32 + 's');
  mosaic.classList.add('mosaic-ready');
  viewport.classList.toggle('is-looping', !motion.matches);
}
let lastMosaicWidth = 0;
new ResizeObserver(() => {
  const width = mosaic.clientWidth;
  if (width && width !== lastMosaicWidth) layoutMosaic();
  lastMosaicWidth = width;
}).observe(mosaic);
motion.addEventListener('change', layoutMosaic);

const phone = byId('editorialPhone');
const phoneToggle = byId('phoneToggle');
let phoneVisible = false;
let manualPlayback = null;
function syncPhone() {
  const shouldPlay = phoneVisible && !document.hidden && (manualPlayback ?? !motion.matches);
  if (shouldPlay) phone.play().catch(() => {});
  else phone.pause();
}
new IntersectionObserver(([entry]) => {
  phoneVisible = entry.isIntersecting && entry.intersectionRatio >= .15;
  syncPhone();
}, { threshold: .15 }).observe(phone);
phoneToggle.addEventListener('click', () => {
  manualPlayback = phone.paused;
  if (manualPlayback) phone.play().catch(() => {});
  else phone.pause();
});
phone.addEventListener('play', () => { phoneToggle.textContent = 'Wstrzymaj podgląd'; });
phone.addEventListener('pause', () => { phoneToggle.textContent = 'Odtwórz podgląd'; });
document.addEventListener('visibilitychange', syncPhone);
motion.addEventListener('change', syncPhone);

unlock();
