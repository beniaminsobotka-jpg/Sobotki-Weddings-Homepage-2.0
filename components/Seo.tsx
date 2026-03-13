import { useEffect } from 'react';
import { SITE_LOCALE, SITE_NAME, SeoPageKey, getSeoForPage, getStructuredData } from '../seo/site';

type SeoProps = {
  page: SeoPageKey;
};

const upsertMetaTag = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
};

const upsertLinkTag = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector<HTMLLinkElement>(selector);

  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
};

export const Seo = ({ page }: SeoProps) => {
  useEffect(() => {
    const meta = getSeoForPage(page);
    const structuredData = getStructuredData(page);
    const structuredDataId = 'route-structured-data';

    document.title = meta.title;
    document.documentElement.lang = 'pl';

    upsertMetaTag('meta[name="description"]', {
      name: 'description',
      content: meta.description,
    });
    upsertMetaTag('meta[name="robots"]', {
      name: 'robots',
      content: meta.robots,
    });
    upsertMetaTag('meta[property="og:locale"]', {
      property: 'og:locale',
      content: SITE_LOCALE,
    });
    upsertMetaTag('meta[property="og:site_name"]', {
      property: 'og:site_name',
      content: SITE_NAME,
    });
    upsertMetaTag('meta[property="og:title"]', {
      property: 'og:title',
      content: meta.title,
    });
    upsertMetaTag('meta[property="og:description"]', {
      property: 'og:description',
      content: meta.description,
    });
    upsertMetaTag('meta[property="og:image"]', {
      property: 'og:image',
      content: meta.image,
    });
    upsertMetaTag('meta[property="og:type"]', {
      property: 'og:type',
      content: meta.ogType,
    });
    upsertMetaTag('meta[property="og:url"]', {
      property: 'og:url',
      content: meta.canonical,
    });
    upsertMetaTag('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    upsertMetaTag('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: meta.title,
    });
    upsertMetaTag('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: meta.description,
    });
    upsertMetaTag('meta[name="twitter:image"]', {
      name: 'twitter:image',
      content: meta.image,
    });
    upsertLinkTag('link[rel="canonical"]', {
      rel: 'canonical',
      href: meta.canonical,
    });

    const existingStructuredData = document.getElementById(structuredDataId);
    if (existingStructuredData) {
      existingStructuredData.remove();
    }

    const script = document.createElement('script');
    script.id = structuredDataId;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const currentStructuredData = document.getElementById(structuredDataId);
      if (currentStructuredData) {
        currentStructuredData.remove();
      }
    };
  }, [page]);

  return null;
};
