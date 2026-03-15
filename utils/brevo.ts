export type BrevoFormType =
  | 'weddings'
  | 'portraits_wedding'
  | 'portraits_booth';

type BrevoLeadInput = {
  formType: BrevoFormType;
  email: string;
  fullName: string;
  phone?: string;
  weddingDate?: string;
  venue?: string;
  serviceType: string;
  message?: string;
  company?: string;
  guestCount?: string;
};

const buildReadableError = async (response: Response) => {
  try {
    const data = await response.json();
    if (data?.error && data?.details) {
      return `${data.error}: ${data.details}`;
    }
    if (data?.error) {
      return data.error;
    }
  } catch {
    // Ignore JSON parsing failures and use the fallback below.
  }

  return `Lead submit failed with status ${response.status}`;
};

export const subscribeToBrevo = async (payload: BrevoLeadInput) => {
  const response = await fetch('/api/lead', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await buildReadableError(response));
  }
};
