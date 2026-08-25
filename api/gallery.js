import {
  GalleryError,
  listGalleryPhotos,
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
    const photos = await listGalleryPhotos(gallery);
    const coverPhoto = photos.find((photo) => photo.name === gallery.coverPhoto);
    const coverQuery = coverPhoto
      ? new URLSearchParams({
          slug: gallery.slug,
          name: coverPhoto.name,
          rev: coverPhoto.rev,
          size: 'large',
        })
      : null;

    response.setHeader(
      'Cache-Control',
      'public, max-age=0, s-maxage=5, stale-while-revalidate=20'
    );

    return sendJson(response, 200, {
      gallery: {
        slug: gallery.slug,
        title: gallery.title,
        date: gallery.date,
        coverUrl: coverQuery ? `/api/gallery-photo?${coverQuery.toString()}` : '',
      },
      photos: photos.map((photo) => {
        const query = new URLSearchParams({
          slug: gallery.slug,
          name: photo.name,
          rev: photo.rev,
        });

        return {
          ...photo,
          thumbnailUrl: `/api/gallery-photo?${query.toString()}`,
          largeUrl: `/api/gallery-photo?${query.toString()}&size=large`,
          downloadUrl: `/api/gallery-download?${query.toString()}`,
        };
      }),
      refreshAfterMs: 10_000,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const galleryError =
      error instanceof GalleryError
        ? error
        : new GalleryError('Nie udało się wczytać galerii.', 500, 'gallery_error');

    return sendJson(response, galleryError.statusCode, {
      error: galleryError.message,
      code: galleryError.code,
    });
  }
}
