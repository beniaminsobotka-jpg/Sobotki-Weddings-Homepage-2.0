import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  isGalleryAdmin,
  isGalleryAdminConfigured,
  verifyAdminPassword,
} from '../server/gallery-admin-auth.js';

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

export default async function handler(request, response) {
  if (request.method === 'GET') {
    return sendJson(response, 200, {
      configured: isGalleryAdminConfigured(),
      authenticated: isGalleryAdmin(request),
    });
  }

  if (request.method === 'DELETE') {
    response.setHeader('Set-Cookie', clearAdminSessionCookie());
    return sendJson(response, 200, { ok: true });
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST, DELETE');
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  if (!isGalleryAdminConfigured()) {
    return sendJson(response, 503, {
      error: 'Panel nie został jeszcze skonfigurowany w Vercelu.',
      code: 'admin_not_configured',
    });
  }

  let body;

  try {
    body = parseBody(request.body);
  } catch {
    return sendJson(response, 400, { error: 'Nieprawidłowe dane logowania.' });
  }

  if (!verifyAdminPassword(request, body.password)) {
    return sendJson(response, 401, { error: 'Nieprawidłowe hasło.' });
  }

  response.setHeader('Set-Cookie', createAdminSessionCookie());
  return sendJson(response, 200, { ok: true });
}
