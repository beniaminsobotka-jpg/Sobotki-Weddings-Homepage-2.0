const BREVO_CONTACTS_API_URL = 'https://api.brevo.com/v3/contacts';
const BREVO_EVENTS_API_URL = 'https://api.brevo.com/v3/events';
const BREVO_SMTP_API_URL = 'https://api.brevo.com/v3/smtp/email';

const ALLOWED_EVENTS = new Set([
  'oferta_obejrzana',
  'zapytanie_o_termin',
  'odrzucenie',
]);

const REJECTION_REASONS = new Set([
  'za drogo',
  'szukam innego stylu',
  'mam już fotografa',
  'termin mi nie pasuje',
  'tylko sprawdzam ceny',
  'inne',
]);

const INTERESTED_OFFERS = new Set([
  'Foto + Video - Full pakiet 12h',
  'Foto + Video - Przyjęcia 6h',
  'Foto Duo - reportaż foto',
  'Video - pakiet standardowy',
  'Fotostacja portretowa',
]);

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

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

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

const buildEventMessage = (lead) => [
  `Event: ${lead.eventName}`,
  `Source: ${lead.source || 'hidden_offer_2027_2028'}`,
  `Timestamp: ${lead.timestamp}`,
  `Event timestamp: ${lead.eventTimestamp}`,
  `Data ślubu: ${lead.weddingDate}`,
  `Miejsce / sala: ${lead.venue}`,
  lead.interestedOffers.length ? `Interesujące oferty: ${lead.interestedOffers.join(', ')}` : '',
  lead.inquiryMessage ? `Wiadomość: ${lead.inquiryMessage}` : '',
  lead.rejectionReason ? `Powód odrzucenia: ${lead.rejectionReason}` : '',
  lead.rejectionNote ? `Komentarz odrzucenia: ${lead.rejectionNote}` : '',
]
  .filter(Boolean)
  .join('\n');

const buildInquiryText = (lead) => [
  'ZAPYTANIE O TERMIN - ukryta oferta 2027/2028',
  '',
  `Imię: ${lead.name}`,
  `E-mail: ${lead.email}`,
  `Data ślubu: ${lead.weddingDate}`,
  `Miejsce / sala: ${lead.venue}`,
  `Interesujące oferty: ${lead.interestedOffers.join(', ')}`,
  `Wiadomość: ${lead.inquiryMessage || '-'}`,
  `Timestamp formularza: ${lead.timestamp}`,
  `Timestamp eventu: ${lead.eventTimestamp}`,
].join('\n');

const buildInquiryHtml = (lead) => `
  <!doctype html>
  <html>
    <body style="margin:0; padding:24px; background:#f3f2ed;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:720px; margin:0 auto; background:#ffffff; border:1px solid #e5e5e5; border-radius:16px; overflow:hidden;">
        <tr>
          <td style="padding:24px 28px; background:#1a1a1a;">
            <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; letter-spacing:0.24em; text-transform:uppercase; color:#bcbcbc;">ZAPYTANIE O TERMIN</div>
            <div style="margin-top:8px; font-family:Arial, Helvetica, sans-serif; font-size:28px; line-height:32px; font-weight:700; color:#ffffff;">
              Ukryta oferta 2027/2028
            </div>
            <div style="margin-top:6px; font-family:Georgia, serif; font-size:20px; line-height:26px; font-style:italic; color:#d42929;">
              ${escapeHtml(lead.name)}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
              ${[
                ['Imię', lead.name],
                ['E-mail', lead.email],
                ['Data ślubu', lead.weddingDate],
                ['Miejsce / sala', lead.venue],
                ['Interesujące oferty', lead.interestedOffers.join(', ')],
                ['Wiadomość', lead.inquiryMessage],
                ['Timestamp formularza', lead.timestamp],
                ['Timestamp eventu', lead.eventTimestamp],
              ]
                .map(
                  ([label, value]) => `
                    <tr>
                      <td style="padding:10px 14px; border:1px solid #e5e5e5; font-family:Arial, Helvetica, sans-serif; font-size:12px; font-weight:700; color:#1a1a1a; width:180px; vertical-align:top;">${escapeHtml(label)}</td>
                      <td style="padding:10px 14px; border:1px solid #e5e5e5; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:22px; color:#333333; vertical-align:top;">${escapeHtml(value || '-')}</td>
                    </tr>
                  `
                )
                .join('')}
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;

const syncContactToBrevo = async ({ apiKey, listId, lead, firstName, lastName }) => {
  if (!Number.isInteger(listId) || listId <= 0) {
    return { skipped: true, reason: 'BREVO_LIST_ID_OFFER is not configured' };
  }

  const brevoPayload = {
    email: lead.email,
    attributes: {
      FULLNAME: lead.name,
      FIRSTNAME: firstName,
      LASTNAME: lastName,
      WEDDING_DATE: lead.weddingDate,
      VENUE: lead.venue,
      MESSAGE: buildEventMessage(lead),
    },
    listIds: [listId],
    updateEnabled: true,
  };

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
    throw new Error(`Brevo contact sync failed: ${details.slice(0, 300)}`);
  }

  return { ok: true };
};

const trackBrevoEvent = async ({ apiKey, lead, firstName, lastName }) => {
  const eventPayload = {
    event_name: lead.eventName,
    event_date: lead.eventTimestamp,
    identifiers: {
      email_id: lead.email,
    },
    contact_properties: {
      FIRSTNAME: firstName,
      LASTNAME: lastName,
      FULLNAME: lead.name,
    },
    event_properties: {
      source: lead.source || 'hidden_offer_2027_2028',
      weddingDate: lead.weddingDate,
      venue: lead.venue,
      timestamp: lead.timestamp,
      interestedOffers: lead.interestedOffers.join(', '),
      inquiryMessage: lead.inquiryMessage || '',
      rejectionReason: lead.rejectionReason || '',
      rejectionNote: lead.rejectionNote || '',
    },
  };

  const eventResponse = await fetch(BREVO_EVENTS_API_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(eventPayload),
  });

  if (!eventResponse.ok) {
    const details = await eventResponse.text();
    throw new Error(`Brevo event tracking failed: ${details.slice(0, 300)}`);
  }

  return { ok: true };
};

const sendInquiryNotification = async ({ apiKey, lead }) => {
  const notifyToEmail =
    process.env.BREVO_OFFER_NOTIFY_TO_EMAIL || 'kontakt.sobotki@gmail.com';
  const notifyFromEmail = process.env.BREVO_NOTIFY_FROM_EMAIL;
  const notifyFromName = process.env.BREVO_NOTIFY_FROM_NAME || 'Sobotki Weddings';

  if (!notifyToEmail) {
    throw new Error('BREVO_OFFER_NOTIFY_TO_EMAIL is not configured');
  }

  if (!notifyFromEmail) {
    throw new Error('BREVO_NOTIFY_FROM_EMAIL is not configured');
  }

  if (!notifyFromName) {
    throw new Error('BREVO_NOTIFY_FROM_NAME is not configured');
  }

  const notificationResponse = await fetch(BREVO_SMTP_API_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
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
        email: lead.email,
        name: lead.name,
      },
      subject: `[ZAPYTANIE O TERMIN] ${lead.name} | ${lead.weddingDate} | ${lead.venue}`,
      htmlContent: buildInquiryHtml(lead),
      textContent: buildInquiryText(lead),
    }),
  });

  if (!notificationResponse.ok) {
    const details = await notificationResponse.text();
    throw new Error(`Inquiry notification failed: ${details.slice(0, 300)}`);
  }

  return { ok: true };
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

  const lead = {
    eventName: normalizeString(parsedBody.eventName),
    name: normalizeString(parsedBody.name),
    email: normalizeString(parsedBody.email).toLowerCase(),
    weddingDate: normalizeString(parsedBody.weddingDate),
    venue: normalizeString(parsedBody.venue),
    timestamp: normalizeString(parsedBody.timestamp) || new Date().toISOString(),
    eventTimestamp: normalizeString(parsedBody.eventTimestamp) || new Date().toISOString(),
    source: normalizeString(parsedBody.source) || 'hidden_offer_2027_2028',
    interestedOffers: Array.isArray(parsedBody.interestedOffers)
      ? parsedBody.interestedOffers.map(normalizeString).filter(Boolean)
      : [],
    inquiryMessage: normalizeString(parsedBody.inquiryMessage),
    rejectionReason: normalizeString(parsedBody.rejectionReason),
    rejectionNote: normalizeString(parsedBody.rejectionNote),
  };

  if (!ALLOWED_EVENTS.has(lead.eventName)) {
    return sendJson(response, 400, { error: 'Unknown eventName' });
  }

  if (!lead.name) {
    return sendJson(response, 400, { error: 'name is required' });
  }

  if (!lead.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return sendJson(response, 400, { error: 'A valid email is required' });
  }

  if (!lead.weddingDate) {
    return sendJson(response, 400, { error: 'weddingDate is required' });
  }

  if (!lead.venue) {
    return sendJson(response, 400, { error: 'venue is required' });
  }

  if (lead.eventName === 'odrzucenie' && !REJECTION_REASONS.has(lead.rejectionReason)) {
    return sendJson(response, 400, { error: 'A valid rejectionReason is required' });
  }

  if (lead.eventName === 'zapytanie_o_termin') {
    if (
      lead.interestedOffers.length === 0 ||
      lead.interestedOffers.some((offer) => !INTERESTED_OFFERS.has(offer))
    ) {
      return sendJson(response, 400, { error: 'At least one valid interested offer is required' });
    }
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID_OFFER);
  const warnings = [];

  if (!apiKey) {
    warnings.push('BREVO_API_KEY is not configured');
    if (lead.eventName === 'zapytanie_o_termin') {
      return sendJson(response, 500, {
        error: 'Inquiry notification failed',
        details: 'BREVO_API_KEY is not configured',
        warnings,
      });
    }

    return sendJson(response, 200, { ok: true, skipped: true, warnings });
  }

  const { firstName, lastName } = splitName(lead.name);

  try {
    const contactResult = await syncContactToBrevo({
      apiKey,
      listId,
      lead,
      firstName,
      lastName,
    });

    if (contactResult.skipped) {
      warnings.push(contactResult.reason);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown contact sync error';
    console.error('[Offer Lead] Contact sync failed', { eventName: lead.eventName, message });
    warnings.push(message);
  }

  try {
    await trackBrevoEvent({ apiKey, lead, firstName, lastName });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown event tracking error';
    console.error('[Offer Lead] Event tracking failed', { eventName: lead.eventName, message });
    warnings.push(message);
  }

  if (lead.eventName === 'zapytanie_o_termin') {
    try {
      await sendInquiryNotification({ apiKey, lead });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown notification error';
      console.error('[Offer Lead] Inquiry notification failed', { message });

      return sendJson(response, 502, {
        error: 'Inquiry notification failed',
        details: message,
        warnings,
      });
    }
  }

  return sendJson(response, 200, {
    ok: true,
    eventName: lead.eventName,
    warnings,
  });
}
