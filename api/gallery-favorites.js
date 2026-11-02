import {
  GalleryError,
  getGalleryFavoriteSummary,
  listGalleryPhotos,
  resolveGallery,
  setGalleryFavorite,
  validatePhotoName,
} from '../server/dropbox-gallery.js';
import { hasCoupleSession, verifySelectionPin, coupleSessionCookie } from '../server/gallery-couple-auth.js';

const sendJson = (response, status, body) => {
  response.setHeader('Cache-Control', 'private, no-store');
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'private, no-store');
  response.end(JSON.stringify(body));
};

const parseBody = (body) => {
  if (typeof body === 'string') {
    return JSON.parse(body);
  }

  return body || {};
};

const normalizeVisitorId = (value) => {
  const visitorId = String(value || '').trim();

  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(visitorId)) {
    throw new GalleryError('Nie udało się zapisać wyboru.', 400, 'invalid_visitor_id');
  }

  return visitorId;
};

export default async function handler(request, response) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  try {
    const body = request.method === 'POST' ? parseBody(request.body) : {};
    const slug = request.method === 'POST' ? body.slug : request.query?.slug;
    const gallery = await resolveGallery(slug);
    const protectedSelection = gallery.kind === 'weddings';
    if (protectedSelection && body.action === 'unlock') {
      if (!verifySelectionPin(request, gallery, body.pin)) {
        return sendJson(response, 401, { error: 'Nieprawidłowy PIN lub zbyt wiele prób. Sprawdź kod i spróbuj ponownie później.' });
      }
      response.setHeader('Set-Cookie', coupleSessionCookie(gallery));
      return sendJson(response, 200, { unlocked: true, ...await getGalleryFavoriteSummary(gallery) });
    }
    if (protectedSelection && body.action === 'lock') {
      response.setHeader('Set-Cookie', coupleSessionCookie(gallery, true));
      return sendJson(response, 200, { unlocked: false, counts: {}, selected: [] });
    }
    if (protectedSelection && !hasCoupleSession(request, gallery)) {
      if (request.method === 'POST') return sendJson(response, 403, { error: 'Odblokuj wybór zdjęć PIN-em pary młodej.' });
      return sendJson(response, 200, { unlocked: false, configured: Boolean(gallery.selectionPinHash), counts: {}, selected: [] });
    }
    const visitorId = protectedSelection ? 'couple-selection' : normalizeVisitorId(
      request.method === 'POST' ? body.visitorId : request.query?.visitorId
    );

    if (request.method === 'GET') {
      const summary = await getGalleryFavoriteSummary(gallery, visitorId);
      return sendJson(response, 200, protectedSelection ? { unlocked: true, ...summary } : summary);
    }

    const photoName = validatePhotoName(body.photoName);
    const photos = await listGalleryPhotos(gallery);

    if (!photos.some((photo) => photo.name === photoName)) {
      throw new GalleryError('Nie znaleziono takiego zdjęcia.', 404, 'photo_not_found');
    }

    return sendJson(
      response,
      200,
      await setGalleryFavorite(gallery, visitorId, photoName, body.liked === true)
    );
  } catch (error) {
    const galleryError =
      error instanceof GalleryError
        ? error
        : new GalleryError('Nie udało się zapisać wyboru.', 500, 'gallery_favorite_error');

    return sendJson(response, galleryError.statusCode, {
      error: galleryError.message,
      code: galleryError.code,
    });
  }
}
