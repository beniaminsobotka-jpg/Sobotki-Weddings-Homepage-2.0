import { readFile, writeFile, mkdir, access } from 'node:fs/promises';

// Private release mapping: do not expose a list of historical offer URLs to clients.
const variants = [{ id: 'event-6f82', uplift: 300 }, { id: 'event-5990', uplift: 600 }];
const publicRoot = new URL('../public/', import.meta.url);
const source = new URL('event-21aa/', publicRoot);
const files = ['index.html', 'pricing.js', 'script.js', 'styles.css', 'visuals.js'];
const originals = Object.fromEntries(await Promise.all(files.map(async name => [name, await readFile(new URL(name, source), 'utf8')])));

// Preflight every new path before creating any variant. Existing shared URLs
// are immutable; use a new randomly generated identifier for another release.
for (const variant of variants) {
  try {
    await access(new URL(`${variant.id}/`, publicRoot));
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
  throw new Error(`Refusing to overwrite existing offer: ${variant.id}`);
}

for (const { id, uplift } of variants) {
  const directory = new URL(`${id}/`, publicRoot);
  await mkdir(directory);
  for (const name of files) {
    let content = originals[name];
    if (name === 'index.html') {
      content = content.replaceAll('event-21aa', id).replace('17.10.2026', '02.11.2026')
        .replace(/\b(?:2800|3200|3500|3800|4100|5000|3 500)\b/g, value => {
          const amount = Number(value.replaceAll(' ', '')) + uplift;
          return value.includes(' ') ? String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(amount);
        });
    }
    if (name === 'pricing.js') {
      content = content.replaceAll('event-21aa', id)
        .replace(/\bprice: (\d+)/g, (_, price) => `price: ${Number(price) + uplift}`);
    }
    await writeFile(new URL(name, directory), content);
  }
  console.log(`Created /${id}/ (+${uplift} PLN base prices only)`);
}
