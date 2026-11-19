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
  document.body.classList.toggle('editorial-open', isEditorial);
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
    // Remember this offer so /portraits shows "Przejdź do oferty" instead of the form (60 days).
    try {
      localStorage.setItem('sobotki_portraits_offer', JSON.stringify({ path: location.pathname + location.search, expiresAt: Date.now() + 60 * 864e5 }));
    } catch { /* Storage unavailable: the form shows again next time. */ }
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
function updateInquiry() {
  if (!lead) return;
  const exclusive = inquiry.elements.package.value === 'exclusive';
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
        'Fotostacja Edytorialna · ' + pilot.id,
        packageName + ': ' + money(amount), 'Format odbitek: do wyboru w ankiecie przed weselem',
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
const editionRow = document.querySelector('.edition-pair');
const editionImages = [...editionRow.querySelectorAll('img')];
const editionPause = byId('editionPause');
const editionOrder = ['01', '05', '03', '06', '07'];
let editionVisible = false;
let editionIndex = 0;
let colorOnLeft = false;
let editionLoading = false;
let editionPaused = false;
const editionCanPlay = () => editionVisible && !editionPaused && !motion.matches && !document.hidden;
new IntersectionObserver(([entry]) => { editionVisible = entry.isIntersecting; }).observe(editionRow);
const updateEditionButton = () => {
  editionPause.hidden = motion.matches;
  editionPause.textContent = editionPaused ? 'Wznów zmianę zdjęć' : 'Wstrzymaj zmianę zdjęć';
};
editionPause.addEventListener('click', () => {
  editionPaused = !editionPaused;
  updateEditionButton();
});
motion.addEventListener('change', updateEditionButton);
updateEditionButton();
setInterval(async () => {
  if (!editionCanPlay() || editionLoading) return;
  editionLoading = true;
  const next = (editionIndex + 1) % editionOrder.length;
  const id = editionOrder[next];
  const base = id === '07' ? './photos/comparison' : './photos/editions/' + id;
  const variants = colorOnLeft ? ['bw', 'color'] : ['color', 'bw'];
  try {
    const frames = await Promise.all(variants.map(async variant => {
      const image = new Image();
      image.src = base + '-' + variant + '.webp';
      await image.decode();
      return image.src;
    }));
    if (editionCanPlay()) {
      editionImages.forEach((target, index) => {
        const variant = variants[index];
        target.src = frames[index];
        target.dataset.variant = variant;
        target.alt = 'Portret ' + Number(id) + ' — ' + (variant === 'bw' ? 'czerń i biel' : 'kolor');
      });
      editionRow.dataset.pair = id;
      colorOnLeft = !colorOnLeft;
    }
  } catch { /* Keep both versions matched if an image fails to load. */ }
  finally {
    editionIndex = next;
    editionLoading = false;
  }
}, 1000);
const heroFrames = [...document.querySelectorAll('.editorial-hero-frames img')];
const heroPause = byId('heroPause');
const heroPairs = [['cover', '12'], ['11', '08'], ['04', '06'], ['02', '14'], ['05', '07']];
let heroVisible = false;
let heroPaused = false;
let heroIndex = 0;
let heroLoading = false;
const heroCanPlay = () => heroVisible && !heroPaused && !motion.matches && !document.hidden;
new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; })
  .observe(document.querySelector('.editorial-hero-frames'));
const updateHeroButton = () => {
  heroPause.hidden = motion.matches;
  heroPause.textContent = heroPaused ? 'Wznów zmianę zdjęć' : 'Wstrzymaj zmianę zdjęć';
};
heroPause.addEventListener('click', () => {
  heroPaused = !heroPaused;
  updateHeroButton();
});
motion.addEventListener('change', updateHeroButton);
updateHeroButton();
setInterval(async () => {
  if (!heroCanPlay() || heroLoading) return;
  heroLoading = true;
  const next = (heroIndex + 1) % heroPairs.length;
  try {
    const sources = await Promise.all(heroPairs[next].map(async name => {
      const img = new Image();
      img.src = './photos/' + name + '.webp';
      await img.decode();
      return img.src;
    }));
    if (heroCanPlay()) sources.forEach((src, i) => { heroFrames[i].src = src; });
  } catch { /* Keep the current pair if a new image cannot be loaded. */ }
  finally {
    heroIndex = next;
    heroLoading = false;
  }
}, 500);
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

// Style choice covers: each card cycles through its own photos, the two out of step.
document.querySelectorAll('.cover-frames').forEach((frame, index) => {
  const sources = frame.dataset.frames.split(',');
  const alt = frame.querySelector('img').alt;
  let current = 0;
  let busy = false;
  let visible = false;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(frame);
  const advance = async () => {
    if (busy || !visible || document.hidden || motion.matches || byId('choice').hidden) return;
    busy = true;
    const next = (current + 1) % sources.length;
    const image = new Image();
    image.src = sources[next];
    image.alt = alt;
    try {
      // Reveal only a decoded photo so a card never flashes empty.
      await image.decode();
      frame.append(image);
      void image.offsetWidth; // commit the hidden state first so the fade runs
      frame.querySelectorAll('img.is-active').forEach(old => old.classList.remove('is-active'));
      image.classList.add('is-active');
      setTimeout(() => frame.querySelectorAll('img').forEach(old => { if (old !== image) old.remove(); }), 900);
      current = next;
    } catch { /* Skip a photo that fails to load. */ }
    finally { busy = false; }
  };
  setTimeout(() => setInterval(advance, 1800), index * 900);
});
