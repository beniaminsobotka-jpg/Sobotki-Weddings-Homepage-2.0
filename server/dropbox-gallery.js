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

const validateSlug = (slug) => {
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

export const resolveGallery = (rawSlug) => {
  const slug = validateSlug(rawSlug);
  const events = parseEventsConfig();
  const galleryRoot = normalizeDropboxPath(process.env.DROPBOX_GALLERY_ROOT || '/Galerie');

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
    };
  }

  return {
    slug,
    title: titleFromSlug(slug),
    date: '',
    folder: normalizeDropboxPath(`${galleryRoot}/${slug}`),
  };
};

const getAccessToken = async () => {
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;

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

  if (process.env.DROPBOX_ACCESS_TOKEN) {
    return process.env.DROPBOX_ACCESS_TOKEN;
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

    if (dropboxResponse.status === 409 && errorSummary.includes('not_found')) {
      throw new GalleryError('Nie znaleziono takiej galerii.', 404, 'gallery_not_found');
    }

    if (dropboxResponse.status === 401) {
      cachedAccessToken = null;
      cachedAccessTokenExpiresAt = 0;
    }

    throw new GalleryError(
      'Dropbox chwilowo nie odpowiada. Spróbuj ponownie za moment.',
      502,
      'dropbox_request_failed'
    );
  }

  return dropboxResponse.json();
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
      'Dropbox-API-Arg': JSON.stringify({
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
