import {
  GalleryError,
  buildPhotoPath,
  getPhotoFile,
  listGalleryPhotos,
  resolveGallery,
} from '../server/dropbox-gallery.js';

const MAX_ARCHIVE_PHOTOS = 2000;
const MAX_ARCHIVE_BYTES = 250 * 1024 * 1024;
const DOWNLOAD_CONCURRENCY = 8;

const sendJson = (response, status, body) => {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
};

const parseBody = (request) => {
  if (request.body && typeof request.body === 'object') {
    return request.body;
  }

  if (typeof request.body === 'string') {
    try {
      return JSON.parse(request.body);
    } catch {
      return {};
    }
  }

  return {};
};

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

const crc32 = (buffer) => {
  let value = 0xffffffff;

  for (const byte of buffer) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  }

  return (value ^ 0xffffffff) >>> 0;
};

const toDosDateTime = (value) => {
  const date = new Date(value || Date.now());
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const year = Math.max(1980, safeDate.getFullYear());

  return {
    date:
      ((year - 1980) << 9) |
      ((safeDate.getMonth() + 1) << 5) |
      safeDate.getDate(),
    time:
      (safeDate.getHours() << 11) |
      (safeDate.getMinutes() << 5) |
      Math.floor(safeDate.getSeconds() / 2),
  };
};

const createLocalHeader = ({ name, size, checksum, modifiedAt }) => {
  const encodedName = Buffer.from(name, 'utf8');
  const { date, time } = toDosDateTime(modifiedAt);
  const header = Buffer.alloc(30);

  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x0800, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(time, 10);
  header.writeUInt16LE(date, 12);
  header.writeUInt32LE(checksum, 14);
  header.writeUInt32LE(size, 18);
  header.writeUInt32LE(size, 22);
  header.writeUInt16LE(encodedName.length, 26);
  header.writeUInt16LE(0, 28);

  return Buffer.concat([header, encodedName]);
};

const createCentralHeader = ({ name, size, checksum, modifiedAt, offset }) => {
  const encodedName = Buffer.from(name, 'utf8');
  const { date, time } = toDosDateTime(modifiedAt);
  const header = Buffer.alloc(46);

  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0x0800, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(time, 12);
  header.writeUInt16LE(date, 14);
  header.writeUInt32LE(checksum, 16);
  header.writeUInt32LE(size, 20);
  header.writeUInt32LE(size, 24);
  header.writeUInt16LE(encodedName.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(offset, 42);

  return Buffer.concat([header, encodedName]);
};

const createEndRecord = ({ count, centralSize, centralOffset }) => {
  const record = Buffer.alloc(22);

  record.writeUInt32LE(0x06054b50, 0);
  record.writeUInt16LE(0, 4);
  record.writeUInt16LE(0, 6);
  record.writeUInt16LE(count, 8);
  record.writeUInt16LE(count, 10);
  record.writeUInt32LE(centralSize, 12);
  record.writeUInt32LE(centralOffset, 16);
  record.writeUInt16LE(0, 20);

  return record;
};

const downloadPhoto = async (gallery, photo) => {
  const fileResponse = await getPhotoFile(buildPhotoPath(gallery, photo.name));
  const contents = Buffer.from(await fileResponse.arrayBuffer());

  return {
    ...photo,
    contents,
    checksum: crc32(contents),
  };
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  try {
    const body = parseBody(request);
    const requestedNames = Array.isArray(body.names)
      ? [...new Set(body.names.map((name) => String(name || '').trim()).filter(Boolean))]
      : [];

    if (requestedNames.length === 0) {
      throw new GalleryError(
        'Zaznacz przynajmniej jedno zdjęcie.',
        400,
        'empty_selection'
      );
    }

    if (requestedNames.length > MAX_ARCHIVE_PHOTOS) {
      throw new GalleryError(
        `Jednorazowo możesz pobrać maksymalnie ${MAX_ARCHIVE_PHOTOS} zdjęć.`,
        413,
        'too_many_photos'
      );
    }

    const gallery = await resolveGallery(body.slug);
    const photos = await listGalleryPhotos(gallery);
    const photosByName = new Map(photos.map((photo) => [photo.name, photo]));
    const selectedPhotos = requestedNames.map((name) => photosByName.get(name));

    if (selectedPhotos.some((photo) => !photo)) {
      throw new GalleryError(
        'Jednego z wybranych zdjęć nie ma już w galerii. Odśwież stronę i spróbuj ponownie.',
        409,
        'selection_outdated'
      );
    }

    const declaredSize = selectedPhotos.reduce(
      (total, photo) => total + Number(photo.size || 0),
      0
    );

    if (declaredSize > MAX_ARCHIVE_BYTES) {
      throw new GalleryError(
        'Wybrane zdjęcia są zbyt duże do jednego pobrania. Pobierz je w dwóch mniejszych partiach.',
        413,
        'archive_too_large'
      );
    }

    const archiveName = `sobotki-${gallery.slug}-${selectedPhotos.length}-zdjec.zip`;
    response.status(200);
    response.setHeader('Content-Type', 'application/zip');
    response.setHeader('Content-Disposition', `attachment; filename="${archiveName}"`);
    response.setHeader('Cache-Control', 'private, no-store');

    const centralRecords = [];
    let offset = 0;

    for (let index = 0; index < selectedPhotos.length; index += DOWNLOAD_CONCURRENCY) {
      const batch = selectedPhotos.slice(index, index + DOWNLOAD_CONCURRENCY);
      const downloadedPhotos = await Promise.all(
        batch.map((photo) => downloadPhoto(gallery, photo))
      );

      for (const photo of downloadedPhotos) {
        const localHeader = createLocalHeader({
          name: photo.name,
          size: photo.contents.length,
          checksum: photo.checksum,
          modifiedAt: photo.modifiedAt,
        });

        response.write(localHeader);
        response.write(photo.contents);
        centralRecords.push(
          createCentralHeader({
            name: photo.name,
            size: photo.contents.length,
            checksum: photo.checksum,
            modifiedAt: photo.modifiedAt,
            offset,
          })
        );
        offset += localHeader.length + photo.contents.length;
      }
    }

    const centralDirectory = Buffer.concat(centralRecords);
    response.write(centralDirectory);
    response.write(
      createEndRecord({
        count: centralRecords.length,
        centralSize: centralDirectory.length,
        centralOffset: offset,
      })
    );
    return response.end();
  } catch (error) {
    const galleryError =
      error instanceof GalleryError
        ? error
        : new GalleryError(
            'Nie udało się przygotować wybranych zdjęć do pobrania.',
            500,
            'archive_error'
          );

    if (response.headersSent) {
      return response.end();
    }

    return sendJson(response, galleryError.statusCode, {
      error: galleryError.message,
      code: galleryError.code,
    });
  }
}
