import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createPhotoZip, getPhotoZipSize } from '../server/stream-photo-zip.js';

test('ZIP64 archive opens with standard zipfile and retains Polish names and file contents', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'sobotki-zip-test-'));
  try {
    const photos = ['Kościół-001.jpg', 'Przygotowania-002.jpg'].map((name) => ({name, size:Buffer.byteLength(`contents:${name}`)}));
    const chunks = [];
    for await (const chunk of createPhotoZip(photos, async (photo) => new Response(`contents:${photo.name}`))) chunks.push(chunk);
    const archive = Buffer.concat(chunks);
    assert.equal(BigInt(archive.length), getPhotoZipSize(photos));
    assert.ok(archive.includes(Buffer.from([0x50,0x4b,0x06,0x06])));
    const path = join(directory, 'photos.zip');
    await writeFile(path, archive);
    const check = spawnSync('python3', ['-c', 'import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; assert len(z.namelist())==2; [(_ for _ in ()).throw(AssertionError(n)) if z.read(n).decode() != "contents:"+n else None for n in z.namelist()]', path], {encoding:'utf8'});
    assert.equal(check.status, 0, check.stderr);
  } finally {
    await rm(directory, {recursive:true,force:true});
  }
});
