import { request as httpsRequest } from 'node:https';

// Large binary transfers use native Node streams end to end. In particular, they
// must not go through fetch/Response wrappers which may tee or retain the body.
export const openDownloadStream = (url, options, request = httpsRequest) =>
  new Promise((resolve, reject) => {
    const upstream = request(url, { method: 'POST', ...options }, (response) => {
      upstream.setTimeout(0);
      resolve(response);
    });
    upstream.setTimeout(180_000, () => upstream.destroy(new Error('Dropbox nie rozpoczął przesyłania pliku.')));
    upstream.once('error', reject);
    upstream.end();
  });

export const readDownloadError = async (stream) => {
  const parts = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > 65_536) {
      stream.destroy();
      break;
    }
    parts.push(chunk);
  }
  const text = Buffer.concat(parts).toString('utf8');
  try { return JSON.parse(text).error_summary || text; } catch { return text; }
};
