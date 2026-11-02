import { GalleryError, getGalleryKind, getGalleryRegistry, saveGalleryRegistry, validateGallerySlug } from '../server/dropbox-gallery.js';
import { hasCoupleSession } from '../server/gallery-couple-auth.js';
import { getVisibleVideoItems } from '../server/gallery-videos.js';

const send = (response, status, payload) => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'private, no-store');
  return response.status(status).end(JSON.stringify(payload));
};

export default async function handler(request, response) {
  if (!['GET', 'POST'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST');
    return send(response, 405, {error:'Method not allowed'});
  }
  try {
    let body = {};
    if (request.method === 'POST') {
      try { body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body || {}; }
      catch { return send(response,400,{error:'Nieprawidłowe dane.'}); }
    }
    const slug = validateGallerySlug(request.method === 'GET' ? request.query?.slug : body.slug);
    const registry = await getGalleryRegistry({fresh:true});
    if (registry?.galleries.some((gallery) => gallery.photosOnlySlug === slug && gallery.active !== false && getGalleryKind(gallery) === 'weddings')) {
      return request.method === 'GET'
        ? send(response,200,{public:false,canManage:false,videos:[]})
        : send(response,403,{error:'Ten link udostępnia wyłącznie zdjęcia.'});
    }
    const index = registry?.galleries.findIndex((gallery) => gallery.slug === slug && gallery.active !== false);
    const gallery = index >= 0 ? registry.galleries[index] : null;
    if (!gallery || getGalleryKind(gallery) !== 'weddings') return send(response,404,{error:'Nie znaleziono galerii.'});
    const unlocked = hasCoupleSession(request, gallery);
    if (request.method === 'POST') {
      if (!unlocked) return send(response,403,{error:'Wpisz PIN pary młodej, aby zmienić widoczność filmów.'});
      if (typeof body.public !== 'boolean') return send(response,400,{error:'Wybierz, czy filmy mają być widoczne dla gości.'});
      gallery.videosPublic = body.public;
      gallery.updatedAt = new Date().toISOString();
      await saveGalleryRegistry(registry);
    }
    return send(response,200,{
      public: gallery.videosPublic === true,
      canManage: unlocked,
      videos: unlocked || gallery.videosPublic === true ? getVisibleVideoItems(gallery.videos) : [],
    });
  } catch (error) {
    return send(response,error instanceof GalleryError ? error.statusCode : 500,{error:error instanceof GalleryError ? error.message : 'Nie udało się wczytać lub zapisać filmów.'});
  }
}
