import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const publicRoot = new URL('../public/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('offers/v1/manifest.json', publicRoot), 'utf8'));
const hash = (data) => createHash('sha256').update(data).digest('hex');

test('all six V1 pages and their local dependencies match the archived hashes', async () => {
  assert.equal(manifest.version, 'V1');
  assert.equal(manifest.offers.length, 6);
  assert.equal(new Set(manifest.offers.map((offer) => offer.snapshotId)).size, 6);
  for (const file of manifest.files) {
    assert.equal(hash(await readFile(new URL(file.path, publicRoot))), file.sha256, file.path);
  }
  for (const offer of manifest.offers) {
    const page = await readFile(new URL(`${offer.url.slice(1)}/index.html`, publicRoot), 'utf8');
    const archived = await readFile(new URL(offer.archivedUrl.slice(1), publicRoot), 'utf8');
    assert.equal(page, archived);
    assert.equal(hash(page), offer.sha256);
    assert.ok(page.includes(`data-offer-version="V1"`));
    assert.ok(page.includes(`data-offer-snapshot="${offer.snapshotId}"`));
    assert.ok(page.includes(`data-offer-archive="${offer.archivedUrl}"`));
    assert.ok(page.includes('href="/offers/v1/base.css"'));
    assert.ok(page.includes(`src="/offers/v1/${offer.language}.js"`));
    assert.doesNotMatch(page, /(?:src|href)="\/(?:oferta-portrety\/assets|offer-en\/(?:styles|script)|offer-pl\/(?:styles|script))/);
  }
});

test('frozen notifications include the version, snapshot ID, archive and displayed prices', async () => {
  for (const language of ['pl', 'en']) {
    const script = await readFile(new URL(`offers/v1/${language}.js`, publicRoot), 'utf8');
    for (const key of ['offerVersion', 'offerSnapshot', 'offerArchive', 'essential', 'exclusive']) {
      assert.ok(script.includes(`document.body.dataset.${key}`));
    }
    assert.ok(script.includes(language === 'pl' ? 'Wersja oferty:' : 'Offer version:'));
    assert.ok(script.includes('/offers/v1/assets/mosaic/'));
  }
});

test('draft generators refuse to overwrite published V1 offers', async () => {
  for (const script of ['generate-english-wedding-offers.mjs', 'generate-polish-wedding-offers.mjs']) {
    const result = spawnSync(process.execPath, [`scripts/${script}`], { cwd:root, encoding:'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Frozen offer cannot be overwritten/);
  }
  for (const file of manifest.files) {
    assert.equal(hash(await readFile(new URL(file.path, publicRoot))), file.sha256, file.path);
  }
});
