import { isGalleryAdmin } from '../server/gallery-admin-auth.js';
import {
  GalleryError,
  getGalleryRegistry,
  getGalleryRoot,
  listGalleryFolders,
  listGalleryPhotos,
  saveGalleryRegistry,
  validateGallerySlug,
} from '../server/dropbox-gallery.js';

const sendJson = (response, status, body) => {
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

const normalizeText = (value, maxLength) => String(value || '').trim().slice(0, maxLength);

const getAdminData = async () => {
  const [registry, folders] = await Promise.all([
    getGalleryRegistry({ fresh: true }),
    listGalleryFolders(),
  ]);

  return {
    galleries: [...(registry?.galleries || [])].sort(
      (first, second) =>
        Number(second.active) - Number(first.active) ||
        second.createdAt.localeCompare(first.createdAt)
    ),
    folders,
    galleryRoot: getGalleryRoot(),
  };
};

export default async function handler(request, response) {
  if (!isGalleryAdmin(request)) {
    return sendJson(response, 401, { error: 'Sesja panelu wygasła.' });
  }

  try {
    if (request.method === 'GET') {
      if (request.query?.photosFor) {
        const slug = validateGallerySlug(request.query.photosFor);
        const registry = await getGalleryRegistry({ fresh: true });
        const gallery = registry?.galleries.find((item) => item.slug === slug);

        if (!gallery) {
          return sendJson(response, 404, { error: 'Nie znaleziono galerii.' });
        }

        const photos = await listGalleryPhotos(gallery);

        return sendJson(response, 200, {
          coverPhoto: gallery.coverPhoto || '',
          photos: photos.map((photo) => {
            const query = new URLSearchParams({
              slug,
              name: photo.name,
              rev: photo.rev,
            });

            return {
              id: photo.id,
              name: photo.name,
              thumbnailUrl: `/api/admin-gallery-photo?${query.toString()}`,
            };
          }),
        });
      }

      return sendJson(response, 200, await getAdminData());
    }

    if (request.method !== 'POST') {
      response.setHeader('Allow', 'GET, POST');
      return sendJson(response, 405, { error: 'Method not allowed' });
    }

    let body;

    try {
      body = parseBody(request.body);
    } catch {
      return sendJson(response, 400, { error: 'Nieprawidłowe dane formularza.' });
    }

    const action = normalizeText(body.action, 32);
    const registry = (await getGalleryRegistry({ fresh: true })) || {
      version: 1,
      updatedAt: '',
      galleries: [],
    };

    if (action === 'set_cover') {
      const slug = normalizeText(body.slug, 96).toLowerCase();
      const photoName = normalizeText(body.photoName, 255);
      const galleryIndex = registry.galleries.findIndex((gallery) => gallery.slug === slug);

      if (galleryIndex < 0) {
        return sendJson(response, 404, { error: 'Nie znaleziono galerii.' });
      }

      if (photoName) {
        const photos = await listGalleryPhotos(registry.galleries[galleryIndex]);

        if (!photos.some((photo) => photo.name === photoName)) {
          return sendJson(response, 400, { error: 'Nie znaleziono wybranego zdjęcia.' });
        }
      }

      registry.galleries[galleryIndex] = {
        ...registry.galleries[galleryIndex],
        coverPhoto: photoName,
        updatedAt: new Date().toISOString(),
      };
      await saveGalleryRegistry(registry);
      return sendJson(response, 200, await getAdminData());
    }

    if (action === 'set_active') {
      const slug = normalizeText(body.slug, 96).toLowerCase();
      const galleryIndex = registry.galleries.findIndex((gallery) => gallery.slug === slug);

      if (galleryIndex < 0) {
        return sendJson(response, 404, { error: 'Nie znaleziono galerii.' });
      }

      registry.galleries[galleryIndex] = {
        ...registry.galleries[galleryIndex],
        active: body.active === true,
        updatedAt: new Date().toISOString(),
      };
      await saveGalleryRegistry(registry);
      return sendJson(response, 200, await getAdminData());
    }

    if (action !== 'save') {
      return sendJson(response, 400, { error: 'Nieznana operacja.' });
    }

    const title = normalizeText(body.gallery?.title, 100);
    const date = normalizeText(body.gallery?.date, 100);
    const folder = normalizeText(body.gallery?.folder, 512);
    const originalSlug = normalizeText(body.gallery?.originalSlug, 96).toLowerCase();
    let slug;

    try {
      slug = validateGallerySlug(body.gallery?.slug);
    } catch {
      return sendJson(response, 400, {
        error: 'Adres może zawierać tylko małe litery, cyfry i myślniki.',
      });
    }

    if (!title) {
      return sendJson(response, 400, { error: 'Podaj nazwę galerii.' });
    }

    const availableFolders = await listGalleryFolders();

    if (!availableFolders.some((availableFolder) => availableFolder.path === folder)) {
      return sendJson(response, 400, {
        error: `Wybierz folder znajdujący się w ${getGalleryRoot()}.`,
      });
    }

    const existingIndex = originalSlug
      ? registry.galleries.findIndex((gallery) => gallery.slug === originalSlug)
      : -1;
    const slugTaken = registry.galleries.some(
      (gallery, index) => gallery.slug === slug && index !== existingIndex
    );

    if (slugTaken) {
      return sendJson(response, 409, { error: 'Ten adres galerii jest już zajęty.' });
    }

    const now = new Date().toISOString();
    const savedGallery = {
      slug,
      title,
      date,
      folder,
      coverPhoto:
        existingIndex >= 0 ? String(registry.galleries[existingIndex].coverPhoto || '') : '',
      active: body.gallery?.active !== false,
      createdAt: existingIndex >= 0 ? registry.galleries[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      registry.galleries[existingIndex] = savedGallery;
    } else {
      registry.galleries.push(savedGallery);
    }

    await saveGalleryRegistry(registry);
    return sendJson(response, 200, await getAdminData());
  } catch (error) {
    const galleryError =
      error instanceof GalleryError
        ? error
        : new GalleryError('Nie udało się zapisać galerii.', 500, 'admin_gallery_error');

    return sendJson(response, galleryError.statusCode, {
      error: galleryError.message,
      code: galleryError.code,
    });
  }
}
