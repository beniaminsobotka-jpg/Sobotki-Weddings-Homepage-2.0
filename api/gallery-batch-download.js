import {
  GalleryError,
  buildPhotoPath,
  buildFullResolutionPhotoPath,
  getPhotoFile,
  getGalleryRegistry,
  listGalleryFullResolutionPhotos,
  listGalleryPhotos,
  resolveGallery,
} from '../server/dropbox-gallery.js';
import { isGalleryAdmin } from '../server/gallery-admin-auth.js';

const MAX_ARCHIVE_PHOTOS = 100;
const MAX_ARCHIVE_BYTES = 2 * 1024 * 1024 * 1024;

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
      return Object.fromEntries(new URLSearchParams(request.body));
    }
  }

  return {};
};

const parseRequestedNames = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [value];
  }
};

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

const updateCrc32 = (value, buffer) => {
  for (const byte of buffer) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  }

  return value >>> 0;
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

const createLocalHeader = ({ name, modifiedAt }) => {
  const encodedName = Buffer.from(name, 'utf8');
  const { date, time } = toDosDateTime(modifiedAt);
  const header = Buffer.alloc(30);

  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x0808, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(time, 10);
  header.writeUInt16LE(date, 12);
  header.writeUInt32LE(0, 14);
  header.writeUInt32LE(0, 18);
  header.writeUInt32LE(0, 22);
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
  header.writeUInt16LE(0x0808, 8);
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

const createDataDescriptor = ({ size, checksum }) => {
  const descriptor = Buffer.alloc(16);

  descriptor.writeUInt32LE(0x08074b50, 0);
  descriptor.writeUInt32LE(checksum, 4);
  descriptor.writeUInt32LE(size, 8);
  descriptor.writeUInt32LE(size, 12);

  return descriptor;
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

const writeChunk = async (response, chunk) => {
  if (!response.write(chunk)) {
    await new Promise((resolve) => response.once('drain', resolve));
  }
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  try {
    const body = parseBody(request);
    const requestedNames = [
      ...new Set(
        parseRequestedNames(body.names)
          .map((name) => String(name || '').trim())
          .filter(Boolean)
      ),
    ];

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

    const useAdminGallery =
      (body.admin === true || body.admin === 'true') && isGalleryAdmin(request);
    const gallery = useAdminGallery
      ? (await getGalleryRegistry({ fresh: true }))?.galleries.find(
          (item) => item.slug === body.slug
        )
      : await resolveGallery(body.slug);

    if (!gallery) {
      throw new GalleryError('Nie znaleziono takiej galerii.', 404, 'gallery_not_found');
    }

    const useFullResolution = body.source === 'full';
    const photos = useFullResolution
      ? await listGalleryFullResolutionPhotos(gallery)
      : await listGalleryPhotos(gallery);
    const photosByName = new Map(
      photos.map((photo) => [photo.name.toLocaleLowerCase('pl-PL'), photo])
    );
    const selectedPhotos = requestedNames.map((name) =>
      photosByName.get(name.toLocaleLowerCase('pl-PL'))
    );

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
        'Wybrane zdjęcia przekraczają limit 2 GB dla jednej paczki ZIP.',
        413,
        'archive_too_large'
      );
    }

    const archiveName = `sobotki-${gallery.slug}-${
      useFullResolution ? 'pelna-rozdzielczosc-' : ''
    }${selectedPhotos.length}-zdjec.zip`;
    response.status(200);
    response.setHeader('Content-Type', 'application/zip');
    response.setHeader('Content-Disposition', `attachment; filename="${archiveName}"`);
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Accel-Buffering', 'no');

    const centralRecords = [];
    let offset = 0;

    for (const photo of selectedPhotos) {
      const path = useFullResolution
        ? buildFullResolutionPhotoPath(gallery, photo.name)
        : buildPhotoPath(gallery, photo.name);
      const fileResponse = await getPhotoFile(path);

      if (!fileResponse.body) {
        throw new GalleryError(
          `Dropbox nie zwrócił pliku ${photo.name}.`,
          502,
          'photo_download_empty'
        );
      }

      const localHeader = createLocalHeader({
        name: photo.name,
        modifiedAt: photo.modifiedAt,
      });
      const localOffset = offset;
      let checksum = 0xffffffff;
      let streamedSize = 0;

      await writeChunk(response, localHeader);
      offset += localHeader.length;

      const reader = fileResponse.body.getReader();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = Buffer.from(value);
        checksum = updateCrc32(checksum, chunk);
        streamedSize += chunk.length;
        await writeChunk(response, chunk);
      }

      checksum = (checksum ^ 0xffffffff) >>> 0;
      const descriptor = createDataDescriptor({ size: streamedSize, checksum });
      await writeChunk(response, descriptor);
      offset += streamedSize + descriptor.length;
      centralRecords.push(
        createCentralHeader({
          name: photo.name,
          size: streamedSize,
          checksum,
          modifiedAt: photo.modifiedAt,
          offset: localOffset,
        })
      );
    }

    const centralDirectory = Buffer.concat(centralRecords);
    await writeChunk(response, centralDirectory);
    await writeChunk(
      response,
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
      if (typeof response.destroy === 'function') {
        response.destroy(galleryError);
        return;
      }

      return response.end();
    }

    return sendJson(response, galleryError.statusCode, {
      error: galleryError.message,
      code: galleryError.code,
    });
  }
}
