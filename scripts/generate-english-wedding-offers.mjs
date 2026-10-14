import { mkdir, writeFile } from 'node:fs/promises';
import { ENGLISH_WEDDING_TIERS, renderEnglishWeddingOffer } from '../server/english-wedding-offer.js';

for (const tier of ENGLISH_WEDDING_TIERS) {
  const directory = new URL(`../public/${tier.slug}/`, import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), renderEnglishWeddingOffer(tier));
  console.log(`Generated /${tier.slug}/`);
}
