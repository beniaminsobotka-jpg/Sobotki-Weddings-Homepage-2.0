const assets = '/oferta-portrety/assets/mosaic/';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function initMosaic() {
  const gallery = document.querySelector('#portraitGallery');
  const viewport = gallery.closest('.portrait-gallery-viewport');
  const figures = [...gallery.children];
  const images = figures.map((figure) => figure.querySelector('img'));
  const largerPhotos = new Set([0, 1, 11, 19, 22]);
  const copies = figures.map((figure) => {
    const copy = figure.cloneNode(true);
    copy.classList.add('mosaic-loop-copy');
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelector('img').alt = '';
    gallery.append(copy);
    return copy;
  });

  function layout() {
    viewport.classList.remove('is-looping');
    const width = gallery.clientWidth;
    const columns = width < 560 ? 3 : width < 900 ? 4 : 6;
    const gap = width < 560 ? 10 : width < 900 ? 14 : 18;
    const unitWidth = (width - gap * (columns - 1)) / columns;
    const bottoms = Array(columns).fill(0);
    const positions = [];
    figures.forEach((figure, index) => {
      const image = images[index];
      const span = largerPhotos.has(index) ? 2 : 1;
      const tileWidth = unitWidth * span + gap * (span - 1);
      const ratio = Number(image.getAttribute('height')) / Number(image.getAttribute('width'));
      const tileHeight = tileWidth * ratio;
      let column = 0;
      let top = Infinity;
      for (let start = 0; start <= columns - span; start += 1) {
        const candidate = Math.max(...bottoms.slice(start, start + span));
        if (candidate < top) { top = candidate; column = start; }
      }
      Object.assign(figure.style, { left: `${column * (unitWidth + gap)}px`, top: `${top}px`, width: `${tileWidth}px`, height: `${tileHeight}px` });
      positions.push({ left: figure.style.left, top, width: figure.style.width, height: figure.style.height });
      for (let i = column; i < column + span; i += 1) bottoms[i] = top + tileHeight + gap;
    });
    const cycleHeight = Math.max(...bottoms);
    copies.forEach((copy, index) => {
      const position = positions[index];
      Object.assign(copy.style, { left: position.left, top: `${position.top + cycleHeight}px`, width: position.width, height: position.height });
      copy.hidden = reducedMotion.matches;
    });
    gallery.style.height = `${cycleHeight * (reducedMotion.matches ? 1 : 2) - gap}px`;
    gallery.style.setProperty('--mosaic-loop-distance', `${cycleHeight}px`);
    gallery.style.setProperty('--mosaic-loop-duration', `${cycleHeight / 32}s`);
    gallery.classList.add('mosaic-ready');
    viewport.classList.toggle('is-looping', !reducedMotion.matches);
  }
  layout();
  window.addEventListener('resize', layout, { passive: true });
  reducedMotion.addEventListener('change', layout);
}

function initVideos() {
  document.querySelectorAll('video').forEach((video) => {
    let visible = false;
    const sync = () => {
      if (!visible || document.hidden || reducedMotion.matches) video.pause();
      else video.play().catch(() => {});
    };
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0.15 }).observe(video);
    document.addEventListener('visibilitychange', sync);
    reducedMotion.addEventListener('change', sync);
    sync();
  });
}

function initHero() {
  const hero = document.querySelector('.offer-intro');
  const slides = [...hero.querySelectorAll('.offer-intro-slide')];
  const photoNames = window.matchMedia('(max-width:600px)').matches
    ? ['fs4tc-21', 'dv8gj-93', '6qmvn-211', 'fs4tc-186', 'fs4tc-230', 'fs4tc-327']
    : ['fs4tc-21', 'fenaq-152', 'dv8gj-137', 'tygge-114', 'usuvk-10', 'fenaq-172'];
  let visible = false;
  let active = 0;
  let current = 0;
  let switching = false;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.1 }).observe(hero);
  Promise.all(photoNames.map(async (name) => {
    const image = new Image();
    image.src = `${assets}${name}.webp`;
    return image.decode().then(() => image.src).catch(() => null);
  })).then((loaded) => {
    const urls = loaded.filter(Boolean);
    if (urls.length < 2) return;
    window.setInterval(async () => {
      if (!visible || document.hidden || reducedMotion.matches || switching) return;
      switching = true;
      const next = (current + 1) % urls.length;
      const target = 1 - active;
      slides[target].src = urls[next];
      try {
        await slides[target].decode();
        slides[active].classList.remove('is-active');
        slides[target].classList.add('is-active');
        active = target;
        current = next;
      } catch { /* Keep the currently displayed photo if a replacement cannot load. */ }
      switching = false;
    }, 500);
  });
}

const reserve = document.querySelector('#reserveCta');
const modal = document.querySelector('#inquiryModal');
const inquiryForm = document.querySelector('#inquiryForm');
const inquiryError = document.querySelector('#inquiryError');
const ctaStatus = document.querySelector('#ctaStatus');

function closeModal() {
  modal.classList.add('is-hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  reserve.focus();
}

reserve.addEventListener('click', () => {
  modal.classList.remove('is-hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  inquiryForm.querySelector('input').focus();
});
document.querySelectorAll('[data-close-inquiry-modal]').forEach((button) => button.addEventListener('click', closeModal));
document.addEventListener('keydown', (event) => {
  if (modal.classList.contains('is-hidden')) return;
  if (event.key === 'Escape') closeModal();
  if (event.key !== 'Tab') return;
  const focusable = [...modal.querySelectorAll('button,input,select,textarea,a[href]')].filter((element) => !element.disabled);
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

function getContact(form) {
  const data = new FormData(form);
  return Object.fromEntries(['name', 'email', 'weddingDate', 'venue', 'guestsCount', 'howDidYouHear'].map((key) => [key, String(data.get(key) || '').trim()]));
}

function validateContact(contact) {
  if (!contact.name) return 'Please enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) return 'Please enter a valid email address.';
  if (!contact.weddingDate) return 'Please choose your wedding date.';
  if (!contact.venue) return 'Please enter your venue and location.';
  return '';
}

inquiryForm.noValidate = true;
inquiryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const contact = getContact(inquiryForm);
  const selected = new FormData(inquiryForm).getAll('interestedOffers');
  inquiryError.textContent = validateContact(contact) || (selected.length ? '' : 'Please choose at least one package or extra.');
  if (inquiryError.textContent) return;
  const button = inquiryForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Sending your enquiry…';
  const timestamp = new Date().toISOString();
  const note = String(new FormData(inquiryForm).get('inquiryMessage') || '').trim();
  try {
    const response = await fetch('/api/offer-lead', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        ...contact, source: 'hidden_offer_portraits', eventName: 'zapytanie_o_termin', timestamp, eventTimestamp: timestamp,
        pricingTier: document.body.dataset.pricingTier, interestedOffers: selected,
        inquiryMessage: `${note}\n\nEnglish offer: ${window.location.origin}${window.location.pathname}\nEssential: PLN ${document.body.dataset.essential}\nExclusive: PLN ${document.body.dataset.exclusive}`,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.notificationSent) throw new Error('Notification not confirmed');
    ctaStatus.textContent = 'Thank you! We will reply by email to confirm availability for your date.';
    closeModal();
    reserve.textContent = 'Enquiry sent';
    reserve.disabled = true;
  } catch (error) {
    console.warn('Availability enquiry failed', error);
    inquiryError.textContent = 'We could not send your enquiry. Please try again or email kontakt@sobotkiweddings.pl.';
    button.disabled = false;
    button.textContent = 'Send availability enquiry';
  }
});

const feedbackToggle = document.querySelector('#showRejectSurvey');
const feedbackForm = document.querySelector('#rejectForm');
const feedbackStatus = document.querySelector('#rejectStatus');
feedbackForm.noValidate = true;
feedbackForm.querySelector('button[type="submit"]').textContent = 'Share feedback by email';
feedbackToggle.addEventListener('click', () => {
  const hidden = feedbackForm.classList.toggle('is-hidden');
  feedbackForm.setAttribute('aria-hidden', String(hidden));
  feedbackToggle.setAttribute('aria-expanded', String(!hidden));
});
feedbackForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const contact = getContact(feedbackForm);
  const selected = feedbackForm.querySelector('input[name="reason"]:checked');
  feedbackStatus.textContent = validateContact(contact) || (selected ? '' : 'Please choose a reason.');
  if (feedbackStatus.textContent) return;
  const reason = selected.closest('label').querySelector('span').textContent;
  const note = String(new FormData(feedbackForm).get('note') || '').trim();
  const body = `Name: ${contact.name}\nEmail: ${contact.email}\nWedding: ${contact.weddingDate}\nVenue: ${contact.venue}\nReason: ${reason}\n${note}\n\nOffer: ${window.location.origin}${window.location.pathname}`;
  window.location.href = `mailto:kontakt@sobotkiweddings.pl?subject=${encodeURIComponent('Wedding Photo Station — offer feedback')}&body=${encodeURIComponent(body)}`;
  feedbackStatus.textContent = 'Your email app will open with your feedback. Send the message there to share it with us.';
});

initMosaic();
initVideos();
initHero();
