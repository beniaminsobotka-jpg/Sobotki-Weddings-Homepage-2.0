import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_SITE_URL = 'https://sobotkiweddings.pl';
const SITE_URL = (process.env.VITE_SITE_URL || DEFAULT_SITE_URL).trim().replace(/\/+$/, '');
const TODAY = new Date().toISOString().slice(0, 10);
const ROUTES = [
  '/',
  '/portfolio',
  '/film',
  '/portraits',
  '/portraits/wedding',
  '/portraits/event',
  '/portraits/stationary',
  '/kontakt',
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');

const robotsContent = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.map((route) => `  <url>
    <loc>${new URL(route, SITE_URL).toString()}</loc>
    <lastmod>${TODAY}</lastmod>
  </url>`).join('\n')}
</urlset>
`;

await mkdir(publicDir, { recursive: true });
await writeFile(path.join(publicDir, 'robots.txt'), robotsContent, 'utf8');
await writeFile(path.join(publicDir, 'sitemap.xml'), sitemapContent, 'utf8');
