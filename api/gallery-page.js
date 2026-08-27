import { listGalleryPhotos, resolveGallery } from '../server/dropbox-gallery.js';

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
    const coverPhoto =
      photos.find((photo) => photo.name === gallery.coverPhoto) || photos[0] || null;
    const galleryUrl = `${PUBLIC_ORIGIN}/galeria/${encodeURIComponent(gallery.slug)}`;
    const title = `${gallery.title} — galeria zdjęć | Sobotki Portraits`;
    const description = gallery.date
      ? `Galeria zdjęć: ${gallery.title}, ${gallery.date}. Portrety tworzone na żywo przez Sobotki Portraits.`
      : `Galeria zdjęć: ${gallery.title}. Portrety tworzone na żywo przez Sobotki Portraits.`;
    const imageUrl = coverPhoto
      ? `${PUBLIC_ORIGIN}/api/gallery-photo?${new URLSearchParams({
          slug: gallery.slug,
          name: coverPhoto.name,
          rev: coverPhoto.rev,
          size: 'large',
        }).toString()}`
      : `${PUBLIC_ORIGIN}/sobotki-portraits-logo.png`;

    html = html.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${escapeHtml(title)}</title>`);
    html = replaceMeta(html, 'name', 'description', description);
    html = replaceMeta(html, 'name', 'robots', 'noindex,nofollow,noarchive');
    html = replaceMeta(html, 'property', 'og:locale', 'pl_PL');
    html = replaceMeta(html, 'property', 'og:site_name', 'Sobotki Portraits');
    html = replaceMeta(html, 'property', 'og:title', title);
    html = replaceMeta(html, 'property', 'og:description', description);
    html = replaceMeta(html, 'property', 'og:image', imageUrl);
    html = replaceMeta(html, 'property', 'og:image:alt', `Okładka galerii ${gallery.title}`);
    html = replaceMeta(html, 'property', 'og:type', 'website');
    html = replaceMeta(html, 'property', 'og:url', galleryUrl);
    html = replaceMeta(html, 'name', 'twitter:card', 'summary_large_image');
    html = replaceMeta(html, 'name', 'twitter:title', title);
    html = replaceMeta(html, 'name', 'twitter:description', description);
    html = replaceMeta(html, 'name', 'twitter:image', imageUrl);
    html = replaceCanonical(html, galleryUrl);
  } catch {
    // The client application will render its normal error state for missing galleries.
  }

  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.setHeader('Content-Language', 'pl');
  response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  return response.status(200).end(request.method === 'HEAD' ? '' : html);
}
