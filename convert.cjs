const sharp = require('sharp');
async function run() {
  await sharp(process.argv[2]).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toFile(process.argv[3]);
}
run().catch(console.error);
