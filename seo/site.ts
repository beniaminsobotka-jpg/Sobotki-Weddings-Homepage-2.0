const DEFAULT_SITE_URL = 'https://sobotkiweddings.pl';
const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.trim();

export const SITE_URL = (configuredSiteUrl || DEFAULT_SITE_URL).replace(/\/+$/, '');
export const SITE_NAME = 'Sobotki Weddings';
export const SITE_LOCALE = 'pl_PL';
export const DEFAULT_ROBOTS = 'index,follow,max-image-preview:large';
export const SITE_DESCRIPTION =
  'Fotografia i film ślubny oraz fotostacja premium na wesela, eventy firmowe i sesje portretowe.';
export const SITE_LOGO =
  '/favicon.svg';
export const SITE_DEFAULT_IMAGE =
  '/uploads/2026/03/Karuzela_homepage_2.jpg';

export type SeoPageKey =
  | 'home'
  | 'portfolio'
  | 'film'
  | 'portraits'
  | 'portraitsWedding'
  | 'portraitsEvent'
  | 'portraitsStationary'
  | 'contact'
  | 'notFound';

type PageSeo = {
  path: string;
  title: string;
  description: string;
  image: string;
  ogType: 'website';
  robots?: string;
};

export const seoPages: Record<SeoPageKey, PageSeo> = {
  home: {
    path: '/',
    title: 'Sobotki Weddings | Naturalna fotografia i film ślubny',
    description:
      'Sobotki Weddings tworzy naturalne zdjęcia ślubne, emocjonalne filmy i elegancką fotostację premium. Zobacz portfolio, filmy, portraits i skontaktuj się z nami.',
    image: '/uploads/2026/03/Karuzela_homepage_2.jpg',
    ogType: 'website',
  },
  portfolio: {
    path: '/portfolio',
    title: 'Portfolio ślubne | Zdjęcia i filmy - Sobotki Weddings',
    description:
      'Portfolio Sobotki Weddings: reportaż ślubny, kadry editorialowe i filmowe historie. Zobacz realizacje zdjęciowe i video w autorskim stylu.',
    image: '/uploads/2026/03/Karuzela_homepage_1.jpg',
    ogType: 'website',
  },
  film: {
    path: '/film',
    title: 'Film ślubny | Emocjonalne filmy ślubne - Sobotki Weddings',
    description:
      'Tworzymy poruszające filmy ślubne, które zachowują emocje, rytm dnia i autentyczne relacje. Poznaj nasze podejście do video ślubnego.',
    image: '/uploads/2026/03/AdaxMarcin-miniaturka-www.avif',
    ogType: 'website',
  },
  portraits: {
    path: '/portraits',
    title: 'Sobotki Portraits | Fotostacja ślubna i eventowa premium',
    description:
      'Sobotki Portraits to elegancka fotostacja premium: czarno-białe portrety na wesela, eventy firmowe i sesje stacjonarne w Gliwicach.',
    image: '/uploads/2026/03/Portraits_Wybrane_www_1.jpg',
    ogType: 'website',
  },
  portraitsWedding: {
    path: '/portraits/wedding',
    title: 'Fotostacja ślubna | Czarno-białe portrety gości - Sobotki Portraits',
    description:
      'Fotostacja ślubna Sobotki Portraits to mobilne studio portretowe z natychmiastowym wydrukiem i galerią online. Elegancka atrakcja weselna premium.',
    image: '/uploads/2026/03/Portraits_Wybrane_www_2.jpg',
    ogType: 'website',
  },
  portraitsEvent: {
    path: '/portraits/event',
    title: 'Fotostacja eventowa dla firm | Premium experience - Sobotki Portraits',
    description:
      'Fotostacja eventowa dla firm na gale, jubileusze, targi i konferencje. Portrety premium, branding, natychmiastowy druk i galeria online.',
    image: '/uploads/2026/03/Portraits_Wybrane_www_3.jpg',
    ogType: 'website',
  },
  portraitsStationary: {
    path: '/portraits/stationary',
    title: 'Fotostacja stacjonarna w Gliwicach | Sesje portretowe - Sobotki Portraits',
    description:
      'Fotostacja stacjonarna w Gliwicach: krótkie sesje portretowe z eleganckimi czarno-białymi odbitkami. Umów rodzinny lub partnerski portret.',
    image: '/uploads/2026/03/Portraits_Wybrane_www_5.jpg',
    ogType: 'website',
  },
  contact: {
    path: '/kontakt',
    title: 'Kontakt | Sobotki Weddings i Sobotki Portraits',
    description:
      'Skontaktuj się z Sobotki Weddings w sprawie fotografii ślubnej, filmu lub fotostacji Sobotki Portraits. Napisz do nas i zapytaj o termin.',
    image: '/uploads/2026/03/O-Nas_compressed_2.webp',
    ogType: 'website',
  },
  notFound: {
    path: '/404',
    title: '404 | Sobotki Weddings',
    description:
      'Ta podstrona nie istnieje. Wróć do strony głównej Sobotki Weddings i przejdź do portfolio, filmu, portraits lub kontaktu.',
    image: '/uploads/2026/03/Karuzela_homepage_2.jpg',
    ogType: 'website',
    robots: 'noindex,follow',
  },
};

export const buildAbsoluteUrl = (path: string) => new URL(path, SITE_URL).toString();

export const getSeoForPage = (page: SeoPageKey) => {
  const config = seoPages[page];

  return {
    ...config,
    canonical: buildAbsoluteUrl(config.path),
    image: config.image.startsWith('http') ? config.image : buildAbsoluteUrl(config.image),
    robots: config.robots ?? DEFAULT_ROBOTS,
  };
};

export const getStructuredData = (page: SeoPageKey) => {
  const config = getSeoForPage(page);

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      image: SITE_DEFAULT_IMAGE,
      inLanguage: 'pl-PL',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      '@id': `${SITE_URL}/#service`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: SITE_LOGO,
      image: config.image,
      description: SITE_DESCRIPTION,
      email: 'kontakt@sobotkiweddings.pl',
      areaServed: ['PL', 'Europa'],
      sameAs: [
        'https://www.instagram.com/sobotki.weddings/',
        'https://www.facebook.com/sobotki.weddings',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'kontakt@sobotkiweddings.pl',
        availableLanguage: ['pl', 'en'],
      },
      brand: {
        '@type': 'Brand',
        name: SITE_NAME,
        logo: SITE_LOGO,
      },
      serviceType: [
        'Fotografia ślubna',
        'Film ślubny',
        'Fotostacja ślubna',
        'Fotostacja eventowa',
        'Sesje portretowe',
      ],
      knowsAbout: [
        'Fotografia ślubna',
        'Film ślubny',
        'Fotostacja premium',
        'Fotostacja ślubna',
        'Fotostacja eventowa',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${config.canonical}#webpage`,
      url: config.canonical,
      name: config.title,
      description: config.description,
      inLanguage: 'pl-PL',
      isPartOf: {
        '@id': `${SITE_URL}/#website`,
      },
      about: {
        '@id': `${SITE_URL}/#service`,
      },
      publisher: {
        '@id': `${SITE_URL}/#service`,
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: config.image,
      },
    },
  ];
};
