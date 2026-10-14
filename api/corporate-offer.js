import {
  renderExpiredWarszawiankaOffer,
  renderWarszawiankaOffer,
  warszawiankaOffer,
} from '../server/offer-archive/warszawianka-2026.js';

export default function handler(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD');
    return response.status(405).end();
  }

  response.setHeader('Cache-Control', 'private, no-store, max-age=0');
  response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.setHeader('Content-Type', 'text/html; charset=utf-8');

  const slug = Array.isArray(request.query?.slug) ? request.query.slug[0] : request.query?.slug;
  if (slug !== warszawiankaOffer.slug) {
    return response.status(404).end(request.method === 'HEAD' ? '' : 'Nie znaleziono oferty.');
  }

  const expired = Date.now() >= Date.parse(warszawiankaOffer.expiresAt);
  const html = expired ? renderExpiredWarszawiankaOffer() : renderWarszawiankaOffer();
  return response.status(expired ? 410 : 200).end(request.method === 'HEAD' ? '' : html);
}
