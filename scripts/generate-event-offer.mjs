import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { EVENT_TIERS } from '../public/event-21aa/pricing.js';

const root = new URL('../', import.meta.url);
const directory = new URL('public/event-21aa/', root);
await mkdir(directory, { recursive: true });
const target = new URL('index.html', directory);
try {
  const existing = await readFile(target, 'utf8');
  if (existing.includes('data-offer-version=')) throw new Error('Published event V1 is frozen. Create a new opaque URL for a revised offer.');
} catch (error) { if (error.code !== 'ENOENT') throw error; }
let html = await readFile(new URL('public/oferta-150/index.html', root), 'utf8');

function section(marker, replacement) {
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<section class="[^"]*${escaped}[^"]*"[^>]*>[\\s\\S]*?<\\/section>`);
  if (!pattern.test(html)) throw new Error(`Missing section: ${marker}`);
  html = html.replace(pattern, replacement);
}

html = html
  .replace(/data-offer-version="[^"]*" data-offer-snapshot="[^"]*" data-offer-archive="[^"]*"/, 'data-offer-version="V1" data-offer-snapshot="event-21aa" data-offer-archive="/event-21aa/"')
  .replace(/ data-pricing-tier="[^"]*" data-essential="[^"]*" data-exclusive="[^"]*"/, '')
  .replace('class="offer-open polish-offer"', 'class="offer-open polish-offer event-offer"')
  .replace('</head>', '<link rel="stylesheet" href="/event-21aa/styles.css" /></head>')
  .replace('<script src="/offers/v1/pl.js" defer></script>', '<script src="/event-21aa/visuals.js" defer></script><script src="/event-21aa/script.js" type="module"></script>')
  .replace('href="/portraits/wedding"', 'href="/portraits"')
  .replaceAll('Fotostacji Ślubnej 2027/2028', 'Fotostacji Eventowej')
  .replaceAll('Fotostacji Ślubnej <span class="serif-accent">2027/2028</span>', 'Fotostacji <span class="serif-accent">na Wasz event.</span>')
  .replace('Ukryta oferta Fotostacji Ślubnej Sobotki Portraits na sezon 2027/2028.', 'Fotostacja na event: portrety studyjne, druk na miejscu i galeria online. Sprawdź cenę dla liczby uczestników.')
  .replace(/Fotostacja to usługa fotografowania czarno-białych portretów ślubnych,[\s\S]*?To elegancka/, 'Fotostacja to mobilne studio czarno-białych portretów na eventy firmowe, gale i spotkania zespołów. W centrum uwagi są uczestnicy Waszego wydarzenia. To elegancka')
  .replace('Zdjęcia z wesel', 'Portrety z naszych realizacji')
  .replace('Pary młode, rodzina, przyjaciele. Wszystkie portrety poniżej powstały na weselach, przy naszej Fotostacji.', 'Solo, w parach, z całym zespołem. Zobaczcie styl naszych portretów — takie mobilne studio możemy stworzyć na Waszym evencie.')
  .replace('sprawdzimy Waszą datę i potwierdzimy dostępność terminu.\n          </p>', 'sprawdzimy Waszą datę i potwierdzimy dostępność terminu.\n          </p><a class="button button-secondary" href="#wycena">Sprawdźcie cenę dla Waszego eventu ↓</a>')
  .replace('W cenie pakietów Essential i Exclusive.', 'Galeria online i dostęp przez kod QR — w cenie pakietu eventowego.');

section('process-section', `<section class="section process-section reveal is-visible" aria-labelledby="process-title">
  <div class="section-heading"><p class="eyebrow">Od portretu do odbitki</p><h2 id="process-title">Studio na <span class="serif-accent">Waszym evencie.</span></h2></div>
  <div class="process-grid">
    <article><span class="number">01</span><h3>Zespół fotografów</h3><p>Pomagamy w pozowaniu, fotografujemy, obrabiamy i drukujemy na miejscu. Do 400 uczestników pracuje 2 fotografów, a powyżej 400 — 3 fotografów w cenie pakietu.</p></article>
    <article><span class="number">02</span><h3>200 odbitek w cenie</h3><p>Profesjonalne portrety i odbitki 10×15 cm gotowe w kilka minut. Każda odbitka ponad 200 kosztuje 1,75 zł — rozliczamy faktyczny dodatkowy wydruk.</p></article>
    <article><span class="number">03</span><h3>Zdjęcia na telefonie</h3><p>Uczestnicy skanują kod QR i otwierają galerię online. Mogą od razu pobrać swoje zdjęcia, bez instalowania aplikacji. Liczba zdjęć cyfrowych nie jest limitowana.</p></article>
  </div></section>`);

section('pricing-section', `<section id="wycena" class="section pricing-section reveal is-visible" aria-labelledby="pricing-title">
  <div class="section-heading"><p class="eyebrow">Przejrzysta wycena</p><h2 id="pricing-title">Ile osób, <span class="serif-accent">taki pakiet.</span></h2><p>Wybierzcie liczbę uczestników. Cena obejmuje 3 godziny pracy, studio, zespół fotografów, galerię online i 200 odbitek.</p></div>
  <div class="event-calculator">
    <div class="event-controls">
      <div class="event-guests-label"><label for="eventGuests">Liczba uczestników</label><input id="eventGuests" type="number" value="90" min="20" max="100000" step="1" inputmode="numeric"></div>
      <label class="sr-only" for="eventGuestsSlider">Przesuń, aby wybrać liczbę uczestników</label>
      <input id="eventGuestsSlider" class="event-range" type="range" min="20" max="500" step="1" value="90" aria-describedby="sliderHint">
      <p id="sliderHint" class="event-muted">20 osób <span>500 osób</span></p><p class="event-fine">Większy event? Liczbę powyżej 500 wpiszcie w polu obok suwaka.</p>
      <div class="event-mobile-total"><span>Razem bez transportu</span><strong id="eventMobileTotal">3 500 zł</strong></div>
      <div class="event-tier-list" aria-label="Progi cenowe">${EVENT_TIERS.map((tier, index) => `<div data-event-tier="${index}"><span>${tier.label}</span><strong>${tier.price.toLocaleString('pl-PL')} zł</strong></div>`).join('')}</div>
      <fieldset class="event-options"><legend>Opcjonalne dodatki</legend>
        <label><input id="eventFilm" type="checkbox"><span>Filmowe kółko</span><strong>+300 zł</strong></label>
        <label><input id="eventBook" type="checkbox"><span>Drukowana księga gości</span><strong>+600 zł</strong></label>
        <label><input id="eventHour" type="checkbox"><span>Dodatkowa godzina · łącznie 4h</span><strong>+500 zł</strong></label>
      </fieldset>
      <label class="event-print-input" for="eventPrints">Planowane dodatkowe odbitki ponad 200 <input id="eventPrints" type="number" min="0" max="100000" step="1" value="0" inputmode="numeric"></label>
      <p class="event-fine">Opcjonalna symulacja: 1,75 zł/szt. Ostateczne rozliczenie według faktycznej liczby dodatkowych odbitek.</p>
    </div>
    <div class="event-summary" aria-live="polite" aria-atomic="true">
      <p class="eyebrow">Wasza Fotostacja</p><p id="eventTierLabel">61–150 osób</p>
      <p class="price" id="eventTotal">3 500 zł</p><p class="event-total-caption">Razem bez transportu</p>
      <dl class="event-breakdown"><div><dt>Pakiet podstawowy</dt><dd id="eventBase">3 500 zł</dd></div><div><dt>Wybrane dodatki</dt><dd id="eventExtras">0 zł</dd></div><div><dt>Planowane dodatkowe odbitki</dt><dd id="eventPrintCost">0 zł</dd></div></dl>
      <ul><li id="eventHours">3 godziny pracy</li><li id="eventTeam">2 fotografów na miejscu</li><li>200 odbitek 10×15 cm w cenie</li><li>Nielimitowana liczba zdjęć cyfrowych</li><li>Galeria online i kod QR dla uczestników*</li><li>Przygotowanie stanowiska poza czasem pakietu</li></ul>
      <p id="eventHourSuggestion" class="event-hour-suggestion" hidden>Powyżej 250 uczestników sugerujemy dodatkową godzinę: 4h zamiast 3h (+500 zł). To opcja, nie automatyczna dopłata.</p>
      <p class="event-transport">+ transport <strong>1 zł/km od Gliwic</strong>. Koszt transportu potwierdzimy po otrzymaniu lokalizacji; nie jest wliczony w sumę powyżej.</p>
      <p class="event-fine">Kwota netto = brutto. Wystawiamy fakturę ze zwolnieniem z VAT.</p>
      <a class="button button-reserve" href="#cta-title">Zapytajcie o dostępność terminu ↓</a>
    </div>
  </div><p id="eventPriceError" role="alert"></p><p class="internet-note">*Dostęp do galerii na miejscu zależy od zasięgu i prędkości internetu w obiekcie.</p>
</section>`);

html = html.replace('+600 zł w pakiecie Essential, w cenie pakietu Exclusive', '+600 zł · opcjonalnie, poza ceną pakietu eventowego')
  .replace('+500 zł w pakiecie Essential, w cenie pakietu Exclusive', '+300 zł · opcjonalnie, poza ceną pakietu eventowego')
  .replace('Życzenia powstają na iPadzie', 'Wpisy powstają na iPadzie');
html = html.replace(/<div class="addons-list">[\s\S]*?<\/div>/, `<div class="addons-list">
  <article><span>Filmowe kółko · opcja dodatkowa</span><strong>+300 zł</strong></article>
  <article><span>Drukowana księga gości 30×30 cm · opcja dodatkowa</span><strong>+600 zł</strong></article>
  <article><span>Dodatkowa godzina pracy · pakiet 4h</span><strong>+500 zł</strong></article>
  <article><span>Każda odbitka ponad 200 w pakiecie</span><strong>1,75 zł/szt.</strong></article>
  <article id="transport-rate"><span>Transport od Gliwic · poza ceną pakietu</span><strong>1 zł/km</strong></article></div>`);
section('alert-section', '');
html = html.replace(/<div class="faq-list">[\s\S]*?<\/div>/, `<div class="faq-list">
  <details><summary>Czy Fotostacja zastępuje reportaż z eventu?</summary><p>Nie. To dodatkowa atrakcja portretowa w wydzielonym miejscu. Fotograf reportażowy może równolegle dokumentować przebieg wydarzenia.</p></details>
  <details><summary>Co dokładnie obejmuje cena?</summary><p>3 godziny pracy (bez przygotowania stanowiska), mobilne studio i oświetlenie, 2 fotografów do 400 uczestników lub 3 powyżej 400, 200 odbitek 10×15 cm oraz zdjęcia cyfrowe w galerii online. Transport i wybrane dodatki rozliczamy osobno.</p></details>
  <details><summary>Jak rozliczacie odbitki?</summary><p>Pierwsze 200 odbitek jest w cenie. Każda kolejna to 1,75 zł/szt. Rozliczamy faktycznie wydrukowane dodatkowe odbitki, nie liczbę uczestników ani pobranych plików.</p></details>
  <details><summary>Kiedy warto wydłużyć pakiet do 4 godzin?</summary><p>Przy więcej niż 250 uczestnikach sugerujemy dodatkową godzinę za 500 zł. Pakiet podstawowy nadal trwa 3 godziny — wydłużenie jest opcjonalne i zależy od Waszej decyzji.</p></details>
  <details><summary>Czy filmowe kółko i księga gości są w cenie?</summary><p>Nie. Filmowe kółko kosztuje dodatkowo 300 zł, a drukowana księga gości 600 zł. Filmowe portrety wykonujemy w ramach wybranego czasu pracy; zmiana oświetlenia zajmuje około 10 minut.</p></details>
  <details><summary>Jak szybko uczestnicy otrzymują zdjęcia?</summary><p>Obrabiamy i drukujemy na miejscu, zwykle w kilka minut. Galeria przez kod QR aktualizuje się w trakcie wydarzenia, o ile internet w obiekcie pozwala na przesyłanie plików.</p></details>
  <details><summary>Ile miejsca potrzebujecie i skąd dojeżdżacie?</summary><p>Potrzebujemy minimum 4×4 m wolnej przestrzeni i gniazdka z prądem. Dojeżdżamy z Gliwic; transport kosztuje 1 zł/km. Prześlijcie lokalizację — potwierdzimy możliwość dojazdu i jego koszt.</p></details></div>`);
html = html.replace(/<div class="rejection-box">[\s\S]*?<\/form>\s*<\/div>/, '');
html = html.replace(/<fieldset>\s*<legend>Wybierzcie interesujące elementy<\/legend>[\s\S]*?<\/fieldset>/, '<p id="eventInquiryQuote" class="event-inquiry-quote"></p>');
html = html.replace(/<label class="text-label"><span>Szacunkowa liczba gości<\/span>[\s\S]*?<\/label>/g, '');
html = html.replace(/(<\/main>)/, '<footer class="event-version">Sobotki Portraits · Oferta eventowa · Wersja V1 · 17.10.2026</footer>$1');

const replacements = [
  ['portretów ślubnych', 'portretów eventowych'], ['Portret ślubny', 'Portret eventowy'],
  ['parą młodą', 'uczestnikami eventu'], ['pary młodej', 'uczestników eventu'], ['Para młoda', 'Uczestnicy eventu'], ['para młoda', 'uczestnicy eventu'],
  ['Panna młoda i przyjaciółki', 'Grupa uczestniczek'], ['Panna młoda z kwiatem', 'Portret z kwiatem'], ['panny młodej', 'uczestniczki'], ['pana młodego', 'uczestnika'], ['Pan młody', 'Uczestnik'],
  ['weselnego', 'wydarzenia'], ['weselnych', 'eventowych'], ['weselna', 'eventowa'], ['weselny', 'eventowy'], ['weselne', 'eventowe'],
  ['z wesela', 'z wydarzenia'], ['po weselu', 'po evencie'], ['wesela', 'eventu'],
  ['Data ślubu', 'Data eventu'], ['dane ślubu, zaznaczcie pakiet oraz dowolne dodatki', 'dane eventu — do zapytania dołączymy wycenę i dodatki wybrane w kalkulatorze'],
  ['Waszym ślubie', 'Waszym evencie'], ['klimat wesela', 'charakter wydarzenia'],
  ['Waszego przyjęcia', 'Waszego eventu'], ['przyjęcia weselnego', 'wydarzenia'], ['przyjęcia', 'eventu'], ['przyjęciu', 'evencie'],
  ['dojeżdżamy na przyjęcia do ok. 300 km od Gliwic.', 'możliwość dojazdu i jego koszt potwierdzimy dla lokalizacji Waszego eventu.'],
];
for (const [from, to] of replacements) html = html.replaceAll(from, to);
if (/ślub|wesel|młod|Essential|Exclusive/i.test(html)) throw new Error('Wedding-only copy remains in the event offer.');
await writeFile(target, html);
// Copy the generic, immutable gallery/video/hero behaviour, not wedding form code.
const visuals = (await readFile(new URL('public/offers/v1/pl.js', root), 'utf8')).split('const reserve =')[0];
await writeFile(new URL('visuals.js', directory), `${visuals}\ninitMosaic();\ninitVideos();\ninitHero();\n`);
console.log('Generated /event-21aa/');
