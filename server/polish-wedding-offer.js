import { ENGLISH_WEDDING_TIERS } from './english-wedding-offer.js';

export const POLISH_WEDDING_TIERS = ENGLISH_WEDDING_TIERS.map((tier, index) => Object.freeze({
  ...tier,
  slug: `oferta-${[150, 250, 350][index]}`,
  distanceLabel: ['Dla sal do 150 km od Gliwic', 'Dla sal oddalonych o 150–250 km od Gliwic', 'Dla sal oddalonych o 250–350 km od Gliwic'][index],
}));

function contactFields() {
  return `<div class="polish-contact-grid">
    <label class="text-label"><span>Imię</span><input name="name" autocomplete="name" required></label>
    <label class="text-label"><span>Adres e-mail</span><input name="email" type="email" autocomplete="email" required></label>
    <label class="text-label"><span>Data ślubu</span><input name="weddingDate" type="date" required></label>
    <label class="text-label"><span>Miejsce / nazwa sali</span><input name="venue" autocomplete="organization" placeholder="Nazwa sali i miejscowość" required></label>
    <label class="text-label"><span>Szacunkowa liczba gości</span><input name="guestsCount" type="number" min="1" placeholder="np. 120"></label>
    <label class="text-label"><span>Skąd dowiedzieliście się o nas?</span><select name="howDidYouHear"><option value="">Wybierzcie opcję (opcjonalnie)</option><option>Instagram</option><option>Reklama na Instagramie</option><option>TikTok</option><option>Polecenie</option><option>Strona WWW</option><option>Inne</option></select></label>
  </div>`;
}

export function renderPolishWeddingOffer(source, tier) {
  let html = source
    .replace(/<header class="hero">[\s\S]*?<\/header>/, '')
    .replace('<body>', `<body class="offer-open polish-offer" data-pricing-tier="${tier.tier}" data-essential="${tier.essential}" data-exclusive="${tier.exclusive}">`)
    .replace('<main id="offerContent" class="offer is-hidden" aria-hidden="true">', '<main id="offerContent" class="offer">')
    .replaceAll(' reveal"', ' reveal is-visible"')
    .replaceAll('./assets/', '/oferta-portrety/assets/')
    .replace('<link rel="stylesheet" href="./styles.css" />', '<link rel="stylesheet" href="/oferta-portrety/styles.css" /><link rel="stylesheet" href="/offer-pl/styles.css?v=2" />')
    .replace('<script src="./script.js" defer></script>', '<script src="/offer-pl/script.js?v=1" defer></script>')
    .replace(/Wysłaliśmy link do tej strony[\s\S]*?<strong>Oferty<\/strong>\./, 'Poniżej znajdziecie pełną ofertę i ceny. Gdy zdecydujecie się na Fotostację, dajcie nam znać — sprawdzimy Waszą datę i potwierdzimy dostępność terminu.')
    .replace(/<a\b[^>]*data-pdf-link[^>]*>[\s\S]*?<\/a>/g, '')
    .replace(/(<form id="inquiryForm"[^>]*>)/, `$1${contactFields()}`)
    .replace(/(<form id="rejectForm"[^>]*>)/, `$1${contactFields()}`)
    .replace('Możecie zaznaczyć pakiet oraz dowolne dodatki. Do maila dołączymy wszystkie dane z formularza.', 'Podajcie dane ślubu, zaznaczcie pakiet oraz dowolne dodatki. Otrzymamy Wasze zapytanie i potwierdzimy dostępność terminu mailowo.')
    .replace('Wyślij odpowiedź</button>', 'Przekaż opinię mailem</button>');

  const landscapePhotos = new Set(['fs4tc-28', 'dv8gj-137', 'ukkup-223', 'z65cg-23', 'tygge-114', 'usuvk-10', 'fenaq-172', 'fs4tc-377', 'fs4tc-21', 'fenaq-152', 'tygge-147', 'fs4tc-131']);
  html = html.replace(/<img\b[^>]*src="\/oferta-portrety\/assets\/mosaic\/([^"/]+)\.webp"[^>]*>/g, (tag, name) => {
    if (/\bwidth=/.test(tag)) return tag;
    const width = landscapePhotos.has(name) ? 1280 : 853;
    const height = landscapePhotos.has(name) ? 853 : 1280;
    return tag.replace(/\s*\/?>(?:$)/, ` width="${width}" height="${height}">`);
  });

  for (const [name, label] of [['essential', 'Essential'], ['exclusive', 'Exclusive']]) {
    const amount = tier[name];
    const formatted = `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} zł`;
    html = html.replace(new RegExp(`(data-package-price="${name}">)[^<]+`), `$1${formatted}`);
    html = html.replace(new RegExp(`(<input data-package-option="${name}"[^>]*value=")[^"]+("[^>]*\\/>\\s*<span>)[^<]+`), `$1Fotostacja ${label} - ${amount} zł$2Fotostacja ${label} — ${formatted}`);
  }
  html = html.replace(/(<p class="price" data-package-price="[^"]+">[^<]+<\/p>)/g, '$1<p class="transport-price-note">+ koszt transportu <a href="#transport-rate">(zobacz stawkę w dodatkowych opcjach poniżej)</a></p>');
  html = html.replace('<article><span>Transport od Gliwic</span>', '<article id="transport-rate"><span>Transport od Gliwic</span>');
  html = html.replace('<p>Oba pakiety obejmują profesjonalne stanowisko, dwóch fotografów i 3 godziny pracy.</p>', `<p>Oba pakiety obejmują profesjonalne stanowisko, dwóch fotografów i 3 godziny pracy.</p><p class="polish-tier-label">${tier.distanceLabel}</p>`);
  html = html.replace(/(<p class="internet-note">[\s\S]*?<\/p>)/, '$1<p class="internet-note">Kwota netto = brutto. Wystawiamy fakturę ze zwolnieniem z VAT.</p>');
  return html.replace(/[ \t]+$/gm, '');
}

export function localizeOfferScript(script) {
  const translations = {
    'Please enter your name.': 'Podajcie proszę imię.',
    'Please enter a valid email address.': 'Podajcie poprawny adres e-mail.',
    'Please choose your wedding date.': 'Wybierzcie datę ślubu.',
    'Please enter your venue and location.': 'Podajcie nazwę sali i miejscowość.',
    'Please choose at least one package or extra.': 'Zaznaczcie przynajmniej jeden pakiet lub dodatek.',
    'Sending your enquiry…': 'Wysyłamy zapytanie…',
    'English offer:': 'Polska oferta:',
    'Thank you! We will reply by email to confirm availability for your date.': 'Dziękujemy! Odezwiemy się mailowo, żeby potwierdzić dostępność terminu.',
    'Enquiry sent': 'Zapytanie wysłane',
    'We could not send your enquiry. Please try again or email kontakt@sobotkiweddings.pl.': 'Nie udało się wysłać zapytania. Spróbujcie ponownie lub napiszcie na kontakt@sobotkiweddings.pl.',
    'Send availability enquiry': 'Wyślij zapytanie o termin',
    'Share feedback by email': 'Przekaż opinię mailem',
    'Please choose a reason.': 'Wybierzcie proszę powód.',
    'Wedding Photo Station — offer feedback': 'Fotostacja ślubna — opinia o ofercie',
    'Your email app will open with your feedback. Send the message there to share it with us.': 'Otworzy się Wasza aplikacja pocztowa z przygotowaną opinią. Wyślijcie w niej wiadomość, żeby do nas dotarła.',
    'Name: ${contact.name}': 'Imię: ${contact.name}',
    'Wedding: ${contact.weddingDate}': 'Data ślubu: ${contact.weddingDate}',
    'Venue: ${contact.venue}': 'Miejsce: ${contact.venue}',
    'Reason: ${reason}': 'Powód: ${reason}',
    'Offer: ${window.location.origin}': 'Oferta: ${window.location.origin}',
  };
  let localized = script;
  for (const [from, to] of Object.entries(translations)) {
    if (!localized.includes(from)) throw new Error(`Missing source text: ${from}`);
    localized = localized.replaceAll(from, to);
  }
  return localized;
}
