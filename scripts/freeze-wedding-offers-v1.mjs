import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENGLISH_WEDDING_TIERS } from '../server/english-wedding-offer.js';

const publicRoot = fileURLToPath(new URL('../public/', import.meta.url));
const originalPublicRoot = process.argv[2] || publicRoot;
const archiveRoot = join(publicRoot, 'offers/v1');
const manifestPath = join(archiveRoot, 'manifest.json');
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

let existingManifest;
try { existingManifest = JSON.parse(await readFile(manifestPath, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }

if (existingManifest) {
  for (const file of existingManifest.files) {
    if (digest(await readFile(join(publicRoot, file.path))) !== file.sha256) {
      throw new Error(`Frozen V1 file has changed: ${file.path}. Do not overwrite V1.`);
    }
  }
  console.log('V1 is already frozen; all archived files are unchanged.');
  process.exit(0);
}

const prepared = [];
for (const [index, tier] of ENGLISH_WEDDING_TIERS.entries()) {
  const distance = [150, 250, 350][index];
  for (const language of ['pl', 'en']) {
    const slug = language === 'pl' ? `oferta-${distance}` : tier.slug;
    const path = join(publicRoot, slug, 'index.html');
    let html = await readFile(path, 'utf8');
    if (html.includes('data-offer-version=')) throw new Error(`Offer is already marked as frozen: ${slug}`);
    if (!html.includes(`data-essential="${tier.essential}"`) || !html.includes(`data-exclusive="${tier.exclusive}"`)) {
      throw new Error(`Unexpected prices for ${slug}`);
    }
    const snapshotId = `v1-${language}-${distance}`;
    const archivedUrl = `/offers/v1/pages/${language}-${distance}.html`;
    html = html
      .replace('<body ', `<body data-offer-version="V1" data-offer-snapshot="${snapshotId}" data-offer-archive="${archivedUrl}" `)
      .replaceAll('/oferta-portrety/assets/', '/offers/v1/assets/')
      .replace('href="/oferta-portrety/styles.css"', 'href="/offers/v1/base.css"')
      .replace(/href="\/offer-(en|pl)\/styles\.css\?v=\d+"/g, (_, lang) => `href="/offers/v1/${lang}.css"`)
      .replace(/src="\/offer-(en|pl)\/script\.js\?v=\d+"/g, (_, lang) => `src="/offers/v1/${lang}.js"`);
    prepared.push({ path, html, slug, snapshotId, archivedUrl, language, tier });
  }
}

const files = [];
async function preserve(path, bytes) {
  const data = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  try {
    const previous = await readFile(path);
    if (!previous.equals(data)) throw new Error(`Refusing to replace archived file: ${path}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await mkdir(dirname(path), { recursive:true });
    await writeFile(path, data);
  }
  files.push({ path:relative(publicRoot, path).split('\\').join('/'), sha256:digest(data) });
}

async function copyAssets(source, destination) {
  const entries = await readdir(source, { withFileTypes:true });
  entries.sort((a,b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const from = join(source, entry.name);
    const to = join(destination, entry.name);
    if (entry.isDirectory()) await copyAssets(from, to);
    else if (entry.isFile()) await preserve(to, await readFile(from));
  }
}

await preserve(join(archiveRoot, 'base.css'), await readFile(join(originalPublicRoot, 'oferta-portrety/styles.css')));
for (const language of ['pl', 'en']) {
  await preserve(join(archiveRoot, `${language}.css`), await readFile(join(publicRoot, `offer-${language}/styles.css`)));
  const script = (await readFile(join(publicRoot, `offer-${language}/script.js`), 'utf8')).replaceAll('/oferta-portrety/assets/', '/offers/v1/assets/');
  await preserve(join(archiveRoot, `${language}.js`), script);
}
await copyAssets(join(originalPublicRoot, 'oferta-portrety/assets'), join(archiveRoot, 'assets'));

const offers = [];
for (const offer of prepared) {
  await preserve(join(publicRoot, offer.archivedUrl), offer.html);
  await writeFile(offer.path, offer.html);
  files.push({ path:relative(publicRoot, offer.path).split('\\').join('/'), sha256:digest(offer.html) });
  offers.push({
    snapshotId:offer.snapshotId, version:'V1', language:offer.language,
    url:`/${offer.slug}`, archivedUrl:offer.archivedUrl, pricingTier:offer.tier.tier,
    prices:{essential:offer.tier.essential,exclusive:offer.tier.exclusive},
    sha256:digest(offer.html),
  });
}
files.sort((a,b) => a.path.localeCompare(b.path));
await writeFile(manifestPath, JSON.stringify({ version:'V1', frozenAt:new Date().toISOString(), offers, files }, null, 2) + '\n');
console.log(`Frozen V1: ${offers.length} offers, ${files.length} preserved files.`);
