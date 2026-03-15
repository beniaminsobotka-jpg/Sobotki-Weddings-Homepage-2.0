const BREVO_API_URL = 'https://api.brevo.com/v3/contacts';

const LIST_IDS = {
  weddings_main: 4,
  portraits_wedding: 5,
  portraits_event: 6,
};

const sendJson = (response, status, body) => {
  response.status(status).setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    return sendJson(response, 500, { error: 'Brevo API key is not configured' });
  }

  let parsedBody;

  try {
    parsedBody =
      typeof request.body === 'string'
        ? JSON.parse(request.body)
        : request.body ?? {};
  } catch {
    return sendJson(response, 400, { error: 'Invalid JSON body' });
  }

  const { email, formType } = parsedBody;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const listId = LIST_IDS[formType];

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return sendJson(response, 400, { error: 'A valid email is required' });
  }

  if (!listId) {
    return sendJson(response, 400, { error: 'Unknown Brevo form type' });
  }

  try {
    const brevoResponse = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email: normalizedEmail,
        listIds: [listId],
        updateEnabled: true,
      }),
    });

    if (!brevoResponse.ok) {
      const details = await brevoResponse.text();

      return sendJson(response, 502, {
        error: 'Brevo request failed',
        details: details.slice(0, 500),
      });
    }

    return sendJson(response, 200, { ok: true });
  } catch (error) {
    return sendJson(response, 500, {
      error: 'Unexpected Brevo error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
