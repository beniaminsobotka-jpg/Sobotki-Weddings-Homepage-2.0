const DROPBOX_API_URL = 'https://api.dropboxapi.com/2';
const DROPBOX_CONTENT_URL = 'https://content.dropboxapi.com/2';
const IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'tif',
  'tiff',
  'bmp',
]);

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;
let cachedRegistry = undefined;
let cachedRegistryExpiresAt = 0;

export class GalleryError extends Error {
  constructor(message, statusCode = 500, code = 'gallery_error') {
    super(message);
    this.name = 'GalleryError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const normalizeDropboxPath = (value) => {
  const normalized = String(value || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/')
    .replace(/\/$/, '');

  if (!normalized || normalized === '/') {
    return '';
  }

  if (!normalized.startsWith('/') || normalized.split('/').includes('..')) {
    throw new GalleryError('Nieprawidłowa ścieżka galerii.', 500, 'invalid_gallery_path');
  }

  return normalized;
};

export const validateGallerySlug = (slug) => {
  const normalized = String(slug || '').trim().toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized) || normalized.length > 96) {
    throw new GalleryError('Nie znaleziono takiej galerii.', 404, 'gallery_not_found');
  }

  return normalized;
};

const titleFromSlug = (slug) =>
  slug
    .split('-')
    .map((part) => {
      if (part === 'i') {
        return part;
      }

      return `${part.charAt(0).toLocaleUpperCase('pl-PL')}${part.slice(1)}`;
    })
    .join(' ');

const parseEventsConfig = () => {
  const rawConfig = process.env.DROPBOX_GALLERY_EVENTS;

  if (!rawConfig) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawConfig);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Expected an object');
    }

    return parsed;
  } catch {
    throw new GalleryError(
      'Konfiguracja wydarzeń jest nieprawidłowa.',
      500,
      'invalid_events_config'
    );
  }
};

export const resolveGallery = async (rawSlug) => {
  const slug = validateGallerySlug(rawSlug);
  const events = parseEventsConfig();
  const galleryRoot = getGalleryRoot();
  const registry = await getGalleryRegistry();

  if (registry) {
    const registeredGallery = registry.galleries.find(
      (gallery) => gallery.slug === slug && gallery.active !== false
    );

    if (!registeredGallery) {
      throw new GalleryError('Nie znaleziono takiej galerii.', 404, 'gallery_not_found');
    }

    return {
      slug,
      title: registeredGallery.title,
      date: registeredGallery.date || '',
      folder: normalizeDropboxPath(registeredGallery.folder),
      coverPhoto: String(registeredGallery.coverPhoto || '').trim(),
    };
  }

  if (events) {
    const configuredEvent = events[slug];

    if (!configuredEvent) {
      throw new GalleryError('Nie znaleziono takiej galerii.', 404, 'gallery_not_found');
    }

    const event =
      typeof configuredEvent === 'string'
        ? { folder: configuredEvent }
        : configuredEvent;

    if (!event || typeof event !== 'object') {
      throw new GalleryError(
        'Konfiguracja galerii jest nieprawidłowa.',
        500,
        'invalid_event_config'
      );
    }

    return {
      slug,
      title: String(event.title || titleFromSlug(slug)).trim(),
      date: String(event.date || '').trim(),
      folder: normalizeDropboxPath(event.folder || `${galleryRoot}/${slug}`),
      coverPhoto: String(event.coverPhoto || '').trim(),
    };
  }

  if (process.env.GALLERY_ADMIN_PASSWORD) {
    throw new GalleryError('Nie znaleziono takiej galerii.', 404, 'gallery_not_found');
  }

  return {
    slug,
    title: titleFromSlug(slug),
    date: '',
    folder: normalizeDropboxPath(`${galleryRoot}/${slug}`),
    coverPhoto: '',
  };
};

export const getGalleryRoot = () =>
  normalizeDropboxPath(process.env.DROPBOX_GALLERY_ROOT || '/Galerie');

const readSecret = (value) => {
  const trimmed = String(value || '').trim();
  const unquoted =
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
      ? trimmed.slice(1, -1).trim()
      : trimmed;

  return unquoted;
};

const readAccessToken = (value) => readSecret(value).replace(/^Bearer\s+/i, '').trim();

const getAccessToken = async () => {
  const refreshToken = readSecret(process.env.DROPBOX_REFRESH_TOKEN);
  const appKey = readSecret(process.env.DROPBOX_APP_KEY);
  const appSecret = readSecret(process.env.DROPBOX_APP_SECRET);

  if (refreshToken && appKey && appSecret) {
    const now = Date.now();

    if (cachedAccessToken && now < cachedAccessTokenExpiresAt - 60_000) {
      return cachedAccessToken;
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    const credentials = Buffer.from(`${appKey}:${appSecret}`).toString('base64');
    const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!tokenResponse.ok) {
      throw new GalleryError(
        'Nie udało się połączyć galerii z Dropboxem.',
        502,
        'dropbox_auth_failed'
      );
    }

    const tokenPayload = await tokenResponse.json();

    if (!tokenPayload.access_token) {
      throw new GalleryError(
        'Dropbox nie zwrócił tokenu dostępu.',
        502,
        'dropbox_auth_failed'
      );
    }

    cachedAccessToken = tokenPayload.access_token;
    cachedAccessTokenExpiresAt = now + Number(tokenPayload.expires_in || 14_400) * 1000;
    return cachedAccessToken;
  }

  const accessToken = readAccessToken(process.env.DROPBOX_ACCESS_TOKEN);

  if (accessToken) {
    return accessToken;
  }

  throw new GalleryError(
    'Integracja Dropbox nie została jeszcze skonfigurowana.',
    503,
    'dropbox_not_configured'
  );
};

const readDropboxError = async (response) => {
  try {
    const payload = await response.json();
    return payload?.error_summary || payload?.error?.['.tag'] || '';
  } catch {
    return '';
  }
};

const throwDropboxAuthError = (response, errorSummary) => {
  if (response.status === 401 && errorSummary.includes('missing_scope')) {
    throw new GalleryError(
      'Aplikacja Dropbox nie ma wymaganych uprawnień. Zapisz uprawnienia i wygeneruj nowy token.',
      502,
      'dropbox_missing_scope'
    );
  }

  if (response.status === 401) {
    cachedAccessToken = null;
    cachedAccessTokenExpiresAt = 0;
    throw new GalleryError(
      'Token Dropbox jest nieprawidłowy albo wygasł. Wygeneruj nowy token.',
      502,
      'dropbox_invalid_token'
    );
  }
};

const dropboxRpc = async (endpoint, payload) => {
  const accessToken = await getAccessToken();
  const dropboxResponse = await fetch(`${DROPBOX_API_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!dropboxResponse.ok) {
    const errorSummary = await readDropboxError(dropboxResponse);

    throwDropboxAuthError(dropboxResponse, errorSummary);

    if (dropboxResponse.status === 409 && errorSummary.includes('not_found')) {
      throw new GalleryError('Nie znaleziono takiej galerii.', 404, 'gallery_not_found');
    }

    throw new GalleryError(
      'Dropbox chwilowo nie odpowiada. Spróbuj ponownie za moment.',
      502,
      'dropbox_request_failed'
    );
  }

  return dropboxResponse.json();
};

const normalizeRegistry = (payload) => {
  if (!payload || !Array.isArray(payload.galleries)) {
    throw new GalleryError(
      'Plik konfiguracji galerii jest nieprawidłowy.',
      500,
      'invalid_gallery_registry'
    );
  }

  const galleries = payload.galleries
    .filter((gallery) => gallery && typeof gallery === 'object')
    .map((gallery) => ({
      slug: validateGallerySlug(gallery.slug),
      title: String(gallery.title || '').trim(),
      date: String(gallery.date || '').trim(),
      folder: normalizeDropboxPath(gallery.folder),
      coverPhoto: String(gallery.coverPhoto || '').trim(),
      active: gallery.active !== false,
      createdAt: String(gallery.createdAt || ''),
      updatedAt: String(gallery.updatedAt || ''),
    }))
    .filter((gallery) => gallery.title && gallery.folder);

  return {
    version: 1,
    updatedAt: String(payload.updatedAt || ''),
    galleries,
  };
};

const getRegistryPath = () => `${getGalleryRoot()}/_sobotki-galleries.json`;

const stringifyDropboxHeader = (payload) =>
  JSON.stringify(payload).replace(/[\u007f-\uffff]/g, (character) =>
    `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`
  );

export const getGalleryRegistry = async ({ fresh = false } = {}) => {
  const now = Date.now();

  if (!fresh && cachedRegistryExpiresAt > now) {
    return cachedRegistry;
  }

  const accessToken = await getAccessToken();
  const dropboxResponse = await fetch(`${DROPBOX_CONTENT_URL}/files/download`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Dropbox-API-Arg': stringifyDropboxHeader({ path: getRegistryPath() }),
    },
  });

  if (!dropboxResponse.ok) {
    const errorSummary = await readDropboxError(dropboxResponse);

    throwDropboxAuthError(dropboxResponse, errorSummary);

    if (dropboxResponse.status === 409 && errorSummary.includes('not_found')) {
      cachedRegistry = null;
      cachedRegistryExpiresAt = now + 5_000;
      return null;
    }

    throw new GalleryError(
      'Nie udało się odczytać konfiguracji galerii.',
      502,
      'gallery_registry_read_failed'
    );
  }

  try {
    cachedRegistry = normalizeRegistry(await dropboxResponse.json());
    cachedRegistryExpiresAt = now + 5_000;
    return cachedRegistry;
  } catch (error) {
    if (error instanceof GalleryError) {
      throw error;
    }

    throw new GalleryError(
      'Plik konfiguracji galerii jest nieprawidłowy.',
      500,
      'invalid_gallery_registry'
    );
  }
};

const ensureGalleryRoot = async () => {
  try {
    await dropboxRpc('files/get_metadata', {
      path: getGalleryRoot(),
      include_deleted: false,
    });
  } catch (error) {
    if (!(error instanceof GalleryError) || error.code !== 'gallery_not_found') {
      throw error;
    }

    await dropboxRpc('files/create_folder_v2', {
      path: getGalleryRoot(),
      autorename: false,
    });
  }
};

export const saveGalleryRegistry = async (registry) => {
  await ensureGalleryRoot();
  const normalized = normalizeRegistry({
    ...registry,
    version: 1,
    updatedAt: new Date().toISOString(),
  });
  const accessToken = await getAccessToken();
  const dropboxResponse = await fetch(`${DROPBOX_CONTENT_URL}/files/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': stringifyDropboxHeader({
        path: getRegistryPath(),
        mode: 'overwrite',
        autorename: false,
        mute: true,
        strict_conflict: false,
      }),
    },
    body: JSON.stringify(normalized, null, 2),
  });

  if (!dropboxResponse.ok) {
    throw new GalleryError(
      'Nie udało się zapisać konfiguracji galerii.',
      502,
      'gallery_registry_write_failed'
    );
  }

  cachedRegistry = normalized;
  cachedRegistryExpiresAt = Date.now() + 5_000;
  return normalized;
};

export const listGalleryFolders = async () => {
  await ensureGalleryRoot();
  let result = await dropboxRpc('files/list_folder', {
    path: getGalleryRoot(),
    recursive: false,
    include_deleted: false,
    include_non_downloadable_files: false,
    limit: 2000,
  });
  const entries = [...result.entries];

  while (result.has_more) {
    result = await dropboxRpc('files/list_folder/continue', {
      cursor: result.cursor,
    });
    entries.push(...result.entries);
  }

  return entries
    .filter((entry) => entry?.['.tag'] === 'folder')
    .map((entry) => ({
      name: entry.name,
      path: normalizeDropboxPath(entry.path_display || entry.path_lower),
    }))
    .sort((first, second) => first.name.localeCompare(second.name, 'pl'));
};

const getFileExtension = (name) => {
  const lastDotIndex = name.lastIndexOf('.');
  return lastDotIndex >= 0 ? name.slice(lastDotIndex + 1).toLowerCase() : '';
};

export const validatePhotoName = (rawName) => {
  const name = String(rawName || '').trim();

  if (
    !name ||
    name.length > 255 ||
    name.includes('/') ||
    name.includes('\\') ||
    name === '.' ||
    name === '..' ||
    !IMAGE_EXTENSIONS.has(getFileExtension(name))
  ) {
    throw new GalleryError('Nie znaleziono takiego zdjęcia.', 404, 'photo_not_found');
  }

  return name;
};

export const buildPhotoPath = (gallery, rawName) =>
  `${gallery.folder}/${validatePhotoName(rawName)}`;

export const listGalleryPhotos = async (gallery) => {
  let result = await dropboxRpc('files/list_folder', {
    path: gallery.folder,
    recursive: false,
    include_deleted: false,
    include_non_downloadable_files: false,
    limit: 2000,
  });
  const entries = [...result.entries];

  while (result.has_more) {
    result = await dropboxRpc('files/list_folder/continue', {
      cursor: result.cursor,
    });
    entries.push(...result.entries);
  }

  return entries
    .filter(
      (entry) =>
        entry?.['.tag'] === 'file' &&
        IMAGE_EXTENSIONS.has(getFileExtension(entry.name || ''))
    )
    .sort(
      (first, second) =>
        new Date(second.client_modified || second.server_modified || 0).getTime() -
        new Date(first.client_modified || first.server_modified || 0).getTime()
    )
    .map((entry) => ({
      id: entry.id || `${entry.name}:${entry.rev}`,
      name: entry.name,
      rev: entry.rev,
      modifiedAt: entry.client_modified || entry.server_modified,
      size: entry.size,
    }));
};

export const getPhotoThumbnail = async (path, requestedSize) => {
  const accessToken = await getAccessToken();
  const size = requestedSize === 'large' ? 'w2048h1536' : 'w960h640';
  const dropboxResponse = await fetch(`${DROPBOX_CONTENT_URL}/files/get_thumbnail_v2`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Dropbox-API-Arg': stringifyDropboxHeader({
        resource: {
          '.tag': 'path',
          path,
        },
        format: 'jpeg',
        size,
        mode: 'bestfit',
      }),
    },
  });

  if (!dropboxResponse.ok) {
    return null;
  }

  return dropboxResponse;
};

export const getTemporaryPhotoLink = async (path) => {
  const result = await dropboxRpc('files/get_temporary_link', { path });

  if (!result.link) {
    throw new GalleryError(
      'Nie udało się przygotować zdjęcia do pobrania.',
      502,
      'download_link_failed'
    );
  }

  return result.link;
};

export const getPhotoFile = async (path) => {
  const accessToken = await getAccessToken();
  const dropboxResponse = await fetch(`${DROPBOX_CONTENT_URL}/files/download`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Dropbox-API-Arg': stringifyDropboxHeader({ path }),
    },
  });

  if (!dropboxResponse.ok) {
    const errorSummary = await readDropboxError(dropboxResponse);

    throwDropboxAuthError(dropboxResponse, errorSummary);

    if (dropboxResponse.status === 409 && errorSummary.includes('not_found')) {
      throw new GalleryError('Nie znaleziono takiego zdjęcia.', 404, 'photo_not_found');
    }

    throw new GalleryError(
      'Nie udało się pobrać jednego ze zdjęć.',
      502,
      'photo_download_failed'
    );
  }

  return dropboxResponse;
};
