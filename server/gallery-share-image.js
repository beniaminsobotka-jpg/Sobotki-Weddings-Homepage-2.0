import { fileURLToPath } from 'node:url';

process.env.FONTCONFIG_FILE ||= fileURLToPath(new URL('./gallery-fonts.conf', import.meta.url));
const { default: sharp } = await import('sharp');

const titleFont = fileURLToPath(new URL('../public/uploads/2024/01/SegmentA-KeyBold.ttf', import.meta.url));
const detailFont = fileURLToPath(new URL('../public/uploads/2024/11/InstrumentSerif-Italic.ttf', import.meta.url));
const escapeMarkup = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;'}[character]));

const textLayer = async (value, top, height, font, fontfile) => {
  const { data, info } = await sharp({ text: {
    text: `<span foreground="#ffffff">${escapeMarkup(value)}</span>`,
    font, fontfile, rgba: true, width: 1080, height, wrap: 'none', align: 'centre',
  } }).png().toBuffer({ resolveWithObject: true });
  return { input: data, left: Math.round((1200 - info.width) / 2), top };
};

export const createGalleryShareImage = async (source, gallery) => {
  const base = source
    ? await sharp(source).rotate().resize(1200, 630, {fit:'cover', position:'north'}).toBuffer()
    : await sharp({create:{width:1200,height:630,channels:3,background:'#171717'}}).png().toBuffer();
  const gradient = Buffer.from('<svg width="1200" height="630"><defs><linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".12"/><stop offset=".4" stop-color="#000" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".92"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/></svg>');
  const layers = await Promise.all([
    textLayer('SOBOTKI', 34, 38, 'Segment A Key Bold', titleFont),
    textLayer(gallery.kind === 'weddings' ? 'weddings' : 'portraits', 78, 24, 'Instrument Serif Italic', detailFont),
    textLayer(String(gallery.title).toLocaleUpperCase('pl-PL'), 420, 82, 'Segment A Key Bold', titleFont),
    textLayer(gallery.date || 'Wasza galeria zdjęć', 524, 30, 'Instrument Serif Italic', detailFont),
  ]);
  return sharp(base).composite([{input:gradient,top:0,left:0}, ...layers]).jpeg({quality:86,mozjpeg:true}).toBuffer();
};
