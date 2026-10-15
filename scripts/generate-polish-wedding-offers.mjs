import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { POLISH_WEDDING_TIERS, renderPolishWeddingOffer, localizeOfferScript } from '../server/polish-wedding-offer.js';
import { assertDraftTargetsAreWritable } from '../server/offer-versioning.js';

await assertDraftTargetsAreWritable(POLISH_WEDDING_TIERS.map((tier) => new URL(`../public/${tier.slug}/index.html`, import.meta.url)));

// Optional source argument allows generation from the current published Polish offer.
const source = await readFile(process.argv[2] || new URL('../public/oferta-portrety/index.html', import.meta.url), 'utf8');
for (const tier of POLISH_WEDDING_TIERS) {
  const directory = new URL(`../public/${tier.slug}/`, import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), renderPolishWeddingOffer(source, tier));
  console.log(`Generated /${tier.slug}/`);
}
await mkdir(new URL('../public/offer-pl/', import.meta.url), { recursive: true });
const script = await readFile(new URL('../public/offer-en/script.js', import.meta.url), 'utf8');
await writeFile(new URL('../public/offer-pl/script.js', import.meta.url), localizeOfferScript(script));
