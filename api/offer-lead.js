const BREVO_CONTACTS_API_URL = 'https://api.brevo.com/v3/contacts';

const sendJson = (response, status, body) => {
  response.status(status).setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
};

const normalizeString = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

const splitName = (fullName) => {
  const normalizedFullName = normalizeString(fullName);
  const parts = normalizedFullName.split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return {
      firstName: normalizedFullName,
      lastName: '',
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};

const parseJsonBody = (body) => {
  if (typeof body === 'string') {
    return JSON.parse(body);
  }

  return body ?? {};
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  let parsedBody;

  try {
    parsedBody = parseJsonBody(request.body);
  } catch {
    return sendJson(response, 400, { error: 'Invalid JSON body' });
  }

  const name = normalizeString(parsedBody.name);
  const email = normalizeString(parsedBody.email).toLowerCase();
  const weddingDate = normalizeString(parsedBody.weddingDate);
  const timestamp = normalizeString(parsedBody.timestamp) || new Date().toISOString();

  if (!name) {
    return sendJson(response, 400, { error: 'name is required' });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendJson(response, 400, { error: 'A valid email is required' });
  }

  if (!weddingDate) {
    return sendJson(response, 400, { error: 'weddingDate is required' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID_OFFER);

  if (!apiKey || !Number.isInteger(listId) || listId <= 0) {
    console.warn('[Offer Lead] Brevo skipped - missing BREVO_API_KEY or BREVO_LIST_ID_OFFER');
    return sendJson(response, 200, {
      ok: true,
      skipped: true,
      reason: 'Brevo env vars are not configured',
    });
  }

  const { firstName, lastName } = splitName(name);

  const brevoPayload = {
    email,
    attributes: {
      FULLNAME: name,
      FIRSTNAME: firstName,
      LASTNAME: lastName,
      WEDDING_DATE: weddingDate,
      MESSAGE: `Lead z ukrytej oferty 2027/2028\nTimestamp: ${timestamp}\nSource: hidden_offer_2027_2028`,
    },
    listIds: [listId],
    updateEnabled: true,
  };

  try {
    const brevoResponse = await fetch(BREVO_CONTACTS_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(brevoPayload),
    });

    if (!brevoResponse.ok) {
      const details = await brevoResponse.text();
      console.error('[Offer Lead] Brevo contact sync failed', {
        status: brevoResponse.status,
        body: details.slice(0, 1000),
      });

      return sendJson(response, 502, {
        error: 'Brevo contact sync failed',
        details: details.slice(0, 300),
      });
    }

    return sendJson(response, 200, { ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Offer Lead] Unexpected error', { message });

    return sendJson(response, 500, {
      error: 'Unexpected lead save error',
      details: message,
    });
  }
}
