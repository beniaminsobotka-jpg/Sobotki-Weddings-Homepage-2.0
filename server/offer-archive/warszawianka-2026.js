// Private, frozen offer record. It is deliberately outside /public.
// After expiry the customer route returns 410, while this archival copy remains intact.
export const warszawiankaOffer = Object.freeze({
  slug: 'warszawianka-281026-e14e2a54cd1cf6465b716933',
  issuedAt: '2026-10-14T09:45:00+02:00',
  expiresAt: '2026-10-28T08:45:00+01:00',
  eventDate: '28 października 2026',
  venue: 'Hotel Warszawianka, Jachranka',
  guests: 'około 90 osób',
  pricePln: 6500,
  durationHours: 3,
  printLimit: 400,
  filmCircleIncluded: true,
});

const imageBase = '/oferta-portrety/assets/mosaic/';
const galleryPhotos = [
  'tygge-119', 'fs4tc-95', '6qmvn-211', 'tygge-120', 'fenaq-14',
  'fs4tc-470', 'tygge-114', 'dv8gj-89', 'usuvk-10', 'fs4tc-230',
  'fenaq-172', '6qmvn-297', 'fs4tc-327', 'fs4tc-377', 'fenaq-266',
  'tygge-40', 'fenaq-152', 'tygge-147', '6qmvn-350', 'fenaq-99',
  'fs4tc-117', 'fs4tc-421', 'fenaq-387', 'fs4tc-131', 'fs4tc-419',
  'tygge-116', 'ukkup-223', 'fs4tc-28', 'dv8gj-93', 'dv8gj-137',
  'z65cg-23', 'fs4tc-186', 'fs4tc-21', 'fs4tc-366',
];
const landscapePhotos = new Set([
  'tygge-114', 'usuvk-10', 'fenaq-172', 'fs4tc-377', 'fenaq-152',
  'tygge-147', 'fs4tc-131', 'ukkup-223', 'fs4tc-28', 'dv8gj-137',
  'z65cg-23', 'fs4tc-21',
]);

function renderGalleryPhotos(duplicate = false) {
  return galleryPhotos.map((name, index) => `<img src="${imageBase}${name}.webp" width="${landscapePhotos.has(name) ? 1280 : 853}" height="${landscapePhotos.has(name) ? 853 : 1280}" alt="${duplicate ? '' : `Przykładowy portret z Fotostacji ${index + 1}`}" loading="lazy" decoding="async">`).join('');
}

export function renderWarszawiankaOffer(offer = warszawiankaOffer) {
  const subject = encodeURIComponent('Fotostacja — 28.10.2026, Hotel Warszawianka');
  const body = encodeURIComponent('Dzień dobry, chcemy porozmawiać o ofercie Fotostacji na wydarzenie firmowe 28.10.2026 w Hotelu Warszawianka.');
  const emailLink = `mailto:kontakt@sobotkiweddings.pl?subject=${subject}&body=${body}`;

  return `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <meta name="theme-color" content="#f4f2ef">
  <title>Oferta firmowa · Hotel Warszawianka · Sobotki Portraits</title>
  <meta name="description" content="Indywidualna oferta Fotostacji na wydarzenie firmowe 28 października 2026 w Hotelu Warszawianka.">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;1,500;1,700&display=swap&subset=latin,latin-ext" rel="stylesheet">
  <link rel="stylesheet" href="https://use.typekit.net/oiv8gfj.css">
  <link rel="stylesheet" href="/corporate-offer-warszawianka.css?v=3">
  <script src="/corporate-offer-warszawianka.js?v=1" defer></script>
</head>
<body>
  <header class="site-header wrap">
    <a class="brand" href="/portraits/event" aria-label="Sobotki Portraits — oferta eventowa"><span>SOBOTKI</span><small>PORTRAITS</small></a>
    <span class="private-label">Oferta indywidualna / nielistowana</span>
  </header>

  <main>
    <section class="hero wrap" aria-labelledby="offer-title">
      <div class="hero-copy">
        <p class="eyebrow">Przygotowaliśmy to dla Was</p>
        <h1 id="offer-title">PORTRETY,<br>KTÓRE <em>zostają.</em></h1>
        <p class="hero-lead">Fotostacja na wydarzenie firmowe w Hotelu Warszawianka. Profesjonalne portrety, gotowe odbitki i galeria online — doświadczenie, które uczestnicy zabiorą ze sobą.</p>
        <div class="event-meta" aria-label="Szczegóły wydarzenia">
          <div><span>Termin</span><strong>${offer.eventDate}</strong></div>
          <div><span>Miejsce</span><strong>${offer.venue}</strong></div>
          <div><span>Uczestnicy</span><strong>${offer.guests}</strong></div>
        </div>
        <a class="text-link" href="#wycena">Zobacz propozycję <span aria-hidden="true">↗</span></a>
      </div>
      <figure class="hero-image"><img src="${imageBase}fs4tc-117.webp" alt="Przykładowy czarno-biały portret wykonany w Fotostacji" width="853" height="1280" fetchpriority="high"><figcaption>Przykładowy portret z Fotostacji</figcaption></figure>
    </section>

    <section class="intro band" aria-labelledby="intro-title">
      <div class="wrap intro-grid">
        <div><p class="eyebrow">Fotostacja / event firmowy</p><h2 id="intro-title">MOBILNE STUDIO.<br><em>na Waszych zasadach.</em></h2></div>
        <div class="intro-text"><p>Na miejscu ustawiamy białe tło, oświetlenie studyjne oraz stanowisko do obróbki i druku. Fotograf prowadzi uczestników przez krótką, swobodną sesję, a gotowe zdjęcia można odebrać jeszcze podczas imprezy.</p><p>To nie jest automatyczna fotobudka. Każdy portret powstaje z udziałem fotografa — tak, aby dobrze wyglądał zarówno jako pamiątka, jak i zdjęcie do firmowej komunikacji.</p></div>
      </div>
    </section>

    <section class="scope wrap" aria-labelledby="scope-title">
      <div class="section-heading"><p class="eyebrow">Zakres w cenie</p><h2 id="scope-title">WSZYSTKO,<br>CO <em>potrzebne.</em></h2></div>
      <div class="scope-grid">
        <article><span class="scope-number">01</span><h3>3 godziny pracy</h3><p>Fotostacja dostępna dla uczestników przez trzy godziny; montaż i demontaż stanowiska poza tym czasem.</p></article>
        <article><span class="scope-number">02</span><h3>Dwuosobowa obsługa</h3><p>Fotograf pomaga w pozowaniu i wykonuje zdjęcia. Druga osoba na bieżąco obrabia portrety, drukuje i obsługuje stanowisko.</p></article>
        <article><span class="scope-number">03</span><h3>Do ${offer.printLimit} odbitek 10 × 15 cm</h3><p>Czarno-białe portrety drukowane na miejscu. Przy około 90 osobach to zapas na zdjęcia indywidualne, grupowe oraz dodatkowe odbitki dla uczestników.</p></article>
        <article><span class="scope-number">04</span><h3>Galeria online</h3><p>Zdjęcia trafiają do galerii w chmurze. Uczestnicy mogą otworzyć ją kodem QR i pobrać swoje portrety na telefon.</p></article>
        <article class="branding"><span class="scope-number">05 / BRANDING W CENIE</span><h3>Zdjęcia w identyfikacji wydarzenia</h3><p>Wybieracie jeden wariant personalizacji: ramkę graficzną nakładaną na zdjęcia, naklejkę do odbitki albo dyskretny pasek z brandingiem u dołu zdjęcia. Projekt uzgodnimy przed wydarzeniem na podstawie dostarczonego logo i materiałów marki.</p></article>
        <article><span class="scope-number">06</span><h3>Dojazd z Gliwic</h3><p>Transport zespołu i sprzętu do Hotelu Warszawianka w Jachrance oraz powrót są już uwzględnione w cenie.</p></article>
      </div>
    </section>

    <section class="gallery band" aria-labelledby="gallery-title"><div class="wrap"><div class="gallery-heading"><div><p class="eyebrow">Sobotki Portraits</p><h2 id="gallery-title">TAK WYGLĄDAJĄ <em>portrety.</em></h2></div><p>Przykłady zdjęć wykonanych w naszej Fotostacji. Na Waszym wydarzeniu wybrany wariant brandingu będzie częścią gotowego zdjęcia lub odbitki.</p></div><div class="gallery-viewport" role="region" aria-label="Galeria 34 portretów" tabindex="0"><div class="gallery-track"><div class="gallery-grid">${renderGalleryPhotos()}</div><div class="gallery-grid" aria-hidden="true">${renderGalleryPhotos(true)}</div></div></div></div></section>

    <section class="film-section" aria-labelledby="film-title">
      <div class="wrap feature-grid">
        <div class="feature-copy">
          <p class="eyebrow">Filmowe portrety / w cenie oferty</p>
          <h2 id="film-title">FILMOWE <span class="accent-label">KÓŁKO</span></h2>
          <p>Portrety w charakterystycznym, ciemnym kole, inspirowane kadrami z kina. Skupiają uwagę na twarzy i dodają galerii artystycznego, wyrazistego charakteru.</p>
          <p>Możemy wykonać je jako część podstawowych 3 godzin pracy Fotostacji. Zmiana oświetlenia zajmuje około 10 minut — moment przejścia na filmowe kółko ustalimy z organizatorem wydarzenia.</p>
          <p class="included-note">Filmowe kółko jest w cenie tej oferty.</p>
        </div>
        <figure class="film-photo"><img src="${imageBase}fs4tc-470.webp" alt="Przykładowy portret uczestnika w filmowym kółku" width="853" height="1280" loading="lazy" decoding="async"></figure>
      </div>
    </section>

    <section class="cloud-section" aria-labelledby="cloud-title">
      <div class="wrap feature-grid cloud-grid">
        <div class="feature-copy cloud-copy">
          <p class="eyebrow">Galeria dla uczestników / w cenie oferty</p>
          <h2 id="cloud-title">ZDJĘCIA OD RAZU <em>na telefonie.</em></h2>
          <p>Przy Fotostacji udostępniamy kod QR. Wystarczy go zeskanować, by od razu otworzyć elegancką galerię w chmurze — bez instalowania aplikacji i proszenia o link.</p>
          <p>Portrety dodajemy w trakcie eventu. Uczestnicy mogą przeglądać zdjęcia i pobierać ulubione kadry prosto na swoje telefony.</p>
          <p class="included-note">Galeria online jest w cenie tej oferty.</p>
          <p class="cloud-note">Dostęp do galerii na miejscu zależy od zasięgu i prędkości internetu w sali.</p>
        </div>
        <div class="cloud-visual" role="img" aria-label="Podgląd galerii zdjęć z Fotostacji na ekranie telefonu">
          <div class="iphone-shell"><div class="iphone-screen">
            <video id="cloudGalleryVideo" muted loop playsinline preload="none" poster="/oferta-portrety/assets/galeria-chmura-poster.webp" disablepictureinpicture disableremoteplayback aria-hidden="true" tabindex="-1">
              <source src="/oferta-portrety/assets/galeria-chmura-iphone.m4v" type="video/mp4">
            </video>
          </div></div>
        </div>
      </div>
    </section>

    <section id="wycena" class="pricing wrap" aria-labelledby="pricing-title"><div><p class="eyebrow">Hotel Warszawianka / 28.10.2026 / ok. 90 osób</p><h2 id="pricing-title">JEDNA CENA.<br><em>pełny zakres.</em></h2><p>Wycena obejmuje opisane wyżej 3 godziny pracy Fotostacji, do ${offer.printLimit} odbitek, zdjęcia w filmowym kółku, galerię online, jeden wariant brandingu zdjęć i dojazd zespołu z Gliwic. Filmowe kółko, galeria, transport i podstawowy projekt brandingu są już w cenie.</p></div><div class="price-card"><span>Indywidualna wycena wydarzenia</span><strong>${new Intl.NumberFormat('pl-PL').format(offer.pricePln)} zł</strong><small>za całość opisanego zakresu</small><div class="price-note">Dodatkowa godzina, większy nakład odbitek lub szersza produkcja materiałów wymagają osobnego uzgodnienia.</div></div></section>

    <section class="next-step"><div class="wrap next-grid"><div><p class="eyebrow">Co dalej?</p><h2>TERAZ RUCH<br>JEST <em>po Waszej stronie.</em></h2><p>Jeśli ta propozycja pasuje do Waszego wydarzenia, napiszcie do nas. Potwierdzimy dostępność terminu i ustalimy szczegóły brandingu. Samo otrzymanie oferty nie rezerwuje daty.</p></div><div class="actions"><a class="primary-button" href="${emailLink}">Zapytaj o dostępność terminu <span aria-hidden="true">↗</span></a><a class="secondary-link" href="https://www.instagram.com/sobotki.portraits/" target="_blank" rel="noopener noreferrer">Lub napisz na Instagramie @sobotki.portraits <span aria-hidden="true">↗</span></a><p>Oferta ważna do 28 października 2026, godz. 08:45 (czasu polskiego). Po tym terminie ten link wygaśnie.</p></div></div></section>
  </main>
  <footer class="wrap footer"><span>SOBOTKI PORTRAITS</span><span>Oferta przygotowana wyłącznie dla wydarzenia w Hotelu Warszawianka · 28.10.2026</span></footer>
</body>
</html>`;
}

export function renderExpiredWarszawiankaOffer() {
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Oferta wygasła · Sobotki Portraits</title><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;1,500;1,700&display=swap&subset=latin,latin-ext" rel="stylesheet"><link rel="stylesheet" href="https://use.typekit.net/oiv8gfj.css"><link rel="stylesheet" href="/corporate-offer-warszawianka.css?v=2"></head><body class="expired"><main><p class="eyebrow">Sobotki Portraits</p><h1>TA OFERTA<br><em>wygasła.</em></h1><p>Indywidualna oferta dla wydarzenia w Hotelu Warszawianka była ważna przez dwa tygodnie. Jeśli chcecie wrócić do rozmowy, napiszcie do nas — przygotujemy aktualną propozycję.</p><a class="primary-button" href="mailto:kontakt@sobotkiweddings.pl?subject=Aktualizacja%20oferty%20%E2%80%94%20Hotel%20Warszawianka">Poproś o aktualną ofertę <span aria-hidden="true">↗</span></a></main></body></html>`;
}
