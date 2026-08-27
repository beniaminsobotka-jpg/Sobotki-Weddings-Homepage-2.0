import {
  GalleryError,
  buildPhotoPath,
  getPhotoThumbnail,
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
    const requestedSize = request.query?.size === 'large' ? 'large' : 'small';
    const thumbnail = await getPhotoThumbnail(photoPath, requestedSize);

    if (!thumbnail) {
      const fallbackLink = await getTemporaryPhotoLink(photoPath);
      response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=7200');
      return response.redirect(302, fallbackLink);
    }

    const imageBuffer = Buffer.from(await thumbnail.arrayBuffer());
    response.setHeader('Content-Type', 'image/jpeg');
    response.setHeader(
      'Cache-Control',
      'public, max-age=31536000, s-maxage=31536000, immutable'
    );
    response.setHeader('Content-Length', String(imageBuffer.byteLength));
    return response.status(200).end(imageBuffer);
  } catch (error) {
    const galleryError =
      error instanceof GalleryError
        ? error
        : new GalleryError('Nie udało się wczytać zdjęcia.', 500, 'photo_error');

    return sendJson(response, galleryError.statusCode, {
      error: galleryError.message,
      code: galleryError.code,
    });
  }
}
