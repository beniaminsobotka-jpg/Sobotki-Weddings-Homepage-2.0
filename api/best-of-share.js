import { buildPhotoPath, getBestOfGallery, GalleryError, getPhotoThumbnail, listGalleryPhotos } from '../server/dropbox-gallery.js';
import { isValidBestOfShareToken, encodeBestOfPhoto, decodeBestOfPhoto } from '../server/gallery-admin-auth.js';

export default async function handler(request, response) {
  response.setHeader('X-Robots-Tag', 'noindex, nofollow');
  response.setHeader('Cache-Control', 'private, no-store');
  const send = (status, data) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    return response.status(status).end(JSON.stringify(data));
  };

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return send(405, { error: 'Method not allowed' });
  }

  const { token, photo: reference, size } = request.query || {};
  if (!isValidBestOfShareToken(token)) {
    return send(404, { error: 'Ten link do Best Of jest niedostępny.' });
  }

  try {
    const gallery = getBestOfGallery();
    if (reference !== undefined) {
      const name = decodeBestOfPhoto(reference);
      if (!name) return send(404, { error: 'Nie znaleziono zdjęcia.' });
      const image = await getPhotoThumbnail(buildPhotoPath(gallery, name), size === 'large' ? 'large' : 'small');
      if (!image) return send(404, { error: 'Nie znaleziono zdjęcia.' });
      response.setHeader('Content-Type', 'image/jpeg');
      response.setHeader('Cache-Control', 'private, max-age=300');
      return response.status(200).end(Buffer.from(await image.arrayBuffer()));
    }

    const photos = await listGalleryPhotos(gallery).catch((error) => {
      if (error instanceof GalleryError && error.code === 'gallery_not_found') return [];
      throw error;
    });

    return send(200, {
      gallery: { slug: gallery.slug, title: gallery.title, photoCount: photos.length },
      photos: photos.map((photo) => {
        const query = new URLSearchParams({
          token, photo: encodeBestOfPhoto(photo.name),
        });
        const url = `/api/best-of-share?${query}`;
        return { id: photo.id, thumbnailUrl: url, largeUrl: `${url}&size=large` };
      }),
    });
  } catch (error) {
    if (error instanceof GalleryError && error.statusCode === 404) return send(404, { error: error.message });
    return send(502, { error: 'Nie udało się wczytać Best Of. Spróbuj ponownie za chwilę.' });
  }
}
