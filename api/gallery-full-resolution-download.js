import {
  GalleryError,
  buildPhotoPath,
  getDropboxBinaryStream,
  listGalleryFullResolutionPhotos,
  listGalleryPhotos,
  resolveGallery,
} from '../server/dropbox-gallery.js';
import { hasCoupleSession } from '../server/gallery-couple-auth.js';
import { isGalleryAdmin } from '../server/gallery-admin-auth.js';
import { streamPhotoZip } from '../server/stream-photo-zip.js';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const MAX_SINGLE_ZIP_BYTES = 20_000_000_000;

const sendJson = (response, status, body) => {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'private, no-store');
  response.end(JSON.stringify(body));
};

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  const controller = new AbortController();
  const onClose = () => { if (!response.writableFinished) controller.abort(); };
  response.once?.('close', onClose);
  const startedAt = Date.now();
  try {
    const gallery = await resolveGallery(request.query?.slug);
    if (gallery.kind === 'weddings' && !hasCoupleSession(request, gallery) && !isGalleryAdmin(request)) {
      throw new GalleryError('Odblokuj pobieranie wszystkich plików PIN-em pary młodej.', 403, 'couple_pin_required');
    }
    const social = request.query?.source === 'social';

    if (!social && !gallery.fullResolutionFolder) {
      throw new GalleryError(
        'Pełna rozdzielczość nie jest jeszcze dostępna dla tej galerii.',
        404,
        'full_resolution_folder_missing'
      );
    }

    const [galleryPhotos, fullResolutionPhotos] = await Promise.all([
      listGalleryPhotos(gallery),
      social ? Promise.resolve([]) : listGalleryFullResolutionPhotos(gallery),
    ]);
    const fullResolutionNames = new Set(
      fullResolutionPhotos.map((photo) => photo.name.toLocaleLowerCase('pl-PL'))
    );
    const missingPhotoCount = galleryPhotos.filter(
      (photo) => !fullResolutionNames.has(photo.name.toLocaleLowerCase('pl-PL'))
    ).length;

    if (!social && missingPhotoCount > 0) {
      throw new GalleryError(
        `Pełna galeria jest jeszcze przygotowywana — brakuje ${missingPhotoCount} oryginalnych plików.`,
        409,
        'full_resolution_incomplete'
      );
    }

    const archivePhotos = social ? galleryPhotos : fullResolutionPhotos;
    if (!archivePhotos.length) {
      throw new GalleryError('Nie ma jeszcze zdjęć do pobrania.', 404, 'archive_empty');
    }
    const totalBytes = archivePhotos.reduce(
      (total, photo) => total + Math.max(0, Number(photo.size) || 0),
      0
    );

    if (totalBytes >= MAX_SINGLE_ZIP_BYTES) {
      throw new GalleryError(
        'Ta galeria przekracza 20 GB. Skontaktuj się z nami, aby otrzymać duże pliki inną drogą.',
        413,
        'single_zip_too_large'
      );
    }

    if (request.query?.prepare === '1') {
      return sendJson(response, 200, { photoCount: archivePhotos.length, totalBytes });
    }

    const dropboxZip = social ? null : await getDropboxBinaryStream(gallery.fullResolutionFolder, { zip: true, signal: controller.signal });

    response.status(200);
    response.setHeader('Content-Type', 'application/zip');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="sobotki-${gallery.slug}-${social ? 'social-media' : 'pelna-rozdzielczosc'}.zip"`
    );
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Accel-Buffering', 'no');
    // Start a chunked response immediately instead of allowing a response adapter
    // to collect a multi-gigabyte body using the declared Content-Length.
    response.flushHeaders?.();
    console.info('[Gallery ZIP] Started', { source: social ? 'social' : 'full', rssMB: Math.round(process.memoryUsage().rss / 1048576) });

    if (social) {
      await streamPhotoZip(galleryPhotos, async (photo) => ({ body: await getDropboxBinaryStream(buildPhotoPath(gallery, photo.name), { signal: controller.signal }) }), response);
    } else {
      let bytes = 0;
      let nextReport = 512 * 1024 * 1024;
      const monitor = new Transform({
        highWaterMark: 64 * 1024,
        transform(chunk, _encoding, callback) {
          bytes += chunk.length;
          if (bytes >= nextReport) {
            console.info('[Gallery ZIP] Progress', { bytes, rssMB: Math.round(process.memoryUsage().rss / 1048576) });
            nextReport = bytes + 512 * 1024 * 1024;
          }
          callback(null, chunk);
        },
      });
      await pipeline(dropboxZip, monitor, response, { signal: controller.signal });
    }
    console.info('[Gallery ZIP] Completed', { durationMs: Date.now() - startedAt, rssMB: Math.round(process.memoryUsage().rss / 1048576) });
  } catch (error) {
    console.error('[Gallery ZIP] Interrupted', { code: error.code || 'stream_error', durationMs: Date.now() - startedAt, rssMB: Math.round(process.memoryUsage().rss / 1048576) });
    const galleryError =
      error instanceof GalleryError
        ? error
        : new GalleryError(
            'Nie udało się przygotować jednej paczki ZIP.',
            500,
            'full_resolution_zip_error'
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
  } finally {
    response.removeListener?.('close', onClose);
    controller.abort();
  }
}
