import {
  getGallerySegments,
  listGalleryPhotos,
  resolveGallery,
} from '../server/dropbox-gallery.js';
import { createHash } from 'node:crypto';

const PUBLIC_ORIGIN = 'https://www.sobotkiweddings.pl';

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const replaceMeta = (html, attribute, key, content) => {
  const pattern = new RegExp(
    `<meta\\s+[^>]*${attribute}=["']${escapeRegExp(key)}["'][^>]*>`,
    'i'
  );
  const tag = `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(content)}" />`;

  return pattern.test(html)
    ? html.replace(pattern, () => tag)
    : html.replace('</head>', `    ${tag}\n  </head>`);
};

const replaceCanonical = (html, url) => {
  const pattern = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i;
  const tag = `<link rel="canonical" href="${escapeHtml(url)}" />`;

  return pattern.test(html)
    ? html.replace(pattern, () => tag)
    : html.replace('</head>', `    ${tag}\n  </head>`);
};

const injectGalleryBootstrap = (html, gallery) => {
  const serializedGallery = JSON.stringify(gallery)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  const script = `<script>window.__SOBOTKI_GALLERY_BOOTSTRAP__=${serializedGallery};</script>`;

  return html.replace('</head>', `    ${script}\n  </head>`);
};

const injectImagePreload = (html, imageUrl) => {
  if (!imageUrl) {
    return html;
  }

  const preload = `<link rel="preload" as="image" href="${escapeHtml(imageUrl)}" fetchpriority="high" />`;
  return html.replace('</head>', `    ${preload}\n  </head>`);
};

const getIndexHtml = async () => {
  const deploymentHost = String(process.env.VERCEL_URL || '').trim();
  const indexOrigin = deploymentHost ? `https://${deploymentHost}` : PUBLIC_ORIGIN;
  const indexResponse = await fetch(`${indexOrigin}/index.html`, {
    headers: { Accept: 'text/html' },
  });

  if (!indexResponse.ok) {
    throw new Error('Unable to load the application shell');
  }

  return indexResponse.text();
};

export default async function handler(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD');
    return response.status(405).end('Method not allowed');
  }

  let html;

  try {
    html = await getIndexHtml();
  } catch {
    return response.status(500).end('Nie udało się otworzyć galerii.');
  }

  try {
    const gallery = await resolveGallery(request.query?.slug);
    const photos = await listGalleryPhotos(gallery);
    const selectedCoverPhoto =
      photos.find((photo) => photo.name === gallery.coverPhoto) || null;
    const sharePhoto = selectedCoverPhoto || photos[0] || null;
    const galleryUrl = `${PUBLIC_ORIGIN}/galeria/${encodeURIComponent(gallery.slug)}`;
    const isWeddingGallery = gallery.kind === 'weddings';
    const brandName = isWeddingGallery ? 'Sobotki Weddings' : 'Sobotki Portraits';
    const title = `${gallery.title} — galeria zdjęć | ${brandName}`;
    const description = `${gallery.date ? `${gallery.date} · ` : ''}${isWeddingGallery
      ? 'To był dobry dzień. Rozgośćcie się i zobaczcie całą galerię zdjęć.'
      : 'Wasze portrety są tutaj. Oglądajcie i pobierajcie swoje ulubione kadry.'}`;
    const imageVersion = createHash('sha256').update(JSON.stringify([
      gallery.title, gallery.date, gallery.kind, sharePhoto?.name, sharePhoto?.rev, 'share-v1',
    ])).digest('hex').slice(0, 16);
    const imageUrl = `${PUBLIC_ORIGIN}/api/gallery-photo?${new URLSearchParams({
      slug: gallery.slug,
      size: 'share',
      v: imageVersion,
    }).toString()}`;
    const coverUrl = selectedCoverPhoto
      ? `${PUBLIC_ORIGIN}/api/gallery-photo?${new URLSearchParams({
          slug: gallery.slug,
          name: selectedCoverPhoto.name,
          rev: selectedCoverPhoto.rev,
          size: 'original',
        }).toString()}`
      : '';
    const coverPreviewUrl = selectedCoverPhoto
      ? `${PUBLIC_ORIGIN}/api/gallery-photo?${new URLSearchParams({
          slug: gallery.slug,
          name: selectedCoverPhoto.name,
          rev: selectedCoverPhoto.rev,
          size: 'preview',
        }).toString()}`
      : '';

    html = html.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${escapeHtml(title)}</title>`);
    html = replaceMeta(html, 'name', 'description', description);
    html = replaceMeta(html, 'name', 'robots', 'noindex,nofollow,noarchive');
    html = replaceMeta(html, 'property', 'og:locale', 'pl_PL');
    html = replaceMeta(html, 'property', 'og:site_name', brandName);
    html = replaceMeta(html, 'property', 'og:title', `${gallery.title} — galeria zdjęć`);
    html = replaceMeta(html, 'property', 'og:description', description);
    html = replaceMeta(html, 'property', 'og:image', imageUrl);
    html = replaceMeta(html, 'property', 'og:image:secure_url', imageUrl);
    html = replaceMeta(html, 'property', 'og:image:type', 'image/jpeg');
    html = replaceMeta(html, 'property', 'og:image:width', '1200');
    html = replaceMeta(html, 'property', 'og:image:height', '630');
    html = replaceMeta(html, 'property', 'og:image:alt', `Okładka galerii ${gallery.title}`);
    html = replaceMeta(html, 'property', 'og:type', 'website');
    html = replaceMeta(html, 'property', 'og:url', galleryUrl);
    html = replaceMeta(html, 'name', 'twitter:card', 'summary_large_image');
    html = replaceMeta(html, 'name', 'twitter:title', `${gallery.title} — galeria zdjęć`);
    html = replaceMeta(html, 'name', 'twitter:description', description);
    html = replaceMeta(html, 'name', 'twitter:image', imageUrl);
    html = replaceCanonical(html, galleryUrl);
    html = injectGalleryBootstrap(html, {
      slug: gallery.slug,
      title: gallery.title,
      date: gallery.date,
      kind: gallery.kind || 'portraits',
      fullResolutionAvailable: Boolean(gallery.fullResolutionFolder),
      coverPreviewUrl,
      coverUrl,
      segments: getGallerySegments(photos, gallery),
    });
    html = injectImagePreload(html, coverPreviewUrl || coverUrl);
  } catch (error) {
    // A crawler must not cache the home page's metadata for a gallery when
    // Dropbox is temporarily unavailable. Let it retry instead.
    console.error('[Gallery preview] Metadata unavailable', { code: error.code || 'metadata_error' });
    html = html.replace(/<meta\s+[^>]*(?:property=["']og:|name=["']twitter:)[^>]*>/gi, '');
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('Retry-After', '30');
    return response.status(error.statusCode === 404 ? 404 : 503).end(request.method === 'HEAD' ? '' : html);
  }

  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.setHeader('Content-Language', 'pl');
  response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  return response.status(200).end(request.method === 'HEAD' ? '' : html);
}
