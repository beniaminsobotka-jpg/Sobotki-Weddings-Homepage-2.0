import { createOfferAccessToken } from '../server/offer-access-token.js';
import { getPricingForDistance } from '../server/portrait-pricing.js';

const GLIWICE_COORDINATES = {
  latitude: 50.2945,
  longitude: 18.6714,
};

const MAX_VENUE_LENGTH = 180;
const OUT_OF_RANGE_MESSAGE =
  'Przepraszamy, aktualnie dojeżdżamy maksymalnie do 300 km od Gliwic (woj.śląskie)';

const sendJson = (response, status, body) => {
  response
    .status(status)
    .setHeader('Content-Type', 'application/json')
    .setHeader('Cache-Control', status === 200 ? 'public, s-maxage=86400, stale-while-revalidate=604800' : 'no-store');
  response.end(JSON.stringify(body));
};

const normalizeVenue = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, MAX_VENUE_LENGTH);
};

const fetchJson = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const result = await fetch(url, { ...options, signal: controller.signal });
    if (!result.ok) {
      throw new Error(`Upstream request failed with status ${result.status}`);
    }
    return await result.json();
  } finally {
    clearTimeout(timeout);
  }
};

const geocodeVenue = async (venue) => {
  const query = new URLSearchParams({
    q: `${venue}, Polska`,
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'pl',
    addressdetails: '1',
    email: 'kontakt@sobotkiweddings.pl',
  });

  const results = await fetchJson(`https://nominatim.openstreetmap.org/search?${query}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'SobotkiWeddings/1.0 (kontakt@sobotkiweddings.pl)',
    },
  });

  if (!Array.isArray(results) || results.length === 0) return null;

  const latitude = Number(results[0].lat);
  const longitude = Number(results[0].lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    latitude,
    longitude,
    displayName: String(results[0].display_name || venue),
  };
};

const getDrivingDistance = async (destination) => {
  const origin = `${GLIWICE_COORDINATES.longitude},${GLIWICE_COORDINATES.latitude}`;
  const target = `${destination.longitude},${destination.latitude}`;
  const route = await fetchJson(
    `https://router.project-osrm.org/route/v1/driving/${origin};${target}?overview=false&alternatives=false&steps=false`
  );

  const distanceMeters = Number(route?.routes?.[0]?.distance);
  if (route?.code !== 'Ok' || !Number.isFinite(distanceMeters)) return null;
  return distanceMeters;
};

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  const venue = normalizeVenue(request.query?.venue);
  if (!venue || venue.length < 3) {
    return sendJson(response, 400, {
      error: 'Podaj dokładną nazwę miejscowości lub sali.',
    });
  }

  try {
    const destination = await geocodeVenue(venue);
    if (!destination) {
      return sendJson(response, 404, {
        error: 'Nie udało się odnaleźć tej lokalizacji. Wpisz dokładniej miasto i nazwę sali.',
      });
    }

    const distanceMeters = await getDrivingDistance(destination);
    if (distanceMeters === null) {
      return sendJson(response, 422, {
        error: 'Nie udało się wyznaczyć trasy do tej lokalizacji. Wpisz dokładniejszy adres.',
      });
    }

    const distanceKm = Math.round(distanceMeters / 100) / 10;
    const pricing = getPricingForDistance(distanceMeters);

    if (!pricing) {
      return sendJson(response, 200, {
        ok: true,
        overLimit: true,
        distanceKm,
        resolvedLocation: destination.displayName,
        message: OUT_OF_RANGE_MESSAGE,
      });
    }

    const pricingQuote = createOfferAccessToken({
      kind: 'portraits_pricing_quote',
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
      quote: {
        venue,
        distanceKm,
        resolvedLocation: destination.displayName,
        tier: pricing.tier,
        prices: pricing.prices,
        quotedAt: new Date().toISOString(),
      },
    });

    return sendJson(response, 200, {
      ok: true,
      overLimit: false,
      distanceKm,
      resolvedLocation: destination.displayName,
      ...pricing,
      pricingQuote,
    });
  } catch (error) {
    console.error('[Travel Distance] Distance calculation failed', {
      venue,
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return sendJson(response, 502, {
      error: 'Nie udało się teraz sprawdzić odległości. Spróbuj ponownie za chwilę.',
    });
  }
}

export { getPricingForDistance };
