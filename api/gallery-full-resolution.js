import {
  GalleryError,
  listGalleryPhotos,
  listMatchedFullResolutionPhotos,
  resolveGallery,
} from '../server/dropbox-gallery.js';

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

    const [galleryPhotos, photos] = await Promise.all([
      listGalleryPhotos(gallery),
      listMatchedFullResolutionPhotos(gallery),
    ]);

    return sendJson(response, 200, {
      galleryPhotoCount: galleryPhotos.length,
      matchedPhotoCount: photos.length,
      missingPhotoCount: Math.max(0, galleryPhotos.length - photos.length),
      photos: photos.map((photo) => ({
        id: photo.id,
        name: photo.name,
        galleryPhotoName: photo.galleryPhotoName,
        size: photo.size,
        modifiedAt: photo.modifiedAt,
      })),
    });
  } catch (error) {
    const galleryError =
      error instanceof GalleryError
        ? error
        : new GalleryError(
            'Nie udało się wczytać zdjęć w pełnej rozdzielczości.',
            500,
            'full_resolution_manifest_error'
          );

    return sendJson(response, galleryError.statusCode, {
      error: galleryError.message,
      code: galleryError.code,
    });
  }
}
