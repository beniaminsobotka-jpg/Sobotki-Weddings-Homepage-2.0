export type BrevoFormType =
  | 'weddings_main'
  | 'portraits_wedding'
  | 'portraits_event';

type BrevoSubscribeInput = {
  email: string;
  formType: BrevoFormType;
};

export const subscribeToBrevo = async ({
  email,
  formType,
}: BrevoSubscribeInput) => {
  const response = await fetch('/api/brevo-subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      email,
      formType,
    }),
  });

  if (!response.ok) {
    throw new Error(`Brevo subscribe failed with status ${response.status}`);
  }
};
