import { readOfferAccessToken } from '../server/offer-access-token.js';

const sendJson = (response, status, body) => {
  response.status(status).setHeader('Content-Type', 'application/json');
  response.setHeader('Cache-Control', 'private, no-store');
  response.end(JSON.stringify(body));
};

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  try {
    const token = Array.isArray(request.query?.token) ? request.query.token[0] : request.query?.token;
    const payload = readOfferAccessToken(token);

    if (payload.kind !== 'portraits_wedding') {
      return sendJson(response, 400, { error: 'Invalid offer type' });
    }

    return sendJson(response, 200, { ok: true, lead: payload.lead });
  } catch (error) {
    const expired = error instanceof Error && error.message.includes('expired');
    return sendJson(response, expired ? 410 : 400, {
      error: expired ? 'Link do oferty wygasł.' : 'Link do oferty jest nieprawidłowy.',
    });
  }
}
