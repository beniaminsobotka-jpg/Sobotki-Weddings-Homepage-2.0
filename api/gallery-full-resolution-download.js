import {
  GalleryError,
  getDropboxFolderZip,
  listGalleryFullResolutionPhotos,
  listGalleryPhotos,
  resolveGallery,
} from '../server/dropbox-gallery.js';

const MAX_SINGLE_ZIP_BYTES = 2 * 1024 * 1024 * 1024;

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

  try {
    const gallery = await resolveGallery(request.query?.slug);

    if (!gallery.fullResolutionFolder) {
      throw new GalleryError(
        'Pełna rozdzielczość nie jest jeszcze dostępna dla tej galerii.',
        404,
        'full_resolution_folder_missing'
      );
    }

    const [galleryPhotos, fullResolutionPhotos] = await Promise.all([
      listGalleryPhotos(gallery),
      listGalleryFullResolutionPhotos(gallery),
    ]);
    const fullResolutionNames = new Set(
      fullResolutionPhotos.map((photo) => photo.name.toLocaleLowerCase('pl-PL'))
    );
    const missingPhotoCount = galleryPhotos.filter(
      (photo) => !fullResolutionNames.has(photo.name.toLocaleLowerCase('pl-PL'))
    ).length;

    if (missingPhotoCount > 0) {
      throw new GalleryError(
        `Pełna galeria jest jeszcze przygotowywana — brakuje ${missingPhotoCount} oryginalnych plików.`,
        409,
        'full_resolution_incomplete'
      );
    }

    const totalBytes = fullResolutionPhotos.reduce(
      (total, photo) => total + Math.max(0, Number(photo.size) || 0),
      0
    );

    if (totalBytes > MAX_SINGLE_ZIP_BYTES) {
      throw new GalleryError(
        'Galeria przekracza limit 2 GB dla jednej paczki ZIP.',
        413,
        'single_zip_too_large'
      );
    }

    const dropboxZip = await getDropboxFolderZip(gallery.fullResolutionFolder);

    if (!dropboxZip.body) {
      throw new GalleryError(
        'Dropbox nie zwrócił paczki ZIP.',
        502,
        'dropbox_zip_empty'
      );
    }

    response.status(200);
    response.setHeader('Content-Type', 'application/zip');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="sobotki-${gallery.slug}-pelna-rozdzielczosc.zip"`
    );
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Accel-Buffering', 'no');

    const reader = dropboxZip.body.getReader();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (!response.write(Buffer.from(value))) {
        await new Promise((resolve) => response.once('drain', resolve));
      }
    }

    return response.end();
  } catch (error) {
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
  }
}
