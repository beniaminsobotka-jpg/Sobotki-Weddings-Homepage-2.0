import {
  GalleryError,
  buildPhotoPath,
  getTemporaryPhotoLink,
  resolveGallery,
} from '../server/dropbox-gallery.js';

const sendJson = (response, status, body) => {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
};

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  try {
    const gallery = await resolveGallery(request.query?.slug);
    const photoPath = buildPhotoPath(gallery, request.query?.name);
    const temporaryLink = await getTemporaryPhotoLink(photoPath);

    response.setHeader('Cache-Control', 'private, no-store');
    return response.redirect(302, temporaryLink);
  } catch (error) {
    const galleryError =
      error instanceof GalleryError
        ? error
        : new GalleryError(
            'Nie udało się przygotować zdjęcia do pobrania.',
            500,
            'download_error'
          );

    return sendJson(response, galleryError.statusCode, {
      error: galleryError.message,
      code: galleryError.code,
    });
  }
}
