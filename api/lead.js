const BREVO_CONTACTS_API_URL = 'https://api.brevo.com/v3/contacts';
const BREVO_SMTP_API_URL = 'https://api.brevo.com/v3/smtp/email';

const FORM_TYPE_TO_LIST_ENV = {
  weddings: 'BREVO_LIST_ID_WEDDINGS',
  portraits_wedding: 'BREVO_LIST_ID_PORTRAITS_WEDDING',
  portraits_booth: 'BREVO_LIST_ID_PORTRAITS_BOOTH',
};

const PORTRAITS_WEDDING_SOURCES = new Set([
  'Instagram',
  'Reklama na Instagramie',
  'TikTok',
  'Polecenie od znajomych',
  'Strona WWW',
  'Inne',
]);

const sendJson = (response, status, body) => {
  response.status(status).setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

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

const buildInternalRows = (entries) =>
  entries
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 14px; border:1px solid #e5e5e5; font-family:Arial, Helvetica, sans-serif; font-size:12px; font-weight:700; color:#1a1a1a; width:180px; vertical-align:top;">
            ${escapeHtml(label)}
          </td>
          <td style="padding:10px 14px; border:1px solid #e5e5e5; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:22px; color:#333333; vertical-align:top;">
            ${escapeHtml(value || '-')}
          </td>
        </tr>
      `
    )
    .join('');

const buildInternalHtml = (leadData) => `
  <!doctype html>
  <html>
    <body style="margin:0; padding:24px; background:#f3f2ed;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:720px; margin:0 auto; background:#ffffff; border:1px solid #e5e5e5; border-radius:16px; overflow:hidden;">
        <tr>
          <td style="padding:24px 28px; background:#1a1a1a;">
            <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; letter-spacing:0.24em; text-transform:uppercase; color:#bcbcbc;">ZAPYTANIE OFERTOWE</div>
            <div style="margin-top:8px; font-family:Arial, Helvetica, sans-serif; font-size:28px; line-height:32px; font-weight:700; color:#ffffff;">
              ${escapeHtml(leadData.serviceType)}
            </div>
            <div style="margin-top:6px; font-family:Georgia, serif; font-size:20px; line-height:26px; font-style:italic; color:#d42929;">
              ${escapeHtml(leadData.fullName)}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
              ${buildInternalRows([
                ['formType', leadData.formType],
                ['FULLNAME', leadData.fullName],
                ['FIRSTNAME', leadData.firstName],
                ['LASTNAME', leadData.lastName],
                ['email', leadData.email],
                ['phone', leadData.phone],
                ['weddingDate', leadData.weddingDate],
                ['venue', leadData.venue],
                ['serviceType', leadData.serviceType],
                ['guestCount', leadData.guestCount],
                ['company', leadData.company],
                ['Skąd dowiedział się o nas', leadData.source],
                ['message', leadData.message],
                ['listId', String(leadData.listId)],
              ])}
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;

const buildInternalText = (leadData) => [
  'ZAPYTANIE OFERTOWE',
  '',
  `formType: ${leadData.formType}`,
  `FULLNAME: ${leadData.fullName}`,
  `FIRSTNAME: ${leadData.firstName}`,
  `LASTNAME: ${leadData.lastName}`,
  `email: ${leadData.email}`,
  `phone: ${leadData.phone || '-'}`,
  `weddingDate: ${leadData.weddingDate || '-'}`,
  `venue: ${leadData.venue || '-'}`,
  `serviceType: ${leadData.serviceType}`,
  `guestCount: ${leadData.guestCount || '-'}`,
  `company: ${leadData.company || '-'}`,
  `Skąd dowiedział się o nas: ${leadData.source || '-'}`,
  `message: ${leadData.message || '-'}`,
  `listId: ${leadData.listId}`,
].join('\n');

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const notifyToEmail = 'kontakt@sobotkiweddings.pl';
  const notifyFromEmail = 'kontakt@sobotkiweddings.pl';
  const notifyFromName = process.env.BREVO_NOTIFY_FROM_NAME || 'Sobotki Weddings';

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
  const source = normalizeString(parsedBody.source);

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

  if (formType === 'portraits_wedding' && !PORTRAITS_WEDDING_SOURCES.has(source)) {
    return sendJson(response, 400, { error: 'A valid source is required' });
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
      MESSAGE: source ? `[Skąd dowiedział się o nas: ${source}]\n\n${message}` : message,
      ...(company ? { COMPANY: company } : {}),
      ...(guestCount ? { GUEST_COUNT: guestCount } : {}),
    },
    listIds: [listId],
    updateEnabled: true,
  };

  try {
    const brevoResponse = await fetch(BREVO_CONTACTS_API_URL, {
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

    if (notifyToEmail && notifyFromEmail && notifyFromName) {
      const internalSubject = `🔴 Zapytanie o ofertę | ${serviceType} | ${fullName} | ${normalizedEmail}`;
      const internalLeadData = {
        formType,
        fullName,
        firstName,
        lastName,
        email: normalizedEmail,
        phone,
        weddingDate,
        venue,
        serviceType,
        guestCount,
        company,
        source,
        message,
        listId,
      };

      try {
        const internalResponse = await fetch(BREVO_SMTP_API_URL, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': apiKey,
          },
          body: JSON.stringify({
            sender: {
              email: notifyFromEmail,
              name: notifyFromName,
            },
            to: [
              {
                email: notifyToEmail,
              },
            ],
            replyTo: {
              email: normalizedEmail,
              name: fullName,
            },
            subject: internalSubject,
            htmlContent: buildInternalHtml(internalLeadData),
            textContent: buildInternalText(internalLeadData),
          }),
        });

        if (!internalResponse.ok) {
          const internalErrorBody = await internalResponse.text();

          console.error('[Brevo] Internal notify failed', {
            formType,
            listId,
            emailDomain: getEmailDomain(normalizedEmail),
            status: internalResponse.status,
            body: internalErrorBody.slice(0, 1000),
          });
        } else {
          console.info('[Brevo] Internal notify sent', {
            formType,
            listId,
            emailDomain: getEmailDomain(normalizedEmail),
            notifyToEmail,
          });
        }
      } catch (error) {
        console.error('[Brevo] Internal notify failed', {
          formType,
          listId,
          emailDomain: getEmailDomain(normalizedEmail),
          message: error instanceof Error ? error.message : 'Unknown internal notify error',
        });
      }
    } else {
      console.warn('[Brevo] Internal notify skipped', {
        reason: 'Missing notify env configuration',
        hasNotifyToEmail: Boolean(notifyToEmail),
        hasNotifyFromEmail: Boolean(notifyFromEmail),
        hasNotifyFromName: Boolean(notifyFromName),
      });
    }

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
