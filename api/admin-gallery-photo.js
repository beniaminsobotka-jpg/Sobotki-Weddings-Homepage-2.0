import { isGalleryAdmin } from '../server/gallery-admin-auth.js';
import {
  buildPhotoPath,
  GalleryError,
  getBestOfGallery,
  getGalleryRegistry,
  getPhotoThumbnail,
  getTemporaryPhotoLink,
  validateGallerySlug,
} from '../server/dropbox-gallery.js';

const sendJson = (response, status, body) => {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'private, no-store');
  response.end(JSON.stringify(body));
};

export default async function handler(request, response) {
  if (!isGalleryAdmin(request)) {
    return sendJson(response, 401, { error: 'Sesja panelu wygasła.' });
  }

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  try {
    const slug = validateGallerySlug(request.query?.slug);
    const registry = await getGalleryRegistry();
    const gallery =
      slug === 'best-of'
        ? getBestOfGallery()
        : registry?.galleries.find((item) => item.slug === slug);

    if (!gallery) {
      throw new GalleryError('Nie znaleziono galerii.', 404, 'gallery_not_found');
    }

    const photoPath = buildPhotoPath(gallery, request.query?.name);

    if (request.query?.download === '1') {
      response.setHeader('Cache-Control', 'private, no-store');
      return response.redirect(302, await getTemporaryPhotoLink(photoPath));
    }

    const thumbnail = await getPhotoThumbnail(photoPath, 'small');

    if (!thumbnail) {
      return response.redirect(302, await getTemporaryPhotoLink(photoPath));
    }

    const imageBuffer = Buffer.from(await thumbnail.arrayBuffer());
    response.setHeader('Content-Type', 'image/jpeg');
    response.setHeader('Cache-Control', 'private, max-age=300');
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
