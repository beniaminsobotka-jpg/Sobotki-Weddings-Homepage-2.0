const BREVO_API_URL = 'https://api.brevo.com/v3/contacts';

const FORM_TYPE_TO_LIST_ENV = {
  weddings: 'BREVO_LIST_ID_WEDDINGS',
  portraits_wedding: 'BREVO_LIST_ID_PORTRAITS_WEDDING',
  portraits_booth: 'BREVO_LIST_ID_PORTRAITS_BOOTH',
};

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

const getEmailDomain = (email) => {
  const [, domain = 'unknown'] = email.split('@');
  return domain;
};

const splitName = (fullName) => {
  const normalizedFullName = normalizeString(fullName);

  if (!normalizedFullName) {
    return { firstName: '', lastName: '' };
  }

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

  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    return sendJson(response, 500, { error: 'Brevo API key is not configured' });
  }

  let parsedBody;

  try {
    parsedBody = parseJsonBody(request.body);
  } catch {
    return sendJson(response, 400, { error: 'Invalid JSON body' });
  }

  const formType = normalizeString(parsedBody.formType);
  const normalizedEmail = normalizeString(parsedBody.email).toLowerCase();
  const fullName = normalizeString(parsedBody.fullName);
  const phone = normalizeString(parsedBody.phone);
  const weddingDate = normalizeString(parsedBody.weddingDate);
  const venue = normalizeString(parsedBody.venue);
  const serviceType = normalizeString(parsedBody.serviceType);
  const message = normalizeString(parsedBody.message);
  const company = normalizeString(parsedBody.company);
  const guestCount = normalizeString(parsedBody.guestCount);

  if (!formType) {
    return sendJson(response, 400, { error: 'formType is required' });
  }

  const listEnvName = FORM_TYPE_TO_LIST_ENV[formType];

  if (!listEnvName) {
    return sendJson(response, 400, { error: 'Unknown formType' });
  }

  const listId = Number(process.env[listEnvName]);

  if (!Number.isInteger(listId) || listId <= 0) {
    return sendJson(response, 500, {
      error: `Brevo list ID is not configured for ${formType}`,
    });
  }

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return sendJson(response, 400, { error: 'A valid email is required' });
  }

  if (!fullName) {
    return sendJson(response, 400, { error: 'fullName is required' });
  }

  if (!serviceType) {
    return sendJson(response, 400, { error: 'serviceType is required' });
  }

  const { firstName, lastName } = splitName(fullName);

  const brevoPayload = {
    email: normalizedEmail,
    attributes: {
      FULLNAME: fullName,
      FIRSTNAME: firstName,
      LASTNAME: lastName,
      PHONE: phone,
      WEDDING_DATE: weddingDate,
      VENUE: venue,
      SERVICE_TYPE: serviceType,
      MESSAGE: message,
      ...(company ? { COMPANY: company } : {}),
      ...(guestCount ? { GUEST_COUNT: guestCount } : {}),
    },
    listIds: [listId],
    updateEnabled: true,
  };

  try {
    const brevoResponse = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(brevoPayload),
    });

    if (!brevoResponse.ok) {
      const errorBody = await brevoResponse.text();

      console.error('[Brevo] Contact sync failed', {
        formType,
        listId,
        emailDomain: getEmailDomain(normalizedEmail),
        status: brevoResponse.status,
        body: errorBody.slice(0, 1000),
      });

      return sendJson(response, 502, {
        error: 'Brevo contact sync failed',
        details: errorBody.slice(0, 300),
      });
    }

    console.info('[Brevo] Contact synced', {
      formType,
      listId,
      emailDomain: getEmailDomain(normalizedEmail),
      hasFirstName: Boolean(firstName),
      hasLastName: Boolean(lastName),
    });

    return sendJson(response, 200, { ok: true });
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : 'Unknown Brevo error';

    console.error('[Brevo] Unexpected sync error', {
      formType,
      listId,
      emailDomain: getEmailDomain(normalizedEmail),
      message: messageText,
    });

    return sendJson(response, 500, {
      error: 'Unexpected Brevo error',
      details: messageText,
    });
  }
}
