import { isGalleryAdmin } from '../server/gallery-admin-auth.js';
import {
  buildPhotoPath,
  copyPhoto,
  ensureDropboxFolder,
  GalleryError,
  getBestOfGallery,
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

const listPhotosOrEmpty = async (gallery) => {
  try {
    return await listGalleryPhotos(gallery);
  } catch (error) {
    if (error instanceof GalleryError && error.code === 'gallery_not_found') {
      return [];
    }

    throw error;
  }
};

const buildBestOfPhotoName = (gallery, photoName) => {
  const lastDotIndex = photoName.lastIndexOf('.');
  const extension = lastDotIndex >= 0 ? photoName.slice(lastDotIndex) : '';
  let baseName = lastDotIndex >= 0 ? photoName.slice(0, lastDotIndex) : photoName;
  const prefix = `${gallery.slug}__`;

  while (Buffer.byteLength(`${prefix}${baseName}${extension}`, 'utf8') > 255) {
    baseName = baseName.slice(0, -1);
  }

  return `${prefix}${baseName}${extension}`;
};

const findAdminGallery = (registry, slug) =>
  slug === 'best-of'
    ? getBestOfGallery()
    : registry?.galleries.find((gallery) => gallery.slug === slug);

const getAdminData = async () => {
  const bestOfGallery = getBestOfGallery();
  const [registry, allFolders, bestOfPhotos] = await Promise.all([
    getGalleryRegistry({ fresh: true }),
    listGalleryFolders(),
    listPhotosOrEmpty(bestOfGallery),
  ]);
  const galleries = await Promise.all(
    (registry?.galleries || []).map(async (gallery) => {
      try {
        const photos = await listGalleryPhotos(gallery);
        return { ...gallery, photoCount: photos.length };
      } catch {
        return { ...gallery, photoCount: null };
      }
    })
  );

  return {
    galleries: galleries.sort(
      (first, second) =>
        Number(second.active) - Number(first.active) ||
        second.createdAt.localeCompare(first.createdAt)
    ),
    folders: allFolders.filter((folder) => folder.path !== bestOfGallery.folder),
    galleryRoot: getGalleryRoot(),
    bestOf: {
      ...bestOfGallery,
      photoCount: bestOfPhotos.length,
    },
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
        const gallery = findAdminGallery(registry, slug);

        if (!gallery) {
          return sendJson(response, 404, { error: 'Nie znaleziono galerii.' });
        }

        const photos = await listPhotosOrEmpty(gallery);

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
              downloadUrl: `/api/admin-gallery-photo?${query.toString()}&download=1`,
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

    if (action === 'add_to_best_of') {
      const slug = normalizeText(body.slug, 96).toLowerCase();
      const gallery = registry.galleries.find((item) => item.slug === slug);

      if (!gallery) {
        return sendJson(response, 404, { error: 'Nie znaleziono galerii.' });
      }

      if (gallery.publicationConsent !== 'granted') {
        return sendJson(response, 403, {
          error: 'Ta galeria nie ma potwierdzonej zgody na publikację wizerunku.',
        });
      }

      const requestedNames = Array.isArray(body.photoNames)
        ? [...new Set(body.photoNames.map((name) => normalizeText(name, 255)).filter(Boolean))]
        : [];

      if (!requestedNames.length) {
        return sendJson(response, 400, { error: 'Zaznacz przynajmniej jedno zdjęcie.' });
      }

      if (requestedNames.length > 100) {
        return sendJson(response, 413, {
          error: 'Jednorazowo możesz dodać do Best Of maksymalnie 100 zdjęć.',
        });
      }

      const sourcePhotos = await listGalleryPhotos(gallery);
      const sourcePhotosByName = new Map(sourcePhotos.map((photo) => [photo.name, photo]));

      if (requestedNames.some((name) => !sourcePhotosByName.has(name))) {
        return sendJson(response, 409, {
          error: 'Jednego z wybranych zdjęć nie ma już w galerii. Odśwież widok.',
        });
      }

      const bestOfGallery = getBestOfGallery();
      await ensureDropboxFolder(bestOfGallery.folder);
      const bestOfPhotos = await listGalleryPhotos(bestOfGallery);
      const existingNames = new Set(bestOfPhotos.map((photo) => photo.name));
      const photosToCopy = requestedNames
        .map((name) => ({
          sourceName: name,
          destinationName: buildBestOfPhotoName(gallery, name),
        }))
        .filter((photo) => !existingNames.has(photo.destinationName));

      for (let index = 0; index < photosToCopy.length; index += 6) {
        const batch = photosToCopy.slice(index, index + 6);
        await Promise.all(
          batch.map((photo) =>
            copyPhoto(
              buildPhotoPath(gallery, photo.sourceName),
              `${bestOfGallery.folder}/${photo.destinationName}`
            )
          )
        );
      }

      return sendJson(response, 200, {
        ...(await getAdminData()),
        addedCount: photosToCopy.length,
        skippedCount: requestedNames.length - photosToCopy.length,
      });
    }

    if (action === 'delete') {
      const slug = normalizeText(body.slug, 96).toLowerCase();
      const galleryIndex = registry.galleries.findIndex((gallery) => gallery.slug === slug);

      if (galleryIndex < 0) {
        return sendJson(response, 404, { error: 'Nie znaleziono galerii.' });
      }

      if (registry.galleries[galleryIndex].active) {
        return sendJson(response, 409, { error: 'Najpierw przenieś galerię do archiwum.' });
      }

      registry.galleries.splice(galleryIndex, 1);
      await saveGalleryRegistry(registry);
      return sendJson(response, 200, await getAdminData());
    }

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
    const publicationConsent = normalizeText(body.gallery?.publicationConsent, 16);
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

    if (publicationConsent !== 'granted' && publicationConsent !== 'denied') {
      return sendJson(response, 400, {
        error: 'Wybierz, czy klient wyraził zgodę na publikację wizerunku.',
      });
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
      publicationConsent,
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
