import { isGalleryAdmin } from '../server/gallery-admin-auth.js';

const REQUIRED_SCOPES = [
  'files.metadata.read',
  'files.content.read',
  'files.content.write',
];

const sendJson = (response, status, body) => {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'private, no-store');
  response.end(JSON.stringify(body));
};

const readSecret = (value) => {
  const trimmed = String(value || '').trim();

  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
};

const parseBody = (body) => {
  if (typeof body === 'string') {
    return JSON.parse(body);
  }

  return body || {};
};

export default async function handler(request, response) {
  if (!isGalleryAdmin(request)) {
    return sendJson(response, 401, { error: 'Sesja panelu wygasła.' });
  }

  const appKey = readSecret(process.env.DROPBOX_APP_KEY);
  const appSecret = readSecret(process.env.DROPBOX_APP_SECRET);

  if (!appKey || !appSecret) {
    return sendJson(response, 503, {
      error: 'W Vercelu brakuje DROPBOX_APP_KEY lub DROPBOX_APP_SECRET.',
    });
  }

  if (request.method === 'GET') {
    const authorizeUrl = new URL('https://www.dropbox.com/oauth2/authorize');
    authorizeUrl.searchParams.set('client_id', appKey);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('token_access_type', 'offline');
    authorizeUrl.searchParams.set('force_reapprove', 'true');
    authorizeUrl.searchParams.set('scope', REQUIRED_SCOPES.join(' '));

    return sendJson(response, 200, { authorizeUrl: authorizeUrl.toString() });
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  let body;

  try {
    body = parseBody(request.body);
  } catch {
    return sendJson(response, 400, { error: 'Nieprawidłowy kod autoryzacji.' });
  }

  const code = String(body.code || '').trim();

  if (!code || code.length > 2048) {
    return sendJson(response, 400, { error: 'Wklej kod pokazany przez Dropbox.' });
  }

  try {
    const credentials = Buffer.from(`${appKey}:${appSecret}`).toString('base64');
    const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const tokenPayload = await tokenResponse.json().catch(() => null);

    if (!tokenResponse.ok) {
      return sendJson(response, 400, {
        error:
          tokenPayload?.error_description ||
          'Dropbox odrzucił kod. Wygeneruj nowy kod i spróbuj ponownie.',
      });
    }

    const grantedScopes = new Set(String(tokenPayload?.scope || '').split(/\s+/).filter(Boolean));
    const missingScopes = REQUIRED_SCOPES.filter((scope) => !grantedScopes.has(scope));

    if (missingScopes.length) {
      return sendJson(response, 400, {
        error: `Dropbox nie przyznał uprawnień: ${missingScopes.join(', ')}.`,
      });
    }

    if (!tokenPayload?.refresh_token) {
      return sendJson(response, 502, {
        error: 'Dropbox nie zwrócił refresh tokenu. Wygeneruj nowy kod.',
      });
    }

    return sendJson(response, 200, {
      refreshToken: tokenPayload.refresh_token,
      scopes: [...grantedScopes],
    });
  } catch (error) {
    return sendJson(response, 502, {
      error:
        error?.name === 'TimeoutError'
          ? 'Dropbox nie odpowiedział w ciągu 15 sekund.'
          : 'Nie udało się wymienić kodu na refresh token.',
    });
  }
}
