import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGalleryShareImage } from '../server/gallery-share-image.js';
import sharp from 'sharp';

test('share card is a small 1200x630 JPEG and handles Polish text and long titles', async () => {
  const source = await sharp({create:{width:900,height:600,channels:3,background:'#8a7864'}}).jpeg().toBuffer();
  for (const title of ['Łucja & Michał', 'Magdalena i Aleksander — wspomnienia z naszego ślubu <3']) {
    const output = await createGalleryShareImage(source, {title,date:'2 listopada 2026',kind:'weddings'});
    const metadata = await sharp(output).metadata();
    assert.equal(metadata.width,1200);
    assert.equal(metadata.height,630);
    assert.equal(metadata.format,'jpeg');
    assert.ok(output.length < 1_000_000);
  }
});

test('galleries without photos get a branded share card', async () => {
  const output = await createGalleryShareImage(null,{title:'Wasze portrety',date:'',kind:'portraits'});
  assert.equal((await sharp(output).metadata()).width,1200);
});
