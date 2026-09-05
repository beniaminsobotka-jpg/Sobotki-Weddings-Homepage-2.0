import { isGalleryAdmin } from '../server/gallery-admin-auth.js';
import {
  GalleryError,
  getBestOfGallery,
  listGalleryPhotos,
} from '../server/dropbox-gallery.js';

const sendJson = (response, status, body) => {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'private, no-store');
  response.end(JSON.stringify(body));
};

export default async function handler(request, response) {
  if (!isGalleryAdmin(request)) {
    return sendJson(response, 401, { error: 'Zaloguj się w panelu, aby otworzyć Best Of.' });
  }

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  try {
    const gallery = getBestOfGallery();
    let photos = [];

    try {
      photos = await listGalleryPhotos(gallery);
    } catch (error) {
      if (!(error instanceof GalleryError) || error.code !== 'gallery_not_found') {
        throw error;
      }
    }

    return sendJson(response, 200, {
      gallery: {
        slug: gallery.slug,
        title: gallery.title,
        photoCount: photos.length,
      },
      photos: photos.map((photo) => {
        const query = new URLSearchParams({
          slug: gallery.slug,
          name: photo.name,
          rev: photo.rev,
        });

        return {
          id: photo.id,
          name: photo.name,
          thumbnailUrl: `/api/admin-gallery-photo?${query.toString()}`,
          largeUrl: `/api/admin-gallery-photo?${query.toString()}&size=large`,
          downloadUrl: `/api/admin-gallery-photo?${query.toString()}&download=1`,
        };
      }),
    });
  } catch (error) {
    const galleryError =
      error instanceof GalleryError
        ? error
        : new GalleryError('Nie udało się wczytać Best Of.', 500, 'best_of_error');

    return sendJson(response, galleryError.statusCode, {
      error: galleryError.message,
      code: galleryError.code,
    });
  }
}
