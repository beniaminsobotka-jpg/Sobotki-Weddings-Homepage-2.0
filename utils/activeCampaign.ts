const ACTIVE_CAMPAIGN_TARGET = 'ac-hidden-submit-target';

const ensureSubmitTarget = () => {
  let iframe = document.getElementById(ACTIVE_CAMPAIGN_TARGET) as HTMLIFrameElement | null;

  if (iframe) {
    return iframe;
  }

  iframe = document.createElement('iframe');
  iframe.id = ACTIVE_CAMPAIGN_TARGET;
  iframe.name = ACTIVE_CAMPAIGN_TARGET;
  iframe.hidden = true;
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  return iframe;
};

export const submitToActiveCampaign = (
  url: string,
  fields: Record<string, string>
) => {
  ensureSubmitTarget();

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;
  form.target = ACTIVE_CAMPAIGN_TARGET;
  form.hidden = true;

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  form.remove();
};
