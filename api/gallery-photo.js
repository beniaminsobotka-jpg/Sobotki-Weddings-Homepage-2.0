import {
  GalleryError,
  buildPhotoPath,
  getPhotoThumbnail,
  listGalleryPhotos,
  getTemporaryPhotoLink,
  resolveGallery,
} from '../server/dropbox-gallery.js';
import { createGalleryShareImage } from '../server/gallery-share-image.js';

const sendJson = (response, status, body) => {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
};

export default async function handler(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD');
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  try {
    const gallery = await resolveGallery(request.query?.slug);
    if (request.query?.size === 'share') {
      const photos = await listGalleryPhotos(gallery);
      const cover = photos.find((photo) => photo.name === gallery.coverPhoto) || photos[0];
      let source = null;
      if (cover) {
        const thumbnail = await getPhotoThumbnail(buildPhotoPath(gallery, cover.name), 'large');
        if (!thumbnail) throw new GalleryError('Okładka jest chwilowo niedostępna.', 502, 'share_cover_unavailable');
        source = Buffer.from(await thumbnail.arrayBuffer());
      }
      const output = await createGalleryShareImage(source, gallery);
      response.setHeader('Content-Type', 'image/jpeg');
      response.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400');
      response.setHeader('Content-Length', String(output.length));
      return response.status(200).end(request.method === 'HEAD' ? undefined : output);
    }
    const photoPath = buildPhotoPath(gallery, request.query?.name);

    if (request.query?.size === 'original') {
      response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=7200');
      return response.redirect(302, await getTemporaryPhotoLink(photoPath));
    }

    const requestedSize =
      request.query?.size === 'large'
        ? 'large'
        : request.query?.size === 'preview'
          ? 'preview'
          : 'small';
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
    return response.status(200).end(request.method === 'HEAD' ? undefined : imageBuffer);
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
