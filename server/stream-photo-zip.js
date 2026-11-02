import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

export const getPhotoZipSize = (photos) => photos.reduce(
  (total, photo) => total + BigInt(photo.size) + 148n + 2n * BigInt(Buffer.byteLength(photo.name, 'utf8')),
  98n
);

// ZIP64 keeps offsets and file sizes valid when the archive exceeds 4 GB.
export async function* createPhotoZip(photos, openPhoto) {
  const central = [];
  let offset = 0n;
  for (const photo of photos) {
    const source = await openPhoto(photo);
    if (!source.body) throw new Error(`Brak zawartości pliku ${photo.name}`);
    const name = Buffer.from(photo.name, 'utf8');
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(45, 4);
    header.writeUInt16LE(0x0808, 6);
    header.writeUInt16LE(33, 12); // 1980-01-01, a valid DOS date.
    header.writeUInt32LE(0xffffffff, 18);
    header.writeUInt32LE(0xffffffff, 22);
    header.writeUInt16LE(name.length, 26);
    header.writeUInt16LE(20, 28);
    const extra = Buffer.alloc(20);
    extra.writeUInt16LE(1, 0);
    extra.writeUInt16LE(16, 2);
    const fileOffset = offset;
    yield Buffer.concat([header, name, extra]);
    offset += BigInt(header.length + name.length + extra.length);
    let size = 0n;
    let crc = 0xffffffff;
    // Async iteration cancels the upstream reader if the client disconnects.
    for await (const value of source.body) {
      const chunk = Buffer.from(value);
      for (const byte of chunk) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
      size += BigInt(chunk.length);
      yield chunk;
    }
    if (photo.size !== undefined && size !== BigInt(photo.size)) {
      throw new Error(`Plik ${photo.name} zmienił się podczas pobierania. Spróbuj ponownie.`);
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    const descriptor = Buffer.alloc(24);
    descriptor.writeUInt32LE(0x08074b50, 0);
    descriptor.writeUInt32LE(crc, 4);
    descriptor.writeBigUInt64LE(size, 8);
    descriptor.writeBigUInt64LE(size, 16);
    yield descriptor;
    offset += size + BigInt(descriptor.length);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(45, 4);
    record.writeUInt16LE(45, 6);
    record.writeUInt16LE(0x0808, 8);
    record.writeUInt16LE(33, 14);
    record.writeUInt32LE(crc, 16);
    record.writeUInt32LE(0xffffffff, 20);
    record.writeUInt32LE(0xffffffff, 24);
    record.writeUInt16LE(name.length, 28);
    record.writeUInt16LE(28, 30);
    record.writeUInt32LE(0xffffffff, 42);
    const centralExtra = Buffer.alloc(28);
    centralExtra.writeUInt16LE(1, 0);
    centralExtra.writeUInt16LE(24, 2);
    centralExtra.writeBigUInt64LE(size, 4);
    centralExtra.writeBigUInt64LE(size, 12);
    centralExtra.writeBigUInt64LE(fileOffset, 20);
    central.push(Buffer.concat([record, name, centralExtra]));
  }
  const directory = Buffer.concat(central);
  yield directory;
  const end64 = Buffer.alloc(56);
  end64.writeUInt32LE(0x06064b50, 0);
  end64.writeBigUInt64LE(44n, 4);
  end64.writeUInt16LE(45, 12);
  end64.writeUInt16LE(45, 14);
  end64.writeBigUInt64LE(BigInt(photos.length), 24);
  end64.writeBigUInt64LE(BigInt(photos.length), 32);
  end64.writeBigUInt64LE(BigInt(directory.length), 40);
  end64.writeBigUInt64LE(offset, 48);
  yield end64;
  const locator = Buffer.alloc(20);
  locator.writeUInt32LE(0x07064b50, 0);
  locator.writeBigUInt64LE(offset + BigInt(directory.length), 8);
  locator.writeUInt32LE(1, 16);
  yield locator;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0xffff, 8);
  end.writeUInt16LE(0xffff, 10);
  end.writeUInt32LE(0xffffffff, 12);
  end.writeUInt32LE(0xffffffff, 16);
  yield end;
}

export const streamPhotoZip = (photos, openPhoto, response) =>
  pipeline(Readable.from(createPhotoZip(photos, openPhoto)), response);
