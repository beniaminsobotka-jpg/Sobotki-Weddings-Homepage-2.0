import { readFile } from 'node:fs/promises';

export async function assertDraftTargetsAreWritable(targets) {
  for (const target of targets) {
    let existing;
    try {
      existing = await readFile(target, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    if (/data-offer-version=["'][^"']+["']/.test(existing)) {
      throw new Error(`Frozen offer cannot be overwritten: ${target}. Ask the user whether to create the next version for all six PL/EN links.`);
    }
  }
}
